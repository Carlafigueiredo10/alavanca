import type { APIRoute } from 'astro';
import type { AstroCookies } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export const prerender = false;

// Logout server-side: chama signOut() pra invalidar a sessão no Supabase e
// limpar os cookies HttpOnly do @supabase/ssr (que o client browser não
// alcança). Aceita POST (form submit) ou GET (link direto).
async function handle(cookies: AstroCookies): Promise<Response> {
  const supabase = createSupabaseServerClient(cookies);
  await supabase.auth.signOut();
  return new Response(null, { status: 302, headers: { Location: '/' } });
}

export const POST: APIRoute = async ({ cookies }) => handle(cookies);
export const GET: APIRoute = async ({ cookies }) => handle(cookies);
