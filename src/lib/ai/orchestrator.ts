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
  return {
    key: 'gemini',
    stream: streamGemini,
    complete: completeGemini,
    friendly: friendlyGeminiError,
  };
}
