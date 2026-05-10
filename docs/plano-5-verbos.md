# Plano dos 5 Verbos · Alavanca

> Documento de fronteira. Resolve sobreposição entre **Estruturar · Formalizar · Construir · Avaliar · Provar**.
> Estado em 2026-05-10. Evento de lançamento: 2026-05-13. Estruturar é o piloto único.

---

## 1. O problema da sobreposição

A landing apresenta 5 verbos como capacidades distintas. Olhando o código atual (diagnóstico com 20 hooks, wizard do Estruturar, prompts da Jô), **três fronteiras estão borradas**:

1. **Estruturar × Construir.** O Blueprint de Sprint termina na Fase 3 (Entregar) — que entrega protótipo. Onde Construir começa?
2. **Formalizar × diagnóstico.** 8 dos 20 hooks já produzem minutas/portarias/editais. Formalizar é "tudo isso" ou tem recorte próprio?
3. **Avaliar × Provar × Governança.** Matriz de KPIs (`governanca:estrategico`), Plano de Sucessão (`equipe:lab-pleno`), Plano de Captação (`governanca:patrocinado`) — todos parecem caber em Provar. Avaliar precisa achar o seu canto.

Sem fronteiras, cada verbo tende a virar "qualquer coisa que a Jô faça neste contexto". O efeito é colapsar 5 produtos em 1, com vocabulário inflado.

---

## 2. Princípio organizador

Cada verbo é **um modo da Jô** com quatro slots fechados:

| Slot | Pergunta a responder |
|---|---|
| **Entrada canônica** | Que campos o wizard exige? |
| **Saída canônica** | Que peça SEI-Ready a Jô devolve? |
| **Domínio metodológico** | Quais lastros teóricos/normativos a Jô cita? |
| **Recorte temporal** | Em que momento do ciclo de vida do lab este verbo entra? |

Se dois verbos têm a mesma resposta em 3 dos 4 slots, **um deles é redundante**. A regra abaixo desfaz empates.

---

## 3. Os 5 verbos · fronteiras explícitas

### 3.1 · Estruturar · piloto (já existe)

- **Entrada:** Problema · Hipótese · Experimento (3 telas).
- **Saída:** Blueprint de Sprint SEI-Ready (Fase Entender · Explorar · Entregar).
- **Domínio:** Projeto MINDS (GNova/OCDE), InovaGov, ciências comportamentais (SIMPLES MENTE).
- **Recorte:** **Antes de fazer.** Desenha o caminho metodológico.
- **Não faz:** portaria, edital, indicador de outcome, dashboard, narrativa.

### 3.2 · Formalizar

- **Entrada:** Tipo de instrumento · Vinculação hierárquica · Mandato pretendido · Lastro normativo disponível (4 telas).
- **Saída:** Minuta jurídica (portaria, regimento, edital, cooperação técnica, sandbox).
- **Domínio:** Marco Legal CT&I (Lei 10.973/2004 c/ redação 13.243/2016), Lei 14.129/2021, INs aplicáveis, padrão SEI/ABNT.
- **Recorte:** **Quando o lab precisa virar instituição** ou um instrumento jurídico precisa existir para destravar uma ação.
- **Não faz:** blueprint metodológico, plano técnico de implementação, indicador de impacto, defesa institucional.

### 3.3 · Construir

- **Entrada:** Solução validada (output do Estruturar) · Stack desejada · Restrição de TI · Unidade executora destinatária (4 telas).
- **Saída:** Plano de Implementação Técnica + Termo de Cooperação Técnica + escopo declarado de protótipo (assistente, dashboard, automação) + **Plano de Handoff e Descontinuidade** (ver §13).
- **Domínio:** Engenharia de software pública, no-code/low-code, IA aplicada, handoff documentado, **Guia Referencial de Sandbox Regulatório (AGU)**.
- **Recorte:** **Depois do Blueprint.** Quando a Fase 3 (Entregar) precisa de braço técnico e de saída do lab para a unidade executora.
- **Não faz:** blueprint metodológico, minuta jurídica isolada (Formalizar faz), indicador de outcome, narrativa de defesa.

### 3.4 · Avaliar

- **Entrada:** Intervenção em curso · Outcome pretendido · Dados disponíveis (3 telas).
- **Saída:** Teoria de Mudança + Matriz de Indicadores de Outcome + Plano de Coleta.
- **Domínio:** Theory of Change, avaliação de impacto (CGU, GAO, OCDE), viés de avaliação, indicadores SMART.
- **Recorte:** **Durante e depois da entrega.** Mede valor público da intervenção, não eficiência operacional do lab.
- **Não faz:** KPIs de gestão do lab (isso é Governança/Formalizar), pitch para audiência política, dashboard de acumulado histórico.

### 3.5 · Provar

- **Entrada:** Conjunto de entregas existentes · Audiência (alta gestão · ministério · cidadão · transição) · Janela política (3 telas).
- **Saída:** Dossiê de Transição + Pitch adaptável por audiência + Dashboard de Impacto Acumulado.
- **Domínio:** Comunicação institucional, gestão do conhecimento, narrativa pública, blindagem entre gestões.
- **Recorte:** **No momento político.** Transição de gestão, defesa orçamentária, prestação de contas à diretoria.
- **Não faz:** entrega nova; só **compõe** o que já existe (insumos vêm de Construir + Avaliar).

---

## 4. Regra de roteamento (desempate em 1 segundo)

Quando um caso couber em dois ou mais verbos, decida pelo **resultado pretendido**:

1. Documento publicável em DOU/BG/SEI → **Formalizar**
2. Sistema, automação ou protótipo que precisa rodar → **Construir**
3. Plano de ação metodológico em fases → **Estruturar**
4. Indicador de outcome ou teoria de mudança → **Avaliar**
5. Narrativa para uma audiência específica → **Provar**

A regra é deliberadamente lexicográfica: **se a saída cabe num PDF assinado, é Formalizar**, mesmo que o conteúdo tenha vindo de um Blueprint do Estruturar.

---

## 5. Mapa Diagnóstico → Verbo (hooks atuais)

Releitura dos 20 hooks de [src/lib/diagnostico/hooks.ts](src/lib/diagnostico/hooks.ts) com classificação por verbo dono:

| hookId | Peça | Verbo dono | Cross |
|---|---|---|---|
| `vocacao:desenvolvedor` | NT Encomenda Tecnológica | **Formalizar** | — |
| `vocacao:facilitador` | Edital de Desafio | **Formalizar** | — |
| `vocacao:educador` | Plano de Letramento | **Estruturar** | Construir |
| `vocacao:arquiteto` | NT de AIR | **Avaliar** | Formalizar |
| `gargalo:ideacao` | Matriz de Priorização | **Estruturar** | — |
| `gargalo:prototipo` | Minuta de Sandbox | **Formalizar** | Construir |
| `gargalo:implementacao` | Cooperação Técnica | **Construir** | Formalizar |
| `gargalo:escala` | Plano de Replicação | **Construir** | Provar |
| `governanca:balcao` | Portaria de Criação | **Formalizar** | — |
| `governanca:programa` | Plano de Alinhamento Estratégico | **Provar** | — |
| `governanca:estrategico` | Matriz de KPIs | **Avaliar** | Provar |
| `governanca:patrocinado` | Plano de Captação | **Formalizar** | Provar |
| `equipe:conselheiro` | NT de Dedicação Exclusiva | **Formalizar** | — |
| `equipe:facilitador-equipe` | Protocolo de Automação | **Construir** | — |
| `equipe:lab-autonomo` | Minuta de Regimento | **Formalizar** | — |
| `equipe:lab-pleno` | Plano de Sucessão | **Provar** | — |
| `abertura:interna` | Edital de Desafio | **Formalizar** | — |
| `abertura:rede` | Cooperação com Instituições | **Formalizar** | — |
| `abertura:cocriacao` | Protocolo de Cocriação | **Construir** | Estruturar |
| `abertura:misto` | Matriz de Critérios de Abertura | **Estruturar** | — |

**Distribuição:** Formalizar 9 · Construir 4 · Estruturar 3 · Avaliar 2 · Provar 2.

**Conclusão:** o diagnóstico atual cobre bem Formalizar e Estruturar. **Avaliar e Provar precisam de hooks novos** (ou de uma porta de entrada própria que não passe pelo diagnóstico das 5 perguntas).

---

## 6. Arquitetura de prompts

Base comum (já consolidada em [src/prompts/jo-decisao.md](src/prompts/jo-decisao.md) e [jo-estruturar.md](src/prompts/jo-estruturar.md)):

- Persona Jô (Döbereiner · rigorosa · institucional · pragmática)
- Camada Normativa Tripartite (Base Estruturante · Norma Operacional · Lacuna)
- Anti-alucinação (não inventar normas, dizer "não sei")

Suffixes por modo (a serem criados em [src/prompts/jo-{verbo}.md](src/prompts/)):

| Modo | Lastros embarcados | Formato de saída |
|---|---|---|
| `estruturar` | MINDS, InovaGov, SIMPLES MENTE | Blueprint de Sprint (3 fases) |
| `formalizar` | Marco Legal CT&I, Lei 14.129/2021, IN 01/2016 (revogada → LGPD), padrão SEI | Minuta jurídica |
| `construir` | Engenharia pública, no-code, handoff GNova | Plano Técnico + TCT |
| `avaliar` | Theory of Change, OCDE/CGU avaliação | Matriz de Indicadores + ToC |
| `provar` | Storytelling institucional, gestão do conhecimento | Dossiê + Pitch + Dashboard |

Hooks (20 atuais) **continuam funcionando como suffixes one-shot no Modo Decisão**, agora classificados por verbo dono na matriz acima. Nada quebra.

---

## 7. Wizards · entrada canônica de cada modo

Padrão = wizard client-side de N telas → consolida prompt denso → Jô processa de uma vez (igual ao [src/pages/estruturar/sprint.astro](src/pages/estruturar/sprint.astro)).

| Modo | Telas |
|---|---|
| Estruturar | Problema · Hipótese · Experimento |
| Formalizar | Tipo de instrumento · Vinculação · Mandato · Lastro |
| Construir | Solução validada · Stack · Restrição TI · Destinatário |
| Avaliar | Intervenção · Outcome · Dados disponíveis |
| Provar | Entregas · Audiência · Janela política |

Cada wizard reaproveita o componente do Estruturar (stepper, inputs, contador, restauração via localStorage pós-login).

---

## 8. Roadmap pós-evento — **SOBRESCRITO PELA §12**

> Mantido como histórico. A diretriz de escopo da §12 colapsou esta sequência.

1. **13–17/05/2026 — Congelar.** Estruturar é o piloto único. Nada novo entra na produção até feedback de palco ser digerido.
2. **20–24/05/2026 — Review de overlaps reais.** Confrontar este plano com a reação do público da mesa-redonda. Atualizar a tabela de mapeamento se algum hook tiver classificação rejeitada.
3. **Jun/2026 — Formalizar.** Maior volume de hooks (9), domínio mais maduro juridicamente (já temos as 7 correções aplicadas em 2026-05-10). Replica template Estruturar.
4. **Jul/2026 — Construir.** Provavelmente exige RAG (templates TCT + casos concretos de cooperação). Marca a passagem para infra mais robusta.
5. **Ago/2026 — Avaliar.** Hipótese: precisa de hooks novos não cobertos pelo diagnóstico atual. Reabrir o diagnóstico para incluir dimensão "evidência"?
6. **Set/2026 — Provar.** Composição. Pode ser o módulo mais simples se Avaliar gerou indicadores estruturados — Provar só os reembala por audiência.

---

## 9. Riscos a vigiar

1. **Construir vira "tudo que tem código".** Mitigação: a regra de roteamento exige que Construir tenha **destinatário fora do lab**. Sem destinatário, é Estruturar (ainda planejando) ou nada.
2. **Avaliar parece Estruturar.** Ambos lidam com método. Diferenciar: Estruturar **planeja**; Avaliar **julga**. Estruturar gera fases; Avaliar gera indicadores.
3. **Provar vira marketing.** Mitigação: Provar **só compõe** o que Avaliar e Construir já gerarem. Sem insumos a montante, Provar não roda.
4. **Formalizar vira o verbo-balde.** Mitigação: a regra "cabe em PDF assinado?" é literal — se o usuário ainda não decidiu o instrumento, não é Formalizar, é Estruturar.

---

## 10. Validação contra a literatura · 4 dores estruturais

Olhando friamente para a literatura e os dados brutos do repositório — mapeamento Sano (2020), programa de aceleração I.LAB, tese sobre o LA-BORA! gov —, **os laboratórios reais não morrem por falta de criatividade ou método; morrem por exaustão, invisibilidade e falta de infraestrutura burocrática**.

Cruzando a realidade nacional com os 5 verbos, a arquitetura está corretíssima. Mas as dores reais reportadas pelos gestores apontam **4 elementos práticos que faltam à maioria absoluta dos labs** — e que a Alavanca (e a Jô) precisa forçar goela abaixo dos usuários.

### 10.1 · Identidade Operacional · "Catálogo de Serviços"

A literatura mostra que os labs que sobrevivem deixam de ser espaço abstrato de "experimentação" e passam a ter um **Catálogo de Serviços claro**.

- **Dor real:** instituições públicas ainda veem o lab como "balcão de pedidos" superficial, acionado em situações de novidade errática. O mapeamento Sano (2020) aponta que a dificuldade número 1 dos labs é literalmente **"explicar o que é e como funciona"**.
- **Falta na prática:** o lab precisa dizer "ofereço facilitação de oficinas, ideação de portarias, testes de usabilidade". O caso da **RNP Labs no I.LAB** mostra que desenhar catálogo de serviços foi a virada de chave para converter atuação em impacto coordenado.
- **Onde a Alavanca resolve:** **Formalizar.** Gancho obrigatório novo — `governanca:identidade` (ou similar) → "Catálogo de Serviços do Lab". Não está nos 20 hooks atuais.

### 10.2 · Tempo Protegido · "Síndrome do Teto do Voluntarismo"

Ponto mais crítico e silencioso da inovação pública.

- **Dor real:** equipes extremamente enxutas, sem dedicação exclusiva. Servidores acumulam atividades do lab com rotina diária. A literatura chama de **"dupla carga" (double burden)** — leva invariavelmente a esgotamento mental e descontinuidade dos projetos. O entusiasmo inicial mascara a sobrecarga, mas o voluntarismo tem teto.
- **Falta na prática:** instrumento de força que exija da alta gestão a liberação de horas oficiais para inovação.
- **Onde a Alavanca resolve:** **Formalizar.** Já existe `equipe:conselheiro` → NT de Dedicação Exclusiva. Reforçar com lastros OCDE/ENAP no system prompt: inovar **não é "hobby" de servidor, é Serviço Intensivo em Conhecimento**. Provar isso ao RH é a função da peça.

### 10.3 · Ponte para Licitação · "Vale da Morte"

- **Dor real:** o diagnóstico nacional atesta que labs são ótimos em desenvolver ideias e protótipos, mas **a esmagadora maioria para na prototipação e não avança para implementação e ganho de escala**.
- **Falta na prática:** sabem desenhar o serviço, mas não sabem licitar tecnologia que não existe no mercado, nem testar sem o TCU apontar irregularidade. Faltam recursos e competência normativa.
- **Onde a Alavanca resolve:** **Construir.** Integrar as teses da AGU — **Sandbox Regulatório · CPSI · Encomenda Tecnológica**. Já existem hooks que cobrem (`gargalo:prototipo` Sandbox, `vocacao:desenvolvedor` Encomenda Tec, `gargalo:implementacao` Cooperação Técnica), mas precisam ser ligados ao módulo Construir como cadeia única — não peças isoladas. **É o que tira o lab do post-it e o coloca no Diário Oficial.**

### 10.4 · Métricas de Defesa · "Avaliação que Salva"

- **Dor real:** maioria dos labs não tem processo institucionalizado de avaliação de resultados. Quando muda governo ou dirigente, o lab **não consegue provar valor público** (redução de custos, ganho de tempo, satisfação do cidadão) e vira "projeto de estimação" da gestão passada.
- **Falta na prática:** sair de **"métricas de vaidade"** (quantas oficinas fizemos) para **"métricas de valor público"** (quanto economizamos, que impacto geramos).
- **Onde a Alavanca resolve:** **Avaliar + Provar.** Resposta direta a essa fragilidade estrutural — garantem a defesa institucional na transição. Reforça a hipótese da §8: priorizar Avaliar cedo no roadmap, não relegar para ago/2026.

### Síntese

A estrutura de 5 verbos está impecável e madura. **O que falta aos labs reais é deixar de ser "clube de inovadores" e passar a operar como "unidade de Estado".** A Alavanca será a ferramenta definitiva se a Jô for usada não apenas para desenhar soluções bonitas, mas para **forçar a burocracia fundacional do lab**: redigir catálogo de serviços, formalizar carga horária da equipe, blindar juridicamente as contratações. É isso que garante a sobrevivência.

---

## 11. Decisões pendentes (Carla)

**Estruturais:**
1. Confirmar a regra de roteamento da §4 (lexicográfica pela saída pretendida).
2. Confirmar a reclassificação de `governanca:estrategico` (Matriz de KPIs) como **Avaliar** e não **Formalizar** — hoje vive em Governança no diagnóstico.
3. Confirmar que Avaliar e Provar terão hooks próprios pós-evento, ou se permanecerão acessíveis apenas pelos wizards diretos (sem entrada pelo diagnóstico das 5 perguntas).
4. Confirmar sequência do roadmap (Formalizar → Construir → Avaliar → Provar) ou priorizar Avaliar antes de Construir, para fechar o ciclo de medição cedo.

**Disparadas pela §10 (validação na literatura):**
5. Aprovar criação do **21º hook** — Catálogo de Serviços do Lab — em Formalizar (cobre a dor §10.1, hoje invisível na matriz).
6. Confirmar reforço dos lastros OCDE/ENAP no system prompt do `equipe:conselheiro` (NT de Dedicação Exclusiva) — enquadrar inovação como **Serviço Intensivo em Conhecimento**, não hobby (§10.2).
7. Confirmar que o módulo Construir tratará Sandbox + CPSI + Encomenda Tecnológica como **cadeia única "Vale da Morte"**, não peças isoladas — possivelmente como um wizard dedicado de transposição protótipo → operação (§10.3).
8. Reavaliar prioridade de **Avaliar no roadmap** — adiantar para jul/2026 (antes de Construir) garante que toda entrega de Construir já nasça com indicador de outcome, em vez de ser auditada retroativamente (§10.4). **→ resolvida pela §12 (tudo nesta entrega).**

---

## 12. Diretriz de escopo · tudo nesta entrega

**Decisão (Carla, 2026-05-10):** nada vai para roadmap. Toda a arquitetura dos 5 verbos descrita neste documento será executada **antes do evento de 2026-05-13**. A §8 está sobrescrita.

### 12.1 · O que "tudo" inclui (escopo concreto)

1. **4 system prompts novos da Jô** em [src/prompts/](src/prompts/):
   - `jo-formalizar.md` · `jo-construir.md` · `jo-avaliar.md` · `jo-provar.md`
   - Cada um seguindo o padrão de [jo-estruturar.md](src/prompts/jo-estruturar.md) (CHARACTER · REQUEST · ADDITIONS · TYPE · EXTRAS · EXAMPLES + Anti-alucinação).
2. **4 wizards novos** em [src/pages/](src/pages/) seguindo o padrão de [estruturar/sprint.astro](src/pages/estruturar/sprint.astro):
   - `formalizar/sprint.astro` (4 telas: Tipo · Vinculação · Mandato · Lastro)
   - `construir/sprint.astro` (4 telas: Solução · Stack · Restrição TI · Destinatário)
   - `avaliar/sprint.astro` (3 telas: Intervenção · Outcome · Dados)
   - `provar/sprint.astro` (3 telas: Entregas · Audiência · Janela)
3. **JoMode estendido** em [src/lib/ai/prompts/index.ts](src/lib/ai/prompts/index.ts):
   ```ts
   type JoMode = 'decisao' | 'possibilidades' | 'estruturar'
                | 'formalizar' | 'construir' | 'avaliar' | 'provar';
   ```
   `getPromptForMode` switch atualizado para os 5 verbos.
4. **21º hook** — Catálogo de Serviços do Lab — em [src/lib/diagnostico/hooks.ts](src/lib/diagnostico/hooks.ts) + suffix em `src/prompts/hooks/governanca_identidade.md`. Anexar à dimensão `governanca` (5ª opção) ou criar dimensão extra — definir na implementação.
5. **Reforço OCDE/ENAP** em `src/prompts/hooks/equipe_conselheiro.md`: enquadrar dedicação exclusiva como **Serviço Intensivo em Conhecimento**, não hobby.
6. **Cadeia "Vale da Morte"** no Construir: Sandbox + CPSI + Encomenda Tec como sequência amarrada no system prompt e referenciada cruzadamente nos hooks `gargalo:prototipo`, `vocacao:desenvolvedor`, `gargalo:implementacao`. **Embutir os patches da §13 (Descontinuidade + Handoff) — sem isso a cadeia Vale da Morte fica aberta na ponta de saída.**
7. **Reclassificação visual** dos 20 hooks por verbo dono — badge/tag em cada card do diagnóstico mostrando o verbo (Formalizar 9 · Construir 4 · Estruturar 3 · Avaliar 2 · Provar 2). Pode ser uma propriedade nova `Hook.verb` na matriz, exibida na UI.
8. **Páginas-stub viram páginas reais** — [/formalizar](src/pages/formalizar.astro), [/construir](src/pages/construir.astro), [/avaliar](src/pages/avaliar.astro), [/provar](src/pages/provar.astro) deixam de ser `<Stub>` e ganham conteúdo institucional + CTA para o respectivo wizard.

### 12.2 · Tradeoff aceito

**Profundidade × largura.** Cada verbo entra em produção com **mínimo viável arquitetural**, não com curadoria longa de few-shots. O system prompt do Estruturar (jo-estruturar.md, ~140 linhas, 1 exemplo completo) é o padrão de qualidade — replicar nessa densidade nos outros 4. Refinamento de prompts, RAG do Construir, e calibração com casos reais ficam para iteração contínua **pós-evento**, sem bloquear a entrega da arquitetura completa.

### 12.3 · Ordem de ataque (3 dias úteis)

Priorização caso o tempo aperte — começar pelo que carrega a demo de palco, deixar o que pode degradar elegante para o fim:

1. **Dia 1 (10–11/05)** — system prompts dos 4 verbos (texto, sem código). É o conteúdo metodológico que dá densidade à demo e que mais demora a curar.
2. **Dia 2 (12/05)** — wizards (4 páginas) + extensão do `JoMode` + páginas-stub viram reais. Reaproveita aggressively o componente do `estruturar/sprint`.
3. **Dia 3 (13/05 manhã)** — 21º hook, reforço `equipe:conselheiro`, reclassificação visual, cadeia Vale da Morte. São polimentos que valorizam o palco mas não bloqueiam a demo principal (que será do Estruturar, com os outros 4 verbos clicáveis e funcionais).

### 12.4 · Risco vivo

3 dias úteis para 4 wizards + 4 prompts curados + 1 hook + reclassificação é apertado mesmo com paralelização. **Critério de corte se algo cair:** preservar (a) os 4 wizards funcionais (largura visível), (b) os 4 prompts mínimos (cada um ≥ 80 linhas com 1 exemplo), (c) **os patches da §13 no `jo-construir.md` — não-negociáveis, fecham porta que Bruno Portela (AGU) certamente bate na mesa**. O que pode degradar: profundidade do system prompt do Provar (mais composição que metodologia), reclassificação visual do diagnóstico, cadeia Vale da Morte (pode entrar como nota no prompt do Construir, sem amarração cruzada nos hooks).

---

## 13. Construir · gaps AGU/I.LAB · estratégia de saída

**Diagnóstico (2026-05-10):** o módulo Construir está 95% pronto e politicamente blindado. Mas duas portas ficam abertas no system prompt redigido em §12.1 — a Jô sabe **como entrar** (Sandbox · CPSI · Encomenda Tec) mas **não sabe como sair**. Sem fechar isso, a solução soa como "balcão de protótipos" e a fragilidade é visível para qualquer leitor com lastro AGU (caso do Bruno Portela na mesa-redonda).

### 13.1 · GAP 1 · Plano de Descontinuidade Planejada

- **Problema:** ensinamos a Jô a criar contratação e ambiente de teste, mas esquecemos de ensiná-la a **desligar a máquina se o teste der errado**.
- **Lastro:** **Guia Referencial de Sandbox Regulatório (AGU)** exige categoricamente a previsão de **"Descontinuidade Planejada" ou "Emergencial"**. Se o experimento apresentar riscos excessivos ou falhar, o Estado não pode ficar com **"puxadinho tecnológico" rodando sem amparo** — precisa de plano para gerir recursos e proteger consumidores/cidadãos no encerramento.
- **Aplicação:** cláusula obrigatória em **todo Parecer de Sandbox ou CPSI** que a Jô redigir.

### 13.2 · GAP 2 · Transição para Regulação Plena · Plano de Handoff

- **Problema:** a promessa da landing é **"O lab entrega e atravessa"** (sem virar suporte de TI permanente). Mas o output do Construir terminava nos "Próximos Passos Operacionais para o edital" — faltou a **transferência de posse**.
- **Lastro:** literatura **I.LAB** adverte que muitos labs ficam sobrecarregados porque os projetos não saem de suas mãos e não são internalizados pela burocracia. Guia AGU também prevê **"Transição para regulação plena"** — momento em que autorização temporária vira permanente e o projeto passa para a operação normal do Estado.
- **Aplicação:** **Plano de Handoff** embutido — quem assume manutenção da tecnologia quando o laboratório se retira.

### 13.3 · Patches no system prompt `jo-construir.md` (a redigir)

Quando `src/prompts/jo-construir.md` for criado (§12.1 item 1, §12.3 Dia 1), embutir literalmente:

**No bloco `[ADDITIONS]` — Regras de Conhecimento Embarcado (LABORI/AGU), adicionar item 5:**

> **5. Estratégia de Saída (AGU):** Se a via escolhida for Sandbox ou CPSI, é obrigatório prever um **"Plano de Descontinuidade Planejada"** (o que acontece se o teste falhar) e um plano de **"Transição para Regulação Plena"** (quem assume a solução se der certo, evitando que o laboratório vire suporte de TI).

**No bloco `[TYPE]` — Estrutura do Parecer, reescrever item 4:**

> **4. Plano de Handoff e Descontinuidade:** Definição clara da **unidade executora** que assumirá a solução em caso de sucesso, e o **protocolo de desligamento seguro** em caso de falha.

### 13.4 · Coerência interna

Esta seção atualiza, por consequência:

- **§3.3 Construir · Saída canônica** — agora inclui *"Plano de Handoff e Descontinuidade"* como saída obrigatória da peça (atualização aplicada).
- **§3.3 Construir · Domínio** — adiciona *"Guia Referencial de Sandbox Regulatório (AGU)"* aos lastros embarcados (atualização aplicada).
- **§12.1 item 6 (Cadeia Vale da Morte)** — passa a referenciar §13 explicitamente; sem os patches, a cadeia fica aberta na ponta de saída (atualização aplicada).
- **§12.4 Critério de corte** — patches da §13 viram **não-negociáveis**, mesmo que tudo o mais degrade (atualização aplicada).
