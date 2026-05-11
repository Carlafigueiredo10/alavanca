import type { Prompt } from './_types';

export const formalizarPrompts: Prompt[] = [
  {
    id: 'p04', num: '04', eixoId: 'formalizar',
    eyebrow: 'Lastro institucional · Lei 13.243/2016',
    title: 'Virar Instituição de Ciência e Tecnologia (ICT).',
    purpose: 'Para captar recursos, firmar parcerias estratégicas e ter o reconhecimento que o Marco Legal de CT&I oferece.',
    promptLabel: 'Prompt · Transformação em ICT',
    body: `Você é um <em>consultor jurídico</em> especialista no Marco Legal de Ciência, Tecnologia e Inovação (Lei nº 13.243/2016). Seu papel é traduzir requisitos jurídicos em argumentos institucionais que a alta gestão consiga ler e decidir em uma reunião de gabinete.

<strong>Sua tarefa:</strong>

Construir uma minuta executiva (até 2 páginas) defendendo a transformação do nosso laboratório em ICT, nos moldes do Labori/AGU. A minuta vai a alta gestão e precisa convencer pessoas que não conhecem o marco em detalhe.

<strong>1. Justificativa de enquadramento</strong>

Demonstre por que nossa unidade já atende aos requisitos materiais de uma ICT, mesmo sem o reconhecimento formal. Aponte:
- Qual atividade que exercemos se enquadra no conceito legal de "pesquisa e desenvolvimento"
- Qual quadro técnico já cumpre o requisito de capacidade institucional
- Qual histórico de entregas reforça o pleito

Construa o argumento como descrição de fato, não como pedido defensivo.

<strong>2. Ganhos jurídicos</strong>

Liste os instrumentos que o reconhecimento como ICT desbloqueia:
- TED (Termo de Execução Descentralizada) com outras unidades públicas
- Contratos de parceria para PD&I com setor privado
- Dispensas qualificadas de licitação para insumos específicos
- Acesso a editais reservados a ICTs

Para cada instrumento, indique uma situação concreta atual em que ele resolveria um problema nosso.

<strong>3. Ganhos administrativos</strong>

Foque em três efeitos práticos:
- Captação direta de recursos extraorçamentários
- Autonomia para firmar parcerias sem trâmite externo
- Possibilidade de remuneração de pesquisador colaborador

<strong>4. Riscos da não-formalização</strong>

Inverta o argumento. Mostre o que perdemos por permanecer informal:
- Editais que não conseguimos acessar
- Parcerias que ficam inviáveis juridicamente
- Vulnerabilidade institucional (lab sem amparo legal é o primeiro a cair em corte)

<strong>5. Próximos passos</strong>

Liste 5 ações concretas, com responsável sugerido e prazo realista, para iniciar o processo de reconhecimento.

Tom: técnico, assertivo, sem juridiquês excessivo. O texto deve poder ser usado como nota técnica sem reescrita.`,
    when: 'Reunião com gabinete · construção de proposta para virar unidade formal · resposta à pergunta "por que isso importa?".',
  },
  {
    id: 'p05', num: '05', eixoId: 'formalizar',
    eyebrow: 'Experimentação · LC 182/2021',
    title: 'Construir um sandbox regulatório com salvaguardas.',
    purpose: 'Para testar uma solução que esbarra na regra atual, dentro de um ambiente experimental seguro e bem desenhado.',
    promptLabel: 'Prompt · Sandbox Regulatório',
    body: `Você é um <em>procurador federal</em> com experiência em Marco Legal das Startups (Lei Complementar nº 182/2021) e desenho de ambientes regulatórios experimentais. Seu papel é estruturar argumentos que sustentem a criação de um sandbox para uma solução que esbarra na regra atual — sem sacrificar proteção do usuário.

<strong>Sua tarefa:</strong>

Estruturar uma nota técnica que justifique a criação de um Sandbox Regulatório para a seguinte solução:

<span class="placeholder">[DESCREVER A SOLUÇÃO]</span>

A nota vai a órgão regulador. Precisa demonstrar que a proposta é responsável e mensurável.

<strong>1. Inovação em jogo</strong>

Defina precisamente qual é a inovação tecnológica ou metodológica que justifica tratamento experimental. Distinga:
- O que é tecnicamente novo
- O que é apenas reorganização de algo já permitido
- Por que a regra atual não comporta essa novidade sem distorcer o desenho

Sem ambiguidade aqui — o sandbox só se justifica se a inovação for real.

<strong>2. Métricas de monitoramento</strong>

Defina o que será medido durante o período experimental:
- Indicadores quantitativos (acesso, conversão, reclamação, incidente)
- Indicadores qualitativos (experiência, percepção de risco, confiança)
- Frequência de coleta e responsável pela auditoria
- Quem terá acesso aos dados e em que formato

Cada métrica deve ter um limite a partir do qual o sandbox é interrompido ou reavaliado.

<strong>3. Limites e salvaguardas</strong>

Defina o perímetro do experimento:
- Escopo geográfico ou populacional
- Duração máxima
- Perfil de usuário elegível
- Critérios objetivos de saída antecipada

Justifique cada limite escolhido (por que esse tamanho, por que esse prazo).

<strong>4. Proteção do usuário</strong>

Construa a camada de proteção do cidadão participante:
- Consentimento informado claro (não termo de adesão de 30 páginas)
- Mecanismo de reversibilidade (como o usuário sai sem prejuízo)
- Política de ressarcimento se o experimento causar dano material ou imaterial
- Canal direto de reclamação durante o sandbox

<strong>5. Critério de sucesso</strong>

Defina o gatilho de regulação definitiva:
- Qual evidência empírica justifica transformar a experiência em norma
- Qual evidência justifica encerrar sem regulação
- Qual cenário intermediário pede prorrogação do sandbox e por quanto tempo

Entregue como minuta de nota técnica, com cabeçalho, contextualização, fundamentação e encaminhamento.`,
    when: 'Solução pronta mas travada por norma · diálogo com órgão regulador · construção de piloto controlado.',
  },
  {
    id: 'p06', num: '06', eixoId: 'formalizar',
    eyebrow: 'Compras Públicas de Inovação · CPSI',
    title: 'Lançar um edital ou hackathon com termo decente.',
    purpose: 'Para abrir o problema ao ecossistema, com critérios claros de elegibilidade, diversidade e contratação.',
    promptLabel: 'Prompt · Inovação Aberta',
    body: `Você é um <em>gestor de inovação aberta no setor público</em> com domínio das Compras Públicas de Inovação (CPSI), da Lei nº 14.133/2021 e dos modelos brasileiros de hackathons e editais de chamamento (TI Maior, GovTech, BNDES Garagem). Seu papel é abrir o problema ao ecossistema sem perder rigor jurídico nem disposição para diversidade.

<strong>Sua tarefa:</strong>

Estruturar um termo de referência básico para um edital ou hackathon que abra o seguinte desafio:

<span class="placeholder">[DESCREVER DESAFIO]</span>

O termo precisa ser editável, claro o suficiente para atrair startups diversas, e juridicamente sustentado.

<strong>1. Contexto do problema</strong>

Apresente o desafio em termos de impacto cidadão, não de necessidade interna:
- Quem sofre o problema hoje e como
- Qual é o custo de não resolver (em tempo, dinheiro, dignidade ou acesso)
- Por que o setor público sozinho não está conseguindo destravar

<strong>2. Critérios de elegibilidade</strong>

Defina quem pode participar com olhar explícito sobre diversidade:
- Tipos de proponente (MEI, microempresa, startup, ICT, pessoa física)
- Reservas ou pontuação extra para empresas lideradas por mulheres, pessoas negras ou indígenas, periferia geográfica
- Vedações justificadas (sem misturar critério político com critério técnico)
- Estágio de maturidade da solução exigido (ideia, protótipo, produto)

<strong>3. Modelo de contratação</strong>

Justifique a base legal escolhida dentro de CPSI:
- Diálogo competitivo, contratação direta para PD&I, prêmio, ou outro instrumento
- Por que esse modelo encaixa neste desafio específico
- Limites do que ele permite contratar

<strong>4. Cronograma</strong>

Detalhe as fases:
- Inscrição (prazo, canal, requisitos documentais mínimos)
- Mentoria pré-seleção (formato, mentores envolvidos)
- Prototipação (entregáveis e check-ins)
- Premiação e contratação subsequente

Para cada fase, indique entregável e gate de avanço.

<strong>5. Critérios de avaliação</strong>

Construa a matriz com pesos explícitos:
- Aderência ao desafio
- Viabilidade técnica
- Impacto público esperado
- Diversidade da equipe proponente
- Maturidade comercial da solução

Indique como a banca vai pontuar cada critério (rubrica, escala, parecer fundamentado).

<strong>6. O que ganha quem ganha</strong>

Detalhe a recompensa:
- Premiação financeira (se houver) e natureza tributária
- Contratação subsequente (se houver) e seu valor estimado
- Mentoria, vitrine institucional, conexão com órgãos
- Direitos sobre a propriedade intelectual gerada

Entregue em formato editável, linguagem direta, com placeholders explícitos para datas e valores que dependem do nosso contexto.`,
    when: 'Lançamento de hackathon · edital de chamamento · construção de portfólio de inovação aberta.',
  },
];
