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
  forceGenerate?: unknown;
}

// Suffix injetado quando o user clica "Gerar mesmo assim" no overlay de
// devolução. Instrui a Jô a NUNCA emitir devolucao e gerar o melhor doc
// possível com o input atual, marcando lacunas explicitamente.
const FORCE_GENERATE_SUFFIX = [
  '',
  '---',
  '',
  '# MODO FORÇADO — INPUT PARCIAL ACEITO PELO USUÁRIO',
  '',
  'O usuário avaliou o input atual e decidiu gerar o documento mesmo que esteja',
  'incompleto. SOBRESCREVE qualquer instrução anterior sobre devolução.',
  '',
  'REGRAS NESTE MODO:',
  '- NUNCA emita `type: "devolucao"`. SEMPRE gere `type: "plan"` (ou `type: "relatorio"`).',
  '- Para campos com baixa confiança ou informação faltante: marque com *itálico*',
  '  + nota `[a refinar]` no markdown da seção/campo afetado.',
  '- NÃO invente fatos não declarados. Quando faltar dado, declare-o como pendência.',
  '- No `summary`, mencione brevemente "input parcial — alguns elementos pendentes".',
  '- Mantenha o resto da estrutura idêntico ao formato normal.',
].join('\n');

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
  const forceGenerate = body.forceGenerate === true;

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
  // forceGenerate=true ⇒ append suffix instruindo Jô a pular devolução.
  const baseSystemPrompt = buildSystemPrompt(verb as JoMode, undefined, contextBlock, undefined, true);
  const systemPrompt = forceGenerate
    ? baseSystemPrompt + FORCE_GENERATE_SUFFIX
    : baseSystemPrompt;
  const userMessage = typeof body.wizardInput === 'string'
    ? body.wizardInput
    : JSON.stringify(body.wizardInput, null, 2);

  const adapter = getProviderForMode(verb as JoMode);
  const adapterOptions = { structuredJson: true };
  const startedAt = Date.now();

  // 3) Stream + acumular + persist no done
  const wizardInputForPersist = body.wizardInput;
  const encoder = new TextEncoder();
  const reqTag = requestId.slice(0, 8);
  // eslint-disable-next-line no-console
  console.log(`[generate ${reqTag}] start verb=${verb} promptLen=${systemPrompt.length} userLen=${userMessage.length}`);
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let acc = '';
      let chunkCount = 0;
      try {
        const providerStream = await adapter.stream([], userMessage, systemPrompt, undefined, adapterOptions);
        // eslint-disable-next-line no-console
        console.log(`[generate ${reqTag}] provider stream obtained`);
        const reader = providerStream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (typeof value !== 'string') continue;
          chunkCount++;
          acc += value;
          controller.enqueue(encoder.encode(sseChunk(value)));
        }
        // eslint-disable-next-line no-console
        console.log(`[generate ${reqTag}] reader ended chunks=${chunkCount} accLen=${acc.length}`);
        // eslint-disable-next-line no-console
        console.log(`[generate ${reqTag}] FINAL RAW head: ${JSON.stringify(acc.slice(0, 300))}`);
        // eslint-disable-next-line no-console
        console.log(`[generate ${reqTag}] FINAL RAW tail: ${JSON.stringify(acc.slice(-150))}`);

        // Persistência no done — tenta extrair JSON estruturado pra summary opt-in.
        let structured = null as ReturnType<typeof parseJoStructured>;
        try {
          structured = parseJoStructured(acc);
          // eslint-disable-next-line no-console
          console.log(`[generate ${reqTag}] parsed=${structured ? structured.type : 'null'}`);
        } catch (parseErr) {
          // eslint-disable-next-line no-console
          console.error(`[generate ${reqTag}] PARSE FAILED`, {
            err: parseErr instanceof Error ? parseErr.message : parseErr,
            sample: acc.slice(0, 500),
          });
        }
        const joOutput: Record<string, unknown> = {
          raw: acc,
          generatedAt: new Date().toISOString(),
        };
        if (forceGenerate) joOutput.forceGenerate = true;
        if (structured) {
          joOutput.structured = structured;
          if (structured.type === 'relatorio' || structured.type === 'plan') {
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
        // Log com stack pra debug (logEvent só tem msg curta).
        // eslint-disable-next-line no-console
        console.error(`[generate ${reqTag}] CAUGHT after chunks=${chunkCount} accLen=${acc.length}`, {
          name: e instanceof Error ? e.name : typeof e,
          message: e instanceof Error ? e.message : String(e),
          stack: e instanceof Error ? e.stack : undefined,
        });
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
            // eslint-disable-next-line no-console
            console.error('[generate.fallback]', verb, fbErr instanceof Error ? fbErr.stack : fbErr);
            // Manda erro real concatenado pra UI mostrar (MCP da Vercel
            // trunca logs — sem isso a gente não vê o erro do Gemini).
            const fbName = fbErr instanceof Error ? fbErr.name : typeof fbErr;
            const fbMsg = fbErr instanceof Error ? fbErr.message : String(fbErr);
            controller.enqueue(encoder.encode(sseError(
              `${adapter.friendly} [debug ${fbName}: ${fbMsg.slice(0, 240)}]`
            )));
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
