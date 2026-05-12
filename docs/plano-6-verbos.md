# Plano dos 6 Verbos · Alavanca

> Documento de fronteira. Resolve sobreposição entre **Mapear · Estruturar · Formalizar · Construir · Avaliar · Manter**.
> Estado em 2026-05-11. Evento de lançamento: 2026-05-13. Estruturar é o piloto único; Mapear é o Passo 0 obrigatório.
>
> **Atualização 2026-05-11 — Renomeação para `plano-6-verbos.md`.** O documento original (`plano-5-verbos.md`) tratava apenas dos 5 verbos de execução. A inclusão do Mapear como **Passo 0 obrigatório** (Bússola e Roteador, com Relatório de Diagnóstico SEI-Ready, Diretriz Go/No-Go e Roteamento por Ordem de Ataque) e a renomeação **Provar → Manter** (continuidade institucional de Estado, com Briefing Executivo + Plano de Sustentabilidade + Minutas de Adesão à Rede) exigiram a renomeação documental.
>
> **Provar → Manter.** O verbo 06 deixa de ser "defesa institucional via narrativa" e passa a ser "continuidade institucional de Estado". Pitch retirado; substituído pelo Briefing Executivo. Onde o texto histórico abaixo diz "Provar", leia "Manter".
>
> **Mapear unificou o Passo 0.** O antigo `/diagnostico` (5 perguntas + 20 hooks) foi substituído pelo Mapear como única porta de entrada visível na navegação. URL `/diagnostico` mantida com redirect 301 permanente para `/mapear/sprint` (preserva links externos e bookmarks). O sistema interno de 20 hooks (`src/lib/diagnostico/hooks.ts` + `src/prompts/hooks/*.md`) permanece funcional como infraestrutura, sem porta de entrada visual.

---

## 1. O problema da sobreposição

A landing apresenta 6 verbos como capacidades distintas. Olhando o código atual (Mapear como Passo 0, wizard do Estruturar, prompts da Jô para os 5 verbos de execução), **três fronteiras estão borradas**:

1. **Estruturar × Construir.** O Blueprint de Sprint termina na Fase 3 (Entregar) — que entrega protótipo. Onde Construir começa?
2. **Formalizar × Mapear.** 8 dos 20 hooks legados já produzem minutas/portarias/editais. Formalizar é "tudo isso" ou tem recorte próprio?
3. **Avaliar × Manter × Governança.** Matriz de KPIs (`governanca:estrategico`), Plano de Sucessão (`equipe:lab-pleno`), Plano de Captação (`governanca:patrocinado`) — todos parecem caber em Manter. Avaliar precisa achar o seu canto.

Sem fronteiras, cada verbo tende a virar "qualquer coisa que a Jô faça neste contexto". O efeito é colapsar 6 produtos em 1, com vocabulário inflado.

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

## 3. Os 6 verbos · fronteiras explícitas

### 3.0 · Mapear · Passo 0 obrigatório (Bússola e Roteador)

- **Entrada:** Cenário · Atores envolvidos · Gargalo · Risco de não agir (4 telas).
- **Saída:** Relatório de Diagnóstico Institucional SEI-Ready com Matriz de Riscos, Diretriz Go/No-Go tripartite (GO · GO com mitigação · NO-GO) e Roteamento Obrigatório com Ordem de Ataque numerada dos verbos seguintes.
- **Domínio (trinca normativa restrita):** **IN Conjunta nº 01/2016 CGU/MP** (gestão de riscos e controles internos), **CF/88 art. 37** (princípio da eficiência), **Lei nº 13.655/2018 (LINDB, alterações de 2018)** — consequencialismo administrativo e reconhecimento do erro legítimo no teste de políticas públicas. Quando aplicável: LAI (Lei 12.527/2011) e normas internas de governança.
- **Recorte:** **Antes de tudo.** Lê o terreno antes de qualquer execução. Sem Mapear, todo plano é palpite.
- **Não faz:** redige Blueprint, Minuta, Plano Técnico, Indicador, Dossiê. **Não invoca lei de solução final** — Lei 14.129, Marco CT&I (Lei 10.973/2004 c/ redação 13.243/2016), Lei 14.133/2021, LC 182/2021 (Marco das Startups) e Guia AGU de Sandbox ficam represadas para os verbos de execução. Mapear DIAGNOSTICA; não INSTRUMENTALIZA.

**Trava normativa absoluta:** os Considerandos do Relatório de Diagnóstico invocam EXCLUSIVAMENTE a trinca embarcada (IN 01/2016 · CF/88 art. 37 · LINDB), garantindo que o Passo 0 não pré-julgue o resultado e não atravesse a competência dos verbos subsequentes. Razão: invocar Lei 14.129 ou Marco CT&I no Mapear assumiria que a solução será arranjo de governo digital ou de pesquisa — atravessando o Formalizar/Construir.

### 3.1 · Estruturar · piloto (já existe)

- **Entrada:** Problema · Hipótese · Experimento (3 telas).
- **Saída:** Blueprint de Sprint SEI-Ready (Fase Entender · Explorar · Entregar).
- **Domínio:** Projeto MINDS (GNova/OCDE), InovaGov, ciências comportamentais (SIMPLES MENTE).
- **Recorte:** **Antes de fazer.** Desenha o caminho metodológico.
- **Não faz:** portaria, edital, indicador de outcome, dashboard, narrativa.

### 3.2 · Formalizar (modular · 6 frentes autônomas)

- **Arquitetura:** seletor em `/formalizar/sprint` + 6 sub-wizards autônomos em `/formalizar/{portaria,catalogo,dedicacao,enquadramento-ict,nit,politica-inovacao}`. Cada frente é uma chamada isolada da Jô, com system prompt cirúrgico (`src/prompts/jo-formalizar-*.md`) — sem condicionais no prompt, sem alucinação cruzada.
- **6 frentes:**
  1. **Portaria de Criação/Institucionalização** (3 telas) · saída: Minuta SEI-Ready · lastro: Lei 14.129/2021, CF/88 art. 37.
  2. **Catálogo de Serviços** (3 telas) · saída: Documento de Governança com Anti-balcão obrigatório · lastro: Sano (2020), I.LAB, Lei 13.460/2017.
  3. **NT de Dedicação Exclusiva** (3 telas) · saída: NT ancorada PRIMEIRO no Marco CT&I (art. 9º-A bolsa, art. 14/14-A afastamento) e DEPOIS em OCDE/ENAP · análise de risco pela IN 01/2016 CGU/MP.
  4. **Ato de Enquadramento como ICT** (3 telas) · saída: alteração de regimento incluindo PD&I nas competências · anti-fachada · lastro: Lei 10.973/2004 art. 2º IV, Decreto 9.283/2018.
  5. **Criação do NIT** (4 telas) · saída: Portaria + Regimento Interno com atribuições do art. 17 + **cláusula condicional embutida** suspendendo funcionamento até publicação do Ato de Enquadramento · soft lock UX + hard lock no texto · lastro: Lei 10.973/2004 art. 16-17.
  6. **Política de Inovação da ICT** (5 telas com **gatekeeper rígido**) · saída: Modelo Integrado (Diretrizes Gerais + Estrutura Normativa) OU Modelo Fragmentado (núcleo + 4 resoluções: PI · Transferência · Remuneração · Cooperação) · faixa legal art. 13 (5%-1/3) embutida · FORMICT obrigatório · lastro: Lei 10.973/2004 arts. 6º-13 e 15-A.
- **Domínio comum:** Marco Legal CT&I (Lei 10.973/2004 c/ redação 13.243/2016), Lei 14.129/2021, INs aplicáveis, padrão SEI/ABNT.
- **Recorte:** **Quando o lab precisa virar instituição** ou um instrumento jurídico precisa existir para destravar uma ação.
- **Não faz:** blueprint metodológico, plano técnico de implementação, indicador de impacto, defesa institucional.
- **Banco:** `mode_used='formalizar'` (não quebra constraint), com `frente` armazenado em `wizard_input` (JSONB opaco).

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

### 3.5 · Manter (ex-Provar)

- **Entrada:** Entregas existentes · Janela política e audiência · Risco de descontinuidade · Pedido de continuidade (4 telas).
- **Saída:** Pacote de Continuidade Institucional com até 4 peças — (A) Dossiê de Transição Institucional; (B) Briefing Executivo de Transição (2-3 págs, custo de não manter quantificado em 4 vetores); (C) Plano de Sustentabilidade e Ecossistema (peça SEI-Ready autônoma); (D) Minuta(s) de Adesão à Rede (uma por rede declarada).
- **Domínio:** Continuidade de Estado, literatura I.LAB e Sano (2020) sobre mortalidade de labs, gestão do conhecimento, anti-falácia do patrocinador sênior, inserção em redes (Mapeamento LISP Brasil · InovaGov · RenovaJud).
- **Recorte:** **No momento político e na vida adulta do lab.** Transição de gestão, defesa orçamentária, prestação de contas, defesa de funções comissionadas e alocação de horas.
- **Não faz:** entrega nova; só **compõe** o que já existe (insumos vêm de Construir + Avaliar + Formalizar). Não trava saída por patrocinador único — entrega documento com alerta de fragilidade institucional destacado.

---

## 4. Regra de roteamento (desempate em 1 segundo)

**Passo 0 invariante:** todo caso passa por **Mapear** antes. O Relatório de Diagnóstico emite Go/No-Go e roteia. As regras abaixo desempatam quando o input do Mapear cabe em dois ou mais verbos de execução simultaneamente — decida pelo **resultado pretendido**:

1. Documento publicável em DOU/BG/SEI → **Formalizar**
2. Sistema, automação ou protótipo que precisa rodar → **Construir**
3. Plano de ação metodológico em fases → **Estruturar**
4. Indicador de outcome ou teoria de mudança → **Avaliar**
5. Pacote de continuidade institucional (dossiê + briefing + sustentabilidade + adesão à rede) → **Manter**

A regra é deliberadamente lexicográfica: **se a saída cabe num PDF assinado, é Formalizar**, mesmo que o conteúdo tenha vindo de um Blueprint do Estruturar.

---

## 5. Mapa Diagnóstico → Verbo (hooks atuais)

> **Nota 2026-05-11:** o sistema dos 20 hooks foi originalmente a porta de entrada visual em `/diagnostico` (5 perguntas → 1-5 cards de peças). A partir desta data, o Mapear assume a porta de entrada visual. Os 20 hooks permanecem como **infraestrutura interna** — acessíveis programaticamente via `getHook(dim, response)` e injetados no system prompt da Jô quando o caminho legado for usado. A reclassificação por verbo dono abaixo segue válida como referência arquitetural.

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
| `gargalo:escala` | Plano de Replicação | **Construir** | Manter |
| `governanca:balcao` | Portaria de Criação | **Formalizar** | — |
| `governanca:programa` | Plano de Alinhamento Estratégico | **Manter** | — |
| `governanca:estrategico` | Matriz de KPIs | **Avaliar** | Manter |
| `governanca:patrocinado` | Plano de Captação | **Formalizar** | Manter |
| `equipe:conselheiro` | NT de Dedicação Exclusiva | **Formalizar** | — |
| `equipe:facilitador-equipe` | Protocolo de Automação | **Construir** | — |
| `equipe:lab-autonomo` | Minuta de Regimento | **Formalizar** | — |
| `equipe:lab-pleno` | Plano de Sucessão | **Manter** | — |
| `abertura:interna` | Edital de Desafio | **Formalizar** | — |
| `abertura:rede` | Cooperação com Instituições | **Formalizar** | — |
| `abertura:cocriacao` | Protocolo de Cocriação | **Construir** | Estruturar |
| `abertura:misto` | Matriz de Critérios de Abertura | **Estruturar** | — |

**Distribuição:** Formalizar 9 · Construir 4 · Estruturar 3 · Avaliar 2 · Manter 2.

**Conclusão:** o diagnóstico legado cobre bem Formalizar e Estruturar. **Avaliar e Manter precisam de hooks novos** (ou de uma porta de entrada própria que não passe pelo diagnóstico legado das 5 perguntas — o que agora se resolve naturalmente pelo Mapear).

---

## 6. Arquitetura de prompts

Base comum (já consolidada em [src/prompts/jo-decisao.md](src/prompts/jo-decisao.md), [jo-estruturar.md](src/prompts/jo-estruturar.md) e [jo-mapear.md](src/prompts/jo-mapear.md)):

- Persona Jô (Döbereiner · rigorosa · institucional · pragmática)
- Camada Normativa Tripartite (Base Estruturante · Norma Operacional · Lacuna)
- Anti-alucinação (não inventar normas, dizer "não sei")

Suffixes por modo em [src/prompts/jo-{verbo}.md](src/prompts/):

| Modo | Lastros embarcados | Formato de saída |
|---|---|---|
| `mapear` | IN Conjunta 01/2016 CGU/MP · CF/88 art. 37 · Lei 13.655/2018 (LINDB) · LAI quando aplicável | Relatório de Diagnóstico SEI-Ready + Matriz de Riscos + Go/No-Go + Roteamento + Apêndice Técnico de Tags de Diagnóstico (24 hookIds canônicos) |
| `estruturar` | MINDS, InovaGov, SIMPLES MENTE | Blueprint de Sprint (3 fases) |
| `formalizar` (modular · 6 frentes) | **Portaria:** Lei 14.129/2021, CF/88 art. 37. **Catálogo:** Sano (2020), I.LAB, Lei 13.460/2017. **Dedicação:** Marco CT&I art. 9º-A, 14, 14-A + OCDE/ENAP. **Enquadramento ICT:** Lei 10.973/2004 art. 2º IV. **NIT:** Lei 10.973/2004 art. 16-17. **Política:** Lei 10.973/2004 arts. 6º-13 e 15-A, FORMICT/MCTI. | 6 saídas autônomas conforme a frente acionada |
| `construir` | Engenharia pública, no-code, handoff GNova, Guia AGU Sandbox | Plano Técnico + TCT + Handoff/Descontinuidade |
| `avaliar` | Theory of Change, OCDE/CGU avaliação, indicadores SMART | Matriz de Indicadores + ToC |
| `manter` | I.LAB · Sano (2020) · Mapeamento LISP Brasil · InovaGov · RenovaJud · gestão do conhecimento | Dossiê + Briefing Executivo + Plano de Sustentabilidade SEI + Minutas de Adesão à Rede |

Hooks (20 legados) **continuam funcionando como suffixes one-shot no Modo Decisão**, agora classificados por verbo dono na matriz acima. Nada quebra.

---

## 7. Wizards · entrada canônica de cada modo

Padrão = wizard client-side de N telas → consolida prompt denso → Jô processa de uma vez (igual ao [src/pages/mapear/sprint.astro](src/pages/mapear/sprint.astro) e [src/pages/estruturar/sprint.astro](src/pages/estruturar/sprint.astro)).

| Modo | Telas |
|---|---|
| Mapear | Cenário · Atores · Gargalo · Risco de não agir |
| Estruturar | Problema · Hipótese · Experimento |
| Formalizar (modular) | Seletor → 6 sub-wizards: Portaria (3) · Catálogo (3) · Dedicação (3) · Enquadramento ICT (3) · NIT (4) · Política de Inovação (5 com gatekeeper) |
| Construir | Solução validada · Stack · Restrição TI · Destinatário |
| Avaliar | Intervenção · Outcome · Dados disponíveis |
| Manter | Entregas · Janela e audiência · Risco de descontinuidade · Pedido de continuidade |

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
3. **Provar vira marketing.** Mitigação: Provar **só compõe** o que Avaliar e Construir já gerarem. Sem insumos a montante, Provar não roda. *(Risco endereçado pela renomeação para Manter e pelo escopo de "continuidade institucional de Estado".)*
4. **Formalizar vira o verbo-balde.** Mitigação: a regra "cabe em PDF assinado?" é literal — se o usuário ainda não decidiu o instrumento, não é Formalizar, é Estruturar.
5. **Mapear vira consultor.** Mitigação: trava normativa absoluta — Considerandos restritos à trinca (IN 01/2016 · CF/88 art. 37 · LINDB). Sem invocação de lei de solução final. Saída em formato Relatório (não Parecer Jurídico). Decisão Go/No-Go obrigatória.

---

## 10. Validação contra a literatura · 4 dores estruturais

Olhando friamente para a literatura e os dados brutos do repositório — mapeamento Sano (2020), programa de aceleração I.LAB, tese sobre o LA-BORA! gov —, **os laboratórios reais não morrem por falta de criatividade ou método; morrem por exaustão, invisibilidade e falta de infraestrutura burocrática**.

Cruzando a realidade nacional com os 6 verbos, a arquitetura está corretíssima. Mas as dores reais reportadas pelos gestores apontam **4 elementos práticos que faltam à maioria absoluta dos labs** — e que a Alavanca (e a Jô) precisa forçar goela abaixo dos usuários.

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
- **Onde a Alavanca resolve:** **Avaliar + Manter.** Resposta direta a essa fragilidade estrutural — garantem a defesa institucional na transição. Reforça a hipótese da §8: priorizar Avaliar cedo no roadmap, não relegar para ago/2026.

### Síntese

A estrutura de 6 verbos está impecável e madura. **O que falta aos labs reais é deixar de ser "clube de inovadores" e passar a operar como "unidade de Estado".** A Alavanca será a ferramenta definitiva se a Jô for usada não apenas para desenhar soluções bonitas, mas para **forçar a burocracia fundacional do lab**: redigir catálogo de serviços, formalizar carga horária da equipe, blindar juridicamente as contratações. É isso que garante a sobrevivência.

---

## 11. Decisões pendentes (Carla)

**Estruturais:**
1. Confirmar a regra de roteamento da §4 (lexicográfica pela saída pretendida).
2. Confirmar a reclassificação de `governanca:estrategico` (Matriz de KPIs) como **Avaliar** e não **Formalizar** — hoje vive em Governança no diagnóstico.
3. Confirmar que Avaliar e Manter terão hooks próprios pós-evento, ou se permanecerão acessíveis apenas pelos wizards diretos (sem entrada pelo diagnóstico legado).
4. Confirmar sequência do roadmap (Formalizar → Construir → Avaliar → Manter) ou priorizar Avaliar antes de Construir, para fechar o ciclo de medição cedo.

**Disparadas pela §10 (validação na literatura):**
5. Aprovar criação do **21º hook** — Catálogo de Serviços do Lab — em Formalizar (cobre a dor §10.1, hoje invisível na matriz).
6. Confirmar reforço dos lastros OCDE/ENAP no system prompt do `equipe:conselheiro` (NT de Dedicação Exclusiva) — enquadrar inovação como **Serviço Intensivo em Conhecimento**, não hobby (§10.2).
7. Confirmar que o módulo Construir tratará Sandbox + CPSI + Encomenda Tecnológica como **cadeia única "Vale da Morte"**, não peças isoladas — possivelmente como um wizard dedicado de transposição protótipo → operação (§10.3).
8. Reavaliar prioridade de **Avaliar no roadmap** — adiantar para jul/2026 (antes de Construir) garante que toda entrega de Construir já nasça com indicador de outcome, em vez de ser auditada retroativamente (§10.4). **→ resolvida pela §12 (tudo nesta entrega).**

---

## 12. Diretriz de escopo · tudo nesta entrega

**Decisão (Carla, 2026-05-10, ampliada 2026-05-11):** nada vai para roadmap. Toda a arquitetura dos 6 verbos descrita neste documento será executada **antes do evento de 2026-05-13**. A §8 está sobrescrita.

### 12.1 · O que "tudo" inclui (escopo concreto)

1. **6 system prompts da Jô** em [src/prompts/](src/prompts/):
   - `jo-mapear.md` · `jo-estruturar.md` · `jo-formalizar.md` · `jo-construir.md` · `jo-avaliar.md` · `jo-manter.md`
   - Cada um seguindo o padrão de [jo-estruturar.md](src/prompts/jo-estruturar.md) (CHARACTER · REQUEST · ADDITIONS · TYPE · EXTRAS · EXAMPLES + Anti-alucinação).
2. **6 wizards** em [src/pages/](src/pages/) seguindo o padrão de [estruturar/sprint.astro](src/pages/estruturar/sprint.astro):
   - `mapear/sprint.astro` (4 telas: Cenário · Atores · Gargalo · Risco de não agir)
   - `estruturar/sprint.astro` (3 telas: Problema · Hipótese · Experimento)
   - `formalizar/sprint.astro` (4 telas: Tipo · Vinculação · Mandato · Lastro)
   - `construir/sprint.astro` (4 telas: Solução · Stack · Restrição TI · Destinatário)
   - `avaliar/sprint.astro` (3 telas: Intervenção · Outcome · Dados)
   - `manter/sprint.astro` (4 telas: Entregas · Janela e audiência · Risco · Pedido de continuidade)
3. **JoMode estendido** em [src/lib/ai/prompts/index.ts](src/lib/ai/prompts/index.ts):
   ```ts
   type JoMode = 'decisao' | 'possibilidades'
                | 'mapear' | 'estruturar' | 'formalizar'
                | 'construir' | 'avaliar' | 'manter';
   ```
   `getPromptForMode` switch atualizado para os 6 verbos.
4. **21º hook** — Catálogo de Serviços do Lab — em [src/lib/diagnostico/hooks.ts](src/lib/diagnostico/hooks.ts) + suffix em `src/prompts/hooks/governanca_identidade.md`. Anexar à dimensão `governanca` (5ª opção) ou criar dimensão extra — definir na implementação.
5. **Reforço OCDE/ENAP** em `src/prompts/hooks/equipe_conselheiro.md`: enquadrar dedicação exclusiva como **Serviço Intensivo em Conhecimento**, não hobby.
6. **Cadeia "Vale da Morte"** no Construir: Sandbox + CPSI + Encomenda Tec como sequência amarrada no system prompt e referenciada cruzadamente nos hooks `gargalo:prototipo`, `vocacao:desenvolvedor`, `gargalo:implementacao`. **Embutir os patches da §13 (Descontinuidade + Handoff) — sem isso a cadeia Vale da Morte fica aberta na ponta de saída.**
7. **Reclassificação visual** dos 20 hooks por verbo dono — badge/tag em cada card do diagnóstico mostrando o verbo (Formalizar 9 · Construir 4 · Estruturar 3 · Avaliar 2 · Manter 2). Pode ser uma propriedade nova `Hook.verb` na matriz, exibida na UI.
8. **Páginas-stub viram páginas reais** — [/mapear](src/pages/mapear.astro), [/formalizar](src/pages/formalizar.astro), [/construir](src/pages/construir.astro), [/avaliar](src/pages/avaliar.astro), [/manter](src/pages/manter.astro) deixam de ser `<Stub>` e ganham conteúdo institucional + CTA para o respectivo wizard.
9. **Unificação do Passo 0** (decisão 2026-05-11): a entrada visual do sistema passa a ser exclusivamente o Mapear. Landing (Hero · LandingFooter · Projects · Nav · navLinks/navCta de index.astro) aponta para `/mapear/sprint`. A URL `/diagnostico` é mantida com **redirect 301 permanente** para preservar bookmarks e links externos. O sistema interno dos 20 hooks permanece funcional como infraestrutura.

### 12.2 · Tradeoff aceito

**Profundidade × largura.** Cada verbo entra em produção com **mínimo viável arquitetural**, não com curadoria longa de few-shots. O system prompt do Estruturar (jo-estruturar.md, ~140 linhas, 1 exemplo completo) é o padrão de qualidade — replicar nessa densidade nos outros 5. Refinamento de prompts, RAG do Construir, e calibração com casos reais ficam para iteração contínua **pós-evento**, sem bloquear a entrega da arquitetura completa.

### 12.3 · Ordem de ataque (3 dias úteis)

Priorização caso o tempo aperte — começar pelo que carrega a demo de palco, deixar o que pode degradar elegante para o fim:

1. **Dia 1 (10–11/05)** — system prompts dos 6 verbos (texto, sem código). É o conteúdo metodológico que dá densidade à demo e que mais demora a curar.
2. **Dia 2 (12/05)** — wizards (6 páginas) + extensão do `JoMode` + páginas-stub viram reais + unificação do Passo 0 (redirect `/diagnostico` + landing apontando pra `/mapear/sprint`).
3. **Dia 3 (13/05 manhã)** — 21º hook, reforço `equipe:conselheiro`, reclassificação visual, cadeia Vale da Morte. São polimentos que valorizam o palco mas não bloqueiam a demo principal (que será do Estruturar, com os outros 5 verbos clicáveis e funcionais).

### 12.4 · Risco vivo

3 dias úteis para 6 wizards + 6 prompts curados + 1 hook + reclassificação é apertado mesmo com paralelização. **Critério de corte se algo cair:** preservar (a) os 6 wizards funcionais (largura visível), (b) os 6 prompts mínimos (cada um ≥ 80 linhas com 1 exemplo), (c) **os patches da §13 no `jo-construir.md` — não-negociáveis, fecham porta que Bruno Portela (AGU) certamente bate na mesa**, (d) **a trava normativa do `jo-mapear.md` — não-negociável, evita o Mapear pré-julgar a solução e atravessar competência dos verbos seguintes**. O que pode degradar: profundidade do system prompt do Manter (mais composição que metodologia), reclassificação visual do diagnóstico, cadeia Vale da Morte (pode entrar como nota no prompt do Construir, sem amarração cruzada nos hooks).

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

---

## 14. Mapear · trava normativa e unificação do Passo 0

**Diagnóstico (2026-05-11):** ao se tornar o Passo 0 obrigatório com saída SEI-Ready (Relatório de Diagnóstico Institucional), o Mapear corre dois riscos: **pré-julgar a solução** (invocando lei de instrumento que cabe a verbo posterior) e **competir com o diagnóstico legado de 5 perguntas** (criando dois "Passos 0" concorrentes na interface).

### 14.1 · Trava normativa absoluta — trinca de Diagnóstico

Os Considerandos do Relatório de Diagnóstico invocam EXCLUSIVAMENTE:

- **(i) IN Conjunta nº 01/2016 CGU/MP** — gestão de riscos e controles internos. Fornece a "segurança razoável" que justifica ambientes controlados.
- **(ii) CF/88, art. 37** — princípio da eficiência. Sustenta NO-GO quando o problema está fora do escopo.
- **(iii) Lei nº 13.655/2018 (LINDB, alterações de 2018)** — consequencialismo e erro legítimo. Autoriza o gestor a rodar o Mapeamento como ato de gestão diligente antes de gastar recursos.

**PROIBIDO nos Considerandos do Mapear** (represadas para verbos seguintes):
- Lei nº 14.129/2021 (Governo Digital) → Formalizar/Construir
- Lei nº 10.973/2004 c/ redação 13.243/2016 (Marco Legal CT&I) → Formalizar/Construir
- Lei nº 14.133/2021 (Nova Lei de Licitações) → Construir/Formalizar
- LC 182/2021 (Marco das Startups) → Construir
- Guia Referencial de Sandbox Regulatório (AGU) → Construir

**Razão:** o Mapear DIAGNOSTICA; invocar lei de solução pré-julga e atravessa competência do verbo dono.

### 14.2 · Unificação da porta de entrada

- A entrada visual do sistema passa a ser **exclusivamente** o Mapear.
- Hero, LandingFooter, Projects (Sistema · 01 Diagnóstico), Nav e navLinks/navCta de index.astro apontam para `/mapear/sprint`.
- A URL `/diagnostico` é mantida com **redirect 301 permanente** para `/mapear/sprint` (preserva bookmarks, links externos e referências em peças anteriores).
- O sistema interno dos 20 hooks (`src/lib/diagnostico/hooks.ts` + `src/prompts/hooks/*.md`) permanece funcional internamente, sem porta de entrada visual.

### 14.3 · Saída obrigatória do Relatório

Toda saída do Mapear deve conter:

1. Diretriz **Go/No-Go tripartite** (GO · GO com mitigação · NO-GO) com justificativa de 2-4 linhas.
2. **Roteamento — Ordem de Ataque numerada** dos verbos seguintes, cada item com pergunta inicial pronta para colar no wizard do verbo subsequente.
3. **Probabilidade e Impacto com frase de lastro** extraída do input (sem lastro, omitir classificação).
4. **Caveat institucional** declarando que o Relatório não substitui análise jurídica nem decisão política, e que a LINDB sustenta o Mapeamento como ato de gestão diligente — não como autorização normativa para execução subsequente.

Sem qualquer um desses elementos, o Relatório não é entregue.
