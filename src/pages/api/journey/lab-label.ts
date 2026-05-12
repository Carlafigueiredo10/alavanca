import type { APIRoute } from 'astro';
import { requireUser } from '../../../lib/server/auth';
import { logEvent } from '../../../lib/server/log';
import {
  getOrCreateActiveJourney,
  setLabLabel,
} from '../../../lib/journey/server';

export const prerender = false;

const route = '/api/journey/lab-label';
const MAX_LAB_LABEL_CHARS = 120;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

interface LabLabelBody {
  labLabel?: unknown;
}

export const POST: APIRoute = async ({ cookies, request }) => {
  const requestId = crypto.randomUUID();
  const auth = await requireUser(cookies);
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  let body: LabLabelBody;
  try {
    body = (await request.json()) as LabLabelBody;
  } catch {
    return jsonResponse({ error: 'Corpo inválido' }, 400);
  }

  let labLabel: string | null;
  if (body.labLabel === null || body.labLabel === undefined || body.labLabel === '') {
    labLabel = null;
  } else if (typeof body.labLabel === 'string') {
    const trimmed = body.labLabel.trim();
    if (trimmed.length === 0) {
      labLabel = null;
    } else if (trimmed.length > MAX_LAB_LABEL_CHARS) {
      return jsonResponse(
        { error: `lab_label não pode passar de ${MAX_LAB_LABEL_CHARS} caracteres` },
        400,
      );
    } else {
      labLabel = trimmed;
    }
  } else {
    return jsonResponse({ error: 'labLabel deve ser string ou null' }, 400);
  }

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

  const res = await setLabLabel(supabase, journeyRes.journey.id, labLabel);
  if (!res.ok) {
    logEvent({
      request_id: requestId,
      route,
      user_id: user.id,
      event: 'set_failed',
      error: res.error,
    });
    return jsonResponse({ error: 'Falha ao atualizar lab' }, 500);
  }

  return jsonResponse({ journeyId: journeyRes.journey.id, labLabel });
};
