import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ChatMessage } from '../history/truncate';
import { collectSources, formatSourcesFooter, type GroundingSource } from '../grounding/gemini';
import { isRetriable, withTimeout } from './shared';

export const TIMEOUT_GEMINI_MS = 15_000;
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
  // Structured Outputs do Gemini: força JSON válido na resposta. Conflita
  // com tools (Google Search) — quando true, grounding é forçado off.
  structuredJson?: boolean;
}

export async function streamGemini(
  history: ChatMessage[],
  userMessage: string,
  systemPrompt: string,
  _parentSignal?: AbortSignal,
  options: GeminiOptions = {}
): Promise<ReadableStream<string>> {
  const structuredJson = options.structuredJson ?? false;
  // Grounding default true; structuredJson força off (incompatível).
  const enableGrounding = !structuredJson && (options.enableGrounding ?? true);
  const model = getGemini().getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemPrompt,
    ...(structuredJson
      ? { generationConfig: { responseMimeType: 'application/json' } }
      : {}),
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
              const text = chunk.text();
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
    ...(structuredJson
      ? { generationConfig: { responseMimeType: 'application/json' } }
      : {}),
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
      return result.response.text() + formatSourcesFooter(sources);
    } catch (err) {
      lastErr = err;
      if (!isRetriable(err) || attempt === 1) break;
    }
  }
  throw lastErr ?? new Error('gemini_failed');
}

export const friendlyGeminiError = FRIENDLY_GEMINI_ERROR;
