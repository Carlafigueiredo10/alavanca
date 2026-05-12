import type { APIRoute } from 'astro';
import { requireUser } from '../../../lib/server/auth';
import { logEvent } from '../../../lib/server/log';
import {
  getOrCreateActiveJourney,
  getJourneyContext,
} from '../../../lib/journey/server';
import {
  normalizeArtifacts,
  MAX_CONTEXT_ARTIFACTS,
} from '../../../lib/journey/normalize';

export const prerender = false;

const route = '/api/journey/current';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Devolve jornada ativa + últimos N artifacts (raw) + versão normalizada
// (resumo heurístico) pronta pra alimentar [CONTEXTO_PRÉVIO] no system prompt.
export const GET: APIRoute = async ({ cookies }) => {
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

  const ctxRes = await getJourneyContext(
    supabase,
    journeyRes.journey.id,
    MAX_CONTEXT_ARTIFACTS,
  );
  if (!ctxRes.ok) {
    logEvent({
      request_id: requestId,
      route,
      user_id: user.id,
      event: 'context_failed',
      error: ctxRes.error,
    });
    return jsonResponse({ error: 'Falha ao ler jornada' }, 500);
  }

  return jsonResponse({
    journey: {
      id: journeyRes.journey.id,
      labLabel: journeyRes.journey.lab_label,
      currentVerb: journeyRes.journey.current_verb,
      status: journeyRes.journey.status,
      startedAt: journeyRes.journey.started_at,
      lastActiveAt: journeyRes.journey.last_active_at,
    },
    artifacts: ctxRes.context.artifacts,
    normalized: normalizeArtifacts(ctxRes.context.artifacts),
  });
};
