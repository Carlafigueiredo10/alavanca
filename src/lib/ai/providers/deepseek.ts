import OpenAI from 'openai';
import type { ChatMessage } from '../history/truncate';
import { isRetriable, timeoutController } from './shared';

export const TIMEOUT_DEEPSEEK_MS = 25_000;
const DEEPSEEK_MODEL = 'deepseek-chat';

const FRIENDLY_DEEPSEEK_ERROR =
  'A ampliação com referências externas falhou agora. Posso seguir pela base institucional — me diz se topa.';

function getDeepSeek() {
  const key = import.meta.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error('DEEPSEEK_API_KEY ausente');
  return new OpenAI({
    apiKey: key,
    baseURL: 'https://api.deepseek.com/v1',
  });
}

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
          } catch (e) {
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
      return completion.choices?.[0]?.message?.content ?? '';
    } catch (err) {
      lastErr = err;
      ctrl.abort();
      if (!isRetriable(err) || attempt === 1) break;
    }
  }
  throw lastErr ?? new Error('deepseek_failed');
}

export const friendlyDeepSeekError = FRIENDLY_DEEPSEEK_ERROR;
