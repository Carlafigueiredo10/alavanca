import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from './lib/supabase/server';

// Gating de login centralizado. Decisão de produto: a plataforma deixa de
// ser "tente sem login" — todo fluxo que gera artefato ou vincula a uma
// jornada continuada exige autenticação. Conteúdo institucional (landing,
// /sobre-jo, /casos, /bibliografia, /fundamentos, /sugestoes, /ia) fica
// público pra SEO e compartilhamento entre pares.
//
// Middleware Astro só roda em rotas SSR (prerender=false). As páginas
// privadas listadas abaixo TÊM `export const prerender = false` no
// frontmatter — sem isso, viram HTML estático e o middleware é ignorado.

const PRIVATE_PREFIXES = [
  '/diagnostico',
  '/aplicacao',
  '/jo',
  '/assistente',
  '/ia/linguagem',
  '/mapear',
  '/estruturar',
  '/formalizar',
  '/construir',
  '/avaliar',
  '/manter',
  '/minha-jornada',
  '/jornada',
  '/meus-produtos',
] as const;

function isPrivate(pathname: string): boolean {
  return PRIVATE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // /api/* gerencia auth dentro de cada handler. Não interceptamos aqui
  // pra não criar fricção em endpoints públicos (ex: POST /api/sugestoes).
  if (pathname.startsWith('/api/')) return next();
  if (!isPrivate(pathname)) return next();

  const supabase = createSupabaseServerClient(context.cookies);
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    const search = context.url.search ?? '';
    const next_ = encodeURIComponent(pathname + search);
    return context.redirect(`/login?next=${next_}`);
  }

  return next();
});
