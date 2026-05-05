import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import type { ChatMessage } from './history';
import { deepseekBreaker } from './breaker';

export const TIMEOUT_GEMINI_MS = 15_000;
export const TIMEOUT_DEEPSEEK_MS = 25_000;

const GEMINI_MODEL = 'gemini-2.5-flash';
const DEEPSEEK_MODEL = 'deepseek-chat';

const FRIENDLY_GEMINI_ERROR =
  'A Jô engasgou agora. Tenta de novo daqui a pouco — se persistir, me reformula a pergunta.';
const FRIENDLY_DEEPSEEK_ERROR =
  'A ampliação com referências externas falhou agora. Posso seguir pela base institucional — me diz se topa.';

function getGemini() {
  const key = import.meta.env.GOOGLE_API_KEY;
  if (!key) throw new Error('GOOGLE_API_KEY ausente');
  return new GoogleGenerativeAI(key);
}

function getDeepSeek() {
  const key = import.meta.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error('DEEPSEEK_API_KEY ausente');
  return new OpenAI({
    apiKey: key,
    baseURL: 'https://api.deepseek.com/v1',
  });
}

function isRetriable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : '';
  if (msg.includes('abort')) return false;
  if (msg.includes('401') || msg.includes('403')) return false;
  if (msg.includes('content') && msg.includes('polic')) return false;
  return true;
}

function timeoutController(ms: number, parent?: AbortSignal): AbortController {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new Error('timeout')), ms);
  if (parent) {
    if (parent.aborted) ctrl.abort();
    else parent.addEventListener('abort', () => ctrl.abort(), { once: true });
  }
  ctrl.signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
  return ctrl;
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label}_timeout`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// ---------- Gemini ----------

function geminiHistory(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

const GEMINI_TOOLS = [{ googleSearch: {} }] as any;

interface GroundingSource {
  uri: string;
  title?: string;
}

function collectSources(metadata: any, into: GroundingSource[]) {
  const chunks = metadata?.groundingChunks;
  if (!Array.isArray(chunks)) return;
  for (const c of chunks) {
    const uri = c?.web?.uri;
    if (!uri) continue;
    if (into.find((s) => s.uri === uri)) continue;
    into.push({ uri, title: c.web.title });
  }
}

function formatSourcesFooter(sources: GroundingSource[]): string {
  if (sources.length === 0) return '';
  const lines = sources.map(
    (s, i) => `${i + 1}. [${(s.title || s.uri).replace(/[\[\]]/g, '')}](${s.uri})`
  );
  return `\n\n---\n\n**Fontes** (busca web)\n\n${lines.join('\n')}\n`;
}

export async function streamGemini(
  history: ChatMessage[],
  userMessage: string,
  systemPrompt: string,
  _parentSignal?: AbortSignal
): Promise<ReadableStream<string>> {
  const model = getGemini().getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemPrompt,
    tools: GEMINI_TOOLS,
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
  _parentSignal?: AbortSignal
): Promise<string> {
  const model = getGemini().getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemPrompt,
    tools: GEMINI_TOOLS,
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

// ---------- DeepSeek ----------

function deepseekMessages(
  history: ChatMessage[],
  userMessage: string,
  systemPrompt: string
) {
  return [
    { role: 'system' as const, content: systemPrompt },
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: userMessage },
  ];
}

export async function streamDeepSeek(
  history: ChatMessage[],
  userMessage: string,
  systemPrompt: string,
  parentSignal?: AbortSignal
): Promise<ReadableStream<string>> {
  const client = getDeepSeek();
  const messages = deepseekMessages(history, userMessage, systemPrompt);

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = timeoutController(TIMEOUT_DEEPSEEK_MS, parentSignal);
    try {
      const completion = await client.chat.completions.create(
        { model: DEEPSEEK_MODEL, messages, stream: true },
        { signal: ctrl.signal }
      );
      return new ReadableStream<string>({
        async start(controller) {
          try {
            for await (const chunk of completion) {
              const delta = chunk.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(delta);
            }
            controller.close();
            deepseekBreaker.recordSuccess();
          } catch (e) {
            deepseekBreaker.recordFailure();
            controller.error(e);
          }
        },
      });
    } catch (err) {
      lastErr = err;
      ctrl.abort();
      if (!isRetriable(err) || attempt === 1) break;
    }
  }
  deepseekBreaker.recordFailure();
  throw lastErr ?? new Error('deepseek_failed');
}

export async function completeDeepSeek(
  history: ChatMessage[],
  userMessage: string,
  systemPrompt: string,
  parentSignal?: AbortSignal
): Promise<string> {
  const client = getDeepSeek();
  const messages = deepseekMessages(history, userMessage, systemPrompt);

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = timeoutController(TIMEOUT_DEEPSEEK_MS, parentSignal);
    try {
      const completion = await client.chat.completions.create(
        { model: DEEPSEEK_MODEL, messages, stream: false },
        { signal: ctrl.signal }
      );
      const text = completion.choices?.[0]?.message?.content ?? '';
      deepseekBreaker.recordSuccess();
      return text;
    } catch (err) {
      lastErr = err;
      ctrl.abort();
      if (!isRetriable(err) || attempt === 1) break;
    }
  }
  deepseekBreaker.recordFailure();
  throw lastErr ?? new Error('deepseek_failed');
}

export const friendlyDeepSeekError = FRIENDLY_DEEPSEEK_ERROR;
