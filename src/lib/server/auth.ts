import type { AstroCookies } from 'astro';
import type { User } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '../supabase/server';

export type SupabaseServerClient = ReturnType<typeof createSupabaseServerClient>;

export type RequireUserResult =
  | { ok: true; supabase: SupabaseServerClient; user: User }
  | { ok: false; response: Response };

const UNAUTHENTICATED_BODY = JSON.stringify({
  error: 'unauthenticated',
  redirect: '/login',
});

function unauthenticatedResponse(): Response {
  return new Response(UNAUTHENTICATED_BODY, {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function requireUser(cookies: AstroCookies): Promise<RequireUserResult> {
  const supabase = createSupabaseServerClient(cookies);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return { ok: false, response: unauthenticatedResponse() };
  }
  return { ok: true, supabase, user: data.user };
}
