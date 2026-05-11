/**
 * System prompt v1 do módulo Adequa + tool schema para output estruturado.
 *
 * Estrutura:
 *   1. Persona (Jô) + tarefa
 *   2. Diretrizes operacionais (sugestões pontuais, não reescrita)
 *   3. Base normativa autorizada (lista FECHADA)
 *   4. Fontes de boa prática reconhecidas
 *   5. REGRA ANTI-ALUCINAÇÃO (literal, maiúscula)
 *   6. Mapeamento basis → confidence
 *   7. Tool de saída (input_schema validado)
 */

import { NORMATIVE_BASE, BEST_PRACTICE_SOURCES } from './legal';
import type { ReviewInput } from './schema';

const NORMATIVE_LIST = NORMATIVE_BASE.map(
  (n) => `- [${n.id}] ${n.norm}${n.article ? ' ' + n.article : ''} — ${n.long_name}\n  Trecho: ${n.excerpt}`,
).join('\n');

const BEST_PRACTICE_LIST = Object.entries(BEST_PRACTICE_SOURCES)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join('\n');

const AUDIENCE_LABELS: Record<string, string> = {
  cidadao: 'Cidadão geral (sem jargão, frases curtas, verbo de ação)',
  cidadao_vulneravel: 'Cidadão vulnerabilizado (vocabulário ≤ 6ª série, redundância controlada)',
  servidor_par: 'Servidor par interno (jargão operacional ok, foco em processo)',
  tecnico_outra_area: 'Técnico de outra área (sem jargão da emissora, com fundamentação)',
  gestor: 'Gestor (resumo executivo, decisão, impacto)',
  orgao_controle: 'Órgão de controle (rastreabilidade, fundamentação normativa, impessoalidade)',
  imprensa: 'Imprensa (frases curtas, conflito, impacto público, releasável)',
  audiencia_academica: 'Audiência acadêmica (método, citação, problematização)',
  audiencia_politica: 'Audiência política (argumento, impacto popular, ganho político)',
  parceiro_institucional: 'Parceiro institucional (colaborativo, reciprocidade)',
};

const DOCUMENT_LABELS: Record<string, string> = {
  nota_tecnica: 'Nota Técnica (cabeçalho, fundamentação, conclusão)',
  memorando: 'Memorando ou despacho interno',
  catalogo_servicos: 'Catálogo de Serviços (estrutura padronizada)',
  carta_servicos: 'Carta de Serviços ao Usuário (Decreto 9.094/2017)',
  manifesto: 'Manifesto ou texto de divulgação institucional',
  post_rede: 'Post de rede social (hook, corpo, CTA)',
  apresentacao_executiva: 'Apresentação executiva (slides com ideia-chave)',
  release_oped: 'Release ou op-ed (lead jornalístico)',
  email_institucional: 'E-mail institucional',
  texto_livre: 'Texto livre (sem estrutura formal pré-definida)',
};

export const SYSTEM_PROMPT_V1 = `Você é a Jô, assistente da plataforma Alavanca — especialista em adequação de comunicação no setor público.

TAREFA
Receber um texto e os parâmetros do público-alvo, e devolver:
1. Um resumo curto sobre a adequação atual do texto ao público.
2. Sugestões PONTUAIS de adequação (não reescrita total).
3. Métricas de legibilidade.

DIRETRIZES OPERACIONAIS
- Cada sugestão é pontual: identifique o trecho exato no texto original (offsets start/end) e proponha o trecho substituto.
- Não reescreva o documento inteiro. Devolva entre 3 e 15 sugestões priorizando as mais importantes.
- Preserve o sentido do autor. Você ajusta tom, vocabulário e estrutura — não muda decisões de conteúdo.
- Sugestões devem ser ACIONÁVEIS: clica e aceita, sem precisar pensar muito.

BASE NORMATIVA AUTORIZADA (lista FECHADA — você só pode citar esta lista como 'normative')
${NORMATIVE_LIST}

FONTES DE BOA PRÁTICA RECONHECIDAS (use como 'best_practice')
${BEST_PRACTICE_LIST}

═══════════════════════════════════════════════════════════════
REGRA CRÍTICA — NUNCA INVENTE NORMA
═══════════════════════════════════════════════════════════════
Se você NÃO conhece uma norma específica da lista acima que sustente sua sugestão,
NÃO INVENTE respaldo legal. Marque a sugestão como 'style' ou 'consistency'.

É PREFERÍVEL BAIXA CONFIANÇA HONESTA A ALTA CONFIANÇA ALUCINADA.

Você só pode marcar basis.type = 'normative' se:
  (a) a norma estiver na lista autorizada acima;
  (b) você citar o id correspondente (ex: 'lei-14129-2021');
  (c) o trecho da norma realmente sustentar a sugestão.

Sem esses três, use 'best_practice', 'style' ou 'consistency'.
═══════════════════════════════════════════════════════════════

MAPEAMENTO basis.type → confidence
- normative      → 'high'    (norma sustenta diretamente)
- best_practice  → 'medium'  (diretriz reconhecida sem força normativa direta)
- consistency    → 'medium'  (inconsistência interna do próprio documento)
- style          → 'low'     (preferência editorial sem norma específica)

NÃO use 'high' fora de basis.type='normative'.
NÃO use 'low' com basis.type='normative'.

QUANDO MARCAR 'consistency'
- Tom oscila entre formal e informal no mesmo documento.
- Vocabulário muda (alterna sinônimos sem razão).
- Estrutura quebrada (parágrafos com tamanhos discrepantes, listas inconsistentes).

QUANDO MARCAR 'style'
- Voz passiva quando ativa seria mais clara.
- Frase longa que se beneficia de quebra.
- Jargão evitável sem perda técnica.
- Latinismo dispensável (data venia, in fine, etc.) fora de contexto jurídico exigido.

SAÍDA
Use OBRIGATORIAMENTE a tool 'submit_review' com o input no schema definido.
NÃO produza texto livre — toda resposta vai na tool.`;

/**
 * Constrói o user prompt para uma revisão específica.
 */
export function buildUserPrompt(input: ReviewInput): string {
  const audienceLabel = AUDIENCE_LABELS[input.audience] ?? input.audience;
  const docLabel = DOCUMENT_LABELS[input.document_type] ?? input.document_type;

  const formalityLabel = ['', 'muito informal', 'informal acessível', 'neutro', 'formal', 'muito formal técnico'][
    input.formality
  ];

  const briefSection = input.free_brief
    ? `\nPEDIDO ESPECÍFICO DO USUÁRIO:\n${input.free_brief}\n`
    : '';

  return `PÚBLICO-ALVO: ${audienceLabel}
TIPO DE DOCUMENTO: ${docLabel}
FORMALIDADE DESEJADA: ${input.formality}/5 (${formalityLabel})
${briefSection}
TEXTO PARA REVISÃO (offsets 0-indexed sobre este texto):
---
${input.text}
---

Analise e use a tool 'submit_review' para devolver sua revisão.`;
}

// ─────────────────────────────────────────────────────────────
// TOOL SCHEMA (input_schema do tool use)
// ─────────────────────────────────────────────────────────────

const NORMATIVE_IDS = NORMATIVE_BASE.map((n) => n.id);

export const REVIEW_TOOL = {
  name: 'submit_review',
  description:
    'Submete a revisão de linguagem ao usuário com sugestões pontuais, cada uma com base (normative/best_practice/style/consistency) e confiança correspondente.',
  input_schema: {
    type: 'object',
    required: ['summary', 'suggestions', 'metrics', 'basis_breakdown'],
    properties: {
      summary: {
        type: 'string',
        description: '2-3 frases avaliando a adequação atual do texto ao público.',
      },
      suggestions: {
        type: 'array',
        minItems: 0,
        maxItems: 20,
        items: {
          type: 'object',
          required: ['id', 'range', 'original', 'suggested', 'basis', 'confidence', 'rationale'],
          properties: {
            id: { type: 'string', description: 'Identificador curto da sugestão (s1, s2, ...).' },
            range: {
              type: 'object',
              required: ['start', 'end'],
              properties: {
                start: { type: 'integer', minimum: 0 },
                end: { type: 'integer', minimum: 0 },
              },
            },
            original: { type: 'string' },
            suggested: { type: 'string' },
            basis: {
              oneOf: [
                {
                  type: 'object',
                  required: ['type', 'norm_id', 'excerpt'],
                  properties: {
                    type: { const: 'normative' },
                    norm_id: { type: 'string', enum: NORMATIVE_IDS },
                    article: { type: 'string' },
                    excerpt: { type: 'string' },
                  },
                },
                {
                  type: 'object',
                  required: ['type', 'source', 'description'],
                  properties: {
                    type: { const: 'best_practice' },
                    source: {
                      type: 'string',
                      enum: Object.keys(BEST_PRACTICE_SOURCES),
                    },
                    description: { type: 'string' },
                  },
                },
                {
                  type: 'object',
                  required: ['type', 'description'],
                  properties: {
                    type: { const: 'style' },
                    description: { type: 'string' },
                  },
                },
                {
                  type: 'object',
                  required: ['type', 'description'],
                  properties: {
                    type: { const: 'consistency' },
                    description: { type: 'string' },
                  },
                },
              ],
            },
            confidence: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
            },
            rationale: {
              type: 'string',
              description: 'Explicação curta (1-2 frases) do porquê da sugestão.',
            },
          },
        },
      },
      metrics: {
        type: 'object',
        required: ['avg_sentence_length', 'complex_word_ratio', 'jargon_detected'],
        properties: {
          flesch_pt: { type: 'number', description: 'Adaptação Flesch para PT, se calculável.' },
          avg_sentence_length: { type: 'number', description: 'Palavras por frase em média.' },
          complex_word_ratio: { type: 'number', minimum: 0, maximum: 1 },
          jargon_detected: { type: 'array', items: { type: 'string' } },
        },
      },
      basis_breakdown: {
        type: 'object',
        required: ['normative', 'best_practice', 'style', 'consistency'],
        properties: {
          normative: { type: 'integer', minimum: 0 },
          best_practice: { type: 'integer', minimum: 0 },
          style: { type: 'integer', minimum: 0 },
          consistency: { type: 'integer', minimum: 0 },
        },
      },
    },
  } as const,
};
