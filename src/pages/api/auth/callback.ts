import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { logEvent, safeErrorMessage } from '../../../lib/server/log';

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const requestId = crypto.randomUUID();
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/jo';

  if (!code) {
    return redirect('/login?error=missing_code');
  }

  const supabase = createSupabaseServerClient(cookies);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    logEvent({
      request_id: requestId,
      route: '/api/auth/callback',
      error: safeErrorMessage(error),
      event: 'exchange_failed',
    });
    return redirect('/login?error=' + encodeURIComponent('falha ao validar link'));
  }

  return redirect(next);
};
