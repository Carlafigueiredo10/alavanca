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

// Derivados da fonte — nunca repita o número em copy ou hero.
// Use estes valores em vez de "19", "6" ou "Dezenove" literais.
export const promptCount = allPrompts.length;
export const eixoCount = eixos.length;
export const methodEixoCount = eixos.filter((e) => e.id !== 'aplicar').length;

const NUM_PT: Record<number, string> = {
  1: 'Um', 2: 'Dois', 3: 'Três', 4: 'Quatro', 5: 'Cinco', 6: 'Seis',
  7: 'Sete', 8: 'Oito', 9: 'Nove', 10: 'Dez', 11: 'Onze', 12: 'Doze',
  13: 'Treze', 14: 'Catorze', 15: 'Quinze', 16: 'Dezesseis', 17: 'Dezessete',
  18: 'Dezoito', 19: 'Dezenove', 20: 'Vinte',
  21: 'Vinte e um', 22: 'Vinte e dois', 23: 'Vinte e três', 24: 'Vinte e quatro',
  25: 'Vinte e cinco', 26: 'Vinte e seis', 27: 'Vinte e sete', 28: 'Vinte e oito',
  29: 'Vinte e nove', 30: 'Trinta', 40: 'Quarenta', 50: 'Cinquenta',
};

// Número por extenso, capitalizado. Cai pra dígito se passar do mapa.
export function numToPt(n: number): string {
  return NUM_PT[n] ?? String(n);
}

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
