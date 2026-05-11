import type { Prompt } from './_types';
import { eixos } from './eixos';
import { estruturarPrompts } from './estruturar';
import { formalizarPrompts } from './formalizar';
import { construirPrompts } from './construir';
import { avaliarPrompts } from './avaliar';
import { provarPrompts } from './provar';
import { aplicarPrompts } from './aplicar';

export { eixos } from './eixos';
export type { Eixo, Prompt, EixoId } from './_types';

export const allPrompts: Prompt[] = [
  ...estruturarPrompts,
  ...formalizarPrompts,
  ...construirPrompts,
  ...avaliarPrompts,
  ...provarPrompts,
  ...aplicarPrompts,
];

export function getPromptBySlug(slug: string): Prompt | undefined {
  return allPrompts.find((p) => p.id === slug);
}

export function getPromptsByEixo(eixoId: string): Prompt[] {
  return allPrompts.filter((p) => p.eixoId === eixoId);
}

// For prev/next navigation within the same eixo
export function getNeighbors(slug: string): { prev: Prompt | null; next: Prompt | null } {
  const current = getPromptBySlug(slug);
  if (!current) return { prev: null, next: null };
  const sibs = getPromptsByEixo(current.eixoId);
  const idx = sibs.findIndex((p) => p.id === slug);
  return {
    prev: idx > 0 ? sibs[idx - 1] : null,
    next: idx < sibs.length - 1 ? sibs[idx + 1] : null,
  };
}
