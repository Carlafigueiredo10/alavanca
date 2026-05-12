// ============================================================
// Diagnóstico · matriz de ganchos derivados
// ----------------------------------------------------------------
// Cada (dimensão, resposta) → uma peça SEI-Ready que a Jô pode
// rascunhar. Quando duas dimensões puxam a mesma peça (mesmo
// pieceKey), o diagnóstico funde os cards e exibe justificativa
// cruzada.
// ============================================================

export type Dim = 'vocacao' | 'gargalo' | 'governanca' | 'equipe' | 'abertura' | 'identidade';

export type PieceType = 'nt' | 'minuta' | 'plano' | 'matriz' | 'protocolo' | 'blueprint' | 'catalogo' | 'memorando';

export type Verb = 'estruturar' | 'formalizar' | 'construir' | 'avaliar' | 'manter';

export type Answers = Record<Dim, string | null>;

export interface Hook {
  hookId: string;          // ex: 'vocacao:educador'
  dim: Dim;
  response: string;
  pieceKey: string;        // chave da peça (compartilhada entre dims)
  pieceType: PieceType;
  label: string;           // exibido no card
  prefillRequest: string;  // colado na textbox da Jô
  verb: Verb;              // verbo dono da peça (cf. §5 do plano-6-verbos.md)
}

export interface DedupedHook extends Hook {
  fromDims: Dim[];           // dimensões que apontaram para a mesma peça
  responsesByDim: Partial<Record<Dim, string>>;
}

export const PIECE_TYPE_LABEL: Record<PieceType, string> = {
  nt: 'Nota Técnica',
  minuta: 'Minuta',
  plano: 'Plano',
  matriz: 'Matriz',
  protocolo: 'Protocolo',
  blueprint: 'Blueprint',
  catalogo: 'Catálogo',
  memorando: 'Memorando',
};

export const VERB_LABEL: Record<Verb, string> = {
  estruturar: 'Estruturar',
  formalizar: 'Formalizar',
  construir: 'Construir',
  avaliar: 'Avaliar',
  manter: 'Manter',
};

// O detalhamento jurídico (Camada Tripartite, estrutura de Nota Técnica, caveat)
// vem injetado server-side via getHookSuffix() — não polui mais o pré-fill.

const HOOK_LIST: Hook[] = [
  // ── 01 · VOCAÇÃO ───────────────────────────────────────────
  {
    hookId: 'vocacao:desenvolvedor',
    dim: 'vocacao',
    response: 'desenvolvedor',
    pieceKey: 'piece:nt-encomenda-tecnologica',
    pieceType: 'nt',
    verb: 'formalizar',
    label: 'Nota Técnica de fundamentação para Encomenda Tecnológica (Lei 10.973/2004, art. 27)',
    prefillRequest:
      'Redija uma Nota Técnica fundamentando a contratação por Encomenda Tecnológica (Lei 10.973/2004, art. 27) para acelerar entrega de soluções, reduzindo dependência de fila de TI ou contratação convencional.',
  },
  {
    hookId: 'vocacao:facilitador',
    dim: 'vocacao',
    response: 'facilitador',
    pieceKey: 'piece:edital-desafio-publico',
    pieceType: 'minuta',
    verb: 'formalizar',
    label: 'Minuta de Edital de Desafio Público / Hackathon (modelo GNova)',
    prefillRequest:
      'Redija uma minuta de Edital de Desafio Público nos moldes praticados pelo GNova/ENAP, contemplando objeto, requisitos de participação, etapas, critérios de seleção e premiação.',
  },
  {
    hookId: 'vocacao:educador',
    dim: 'vocacao',
    response: 'educador',
    pieceKey: 'piece:plano-letramento',
    pieceType: 'plano',
    verb: 'estruturar',
    label: 'Plano de trilha de letramento em inovação para servidores',
    prefillRequest:
      'Elabore um Plano de trilha de letramento em inovação pública para servidores, com objetivos de aprendizagem, módulos, carga horária e indicadores de aprendizagem e de transferência para o trabalho.',
  },
  {
    hookId: 'vocacao:arquiteto',
    dim: 'vocacao',
    response: 'arquiteto',
    pieceKey: 'piece:nt-air',
    pieceType: 'nt',
    verb: 'avaliar',
    label: 'Nota Técnica de Análise de Impacto Regulatório (AIR)',
    prefillRequest:
      'Redija uma Nota Técnica de Análise de Impacto Regulatório (AIR) para a política em desenho, contemplando problema regulatório, alternativas, custos, benefícios e impactos diferenciais entre alternativas.',
  },

  // ── 02 · GARGALO ───────────────────────────────────────────
  {
    hookId: 'gargalo:ideacao',
    dim: 'gargalo',
    response: 'ideacao',
    pieceKey: 'piece:matriz-priorizacao',
    pieceType: 'matriz',
    verb: 'estruturar',
    label: 'Matriz de priorização esforço × impacto público (canvas decisório)',
    prefillRequest:
      'Elabore uma Matriz de priorização do backlog do lab cruzando esforço estimado e impacto público esperado, com critérios objetivos, escala de pontuação e recomendação de quais ideias avançar para protótipo.',
  },
  {
    hookId: 'gargalo:prototipo',
    dim: 'gargalo',
    response: 'prototipo',
    pieceKey: 'piece:minuta-sandbox',
    pieceType: 'minuta',
    verb: 'formalizar',
    label: 'Minuta de Sandbox Regulatório setorial para o piloto',
    prefillRequest:
      'Redija uma minuta de instrumento de Sandbox Regulatório setorial para autorizar piloto controlado da solução, contemplando escopo, salvaguardas, prazo de experimentação, indicadores de avaliação e mecanismos de saída.',
  },
  {
    hookId: 'gargalo:implementacao',
    dim: 'gargalo',
    response: 'implementacao',
    pieceKey: 'piece:minuta-cooperacao-tecnica',
    pieceType: 'minuta',
    verb: 'construir',
    label: 'Minuta de Termo de Cooperação Técnica com a unidade executora destinatária',
    prefillRequest:
      'Redija uma minuta de Termo de Cooperação Técnica para transferir o protótipo do lab à unidade executora destinatária, contemplando objeto, obrigações de cada parte, governança da operação e cronograma de transição.',
  },
  {
    hookId: 'gargalo:escala',
    dim: 'gargalo',
    response: 'escala',
    pieceKey: 'piece:plano-replicacao',
    pieceType: 'plano',
    verb: 'construir',
    label: 'Plano de Replicação Institucional com indicadores de adoção',
    prefillRequest:
      'Elabore um Plano de Replicação Institucional para escalar a solução validada para outras unidades/órgãos, com critérios de adesão, ativos transferíveis (manuais, código, fluxos), suporte técnico e indicadores de adoção.',
  },

  // ── 03 · GOVERNANÇA ────────────────────────────────────────
  {
    hookId: 'governanca:balcao',
    dim: 'governanca',
    response: 'balcao',
    pieceKey: 'piece:minuta-portaria-criacao',
    pieceType: 'minuta',
    verb: 'formalizar',
    label: 'Minuta de portaria de criação formal do lab',
    prefillRequest:
      'Redija uma minuta de portaria de criação formal do laboratório de inovação, com competências, mandato, vinculação hierárquica e composição mínima da equipe.',
  },
  {
    hookId: 'governanca:programa',
    dim: 'governanca',
    response: 'programa',
    pieceKey: 'piece:plano-alinhamento-estrategico',
    pieceType: 'plano',
    verb: 'manter',
    label: 'Plano de Alinhamento Estratégico com PPA / planejamento institucional',
    prefillRequest:
      'Elabore um Plano de Alinhamento Estratégico que conecte as entregas do lab às metas do PPA e ao planejamento institucional da casa, com mapa de contribuição, indicadores e ritos de prestação de contas à alta gestão.',
  },
  {
    hookId: 'governanca:estrategico',
    dim: 'governanca',
    response: 'estrategico',
    pieceKey: 'piece:matriz-kpis',
    pieceType: 'matriz',
    verb: 'avaliar',
    label: 'Matriz de KPIs de inovação pública (formato painel de gestão)',
    prefillRequest:
      'Elabore uma Matriz de KPIs de inovação pública, combinando indicadores qualitativos e quantitativos (esforço, entrega, adoção, impacto, aprendizado), em formato de painel de gestão pronto para diretoria.',
  },
  {
    hookId: 'governanca:patrocinado',
    dim: 'governanca',
    response: 'patrocinado',
    pieceKey: 'piece:plano-captacao',
    pieceType: 'plano',
    verb: 'formalizar',
    label: 'Plano de Captação via FNDCT / Finep / emendas parlamentares',
    prefillRequest:
      'Elabore um Plano de Captação de recursos não-orçamentários para o lab, considerando FNDCT, Finep, emendas parlamentares e parcerias via Marco Legal de CT&I, com janelas de submissão, instrumentos cabíveis e requisitos institucionais.',
  },

  // ── 04 · EQUIPE ────────────────────────────────────────────
  {
    hookId: 'equipe:conselheiro',
    dim: 'equipe',
    response: 'conselheiro',
    pieceKey: 'piece:nt-dedicacao-exclusiva',
    pieceType: 'nt',
    verb: 'formalizar',
    label: 'Nota Técnica fundamentando dedicação exclusiva da equipe',
    prefillRequest:
      'Redija uma Nota Técnica fundamentando a necessidade de dedicação exclusiva para o núcleo do lab, com base em normas de gestão de pessoas e demonstrando o custo de oportunidade da dedicação parcial atual.',
  },
  {
    hookId: 'equipe:facilitador-equipe',
    dim: 'equipe',
    response: 'facilitador-equipe',
    pieceKey: 'piece:protocolo-automacao-burocracia',
    pieceType: 'protocolo',
    verb: 'construir',
    label: 'Protocolo de automação de tarefas burocráticas recorrentes',
    prefillRequest:
      'Elabore um Protocolo de automação das tarefas burocráticas recorrentes da equipe (despachos, memorandos, minutas-padrão, atas), identificando o que pode ser delegado a IA assistida ou no-code para liberar a equipe enxuta para o relacionamento e o desenho.',
  },
  {
    hookId: 'equipe:lab-autonomo',
    dim: 'equipe',
    response: 'lab-autonomo',
    pieceKey: 'piece:minuta-regimento-dedicacao',
    pieceType: 'minuta',
    verb: 'formalizar',
    label: 'Minuta de alteração de regimento para dedicação plena',
    prefillRequest:
      'Redija uma minuta de alteração de regimento (ou portaria) para instituir a dedicação plena da equipe do lab, contemplando vinculação, perfil dos cargos, atribuições e mecanismos de blindagem da composição mínima.',
  },
  {
    hookId: 'equipe:lab-pleno',
    dim: 'equipe',
    response: 'lab-pleno',
    pieceKey: 'piece:plano-sucessao',
    pieceType: 'plano',
    verb: 'manter',
    label: 'Plano de Sucessão e Continuidade Institucional (blindagem entre gestões)',
    prefillRequest:
      'Elabore um Plano de Sucessão e Continuidade Institucional para o lab, contemplando ritos de passagem entre gestões, gestão do conhecimento, mandato técnico estável e mecanismos de blindagem em transições políticas.',
  },

  // ── 05 · ABERTURA ──────────────────────────────────────────
  {
    hookId: 'abertura:interna',
    dim: 'abertura',
    response: 'interna',
    pieceKey: 'piece:edital-desafio-publico',
    pieceType: 'minuta',
    verb: 'formalizar',
    label: 'Minuta de Edital de Desafio Público (modelo GNova)',
    prefillRequest:
      'Redija uma minuta de Edital de Desafio Público nos moldes praticados pelo GNova/ENAP, abrindo o desenho da solução à sociedade civil, academia e mercado, com objeto, etapas, critérios de seleção e premiação.',
  },
  {
    hookId: 'abertura:rede',
    dim: 'abertura',
    response: 'rede',
    pieceKey: 'piece:minuta-cooperacao-instituicoes',
    pieceType: 'minuta',
    verb: 'formalizar',
    label: 'Minuta de Acordo de Cooperação Técnica com instituições parceiras',
    prefillRequest:
      'Redija uma minuta de Acordo de Cooperação Técnica entre o lab e instituições parceiras (outros labs públicos, academia, terceiro setor), contemplando objeto compartilhado, contribuições recíprocas, governança e propriedade intelectual de entregas conjuntas.',
  },
  {
    hookId: 'abertura:cocriacao',
    dim: 'abertura',
    response: 'cocriacao',
    pieceKey: 'piece:protocolo-cocriacao',
    pieceType: 'protocolo',
    verb: 'construir',
    label: 'Protocolo de Cocriação com stakeholders',
    prefillRequest:
      'Elabore um Protocolo de Cocriação com stakeholders (cidadãos, especialistas, setor privado), com etapas, papéis, regras de decisão, devolutivas e indicadores de qualidade do processo participativo.',
  },
  {
    hookId: 'abertura:misto',
    dim: 'abertura',
    response: 'misto',
    pieceKey: 'piece:matriz-criterios-abertura',
    pieceType: 'matriz',
    verb: 'estruturar',
    label: 'Matriz de critérios para abrir vs. manter interno (decisão por projeto)',
    prefillRequest:
      'Elabore uma Matriz de critérios para decidir, projeto a projeto, quando abrir o desenho à cocriação externa e quando manter desenvolvimento interno, considerando complexidade, sensibilidade, prazo, capacidade da equipe e legitimidade.',
  },

  // ── 06 · IDENTIDADE ────────────────────────────────────────
  {
    hookId: 'identidade:invisivel',
    dim: 'identidade',
    response: 'invisivel',
    pieceKey: 'piece:memorando-apresentacao',
    pieceType: 'memorando',
    verb: 'formalizar',
    label: 'Memorando de Apresentação Institucional do Lab',
    prefillRequest:
      'Redija um Memorando de Apresentação Institucional do laboratório para circulação interna, deixando claro o que o lab faz, como acioná-lo e o que esperar (mapeamento Sano 2020 aponta "explicar o que é e como funciona" como dificuldade nº 1 dos labs brasileiros).',
  },
  {
    hookId: 'identidade:vitrine',
    dim: 'identidade',
    response: 'vitrine',
    pieceKey: 'piece:plano-catalogo-cases',
    pieceType: 'plano',
    verb: 'formalizar',
    label: 'Plano de Consolidação do Catálogo de Serviços a partir de Cases existentes',
    prefillRequest:
      'Elabore um Plano de Consolidação do Catálogo de Serviços do laboratório a partir de cases já entregues, transformando vitrine pontual em catálogo estruturado de oferta institucional (virada de chave da RNP Labs no I.LAB).',
  },
  {
    hookId: 'identidade:catalogo-informal',
    dim: 'identidade',
    response: 'catalogo-informal',
    pieceKey: 'piece:catalogo-servicos',
    pieceType: 'catalogo',
    verb: 'formalizar',
    label: 'Catálogo de Serviços do Laboratório de Inovação',
    prefillRequest:
      'Redija um Catálogo de Serviços do laboratório, peça-chave de identidade institucional. A literatura (Sano 2020, I.LAB, RNP Labs) é convergente: laboratórios que sobrevivem têm catálogo claro do que oferecem, para quem e como.',
  },
  {
    hookId: 'identidade:catalogo-formal',
    dim: 'identidade',
    response: 'catalogo-formal',
    pieceKey: 'piece:matriz-qualidade-catalogo',
    pieceType: 'matriz',
    verb: 'formalizar',
    label: 'Matriz de Qualidade e Plano de Revisão Periódica do Catálogo',
    prefillRequest:
      'Elabore Matriz de Qualidade do Catálogo de Serviços e Plano de Revisão Periódica, garantindo que o catálogo permaneça vivo, fiel à oferta real e útil ao demandante (sem isso, catálogos formais envelhecem e perdem credibilidade).',
  },
];

const HOOK_INDEX: Record<string, Hook> = HOOK_LIST.reduce<Record<string, Hook>>((acc, h) => {
  acc[h.hookId] = h;
  return acc;
}, {});

// Fonte da verdade pra prompts estruturados: a Jô só pode escolher chaves
// desta lista (eliminação de alucinação no diagnostic_tags do Mapear).
// Derivado em runtime de HOOK_LIST — nunca hardcode em outro lugar.
export const ALL_HOOK_IDS: readonly string[] = HOOK_LIST
  .map((h) => h.hookId)
  .sort();

export function getHook(dim: Dim, response: string): Hook | null {
  return HOOK_INDEX[`${dim}:${response}`] ?? null;
}

export function buildHooksFromAnswers(answers: Answers): Hook[] {
  const out: Hook[] = [];
  (Object.keys(answers) as Dim[]).forEach((dim) => {
    const r = answers[dim];
    if (!r) return;
    const h = getHook(dim, r);
    if (h) out.push(h);
  });
  return out;
}

export function dedupeHooks(hooks: Hook[]): DedupedHook[] {
  const byPiece = new Map<string, DedupedHook>();
  for (const h of hooks) {
    const existing = byPiece.get(h.pieceKey);
    if (existing) {
      existing.fromDims.push(h.dim);
      existing.responsesByDim[h.dim] = h.response;
    } else {
      byPiece.set(h.pieceKey, {
        ...h,
        fromDims: [h.dim],
        responsesByDim: { [h.dim]: h.response },
      });
    }
  }
  return Array.from(byPiece.values());
}

// ============================================================
// Pré-fill: monta o texto que vai pra textarea da Jô
// ============================================================

export interface PrefillInput {
  hook: DedupedHook | Hook;
  profileLine: string; // ex: "Vocação: Educador · Gargalo: Implementação · ..."
}

export function buildPrefillText({ hook, profileLine }: PrefillInput): string {
  return [
    '[ Contexto · diagnóstico Alavanca ]',
    profileLine,
    '',
    '[ Pedido ]',
    hook.prefillRequest,
  ].join('\n');
}
