import type { APIRoute } from 'astro';
import { buildSystemPrompt, type JoMode } from '../../../lib/ai/prompts';
import { truncateByChars, type ChatMessage } from '../../../lib/ai/history/truncate';
import { getProviderForMode } from '../../../lib/ai/orchestrator';
import { logEvent, safeErrorMessage, type Provider } from '../../../lib/server/log';

export const prerender = false;

const MAX_MESSAGE_CHARS = 4000;
const MAX_HISTORY_MESSAGES = 40;

const VALID_MODES = new Set<JoMode>([
  'decisao',
  'possibilidades',
  'mapear',
  'estruturar',
  'formalizar',
  'construir',
  'avaliar',
  'provar',
]);

interface OpenChatBody {
  messages?: unknown;
  message?: string;
  mode?: string;
  hookId?: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function sseChunk(text: string): string {
  return `data: ${JSON.stringify({ type: 'chunk', text })}\n\n`;
}
function sseDone(is_partial: boolean): string {
  return `data: ${JSON.stringify({ type: 'done', is_partial })}\n\n`;
}
function sseError(message: string): string {
  return `data: ${JSON.stringify({ type: 'error', message })}\n\n`;
}

function parseHistory(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m): m is { role: string; content: string } =>
      m !== null &&
      typeof m === 'object' &&
      typeof (m as { role?: unknown }).role === 'string' &&
      typeof (m as { content?: unknown }).content === 'string'
    )
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
}

export const POST: APIRoute = async ({ request }) => {
  const requestId = crypto.randomUUID();
  const route = '/api/jo/chat-open';
  const startedAt = Date.now();

  let body: OpenChatBody;
  try {
    body = (await request.json()) as OpenChatBody;
  } catch {
    return jsonResponse({ error: 'JSON inválido' }, 400);
  }

  const messageRaw = typeof body.message === 'string' ? body.message : '';
  if (!messageRaw.trim()) return jsonResponse({ error: 'mensagem vazia' }, 400);
  if (messageRaw.length > MAX_MESSAGE_CHARS) {
    return jsonResponse(
      { error: `Mensagem longa demais. Limite de ${MAX_MESSAGE_CHARS} caracteres.` },
      400
    );
  }

  const mode: JoMode =
    typeof body.mode === 'string' && VALID_MODES.has(body.mode as JoMode)
      ? (body.mode as JoMode)
      : 'decisao';
  const hookId = typeof body.hookId === 'string' && body.hookId.length > 0 ? body.hookId : null;

  const history = parseHistory(body.messages);
  const trimmed = truncateByChars(history);
  const systemPrompt = buildSystemPrompt(mode, hookId);

  const adapter = getProviderForMode(mode);
  const provider: Provider = adapter.key;

  let stream: ReadableStream<string>;
  try {
    stream = await adapter.stream(trimmed, messageRaw, systemPrompt);
  } catch (initErr) {
    logEvent({
      request_id: requestId,
      route,
      provider,
      mode,
      duration_ms: Date.now() - startedAt,
      error: safeErrorMessage(initErr),
      event: 'stream_init_failed_falling_back',
    });

    let fullText: string;
    try {
      fullText = await adapter.complete(trimmed, messageRaw, systemPrompt);
    } catch (completeErr) {
      logEvent({
        request_id: requestId,
        route,
        provider,
        mode,
        duration_ms: Date.now() - startedAt,
        error: safeErrorMessage(completeErr),
        event: 'fallback_complete_failed',
      });
      return streamMessage(adapter.friendly, true);
    }
    return streamMessage(fullText, false);
  }

  const encoder = new TextEncoder();
  let streamErrored = false;

  const sseStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = stream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) controller.enqueue(encoder.encode(sseChunk(value)));
        }
        controller.enqueue(encoder.encode(sseDone(false)));
        controller.close();
      } catch (err) {
        streamErrored = true;
        try {
          controller.enqueue(encoder.encode(sseError(adapter.friendly)));
          controller.enqueue(encoder.encode(sseDone(true)));
        } catch {
          /* controller may already be closed */
        }
        controller.close();
        logEvent({
          request_id: requestId,
          route,
          provider,
          mode,
          duration_ms: Date.now() - startedAt,
          error: safeErrorMessage(err),
          is_partial: true,
          event: 'stream_mid_failure',
        });
      } finally {
        if (!streamErrored) {
          logEvent({
            request_id: requestId,
            route,
            provider,
            mode,
            duration_ms: Date.now() - startedAt,
            is_partial: false,
            event: 'stream_done',
          });
        }
      }
    },
  });

  return new Response(sseStream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
};

function streamMessage(text: string, isPartial: boolean): Response {
  const encoder = new TextEncoder();
  const out = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(sseChunk(text)));
      controller.enqueue(encoder.encode(sseDone(isPartial)));
      controller.close();
    },
  });
  return new Response(out, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
