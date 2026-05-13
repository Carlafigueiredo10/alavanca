// Geração de markdown por seção (arquitetura sections-first).
//
// Cada seção do JoPlan tem seu próprio prompt focado, com hard caps
// (anti-prolixidade). O LLM gera markdown puro — sem JSON wrapper, sem
// risco estrutural. Timeout afeta UMA seção.

import type { JoPlan, JoSection } from '../jo/response-types';
import type { Verb } from './server';

// Guidance específico por (verbo, sectionId). Define o foco do conteúdo —
// o boilerplate de hard caps vive em buildSectionPrompt() abaixo.
const SECTION_GUIDANCE: Record<string, string> = {
  // ── Estruturar · Blueprint de Sprint ────────────────────────
  'estruturar:fase-1-entender':
    'Atividades de descoberta (entrevistas, observação, análise de jornada). ' +
    'Foco em entender o problema. Liste 3-5 atividades com objetivo e entregável.',
  'estruturar:fase-2-explorar':
    'Atividades de ideação e prototipagem. Foco em explorar alternativas de intervenção. ' +
    'Liste 3-5 atividades com método (ex: brainstorm, sketches, lo-fi prototype).',
  'estruturar:fase-3-entregar':
    'Atividades de teste/validação do protótipo. Foco em medir o sinal de sucesso ' +
    'definido no wizard. Liste 3-5 atividades com instrumento de medição.',
  'estruturar:papeis-ritos':
    'Tabela enxuta com 2 colunas (Papel · Atribuição) + lista de ritos (reuniões, ' +
    'cadência). Sem inventar nomes; refira-se a cargos do input.',
  'estruturar:cronograma':
    'Cronograma denso: cada uma das 3 fases com duração estimada e 1-2 marcos. ' +
    'Use formato tabular (Fase · Duração · Marco) ou bullets compactos.',
  'estruturar:indicadores':
    'Liste 3-5 indicadores quantitativos pra acompanhar o experimento (ancorados ' +
    'no sinal de sucesso). Cada um com nome, fórmula curta e meta numérica.',
  'estruturar:caveat':
    'Parágrafo único (≤80 palavras) sobre limitações operacionais, dependências ' +
    'jurídicas e ressalva de validação institucional antes de execução.',

  // ── Mapear · Relatório de Diagnóstico Institucional ─────────
  'mapear:identificacao':
    'Identificação institucional: ator principal (lab + órgão + esfera), atores envolvidos ' +
    '(nominados quando o usuário forneceu — usar literalmente "ator não nominado" se não), ' +
    'momento (janela política), tema/serviço. Bullets compactos. Preserve nomes do input.',
  'mapear:considerandos':
    'Considerandos invocando EXCLUSIVAMENTE a trinca: (i) IN Conjunta 01/2016 CGU/MP ' +
    '(gestão de riscos, segurança razoável, erro mapeado como aprendizado); (ii) CF/88 ' +
    'art. 37 (eficiência, impessoalidade); (iii) Lei 13.655/2018 LINDB art. 20 ' +
    '(consequencialismo, erro legítimo). Quando aplicável: LAI e normas internas. ' +
    'PROIBIDO invocar Lei 14.129, Marco CT&I (10.973/13.243), Lei 14.133, LC 182, Guia AGU. ' +
    '3-5 considerandos no formato "CONSIDERANDO o disposto em ...".',
  'mapear:analise-risco-familias':
    'Análise por família — uma sub-seção por família DISPARADA pelo input (não force as 3). ' +
    'Famílias possíveis: 3.1 Metodológico-Infraestrutura · 3.2 Jurídico-Regulatório · ' +
    '3.3 Político-Descontinuidade. Para cada risco: nome curto, evidência citada do input, ' +
    'Probabilidade (Baixa/Média/Alta + frase de lastro), Impacto (mesma escala + lastro), ' +
    'Verbo de mitigação. Se família não tem evidência, omita-a inteiramente.',
  'mapear:matriz-e-decisao':
    'Matriz de Riscos consolidada (tabela: # · Risco · Família · Prob. · Impacto · Verbo · ' +
    'Prioridade) + Diretriz Go/No-Go textual com justificativa de 2-4 linhas + Roteamento ' +
    'numerado (1º Verbo X — pergunta inicial pronta pra colar; 2º Verbo Y — pergunta inicial...). ' +
    'A decisão Go/No-Go formal está no campo JSON `goNoGo` — aqui é a justificativa textual.',
  'mapear:caveat-fundamentacao':
    'Bloco "Da Fundamentação" enxuto (Base Estruturante: CF 37 · Norma Operacional: IN 01/2016 · ' +
    'Lastro consequencialista: LINDB · Norma interna se declarada). Em seguida, Caveat Institucional ' +
    'literal: "Esta peça é rascunho técnico-analítico... [ver jo-mapear.md item 7 §Caveat]". ' +
    'Se goNoGo = NO_GO, adicionar parágrafo de roteamento ao foro adequado (controle interno, ' +
    'Procuradoria, AGU, MP, Judiciário).',

  // ── Avaliar · Plano de Avaliação ────────────────────────────
  'avaliar:contextualizacao-pergunta':
    'Síntese da intervenção (1 parágrafo) + enunciado da pergunta de avaliação ' +
    '("A intervenção produziu redução observável e atribuível em X?"). ≤150 palavras.',
  'avaliar:teoria-mudanca':
    'Cadeia causal explícita: Insumos → Atividades → Outputs → Outcomes → Impacto. ' +
    'Use bullets compactos. Identifique hipóteses implícitas a testar (especialmente ' +
    'atribuição: "redução decorre da intervenção, não de fator externo concomitante"). ' +
    'Recomende desenho quase-experimental quando aplicável.',
  'avaliar:criterios-dac':
    'Quais dos 6 critérios OCDE/DAC se aplicam ao caso e por quê: Relevância · Coerência · ' +
    'Eficácia · Eficiência · Impacto · Sustentabilidade. Não cobrir os 6 sempre — escolher ' +
    'os pertinentes (3-4 tipicamente) e justificar omissões em 1 frase.',
  'avaliar:matriz-indicadores':
    'Tabela com colunas: Indicador · Dimensão de Valor (Administrativa/Cidadã/Societal/Econômica) · ' +
    'Categoria (Processo/Outcome) · Definição · Fonte · Instrumento de coleta · Frequência · ' +
    'Meta · Limite de alerta · **Justificativa de Enquadramento** (≤200 chars explicando por que ' +
    'aquele resultado impacta aquela dimensão). 4-6 indicadores. ' +
    'CRÍTICO: backoffice → APENAS Administrativa+Econômica; serviço-fim → ao menos 1 Cidadã ou Societal.',
  'avaliar:plano-coleta-salvaguardas':
    'Plano de coleta (quando, quem, como armazena, como audita) + Salvaguardas anti-viés (quem ' +
    'avalia NÃO pode ser quem executou; recomendar ENAP, universidade, CGU ou comitê interno). ' +
    'Se houver risco de viés, ALERTAR explicitamente.',
  'avaliar:caveat-fundamentacao':
    'Bloco "Da Fundamentação" (Base: Lei 14.129/2021 art.18, CF 37; Norma Operacional: orientações ' +
    'da Casa Civil de M&A; Lacuna quando aplicável). Caveat literal: "Esta peça é rascunho técnico ' +
    'para subsidiar análise das áreas de monitoramento, controle interno e direção. Indicadores ' +
    'devem ser pactuados formalmente com a unidade executora antes de servirem como base de prestação de contas."',

  // ── Construir · Plano de Implementação + Handoff (LABORI/AGU) ─────
  'construir:contextualizacao':
    'Síntese da solução validada (1 parágrafo) + nominação da unidade executora destinatária. ' +
    'Mencione métricas do piloto se houver. ≤150 palavras.',
  'construir:caminho-vale-da-morte':
    'Indique qual instrumento da Cadeia Vale da Morte cabe ao caso: (a) Encomenda Tec ' +
    '(Lei 10.973 art.27 — quando solução não existe no mercado e há risco técnico); ' +
    '(b) CPSI (Lei 14.133 + Lei Gov Digital — quando há viabilidade de competição); ' +
    '(c) Sandbox AGU (ambiente controlado pré-escala). Justifique a escolha em 2-3 bullets.',
  'construir:plano-tecnico':
    'Plano técnico denso: stack escolhida (1 linha), requisitos de infra (2-3 bullets), ' +
    'sprints com prazos (tabela: Sprint · Duração · Entregável), papéis técnicos (lista). ' +
    'Use formato tabular onde couber.',
  'construir:handoff-descontinuidade':
    'DUAS sub-seções obrigatórias quando Sandbox/CPSI:\n' +
    '(1) Transição para Regulação Plena (sucesso): unidade executora assume operação, ' +
    '  suporte residual com prazo, edição de IN consolidando o canal.\n' +
    '(2) Plano de Descontinuidade Planejada (falha): critério de falha, protocolo de ' +
    '  desligamento (72h), redirecionamento ao atendimento humano, comunicação aos ' +
    '  afetados, proteção de dados (expurgo, DPO).\n' +
    'NÃO-NEGOCIÁVEL: este item é exigido pelo Guia AGU de Sandbox.',
  'construir:tct-minuta':
    'Minuta enxuta de Termo de Cooperação Técnica: Objeto · Obrigações da unidade executora · ' +
    'Obrigações do Lab · Governança · Cronograma de transição · Suporte residual (60-180 dias) · ' +
    'Critérios de encerramento. Use bullets.',
  'construir:caveat-fundamentacao':
    'Bloco "Da Fundamentação" tripartite: Base Estruturante (Lei 14.129/2021 · Lei 10.973/2004 c/ ' +
    'redação 13.243 · Lei 14.133/2021 conforme aplicável); Norma Operacional (decretos regulamentares, ' +
    'INs do órgão central, normas internas TI/segurança); Lacuna Normativa quando aplicável. ' +
    'Caveat literal: "Esta peça é rascunho técnico para subsidiar análise das áreas de tecnologia, ' +
    'jurídica e da unidade executora. A execução depende de instrumento formal e de aceite expresso ' +
    'da unidade destinatária."',

  // ── Manter · Pacote de Continuidade Institucional ──────────
  'manter:dossie-transicao':
    'Dossiê denso (peça principal): A.1 Sumário Executivo (1 parágrafo: missão + 3 entregas centrais ' +
    'com lastro nominado + ato seguinte recomendado); A.2 Mapa de Entregas tripartite (Normativo · ' +
    'Operacional · Outcome) em formato tabular ou bullets; A.3 Indicadores de Impacto Acumulado (com ' +
    'lastro de coleta + janela temporal + salvaguardas anti-viés); A.4 Riscos e Recomendações ' +
    '(INCLUI alerta de patrocinador único quando Step 3 indicar). Use sub-headers ### A.1, A.2, etc.',
  'manter:briefing-executivo':
    'Briefing executivo (defesa rápida): formato A.4 + roteiro de slides equivalente. ' +
    '[ABERTURA · 30s] 1 frase de missão + 3 entregas centrais. **EMBUTIR ALERTA DE PATROCINADOR ÚNICO ' +
    'AQUI** quando aplicável (literal: "⚠ ALERTA DE FRAGILIDADE INSTITUCIONAL · A continuidade ' +
    'depende exclusivamente de [Nome]. Recomenda-se diversificação imediata..."). ' +
    '[CUSTO DE NÃO MANTER · 90s] OBRIGATÓRIO 4 vetores: (i) Investimento sunk perdido; ' +
    '(ii) Outcomes que param; (iii) Ativos que viram passivo; (iv) Capital institucional reputacional. ' +
    'Quantificar quando possível. Sem lastro num vetor → declarar "não há indicador medido". ' +
    '[RECOMENDAÇÃO · 60s] 3 atos seguintes com responsável e prazo.',
  'manter:plano-sustentabilidade':
    'Peça SEI-Ready autônoma: C.1 Identificação institucional (cabeçalho do órgão); ' +
    'C.2 Diagnóstico de Sustentação (quem patrocina, onde está frágil); C.3 Mapa de Stakeholders ' +
    'Críticos (NOMINADOS, não categorias) com vínculo institucional, grau de dependência, sinais de ' +
    'risco — alerta de patrocinador único explícito aqui se aplicável; C.4 Pedido Estruturado de ' +
    'Continuidade (orçamento item-valor-justificativa · funções comissionadas · alocação de horas · ' +
    'infraestrutura); C.5 Estratégia de Ecossistema (redes declaradas + instrumento cabível).',
  'manter:minutas-adesao-redes':
    'Uma SUB-SEÇÃO autônoma por rede declarada no Step 4. Padrão SEI: cabeçalho institucional · ' +
    '3-5 considerandos · cláusulas (objeto · obrigações recíprocas · governança · vigência · denúncia) · ' +
    'Da Fundamentação · caveat. Redes mapeadas + instrumento canônico:\n' +
    '- InovaGov → Acordo de Cooperação Técnica (Rede Federal de Inovação, Enap)\n' +
    '- RenovaJud → Termo de Adesão (Rede de Inovação do Poder Judiciário, CNJ)\n' +
    '- LISP → Ofício de Solicitação de Inserção no "Mapeamento LISP Brasil — plataforma do ' +
    'Observatório de Laboratórios de Inovação no Setor Público da UFRN, construída a partir da ' +
    'metodologia de diagnóstico da Enap" + Ficha de Caracterização. AUTO-CORRIGIR silenciosamente ' +
    'qualquer menção a "filiar-se ao LISP" pra esta nomenclatura completa.',
  'manter:caveat-fundamentacao':
    'Bloco "Da Fundamentação" tripartite (Base · Operacional · Lacuna). Caveat literal: ' +
    '"Este pacote de continuidade institucional é composição rigorosa de peças já produzidas. Toda ' +
    'afirmação aqui é rastreável às peças listadas no apêndice. Distorção, omissão ou ampliação ' +
    'retórica enfraquece o laboratório na próxima auditoria — não fortalece."',
};

// Constrói o system prompt da seção. Curto, focado, com hard caps explícitos.
export function buildSectionPrompt(
  verb: Verb,
  plan: JoPlan,
  section: JoSection,
): { system: string; user: string } {
  const guidance = SECTION_GUIDANCE[`${verb}:${section.id}`] ?? 'Conteúdo livre da seção.';

  // Seções já preenchidas viram contexto (pra evitar repetição).
  const prior = plan.sections
    .filter((s) => s.markdown.length > 0 && s.id !== section.id)
    .map((s) => `### ${s.title}\n${s.markdown}`)
    .join('\n\n');

  const system = [
    'Você está gerando UMA SEÇÃO específica de um documento técnico-jurídico',
    'do setor público brasileiro. Sua saída será concatenada às demais seções.',
    '',
    'REGRAS ABSOLUTAS:',
    '- Saída em MARKDOWN puro. Sem JSON. Sem code fences. Sem prefixo "##".',
    '- Comece DIRETAMENTE no conteúdo — o título da seção é renderizado pelo sistema.',
    '- Máximo 500 palavras nesta seção. Frases curtas, densas.',
    '- Máximo 5 bullets em listas. Tabelas só quando úteis.',
    '- NÃO repita conteúdo de seções anteriores (mostradas abaixo).',
    '- Linguagem formal de administração pública. Sem adjetivos vazios.',
    '',
    'GUIDANCE DESTA SEÇÃO:',
    guidance,
  ].join('\n');

  const user = [
    `[Documento: ${plan.title}]`,
    `[Resumo: ${plan.summary}]`,
    '',
    prior
      ? `[Seções já escritas — NÃO repetir]:\n\n${prior}`
      : '[Esta é a primeira seção a ser escrita.]',
    '',
    `[Gere agora a seção: "${section.title}"]`,
  ].join('\n');

  return { system, user };
}

// Schema mínimo dos planos — usado pra validar/inicializar quando o LLM erra
// o id/título de uma seção. Cada array bate com o contract do verbo correspondente.
export const ESTRUTURAR_SECTIONS: ReadonlyArray<{ id: string; title: string }> = [
  { id: 'fase-1-entender', title: 'Fase 1 — Entender' },
  { id: 'fase-2-explorar', title: 'Fase 2 — Explorar' },
  { id: 'fase-3-entregar', title: 'Fase 3 — Entregar' },
  { id: 'papeis-ritos',    title: 'Papéis e Ritos' },
  { id: 'cronograma',      title: 'Cronograma' },
  { id: 'indicadores',     title: 'Indicadores' },
  { id: 'caveat',          title: 'Caveat Jurídico' },
];

export const MAPEAR_SECTIONS: ReadonlyArray<{ id: string; title: string }> = [
  { id: 'identificacao',         title: 'Identificação Institucional' },
  { id: 'considerandos',         title: 'Considerandos' },
  { id: 'analise-risco-familias', title: 'Análise de Risco por Família' },
  { id: 'matriz-e-decisao',      title: 'Matriz de Riscos e Diretriz Go/No-Go' },
  { id: 'caveat-fundamentacao',  title: 'Da Fundamentação e Caveat' },
];

export const AVALIAR_SECTIONS: ReadonlyArray<{ id: string; title: string }> = [
  { id: 'contextualizacao-pergunta',   title: 'Contextualização e Pergunta de Avaliação' },
  { id: 'teoria-mudanca',              title: 'Teoria de Mudança' },
  { id: 'criterios-dac',               title: 'Critérios DAC Aplicáveis' },
  { id: 'matriz-indicadores',          title: 'Matriz de Indicadores' },
  { id: 'plano-coleta-salvaguardas',   title: 'Plano de Coleta e Salvaguardas Anti-Viés' },
  { id: 'caveat-fundamentacao',        title: 'Da Fundamentação e Caveat' },
];

export const CONSTRUIR_SECTIONS: ReadonlyArray<{ id: string; title: string }> = [
  { id: 'contextualizacao',       title: 'Contextualização e Objetivo' },
  { id: 'caminho-vale-da-morte',  title: 'Caminho na Cadeia Vale da Morte' },
  { id: 'plano-tecnico',          title: 'Plano de Implementação Técnica' },
  { id: 'handoff-descontinuidade', title: 'Plano de Handoff e Descontinuidade' },
  { id: 'tct-minuta',             title: 'Termo de Cooperação Técnica (minuta)' },
  { id: 'caveat-fundamentacao',   title: 'Da Fundamentação e Caveat' },
];

export const MANTER_SECTIONS: ReadonlyArray<{ id: string; title: string }> = [
  { id: 'dossie-transicao',       title: 'Dossiê de Transição Institucional' },
  { id: 'briefing-executivo',     title: 'Briefing Executivo de Transição' },
  { id: 'plano-sustentabilidade', title: 'Plano de Sustentabilidade e Ecossistema' },
  { id: 'minutas-adesao-redes',   title: 'Minutas de Adesão à Rede' },
  { id: 'caveat-fundamentacao',   title: 'Da Fundamentação e Caveat' },
];
