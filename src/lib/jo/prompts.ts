const promptModules = import.meta.glob('../../prompts/*.md', {
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

export type JoMode = 'decisao' | 'possibilidades';

export function getPromptForMode(mode: JoMode): string {
  return mode === 'possibilidades' ? JO_POSSIBILIDADES_PROMPT : JO_DECISAO_PROMPT;
}
