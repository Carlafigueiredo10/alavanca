import type { Prompt } from './_types';

export const avaliarPrompts: Prompt[] = [
  {
    id: 'p11', num: '11', eixoId: 'avaliar',
    eyebrow: 'Avaliação · LA-BORA! gov',
    title: 'Medir valor público — não só satisfação.',
    purpose: 'Para construir feedback que vai além do "deu certo?" e mede segurança psicológica, aplicabilidade e impacto.',
    promptLabel: 'Prompt · Avaliação de Impacto',
    body: `Você é um <em>avaliador de laboratórios de inovação</em> inspirado no modelo LA-BORA! gov, com domínio sobre como medir valor público real (não vaidade) e como construir feedback que sobrevive a corte de orçamento.

<strong>Sua tarefa:</strong>

Construir um questionário de feedback curto (máximo 5 perguntas) para enviarmos aos usuários do projeto que acabamos de finalizar:

<span class="placeholder">[INSERIR OBJETIVO DO PROJETO]</span>

O questionário precisa medir o que importa, em pouco espaço — porque ninguém responde formulário longo.

<strong>1. Quadro de dimensões</strong>

Antes das perguntas, declare quais quatro dimensões você vai medir e por quê:
- Segurança psicológica (o usuário se sentiu respeitado, ouvido, sem retaliação)
- Aplicabilidade (o que aprendemos cabe na rotina dele)
- Valor público real (impacto em tempo, dinheiro, dignidade, acesso)
- Disposição para escala (ele defenderia a solução para outras unidades)

<strong>2. As cinco perguntas</strong>

Para cada pergunta, especifique:
- O texto exato (linguagem direta, sem jargão de pesquisa)
- O formato de resposta (escala Likert, escolha múltipla, texto livre, NPS adaptado)
- Qual dimensão ela mede
- Que viés de resposta ela mitiga (acquiescência, desejabilidade social, aversão ao extremo)

<strong>3. Pergunta âncora</strong>

Uma das cinco deve ser pergunta âncora — a que, sozinha, te diria mais sobre o sucesso do projeto se você só pudesse fazer uma. Marque-a e justifique.

<strong>4. Plano de leitura</strong>

Indique:
- Qual padrão de resposta indica que a solução está pronta para escalar
- Qual padrão indica ajuste antes de escalar
- Qual padrão indica descontinuidade (porque a falha precisa ser dita também)

<strong>5. Cuidado ético</strong>

Sinalize qualquer pergunta que, dependendo do contexto, pode constranger o respondente, e proponha versão alternativa. O lab que erra aqui perde a confiança da área finalística.

Não use NPS puro como métrica única — explique por que ele é insuficiente para inovação pública.`,
    when: 'Final de ciclo de projeto · pós-piloto · antes de defender continuidade ou escala junto à alta gestão.',
  },
  {
    id: 'p12', num: '12', eixoId: 'avaliar',
    eyebrow: 'Métrica · KPIs adaptáveis · LA-BORA! gov',
    title: 'Medir inovação sem virar burocracia.',
    purpose: 'Para definir indicadores que reconhecem aprendizado mesmo quando o protótipo falha — porque a falha bem documentada também é entrega.',
    promptLabel: 'Prompt · Indicadores Adaptáveis',
    body: `Você é um <em>avaliador de políticas públicas</em> especialista em métricas de laboratórios de inovação, inspirado no modelo LA-BORA! gov. Seu papel é construir KPIs que reconheçam aprendizado mesmo quando o protótipo falha — porque falha bem documentada também é entrega.

<strong>Sua tarefa:</strong>

Construir um quadro de 3 a 5 KPIs adaptáveis para o seguinte projeto:

<span class="placeholder">[INSERIR TEMA DO PROJETO]</span>

Os KPIs vão a financiadores e à alta gestão. Precisam ser legíveis para quem não tem letramento metodológico em inovação, mas honestos sobre o que de fato medem.

<strong>Princípio orientador (declare antes do quadro)</strong>

Inovação pública não pode ser medida pelos mesmos padrões da burocracia tradicional — output linear, prazo fixo, escopo congelado. Mas também não pode escapar de medição rigorosa, ou vira retórica.

<strong>1. Mudança de comportamento</strong>

Indicador que captura mudança no servidor ou no cidadão pós-intervenção:
- O que mede, em uma frase
- Fonte do dado e periodicidade
- Limite que dispara decisão da liderança
- Comportamento esperado se o projeto for descontinuado (anti-vaidade — métrica que mede o lab, não o impacto, é vaidade)

<strong>2. Aprendizado gerado</strong>

Indicador que reconhece falha bem documentada como entrega:
- Número de hipóteses testadas e refutadas com método
- Velocidade de iteração entre hipótese e teste
- Capilaridade do aprendizado (quantas equipes herdaram o que aprendemos)

<strong>3. Melhoria da experiência</strong>

Indicador focado no usuário final (cidadão ou servidor receptor):
- Antes/depois em algum atributo concreto da experiência (tempo, etapas, fricção, satisfação)
- Forma de captura que não dependa exclusivamente de questionário

<strong>4. Velocidade de iteração (opcional)</strong>

Se relevante para o projeto:
- Tempo médio entre identificar uma hipótese e testá-la
- Tempo médio entre testar e ajustar

<strong>Para cada KPI</strong>

- Frase única do que mede
- Fonte do dado e periodicidade
- Limite que dispara decisão
- Comportamento esperado se o projeto for descontinuado
- Como evitar gaming (servidor mexer no número sem mexer na realidade)

Entregue como tabela editável.`,
    when: 'Início de novo projeto · revisão do portfólio · construção de relatório anual · negociação de orçamento com financiadores.',
  },
];
