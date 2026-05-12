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
import { parseJoStructured } from '../../../lib/jo/response-types';

export const prerender = false;

const route = '/api/journey/generate';

const VALID_VERBS = new Set<Verb>([
  'mapear', 'estruturar', 'formalizar', 'construir', 'avaliar', 'manter',
]);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function sseChunk(text: string): string {
  return `data: ${JSON.stringify({ type: 'chunk', text })}\n\n`;
}
function sseDone(artifactId: string | null, isPartial: boolean): string {
  return `data: ${JSON.stringify({ type: 'done', artifactId, is_partial: isPartial })}\n\n`;
}
function sseError(message: string): string {
  return `data: ${JSON.stringify({ type: 'error', message })}\n\n`;
}

interface GenerateBody {
  verb?: unknown;
  wizardInput?: unknown;
  replacesArtifactId?: unknown;
}

export const POST: APIRoute = async ({ cookies, request }) => {
  const requestId = crypto.randomUUID();
  const auth = await requireUser(cookies);
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  let body: GenerateBody;
  try {
    body = (await request.json()) as GenerateBody;
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

  // 1) Jornada ativa
  const journeyRes = await getOrCreateActiveJourney(supabase, user.id);
  if (!journeyRes.ok) {
    logEvent({
      request_id: requestId, route, user_id: user.id,
      event: 'journey_failed', error: journeyRes.error,
    });
    return jsonResponse({ error: 'Falha ao abrir jornada' }, 500);
  }

  // 2) Contexto prévio
  let contextBlock: string | null = null;
  try {
    const ctxRes = await getJourneyContext(
      supabase, journeyRes.journey.id, MAX_CONTEXT_ARTIFACTS,
    );
    if (ctxRes.ok) {
      contextBlock = buildContextBlock(
        normalizeArtifacts(ctxRes.context.artifacts),
        journeyRes.journey.lab_label,
      );
    }
  } catch {
    /* best-effort */
  }

  // Endpoint só serve modos estruturados (a UI overlay precisa do JSON).
  // structured=true ⇒ injeta contrato + ativa responseMimeType no Gemini.
  const systemPrompt = buildSystemPrompt(verb as JoMode, undefined, contextBlock, undefined, true);
  const userMessage = typeof body.wizardInput === 'string'
    ? body.wizardInput
    : JSON.stringify(body.wizardInput, null, 2);

  const adapter = getProviderForMode(verb as JoMode);
  const adapterOptions = { structuredJson: true };
  const startedAt = Date.now();

  // 3) Stream + acumular + persist no done
  const wizardInputForPersist = body.wizardInput;
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let acc = '';
      try {
        const providerStream = await adapter.stream([], userMessage, systemPrompt, undefined, adapterOptions);
        const reader = providerStream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (typeof value !== 'string') continue;
          acc += value;
          controller.enqueue(encoder.encode(sseChunk(value)));
        }

        // Persistência no done — tenta extrair JSON estruturado pra summary opt-in.
        const structured = parseJoStructured(acc);
        const joOutput: Record<string, unknown> = {
          raw: acc,
          generatedAt: new Date().toISOString(),
        };
        if (structured) {
          joOutput.structured = structured;
          if (structured.type === 'relatorio') {
            joOutput.summary = structured.summary;
          }
        }

        const artifactRes = await appendArtifact(supabase, journeyRes.journey.id, {
          verb,
          wizardInput: wizardInputForPersist,
          joOutput,
          replacesArtifactId,
        });

        if (!artifactRes.ok) {
          logEvent({
            request_id: requestId, route, user_id: user.id,
            event: 'persist_failed', error: artifactRes.error,
          });
          controller.enqueue(encoder.encode(sseDone(null, true)));
        } else {
          logEvent({
            request_id: requestId, route, user_id: user.id,
            provider: adapter.key, event: 'artifact_created',
            duration_ms: Date.now() - startedAt,
          });
          controller.enqueue(encoder.encode(sseDone(artifactRes.artifact.id, false)));
        }
      } catch (e) {
        logEvent({
          request_id: requestId, route, user_id: user.id,
          provider: adapter.key, event: 'stream_failed',
          error: safeErrorMessage(e),
          duration_ms: Date.now() - startedAt,
        });

        // Tenta fallback complete se a stream falhou no início.
        if (acc.length === 0) {
          try {
            const fullText = await adapter.complete([], userMessage, systemPrompt, undefined, adapterOptions);
            controller.enqueue(encoder.encode(sseChunk(fullText)));
            acc = fullText;
            const structured = parseJoStructured(acc);
            const joOutput: Record<string, unknown> = {
              raw: acc,
              generatedAt: new Date().toISOString(),
            };
            if (structured) {
              joOutput.structured = structured;
              if (structured.type === 'relatorio') {
                joOutput.summary = structured.summary;
              }
            }
            const artifactRes = await appendArtifact(supabase, journeyRes.journey.id, {
              verb,
              wizardInput: wizardInputForPersist,
              joOutput,
              replacesArtifactId,
            });
            const artifactId = artifactRes.ok ? artifactRes.artifact.id : null;
            controller.enqueue(encoder.encode(sseDone(artifactId, false)));
          } catch (fbErr) {
            controller.enqueue(encoder.encode(sseError(adapter.friendly)));
            controller.enqueue(encoder.encode(sseDone(null, true)));
            logEvent({
              request_id: requestId, route, user_id: user.id,
              provider: adapter.key, event: 'fallback_failed',
              error: safeErrorMessage(fbErr),
            });
          }
        } else {
          // Stream parou no meio: persiste o que tem e marca como partial.
          const structured = parseJoStructured(acc);
          const joOutput: Record<string, unknown> = {
            raw: acc,
            generatedAt: new Date().toISOString(),
            partial: true,
          };
          if (structured) joOutput.structured = structured;
          const artifactRes = await appendArtifact(supabase, journeyRes.journey.id, {
            verb,
            wizardInput: wizardInputForPersist,
            joOutput,
            replacesArtifactId,
          });
          const artifactId = artifactRes.ok ? artifactRes.artifact.id : null;
          controller.enqueue(encoder.encode(sseDone(artifactId, true)));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
};
