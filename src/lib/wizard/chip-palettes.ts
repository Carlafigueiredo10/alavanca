// Catálogo de chips por campo de wizard. Cada palette agrupa itens recorrentes
// no domínio público — o user clica pra concatenar ao textarea, ou digita livre.
// A ordem dos arrays em MAPEAR_PALETTES bate com a ordem das telas do wizard
// (1 = Cenário, 2 = Atores, 3 = Gargalo, 4 = Risco).

export interface ChipGroup {
  label: string;     // título exibido sobre a fileira de chips
  chips: string[];   // texto exibido = texto inserido no textarea
}

// Matriz de coerência entre grupos: define quais chips do grupo dependente
// fazem sentido pra cada chip do grupo "pai". Chips fora da matriz ficam
// dimmed visualmente (não bloqueados — Carla pode escolher mesmo assim,
// mas o destaque ajuda a evitar combinações que a Jô rejeita por
// incoerência semântica.
export interface CoherenceRule {
  dependsOn: string;                    // label do grupo "pai"
  map: Record<string, readonly string[]>; // chip do pai → chips do dependente coerentes
}

// Campo livre de input (acima dos chips). Usado pra dados nominais que
// não cabem em chip fechado (ex: nome do órgão específico, identificação
// nominal de stakeholder). Composer recebe os valores junto com os chips.
//
// type='text' (default): input texto livre.
// type='month-year': input <input type="month"> nativo do browser, devolve
//   "YYYY-MM" — composer pode formatar como "MM/YYYY" pt-BR.
export interface FreeField {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'month-year';
}

// composer (opcional): ativa modo template — chips passam a regenerar o
// textarea via composer(activeByGroup, freeValues). Multi-pick por grupo:
// cada grupo pode ter 0..N chips ativos. composer recebe também valores
// dos campos livres (FreeField) declarados em freeFields.
//
// coherence (opcional): rules de compatibilidade entre grupos. Aplicado
// só visualmente (chips incoerentes ficam dimmed). Não bloqueia seleção.
//
// freeFields (opcional): inputs livres renderizados acima dos chips.
// Composer recebe os valores como Map<key, value> no segundo argumento.
export interface ChipPalette {
  groups: ChipGroup[];
  composer?: (
    activeByGroup: Map<string, string[]>,
    freeValues: Map<string, string>,
  ) => string;
  coherence?: Record<string, CoherenceRule>;
  freeFields?: FreeField[];
}

// ============================================================
// ESTRUTURAR · Sprint Blueprint · 3 campos
// (Problema · Hipótese · Experimento)
// ============================================================
export const ESTRUTURAR_PALETTES: ChipPalette[] = [
  // ── 01 · PROBLEMA ──
  // Composer monta frase contextualizada que a Jô exige no contract:
  // serviço + órgão + impacto observável. Sem isso a Jô bloqueia
  // ("Especifique o órgão ou entidade onde o atendimento ocorre").
  // freeField "orgao_nome": campo livre obrigatório pra nominação do órgão
  // — a Jô SEMPRE pede isso, então adiantamos como input dedicado.
  {
    freeFields: [
      {
        key: 'orgao_nome',
        label: 'Nome do órgão (a Jô vai precisar)',
        placeholder: 'Ex: Secretaria de Saúde do Estado de SP, INSS, Tribunal de Contas do Município de Recife',
      },
    ],
    groups: [
      {
        label: 'Esfera',
        chips: ['Federal', 'Estadual', 'Municipal', 'Distrital'],
      },
      {
        label: 'Tipo de órgão',
        chips: [
          'Secretaria', 'Autarquia', 'Fundação', 'Empresa pública',
          'Agência reguladora', 'Tribunal', 'Ministério Público',
          'Universidade pública',
        ],
      },
      {
        label: 'Serviço atingido',
        chips: [
          'Atendimento ao cidadão', 'Cadastro', 'Concessão de benefício',
          'Habilitação', 'Licenciamento', 'Fiscalização', 'Perícia',
          'Análise técnica', 'Tramitação processual', 'Pagamento',
        ],
      },
      {
        label: 'Tipo de dor',
        chips: [
          'Evasão', 'Tempo de espera elevado', 'Atraso na entrega',
          'Retrabalho', 'Erro de processamento', 'Reclamação recorrente',
          'Custo elevado', 'Acesso desigual', 'Não-uso pelo público-alvo',
        ],
      },
      {
        label: 'Magnitude observável',
        chips: [
          'Afeta > 30% dos usuários', 'Centenas por mês', 'Milhares por mês',
          'Custo anual estimado', 'Dias de atraso médio',
          'Reclamações recorrentes em ouvidoria',
        ],
      },
    ],
    composer: (active, free) => {
      const esferas = active.get('Esfera') ?? [];
      const orgaos = active.get('Tipo de órgão') ?? [];
      const servicos = active.get('Serviço atingido') ?? [];
      const dores = active.get('Tipo de dor') ?? [];
      const magnitudes = active.get('Magnitude observável') ?? [];
      const orgaoNome = (free.get('orgao_nome') ?? '').trim();

      const total = esferas.length + orgaos.length + servicos.length + dores.length + magnitudes.length;
      if (total === 0 && orgaoNome.length === 0) return '';

      const join = (arr: string[], lower = false): string => {
        const fmt = (s: string) => (lower ? s.toLowerCase() : s);
        if (arr.length === 0) return '';
        if (arr.length === 1) return fmt(arr[0]);
        if (arr.length === 2) return `${fmt(arr[0])} e ${fmt(arr[1])}`;
        return arr.slice(0, -1).map(fmt).join(', ') + ` e ${fmt(arr[arr.length - 1])}`;
      };

      // Bloco 1: contexto institucional. Se nominado, usa o nome direto;
      // senão monta a partir de esfera + tipo de órgão.
      const ctxParts: string[] = [];
      if (orgaoNome.length > 0) {
        // "Na Secretaria de Saúde do Estado de SP (estadual · secretaria)"
        const tags: string[] = [];
        if (esferas.length > 0) tags.push(join(esferas, true));
        if (orgaos.length > 0) tags.push(join(orgaos, true));
        const tagStr = tags.length > 0 ? ` (${tags.join(' · ')})` : '';
        ctxParts.push(`No(a) ${orgaoNome}${tagStr}`);
      } else if (esferas.length > 0 || orgaos.length > 0) {
        const partes: string[] = [];
        if (esferas.length > 0) partes.push(`âmbito ${join(esferas, true)}`);
        if (orgaos.length > 0) partes.push(`em ${join(orgaos, true)}`);
        ctxParts.push(partes.join(' '));
      }

      // Bloco 2: serviço e dor
      const servParts: string[] = [];
      if (servicos.length > 0) {
        servParts.push(`${servicos.length === 1 ? 'o serviço de' : 'os serviços de'} ${join(servicos, true)}`);
      }
      if (dores.length > 0) {
        const verbo = servicos.length > 0 ? 'enfrenta' : 'há';
        servParts.push(`${verbo} ${join(dores, true)}`);
      }

      // Bloco 3: magnitude
      const magStr = magnitudes.length > 0
        ? `, ${magnitudes.length === 1 ? 'afetando' : 'com indicadores de'} ${join(magnitudes, true)}`
        : '';

      const ctx = ctxParts.length > 0 ? ctxParts.join(' ') + ': ' : '';
      const meio = servParts.join(' ');
      const ponto = meio.length > 0 || magStr.length > 0 ? '.' : '';

      const out = (ctx + meio + magStr + ponto).trim();
      const finalStr = out.length > 0 ? out[0].toUpperCase() + out.slice(1) : '';

      // Aviso só quando NÃO tem nome nominado (é o que a Jô vai cobrar)
      const suffix = orgaoNome.length === 0 && (orgaos.length > 0 || esferas.length > 0)
        ? '\n\n[A Jô vai pedir o nome específico do órgão — preencha no campo "Nome do órgão" acima].'
        : '';
      return finalStr + suffix;
    },
  },

  // ── 02 · HIPÓTESE ──
  // Modo template: 3 grupos compõem a frase Se [intervenção via mecanismo],
  // então [resultado mensurável], porque [causa-raiz]. Multi-pick por grupo.
  // Resultado esperado é categoria (ex: 'Redução do tempo'); o user completa
  // a magnitude e prazo no próprio textarea ou refina depois. Resolve o loop
  // de devolução onde a Jô exigia o "então" mensurável.
  {
    groups: [
      {
        label: 'Causa-raiz suspeita',
        chips: [
          'Canal inadequado', 'Linguagem inacessível', 'Etapas redundantes',
          'Falta de informação prévia', 'Sistema offline / instável',
          'Capacidade insuficiente', 'Incentivo desalinhado',
          'Norma desatualizada', 'Falha na integração entre sistemas',
        ],
      },
      {
        label: 'Mecanismo de mudança',
        chips: [
          'Reduz fricção', 'Aumenta visibilidade', 'Antecipa decisão',
          'Elimina retrabalho', 'Personaliza atendimento',
          'Automatiza tarefa', 'Aproxima decisor',
        ],
      },
      {
        label: 'Resultado esperado (mensurável)',
        chips: [
          'Redução do tempo de espera',
          'Aumento da taxa de conclusão',
          'Redução da evasão',
          'Aumento da satisfação (NPS/CSAT)',
          'Redução de retrabalho',
          'Aumento da adesão',
          'Redução de reclamações',
          'Redução do custo por atendimento',
          'Aumento da cobertura',
        ],
      },
    ],
    coherence: {
      // Mecanismos coerentes por causa-raiz. Combinações fora dessa matriz
      // são possíveis mas a Jô tende a rejeitar por incoerência semântica.
      'Mecanismo de mudança': {
        dependsOn: 'Causa-raiz suspeita',
        map: {
          'Canal inadequado':           ['Aumenta visibilidade', 'Reduz fricção', 'Aproxima decisor'],
          'Linguagem inacessível':      ['Reduz fricção', 'Aumenta visibilidade', 'Personaliza atendimento'],
          'Etapas redundantes':         ['Elimina retrabalho', 'Automatiza tarefa', 'Reduz fricção'],
          'Falta de informação prévia': ['Antecipa decisão', 'Aumenta visibilidade'],
          'Sistema offline / instável': ['Automatiza tarefa', 'Elimina retrabalho'],
          'Capacidade insuficiente':    ['Automatiza tarefa', 'Elimina retrabalho', 'Personaliza atendimento'],
          'Incentivo desalinhado':      ['Aproxima decisor', 'Personaliza atendimento'],
          'Norma desatualizada':        ['Antecipa decisão', 'Aumenta visibilidade'],
          'Falha na integração entre sistemas': ['Automatiza tarefa', 'Elimina retrabalho'],
        },
      },
      // Resultados coerentes por mecanismo. Filtra "Aumento da satisfação"
      // pra mecanismos que afetam relacionamento, "Redução do tempo" pra
      // mecanismos que afetam fluxo, etc.
      'Resultado esperado (mensurável)': {
        dependsOn: 'Mecanismo de mudança',
        map: {
          'Reduz fricção':         ['Aumento da taxa de conclusão', 'Redução de retrabalho', 'Redução do tempo de espera', 'Aumento da adesão'],
          'Aumenta visibilidade':  ['Aumento da taxa de conclusão', 'Aumento da adesão', 'Redução de reclamações', 'Aumento da cobertura'],
          'Antecipa decisão':      ['Redução do tempo de espera', 'Aumento da taxa de conclusão', 'Redução de retrabalho'],
          'Elimina retrabalho':    ['Redução de retrabalho', 'Redução do custo por atendimento', 'Redução do tempo de espera'],
          'Personaliza atendimento': ['Aumento da satisfação (NPS/CSAT)', 'Aumento da adesão', 'Redução de reclamações'],
          'Automatiza tarefa':     ['Redução do tempo de espera', 'Redução do custo por atendimento', 'Redução de retrabalho'],
          'Aproxima decisor':      ['Redução do tempo de espera', 'Aumento da satisfação (NPS/CSAT)', 'Aumento da adesão'],
        },
      },
    },
    composer: (active) => {
      const causas = active.get('Causa-raiz suspeita') ?? [];
      const mecs = active.get('Mecanismo de mudança') ?? [];
      const resultados = active.get('Resultado esperado (mensurável)') ?? [];
      if (causas.length === 0 && mecs.length === 0 && resultados.length === 0) return '';

      // Composição em português natural: "X", "X e Y", "X, Y e Z"
      const join = (arr: string[], lower = false): string => {
        const fmt = (s: string) => `"${lower ? s.toLowerCase() : s}"`;
        if (arr.length === 0) return '';
        if (arr.length === 1) return fmt(arr[0]);
        if (arr.length === 2) return `${fmt(arr[0])} e ${fmt(arr[1])}`;
        return arr.slice(0, -1).map(fmt).join(', ') + ` e ${fmt(arr[arr.length - 1])}`;
      };

      const causaStr = join(causas);
      const mecStr = join(mecs, true);
      const resStr = join(resultados, true);
      const noun = (n: number, sing: string, plur: string) => (n === 1 ? sing : plur);

      const partes: string[] = [];

      // Cláusula "Se" — requer mecanismo
      if (mecs.length > 0) {
        partes.push(`Se aplicarmos ${noun(mecs.length, 'a intervenção de', 'as intervenções de')} ${mecStr}`);
      }

      // Cláusula "então" — requer resultado (com magnitude pra completar)
      if (resultados.length > 0) {
        partes.push(`então esperamos ${resStr} [magnitude e prazo a especificar — ex: X% em Y semanas]`);
      } else if (mecs.length > 0) {
        partes.push('então esperamos [resultado mensurável a especificar — ex: redução de X% em Y prazo]');
      }

      // Cláusula "porque" — requer causa-raiz
      if (causas.length > 0) {
        partes.push(`porque a intervenção age sobre ${noun(causas.length, 'a causa-raiz', 'as causas-raiz')} ${causaStr}`);
      } else if (mecs.length > 0 || resultados.length > 0) {
        partes.push('porque essa intervenção age diretamente sobre o ponto de atrito identificado');
      }

      // Se faltou peça obrigatória, retorna instrução pra Carla preencher
      if (partes.length === 0) return '';
      if (mecs.length === 0 && causas.length === 0) {
        return `${noun(resultados.length, 'Resultado esperado', 'Resultados esperados')}: ${resStr}. [Selecione causa-raiz e mecanismo nos chips acima].`;
      }
      if (mecs.length === 0) {
        return `${noun(causas.length, 'Causa-raiz suspeita', 'Causas-raiz suspeitas')}: ${causaStr}. [Selecione o mecanismo de mudança nos chips ao lado].`;
      }

      return partes.join(', ') + '.';
    },
  },

  // ── 03 · EXPERIMENTO ──
  // Composer monta frase estruturada que a Jô exige: intervenção + amostra +
  // duração + sinal de sucesso. A magnitude do sinal (X%, K segundos, etc.)
  // a Carla completa no textarea ou refina depois.
  {
    groups: [
      {
        label: 'Intervenção testada',
        chips: [
          'Notificação por canal alternativo (WhatsApp/SMS)',
          'Reformulação de fluxo (redução de etapas)',
          'Treinamento de servidores',
          'Automação de tarefa repetitiva',
          'Mutirão / força-tarefa',
          'Mudança de canal de atendimento',
          'Pré-cadastro online',
          'Lembretes automáticos',
          'Auto-atendimento digital',
          'Simplificação de formulário',
          'Integração entre sistemas',
        ],
      },
      {
        label: 'Amostra',
        chips: [
          'Amostra pequena (50-100)', 'Amostra média (500-1000)',
          '1 unidade-piloto', 'A/B controle + tratamento',
          'Grupo histórico vs novo', 'Sub-região',
        ],
      },
      {
        label: 'Duração',
        chips: ['2 semanas', '30 dias', '60 dias', '90 dias', '1 ciclo completo'],
      },
      {
        label: 'Sinal de sucesso',
        chips: [
          '% de redução do tempo de espera',
          'Tempo absoluto até resolução',
          'NPS / CSAT',
          'Taxa de conclusão',
          'Custo unitário por atendimento',
          'Volume de reclamações',
          'Taxa de adesão',
          '% de cobertura',
        ],
      },
    ],
    composer: (active) => {
      const intervs = active.get('Intervenção testada') ?? [];
      const amostras = active.get('Amostra') ?? [];
      const duracoes = active.get('Duração') ?? [];
      const sinais = active.get('Sinal de sucesso') ?? [];

      const total = intervs.length + amostras.length + duracoes.length + sinais.length;
      if (total === 0) return '';

      const join = (arr: string[], lower = false): string => {
        const fmt = (s: string) => (lower ? s.toLowerCase() : s);
        if (arr.length === 0) return '';
        if (arr.length === 1) return fmt(arr[0]);
        if (arr.length === 2) return `${fmt(arr[0])} e ${fmt(arr[1])}`;
        return arr.slice(0, -1).map(fmt).join(', ') + ` e ${fmt(arr[arr.length - 1])}`;
      };

      const partes: string[] = [];

      // Cláusula 1: intervenção
      if (intervs.length > 0) {
        partes.push(`Testar ${intervs.length === 1 ? 'a intervenção' : 'as intervenções'} de ${join(intervs, true)}`);
      } else {
        partes.push('Testar a intervenção [a especificar nos chips acima]');
      }

      // Cláusula 2: amostra
      if (amostras.length > 0) {
        partes.push(`em ${join(amostras, true)}`);
      }

      // Cláusula 3: duração
      if (duracoes.length > 0) {
        partes.push(`durante ${join(duracoes, true)}`);
      }

      // Cláusula 4: sinal de sucesso (com magnitude/meta a especificar)
      if (sinais.length > 0) {
        partes.push(`medindo ${join(sinais, true)} [magnitude/meta a especificar — ex: redução de 15 pontos percentuais em 30 dias]`);
      } else {
        partes.push('medindo [sinal de sucesso a especificar nos chips acima]');
      }

      return partes.join(', ') + '.';
    },
  },
];

// ============================================================
// FORMALIZAR · 6 sub-páginas (peças jurídicas autônomas)
// SEM sections-first (peças curtas, single-shot). Apenas chips + composer
// + freeFields ajudam o user a montar input pré-formatado pra Jô em /jo.
// ============================================================

// ── 03A · PORTARIA DE CRIAÇÃO ──
export const FORMALIZAR_PORTARIA_PALETTES: ChipPalette[] = [
  // Step 1 · Ordenador
  {
    groups: [
      {
        label: 'Unidade ancoradora',
        chips: ['Secretaria-Executiva', 'Coordenação-Geral', 'Subsecretaria',
                'Diretoria', 'Autarquia', 'Fundação', 'Empresa pública'],
      },
      {
        label: 'Perfil da autoridade signatária',
        chips: ['Ministro', 'Secretário', 'Subsecretário', 'Diretor-geral',
                'Presidente', 'Reitor'],
      },
    ],
    freeFields: [
      { key: 'signatario_nome', label: 'Nome da autoridade signatária',
        placeholder: 'Ex: Sr. Ministro João Silva · Sra. Secretária-Executiva Maria Souza' },
    ],
    composer: (active, free) => {
      const unid = active.get('Unidade ancoradora') ?? [];
      const perf = active.get('Perfil da autoridade signatária') ?? [];
      const nome = (free.get('signatario_nome') ?? '').trim();
      if (unid.length + perf.length === 0 && nome.length === 0) return '';
      const partes: string[] = [];
      if (unid.length > 0) partes.push(`Ancorado em ${joinPT(unid, true)}`);
      if (nome.length > 0) partes.push(`signatário: ${nome}`);
      else if (perf.length > 0) partes.push(`signatário (perfil): ${joinPT(perf, true)} (não nominado)`);
      return partes.join(' · ') + '.';
    },
  },
  // Step 2 · Competências
  {
    groups: [
      {
        label: 'Competências do lab',
        chips: ['Prototipar serviços digitais', 'Facilitar ideação intersetorial',
                'Capacitar servidores', 'Redigir notas técnicas',
                'Conduzir avaliação de impacto', 'Manter rede com inovação pública',
                'Gerir parcerias acadêmicas', 'Operar sandbox regulatório'],
      },
    ],
    composer: (active) => {
      const comp = active.get('Competências do lab') ?? [];
      if (comp.length === 0) return '';
      return `Competências: ${joinPT(comp, true)}.`;
    },
  },
  // Step 3 · Norma autorizadora
  {
    groups: [
      {
        label: 'Tipo de instrumento autorizador',
        chips: ['Decreto de organização do órgão', 'Estatuto', 'Regimento interno',
                'Instrução Normativa', 'Lei de criação do órgão'],
      },
    ],
    freeFields: [
      { key: 'norma_numero_ano', label: 'Número/ano da norma (se conhecido)',
        placeholder: 'Ex: Decreto 11.234/2024 · ou "a ser citado pelo setor jurídico"' },
    ],
    composer: (active, free) => {
      const tipo = active.get('Tipo de instrumento autorizador') ?? [];
      const num = (free.get('norma_numero_ano') ?? '').trim();
      if (tipo.length === 0 && num.length === 0) return '';
      const partes: string[] = [];
      if (tipo.length > 0) partes.push(`Lastro normativo: ${joinPT(tipo, true)}`);
      if (num.length > 0) partes.push(num);
      return partes.join(' · ') + '.';
    },
  },
];

// ── 03B · CATÁLOGO DE SERVIÇOS ──
export const FORMALIZAR_CATALOGO_PALETTES: ChipPalette[] = [
  // Step 1 · Serviços oferecidos
  {
    groups: [
      {
        label: 'Tipo de serviço',
        chips: ['Prototipação de soluções digitais', 'Facilitação de oficinas de ideação',
                'Consultoria interna em design de serviço', 'Capacitação metodológica',
                'Diagnóstico institucional', 'Avaliação de impacto',
                'Mediação técnico-jurídica de inovação', 'Apoio a editais de cooperação'],
      },
    ],
    composer: (active) => {
      const serv = active.get('Tipo de serviço') ?? [];
      if (serv.length === 0) return '';
      return `Serviços oferecidos: ${joinPT(serv, true)}.`;
    },
  },
  // Step 2 · Recusas e roteamento
  {
    groups: [
      {
        label: 'O lab NÃO faz',
        chips: ['Análise jurídica', 'Compras/licitação', 'Suporte de TI permanente',
                'Operação contínua de serviço-fim', 'Auditoria interna',
                'Gestão de RH', 'Comunicação institucional ampla'],
      },
      {
        label: 'Roteamento padrão (pra quem redireciona)',
        chips: ['Procuradoria', 'Coordenação de TI', 'Área de compras',
                'Auditoria interna', 'Comunicação social', 'Unidade fim do serviço'],
      },
    ],
    composer: (active) => {
      const nao = active.get('O lab NÃO faz') ?? [];
      const para = active.get('Roteamento padrão (pra quem redireciona)') ?? [];
      const partes: string[] = [];
      if (nao.length > 0) partes.push(`NÃO faz: ${joinPT(nao, true)}`);
      if (para.length > 0) partes.push(`redireciona para: ${joinPT(para, true)}`);
      return partes.length > 0 ? partes.join(' · ') + '.' : '';
    },
  },
  // Step 3 · Acionamento
  {
    groups: [
      {
        label: 'Quem aciona',
        chips: ['Qualquer servidor', 'Coordenadores', 'Diretores',
                'Alta gestão', 'Demanda do gabinete', 'Demanda externa via parceria'],
      },
      {
        label: 'Prazo padrão de resposta',
        chips: ['1 semana (triagem)', '15 dias (análise inicial)',
                '30 dias (escopo)', '60-90 dias (sprint)'],
      },
    ],
    composer: (active) => {
      const quem = active.get('Quem aciona') ?? [];
      const prazo = active.get('Prazo padrão de resposta') ?? [];
      const partes: string[] = [];
      if (quem.length > 0) partes.push(`Aciona: ${joinPT(quem, true)}`);
      if (prazo.length > 0) partes.push(`prazo: ${joinPT(prazo, true)}`);
      return partes.length > 0 ? partes.join(' · ') + '.' : '';
    },
  },
];

// ── 03C · NT DEDICAÇÃO EXCLUSIVA ──
export const FORMALIZAR_DEDICACAO_PALETTES: ChipPalette[] = [
  // Step 1 · Cargos
  {
    groups: [
      {
        label: 'Cargos contemplados',
        chips: ['Coordenador', 'Coordenador-geral', 'Diretor', 'Assessor',
                'Analista', 'Servidor técnico', 'Especialista', 'Pesquisador'],
      },
      {
        label: 'Tipo de função',
        chips: ['Função comissionada (FCE)', 'Cargo efetivo cedido',
                'Cargo em comissão (DAS)', 'Servidor sem função'],
      },
    ],
    freeFields: [
      { key: 'qtd_cargos', label: 'Quantidade de cargos pretendidos',
        placeholder: 'Ex: 2 FCE-3 + 4 servidores efetivos cedidos' },
    ],
    composer: (active, free) => {
      const cargos = active.get('Cargos contemplados') ?? [];
      const tipos = active.get('Tipo de função') ?? [];
      const qtd = (free.get('qtd_cargos') ?? '').trim();
      const partes: string[] = [];
      if (qtd.length > 0) partes.push(`Quantidade: ${qtd}`);
      if (cargos.length > 0) partes.push(`cargos: ${joinPT(cargos, true)}`);
      if (tipos.length > 0) partes.push(`tipo de função: ${joinPT(tipos, true)}`);
      return partes.length > 0 ? partes.join(' · ') + '.' : '';
    },
  },
  // Step 2 · Horas/vínculo
  {
    groups: [
      {
        label: 'Horas semanais',
        chips: ['10h', '20h', '30h', '40h (dedicação plena)'],
      },
      {
        label: 'Vínculo',
        chips: ['Cessão sem ônus', 'Cessão com ônus pra cedente',
                'Cessão com ônus pra cessionária', 'Lotação direta',
                'Recomposição de carga horária'],
      },
    ],
    composer: (active) => {
      const horas = active.get('Horas semanais') ?? [];
      const vinc = active.get('Vínculo') ?? [];
      const partes: string[] = [];
      if (horas.length > 0) partes.push(`Carga horária: ${joinPT(horas, true)}`);
      if (vinc.length > 0) partes.push(`vínculo: ${joinPT(vinc, true)}`);
      return partes.length > 0 ? partes.join(' · ') + '.' : '';
    },
  },
  // Step 3 · Normas internas
  {
    groups: [
      {
        label: 'Lastro normativo',
        chips: ['Decreto de organização', 'Regimento interno', 'PCCS',
                'Política de cessão do órgão', 'Lei do plano de cargos',
                'Resolução interna'],
      },
    ],
    freeFields: [
      { key: 'contexto_pedido', label: 'Contexto que sustenta o pedido',
        placeholder: 'Ex: Lab criado em 04/2024, equipe atual 20h/semana insuficiente pra ciclos de Sprint completos' },
    ],
    composer: (active, free) => {
      const norm = active.get('Lastro normativo') ?? [];
      const ctx = (free.get('contexto_pedido') ?? '').trim();
      const partes: string[] = [];
      if (norm.length > 0) partes.push(`Lastro: ${joinPT(norm, true)}`);
      if (ctx.length > 0) partes.push(`contexto: ${ctx}`);
      return partes.length > 0 ? partes.join(' · ') + '.' : '';
    },
  },
];

// ── 03D · NT ENQUADRAMENTO ICT ──
export const FORMALIZAR_ENQUADRAMENTO_ICT_PALETTES: ChipPalette[] = [
  // Step 1 · Atividades PD&I
  {
    groups: [
      {
        label: 'Atividades de PD&I executadas',
        chips: ['Pesquisa aplicada', 'Desenvolvimento experimental',
                'Prototipação tecnológica', 'Engenharia não-rotineira',
                'Inovação de processo administrativo', 'Inovação de serviço público',
                'Inovação organizacional'],
      },
    ],
    composer: (active) => {
      const at = active.get('Atividades de PD&I executadas') ?? [];
      return at.length > 0 ? `Atividades de PD&I: ${joinPT(at, true)}.` : '';
    },
  },
  // Step 2 · Missão
  {
    groups: [
      {
        label: 'Áreas missionárias do órgão',
        chips: ['Saúde', 'Educação', 'Segurança', 'Justiça', 'CT&I',
                'Meio ambiente', 'Cultura', 'Trabalho', 'Assistência',
                'Planejamento', 'Fazenda', 'Defesa', 'Comunicações'],
      },
    ],
    freeFields: [
      { key: 'missao_lit', label: 'Missão institucional (literal, do estatuto)',
        placeholder: 'Ex: "promover, regular e fiscalizar a prestação de serviços ambientais no Estado..."' },
    ],
    composer: (active, free) => {
      const ar = active.get('Áreas missionárias do órgão') ?? [];
      const mis = (free.get('missao_lit') ?? '').trim();
      const partes: string[] = [];
      if (ar.length > 0) partes.push(`Áreas: ${joinPT(ar, true)}`);
      if (mis.length > 0) partes.push(`missão: "${mis}"`);
      return partes.length > 0 ? partes.join(' · ') + '.' : '';
    },
  },
  // Step 3 · Instrumento alterado
  {
    groups: [
      {
        label: 'Tipo de instrumento a alterar',
        chips: ['Decreto de organização', 'Estatuto', 'Regimento interno',
                'IN específica', 'Resolução do conselho', 'Portaria do dirigente máximo'],
      },
    ],
    freeFields: [
      { key: 'instrumento_atual', label: 'Instrumento atual (número/ano)',
        placeholder: 'Ex: Decreto 11.234/2023 · Estatuto aprovado pela Resolução 045/2022' },
    ],
    composer: (active, free) => {
      const tipo = active.get('Tipo de instrumento a alterar') ?? [];
      const atual = (free.get('instrumento_atual') ?? '').trim();
      const partes: string[] = [];
      if (tipo.length > 0) partes.push(`Instrumento: ${joinPT(tipo, true)}`);
      if (atual.length > 0) partes.push(`atual: ${atual}`);
      return partes.length > 0 ? partes.join(' · ') + '.' : '';
    },
  },
];

// ── 03E · NIT (4 steps) ──
export const FORMALIZAR_NIT_PALETTES: ChipPalette[] = [
  // Step 1 · Composição
  {
    groups: [
      {
        label: 'Composição do NIT',
        chips: ['Coordenador-geral', 'Coordenador técnico', 'Procurador designado',
                'Pesquisador sênior', 'Servidor de propriedade intelectual',
                'Representante de transferência tecnológica',
                'Representante de gestão de inovação'],
      },
    ],
    freeFields: [
      { key: 'tamanho_equipe', label: 'Tamanho previsto da equipe',
        placeholder: 'Ex: 3 servidores efetivos + 2 cedidos' },
    ],
    composer: (active, free) => {
      const comp = active.get('Composição do NIT') ?? [];
      const tam = (free.get('tamanho_equipe') ?? '').trim();
      const partes: string[] = [];
      if (comp.length > 0) partes.push(`Composição: ${joinPT(comp, true)}`);
      if (tam.length > 0) partes.push(`tamanho: ${tam}`);
      return partes.length > 0 ? partes.join(' · ') + '.' : '';
    },
  },
  // Step 2 · Atribuições art. 17 (das 10)
  {
    groups: [
      {
        label: 'Atribuições do art. 17 (Marco CT&I)',
        chips: [
          'I — Política de inovação',
          'II — Avaliar/classificar tecnologias',
          'III — Avaliar pedidos de proteção de PI',
          'IV — Avaliar conveniência de divulgar invenções',
          'V — Acompanhar processamento de pedidos de PI',
          'VI — Manter cadastro de tecnologias',
          'VII — Indicações em colegiados de inovação',
          'VIII — Promover inovação',
          'IX — Negociar compromissos de transferência',
          'X — Monitorar contratos de transferência',
        ],
      },
    ],
    composer: (active) => {
      const atr = active.get('Atribuições do art. 17 (Marco CT&I)') ?? [];
      return atr.length > 0 ? `Atribuições escolhidas: ${joinPT(atr)}.` : '';
    },
  },
  // Step 3 · Organograma
  {
    groups: [
      {
        label: 'Vinculação do NIT',
        chips: ['Direto ao dirigente máximo', 'Vinculado à área de planejamento',
                'Vinculado à área de pesquisa', 'Vinculado à área jurídica',
                'Unidade autônoma com regimento próprio'],
      },
    ],
    composer: (active) => {
      const v = active.get('Vinculação do NIT') ?? [];
      return v.length > 0 ? `Vinculação: ${joinPT(v, true)}.` : '';
    },
  },
  // Step 4 · Peças existentes
  {
    groups: [
      {
        label: 'Peças jurídicas existentes',
        chips: ['Política de Inovação publicada', 'Ato de enquadramento como ICT',
                'Portaria de criação do lab', 'Regimento interno aprovado',
                'Acordos de cooperação vigentes', 'Catálogo de serviços documentado'],
      },
      {
        label: 'Peças em curso',
        chips: ['Política de Inovação em redação',
                'Enquadramento ICT em análise da Procuradoria',
                'Portaria em fase de aprovação'],
      },
    ],
    composer: (active) => {
      const ex = active.get('Peças jurídicas existentes') ?? [];
      const curso = active.get('Peças em curso') ?? [];
      const partes: string[] = [];
      if (ex.length > 0) partes.push(`Existentes: ${joinPT(ex, true)}`);
      if (curso.length > 0) partes.push(`em curso: ${joinPT(curso, true)}`);
      return partes.length > 0 ? partes.join(' · ') + '.' : '';
    },
  },
];

// ── 03F · POLÍTICA DE INOVAÇÃO (5 steps) ──
export const FORMALIZAR_POLITICA_INOVACAO_PALETTES: ChipPalette[] = [
  // Step 1 · Ato de Enquadramento ICT
  {
    groups: [
      {
        label: 'Status do enquadramento ICT',
        chips: ['Sim, publicado e vigente', 'Em redação interna',
                'Em análise da Procuradoria', 'Não, sem início',
                'Em discussão preliminar'],
      },
    ],
    freeFields: [
      { key: 'ato_enquadramento_ref', label: 'Referência do ato de enquadramento (se houver)',
        placeholder: 'Ex: Resolução 045/2024 · Decreto 11.234/2023 art. 2º' },
    ],
    composer: (active, free) => {
      const st = active.get('Status do enquadramento ICT') ?? [];
      const ref = (free.get('ato_enquadramento_ref') ?? '').trim();
      const partes: string[] = [];
      if (st.length > 0) partes.push(`Status: ${joinPT(st, true)}`);
      if (ref.length > 0) partes.push(`referência: ${ref}`);
      return partes.length > 0 ? partes.join(' · ') + '.' : '';
    },
  },
  // Step 2 · Estrutura
  {
    groups: [
      {
        label: 'Estrutura desejada',
        chips: ['Política enxuta (1 ato único)', 'Política + portarias específicas',
                'Política em decreto + manual operativo',
                'Política como anexo de regimento'],
      },
    ],
    composer: (active) => {
      const e = active.get('Estrutura desejada') ?? [];
      return e.length > 0 ? `Estrutura: ${joinPT(e, true)}.` : '';
    },
  },
  // Step 3 · Missão e princípios
  {
    groups: [
      {
        label: 'Princípios orientadores',
        chips: ['Cidadania', 'Eficiência', 'Transparência', 'Cooperação',
                'Experimentação responsável', 'Cocriação', 'Letramento',
                'Sustentabilidade institucional', 'Equidade no acesso'],
      },
    ],
    freeFields: [
      { key: 'missao_politica', label: 'Missão da Política (frase curta)',
        placeholder: 'Ex: "Promover ambientes seguros de experimentação que aumentem capacidade institucional..."' },
    ],
    composer: (active, free) => {
      const p = active.get('Princípios orientadores') ?? [];
      const m = (free.get('missao_politica') ?? '').trim();
      const partes: string[] = [];
      if (m.length > 0) partes.push(`Missão: "${m}"`);
      if (p.length > 0) partes.push(`princípios: ${joinPT(p, true)}`);
      return partes.length > 0 ? partes.join(' · ') + '.' : '';
    },
  },
  // Step 4 · Propriedade intelectual
  {
    groups: [
      {
        label: 'Modelo de gestão de PI',
        chips: ['Titularidade integral da ICT', 'Titularidade compartilhada com inventor',
                'Cessão a terceiros sob contrato', 'Domínio público obrigatório',
                'Modelo híbrido por tipo de ativo'],
      },
    ],
    composer: (active) => {
      const m = active.get('Modelo de gestão de PI') ?? [];
      return m.length > 0 ? `Gestão de PI: ${joinPT(m, true)}.` : '';
    },
  },
  // Step 5 · Inventores e MCTI
  {
    groups: [
      {
        label: 'Participação dos inventores',
        chips: ['Sem participação financeira (só reconhecimento)',
                'Participação em royalties', 'Participação em ganhos de licenciamento',
                'Bolsa de estímulo à inovação', 'Modelo a definir'],
      },
      {
        label: 'Prestação ao MCTI',
        chips: ['Anual via FORMICT', 'Sob demanda', 'Não aplicável ainda'],
      },
    ],
    composer: (active) => {
      const inv = active.get('Participação dos inventores') ?? [];
      const mcti = active.get('Prestação ao MCTI') ?? [];
      const partes: string[] = [];
      if (inv.length > 0) partes.push(`Inventores: ${joinPT(inv, true)}`);
      if (mcti.length > 0) partes.push(`MCTI: ${joinPT(mcti, true)}`);
      return partes.length > 0 ? partes.join(' · ') + '.' : '';
    },
  },
];

// ============================================================
// MANTER · Pacote de Continuidade Institucional · 4 campos
// CRÍTICO: Step 1 (Entregas) bloqueia se vazio · Step 2 usa month-year
// picker pra data crítica · Step 3 detecta "patrocinador único" pra trigger.
// ============================================================
export const MANTER_PALETTES: ChipPalette[] = [
  // ── 01 · ENTREGAS EXISTENTES ──
  // CRÍTICO: sem nenhuma entrega Jô bloqueia. FreeField pra peça principal nominada.
  {
    groups: [
      {
        label: 'Tipo de entrega — Normativa',
        chips: ['Portaria publicada', 'Regimento interno', 'IN do órgão',
                'Edital publicado', 'TCT/ACT firmado', 'Decreto regulamentar',
                'Acordo de cooperação'],
      },
      {
        label: 'Tipo de entrega — Operacional',
        chips: ['Sistema em operação', 'Capacitação concluída',
                'Parceria firmada', 'Ato administrativo publicado',
                'Protótipo validado em campo'],
      },
      {
        label: 'Tipo de entrega — Outcome',
        chips: ['Indicador medido', 'Avaliação publicada',
                'Auditoria favorável (CGU/TCU)', 'Pesquisa/survey conduzida'],
      },
      {
        label: 'Origem das entregas',
        chips: ['Saída do Mapear', 'Saída do Estruturar', 'Saída do Formalizar',
                'Saída do Construir', 'Saída do Avaliar', 'Iniciativa autônoma do lab'],
      },
    ],
    freeFields: [
      {
        key: 'pecas_principais',
        label: 'Peças principais nominadas (com número/ano e órgão)',
        placeholder: 'Ex: Portaria DOU 04/2024 · TCT CGAC 09/2025 · Avaliação CGU/SE/MMXXVI-001 02/2026',
      },
    ],
    composer: (active, free) => {
      const norm = active.get('Tipo de entrega — Normativa') ?? [];
      const op = active.get('Tipo de entrega — Operacional') ?? [];
      const out = active.get('Tipo de entrega — Outcome') ?? [];
      const origem = active.get('Origem das entregas') ?? [];
      const pecas = (free.get('pecas_principais') ?? '').trim();
      if (norm.length + op.length + out.length + origem.length === 0 && pecas.length === 0) return '';

      const partes: string[] = [];
      if (pecas.length > 0) {
        partes.push(`Peças nominadas: ${pecas}`);
      }
      const tipos: string[] = [];
      if (norm.length > 0) tipos.push(`normativas (${joinPT(norm, true)})`);
      if (op.length > 0) tipos.push(`operacionais (${joinPT(op, true)})`);
      if (out.length > 0) tipos.push(`outcome (${joinPT(out, true)})`);
      if (tipos.length > 0) partes.push(`Tipos: ${tipos.join('; ')}`);
      if (origem.length > 0) partes.push(`Origem: ${joinPT(origem, true)}`);
      if (out.length === 0 && pecas.length > 0) {
        partes.push('⚠ Sem indicador de outcome — pacote sairá em modo defesa retroativa.');
      }
      return partes.join('. ') + '.';
    },
  },

  // ── 02 · JANELA POLÍTICA E AUDIÊNCIA ──
  // FreeField data_critica usa month-year picker
  {
    groups: [
      {
        label: 'Janela política',
        chips: ['Transição de gestão', 'Defesa orçamentária',
                'Prestação de contas anual', 'Aniversário institucional',
                'Renovação de contratos', 'Plenária ministerial'],
      },
      {
        label: 'Audiência primária',
        chips: ['Alta gestão (ministro/secretário)', 'Sucessor designado',
                'Controle externo (CGU/TCU)', 'Colegiado de patrocínio',
                'Imprensa institucional', 'Conselho gestor'],
      },
    ],
    freeFields: [
      {
        key: 'data_critica',
        label: 'Data crítica (mês/ano da janela)',
        placeholder: '',
        type: 'month-year',
      },
    ],
    composer: (active, free) => {
      const janela = active.get('Janela política') ?? [];
      const aud = active.get('Audiência primária') ?? [];
      const data = (free.get('data_critica') ?? '').trim();
      if (janela.length + aud.length === 0 && data.length === 0) return '';

      // Formata "YYYY-MM" → "MM/YYYY" pt-BR
      let dataFmt = data;
      if (/^\d{4}-\d{2}$/.test(data)) {
        const [yyyy, mm] = data.split('-');
        dataFmt = `${mm}/${yyyy}`;
      }

      const partes: string[] = [];
      if (janela.length > 0) partes.push(`Janela: ${joinPT(janela, true)}`);
      if (dataFmt.length > 0) partes.push(`prevista para ${dataFmt}`);
      if (aud.length > 0) partes.push(`audiência primária: ${joinPT(aud, true)}`);
      return partes.join(' · ') + '.';
    },
  },

  // ── 03 · RISCO DE DESCONTINUIDADE ──
  // CRÍTICO: "Patrocinador único" → trigger no contract pra alerta automático
  {
    groups: [
      {
        label: 'Sintomas de fragilidade',
        chips: ['Patrocinador único (sem média gerência)',
                'Sem respaldo formalizado de média gerência',
                'Sem inserção em redes externas',
                'Equipe cedida sem dedicação exclusiva',
                'Sem indicador de outcome medido',
                'Sem instrumento jurídico vigente',
                'Dependente de função comissionada removível'],
      },
      {
        label: 'Patrocinador atual (perfil)',
        chips: ['Secretário', 'Subsecretário', 'Diretor-geral',
                'Presidente', 'Coordenador-geral', 'Conselho gestor', 'Ministro'],
      },
    ],
    freeFields: [
      {
        key: 'patrocinador_nome',
        label: 'Nome do patrocinador atual (Jô preserva literalmente)',
        placeholder: 'Ex: Dr. João Silva, Secretário-Executivo · ou "patrocinador não nominado"',
      },
    ],
    composer: (active, free) => {
      const sintomas = active.get('Sintomas de fragilidade') ?? [];
      const perfil = active.get('Patrocinador atual (perfil)') ?? [];
      const nome = (free.get('patrocinador_nome') ?? '').trim();
      if (sintomas.length + perfil.length === 0 && nome.length === 0) return '';

      const partes: string[] = [];
      if (nome.length > 0) {
        partes.push(`Patrocinador atual: ${nome}`);
      } else if (perfil.length > 0) {
        partes.push(`Patrocinador (perfil): ${joinPT(perfil, true)} (não nominado)`);
      }
      if (sintomas.length > 0) {
        partes.push(`Sintomas de fragilidade: ${joinPT(sintomas, true)}`);
      }
      // Trigger semântico: presença literal de "Patrocinador único"
      const temPatrocUnico = sintomas.some((s) => s.startsWith('Patrocinador único'));
      if (temPatrocUnico) {
        partes.push('⚠ ALERTA: patrocinador único declarado — Jô embute alerta de fragilidade no Briefing.');
      }
      return partes.join('. ') + '.';
    },
  },

  // ── 04 · PEDIDO DE CONTINUIDADE ──
  {
    groups: [
      {
        label: 'Recurso pretendido',
        chips: ['Orçamento (R$)', 'Funções comissionadas (FCE)',
                'Alocação de horas (cessões)', 'Infraestrutura (espaço/equipamento)',
                'Capacitação adicional', 'Apoio jurídico dedicado',
                'Licenças de software'],
      },
      {
        label: 'Redes-alvo de inserção',
        chips: ['InovaGov', 'RenovaJud', 'Mapeamento LISP Brasil',
                'GNova/Enap', 'Outra rede setorial'],
      },
    ],
    coherence: {
      // Rede ↔ instrumento canônico (informativo — Jô usa pra escolher minuta)
    },
    freeFields: [
      {
        key: 'valor_orcamento',
        label: 'Valor do orçamento pretendido',
        placeholder: 'Ex: R$ 480 mil/ano · R$ 2.5 mi triênio · sem orçamento dedicado solicitado',
      },
      {
        key: 'equipe_pretendida',
        label: 'Equipe pretendida',
        placeholder: 'Ex: 2 FCE-3 + 4 servidores 20h/semana · ampliar pra 6 dedicação plena',
      },
    ],
    composer: (active, free) => {
      const rec = active.get('Recurso pretendido') ?? [];
      const redes = active.get('Redes-alvo de inserção') ?? [];
      const valor = (free.get('valor_orcamento') ?? '').trim();
      const eq = (free.get('equipe_pretendida') ?? '').trim();
      if (rec.length + redes.length === 0 && valor.length === 0 && eq.length === 0) return '';

      const partes: string[] = [];
      if (rec.length > 0) partes.push(`Recursos: ${joinPT(rec, true)}`);
      if (valor.length > 0) partes.push(`orçamento: ${valor}`);
      if (eq.length > 0) partes.push(`equipe pretendida: ${eq}`);
      if (redes.length > 0) partes.push(`Redes-alvo: ${joinPT(redes)}`);
      return partes.join(' · ') + '.';
    },
  },
];

// ============================================================
// CONSTRUIR · Plano de Implementação + Handoff · 4 campos
// CRÍTICO: Step 4 (unidade executora) tem freeField OBRIGATÓRIO — sem
// nominação a Jô bloqueia (não há handoff sem destinatário).
// ============================================================
export const CONSTRUIR_PALETTES: ChipPalette[] = [
  // ── 01 · SOLUÇÃO VALIDADA ──
  {
    groups: [
      {
        label: 'Tipo de solução',
        chips: ['Assistente conversacional', 'Dashboard / BI', 'Automação de fluxo',
                'Integração entre sistemas', 'Portal de serviço', 'App mobile',
                'Sistema interno', 'Fluxo no-code'],
      },
      {
        label: 'Maturidade',
        chips: ['Concept (sem teste)', 'MVP testado', 'Validado em piloto controlado',
                'Escalável (operação contínua)'],
      },
      {
        label: 'Origem',
        chips: ['Saída de Sprint Estruturar', 'Demanda externa', 'Adaptação de solução existente',
                'Encomenda direta da gestão'],
      },
    ],
    freeFields: [
      {
        key: 'nome_da_solucao',
        label: 'Nome da solução',
        placeholder: 'Ex: Bot SEI Atende · Painel de Pendências · Pré-cadastro Gov.br',
      },
      {
        key: 'metricas_piloto',
        label: 'Métricas do piloto (se houver)',
        placeholder: 'Ex: 78% resolução em 200 atendimentos · redução de 40% em 30 dias',
      },
    ],
    composer: (active, free) => {
      const tipo = active.get('Tipo de solução') ?? [];
      const mat = active.get('Maturidade') ?? [];
      const ori = active.get('Origem') ?? [];
      const nome = (free.get('nome_da_solucao') ?? '').trim();
      const metricas = (free.get('metricas_piloto') ?? '').trim();
      if (tipo.length + mat.length + ori.length === 0 && nome.length === 0 && metricas.length === 0) return '';

      const partes: string[] = [];
      if (nome.length > 0) partes.push(nome);
      else if (tipo.length > 0) partes.push(joinPT(tipo, true));
      if (mat.length > 0) partes.push(`maturidade ${joinPT(mat, true)}`);
      if (ori.length > 0) partes.push(`origem ${joinPT(ori, true)}`);
      if (metricas.length > 0) partes.push(`métricas: ${metricas}`);

      const out = partes.join(' — ') + '.';
      return out.charAt(0).toUpperCase() + out.slice(1);
    },
  },

  // ── 02 · STACK ──
  {
    groups: [
      {
        label: 'Stack',
        chips: ['No-code', 'Lo-code', 'Customizado', 'Plataforma já existente no órgão'],
      },
      {
        label: 'Ferramenta',
        chips: ['n8n', 'Bubble', 'Retool', 'Lovable', 'Astro/Next', 'Power Apps',
                'SERPRO', 'Gov.br', 'SEI nativo', 'Solução própria do órgão'],
      },
      {
        label: 'Justificativa',
        chips: ['Reuso preferido (Estado prefere reuso)',
                'Custom necessário (sem similar no mercado)',
                'Sandbox apropriado (teste antes de escala)',
                'Encomenda Tecnológica (risco técnico)'],
      },
    ],
    coherence: {
      'Justificativa': {
        dependsOn: 'Stack',
        map: {
          'No-code': ['Reuso preferido (Estado prefere reuso)'],
          'Lo-code': ['Reuso preferido (Estado prefere reuso)', 'Sandbox apropriado (teste antes de escala)'],
          'Customizado': ['Custom necessário (sem similar no mercado)', 'Encomenda Tecnológica (risco técnico)'],
          'Plataforma já existente no órgão': ['Reuso preferido (Estado prefere reuso)'],
        },
      },
    },
    composer: (active) => {
      const stack = active.get('Stack') ?? [];
      const ferr = active.get('Ferramenta') ?? [];
      const just = active.get('Justificativa') ?? [];
      if (stack.length + ferr.length + just.length === 0) return '';

      const partes: string[] = [];
      if (stack.length > 0) partes.push(`Stack: ${joinPT(stack, true)}`);
      if (ferr.length > 0) partes.push(`ferramenta: ${joinPT(ferr)}`);
      if (just.length > 0) partes.push(`justificativa: ${joinPT(just, true)}`);
      return partes.join(' · ') + '.';
    },
  },

  // ── 03 · RESTRIÇÃO TI ──
  {
    groups: [
      {
        label: 'Tipo de restrição',
        chips: ['Fila do CTI (6+ meses)', 'LGPD/dados sensíveis', 'Vedação regimental',
                'Sem orçamento dedicado', 'Falta capacitação interna',
                'Integração legacy', 'Sem infraestrutura cloud'],
      },
      {
        label: 'Janela',
        chips: ['Sem prazo fixo', '30 dias', '90 dias', '180 dias', '1 ano'],
      },
      {
        label: 'Camada normativa aplicável',
        chips: ['Lei 14.129/2021 (Gov Digital)',
                'Marco CT&I (Lei 10.973 c/ 13.243)',
                'Lei 14.133/2021 (Licitações)',
                'LC 182/2021 (Marco Startups)',
                'LGPD (Lei 13.709)',
                'Guia AGU de Sandbox Regulatório'],
      },
    ],
    coherence: {
      'Camada normativa aplicável': {
        dependsOn: 'Tipo de restrição',
        map: {
          'LGPD/dados sensíveis': ['LGPD (Lei 13.709)'],
          'Fila do CTI (6+ meses)': ['Lei 14.129/2021 (Gov Digital)', 'Marco CT&I (Lei 10.973 c/ 13.243)'],
          'Sem orçamento dedicado': ['Lei 14.133/2021 (Licitações)', 'LC 182/2021 (Marco Startups)'],
          'Vedação regimental': ['Guia AGU de Sandbox Regulatório'],
          'Integração legacy': ['Lei 14.129/2021 (Gov Digital)'],
        },
      },
    },
    composer: (active) => {
      const tipo = active.get('Tipo de restrição') ?? [];
      const jan = active.get('Janela') ?? [];
      const cam = active.get('Camada normativa aplicável') ?? [];
      if (tipo.length + jan.length + cam.length === 0) return '';

      const partes: string[] = [];
      if (tipo.length > 0) partes.push(`Restrições: ${joinPT(tipo, true)}`);
      if (jan.length > 0) partes.push(`janela ${joinPT(jan, true)}`);
      if (cam.length > 0) partes.push(`camada normativa: ${joinPT(cam)}`);
      return partes.join(' · ') + '.';
    },
  },

  // ── 04 · UNIDADE EXECUTORA ──
  // CRÍTICO: freeField unidade_nome é OBRIGATÓRIO (Jô bloqueia sem).
  {
    groups: [
      {
        label: 'Tipo de unidade',
        chips: ['Coordenação operacional', 'Subsecretaria', 'Departamento',
                'Autarquia', 'Empresa pública', 'Parceiro convenente',
                'Conselho gestor'],
      },
      {
        label: 'Suporte residual do lab',
        chips: ['30 dias', '60 dias', '90 dias', '180 dias', '12 meses'],
      },
      {
        label: 'Critério de encerramento do suporte',
        chips: ['Indicadores em meta', 'Aceite formal',
                'Treinamento concluído', 'Documentação entregue',
                'Após 1 ciclo operacional completo'],
      },
    ],
    freeFields: [
      {
        key: 'unidade_nome',
        label: 'Nome da unidade executora (OBRIGATÓRIO — sem isso a Jô bloqueia)',
        placeholder: 'Ex: Coordenação-Geral de Atendimento ao Cidadão (CGAC) do INSS',
      },
    ],
    composer: (active, free) => {
      const tipo = active.get('Tipo de unidade') ?? [];
      const sup = active.get('Suporte residual do lab') ?? [];
      const enc = active.get('Critério de encerramento do suporte') ?? [];
      const nome = (free.get('unidade_nome') ?? '').trim();
      if (tipo.length + sup.length + enc.length === 0 && nome.length === 0) return '';

      const partes: string[] = [];
      if (nome.length > 0) {
        partes.push(`Unidade executora: ${nome}`);
      } else if (tipo.length > 0) {
        partes.push(`Unidade executora (tipo): ${joinPT(tipo, true)} — ⚠ a Jô vai pedir o nome específico`);
      }
      if (sup.length > 0) partes.push(`suporte residual ${joinPT(sup, true)}`);
      if (enc.length > 0) partes.push(`critério de encerramento: ${joinPT(enc, true)}`);
      return partes.join(' · ') + '.';
    },
  },
];

// ============================================================
// AVALIAR · Plano de Avaliação · 3 campos
// Variável crítica: Escopo (backoffice/serviço-fim) — drives Dimensão de Valor
// permitida no Step 2. Coherence Escopo→Dimensão é não-negociável.
// ============================================================
export const AVALIAR_PALETTES: ChipPalette[] = [
  // ── 01 · INTERVENÇÃO ──
  {
    groups: [
      {
        label: 'Tipo de intervenção',
        chips: ['Programa de capacitação', 'Política pública', 'Serviço prestado',
                'Protótipo validado', 'Sistema em operação', 'Reorganização interna'],
      },
      {
        label: 'Escopo',
        chips: ['Backoffice (interno)', 'Serviço-fim (toca cidadão)', 'Misto'],
      },
      {
        label: 'Duração',
        chips: ['Em curso (não termina)', 'Concluída', 'Recorrente'],
      },
    ],
    freeFields: [
      {
        key: 'nome_da_intervencao',
        label: 'Nome da intervenção (a Jô preserva literalmente)',
        placeholder: 'Ex: Capacitação ágil em licenciamento ambiental · Chatbot previdenciário',
      },
      {
        key: 'escala_atendida',
        label: 'Escala atendida',
        placeholder: 'Ex: 180 servidores em 8 meses · 200 atendimentos/dia',
      },
    ],
    composer: (active, free) => {
      const tipo = active.get('Tipo de intervenção') ?? [];
      const escopo = active.get('Escopo') ?? [];
      const dur = active.get('Duração') ?? [];
      const nome = (free.get('nome_da_intervencao') ?? '').trim();
      const escala = (free.get('escala_atendida') ?? '').trim();
      if (tipo.length + escopo.length + dur.length === 0 && nome.length === 0 && escala.length === 0) return '';

      const partes: string[] = [];
      if (nome.length > 0) partes.push(nome);
      else if (tipo.length > 0) partes.push(joinPT(tipo, true));
      if (escopo.length > 0) partes.push(`escopo ${joinPT(escopo, true)}`);
      if (escala.length > 0) partes.push(`escala: ${escala}`);
      if (dur.length > 0) partes.push(`status: ${joinPT(dur, true)}`);

      const out = partes.join(' — ') + '.';
      return out.charAt(0).toUpperCase() + out.slice(1);
    },
  },

  // ── 02 · OUTCOME ──
  // Dimensões filtradas pelo Escopo do Step 1 via coherence visual:
  // Backoffice → permite Administrativa+Econômica
  // Serviço-fim → permite todas (com ênfase em Cidadã+Societal)
  {
    groups: [
      {
        label: 'Dimensão de valor',
        chips: ['Administrativa', 'Cidadã', 'Societal', 'Econômica'],
      },
      {
        label: 'Tipo de mudança esperada',
        chips: [
          'Redução de tempo',
          'Aumento de satisfação',
          'Aumento de cobertura',
          'Redução de custo',
          'Aumento de transparência',
          'Aumento de equidade',
          'Aumento da taxa de conclusão',
          'Redução de retrabalho',
        ],
      },
    ],
    coherence: {
      // Tipo de mudança ↔ Dimensão (ajuda a Carla a alinhar)
      'Tipo de mudança esperada': {
        dependsOn: 'Dimensão de valor',
        map: {
          'Administrativa': ['Redução de tempo', 'Redução de custo', 'Redução de retrabalho', 'Aumento da taxa de conclusão'],
          'Cidadã': ['Redução de tempo', 'Aumento de satisfação', 'Aumento da taxa de conclusão', 'Aumento de cobertura'],
          'Societal': ['Aumento de transparência', 'Aumento de equidade', 'Aumento de cobertura'],
          'Econômica': ['Redução de custo'],
        },
      },
    },
    composer: (active) => {
      const dim = active.get('Dimensão de valor') ?? [];
      const tipo = active.get('Tipo de mudança esperada') ?? [];
      if (dim.length + tipo.length === 0) return '';

      const partes: string[] = [];
      if (dim.length > 0) partes.push(`Dimensão de valor: ${joinPT(dim)}`);
      if (tipo.length > 0) partes.push(`mudança esperada: ${joinPT(tipo, true)}`);
      return partes.join(' · ') + '.';
    },
  },

  // ── 03 · DADOS ──
  {
    groups: [
      {
        label: 'Fonte',
        chips: ['Sistema próprio (SEI/SISP)', 'BI estadual/federal', 'Survey/Pesquisa',
                'Auditoria CGU', 'Ouvidoria', 'Painel de transparência',
                'Folha de pagamento', 'Dados externos (IBGE/MS/INEP)'],
      },
      {
        label: 'Periodicidade',
        chips: ['Tempo real', 'Diária', 'Semanal', 'Mensal',
                'Trimestral', 'Anual', 'Sob demanda'],
      },
      {
        label: 'Acesso',
        chips: ['Livre/aberto', 'Restrito interno', 'Negociação necessária', 'Não disponível ainda'],
      },
    ],
    freeFields: [
      {
        key: 'fonte_principal',
        label: 'Fonte principal (sistema/painel/survey específico)',
        placeholder: 'Ex: Painel de Pendências SEI · Dashboard CGU · Survey ENAP 2025',
      },
    ],
    composer: (active, free) => {
      const fontes = active.get('Fonte') ?? [];
      const per = active.get('Periodicidade') ?? [];
      const acc = active.get('Acesso') ?? [];
      const principal = (free.get('fonte_principal') ?? '').trim();
      if (fontes.length + per.length + acc.length === 0 && principal.length === 0) return '';

      const partes: string[] = [];
      if (principal.length > 0) {
        partes.push(`Fonte principal: ${principal}`);
      } else if (fontes.length > 0) {
        partes.push(`Fontes: ${joinPT(fontes, true)}`);
      }
      if (per.length > 0) partes.push(`periodicidade ${joinPT(per, true)}`);
      if (acc.length > 0) partes.push(`acesso ${joinPT(acc, true)}`);
      return partes.join(' · ') + '.';
    },
  },
];

// ============================================================
// MAPEAR · Passo 0 · Diagnóstico Institucional · 4 campos
// Composers + FreeFields nominados + Coherence semântica.
// Alinhado ao contract mapearContract() em structured-contract.ts.
// ============================================================

// Helper compartilhado de composição PT-BR ("X", "X e Y", "X, Y e Z").
const joinPT = (arr: string[], lower = false): string => {
  const fmt = (s: string) => (lower ? s.toLowerCase() : s);
  if (arr.length === 0) return '';
  if (arr.length === 1) return fmt(arr[0]);
  if (arr.length === 2) return `${fmt(arr[0])} e ${fmt(arr[1])}`;
  return arr.slice(0, -1).map(fmt).join(', ') + ` e ${fmt(arr[arr.length - 1])}`;
};

export const MAPEAR_PALETTES: ChipPalette[] = [
  // ── 01 · CENÁRIO ──
  // Composer monta narrativa institucional. FreeField pro nome do lab.
  {
    groups: [
      { label: 'Esfera', chips: ['Federal', 'Estadual', 'Municipal', 'Distrital'] },
      {
        label: 'Tipo de órgão',
        chips: ['Secretaria', 'Autarquia', 'Fundação', 'Empresa pública',
                'Agência reguladora', 'Tribunal', 'Ministério Público', 'Universidade pública'],
      },
      {
        label: 'Tema',
        chips: ['Saúde', 'Educação', 'Segurança', 'Assistência social', 'Trabalho',
                'Justiça', 'CT&I', 'Meio ambiente', 'Cultura', 'Fazenda',
                'Planejamento', 'Serviços urbanos'],
      },
      {
        label: 'Estágio do lab',
        chips: ['Recém-criado (sem portaria)', '1-2 anos', '3-5 anos', '5+ anos',
                'Em reorganização', 'Sem institucionalização formal'],
      },
      {
        label: 'Janela política',
        chips: ['Sem janela imediata', '90 dias', '6 meses', '12 meses',
                'Transição em curso', 'Defesa orçamentária próxima'],
      },
    ],
    freeFields: [
      {
        key: 'nome_do_lab',
        label: 'Nome do laboratório (a Jô vai precisar pra nominar)',
        placeholder: 'Ex: Lab de Inovação · SEMARH/MMA, GNova, LabHacker da Câmara',
      },
    ],
    composer: (active, free) => {
      const esferas = active.get('Esfera') ?? [];
      const orgaos = active.get('Tipo de órgão') ?? [];
      const temas = active.get('Tema') ?? [];
      const estagios = active.get('Estágio do lab') ?? [];
      const janelas = active.get('Janela política') ?? [];
      const labNome = (free.get('nome_do_lab') ?? '').trim();
      if (esferas.length + orgaos.length + temas.length + estagios.length + janelas.length === 0
          && labNome.length === 0) return '';

      const partes: string[] = [];
      // Identificação do lab
      if (labNome.length > 0) {
        const tags: string[] = [];
        if (esferas.length > 0) tags.push(joinPT(esferas, true));
        if (orgaos.length > 0) tags.push(joinPT(orgaos, true));
        partes.push(`${labNome}${tags.length > 0 ? ` (${tags.join(' · ')})` : ''}`);
      } else if (esferas.length > 0 || orgaos.length > 0) {
        const tipo = orgaos.length > 0 ? joinPT(orgaos, true) : 'órgão';
        const esfera = esferas.length > 0 ? ` (${joinPT(esferas, true)})` : '';
        partes.push(`Laboratório em ${tipo}${esfera}`);
      }
      // Tema/área
      if (temas.length > 0) partes.push(`atuando em ${joinPT(temas, true)}`);
      // Estágio
      if (estagios.length > 0) partes.push(joinPT(estagios, true));
      // Janela
      if (janelas.length > 0) partes.push(`janela política: ${joinPT(janelas, true)}`);

      const out = partes.join(', ') + '.';
      return out.charAt(0).toUpperCase() + out.slice(1);
    },
  },

  // ── 02 · ATORES ──
  // Composer monta lista nominada. FreeFields pro patrocinador específico
  // (Jô preserva nomes literalmente) e tamanho da equipe.
  {
    groups: [
      {
        label: 'Patrocínio (perfil)',
        chips: ['Secretário', 'Subsecretário', 'Diretor-geral', 'Presidente',
                'Conselho gestor', 'Ministro'],
      },
      {
        label: 'Equipe',
        chips: ['Chefe de divisão', 'Coordenador-geral', 'Coordenador',
                'Diretor', 'Assistente', 'Assessor', 'Analista',
                'Servidor técnico', 'Colaborador (terceirizado)', 'Estagiário',
                'Bolsista', 'Cedidos de outras áreas'],
      },
      {
        label: 'Parceiros',
        chips: ['Universidade', 'Enap', 'GNova', 'Ipea', 'Fundação',
                'ONG', 'Empresa privada', 'Cidadão usuário'],
      },
      {
        label: 'Controle',
        chips: ['Procuradoria', 'Controladoria interna', 'Auditoria',
                'TCU/TCE/TCM', 'CGU', 'Ministério Público'],
      },
      {
        label: 'Áreas-meio envolvidas',
        chips: ['TI', 'RH', 'Compras', 'Financeiro', 'Comunicação', 'Jurídico'],
      },
    ],
    freeFields: [
      {
        key: 'patrocinador_nome',
        label: 'Nome do patrocinador (Jô preserva literalmente)',
        placeholder: 'Ex: Dr. João Silva, Secretário-Executivo · ou "patrocinador não nominado"',
      },
      {
        key: 'equipe_tamanho',
        label: 'Tamanho da equipe',
        placeholder: 'Ex: 3 servidores cedidos 20h/semana · 1 coordenador FCE-3 dedicado',
      },
    ],
    composer: (active, free) => {
      const patrocinio = active.get('Patrocínio (perfil)') ?? [];
      const equipe = active.get('Equipe') ?? [];
      const parceiros = active.get('Parceiros') ?? [];
      const controle = active.get('Controle') ?? [];
      const meio = active.get('Áreas-meio envolvidas') ?? [];
      const patNome = (free.get('patrocinador_nome') ?? '').trim();
      const eqTam = (free.get('equipe_tamanho') ?? '').trim();

      if (patrocinio.length + equipe.length + parceiros.length + controle.length + meio.length === 0
          && patNome.length === 0 && eqTam.length === 0) return '';

      const partes: string[] = [];
      // Patrocinador (priorizado pelo nome se existir)
      if (patNome.length > 0) {
        partes.push(`Patrocinador: ${patNome}`);
      } else if (patrocinio.length > 0) {
        partes.push(`Patrocinador (perfil): ${joinPT(patrocinio, true)} (não nominado)`);
      }
      // Equipe (com tamanho se declarado)
      if (eqTam.length > 0 || equipe.length > 0) {
        const partesEq: string[] = [];
        if (eqTam.length > 0) partesEq.push(eqTam);
        if (equipe.length > 0) partesEq.push(joinPT(equipe, true));
        partes.push(`Equipe: ${partesEq.join(' — ')}`);
      }
      // Demais
      if (parceiros.length > 0) partes.push(`Parceiros: ${joinPT(parceiros, true)}`);
      if (controle.length > 0) partes.push(`Órgãos de controle: ${joinPT(controle, true)}`);
      if (meio.length > 0) partes.push(`Áreas-meio: ${joinPT(meio, true)}`);

      return partes.join('. ') + '.';
    },
  },

  // ── 03 · GARGALO ──
  // Composer monta "Gargalo na família X: tipo específico Y".
  // Multi-pick por família — pode haver gargalos sobrepostos.
  {
    groups: [
      {
        label: 'Jurídico-regulatório',
        chips: ['Procuradoria exige portaria',
                'Falta instrumento (ACT/TED)',
                'Insegurança sobre marco regulatório',
                'Lei de licitações engessa',
                'Sem amparo pra sandbox/piloto'],
      },
      {
        label: 'Metodológico',
        chips: ['Equipe sem método de priorização',
                'Backlog concorrente',
                'Cada projeto reinventa fluxo',
                'Sem indicadores de impacto',
                'Aprendizado não sistematizado'],
      },
      {
        label: 'Operacional',
        chips: ['Fila de TI (6+ meses)',
                'Sem dedicação exclusiva',
                'Sem orçamento próprio',
                'Cessões instáveis',
                'Sem espaço físico'],
      },
      {
        label: 'Político',
        chips: ['Patrocinador oscilante',
                'Risco de descontinuidade',
                'Lab visto como projeto pessoal',
                'Disputa com TI/planejamento'],
      },
    ],
    composer: (active) => {
      const juridico = active.get('Jurídico-regulatório') ?? [];
      const metodo = active.get('Metodológico') ?? [];
      const op = active.get('Operacional') ?? [];
      const politico = active.get('Político') ?? [];
      if (juridico.length + metodo.length + op.length + politico.length === 0) return '';

      const partes: string[] = [];
      if (juridico.length > 0) partes.push(`Jurídico-regulatório: ${joinPT(juridico, true)}`);
      if (metodo.length > 0) partes.push(`Metodológico: ${joinPT(metodo, true)}`);
      if (op.length > 0) partes.push(`Operacional: ${joinPT(op, true)}`);
      if (politico.length > 0) partes.push(`Político: ${joinPT(politico, true)}`);
      return partes.join('. ') + '.';
    },
  },

  // ── 04 · RISCO DE NÃO AGIR ──
  // Composer monta "Em [prazo]: cenário negativo X". FreeField pro prazo.
  // Coherence implícita: famílias de risco organizadas (a Jô vincula com o
  // gargalo declarado no Step 3 via raciocínio semântico no contract).
  {
    groups: [
      {
        label: 'Institucional',
        chips: ['Lab fechado na próxima transição',
                'Perda do patrocínio político',
                'Equipe se dispersa',
                'Conhecimento se perde'],
      },
      {
        label: 'Controle e sanção',
        chips: ['TCU/TCE por contratação irregular',
                'Recomendação CGU',
                'Auto da Procuradoria',
                'Notificação do Ministério Público'],
      },
      {
        label: 'Reputacional',
        chips: ['Iniciativa "queima" na casa',
                'Aposta política desmoraliza',
                'Stakeholders desistem',
                'Imprensa explora ausência de resultado'],
      },
      {
        label: 'Funcional',
        chips: ['Solução não vira serviço (fica em protótipo)',
                'Sem replicação',
                'Demanda volta pra fila',
                'Cidadão segue sem atendimento'],
      },
    ],
    freeFields: [
      {
        key: 'prazo_perda',
        label: 'Prazo crítico (quando o risco materializa)',
        placeholder: 'Ex: 12 meses · próxima eleição estadual em 10/2026 · transição prevista pra janeiro/2027',
      },
    ],
    composer: (active, free) => {
      const inst = active.get('Institucional') ?? [];
      const sancao = active.get('Controle e sanção') ?? [];
      const rep = active.get('Reputacional') ?? [];
      const func = active.get('Funcional') ?? [];
      const prazo = (free.get('prazo_perda') ?? '').trim();
      if (inst.length + sancao.length + rep.length + func.length === 0 && prazo.length === 0) return '';

      const partes: string[] = [];
      if (prazo.length > 0) {
        partes.push(`Em ${prazo}, se nada mudar`);
      } else {
        partes.push('Se nada mudar');
      }
      const cenarios: string[] = [];
      if (inst.length > 0) cenarios.push(`institucional (${joinPT(inst, true)})`);
      if (sancao.length > 0) cenarios.push(`sanção (${joinPT(sancao, true)})`);
      if (rep.length > 0) cenarios.push(`reputacional (${joinPT(rep, true)})`);
      if (func.length > 0) cenarios.push(`funcional (${joinPT(func, true)})`);
      if (cenarios.length > 0) {
        partes.push(`risco esperado: ${cenarios.join('; ')}`);
      }
      return partes.join(' — ') + '.';
    },
  },
];
