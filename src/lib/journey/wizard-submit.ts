import { getSupabaseBrowserClient } from '../supabase/browser';
import {
  STRUCTURED_MODES,
  parseJoStructured,
  type JoStructuredResponse,
  type JoRelatorio,
} from '../jo/response-types';
import {
  initStreamingState,
  ingestChunk,
  currentVisibleText,
  type StreamingState,
} from '../jo/streaming-parser';
import * as overlay from '../jo/structured-overlay';

export type WizardVerb =
  | 'mapear'
  | 'estruturar'
  | 'formalizar'
  | 'construir'
  | 'avaliar'
  | 'manter';

export interface SubmitWizardArgs {
  verb: WizardVerb;
  wizardInput: unknown;
  fallbackText: string;
  fallbackSource: string;
}

const DIAGNOSTIC_CONTEXT_KEY = 'alavanca:diagnostic-context';

// Handoff entre verbos: o done do Mapear (e qualquer relatorio futuro) escreve
// aqui pra que os próximos wizards/Jô possam ler diagnostic_tags + summary +
// route_order sem precisar refazer query. localStorage sobrevive a navegação.
function persistDiagnosticContext(verb: WizardVerb, r: JoRelatorio): void {
  try {
    const payload = {
      verb,
      tags: r.diagnostic_tags,
      summary: r.summary,
      route_order: r.route_order,
      goNoGo: r.goNoGo,
      ts: Date.now(),
    };
    localStorage.setItem(DIAGNOSTIC_CONTEXT_KEY, JSON.stringify(payload));
  } catch {
    /* localStorage indisponível — não bloqueia */
  }
}

async function isAuthenticated(): Promise<boolean> {
  try {
    const sb = getSupabaseBrowserClient();
    const { data } = await sb.auth.getSession();
    return !!data?.session;
  } catch {
    return false;
  }
}

// Caminho legado: sessionStorage + /jo. Usado pra modos não-estruturados ou
// quando o user está anônimo (modo demo).
function fallbackToJo(args: SubmitWizardArgs): void {
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
    /* ignore */
  }
  window.location.href = '/jo';
}

// Caminho estruturado: overlay + stream pra /api/journey/generate. Renderiza
// badges assim que o parser extrai o cabeçalho; markdown digita conforme chega.
// No done, parser completo: devolucao mostra checklist, relatorio mostra CTA.
async function streamStructured(args: SubmitWizardArgs): Promise<void> {
  const handle = overlay.open(args.verb);
  handle.setSpinner('Lendo seu pedido');

  const state: StreamingState = initStreamingState();
  let headerRendered = false;
  let stopped = false;

  // Permite o user fechar o overlay no meio (cancela visualmente; a request
  // segue server-side, mas a UI não atualiza mais).
  handle.root.addEventListener('click', (e) => {
    if (e.target instanceof HTMLElement && e.target.dataset.role === 'close') {
      stopped = true;
    }
  });

  let artifactId: string | null = null;
  let res: Response;
  try {
    res = await fetch('/api/journey/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verb: args.verb, wizardInput: args.wizardInput }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'sem rede';
    handle.showError('Não consegui conectar: ' + msg);
    return;
  }

  if (!res.ok || !res.body) {
    if (res.status === 401) {
      // Sessão expirou — cai pro fallback demo (não perde dados)
      handle.close();
      fallbackToJo(args);
      return;
    }
    const data = await res.json().catch(() => ({}));
    handle.showError((data as { error?: string }).error ?? `Servidor respondeu ${res.status}`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  function processEvent(json: string): void {
    try {
      const ev = JSON.parse(json) as { type?: string; text?: string; message?: string; artifactId?: string | null };
      if (ev.type === 'chunk' && typeof ev.text === 'string') {
        ingestChunk(state, ev.text);
        if (!headerRendered && state.header) {
          headerRendered = true;
          handle.setHeader(state.header);
        }
        const visible = currentVisibleText(state);
        if (state.mode === 'structured' && state.markdownStart < 0) {
          // Ainda no preâmbulo do JSON — spinner segue
          handle.setSpinner('Validando seu pedido');
        } else if (visible.length > 0) {
          handle.setMarkdownStreaming(visible);
        }
      } else if (ev.type === 'error' && typeof ev.message === 'string') {
        handle.showError(ev.message);
      } else if (ev.type === 'done') {
        artifactId = typeof ev.artifactId === 'string' ? ev.artifactId : null;
      }
    } catch {
      /* ignore malformed */
    }
  }

  function flushEvents(): void {
    let idx;
    while ((idx = buf.indexOf('\n\n')) !== -1) {
      const evt = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 2);
      if (!evt.startsWith('data:')) continue;
      const json = evt.slice(5).trim();
      if (json) processEvent(json);
    }
  }

  while (!stopped) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    flushEvents();
  }
  buf += decoder.decode();
  flushEvents();

  if (stopped) return;

  // No done: parser completo decide o destino visual.
  const structured: JoStructuredResponse | null = parseJoStructured(state.raw);
  if (!structured) {
    // Fallback: mostra texto cru pq a Jô não devolveu JSON válido.
    handle.setMarkdownStreaming(currentVisibleText(state) || state.raw);
    return;
  }

  if (structured.type === 'devolucao') {
    handle.showDevolucao(structured, () => {
      // Refinar: volta pro wizard. Não recarrega — o user já está nele.
      // (overlay fechou; foco vai pro 1º textarea com ✗)
    });
  } else {
    persistDiagnosticContext(args.verb, structured);
    handle.showRelatorioComplete(structured, artifactId);
  }
}

export async function submitWizard(args: SubmitWizardArgs): Promise<void> {
  const useStructured = STRUCTURED_MODES.has(args.verb);
  const authed = useStructured ? await isAuthenticated() : false;

  if (useStructured && authed) {
    await streamStructured(args);
    return;
  }

  // Modos não-estruturados ou anônimo: comportamento legado (sessionStorage + /jo).
  // Pra logado em modo não-estruturado, mantém compat com /api/journey/artifact
  // (complete) — sem refactor enquanto o prompt não devolver JSON.
  if (!useStructured && (await isAuthenticated())) {
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
        // eslint-disable-next-line no-console
        console.warn('[wizard-submit] API respondeu', resp.status);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[wizard-submit] API falhou, caindo no fallback', e);
    }
  }

  fallbackToJo(args);
}
