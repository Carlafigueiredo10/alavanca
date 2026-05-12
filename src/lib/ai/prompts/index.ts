const promptModules = import.meta.glob('../../../prompts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const hookModules = import.meta.glob('../../../prompts/hooks/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function read(filename: string): string {
  const key = Object.keys(promptModules).find((k) => k.endsWith(filename));
  if (!key) throw new Error(`Prompt não encontrado: ${filename}`);
  return promptModules[key];
}

export const JO_DECISAO_PROMPT = read('jo-decisao.md');
export const JO_POSSIBILIDADES_PROMPT = read('jo-possibilidades.md');
export const JO_MAPEAR_PROMPT = read('jo-mapear.md');
export const JO_ESTRUTURAR_PROMPT = read('jo-estruturar.md');
export const JO_CONSTRUIR_PROMPT = read('jo-construir.md');
export const JO_AVALIAR_PROMPT = read('jo-avaliar.md');
export const JO_MANTER_PROMPT = read('jo-manter.md');

// Formalizar é modular · 6 frentes autônomas com system prompts isolados.
// Cada frente tem escopo cirúrgico e base de conhecimento independente.
// A discriminação é (mode='formalizar', frente=<sub-wizard>); o server
// carrega o .md exato, sem condicionais no prompt — evita alucinação cruzada.
export type FormalizarFrente =
  | 'portaria'
  | 'catalogo'
  | 'dedicacao'
  | 'enquadramento-ict'
  | 'nit'
  | 'politica-inovacao';

const FORMALIZAR_FRENTE_PROMPTS: Record<FormalizarFrente, string> = {
  'portaria':            read('jo-formalizar-portaria.md'),
  'catalogo':            read('jo-formalizar-catalogo.md'),
  'dedicacao':           read('jo-formalizar-dedicacao.md'),
  'enquadramento-ict':   read('jo-formalizar-enquadramento-ict.md'),
  'nit':                 read('jo-formalizar-nit.md'),
  'politica-inovacao':   read('jo-formalizar-politica-inovacao.md'),
};

const VALID_FORMALIZAR_FRENTES = new Set<FormalizarFrente>([
  'portaria', 'catalogo', 'dedicacao',
  'enquadramento-ict', 'nit', 'politica-inovacao',
]);

export function isFormalizarFrente(value: unknown): value is FormalizarFrente {
  return typeof value === 'string'
    && VALID_FORMALIZAR_FRENTES.has(value as FormalizarFrente);
}

export type JoMode =
  | 'decisao'
  | 'possibilidades'
  | 'mapear'
  | 'estruturar'
  | 'formalizar'
  | 'construir'
  | 'avaliar'
  | 'manter';

export function getPromptForMode(
  mode: JoMode,
  frente?: FormalizarFrente | null,
): string {
  switch (mode) {
    case 'possibilidades': return JO_POSSIBILIDADES_PROMPT;
    case 'mapear':        return JO_MAPEAR_PROMPT;
    case 'estruturar':    return JO_ESTRUTURAR_PROMPT;
    case 'formalizar':
      // Modo modular — sem frente, fallback defensivo pra evitar carregar
      // prompt sem contexto. Frente='portaria' é o default mais conservador
      // (cria peça mais comumente acionada). Em produção a frente sempre vem
      // do sub-wizard; este fallback só pega chamadas malformadas.
      if (frente && VALID_FORMALIZAR_FRENTES.has(frente)) {
        return FORMALIZAR_FRENTE_PROMPTS[frente];
      }
      return FORMALIZAR_FRENTE_PROMPTS['portaria'];
    case 'construir':     return JO_CONSTRUIR_PROMPT;
    case 'avaliar':       return JO_AVALIAR_PROMPT;
    case 'manter':        return JO_MANTER_PROMPT;
    default:              return JO_DECISAO_PROMPT;
  }
}

// ============================================================
// Hooks do diagnóstico — suffix injetado na 1ª geração quando
// o usuário chega na Jô a partir de um card de gancho.
// hookId formato 'dim:response' → arquivo 'dim_response.md'.
// ============================================================

const HOOK_PROMPTS: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const [path, content] of Object.entries(hookModules)) {
    const match = path.match(/\/hooks\/([^/]+)\.md$/);
    if (!match) continue;
    const slug = match[1]; // ex: 'gargalo_prototipo'
    const id = slug.replace('_', ':'); // ex: 'gargalo:prototipo'
    out[id] = content;
  }
  return out;
})();

export function getHookSuffix(hookId: string | null | undefined): string | null {
  if (!hookId) return null;
  return HOOK_PROMPTS[hookId] ?? null;
}

export function buildSystemPrompt(
  mode: JoMode,
  hookId?: string | null,
  contextBlock?: string | null,
  frente?: FormalizarFrente | null,
): string {
  const base = getPromptForMode(mode, frente);
  const suffix = getHookSuffix(hookId);
  const parts: string[] = [];
  if (contextBlock && contextBlock.trim().length > 0) {
    parts.push(contextBlock);
  }
  parts.push(base);
  if (suffix) {
    parts.push('---');
    parts.push(suffix);
  }
  return parts.join('\n\n');
}
