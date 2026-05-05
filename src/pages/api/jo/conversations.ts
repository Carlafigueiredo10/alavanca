import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { logEvent, safeErrorMessage } from '../../../lib/jo/log';

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
  const supabase = createSupabaseServerClient(cookies);
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return jsonResponse({ error: 'unauthenticated' }, 401);

  const { data, error } = await supabase
    .from('conversations')
    .select('id, title, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    logEvent({
      request_id: requestId,
      route,
      user_id: auth.user.id,
      error: error.message,
      event: 'list_failed',
    });
    return jsonResponse({ error: 'falha ao carregar conversas' }, 500);
  }

  return jsonResponse({ conversations: data ?? [] });
};

export const POST: APIRoute = async ({ cookies }) => {
  const requestId = crypto.randomUUID();
  const supabase = createSupabaseServerClient(cookies);
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return jsonResponse({ error: 'unauthenticated' }, 401);

  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: auth.user.id })
    .select('id, title, created_at')
    .single();

  if (error || !data) {
    logEvent({
      request_id: requestId,
      route,
      user_id: auth.user.id,
      error: safeErrorMessage(error),
      event: 'create_failed',
    });
    return jsonResponse({ error: 'falha ao criar conversa' }, 500);
  }

  return jsonResponse({ conversation: data });
};
