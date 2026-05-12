import type { JourneyArtifact, Verb } from './server';

// Cap pro [CONTEXTO_PRÉVIO] no system prompt. Maior risco operacional do
// plano de jornada — contexto crescente vira custo, latência e drift. Se
// precisar mexer, mexa aqui (não espalhe constants pelo código).
export const MAX_CONTEXT_ARTIFACTS = 6;

const SUMMARY_FALLBACK_CHARS = 300;

export interface NormalizedArtifact {
  verb: Verb;
  createdAt: string;
  summary: string;
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + '…';
}

// Convenção opt-in: se o jo_output do verbo expuser `summary` (string) no
// top-level, usa. Caso contrário, fallback heurístico (JSON truncado).
// Convenções futuras (`keyDecisions`, `openQuestions`) podem ser adicionadas
// aqui sem mudar o schema do payload — Carla controla via prompt.
export function summarizeArtifact(a: JourneyArtifact): NormalizedArtifact {
  const out = a.jo_output as Record<string, unknown> | null;
  const explicit = typeof out?.summary === 'string' ? out.summary.trim() : '';
  const summary = explicit.length > 0
    ? explicit
    : truncate(JSON.stringify(a.jo_output ?? {}), SUMMARY_FALLBACK_CHARS);
  return {
    verb: a.verb,
    createdAt: a.created_at,
    summary,
  };
}

export function normalizeArtifacts(list: JourneyArtifact[]): NormalizedArtifact[] {
  return list.map(summarizeArtifact);
}

// Formata o bloco [CONTEXTO_PRÉVIO] injetado no system prompt da Jô.
// Devolve string vazia quando não há nada útil — buildSystemPrompt detecta
// e não prefixa o delimitador (evita ruído num system prompt limpo).
//
// Carla pode customizar o formato dentro do bloco evoluindo os prompts pra
// devolver `jo_output.summary` estruturado — `summarizeArtifact` já usa.
export function buildContextBlock(
  items: NormalizedArtifact[],
  labLabel?: string | null,
): string {
  const trimmedLab = typeof labLabel === 'string' ? labLabel.trim() : '';
  if (items.length === 0 && trimmedLab.length === 0) return '';

  const payload = {
    lab: trimmedLab.length > 0 ? trimmedLab : null,
    artifacts: items.map((a) => ({
      verb: a.verb,
      createdAt: a.createdAt,
      summary: a.summary,
    })),
  };
  return `[CONTEXTO_PRÉVIO]\n${JSON.stringify(payload, null, 2)}\n[/CONTEXTO_PRÉVIO]`;
}
