import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { getPromptForMode, type JoMode } from '../../../lib/jo/prompts';
import { truncateByChars, type ChatMessage } from '../../../lib/jo/history';
import {
  streamGemini,
  streamDeepSeek,
  completeGemini,
  completeDeepSeek,
  friendlyGeminiError,
  friendlyDeepSeekError,
} from '../../../lib/jo/clients';
import { deepseekBreaker } from '../../../lib/jo/breaker';
import { logEvent, safeErrorMessage, type Provider } from '../../../lib/jo/log';

export const prerender = false;

const MAX_MESSAGE_CHARS = 4000;

const SHORT_CIRCUIT_MESSAGE =
  'A ampliação com referências externas está temporariamente indisponível. Posso seguir pela base institucional — mande sua dúvida sem o "ampliar" ativado.';

interface ChatBody {
  conversationId?: string;
  message?: string;
  mode?: string;
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

export const POST: APIRoute = async ({ request, cookies }) => {
  const requestId = crypto.randomUUID();
  const route = '/api/jo/chat';
  const startedAt = Date.now();

  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    logEvent({ request_id: requestId, route, error: 'invalid_json', event: 'parse_failed' });
    return jsonResponse({ error: 'JSON inválido' }, 400);
  }

  const supabase = createSupabaseServerClient(cookies);
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) {
    logEvent({ request_id: requestId, route, error: 'unauthenticated', event: 'auth_failed' });
    return jsonResponse({ error: 'unauthenticated', redirect: '/login' }, 401);
  }

  const userId = user.id;
  const conversationId = typeof body.conversationId === 'string' ? body.conversationId : '';
  const messageRaw = typeof body.message === 'string' ? body.message : '';

  if (!conversationId) {
    return jsonResponse({ error: 'conversationId é obrigatório' }, 400);
  }
  if (!messageRaw.trim()) {
    return jsonResponse({ error: 'mensagem vazia' }, 400);
  }
  if (messageRaw.length > MAX_MESSAGE_CHARS) {
    return jsonResponse(
      { error: `Mensagem longa demais. Limite de ${MAX_MESSAGE_CHARS} caracteres.` },
      400
    );
  }

  const mode: JoMode = body.mode === 'possibilidades' ? 'possibilidades' : 'decisao';
  const provider: Provider = mode === 'possibilidades' ? 'deepseek' : 'gemini';

  const { data: conv, error: convErr } = await supabase
    .from('conversations')
    .select('id, title')
    .eq('id', conversationId)
    .maybeSingle();

  if (convErr || !conv) {
    logEvent({
      request_id: requestId,
      route,
      user_id: userId,
      error: convErr?.message ?? 'conversation_not_found',
      event: 'conversation_lookup_failed',
    });
    return jsonResponse({ error: 'conversa não encontrada' }, 404);
  }

  const userInsert = await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: 'user',
    content: messageRaw,
    mode_used: mode,
    is_partial: false,
  });

  if (userInsert.error) {
    logEvent({
      request_id: requestId,
      route,
      user_id: userId,
      provider,
      mode,
      error: userInsert.error.message,
      event: 'persist_user_failed',
    });
    return jsonResponse({ error: 'falha ao salvar mensagem' }, 500);
  }

  if (!conv.title) {
    const title = messageRaw.slice(0, 80);
    await supabase
      .from('conversations')
      .update({ title })
      .eq('id', conversationId);
  }

  const { data: historyRows } = await supabase
    .from('messages')
    .select('role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  const allMessages: ChatMessage[] = (historyRows ?? [])
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  const lastUserIdx = (() => {
    for (let i = allMessages.length - 1; i >= 0; i--) {
      if (allMessages[i].role === 'user') return i;
    }
    return -1;
  })();

  const priorHistory = lastUserIdx >= 0 ? allMessages.slice(0, lastUserIdx) : allMessages;
  const trimmed = truncateByChars(priorHistory);

  const systemPrompt = getPromptForMode(mode);

  if (mode === 'possibilidades' && deepseekBreaker.shouldShortCircuit()) {
    return await respondWithFallback({
      supabase,
      conversationId,
      mode,
      message: SHORT_CIRCUIT_MESSAGE,
      requestId,
      route,
      userId,
      provider,
      startedAt,
      reason: 'short_circuit',
    });
  }

  let stream: ReadableStream<string>;
  try {
    stream =
      mode === 'possibilidades'
        ? await streamDeepSeek(trimmed, messageRaw, systemPrompt)
        : await streamGemini(trimmed, messageRaw, systemPrompt);
  } catch (initErr) {
    logEvent({
      request_id: requestId,
      route,
      user_id: userId,
      provider,
      mode,
      duration_ms: Date.now() - startedAt,
      error: safeErrorMessage(initErr),
      event: 'stream_init_failed_falling_back',
    });

    let fullText = '';
    try {
      fullText =
        mode === 'possibilidades'
          ? await completeDeepSeek(trimmed, messageRaw, systemPrompt)
          : await completeGemini(trimmed, messageRaw, systemPrompt);
    } catch (completeErr) {
      const friendly = mode === 'possibilidades' ? friendlyDeepSeekError : friendlyGeminiError;
      return await respondWithFallback({
        supabase,
        conversationId,
        mode,
        message: friendly,
        requestId,
        route,
        userId,
        provider,
        startedAt,
        reason: 'complete_failed',
        errorMsg: safeErrorMessage(completeErr),
      });
    }

    return await respondNonStream({
      supabase,
      conversationId,
      mode,
      fullText,
      requestId,
      route,
      userId,
      provider,
      startedAt,
    });
  }

  const encoder = new TextEncoder();
  let fullResponse = '';
  let streamErrored = false;

  const sseStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = stream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            fullResponse += value;
            controller.enqueue(encoder.encode(sseChunk(value)));
          }
        }
        controller.enqueue(encoder.encode(sseDone(false)));
        controller.close();
      } catch (err) {
        streamErrored = true;
        if (provider === 'deepseek') deepseekBreaker.recordFailure();

        const friendly = provider === 'deepseek' ? friendlyDeepSeekError : friendlyGeminiError;
        try {
          controller.enqueue(encoder.encode(sseError(friendly)));
          controller.enqueue(encoder.encode(sseDone(true)));
        } catch {
          /* controller may already be closed */
        }
        controller.close();

        logEvent({
          request_id: requestId,
          route,
          user_id: userId,
          provider,
          mode,
          duration_ms: Date.now() - startedAt,
          error: safeErrorMessage(err),
          is_partial: true,
          event: 'stream_mid_failure',
        });
      } finally {
        const insertRes = await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: fullResponse || (streamErrored ? '' : ''),
          mode_used: mode,
          is_partial: streamErrored,
        });

        if (insertRes.error) {
          logEvent({
            request_id: requestId,
            route,
            user_id: userId,
            provider,
            mode,
            error: insertRes.error.message,
            event: 'persist_assistant_failed',
          });
        }

        if (!streamErrored) {
          if (provider === 'deepseek') deepseekBreaker.recordSuccess();
          logEvent({
            request_id: requestId,
            route,
            user_id: userId,
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

interface FallbackArgs {
  supabase: ReturnType<typeof createSupabaseServerClient>;
  conversationId: string;
  mode: JoMode;
  message: string;
  requestId: string;
  route: string;
  userId: string;
  provider: Provider;
  startedAt: number;
  reason: string;
  errorMsg?: string;
}

async function respondWithFallback(args: FallbackArgs): Promise<Response> {
  const insertRes = await args.supabase.from('messages').insert({
    conversation_id: args.conversationId,
    role: 'assistant',
    content: args.message,
    mode_used: args.mode,
    is_partial: false,
  });

  if (insertRes.error) {
    logEvent({
      request_id: args.requestId,
      route: args.route,
      user_id: args.userId,
      provider: args.provider,
      mode: args.mode,
      error: insertRes.error.message,
      event: 'persist_fallback_failed',
    });
  }

  logEvent({
    request_id: args.requestId,
    route: args.route,
    user_id: args.userId,
    provider: args.provider,
    mode: args.mode,
    duration_ms: Date.now() - args.startedAt,
    error: args.errorMsg,
    event: `fallback_${args.reason}`,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(sseChunk(args.message)));
      controller.enqueue(encoder.encode(sseDone(false)));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

interface NonStreamArgs {
  supabase: ReturnType<typeof createSupabaseServerClient>;
  conversationId: string;
  mode: JoMode;
  fullText: string;
  requestId: string;
  route: string;
  userId: string;
  provider: Provider;
  startedAt: number;
}

async function respondNonStream(args: NonStreamArgs): Promise<Response> {
  const insertRes = await args.supabase.from('messages').insert({
    conversation_id: args.conversationId,
    role: 'assistant',
    content: args.fullText,
    mode_used: args.mode,
    is_partial: false,
  });

  if (insertRes.error) {
    logEvent({
      request_id: args.requestId,
      route: args.route,
      user_id: args.userId,
      provider: args.provider,
      mode: args.mode,
      error: insertRes.error.message,
      event: 'persist_assistant_failed',
    });
  }

  if (args.provider === 'deepseek') deepseekBreaker.recordSuccess();

  logEvent({
    request_id: args.requestId,
    route: args.route,
    user_id: args.userId,
    provider: args.provider,
    mode: args.mode,
    duration_ms: Date.now() - args.startedAt,
    is_partial: false,
    event: 'non_stream_done',
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(sseChunk(args.fullText)));
      controller.enqueue(encoder.encode(sseDone(false)));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
