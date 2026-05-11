import type { APIRoute } from 'astro';
import { createSupabaseAdminClient, createSupabaseServerClient } from '../../lib/supabase/server';

export const prerender = false;

const CATEGORIES = ['elogio', 'melhoria', 'erro', 'outro'] as const;
type Category = (typeof CATEGORIES)[number];

const KINDS = ['geral', 'bibliografia', 'ecossistema'] as const;
type Kind = (typeof KINDS)[number];

const SUBKINDS_ECOSSISTEMA = ['rede', 'pratica', 'ferramenta'] as const;
type SubkindEcossistema = (typeof SUBKINDS_ECOSSISTEMA)[number];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Corpo inválido.' }, 400);
  }

  // honeypot — campo oculto que humanos não vêem; bot que preenche é descartado.
  // devolve 200 para não dar pista de que foi rejeitado.
  if (typeof body?.website === 'string' && body.website.trim().length > 0) {
    return jsonResponse({ ok: true });
  }

  const content = typeof body?.content === 'string' ? body.content.trim() : '';
  if (content.length < 4 || content.length > 4000) {
    return jsonResponse({ error: 'A sugestão precisa ter entre 4 e 4000 caracteres.' }, 400);
  }

  const category: Category | null =
    CATEGORIES.includes(body?.category) ? (body.category as Category) : null;

  const kind: Kind = KINDS.includes(body?.kind) ? (body.kind as Kind) : 'geral';

  // subkind só é aceito quando kind = ecossistema; nos demais kinds, sempre null.
  let subkind: SubkindEcossistema | null = null;
  if (kind === 'ecossistema') {
    if (!SUBKINDS_ECOSSISTEMA.includes(body?.subkind)) {
      return jsonResponse(
        { error: 'Selecione o tipo da sugestão (rede, prática ou ferramenta).' },
        400,
      );
    }
    subkind = body.subkind as SubkindEcossistema;
  }

  const page = typeof body?.page === 'string' && body.page.length <= 200 ? body.page : null;

  const authorName =
    typeof body?.authorName === 'string' && body.authorName.trim().length > 0
      ? body.authorName.trim().slice(0, 120)
      : null;

  const authorEmail =
    typeof body?.authorEmail === 'string' && body.authorEmail.trim().length > 0
      ? body.authorEmail.trim().slice(0, 200)
      : null;

  if (authorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) {
    return jsonResponse({ error: 'E-mail inválido.' }, 400);
  }

  const userAgent = request.headers.get('user-agent')?.slice(0, 300) ?? null;

  // se a pessoa estiver logada, marca o user_id (não é exigido).
  let userId: string | null = null;
  try {
    const ssr = createSupabaseServerClient(cookies);
    const { data: auth } = await ssr.auth.getUser();
    userId = auth?.user?.id ?? null;
  } catch {
    userId = null;
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from('suggestions').insert({
    content,
    category,
    kind,
    subkind,
    page,
    author_name: authorName,
    author_email: authorEmail,
    user_id: userId,
    user_agent: userAgent,
  });

  if (error) {
    console.error('[sugestoes] insert failed', error.message);
    return jsonResponse(
      { error: 'Não consegui registrar agora — tenta de novo em instantes.' },
      500
    );
  }

  return jsonResponse({ ok: true });
};
