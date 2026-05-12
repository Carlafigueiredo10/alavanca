import type { APIRoute } from 'astro';
import { requireUser } from '../../../lib/server/auth';
import { logEvent } from '../../../lib/server/log';
import {
  getOrCreateActiveJourney,
  archiveJourney,
} from '../../../lib/journey/server';

export const prerender = false;

const route = '/api/journey/archive';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Arquiva a jornada ativa. Próximo getOrCreate cria nova (partial unique index
// libera o slot active assim que a antiga vira archived).
export const POST: APIRoute = async ({ cookies }) => {
  const requestId = crypto.randomUUID();
  const auth = await requireUser(cookies);
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  const journeyRes = await getOrCreateActiveJourney(supabase, user.id);
  if (!journeyRes.ok) {
    logEvent({
      request_id: requestId,
      route,
      user_id: user.id,
      event: 'journey_failed',
      error: journeyRes.error,
    });
    return jsonResponse({ error: 'Falha ao abrir jornada' }, 500);
  }

  const res = await archiveJourney(supabase, journeyRes.journey.id);
  if (!res.ok) {
    logEvent({
      request_id: requestId,
      route,
      user_id: user.id,
      event: 'archive_failed',
      error: res.error,
    });
    return jsonResponse({ error: 'Falha ao arquivar jornada' }, 500);
  }

  return jsonResponse({ archivedJourneyId: journeyRes.journey.id });
};
