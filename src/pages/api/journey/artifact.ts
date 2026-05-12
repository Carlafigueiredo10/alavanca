import type { APIRoute } from 'astro';
import { requireUser } from '../../../lib/server/auth';
import { logEvent, safeErrorMessage } from '../../../lib/server/log';
import {
  getOrCreateActiveJourney,
  getJourneyContext,
  appendArtifact,
  type Verb,
} from '../../../lib/journey/server';
import {
  normalizeArtifacts,
  buildContextBlock,
  MAX_CONTEXT_ARTIFACTS,
} from '../../../lib/journey/normalize';
import { getProviderForMode } from '../../../lib/ai/orchestrator';
import { buildSystemPrompt, type JoMode } from '../../../lib/ai/prompts';

export const prerender = false;

const route = '/api/journey/artifact';

const VALID_VERBS = new Set<Verb>([
  'mapear',
  'estruturar',
  'formalizar',
  'construir',
  'avaliar',
  'manter',
]);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

interface ArtifactBody {
  verb?: unknown;
  wizardInput?: unknown;
  replacesArtifactId?: unknown;
}

export const POST: APIRoute = async ({ cookies, request }) => {
  const requestId = crypto.randomUUID();
  const auth = await requireUser(cookies);
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  let body: ArtifactBody;
  try {
    body = (await request.json()) as ArtifactBody;
  } catch {
    return jsonResponse({ error: 'Corpo inválido' }, 400);
  }

  const rawVerb = body.verb;
  if (typeof rawVerb !== 'string' || !VALID_VERBS.has(rawVerb as Verb)) {
    return jsonResponse({ error: 'Verbo inválido' }, 400);
  }
  const verb = rawVerb as Verb;

  if (body.wizardInput == null) {
    return jsonResponse({ error: 'wizardInput é obrigatório' }, 400);
  }

  const replacesArtifactId =
    typeof body.replacesArtifactId === 'string' ? body.replacesArtifactId : null;

  // 1) Garante jornada ativa do user
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

  // 1.5) Carrega contexto prévio (artifacts anteriores) pra prepender no
  //      system prompt. Na 1ª chamada vai estar vazio — buildContextBlock
  //      devolve string vazia e o prompt fica limpo.
  let contextBlock: string | null = null;
  try {
    const ctxRes = await getJourneyContext(
      supabase,
      journeyRes.journey.id,
      MAX_CONTEXT_ARTIFACTS,
    );
    if (ctxRes.ok) {
      contextBlock = buildContextBlock(
        normalizeArtifacts(ctxRes.context.artifacts),
        journeyRes.journey.lab_label,
      );
    }
  } catch {
    /* segue sem contexto — não bloqueia geração */
  }

  // 2) Dispara a Jô: system prompt do verbo + contexto prévio + wizardInput
  const systemPrompt = buildSystemPrompt(verb as JoMode, undefined, contextBlock);
  const userMessage =
    typeof body.wizardInput === 'string'
      ? body.wizardInput
      : JSON.stringify(body.wizardInput, null, 2);

  const adapter = getProviderForMode(verb as JoMode);
  const startedAt = Date.now();
  let responseText: string;
  try {
    responseText = await adapter.complete([], userMessage, systemPrompt);
  } catch (e) {
    logEvent({
      request_id: requestId,
      route,
      user_id: user.id,
      provider: adapter.key,
      event: 'jo_failed',
      error: safeErrorMessage(e),
      duration_ms: Date.now() - startedAt,
    });
    return jsonResponse({ error: adapter.friendly }, 502);
  }

  const joOutput = {
    text: responseText,
    generatedAt: new Date().toISOString(),
  };

  // 3) Persiste artifact (replaces_artifact_id mantém cadeia de versão)
  const artifactRes = await appendArtifact(supabase, journeyRes.journey.id, {
    verb,
    wizardInput: body.wizardInput,
    joOutput,
    replacesArtifactId,
  });
  if (!artifactRes.ok) {
    logEvent({
      request_id: requestId,
      route,
      user_id: user.id,
      event: 'persist_failed',
      error: artifactRes.error,
    });
    return jsonResponse({ error: 'Falha ao salvar artefato' }, 500);
  }

  logEvent({
    request_id: requestId,
    route,
    user_id: user.id,
    provider: adapter.key,
    event: 'artifact_created',
    duration_ms: Date.now() - startedAt,
  });

  return jsonResponse({
    artifactId: artifactRes.artifact.id,
    journeyId: journeyRes.journey.id,
    joOutput,
  });
};
