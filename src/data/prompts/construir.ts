import type { Prompt } from './_types';

export const construirPrompts: Prompt[] = [
  {
    id: 'p07', num: '07', eixoId: 'construir',
    eyebrow: 'Facilitação · Design Sprint',
    title: 'Cinco dias do problema ao protótipo testado.',
    purpose: 'Para rodar uma sprint sem sair improvisando — agenda fechada, dinâmicas, divergência e convergência.',
    promptLabel: 'Prompt · Design Sprint',
    body: `Você é um <em>facilitador de metodologias ágeis no governo</em>, com vivência prática em Design Sprint adaptado ao setor público — sabe que o servidor público tem ritmo, restrições e cultura distintos do setor privado, e a sprint precisa absorver isso sem perder rigor.

<strong>Sua tarefa:</strong>

Construir uma agenda detalhada para um Design Sprint de 5 dias para resolver:

<span class="placeholder">[INSERIR PROBLEMA]</span>

A agenda precisa ser executável por uma equipe enxuta de servidores, sem facilitador externo dedicado em tempo integral.

<strong>Segunda — Entender e mapear</strong>

Manhã: alinhamento de contexto, mapeamento de stakeholders, definição do alvo da sprint.
Tarde: lightning talks com especialistas internos, identificação dos pontos críticos da jornada.

<strong>Terça — Divergir</strong>

Crazy 8s, Lightning Demos de soluções existentes (públicas e privadas), esboço solo. Foco em quantidade, não qualidade.

<strong>Quarta — Decidir e storyboardar</strong>

Heat map, voto silencioso, supervoto da liderança da sprint, construção do storyboard frame a frame.

<strong>Quinta — Prototipar</strong>

Protótipo realista, sem código. Pode ser navegação de telas no Figma, fluxograma de papel, simulação de atendimento. A meta é que pareça real para o usuário, não para o desenvolvedor.

<strong>Sexta — Testar</strong>

Cinco entrevistas com usuários reais (cidadãos ou servidores afetados, dependendo do caso). Roteiro semi-estruturado, observação registrada, síntese ao final do dia.

<strong>Padrão obrigatório para cada dia</strong>

- Quebra-gelo de 5 a 10 minutos adequado ao perfil servidor (não dinâmica corporativa estranha)
- Dinâmicas com tempo cronometrado
- Material necessário (físico ou digital)
- Entregável do dia (artefato concreto, não relato)
- Armadilha comum dessa fase e como evitar

<strong>Cláusula final</strong>

Indique três ajustes recomendados se a equipe tiver menos de 5 pessoas, e dois ajustes se a sprint precisar caber em 3 dias em vez de 5. Sem mutilar o método — mostrando o que é descartável e o que é estrutural.`,
    when: 'Problema definido, prazo curto, equipe disponível por uma semana · alternativa a comitês intermináveis.',
  },
  {
    id: 'p08', num: '08', eixoId: 'construir',
    eyebrow: 'Revisão · Linguagem Simples e Inclusiva',
    title: 'Reescrever sem reproduzir vieses.',
    purpose: 'Para limpar uma cartilha, manual ou comunicado de juridiquês, estereótipos e linguagem inacessível.',
    promptLabel: 'Prompt · Linguagem Simples',
    body: `Você é um <em>revisor de texto especializado em Linguagem Simples e Inclusão</em>, com domínio das diretrizes da ENAP e da literatura sobre comunicação acessível, gênero e raça no serviço público brasileiro. Seu papel é desfazer juridiquês sem perder precisão técnica e reescrever sem reproduzir vieses inconscientes.

<strong>Sua tarefa:</strong>

Reescrever o documento abaixo (cartilha, manual ou comunicado) preservando precisão jurídica e técnica onde for indispensável, mas eliminando linguagem inacessível e estereótipos:

<span class="placeholder">[COLAR TEXTO ORIGINAL]</span>

<strong>1. Diagnóstico</strong>

Antes de reescrever, aponte os três problemas estruturais do texto original:
- Onde a linguagem cria barreira para o leitor com letramento médio
- Onde aparecem estereótipos ou pressuposições sobre gênero, raça, território
- Onde a voz passiva ou subordinadas escondem quem age

<strong>2. Versão reescrita completa</strong>

Entregue o texto inteiro reescrito, com:
- Linguagem direta, voz ativa, sujeito explícito
- Vocabulário acessível sem infantilizar
- Eliminação de estereótipos e marcadores de exclusão
- Manutenção da precisão técnico-jurídica nos pontos onde ela é essencial

<strong>3. Antes/depois comentado</strong>

Liste os 5 trechos com mudança mais substancial. Para cada um:
- Versão original
- Versão reescrita
- Por que a mudança importa (qual barreira ela remove ou qual viés ela neutraliza)

<strong>4. Pontos preservados</strong>

Aponte 2 a 3 trechos onde você decidiu manter linguagem técnica/jurídica e justifique por que a precisão valeu a perda de acessibilidade. Esse é o ponto onde o revisor mostra critério, não só ímpeto de simplificar.

Não suavize quando o conteúdo precisa ser firme. Linguagem simples não significa linguagem leve.`,
    when: 'Manuais para servidores · cartilhas para o cidadão · revisão de comunicados antes do envio.',
  },
  {
    id: 'p09', num: '09', eixoId: 'construir',
    eyebrow: 'Meta · Crie o assistente permanente do seu lab',
    title: 'O prompt que escreve seu próprio assistente permanente.',
    purpose: 'Para deixar de copiar prompts soltos e criar o System Prompt definitivo do assistente do laboratório.',
    promptLabel: 'Prompt · Meta-prompt (System)',
    body: `Você é um <em>Engenheiro de Prompts sênior</em> com domínio do Método PTCF (Pessoa · Tarefa · Contexto · Formato) e experiência em desenhar assistentes de IA permanentes para equipes operacionais. Seu papel é construir um System Prompt que a equipe cole nas instruções personalizadas (ChatGPT, Claude, Gemini, Copilot) e use no dia a dia, sem ter que pensar em prompt nunca mais.

<strong>Sua tarefa:</strong>

Desenhar o System Prompt definitivo de um assistente permanente para o nosso laboratório — colega especialista que vive nas instruções personalizadas e responde no dia a dia sem precisar ser reformulado a cada uso. O assistente deve resolver o seguinte objetivo:

<span class="placeholder">[DESCREVER O OBJETIVO ESPECÍFICO]</span>

O System Prompt vai operar em produção. Precisa ser conciso, autocontido e robusto a mau uso.

<strong>1. Persona</strong>

Defina quem o assistente é:
- Formação e área de especialidade
- Tom (acolhedor e assertivo — não corporativo neutro, não professoral)
- Postura (colega de mesa que sabe muito, não consultor distante)

<strong>2. Missão principal</strong>

Frase única que descreve o que o assistente resolve no dia a dia. Não objetivo abstrato — verbo concreto.

<strong>3. Menu de tarefas</strong>

Liste 4 a 6 tarefas que o assistente entrega de cara, sem o usuário precisar formular. Cada tarefa deve ser um verbo + complemento (ex: "construir minuta SEI-Ready a partir de descrição livre").

<strong>4. Regras de entrega</strong>

Defina formato por tipo de pedido:
- Quando usar bloco de código (config, comandos, snippets)
- Quando usar tabela (comparação, matriz, KPIs)
- Quando usar texto corrido (raciocínio, narrativa, justificativa)
- Quando usar lista (passos, opções, checklist)

<strong>5. Restrições operacionais</strong>

Aponte explicitamente:
- O que o assistente não faz (mesmo se pedido)
- Que dados ele não pede (CPF, dado pessoal sensível, senha)
- Que vieses ele evita ativamente (gênero, raça, classe, território)
- Como reage a pedido fora do escopo (redireciona, não inventa)

<strong>6. Guardrails de autonomia</strong>

Como o assistente guia o servidor para a autonomia digital, não para a dependência:
- Quando ele explica o raciocínio para que o servidor aprenda
- Quando ele entrega pronto e quando entrega com lacuna proposital para o servidor completar
- Como encerra cada interação (sem fechar, sem prender o servidor em loop conversacional)

Entregue em Markdown limpo, com cabeçalhos \`##\`, sem texto decorativo. O resultado deve poder ser colado direto.`,
    when: 'Configuração inicial do assistente do lab · padronização entre membros da equipe · treinamento de novos servidores.',
  },
  {
    id: 'p10', num: '10', eixoId: 'construir',
    eyebrow: 'Handover · Vale da morte',
    title: 'Atravessar do protótipo à área finalística.',
    purpose: 'Para entregar a solução à TI e à área operadora sem que ela morra na transição — o ponto onde a maioria das inovações públicas é abandonada.',
    promptLabel: 'Prompt · Escala e Handover',
    body: `Você é um <em>gerente de projetos de transformação digital no governo</em>, com experiência em transição de protótipos validados para operação finalística. Seu papel é desenhar o handover que evita o "vale da morte" — aquele ponto onde a área receptora não absorve, a TI corporativa não integra, e a inovação morre por abandono.

<strong>Sua tarefa:</strong>

Construir o Plano de Transição (Handover) para a seguinte solução, já prototipada e validada em piloto:

<span class="placeholder">[DESCREVER A SOLUÇÃO]</span>

O plano vai à área finalística, à TI corporativa e à liderança que patrocina a transição. Precisa ser executável e mensurável.

<strong>1. Documentação técnica</strong>

Checklist do mínimo viável que a TI precisa receber. Sem inflar:
- Diagrama de arquitetura (componentes, dependências, integrações)
- Manual de instalação e configuração
- Runbook operacional (rotinas, alertas, manutenção)
- Backlog de débito técnico conhecido (para a TI saber o que herda)
- Política de segurança e dados

Indique o que é entregável obrigatório vs. desejável.

<strong>2. Plano de capacitação</strong>

Para a área finalística que vai operar a solução:
- Formato (presencial, EAD, híbrido)
- Carga horária realista
- Materiais (vídeos curtos, manuais, FAQ vivo)
- Multiplicadores internos identificados
- Avaliação de domínio antes do desligamento do lab

<strong>3. Marcos de acompanhamento</strong>

Os primeiros 6 meses pós-handover são críticos. Defina:
- Check-ins quinzenais no mês 1, mensais nos meses 2 a 4, trimestrais nos meses 5 e 6
- KPIs de sustentação que o lab acompanha sem operar
- Sinais de alerta que disparam intervenção do lab
- Comitê de governança da transição (quem decide quando a coisa trava)

<strong>4. Critérios de saída do lab</strong>

Quando consideramos a transição concluída:
- A área finalística opera sem suporte do lab por X semanas
- A TI corporativa absorveu o produto no portfólio e responde por incidente
- Os KPIs de sustentação estão estáveis acima do limite
- A documentação foi auditada e aprovada por terceiro

<strong>5. Riscos típicos e mitigação</strong>

Para cada risco, descreva sinal de alerta precoce e ação de mitigação:
- Rejeição cultural da área finalística (servidor não usa, sabota, ignora)
- Retrabalho de TI (corporativa quer reescrever o que funciona)
- Mudança de prioridade política (gestor novo desinveste)
- Dependência oculta (algo que só o lab sabia operar)

<strong>6. Gatilho de retorno</strong>

Sob quais condições objetivas o lab volta a apoiar — sem virar suporte permanente. Critério, prazo e modalidade da reentrada.

Entregue em formato de checklist com responsável e prazo sugerido por item.`,
    when: 'Final de piloto bem-sucedido · entrega para área finalística · transição para operação contínua · negociação com TI antes de assumir.',
  },
];
