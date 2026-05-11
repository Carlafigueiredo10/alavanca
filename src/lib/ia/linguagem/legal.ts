/**
 * Base normativa carregada no sistema-prompt do módulo Adequa.
 *
 * Lista FECHADA — o modelo não deve inventar normas fora daqui.
 * Para sugestões sem base normativa específica, usar basis.type = 'best_practice' | 'style' | 'consistency'
 * em vez de inventar respaldo legal.
 *
 * Cada item vira parte do system prompt (com prompt caching no Claude).
 */

export type NormativeSource = {
  id: string;
  norm: string;            // citação curta (ex: "Lei 12.527/2011")
  long_name: string;       // nome completo
  article?: string;        // artigo aplicável, se específico
  scope: string[];         // públicos / contextos para os quais é relevante
  excerpt: string;         // trecho aplicável (curto, pra caber no prompt)
};

export const NORMATIVE_BASE: NormativeSource[] = [
  {
    id: 'lei-14129-2021',
    norm: 'Lei 14.129/2021',
    long_name: 'Lei do Governo Digital',
    article: 'Art. 3º, IV',
    scope: ['cidadao', 'cidadao_vulneravel', 'servidor_par', 'tecnico_outra_area', 'gestor'],
    excerpt:
      'Princípio da linguagem clara e acessível: o Estado deve se comunicar com a sociedade em linguagem que permita a compreensão por qualquer cidadão.',
  },
  {
    id: 'lei-12527-2011',
    norm: 'Lei 12.527/2011',
    long_name: 'Lei de Acesso à Informação (LAI)',
    article: 'Art. 8º',
    scope: ['cidadao', 'cidadao_vulneravel', 'imprensa'],
    excerpt:
      'A divulgação de informações de interesse público deve ser feita em linguagem de fácil compreensão.',
  },
  {
    id: 'decreto-9758-2019',
    norm: 'Decreto 9.758/2019',
    long_name: 'Pronomes de tratamento na administração pública federal',
    scope: ['cidadao', 'servidor_par', 'tecnico_outra_area', 'gestor'],
    excerpt:
      'Dispensa pronomes de tratamento como "Vossa Excelência", "Vossa Senhoria" etc. Padrão: "você" e "senhor(a)".',
  },
  {
    id: 'decreto-9094-2017',
    norm: 'Decreto 9.094/2017',
    long_name: 'Carta de Serviços ao Usuário',
    scope: ['cidadao', 'cidadao_vulneravel'],
    excerpt:
      'A Carta de Serviços deve usar linguagem clara, sem termos técnicos, com informações sobre prazos, requisitos e formas de prestação.',
  },
  {
    id: 'lei-13460-2017',
    norm: 'Lei 13.460/2017',
    long_name: 'Código de Defesa do Usuário do Serviço Público',
    scope: ['cidadao', 'cidadao_vulneravel'],
    excerpt:
      'Direito do usuário a informações precisas, claras e em tempo razoável sobre o serviço público.',
  },
  {
    id: 'cf-art-37',
    norm: 'Constituição Federal',
    long_name: 'Constituição da República Federativa do Brasil',
    article: 'Art. 37',
    scope: ['orgao_controle', 'gestor', 'audiencia_academica'],
    excerpt:
      'Princípios da administração pública: legalidade, impessoalidade, moralidade, publicidade e eficiência.',
  },
  {
    id: 'cnj-343-2020',
    norm: 'Resolução CNJ 343/2020',
    long_name: 'Linguagem Simples no Judiciário (referência transversal)',
    scope: ['cidadao', 'cidadao_vulneravel', 'tecnico_outra_area'],
    excerpt:
      'Diretrizes de linguagem simples aplicáveis a comunicação pública: voz ativa, frases curtas, vocabulário comum, evitar latinismos e jargão.',
  },
];

/**
 * Diretrizes não-normativas: usar como basis.type = 'best_practice'
 * com source apontando para o instrumento.
 */
export const BEST_PRACTICE_SOURCES = {
  'gov.br': 'gov.br Design System · Diretrizes de Linguagem',
  manual_redacao: 'Manual de Redação da Presidência da República',
  plain_language: 'Plain Language International — princípios universais',
  cnj_343: 'Resolução CNJ 343/2020 — quando aplicada fora do Judiciário como boa prática',
} as const;

export type BestPracticeSource = keyof typeof BEST_PRACTICE_SOURCES;
