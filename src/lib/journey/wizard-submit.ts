import { getSupabaseBrowserClient } from '../supabase/browser';

export type WizardVerb =
  | 'mapear'
  | 'estruturar'
  | 'formalizar'
  | 'construir'
  | 'avaliar'
  | 'manter';

export interface SubmitWizardArgs {
  verb: WizardVerb;
  // Estrutura passada pra POST /api/journey/artifact quando logado.
  wizardInput: unknown;
  // Texto compilado pra textarea da Jô (modo demo / fallback).
  fallbackText: string;
  // Origem registrada no sessionStorage (rastreio fraco, só pra debug).
  fallbackSource: string;
}

// Cliente do wizard de cada verbo chama isto no submit final.
// Logado: POST /api/journey/artifact → /jo?artifact=<id>.
// Anônimo ou API falhou: sessionStorage + /jo (modo demo intacto).
// Esta função sempre navega; quem chama não precisa continuar.
export async function submitWizard(args: SubmitWizardArgs): Promise<void> {
  let isAuthed = false;
  try {
    const sb = getSupabaseBrowserClient();
    const { data } = await sb.auth.getSession();
    isAuthed = !!data?.session;
  } catch {
    isAuthed = false;
  }

  if (isAuthed) {
    try {
      const resp = await fetch('/api/journey/artifact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verb: args.verb, wizardInput: args.wizardInput }),
      });
      if (resp.ok) {
        const data = (await resp.json()) as { artifactId?: string };
        const next = data.artifactId
          ? `/jo?artifact=${encodeURIComponent(data.artifactId)}`
          : '/jo';
        window.location.href = next;
        return;
      }
      if (resp.status !== 401) {
        // 4xx/5xx ≠ 401: erro de servidor ou validação. Cai no fallback pra
        // não perder o que o user digitou. Carla pode trocar pra alert no
        // futuro se preferir interromper.
        // eslint-disable-next-line no-console
        console.warn('[wizard-submit] API respondeu', resp.status);
      }
      // 401 = sessão expirou; segue pro fallback demo silenciosamente.
    } catch (e) {
      // Rede off, server down etc — fallback demo preserva os dados.
      // eslint-disable-next-line no-console
      console.warn('[wizard-submit] API falhou, caindo no fallback', e);
    }
  }

  // Fallback demo: pré-fill na Jô via sessionStorage (comportamento original).
  try {
    sessionStorage.setItem(
      'alavanca:diag-prefill',
      JSON.stringify({
        text: args.fallbackText,
        mode: args.verb,
        source: args.fallbackSource,
        ts: Date.now(),
      }),
    );
  } catch {
    /* sessionStorage indisponível (modo privado restrito) — segue pra Jô igual */
  }
  window.location.href = '/jo';
}
