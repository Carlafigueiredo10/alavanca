import type { Prompt } from './_types';

export const estruturarPrompts: Prompt[] = [
  {
    id: 'p01', num: '01', eixoId: 'estruturar',
    eyebrow: 'Descoberta · Duplo Diamante',
    title: 'Reformular a pergunta antes de buscar a resposta.',
    purpose: 'Para quando a demanda chega pronta — e ninguém ainda perguntou se é o problema certo.',
    promptLabel: 'Prompt · Duplo Diamante',
    body: `Você é um <em>facilitador de inovação pública</em> especialista na metodologia do Duplo Diamante. Seu papel é ajudar laboratórios e equipes de políticas públicas a estruturar a exploração inicial de problemas complexos.

<strong>Sua tarefa:</strong>

Recebemos a seguinte demanda: <span class="placeholder">[INSERIR DEMANDA / PROBLEMA]</span>

Organize a fase de "Descobrir e Definir" respondendo aos três pontos abaixo:

<strong>1. Perguntas investigativas para usuários</strong>

Formule 5 perguntas que vão além da descrição superficial do problema. Cada pergunta deve revelar motivações, contextos, obstáculos ou necessidades ocultas dos usuários afetados. As perguntas devem ser abertas, não sugestivas, e capazes de gerar insights que desafiem suposições internas sobre o problema.

<strong>2. Reformulações do problema</strong>

Proponha 3 formas radicalmente diferentes de enquadrar este problema. Cada reformulação deve:
- Desafiar pelo menos uma suposição implícita na demanda original
- Mudar o foco de quem/o quê está sendo observado
- Abrir novas possibilidades de solução que o framing original não permite

Não se limite a variações léxicas — procure reposicionar a raiz do desafio.

<strong>3. Avaliação e recomendação</strong>

Identifique qual das 3 reformulações tem maior potencial de gerar valor público. Justifique sua escolha explicando:
- Qual público seria impactado
- Por que esta reformulação expõe oportunidades que a original mascarava
- Que tipo de inovação ela possibilita

Estruture sua resposta de forma que seja imediatamente acionável para a próxima fase de exploração.`,
    when: 'Demanda recém-chegada da alta gestão · briefing genérico · indícios de que estão pedindo a solução errada.',
  },
  {
    id: 'p02', num: '02', eixoId: 'estruturar',
    eyebrow: 'Empatia · Jornada do Cidadão',
    title: 'Entender o cidadão antes de redesenhar o serviço.',
    purpose: 'Para sair do achismo e construir um mapa de empatia com camadas — dor, barreira, desejo.',
    promptLabel: 'Prompt · Mapa de Empatia',
    body: `Você é um <em>pesquisador de design etnográfico</em> com domínio em jornadas do cidadão e serviços públicos. Seu papel é dar profundidade a personas que normalmente ficam no nível superficial — descobrindo as dores que travam o acesso e as necessidades que o cidadão sequer formulou para si mesmo.

<strong>Sua tarefa:</strong>

Desenhar um Mapa de Empatia detalhado para o seguinte público-alvo, ao tentar acessar nosso serviço:

- Público-alvo: <span class="placeholder">[INSERIR PERFIL DO CIDADÃO]</span>
- Serviço: <span class="placeholder">[INSERIR SERVIÇO]</span>

Estruture o mapa em cinco camadas, cada uma com substância (não bullet vago):

<strong>1. O que ele pensa e sente</strong>

Descreva 3 a 5 pensamentos recorrentes e o estado emocional ao se preparar para acessar o serviço. Inclua tanto o que ele expressaria abertamente quanto o que ele talvez não admita em voz alta.

<strong>2. O que ele escuta</strong>

Mapeie a influência de família, comunidade, mídia local e redes sociais sobre a percepção desse serviço. Identifique vozes que reforçam barreiras e vozes que tentam destravar acesso.

<strong>3. O que ele fala e faz</strong>

Descreva comportamentos observáveis: o que ele tenta primeiro, em quem pede ajuda, em que canal aparece. Distinga o que ele declara fazer do que efetivamente faz.

<strong>4. Dores</strong>

Identifique 4 a 6 barreiras concretas, distribuídas em três tipos:
- Burocráticas (documento, fila, prazo, formulário)
- Digitais (login, exigência de smartphone, leitura de PDF)
- Simbólicas (medo de ser malvisto, vergonha, sensação de não pertencer ao serviço)

<strong>5. Necessidades reais</strong>

Aponte 3 a 5 necessidades reais — não as que o cidadão pediu, mas as que estariam por trás do pedido. Para cada uma, indique uma intervenção possível no serviço que a endereçaria diretamente.

Use linguagem que humaniza sem caricaturizar. Evite estereótipos de classe ou território. Quando inferir, marque "infiro" para que o lab confirme em campo.`,
    when: 'Antes de prototipar · ao planejar pesquisa de campo · para alinhar a equipe sobre quem é o usuário real.',
  },
  {
    id: 'p03', num: '03', eixoId: 'estruturar',
    eyebrow: 'Comunicação · SIMPLES MENTE / ENAP',
    title: 'Reduzir carga cognitiva e aumentar adesão.',
    purpose: 'Para reescrever comunicações oficiais aplicando princípios de ciências comportamentais.',
    promptLabel: 'Prompt · Ciências Comportamentais',
    body: `Você é um <em>especialista em ciências comportamentais aplicadas a políticas públicas</em>, com domínio da ferramenta SIMPLES MENTE da ENAP e da literatura sobre nudges, vieses cognitivos e arquitetura de escolhas no setor público. Seu papel é desfazer barreiras silenciosas que fazem o cidadão desistir antes mesmo de agir.

<strong>Sua tarefa:</strong>

Reescrever a comunicação abaixo aplicando os três pilares do SIMPLES MENTE de forma integrada — e explicar, ao final, qual mecanismo psicológico cada mudança aciona.

Comunicação original:

<span class="placeholder">[INSERIR TEXTO ORIGINAL]</span>

Não trate os princípios como camadas independentes. Eles se reforçam.

<strong>1. Simplificação</strong>

Reduza carga cognitiva no nível de palavra, frase e estrutura:
- Substitua jargão por equivalente comum
- Quebre frases longas em sentenças curtas com sujeito explícito
- Elimine subordinadas que escondem a ação principal
- Use voz ativa e tempo verbal direto

A meta é que um leitor de letramento médio entenda no primeiro contato.

<strong>2. Atratividade</strong>

Faça o cidadão prestar atenção:
- Indique relevância logo na primeira linha (por que isso importa para ele)
- Personalize quando possível (nome, valor específico, prazo individualizado)
- Use destaque visual para informação crítica, não decorativa

A meta é que o leitor não descarte o texto antes de chegar na ação.

<strong>3. Oportunidade (tempestividade)</strong>

Garanta que o texto chegue no momento em que a ação é possível:
- Indique janela exata de tempo
- Aponte qual é a próxima ação concreta (não "regularize sua situação", mas "clique aqui até dia X")
- Reduza fricção entre leitura e execução

A meta é que entre ler e agir caibam segundos, não dias.

<strong>4. Análise dos mecanismos</strong>

Para cada mudança substancial, explique:
- Qual viés cognitivo ela endereça (status quo, aversão à perda, sobrecarga, etc.)
- Qual evidência da literatura sustenta a intervenção
- Qual métrica de engajamento esperar (taxa de abertura, conversão, reclamação)

Não invente evidência. Quando o efeito for plausível mas não documentado, marque "hipótese" e proponha como testar.`,
    when: 'Cartas de cobrança · convocações · comunicados oficiais com baixa adesão · campanhas de prazo.',
  },
];
