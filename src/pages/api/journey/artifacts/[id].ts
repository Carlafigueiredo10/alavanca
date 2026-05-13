// GET /api/journey/artifacts/<id> — devolve um artifact pra pre-fill do wizard
// no fluxo de edição (cria nova versão via replaces_artifact_id no submit).
import type { APIRoute } from 'astro';
import { requireUser } from '../../../../lib/server/auth';
import { getArtifactById } from '../../../../lib/journey/server';

export const prerender = false;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ cookies, params }) => {
  const auth = await requireUser(cookies);
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const id = typeof params.id === 'string' ? params.id : '';
  if (id.length === 0) return json({ error: 'id ausente' }, 400);

  const res = await getArtifactById(supabase, id);
  if (!res.ok) return json({ error: res.error }, 500);
  if (!res.artifact) return json({ error: 'não encontrado' }, 404);

  return json({ artifact: res.artifact });
};
