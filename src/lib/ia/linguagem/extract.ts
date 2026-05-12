/**
 * Cascata de extração textual.
 *
 * Ordem:
 *   .docx        → mammoth                    (sempre)
 *   .pdf textual → unpdf                      (sempre primeiro)
 *   .pdf scan    → fallback Claude Vision     (Fase 1)
 *   .png/.jpg    → Claude Vision direto       (Fase 1)
 *   texto puro   → passa direto
 *
 * Truncamento: textos > 50.000 chars cortam em fim de seção/parágrafo.
 */

import mammoth from 'mammoth';
import { extractText } from 'unpdf';

export type ExtractionResult = {
  text: string;
  quality: number;
  flags: ExtractionFlag[];
  used_vision: boolean;
  pages_estimated?: number;
};

export type ExtractionFlag =
  | 'extraction_imperfect'
  | 'has_tables'
  | 'truncated'
  | 'password_protected'
  | 'unsupported_format'
  | 'empty';

export type SupportedFormat = 'docx' | 'pdf' | 'png' | 'jpg' | 'paste';

const MAX_CHARS = 50_000;
const MIN_CHARS_PER_PAGE = 50;

// ─────────────────────────────────────────────────────────────
// Heurísticas
// ─────────────────────────────────────────────────────────────

function qualityScore(text: string): { quality: number; flags: ExtractionFlag[] } {
  const flags: ExtractionFlag[] = [];
  if (!text || text.length === 0) return { quality: 0, flags: ['empty'] };

  const junkMatches = text.match(/[\x00-\x08\x0B\x0C\x0E-\x1F�]/g);
  const junkRatio = junkMatches ? junkMatches.length / text.length : 0;

  // Padrão grosseiro de tabela: linhas com muitos espaços múltiplos seguidos de números
  const tableLines = text.split('\n').filter((l) => /\s{4,}\S+\s{4,}/.test(l));
  if (tableLines.length > 3) flags.push('has_tables');

  if (junkRatio > 0.05) flags.push('extraction_imperfect');

  const quality = Math.max(0, Math.min(100, Math.round(100 - junkRatio * 1000)));
  return { quality, flags };
}

function truncateAtBoundary(text: string, max: number): { text: string; truncated: boolean } {
  if (text.length <= max) return { text, truncated: false };

  // Tenta cortar em \n\n (parágrafo) próximo ao limite
  const slice = text.slice(0, max);
  const lastBreak = slice.lastIndexOf('\n\n');
  const cutAt = lastBreak > max * 0.7 ? lastBreak : slice.lastIndexOf('\n');
  const finalCut = cutAt > max * 0.5 ? cutAt : max;

  return { text: text.slice(0, finalCut).trim(), truncated: true };
}

function postProcess(rawText: string, pages?: number): ExtractionResult {
  const { text: cut, truncated } = truncateAtBoundary(rawText, MAX_CHARS);
  const { quality, flags } = qualityScore(cut);
  if (truncated) flags.push('truncated');

  return {
    text: cut,
    quality,
    flags,
    used_vision: false,
    pages_estimated: pages,
  };
}

// ─────────────────────────────────────────────────────────────
// Extractores específicos
// ─────────────────────────────────────────────────────────────

export async function extractDocx(buffer: ArrayBuffer): Promise<ExtractionResult> {
  const nodeBuffer = Buffer.from(buffer);
  const result = await mammoth.extractRawText({ buffer: nodeBuffer });
  return postProcess(result.value);
}

export async function extractPdfText(buffer: ArrayBuffer): Promise<ExtractionResult> {
  const data = new Uint8Array(buffer);
  try {
    const { text, totalPages } = await extractText(data, { mergePages: true });
    const pages = totalPages;
    const fullText: string =
      typeof text === 'string' ? text : (text as string[]).join('\n\n');

    // Critério de "PDF escaneado": menos de 50 chars por página em média
    const chars = fullText.replace(/\s/g, '').length;
    if (pages > 0 && chars / pages < MIN_CHARS_PER_PAGE) {
      return {
        text: fullText,
        quality: 20,
        flags: ['extraction_imperfect'],
        used_vision: false,
        pages_estimated: pages,
      };
    }

    return postProcess(fullText, pages);
  } catch (err) {
    const msg = err instanceof Error ? err.message.toLowerCase() : '';
    if (msg.includes('password') || msg.includes('encrypt')) {
      return { text: '', quality: 0, flags: ['password_protected'], used_vision: false };
    }
    throw err;
  }
}

export function extractPaste(text: string): ExtractionResult {
  return postProcess(text);
}

/**
 * Orquestrador da cascata. Recebe buffer + mime, devolve ExtractionResult.
 * Vision (PNG/JPG/PDF escaneado) é Fase 1 — por ora marca unsupported_format.
 */
export async function extract(buffer: ArrayBuffer, mime: string): Promise<ExtractionResult> {
  switch (mime) {
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return extractDocx(buffer);
    case 'application/pdf':
      return extractPdfText(buffer);
    case 'text/plain': {
      const text = new TextDecoder().decode(buffer);
      return extractPaste(text);
    }
    case 'image/png':
    case 'image/jpeg':
      // Fase 1: encaminhar para completeVision
      return { text: '', quality: 0, flags: ['unsupported_format'], used_vision: false };
    default:
      return { text: '', quality: 0, flags: ['unsupported_format'], used_vision: false };
  }
}
