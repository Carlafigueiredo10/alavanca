export type EixoId = 'estruturar' | 'formalizar' | 'construir' | 'avaliar' | 'provar' | 'aplicar';

export interface Eixo {
  id: EixoId;
  num: string;
  verb: string;
  dek: string;
  note: string;
}

export interface Prompt {
  id: string;        // p01, p02, …, p19
  num: string;       // '01', '02', …, '19'
  eixoId: EixoId;
  eyebrow: string;
  title: string;
  purpose: string;
  promptLabel: string;
  body: string;      // HTML template literal — preserve exactly
  when: string;
}
