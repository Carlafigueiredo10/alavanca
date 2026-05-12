import type { ChatMessage } from './history/truncate';
import type { Provider } from '../server/log';
import type { JoMode } from './prompts';
import { streamGemini, completeGemini, friendlyGeminiError } from './providers/gemini';
import { streamDeepSeek, completeDeepSeek, friendlyDeepSeekError } from './providers/deepseek';

// Options propagadas pelo orchestrator pros providers concretos. Hoje só
// `structuredJson` (Gemini Structured Outputs / response_mime_type). Quando
// outros providers ganharem flags equivalentes, adicionar aqui.
export interface AdapterCallOptions {
  structuredJson?: boolean;
}

export interface ProviderAdapter {
  key: Provider;
  stream: (
    history: ChatMessage[],
    userMessage: string,
    systemPrompt: string,
    parentSignal?: AbortSignal,
    options?: AdapterCallOptions
  ) => Promise<ReadableStream<string>>;
  complete: (
    history: ChatMessage[],
    userMessage: string,
    systemPrompt: string,
    parentSignal?: AbortSignal,
    options?: AdapterCallOptions
  ) => Promise<string>;
  friendly: string;
}

// Modos com conhecimento curado no system prompt — Google Search só introduziria
// ruído numa peça metodológica/normativa fechada.
const CURATED_MODES = new Set<JoMode>([
  'mapear',
  'estruturar',
  'formalizar',
  'construir',
  'avaliar',
  'manter',
]);

export function getProviderForMode(mode: JoMode): ProviderAdapter {
  if (mode === 'possibilidades') {
    return {
      key: 'deepseek',
      stream: streamDeepSeek,
      complete: completeDeepSeek,
      friendly: friendlyDeepSeekError,
    };
  }
  if (CURATED_MODES.has(mode)) {
    return {
      key: 'gemini',
      stream: (h, u, s, p, opts) => streamGemini(h, u, s, p, {
        enableGrounding: false,
        structuredJson: opts?.structuredJson ?? false,
      }),
      complete: (h, u, s, p, opts) => completeGemini(h, u, s, p, {
        enableGrounding: false,
        structuredJson: opts?.structuredJson ?? false,
      }),
      friendly: friendlyGeminiError,
    };
  }
  return {
    key: 'gemini',
    stream: (h, u, s, p, opts) => streamGemini(h, u, s, p, {
      structuredJson: opts?.structuredJson ?? false,
    }),
    complete: (h, u, s, p, opts) => completeGemini(h, u, s, p, {
      structuredJson: opts?.structuredJson ?? false,
    }),
    friendly: friendlyGeminiError,
  };
}
