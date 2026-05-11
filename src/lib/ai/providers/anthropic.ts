/**
 * Provider Anthropic (Claude).
 *
 * Uso primário: módulo Adequa (assistente de linguagem).
 *
 * API estável:
 *   - completeStructured<T>(system, user, tool, schema): chamada single-shot que retorna JSON
 *     validado via tool use. Mais robusto que prompt "responda JSON".
 *   - System prompt vai com cache_control: ephemeral — base normativa não paga toda chamada.
 */

import Anthropic from '@anthropic-ai/sdk';
import { isRetriable, timeoutController } from './shared';

export const TIMEOUT_ANTHROPIC_MS = 60_000;
export const ANTHROPIC_MODEL = 'claude-sonnet-4-6';

const FRIENDLY_ANTHROPIC_ERROR =
  'O serviço de adequação de linguagem está indisponível agora. Tente novamente em instantes.';

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = import.meta.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY ausente');
  _client = new Anthropic({ apiKey });
  return _client;
}

export type StructuredCall = {
  systemPrompt: string;
  userPrompt: string;
  tool: {
    name: string;
    description: string;
    input_schema: Record<string, unknown>;
  };
  maxTokens?: number;
};

export type StructuredResult<T> = {
  data: T;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
  model: string;
};

/**
 * Single-shot com saída JSON via tool use.
 * Retry 1x para erros retriáveis (5xx, timeout). Erros 4xx falham na primeira.
 */
export async function completeStructured<T>(
  call: StructuredCall,
  parentSignal?: AbortSignal,
): Promise<StructuredResult<T>> {
  const client = getClient();
  let lastErr: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = timeoutController(TIMEOUT_ANTHROPIC_MS, parentSignal);
    try {
      const message = await client.messages.create(
        {
          model: ANTHROPIC_MODEL,
          max_tokens: call.maxTokens ?? 8192,
          system: [
            {
              type: 'text',
              text: call.systemPrompt,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [{ role: 'user', content: call.userPrompt }],
          tools: [
            {
              name: call.tool.name,
              description: call.tool.description,
              input_schema: call.tool.input_schema as Anthropic.Tool.InputSchema,
            },
          ],
          tool_choice: { type: 'tool', name: call.tool.name },
        },
        { signal: ctrl.signal },
      );

      const toolBlock = message.content.find((b) => b.type === 'tool_use');
      if (!toolBlock || toolBlock.type !== 'tool_use') {
        throw new Error('anthropic_no_tool_use');
      }

      return {
        data: toolBlock.input as T,
        usage: {
          input_tokens: message.usage.input_tokens,
          output_tokens: message.usage.output_tokens,
          cache_creation_input_tokens: message.usage.cache_creation_input_tokens ?? undefined,
          cache_read_input_tokens: message.usage.cache_read_input_tokens ?? undefined,
        },
        model: message.model,
      };
    } catch (err) {
      lastErr = err;
      ctrl.abort();
      if (!isRetriable(err) || attempt === 1) break;
    }
  }
  throw lastErr ?? new Error('anthropic_failed');
}

/**
 * Vision call — Fase 1 (fallback OCR para PDF escaneado / imagem).
 */
export async function completeVision<T>(
  _call: StructuredCall & {
    attachment: { mediaType: 'image/png' | 'image/jpeg' | 'application/pdf'; data: ArrayBuffer };
  },
  _parentSignal?: AbortSignal,
): Promise<StructuredResult<T>> {
  getClient();
  throw new Error('TODO Fase 1: implementar completeVision (Claude Vision para OCR fallback)');
}

export const friendlyAnthropicError = FRIENDLY_ANTHROPIC_ERROR;
