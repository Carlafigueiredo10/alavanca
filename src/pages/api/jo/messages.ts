import type { APIRoute } from 'astro';
import { requireUser } from '../../../lib/server/auth';
import { logEvent } from '../../../lib/server/log';

export const prerender = false;

const route = '/api/jo/messages';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ cookies, url }) => {
  const requestId = crypto.randomUUID();
  const conversationId = url.searchParams.get('conversationId');
  if (!conversationId) return jsonResponse({ error: 'conversationId obrigatório' }, 400);

  const auth = await requireUser(cookies);
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from('messages')
    .select('id, role, content, mode_used, is_partial, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    logEvent({
      request_id: requestId,
      route,
      user_id: user.id,
      error: error.message,
      event: 'list_failed',
    });
    return jsonResponse({ error: 'falha ao carregar mensagens' }, 500);
  }

  return jsonResponse({ messages: data ?? [] });
};
