// POST /api/journey/section
// Gera markdown de UMA seção de um JoPlan (arquitetura sections-first).
// Stream SSE. On done: atualiza artifact.jo_output.plan.sections[idx].
//
// Timeout afeta só esta seção — o resto do documento permanece. Se essa
// seção truncar, fica `status: 'partial'`. Re-chamar o endpoint regenera
// somente ela.

import type { APIRoute } from 'astro';
import { requireUser } from '../../../lib/server/auth';
import { logEvent, safeErrorMessage } from '../../../lib/server/log';
import { getArtifactById, type Verb } from '../../../lib/journey/server';
import { buildSectionPrompt } from '../../../lib/journey/sections';
import { getProviderForMode } from '../../../lib/ai/orchestrator';
import type { JoMode } from '../../../lib/ai/prompts';
import type { JoPlan, JoSection } from '../../../lib/jo/response-types';

export const prerender = false;

const route = '/api/journey/section';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function sseChunk(text: string): string {
  return `data: ${JSON.stringify({ type: 'chunk', text })}\n\n`;
}
function sseDone(status: JoSection['status']): string {
  return `data: ${JSON.stringify({ type: 'done', status })}\n\n`;
}
function sseError(message: string): string {
  return `data: ${JSON.stringify({ type: 'error', message })}\n\n`;
}

interface SectionBody {
  artifactId?: unknown;
  sectionId?: unknown;
}

export const POST: APIRoute = async ({ cookies, request }) => {
  const requestId = crypto.randomUUID();
  const auth = await requireUser(cookies);
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  let body: SectionBody;
  try {
    body = (await request.json()) as SectionBody;
  } catch {
    return json({ error: 'Corpo inválido' }, 400);
  }

  const artifactId = typeof body.artifactId === 'string' ? body.artifactId : '';
  const sectionId = typeof body.sectionId === 'string' ? body.sectionId : '';
  if (!artifactId || !sectionId) {
    return json({ error: 'artifactId e sectionId são obrigatórios' }, 400);
  }

  const arRes = await getArtifactById(supabase, artifactId);
  if (!arRes.ok) return json({ error: arRes.error }, 500);
  if (!arRes.artifact) return json({ error: 'artifact não encontrado' }, 404);

  const out = arRes.artifact.jo_output as Record<string, unknown> | null;
  const plan = (out?.structured ?? out?.plan) as JoPlan | undefined;
  if (!plan || plan.type !== 'plan') {
    return json({ error: 'artifact não é um plan (sections-first)' }, 400);
  }

  const sectionIdx = plan.sections.findIndex((s) => s.id === sectionId);
  if (sectionIdx < 0) {
    return json({ error: `seção '${sectionId}' não existe neste plan` }, 404);
  }
  const section = plan.sections[sectionIdx];
  const verb = arRes.artifact.verb as Verb;

  const { system, user: userMsg } = buildSectionPrompt(verb, plan, section);
  const adapter = getProviderForMode(verb as JoMode);
  const startedAt = Date.now();
  const encoder = new TextEncoder();
  const reqTag = requestId.slice(0, 8);

  // eslint-disable-next-line no-console
  console.log(`[section ${reqTag}] verb=${verb} section=${sectionId} promptLen=${system.length}+${userMsg.length}`);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let acc = '';
      let finalStatus: JoSection['status'] = 'streaming';
      try {
        const providerStream = await adapter.stream([], userMsg, system, undefined, { structuredJson: false });
        const reader = providerStream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (typeof value !== 'string') continue;
          acc += value;
          controller.enqueue(encoder.encode(sseChunk(value)));
        }
        // Heurística: se acabou abruptamente em meio a uma sentença, marca partial.
        // Caso normal: bate em ponto final ou newline → done.
        const trimmed = acc.trim();
        const endsCleanly = /[.!?]\s*$|^\s*$|\n\s*$/.test(trimmed);
        finalStatus = trimmed.length > 0
          ? (endsCleanly ? 'done' : 'partial')
          : 'error';
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`[section ${reqTag}] caught accLen=${acc.length}`, {
          name: e instanceof Error ? e.name : typeof e,
          message: e instanceof Error ? e.message : String(e),
        });
        logEvent({
          request_id: requestId, route, user_id: user.id,
          provider: adapter.key, event: 'section_stream_failed',
          error: safeErrorMessage(e),
          duration_ms: Date.now() - startedAt,
        });
        finalStatus = acc.trim().length > 0 ? 'partial' : 'error';
      }

      // Persiste a seção atualizada no artifact (UPDATE).
      try {
        const updatedSections = plan.sections.map((s, i) =>
          i === sectionIdx
            ? { ...s, markdown: acc.trim(), status: finalStatus, updatedAt: new Date().toISOString() }
            : s,
        );
        const newPlan: JoPlan = { ...plan, sections: updatedSections };
        const newJoOutput: Record<string, unknown> = {
          ...(out ?? {}),
          structured: newPlan,
          generatedAt: new Date().toISOString(),
        };
        // Remove o legacy `partial` flag se ele existir (não é mais relevante)
        delete newJoOutput.partial;
        const { error: updErr } = await supabase
          .from('journey_artifacts')
          .update({ jo_output: newJoOutput })
          .eq('id', artifactId);
        if (updErr) {
          // eslint-disable-next-line no-console
          console.error(`[section ${reqTag}] update failed:`, updErr.message);
        }
      } catch (persistErr) {
        // eslint-disable-next-line no-console
        console.error(`[section ${reqTag}] persist exception:`, persistErr);
      }

      logEvent({
        request_id: requestId, route, user_id: user.id,
        provider: adapter.key, event: 'section_generated',
        duration_ms: Date.now() - startedAt,
      });
      controller.enqueue(encoder.encode(finalStatus === 'error'
        ? sseError(adapter.friendly)
        : sseDone(finalStatus)));
      controller.close();
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
