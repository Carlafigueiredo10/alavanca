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
export const JO_ESTRUTURAR_PROMPT = read('jo-estruturar.md');

export type JoMode = 'decisao' | 'possibilidades' | 'estruturar';

export function getPromptForMode(mode: JoMode): string {
  if (mode === 'possibilidades') return JO_POSSIBILIDADES_PROMPT;
  if (mode === 'estruturar') return JO_ESTRUTURAR_PROMPT;
  return JO_DECISAO_PROMPT;
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

export function buildSystemPrompt(mode: JoMode, hookId?: string | null): string {
  const base = getPromptForMode(mode);
  const suffix = getHookSuffix(hookId);
  if (!suffix) return base;
  return base + '\n\n---\n\n' + suffix;
}
