import type { Prompt } from './_types';

export const aplicarPrompts: Prompt[] = [
  {
    id: 'p16', num: '16', eixoId: 'aplicar',
    eyebrow: 'Utilitário · Landing institucional',
    title: 'Página única para apresentar o lab a quem chega.',
    purpose: 'Para o lab ter cara pública sem depender da fila da comunicação ou da TI — cola o prompt na IA de preferência e sai com landing pronta para abrir no navegador.',
    promptLabel: 'Prompt · Página do Lab',
    body: `Você é um <em>designer de produto digital</em> especialista em comunicação institucional para o setor público brasileiro. Você domina a estética entre o sóbrio institucional e o contemporâneo acessível — sem cair em caricatura de startup, sem cair em portal de prefeitura de 2009. Seu papel é traduzir a identidade de um laboratório de inovação pública em uma página única que apresente o lab a quem chega pela primeira vez: gestor, parceiro, servidor curioso, jornalista.

<strong>Sua tarefa:</strong>

Construir uma landing page institucional auto-contida (HTML + CSS em arquivo único, pronta para salvar como <code>index.html</code> e abrir no navegador), seguindo os parâmetros abaixo.

<strong>1. Identidade do lab</strong>

- Nome do lab: <span class="placeholder">[INSERIR NOME]</span>
- Órgão ou instituição vinculada: <span class="placeholder">[INSERIR ÓRGÃO]</span>
- Missão em uma frase (verbo + público + valor concreto, sem genéricos): <span class="placeholder">[INSERIR MISSÃO]</span>
- Estética desejada (escolha uma): <span class="placeholder">[sóbria institucional · contemporânea acessível · técnica-experimental]</span>
- Cor primária (hex ou nome — ex: #1F4F86, terracota, verde-floresta): <span class="placeholder">[INSERIR COR PRIMÁRIA]</span>

<strong>2. Conteúdo da página</strong>

- 3 a 5 serviços ou ofertas principais do lab, uma linha cada: <span class="placeholder">[LISTAR SERVIÇOS]</span>
- Equipe central, nome e papel — até 4 pessoas: <span class="placeholder">[LISTAR EQUIPE]</span>
- Chamada principal para ação (o que a pessoa deve fazer ao cair na página — agendar conversa, conhecer projetos, baixar relatório, etc.): <span class="placeholder">[INSERIR CTA]</span>
- Forma real de contato (e-mail institucional, telefone, link de agendamento): <span class="placeholder">[INSERIR CONTATO]</span>

<strong>3. Estrutura obrigatória da página</strong>

1. Hero — nome do lab, missão em frase única, CTA principal visível na primeira dobra.
2. O que fazemos — os serviços apresentados com hierarquia tipográfica clara (não cards genéricos vazios).
3. Time — nome e papel de cada pessoa, sem foto exigida (não invente avatar).
4. Como acessar — formas reais de contato e o CTA principal repetido.
5. Rodapé institucional — vinculação ao órgão, ano, links institucionais quando informados.

<strong>4. Diretrizes técnicas</strong>

- HTML semântico (header, main, section, footer — não use div para tudo).
- CSS dentro do mesmo arquivo, em &lt;style&gt; no &lt;head&gt;. Sem framework externo, sem CDN, sem Tailwind.
- Mobile-first. Quebra confortável até 360px de largura.
- Contraste mínimo WCAG AA. Tipografia legível, hierarquia tipográfica clara (h1 ≫ h2 ≫ corpo).
- Use variáveis CSS (--cor-primaria, --cor-fundo, --cor-texto, --espaco) para que o lab consiga ajustar paleta sem mexer no resto.
- Sem JavaScript, a menos que estritamente necessário (e justifique se usar).
- Derive 3 a 4 tons a partir da cor primária informada. Não use mais de 4 cores no total.

<strong>5. Restrições absolutas</strong>

❌ Não invente entregas, números, datas, projetos ou histórico do lab. Use apenas o que foi informado nos campos.
❌ Não inclua frases vazias ("transformando o futuro", "inovação que importa", "mindset disruptivo"). Tom institucional brasileiro adulto.
❌ Não use imagens placeholder de bancos de imagem genéricos (Unsplash etc.). Se for usar imagem, marque com comentário HTML para o lab substituir.
❌ Não imite estética de Big Tech (gradiente radial cyberpunk, fonte geométrica exagerada, dark mode glassmorphism). Isto é uma página institucional do Estado brasileiro.
❌ Não use Lorem Ipsum. Se faltar conteúdo, marque o trecho com comentário pedindo que o lab preencha.

<strong>6. Saída esperada</strong>

Um único bloco de código HTML completo, pronto para salvar e abrir no navegador. Após o código, em até 6 linhas, indique:
- Quais variáveis CSS você criou (e o que cada uma controla).
- Qual decisão de hierarquia tomou (qual elemento ganha mais peso visual e por quê).
- Onde o lab pode trocar imagem ou ampliar conteúdo sem quebrar o layout.`,
    when: 'Lab recém-formado · transição de gestão · necessidade de cara pública para captação · primeira apresentação a parceiro novo · pressão para "ter site" sem orçamento de TI.',
  },
  {
    id: 'p17', num: '17', eixoId: 'aplicar',
    eyebrow: 'Utilitário · Pitch executivo',
    title: 'Defender o lab em apresentação irrefutável.',
    purpose: 'Para transformar entregas do laboratório em pitch deck de 5 a 7 slides — para Secretários, Ministros ou Diretores que decidem orçamento e continuidade.',
    promptLabel: 'Prompt · Apresentação de Impacto',
    body: `Você é um <em>Especialista em Relações Institucionais e Storytelling de Dados</em> atuando no alto escalão do setor público brasileiro. Seu papel é transformar as entregas de um laboratório de inovação em uma apresentação executiva irrefutável para a alta gestão (Secretários, Ministros ou Diretores), provando que o lab não é um "projeto de estimação", mas uma unidade geradora de valor público e economia.

<strong>Sua tarefa:</strong>

Estruturar um roteiro de apresentação (Pitch Deck) de 5 a 7 slides, focado em <em>outcomes</em> (impacto real no cidadão ou no processo) e não em <em>outputs</em> (número de post-its ou reuniões). A partir dos projetos e resultados recentes informados abaixo:

<span class="placeholder">[INSERIR LISTA DE PROJETOS E RESULTADOS RECENTES DO LABORATÓRIO]</span>

<strong>Estrutura obrigatória do roteiro de slides:</strong>

1. <strong>Slide de Abertura:</strong> A dor estrutural que o lab resolve.
2. <strong>O "Custo de Não Inovar":</strong> Quanto o Estado perde em tempo/recurso por manter processos ineficientes.
3. <strong>O Método:</strong> Como o laboratório atua (inovar é gerenciar riscos de forma controlada).
4. <strong>Casos de Impacto (2 a 3 slides):</strong> Para cada projeto informado, extrair:
   - O Problema
   - A Intervenção
   - O Valor Público Gerado (redução de tempo, economia, satisfação)
5. <strong>O Futuro e a Decisão (Call to Action):</strong> O que o laboratório precisa da alta gestão agora (orçamento, portaria, autonomia).

<strong>Diretrizes e Restrições Absolutas:</strong>

❌ Proibido usar métricas de vaidade ("fizemos 10 oficinas"). Traduza para valor público ("capacitamos 100 servidores em métodos ágeis aplicáveis à rotina").
❌ Proibido usar jargões motivacionais ("revolucionando o futuro", "transformação disruptiva"). Use tom sóbrio, focado em capacidade estatal e legalidade.

<strong>Saída esperada:</strong>

O texto estruturado slide a slide. Para cada slide, sugira em colchetes o tipo de gráfico ou dado visual que o servidor deve inserir para comprovar o argumento (ex: <code>[GRÁFICO DE BARRAS: tempo médio de tramitação antes/depois]</code>).`,
    when: 'Troca de gestão · defesa de orçamento · primeira reunião com novo dirigente · comitê de avaliação de portfólio · ameaça de descontinuidade.',
  },
  {
    id: 'p18', num: '18', eixoId: 'aplicar',
    eyebrow: 'Utilitário · Catálogo de serviços',
    title: 'Catálogo formal pronto para intranet ou portaria.',
    purpose: 'Para curar a síndrome do balcão de ideias soltas — definir o que o lab faz, o que NÃO faz, e as regras de engajamento com as outras secretarias.',
    promptLabel: 'Prompt · Prateleira de Serviços',
    body: `Você é um <em>Designer de Serviços Públicos</em> especialista na estruturação de Laboratórios de Inovação. Seu papel é organizar a atuação de um lab recém-criado ou em reestruturação, transformando intenções genéricas em um Catálogo de Serviços formal, claro e acionável.

<strong>Sua tarefa:</strong>

Devolver um Catálogo de Serviços pronto para ser publicado na intranet ou anexado a uma portaria, definindo as regras de engajamento do laboratório com as outras secretarias. A partir das vocações da equipe informadas abaixo:

<span class="placeholder">[INSERIR VOCAÇÕES E COMPETÊNCIAS DA EQUIPE — ex: facilitação, simplificação de textos, desenho de processos, pesquisa com usuários]</span>

<strong>Estrutura obrigatória do Catálogo:</strong>

1. <strong>Apresentação:</strong> Quem somos e qual o nosso mandato institucional (referência ao GNova Lab/ENAP quando aplicável, sem inventar vínculo formal).
2. <strong>O que NÃO fazemos:</strong> Cláusula de proteção do escopo (ex: "Não somos o suporte de TI", "Não fazemos projetos sem patrocínio do gestor da área", "Não substituímos a equipe finalística").
3. <strong>Os Serviços:</strong> Para cada serviço oferecido, detalhar:
   - <strong>Nome do Serviço</strong> (ex: Simplificação de Linguagem, Design Sprint de 5 Dias)
   - <strong>O que o demandante recebe</strong> (Entregável concreto)
   - <strong>O que o demandante precisa investir</strong> (Horas da equipe, dados, disponibilidade)
4. <strong>Critérios de Elegibilidade:</strong> Regras objetivas para o lab aceitar um projeto.

<strong>Diretrizes e Restrições Absolutas:</strong>

❌ Proibido listar serviços abstratos como "Mentoria de Inovação". Substitua por ações tangíveis como "Apoio Metodológico para Redesenho de Serviços".
❌ A linguagem deve deixar claro que a inovação no setor público exige <strong>coparticipação</strong>: o lab apoia, mas a secretaria de origem executa.

<strong>Saída esperada:</strong>

Um documento de texto bem formatado, com hierarquia clara (títulos, subtítulos e bullet points), pronto para ser diagramado e publicado.`,
    when: 'Lab recém-formado · revisão de portfólio · necessidade de proteger o lab de demanda fora do escopo · publicação institucional · resposta a pedido informal recorrente de área que extrapola escopo.',
  },
  {
    id: 'p19', num: '19', eixoId: 'aplicar',
    eyebrow: 'Utilitário · Minuta normativa',
    title: 'Esqueleto de portaria ou resolução pronto pra Procuradoria.',
    purpose: 'Para tirar a inovação da ilegalidade — instituir laboratório, sandbox ou prática inovadora com lastro normativo formal e estrutura pronta pra Procuradoria/Assessoria Jurídica.',
    promptLabel: 'Prompt · Minuta de Política',
    body: `Você é um <em>Assessor Jurídico e Engenheiro Institucional</em> especializado em Direito Administrativo e no Marco Legal de Ciência, Tecnologia e Inovação (Lei nº 13.243/2016). Seu papel é pegar a intenção de um laboratório de inovação e redigir a espinha dorsal de um instrumento normativo (Portaria, Resolução ou Termo de Cooperação) que institucionalize a prática, afastando o risco de apontamentos por órgãos de controle.

<strong>Sua tarefa:</strong>

Redigir a estrutura formal de um ato normativo a partir do que o órgão quer institucionalizar:

<span class="placeholder">[INSERIR O QUE O ÓRGÃO QUER INSTITUCIONALIZAR — ex: criação do laboratório, instituição de Sandbox Regulatório, adoção de teletrabalho focado em resultados]</span>

<strong>Estrutura obrigatória da Minuta:</strong>

1. <strong>Ementa:</strong> Resumo claro do ato.
2. <strong>Considerandos (Fundamentação Legal):</strong> Base estruturante (leis federais aplicáveis, como a Lei 14.129/21 do Governo Digital) e justificativa do interesse público.
3. <strong>Objeto e Âmbito de Aplicação:</strong> O que está sendo instituído.
4. <strong>Governança e Competências:</strong> Quem toma a decisão, quem executa, quem compõe o comitê.
5. <strong>Disposições Finais:</strong> Cláusulas de transparência e prestação de contas.

<strong>Diretrizes e Restrições Absolutas:</strong>

❌ Proibido inventar números de leis, incisos ou portarias federais. Se for referenciar uma lei real, cite-a corretamente (número, ano, ementa). Para portarias internas locais, use <code>[INSERIR NÚMERO]</code>.
❌ A linguagem deve ser rigorosamente técnica e obedecer ao padrão de redação oficial da Presidência da República: impessoalidade, clareza, padronização. Sem adjetivação subjetiva.

<strong>Saída esperada:</strong>

O esqueleto da minuta pronto para preenchimento dos dados locais, acompanhado de um <strong>Aviso Obrigatório</strong> ao final lembrando o servidor de que o texto deve ser revisado pela Procuradoria ou Assessoria Jurídica do órgão antes da assinatura.`,
    when: 'Criação formal do lab · institucionalização de sandbox regulatório · adoção de prática inovadora que precisa de respaldo jurídico · resposta a apontamento de órgão de controle · termo de cooperação com outra instituição.',
  },
];
