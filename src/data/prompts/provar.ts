import type { Prompt } from './_types';

export const provarPrompts: Prompt[] = [
  {
    id: 'p13', num: '13', eixoId: 'provar',
    eyebrow: 'Sobrevivência · Transição de gestão',
    title: 'Defender o lab numa troca de governo.',
    purpose: 'Para construir o briefing que conquista o patrocínio político novo — antes que o orçamento seja cortado por desconhecimento.',
    promptLabel: 'Prompt · Defesa Institucional',
    body: `Você é um <em>estrategista de governança pública</em> com vivência em transições de governo no Executivo brasileiro — sabe que o lab que não conta a própria história em três slides numa segunda-feira de janeiro está morto até março.

<strong>Sua tarefa:</strong>

Construir um Briefing Executivo (máximo 2 páginas) que defenda a sobrevivência do nosso lab junto à nova direção da gestão. Nossas três principais entregas do último ano foram:

<span class="placeholder">[INSERIR AS 3 ENTREGAS, COM RESULTADOS E NÚMEROS]</span>

O briefing vai a um dirigente que pode não conhecer o lab. Precisa ser convincente sem ser bajulador, denso sem ser árido, técnico sem ser fechado.

<strong>1. Resumo do problema institucional</strong>

Em uma frase única, o problema que o lab resolve. Não missão genérica — problema concreto. Se cabe em uma frase, cabe na cabeça do dirigente.

<strong>2. Como o lab mitiga risco da nova gestão</strong>

Inverta a lógica: o lab não é custo, é mecanismo de redução de risco da própria gestão. Mostre:
- Quantas iniciativas testamos antes de escalar (e quantas falharam barato)
- Quanto orçamento o método protegeu de erro caro
- Que decisões a alta gestão tomou com mais informação porque o lab testou primeiro

A nova gestão é o cliente, não o adversário. Mostre como ela ganha mantendo o lab.

<strong>3. Eficiência e economia entregues</strong>

Cifras concretas, com fonte explícita:
- Tempo economizado em processos
- Custo evitado em soluções superdimensionadas
- Receita ou benefício gerado
- Beneficiários alcançados

Sem inflar números. Cifra honesta vence cifra grande não verificável.

<strong>4. Como o lab acelera as prioridades declaradas da nova gestão</strong>

Pesquise as prioridades públicas do dirigente novo e construa pelo menos três pontes:
- "A prioridade X declarada se resolve mais rápido com Y, que o lab faz"
- Não invente. Se a prioridade ainda não foi declarada, indique como o lab se reposiciona quando ela aparecer.

<strong>5. Pedido objetivo</strong>

Termine com pedido específico, não com expectativa vaga:
- Decisão (o que precisa ser decidido por quem)
- Sinal (que postura pública o dirigente assume — mantém, expande, descontinua)
- Acesso (que canal de interlocução e com que frequência)

Tom: assertivo, sem bajulação, com lastro em dados. O dirigente precisa terminar a leitura sabendo o que precisa fazer e por quê — não impressionado, mas convencido.`,
    when: 'Pós-eleição · troca de ministro/secretário · primeira reunião de pauta com o novo dirigente · ameaça explícita de descontinuidade.',
  },
  {
    id: 'p14', num: '14', eixoId: 'provar',
    eyebrow: 'Comunicação · Storytelling de impacto',
    title: 'Transformar dado frio em narrativa que mobiliza.',
    purpose: 'Para sair do relatório burocrático e construir um pitch de 3 minutos com cenário, jornada, solução e valor público real.',
    promptLabel: 'Prompt · Storytelling de Impacto',
    body: `Você é um <em>especialista em storytelling corporativo no setor público</em>, com domínio da estética de pitch institucional e de newsletter para audiência mista (técnica e leiga). Seu papel é traduzir dado frio em narrativa que mobiliza, sem cair em marketing de ONG.

<strong>Sua tarefa:</strong>

Transformar os dados e resultados abaixo em duas peças narrativas — uma falada, uma escrita — preservando rigor numérico e adicionando carne humana:

<span class="placeholder">[INSERIR DADOS, RESULTADOS E NÚMEROS DO PROJETO]</span>

As duas peças devem ser usáveis fora desta semana — não amarrar a história a evento ou data específica.

<strong>Versão A — Pitch falado de 3 minutos</strong>

Para reunião de comitê ou apresentação pública. Estrutura:
- Cenário antes do projeto (a dor concreta — não estatística, situação)
- Jornada de descoberta (o que tentamos, o que não funcionou, o que aprendemos)
- Solução (uma frase, sem juridiquês)
- Valor público real (em tempo, dinheiro, dignidade ou acesso — não em "transformação")
- Próximo passo (o que o lab pede da audiência ao final)

Inclua pelo menos um dado humano (nome fictício, fala curta) para sair do abstrato. Marque a fala humana com aspas.

<strong>Versão B — Artigo curto de newsletter</strong>

Até 600 palavras. Estrutura:
- Chamada de abertura que prende em 10 segundos (não título corporativo neutro)
- Mesmo arco narrativo do pitch (cenário → jornada → solução → valor)
- Dois ou três dados-chave intercalados, com fonte explícita
- Fecho que abre próximo passo público (chamada para conhecer, replicar, ler mais)

<strong>Restrições compartilhadas para as duas peças</strong>

- Não use adjetivos vazios ("inovador", "revolucionário", "transformador")
- Não infle número (se o impacto foi pequeno, conte como aprendizado, não como vitória)
- Não suprima fracasso (o que falhou pertence à história — torna o sucesso crível)
- Não termine com chamada motivacional vaga ("o futuro é agora")

A dor entra em cena no parágrafo um. A solução entra em cena no parágrafo três. O valor entra em cena no parágrafo cinco. Quem entrega isso narrativo passou no teste.`,
    when: 'Apresentação para alta gestão · newsletter trimestral · pitch em encontro de labs · prestação de contas pública.',
  },
  {
    id: 'p15', num: '15', eixoId: 'provar',
    eyebrow: 'Governança · Alinhamento ao PPA',
    title: 'Sair do balcão de pedidos.',
    purpose: 'Para reposicionar o lab como ferramenta transversal que entrega metas institucionais — não como bombeiro que apaga incêndio alheio.',
    promptLabel: 'Prompt · Alinhamento Estratégico',
    body: `Você é um <em>consultor de inovação sistêmica</em> com vivência em planejamento estratégico governamental, Plano Plurianual (PPA), governança de portfólio público e os mecanismos de defesa que diferenciam um lab consolidado de um "balcão de pedidos" institucional.

<strong>Sua tarefa:</strong>

Construir 3 estratégias práticas de governança que vinculem o portfólio do nosso lab diretamente às metas do nosso planejamento estratégico (ou PPA), provando que inovação é ferramenta transversal — não apagador de incêndios alheios.

Metas institucionais de referência:

<span class="placeholder">[INSERIR DE 3 A 5 METAS INSTITUCIONAIS]</span>

<strong>Para cada estratégia, descreva:</strong>

<strong>1. Como funciona na prática</strong>

Passo a passo executável. Concreto:
- Quem participa
- Que ritual ou cadência ela cria
- Que decisão ela produz
- Em quanto tempo ela dá resultado visível

<strong>2. Ritual ou instância que ela ativa</strong>

Indique o instrumento concreto:
- Comitê (formato, frequência, composição)
- OKR ou framework equivalente (escopo, dono, ciclo)
- Governança de portfólio (matriz de priorização, comitê de avaliação)
- Instrução normativa interna (rito de aceitação de demanda)

Não invente instrumento. Use o que já existe na cultura institucional brasileira.

<strong>3. Critério para recusar demanda fora do escopo</strong>

A parte mais difícil — recusar sem queimar relação política:
- Critério objetivo (não preferência pessoal)
- Linguagem da recusa (modelo de resposta a pedido fora do escopo)
- Caminho alternativo oferecido (para onde redireciono o demandante)
- Quem assina a recusa (líder do lab, não técnico)

<strong>4. Sinal ou relatório periódico</strong>

Que evidência o lab passa a entregar à alta direção a cada ciclo:
- Formato (dashboard, nota técnica, briefing)
- Frequência
- Conteúdo (não vaidade — entrega vinculada à meta institucional)
- Quem é o leitor primário

<strong>Para as 3 estratégias juntas</strong>

Demonstre que elas se reforçam — não competem. Aponte qual é a porta de entrada (a que se implementa primeiro), qual é a porta de saída (a que sustenta o reposicionamento) e qual é a estratégia de manutenção.

Tom: prático e político, não acadêmico. Quero argumentos que possam ser levados para a próxima reunião de gabinete sem reescrita.`,
    when: 'Revisão de PPA · construção de portfólio anual · reposicionamento institucional · justificativa para recusar demanda fora do escopo.',
  },
];
