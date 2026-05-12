// Catálogo de chips por campo de wizard. Cada palette agrupa itens recorrentes
// no domínio público — o user clica pra concatenar ao textarea, ou digita livre.
// A ordem dos arrays em MAPEAR_PALETTES bate com a ordem das telas do wizard
// (1 = Cenário, 2 = Atores, 3 = Gargalo, 4 = Risco).

export interface ChipGroup {
  label: string;     // título exibido sobre a fileira de chips
  chips: string[];   // texto exibido = texto inserido no textarea
}

export interface ChipPalette {
  groups: ChipGroup[];
}

// ============================================================
// MAPEAR · Passo 0 · 4 campos
// ============================================================
export const MAPEAR_PALETTES: ChipPalette[] = [
  // ── 01 · CENÁRIO ──
  {
    groups: [
      {
        label: 'Esfera',
        chips: ['Federal', 'Estadual', 'Municipal', 'Distrital'],
      },
      {
        label: 'Tipo de órgão',
        chips: ['Secretaria', 'Autarquia', 'Fundação', 'Empresa pública', 'Tribunal', 'Ministério Público'],
      },
      {
        label: 'Tema',
        chips: [
          'Saúde', 'Educação', 'Segurança', 'Assistência social', 'Trabalho',
          'Justiça', 'CT&I', 'Meio ambiente', 'Cultura', 'Fazenda',
          'Planejamento', 'Serviços urbanos',
        ],
      },
      {
        label: 'Estágio do lab',
        chips: [
          'Recém-criado', '1-2 anos', '3-5 anos', '5+ anos',
          'Em reorganização', 'Sem institucionalização formal',
        ],
      },
    ],
  },

  // ── 02 · ATORES ──
  {
    groups: [
      {
        label: 'Equipe',
        chips: [
          'Chefe de divisão', 'Coordenador', 'Coordenador-geral', 'Diretor',
          'Assistente', 'Assessor', 'Analista', 'Servidor técnico',
          'Colaborador (terceirizado)', 'Estagiário', 'Bolsista',
        ],
      },
      {
        label: 'Patrocínio',
        chips: ['Secretário', 'Subsecretário', 'Diretor-geral', 'Presidente', 'Conselho gestor'],
      },
      {
        label: 'Controle',
        chips: [
          'Procuradoria', 'Controladoria interna', 'Auditoria',
          'TCU/TCE/TCM', 'CGU', 'Ministério Público',
        ],
      },
      {
        label: 'Áreas-meio',
        chips: ['TI', 'RH', 'Compras', 'Financeiro', 'Comunicação', 'Jurídico'],
      },
      {
        label: 'Parceiros',
        chips: [
          'Universidade', 'Enap', 'GNova', 'Ipea',
          'Fundação', 'ONG', 'Empresa privada', 'Cidadão usuário',
        ],
      },
    ],
  },

  // ── 03 · GARGALO ──
  {
    groups: [
      {
        label: 'Jurídico-regulatório',
        chips: [
          'Procuradoria exige portaria',
          'Falta instrumento (ACT/TED)',
          'Insegurança sobre marco regulatório',
          'Lei de licitações engessa',
          'Sem amparo pra sandbox/piloto',
        ],
      },
      {
        label: 'Metodológico',
        chips: [
          'Equipe sem método de priorização',
          'Backlog concorrente',
          'Cada projeto reinventa fluxo',
          'Sem indicadores de impacto',
          'Aprendizado não sistematizado',
        ],
      },
      {
        label: 'Operacional',
        chips: [
          'Fila de TI (6+ meses)',
          'Sem dedicação exclusiva',
          'Sem orçamento próprio',
          'Cessões instáveis',
          'Sem espaço físico',
        ],
      },
      {
        label: 'Político',
        chips: [
          'Patrocinador oscilante',
          'Risco de descontinuidade',
          'Lab visto como projeto pessoal',
          'Disputa com TI/planejamento',
        ],
      },
    ],
  },

  // ── 04 · RISCO DE NÃO AGIR ──
  {
    groups: [
      {
        label: 'Institucional',
        chips: [
          'Lab fechado na próxima transição',
          'Perda do patrocínio político',
          'Equipe se dispersa',
          'Conhecimento se perde',
        ],
      },
      {
        label: 'Controle e sanção',
        chips: [
          'TCU/TCE por contratação irregular',
          'Recomendação CGU',
          'Auto da Procuradoria',
          'Notificação do Ministério Público',
        ],
      },
      {
        label: 'Reputacional',
        chips: [
          'Iniciativa "queima" na casa',
          'Aposta política desmoraliza',
          'Stakeholders desistem',
          'Imprensa explora ausência de resultado',
        ],
      },
      {
        label: 'Funcional',
        chips: [
          'Solução não vira serviço (fica em protótipo)',
          'Sem replicação',
          'Demanda volta pra fila',
          'Cidadão segue sem atendimento',
        ],
      },
    ],
  },
];
