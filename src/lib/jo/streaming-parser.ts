// Parser incremental pra streaming de JSON estruturado da Jô.
//
// Estratégia:
// 1. Detecta JSON pelo `{` inicial (tolerante a wrapper ```json...```).
// 2. Procura `"markdown": "...` no buffer. Quando encontra:
//    a. Extrai cabeçalho (tudo antes do markdown) → libera badges imediatamente.
//    b. Decodifica conteúdo do markdown on-the-fly conforme chegam chunks.
// 3. Contrato: `markdown` deve ser o ÚLTIMO campo do objeto pra que o
//    cabeçalho fique completo no momento em que o markdown começa.

import {
  stripCodeFence,
  parseRelatorioHeaderFromPreamble,
  type JoRelatorioHeader,
} from './response-types';

export type StreamMode = 'unknown' | 'plain' | 'structured';

export interface StreamingState {
  mode: StreamMode;
  raw: string;             // todo o stream acumulado (cru)
  normalized: string;      // raw com ```json fence removida
  header: JoRelatorioHeader | null;  // metadados extraídos cedo
  markdownStart: number;   // índice em normalized onde o conteúdo do markdown começa
  markdownDecoded: string; // texto já decodificado pra mostrar ao usuário
}

export function initStreamingState(): StreamingState {
  return {
    mode: 'unknown',
    raw: '',
    normalized: '',
    header: null,
    markdownStart: -1,
    markdownDecoded: '',
  };
}

// Regex que detecta o campo `markdown` precedido por `{` ou `,` (sinal de
// início de chave nova) pra evitar falso positivo dentro de outro string.
const MARKDOWN_FIELD_RE = /(?:^|[,{])\s*"markdown"\s*:\s*"/;

export function ingestChunk(state: StreamingState, chunk: string): void {
  state.raw += chunk;
  state.normalized = stripCodeFence(state.raw);

  if (state.mode === 'unknown') {
    const trimmed = state.normalized.trimStart();
    if (trimmed.length === 0) return;
    if (trimmed.startsWith('{')) {
      state.mode = 'structured';
    } else {
      state.mode = 'plain';
      return;
    }
  }

  if (state.mode === 'plain') return;

  // Modo structured: procura o início do markdown
  if (state.markdownStart < 0) {
    const m = MARKDOWN_FIELD_RE.exec(state.normalized);
    if (m) {
      state.markdownStart = m.index + m[0].length;
      // Extrai cabeçalho (tudo antes do `,` ou `{` que precede "markdown")
      const preambleEnd = m.index + (m[0].startsWith('{') ? 1 : 0);
      const preamble = state.normalized.slice(0, m.index);
      // Tenta parsear cabeçalho — disponível pra UI renderizar badges
      state.header = parseRelatorioHeaderFromPreamble(preamble);
      void preambleEnd; // reservado pra futuro debug
    } else {
      return;
    }
  }

  // Decodifica progressivamente o conteúdo do campo markdown
  state.markdownDecoded = decodeJsonStringSlice(state.normalized, state.markdownStart);
}

// Decodifica caracteres JSON-escapados de uma slice. Para no primeiro `"`
// não-escapado (fim da string JSON) ou no fim do buffer (espera mais chunk).
// Tolerante a chunks que terminam no meio de uma escape sequence.
export function decodeJsonStringSlice(raw: string, start: number): string {
  let out = '';
  let i = start;
  while (i < raw.length) {
    const c = raw[i];
    if (c === '\\') {
      if (i + 1 >= raw.length) break; // espera próximo chunk
      const next = raw[i + 1];
      switch (next) {
        case 'n': out += '\n'; i += 2; continue;
        case 't': out += '\t'; i += 2; continue;
        case 'r': out += '\r'; i += 2; continue;
        case '"': out += '"';  i += 2; continue;
        case '\\': out += '\\'; i += 2; continue;
        case '/': out += '/';  i += 2; continue;
        case 'b': out += '\b'; i += 2; continue;
        case 'f': out += '\f'; i += 2; continue;
        case 'u': {
          if (i + 5 >= raw.length) return out; // espera próximo chunk
          const hex = raw.slice(i + 2, i + 6);
          const code = parseInt(hex, 16);
          if (Number.isNaN(code)) { out += '?'; i += 6; continue; }
          out += String.fromCharCode(code);
          i += 6;
          continue;
        }
        default: out += next; i += 2; continue;
      }
    }
    if (c === '"') {
      // fim da string JSON
      return out;
    }
    out += c;
    i += 1;
  }
  return out;
}

// Conveniência: o que mostrar no bubble durante streaming.
export function currentVisibleText(state: StreamingState): string {
  if (state.mode === 'plain') return state.raw;
  if (state.mode === 'structured' && state.markdownStart >= 0) {
    return state.markdownDecoded;
  }
  return ''; // structured mas ainda no preâmbulo: UI mostra spinner
}
