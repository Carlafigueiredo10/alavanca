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
  const key = import.meta.env.GOOGLE_API_KEY;
  if (!key) throw new Error('GOOGLE_API_KEY ausente');
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
function safeChunkText(chunk: unknown): string {
  try {
    return (chunk as { text: () => string }).text() ?? '';
  } catch {
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
      return new ReadableStream<string>({
        async start(controller) {
          const sources: GroundingSource[] = [];
          try {
            for await (const chunk of result.stream) {
              const text = safeChunkText(chunk);
              if (text) controller.enqueue(text);
              const meta = (chunk as any)?.candidates?.[0]?.groundingMetadata;
              if (meta) collectSources(meta, sources);
            }
            const footer = formatSourcesFooter(sources);
            if (footer) controller.enqueue(footer);
            controller.close();
          } catch (e) {
            controller.error(e);
          }
        },
      });
    } catch (err) {
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
      return safeChunkText(result.response) + formatSourcesFooter(sources);
    } catch (err) {
      lastErr = err;
      if (!isRetriable(err) || attempt === 1) break;
    }
  }
  throw lastErr ?? new Error('gemini_failed');
}

export const friendlyGeminiError = FRIENDLY_GEMINI_ERROR;
