/**
 * Schema do output da IA para o módulo Adequa.
 *
 * Regra crítica:
 *   confidence é DERIVADA de basis.type — não inventada pelo modelo.
 *   normative   → high  (sempre, se a norma realmente sustenta)
 *   best_practice → medium
 *   consistency → medium
 *   style       → low
 *
 * Sem norma específica → NUNCA marcar como 'normative'.
 */

import type { BestPracticeSource } from './legal';

export type AudienceCode =
  | 'cidadao'
  | 'cidadao_vulneravel'
  | 'servidor_par'
  | 'tecnico_outra_area'
  | 'gestor'
  | 'orgao_controle'
  | 'imprensa'
  | 'audiencia_academica'
  | 'audiencia_politica'
  | 'parceiro_institucional';

export type DocumentType =
  | 'nota_tecnica'
  | 'memorando'
  | 'catalogo_servicos'
  | 'carta_servicos'
  | 'manifesto'
  | 'post_rede'
  | 'apresentacao_executiva'
  | 'release_oped'
  | 'email_institucional'
  | 'texto_livre';

export type Formality = 1 | 2 | 3 | 4 | 5;

export type SuggestionBasis =
  | {
      type: 'normative';
      norm_id: string;          // id de NORMATIVE_BASE
      article?: string;
      excerpt: string;          // trecho exato citado
    }
  | {
      type: 'best_practice';
      source: BestPracticeSource;
      description: string;
    }
  | {
      type: 'style';
      description: string;      // ex: "verbo ativo aproxima do leitor"
    }
  | {
      type: 'consistency';
      description: string;      // ex: "tom oscila — uniformizar para formal"
    };

export type Confidence = 'high' | 'medium' | 'low';

export type Suggestion = {
  id: string;
  range: { start: number; end: number };   // offsets no texto original
  original: string;
  suggested: string;
  basis: SuggestionBasis;
  confidence: Confidence;
  rationale: string;                       // explicação humana curta (1-2 frases)
};

export type Metrics = {
  flesch_pt?: number;                      // adaptação para PT, se calcularmos
  avg_sentence_length: number;             // palavras por frase
  complex_word_ratio: number;              // 0..1
  jargon_detected: string[];               // termos técnicos encontrados
};

export type ReviewOutput = {
  summary: string;                         // 2-3 frases: o texto está adequado para X em Y/10
  suggestions: Suggestion[];
  metrics: Metrics;
  basis_breakdown: {
    normative: number;
    best_practice: number;
    style: number;
    consistency: number;
  };
};

export type ReviewInput = {
  text: string;                            // texto extraído (após cascata)
  audience: AudienceCode;
  document_type: DocumentType;
  formality: Formality;
  free_brief?: string;                     // pergunta opcional do usuário
};
