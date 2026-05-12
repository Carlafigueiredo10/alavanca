import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../lib/supabase/server';

export const prerender = false;

// OAuth com PKCE precisa que o exchangeCodeForSession rode server-side pra
// ler o `code_verifier` que o @supabase/ssr salvou em cookies HttpOnly.
// Magic link (OTP) funcionava client-side porque não usa PKCE — OAuth usa.

function loginRedirect(message: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: `/login?error=${encodeURIComponent(message)}` },
  });
}

export const GET: APIRoute = async ({ url, cookies }) => {
  const code = url.searchParams.get('code');
  const nextParam = url.searchParams.get('next');
  const next = nextParam && nextParam.startsWith('/') ? nextParam : '/jo';
  const errParam = url.searchParams.get('error_description') ?? url.searchParams.get('error');

  if (errParam) return loginRedirect(errParam);
  if (!code) return loginRedirect('Login não foi completado.');

  const supabase = createSupabaseServerClient(cookies);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) return loginRedirect(error.message);

  // Redirect inteligente: quando o `next` é o default genérico (/ ou /jo) e o
  // user já tem peças geradas, manda pra /minha-jornada. Se veio explícito de
  // outra rota (ex: /estruturar/sprint), respeita literalmente. RLS garante
  // que o select só enxerga artifacts do user.
  let destination = next;
  if (next === '/jo' || next === '/') {
    try {
      const { data: anyArtifact } = await supabase
        .from('journey_artifacts')
        .select('id')
        .limit(1)
        .maybeSingle();
      if (anyArtifact) destination = '/minha-jornada';
    } catch {
      /* segue next — best-effort */
    }
  }

  return new Response(null, {
    status: 302,
    headers: { Location: destination },
  });
};
