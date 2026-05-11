import type { APIRoute } from 'astro';
import { completeStructured, friendlyAnthropicError } from '../../../lib/ai/providers/anthropic';
import { SYSTEM_PROMPT_V1, buildUserPrompt, REVIEW_TOOL } from '../../../lib/ia/linguagem/prompt';
import { extract, extractPaste } from '../../../lib/ia/linguagem/extract';
import type { ReviewInput, ReviewOutput, AudienceCode, DocumentType, Formality } from '../../../lib/ia/linguagem/schema';

export const prerender = false;

const AUDIENCES: AudienceCode[] = [
  'cidadao', 'cidadao_vulneravel', 'servidor_par', 'tecnico_outra_area',
  'gestor', 'orgao_controle', 'imprensa', 'audiencia_academica',
  'audiencia_politica', 'parceiro_institucional',
];

const DOC_TYPES: DocumentType[] = [
  'nota_tecnica', 'memorando', 'catalogo_servicos', 'carta_servicos',
  'manifesto', 'post_rede', 'apresentacao_executiva', 'release_oped',
  'email_institucional', 'texto_livre',
];

const MAX_TEXT_LEN = 50_000;
const MIN_TEXT_LEN = 30;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function isAudience(v: unknown): v is AudienceCode {
  return typeof v === 'string' && AUDIENCES.includes(v as AudienceCode);
}
function isDocType(v: unknown): v is DocumentType {
  return typeof v === 'string' && DOC_TYPES.includes(v as DocumentType);
}
function isFormality(v: unknown): v is Formality {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5;
}

export const POST: APIRoute = async ({ request }) => {
  const contentType = request.headers.get('content-type') ?? '';

  // ─────────────────────────────────────────────
  // Parse: JSON (texto colado) ou multipart (arquivo)
  // ─────────────────────────────────────────────
  let text: string;
  let audience: AudienceCode;
  let documentType: DocumentType;
  let formality: Formality;
  let freeBrief: string | undefined;
  let extractionFlags: string[] = [];
  let extractionQuality = 100;

  try {
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('file');
      const audienceRaw = form.get('audience');
      const docTypeRaw = form.get('document_type');
      const formalityRaw = Number(form.get('formality'));
      freeBrief = (form.get('free_brief') as string | null) ?? undefined;

      if (!(file instanceof File)) return json({ error: 'invalid_file' }, 400);
      if (!isAudience(audienceRaw)) return json({ error: 'invalid_audience' }, 400);
      if (!isDocType(docTypeRaw)) return json({ error: 'invalid_document_type' }, 400);
      if (!isFormality(formalityRaw)) return json({ error: 'invalid_formality' }, 400);

      audience = audienceRaw;
      documentType = docTypeRaw;
      formality = formalityRaw;

      const buffer = await file.arrayBuffer();
      const result = await extract(buffer, file.type);
      text = result.text;
      extractionFlags = result.flags;
      extractionQuality = result.quality;

      if (result.flags.includes('unsupported_format')) {
        return json({ error: 'unsupported_format', detail: 'Formato não suportado nesta fase. Use .docx, .pdf ou cole o texto.' }, 400);
      }
      if (result.flags.includes('password_protected')) {
        return json({ error: 'password_protected', detail: 'PDF protegido por senha. Remova a proteção e tente de novo.' }, 400);
      }
    } else {
      const body = await request.json().catch(() => null);
      if (!body || typeof body !== 'object') return json({ error: 'invalid_body' }, 400);

      const t = typeof body.text === 'string' ? body.text : '';
      if (!isAudience(body.audience)) return json({ error: 'invalid_audience' }, 400);
      if (!isDocType(body.document_type)) return json({ error: 'invalid_document_type' }, 400);
      if (!isFormality(body.formality)) return json({ error: 'invalid_formality' }, 400);

      const r = extractPaste(t);
      text = r.text;
      extractionFlags = r.flags;
      extractionQuality = r.quality;

      audience = body.audience;
      documentType = body.document_type;
      formality = body.formality;
      freeBrief = typeof body.free_brief === 'string' && body.free_brief.trim() ? body.free_brief.trim() : undefined;
    }
  } catch (err) {
    console.error('[adequa] parse error', err);
    return json({ error: 'parse_failed' }, 400);
  }

  if (text.length < MIN_TEXT_LEN) {
    return json({ error: 'text_too_short', detail: `Mínimo ${MIN_TEXT_LEN} caracteres.` }, 400);
  }
  if (text.length > MAX_TEXT_LEN) {
    return json({ error: 'text_too_long', detail: `Máximo ${MAX_TEXT_LEN} caracteres.` }, 400);
  }

  // ─────────────────────────────────────────────
  // Chama Claude
  // ─────────────────────────────────────────────
  const input: ReviewInput = {
    text,
    audience,
    document_type: documentType,
    formality,
    free_brief: freeBrief,
  };

  try {
    const result = await completeStructured<ReviewOutput>({
      systemPrompt: SYSTEM_PROMPT_V1,
      userPrompt: buildUserPrompt(input),
      tool: REVIEW_TOOL,
      maxTokens: 8192,
    });

    return json({
      output: result.data,
      meta: {
        model: result.model,
        usage: result.usage,
        extraction: {
          quality: extractionQuality,
          flags: extractionFlags,
          length: text.length,
        },
      },
    });
  } catch (err) {
    console.error('[adequa] anthropic error', err);
    const msg = err instanceof Error ? err.message : 'unknown';
    const lower = msg.toLowerCase();

    if (msg.includes('ANTHROPIC_API_KEY')) {
      return json({ error: 'misconfigured', detail: 'ANTHROPIC_API_KEY ausente no servidor.' }, 500);
    }
    if (lower.includes('credit balance') || lower.includes('billing')) {
      return json(
        {
          error: 'billing',
          detail: 'Saldo da Anthropic insuficiente. Adicione créditos em console.anthropic.com/settings/billing.',
        },
        402,
      );
    }
    if (lower.includes('rate limit') || lower.includes('429')) {
      return json({ error: 'rate_limit', detail: 'Cota momentânea da API atingida. Aguarde alguns segundos.' }, 429);
    }
    if (lower.includes('overloaded') || lower.includes('529')) {
      return json({ error: 'overloaded', detail: 'Anthropic sobrecarregada. Tente em instantes.' }, 503);
    }
    return json({ error: 'provider_failed', detail: friendlyAnthropicError }, 502);
  }
};
