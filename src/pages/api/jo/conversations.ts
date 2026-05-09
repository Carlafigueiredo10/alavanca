import type { APIRoute } from 'astro';
import { requireUser } from '../../../lib/server/auth';
import { logEvent, safeErrorMessage } from '../../../lib/server/log';

export const prerender = false;

const route = '/api/jo/conversations';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ cookies }) => {
  const requestId = crypto.randomUUID();
  const auth = await requireUser(cookies);
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from('conversations')
    .select('id, title, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    logEvent({
      request_id: requestId,
      route,
      user_id: user.id,
      error: error.message,
      event: 'list_failed',
    });
    return jsonResponse({ error: 'falha ao carregar conversas' }, 500);
  }

  return jsonResponse({ conversations: data ?? [] });
};

export const POST: APIRoute = async ({ cookies }) => {
  const requestId = crypto.randomUUID();
  const auth = await requireUser(cookies);
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: user.id })
    .select('id, title, created_at')
    .single();

  if (error || !data) {
    logEvent({
      request_id: requestId,
      route,
      user_id: user.id,
      error: safeErrorMessage(error),
      event: 'create_failed',
    });
    return jsonResponse({ error: 'falha ao criar conversa' }, 500);
  }

  return jsonResponse({ conversation: data });
};
