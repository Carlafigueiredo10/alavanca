// Contrato entre o prompt da Jô (escrito por Carla) e o renderer/persister.
// Modos em STRUCTURED_MODES devem devolver JSON neste shape; o parser cai pra
// markdown puro como fallback quando o JSON não bate.

import type { Verb } from '../journey/server';

export type GoNoGo = 'GO' | 'GO_MITIGATION' | 'NO_GO';

export interface JoChecklistItem {
  ok: boolean;
  label: string;
  hint: string | null;
}

export interface JoDevolucao {
  type: 'devolucao';
  checklist: JoChecklistItem[];
  next: string;
  message?: string;
}

// Relatório válido — campos no topo + markdown longo por último (otimiza
// streaming: badges aparecem cedo, conteúdo extenso vem depois).
export interface JoRelatorio {
  type: 'relatorio';
  goNoGo: GoNoGo;
  route_order: Verb[];
  diagnostic_tags: string[];
  summary: string;
  markdown: string;
}

// Cabeçalho do relatório SEM o markdown — extraído cedo durante streaming
// pra renderizar badges enquanto o conteúdo principal ainda chega.
export type JoRelatorioHeader = Omit<JoRelatorio, 'markdown'>;

export type JoStructuredResponse = JoDevolucao | JoRelatorio;

// Modos cujo system prompt deve devolver JSON estruturado. Frontend ativa
// detector / parser incremental só pra estes; demais seguem markdown comum.
// Quando Carla atualizar o prompt de outro verbo pra devolver JSON, adicionar
// aqui — sem mais código.
export const STRUCTURED_MODES: ReadonlySet<string> = new Set<string>(['mapear']);

const GONOGO_VALUES: ReadonlySet<GoNoGo> = new Set<GoNoGo>(['GO', 'GO_MITIGATION', 'NO_GO']);
const VERB_VALUES: ReadonlySet<Verb> = new Set<Verb>([
  'mapear', 'estruturar', 'formalizar', 'construir', 'avaliar', 'manter',
]);

// Remove envelopes ```json...``` (Gemini e outros tendem a embrulhar JSON em
// fenced block mesmo quando instruídos a devolver JSON puro). Tolerante a
// versões parciais durante streaming (suffix pode ainda não ter chegado).
export function stripCodeFence(raw: string): string {
  let s = raw;
  // Prefix: ```json\n ou ```JSON\n ou ```\n (com whitespace antes)
  s = s.replace(/^\s*```(?:json|JSON)?\s*\n?/, '');
  // Suffix: \n``` ou ``` no fim (só remove se aparece — pode não ter chegado)
  const trail = s.match(/\n?\s*```\s*$/);
  if (trail && typeof trail.index === 'number') {
    s = s.slice(0, trail.index);
  }
  return s;
}

// Cap defensivo pra evitar JSON.parse de payload explodido (resposta bugada
// que cresce sem parar). 200kB cobre relatório SEI-Ready confortavelmente.
const MAX_PARSE_BYTES = 200_000;

// Extrai um JSON cru de uma string que pode ter texto antes/depois ou estar
// embrulhado em ```json...```. Best-effort: devolve null se nada parseia.
export function extractJsonObject(raw: string): unknown | null {
  if (raw.length > MAX_PARSE_BYTES) return null;
  const trimmed = stripCodeFence(raw).trim();
  if (trimmed.length === 0) return null;

  // Direct parse
  try { return JSON.parse(trimmed); } catch { /* fallthrough */ }

  // First balanced {...}
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(trimmed.slice(start, end + 1)); } catch { /* fallthrough */ }
  }

  return null;
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function asChecklist(v: unknown): JoChecklistItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null)
    .map((x) => ({
      ok: x.ok === true,
      label: asString(x.label),
      hint: typeof x.hint === 'string' && x.hint.trim().length > 0 ? x.hint : null,
    }))
    .filter((x) => x.label.length > 0);
}

function asVerbList(v: unknown): Verb[] {
  if (!Array.isArray(v)) return [];
  const out: Verb[] = [];
  for (const item of v) {
    if (typeof item === 'string' && VERB_VALUES.has(item as Verb)) {
      out.push(item as Verb);
    }
  }
  return out;
}

function asStringList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string' && x.length > 0);
}

// Valida o objeto cru contra um dos shapes. Devolve null se não bater.
export function validateJoStructured(raw: unknown): JoStructuredResponse | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  if (obj.type === 'devolucao') {
    const checklist = asChecklist(obj.checklist);
    if (checklist.length === 0) return null;
    return {
      type: 'devolucao',
      checklist,
      next: asString(obj.next),
      message: typeof obj.message === 'string' && obj.message.trim().length > 0
        ? obj.message
        : undefined,
    };
  }

  if (obj.type === 'relatorio') {
    const goNoGo = typeof obj.goNoGo === 'string' && GONOGO_VALUES.has(obj.goNoGo as GoNoGo)
      ? (obj.goNoGo as GoNoGo)
      : null;
    const markdown = asString(obj.markdown);
    if (!goNoGo || markdown.length === 0) return null;
    return {
      type: 'relatorio',
      goNoGo,
      route_order: asVerbList(obj.route_order),
      diagnostic_tags: asStringList(obj.diagnostic_tags),
      summary: asString(obj.summary),
      markdown,
    };
  }

  return null;
}

export function parseJoStructured(raw: string): JoStructuredResponse | null {
  const candidate = extractJsonObject(raw);
  if (!candidate) return null;
  return validateJoStructured(candidate);
}

// Valida só o cabeçalho (sem o `markdown`). Usado pelo streaming parser pra
// renderizar badges assim que os primeiros campos chegam.
export function validateRelatorioHeader(raw: unknown): JoRelatorioHeader | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (obj.type !== 'relatorio') return null;
  const goNoGo = typeof obj.goNoGo === 'string' && GONOGO_VALUES.has(obj.goNoGo as GoNoGo)
    ? (obj.goNoGo as GoNoGo)
    : null;
  if (!goNoGo) return null;
  return {
    type: 'relatorio',
    goNoGo,
    route_order: asVerbList(obj.route_order),
    diagnostic_tags: asStringList(obj.diagnostic_tags),
    summary: asString(obj.summary),
  };
}

// Recebe o trecho do JSON do início até logo antes do campo `markdown`.
// Fecha o objeto sinteticamente (adiciona `}`) e tenta parsear. Tolerante a
// vírgulas pendentes (remove a trailing `,` antes de fechar).
export function parseRelatorioHeaderFromPreamble(
  preamble: string,
): JoRelatorioHeader | null {
  const cleaned = stripCodeFence(preamble).trimEnd().replace(/,\s*$/, '');
  if (!cleaned.startsWith('{')) return null;
  try {
    const candidate = JSON.parse(cleaned + '}');
    return validateRelatorioHeader(candidate);
  } catch {
    return null;
  }
}
