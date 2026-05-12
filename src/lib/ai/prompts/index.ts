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
export const JO_FORMALIZAR_PROMPT = read('jo-formalizar.md');
export const JO_CONSTRUIR_PROMPT = read('jo-construir.md');
export const JO_AVALIAR_PROMPT = read('jo-avaliar.md');
export const JO_MANTER_PROMPT = read('jo-manter.md');

export type JoMode =
  | 'decisao'
  | 'possibilidades'
  | 'mapear'
  | 'estruturar'
  | 'formalizar'
  | 'construir'
  | 'avaliar'
  | 'manter';

export function getPromptForMode(mode: JoMode): string {
  switch (mode) {
    case 'possibilidades': return JO_POSSIBILIDADES_PROMPT;
    case 'mapear':        return JO_MAPEAR_PROMPT;
    case 'estruturar':    return JO_ESTRUTURAR_PROMPT;
    case 'formalizar':    return JO_FORMALIZAR_PROMPT;
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
): string {
  const base = getPromptForMode(mode);
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
