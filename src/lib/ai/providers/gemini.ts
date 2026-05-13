import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ChatMessage } from '../history/truncate';
import { collectSources, formatSourcesFooter, type GroundingSource } from '../grounding/gemini';
import { isRetriable, withTimeout } from './shared';

// 15s era apertado pra prompts longos com responseMimeType=json (modelo
// demora mais pra preparar a primeira resposta válida). 30s cobre o caso
// do Mapear com system prompt ~6k tokens + contrato JSON injetado.
export const TIMEOUT_GEMINI_MS = 30_000;
const GEMINI_MODEL = 'gemini-2.5-flash';

const FRIENDLY_GEMINI_ERROR =
  'A Jô engasgou agora. Tenta de novo daqui a pouco — se persistir, me reformula a pergunta.';

function getGemini() {
  const raw = import.meta.env.GOOGLE_API_KEY;
  if (!raw) throw new Error('GOOGLE_API_KEY ausente');
  // Sanitiza: às vezes a env var é colada com whitespace ou (pior) com
  // outra chave concatenada no mesmo campo. Pega só o primeiro token.
  // Detectado em produção 2026-05-12 — header inválido quebrava o SDK.
  const key = String(raw).trim().split(/[\s\n\r]/)[0];
  if (!key) throw new Error('GOOGLE_API_KEY inválida após sanitize');
  return new GoogleGenerativeAI(key);
}

function geminiHistory(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

const GEMINI_TOOLS = [{ googleSearch: {} }] as any;

export interface GeminiOptions {
  enableGrounding?: boolean;
  // Modo "JSON estruturado": desativa tools (Google Search) pra evitar
  // conflito. O contrato JSON vem via system prompt — responseMimeType=json
  // foi removido depois de causar TypeError no chunk.text() em prod
  // (chunks vazios quando o modelo bate em safety/schema mismatch).
  structuredJson?: boolean;
}

// Wrapper defensivo: o SDK do Gemini joga TypeError em chunk.text() quando
// o chunk vem sem candidates (safety filter, function call, finish_reason
// inesperado). Em vez de quebrar o stream inteiro, ignora o chunk.
// Loga o chunk completo (até 800 chars) pra investigar a causa real.
function safeChunkText(chunk: unknown, ctx: string): string {
  try {
    return (chunk as { text: () => string }).text() ?? '';
  } catch (err) {
    let chunkDump = 'nullish';
    try {
      chunkDump = chunk ? JSON.stringify(chunk).slice(0, 800) : 'nullish';
    } catch {
      chunkDump = '[unstringifiable]';
    }
    // eslint-disable-next-line no-console
    console.error(`[${ctx}] chunk.text() FAILED`, {
      err: err instanceof Error
        ? { name: err.name, message: err.message, stack: err.stack }
        : err,
      chunk: chunkDump,
    });
    return '';
  }
}

export async function streamGemini(
  history: ChatMessage[],
  userMessage: string,
  systemPrompt: string,
  _parentSignal?: AbortSignal,
  options: GeminiOptions = {}
): Promise<ReadableStream<string>> {
  const structuredJson = options.structuredJson ?? false;
  // Grounding default true; structuredJson força off (tools + JSON contract
  // confundem o modelo, gera saídas inconsistentes).
  const enableGrounding = !structuredJson && (options.enableGrounding ?? true);
  const model = getGemini().getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemPrompt,
    ...(enableGrounding ? { tools: GEMINI_TOOLS } : {}),
  });

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const chat = model.startChat({ history: geminiHistory(history) });
      const result = await withTimeout(
        chat.sendMessageStream(userMessage),
        TIMEOUT_GEMINI_MS,
        'gemini_init'
      );
      // Hard cap pro stream — Gemini às vezes não fecha (resposta pendurada
      // por causa de safety review server-side). 57s deixa ~3s pra parse +
      // persist antes do limite de 60s da Vercel Hobby (astro.config:10).
      // Parse + Supabase insert costuma ser <1s — folga apertada mas viável.
      // Subir aqui requer subir o maxDuration na config. Carla 2026-05-12.
      const STREAM_TIMEOUT_MS = 57_000;
      const streamAbort = new AbortController();
      const streamTimer = setTimeout(
        () => streamAbort.abort(new Error('gemini_stream_timeout_55s')),
        STREAM_TIMEOUT_MS,
      );
      let badChunks = 0;
      let chunkIdx = 0;
      const reqTag = `gemini ${Math.random().toString(36).slice(2, 8)}`;
      // eslint-disable-next-line no-console
      console.log(`[${reqTag}] stream started attempt=${attempt}`);
      return new ReadableStream<string>({
        async start(controller) {
          const sources: GroundingSource[] = [];
          try {
            for await (const chunk of result.stream) {
              if (streamAbort.signal.aborted) {
                throw streamAbort.signal.reason ?? new Error('aborted');
              }
              chunkIdx++;
              const text = safeChunkText(chunk, reqTag);
              if (text) {
                controller.enqueue(text);
                // eslint-disable-next-line no-console
                console.log(`[${reqTag}] chunk #${chunkIdx} len=${text.length} snippet=${JSON.stringify(text.slice(0, 80))}`);
              } else {
                badChunks++;
                // eslint-disable-next-line no-console
                console.warn(`[${reqTag}] chunk #${chunkIdx} EMPTY (badCount=${badChunks})`);
              }
              const meta = (chunk as any)?.candidates?.[0]?.groundingMetadata;
              if (meta) collectSources(meta, sources);
            }
            const footer = formatSourcesFooter(sources);
            if (footer) controller.enqueue(footer);
            // eslint-disable-next-line no-console
            console.log(`[${reqTag}] stream ended chunks=${chunkIdx} bad=${badChunks}`);
            controller.close();
          } catch (e) {
            // Log enriquecido pra pegar TypeError real (message/name/stack).
            // eslint-disable-next-line no-console
            console.error(`[${reqTag}] start caught after chunks=${chunkIdx} bad=${badChunks}`, {
              name: e instanceof Error ? e.name : typeof e,
              message: e instanceof Error ? e.message : String(e),
              stack: e instanceof Error ? e.stack : undefined,
            });
            controller.error(e);
          } finally {
            clearTimeout(streamTimer);
          }
        },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[gemini.streamGemini] init attempt failed:', {
        attempt,
        name: err instanceof Error ? err.name : typeof err,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      lastErr = err;
      if (!isRetriable(err) || attempt === 1) break;
    }
  }
  throw lastErr ?? new Error('gemini_failed');
}

export async function completeGemini(
  history: ChatMessage[],
  userMessage: string,
  systemPrompt: string,
  _parentSignal?: AbortSignal,
  options: GeminiOptions = {}
): Promise<string> {
  const structuredJson = options.structuredJson ?? false;
  const enableGrounding = !structuredJson && (options.enableGrounding ?? true);
  const model = getGemini().getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemPrompt,
    ...(enableGrounding ? { tools: GEMINI_TOOLS } : {}),
  });

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const chat = model.startChat({ history: geminiHistory(history) });
      const result = await withTimeout(
        chat.sendMessage(userMessage),
        TIMEOUT_GEMINI_MS,
        'gemini'
      );
      const sources: GroundingSource[] = [];
      const meta = (result.response as any)?.candidates?.[0]?.groundingMetadata;
      if (meta) collectSources(meta, sources);
      return safeChunkText(result.response, 'gemini.complete') + formatSourcesFooter(sources);
    } catch (err) {
      lastErr = err;
      if (!isRetriable(err) || attempt === 1) break;
    }
  }
  throw lastErr ?? new Error('gemini_failed');
}

export const friendlyGeminiError = FRIENDLY_GEMINI_ERROR;
