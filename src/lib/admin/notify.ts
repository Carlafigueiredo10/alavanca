import { OWNER_EMAIL } from './owner';

// Notificação por e-mail via Resend (https://resend.com) quando chega sugestão.
// Sem domínio próprio verificado, usar `onboarding@resend.dev` como remetente —
// o Resend permite enviar pra qualquer e-mail registrado na conta. Quando
// houver domínio próprio, basta trocar o `from`.

export interface SuggestionNotifyPayload {
  id?: string;
  content: string;
  category: string | null;
  kind: 'geral' | 'bibliografia' | 'ecossistema';
  subkind: string | null;
  page: string | null;
  authorName: string | null;
  authorEmail: string | null;
}

function siteUrl(): string {
  return import.meta.env.PUBLIC_SITE_URL?.trim() || 'https://cliclabs.vercel.app';
}

function buildSubject(p: SuggestionNotifyPayload): string {
  const tipo = p.subkind ? `${p.kind}/${p.subkind}` : p.kind;
  const cat = p.category ? ` · ${p.category}` : '';
  return `[Alavanca] ${tipo}${cat}`;
}

function buildText(p: SuggestionNotifyPayload): string {
  const lines = [
    p.content,
    '',
    '— — —',
    `Categoria: ${p.category ?? '—'}`,
    `Tipo: ${p.subkind ? `${p.kind}/${p.subkind}` : p.kind}`,
    `Página: ${p.page ?? '—'}`,
    `Nome: ${p.authorName ?? '—'}`,
    `E-mail: ${p.authorEmail ?? '—'}`,
    '',
    `Painel: ${siteUrl()}/meus-produtos`,
  ];
  return lines.join('\n');
}

// Fire-and-forget seguro: nunca lança. Em caso de falha, loga e segue.
// O insert no banco é a fonte da verdade — e-mail é só notificação.
export async function notifyOwnerOfSuggestion(payload: SuggestionNotifyPayload): Promise<void> {
  const apiKey = import.meta.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[notify] RESEND_API_KEY ausente — sugestão gravada mas e-mail não enviado');
    return;
  }

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Alavanca <onboarding@resend.dev>',
        to: [OWNER_EMAIL],
        reply_to: payload.authorEmail ?? undefined,
        subject: buildSubject(payload),
        text: buildText(payload),
      }),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      console.error('[notify] resend rejeitou', resp.status, body.slice(0, 200));
    }
  } catch (e) {
    console.error('[notify] resend falhou', e instanceof Error ? e.message : e);
  }
}
