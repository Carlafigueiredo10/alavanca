import type { ChatMessage } from './history/truncate';
import type { Provider } from '../server/log';
import type { JoMode } from './prompts';
import { streamGemini, completeGemini, friendlyGeminiError } from './providers/gemini';
import { streamDeepSeek, completeDeepSeek, friendlyDeepSeekError } from './providers/deepseek';

export interface ProviderAdapter {
  key: Provider;
  stream: (
    history: ChatMessage[],
    userMessage: string,
    systemPrompt: string,
    parentSignal?: AbortSignal
  ) => Promise<ReadableStream<string>>;
  complete: (
    history: ChatMessage[],
    userMessage: string,
    systemPrompt: string,
    parentSignal?: AbortSignal
  ) => Promise<string>;
  friendly: string;
}

export function getProviderForMode(mode: JoMode): ProviderAdapter {
  if (mode === 'possibilidades') {
    return {
      key: 'deepseek',
      stream: streamDeepSeek,
      complete: completeDeepSeek,
      friendly: friendlyDeepSeekError,
    };
  }
  if (mode === 'estruturar') {
    // Modo Blueprint: conhecimento curado no system prompt, sem grounding.
    // Google Search aqui só introduziria ruído num plano metodológico fechado.
    return {
      key: 'gemini',
      stream: (h, u, s, p) => streamGemini(h, u, s, p, { enableGrounding: false }),
      complete: (h, u, s, p) => completeGemini(h, u, s, p, { enableGrounding: false }),
      friendly: friendlyGeminiError,
    };
  }
  return {
    key: 'gemini',
    stream: streamGemini,
    complete: completeGemini,
    friendly: friendlyGeminiError,
  };
}
