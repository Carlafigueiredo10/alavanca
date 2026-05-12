// Overlay full-screen client-side pra renderizar resposta estruturada da Jô
// durante streaming. Vive separado do JoChat pra não bagunçar o chat regular.
//
// Fluxo:
//  1. open() injeta CSS + DOM no body, retorna handle.
//  2. updateHeader(header) renderiza badges (chama assim que o streaming parser
//     extrai o cabeçalho — não espera o done).
//  3. updateMarkdown(text) atualiza o bubble com markdown digitando.
//  4. showDevolucao(d) substitui o bubble por checklist (input insuficiente).
//  5. showRelatorioComplete(r, artifactId) finaliza o overlay (botão CTA).
//  6. close() remove do DOM.

import type {
  JoDevolucao,
  JoRelatorio,
  JoRelatorioHeader,
} from './response-types';

const OVERLAY_ID = 'alavanca-structured-overlay';
const STYLE_ID = 'alavanca-structured-overlay-style';

const CSS = `
.aso { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: stretch; justify-content: center;
       background: oklch(0.10 0.010 95 / 0.92); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
       overflow-y: auto; padding: 40px 24px; }
.aso__card { position: relative; max-width: 880px; width: 100%; margin: auto; padding: 36px 36px 28px;
             border: 0.5px solid var(--fg-22); border-radius: 14px; background: oklch(0.10 0.010 95 / 0.85);
             box-shadow: 0 40px 120px -30px oklch(0 0 0 / 0.6); }
.aso__close { position: absolute; top: 18px; right: 18px; background: transparent; border: 0; cursor: pointer;
              color: var(--fg-65); font-family: var(--mono); font-size: 12px; letter-spacing: 0.1em; padding: 6px 10px; }
.aso__close:hover { color: var(--signal); }
.aso__id { font-family: var(--mono); font-size: 11px; letter-spacing: 0.18em; color: var(--fg-50); margin-bottom: 16px; }
.aso__title { font-family: var(--serif); font-weight: 500; font-size: clamp(28px, 4vw, 38px);
              line-height: 1.1; letter-spacing: -0.018em; margin-bottom: 22px; }
.aso__badges { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; min-height: 28px; }
.aso__badge { font-family: var(--mono); font-size: 11px; letter-spacing: 0.08em; padding: 5px 10px;
              border-radius: 999px; border: 0.5px solid var(--fg-22); color: var(--fg-86); background: rgba(245,242,235,0.04); }
.aso__badge--go      { color: var(--bg); background: oklch(0.78 0.16 145); border-color: oklch(0.78 0.16 145); }
.aso__badge--mitig   { color: var(--bg); background: var(--signal); border-color: var(--signal); }
.aso__badge--nogo    { color: var(--bg); background: oklch(0.62 0.20 25); border-color: oklch(0.62 0.20 25); }
.aso__badge--tag     { color: var(--signal); border-color: var(--signal); background: rgba(217,119,6,0.08); }
.aso__badge--route   { color: var(--fg-86); border-color: var(--fg-22); }
.aso__bubble { font-family: var(--sans); font-size: 14.5px; line-height: 1.7; color: var(--fg-86);
               padding: 22px 24px; border: 0.5px solid var(--fg-14); border-radius: 10px;
               background: rgba(245,242,235,0.03); border-left: 1.5px solid var(--amber);
               white-space: pre-wrap; word-break: break-word; min-height: 80px; }
.aso__bubble strong { color: var(--fg); font-weight: 600; }
.aso__bubble em { font-style: italic; color: var(--fg); }
.aso__spinner { display: inline-flex; align-items: center; gap: 10px; color: var(--fg-65);
                font-family: var(--mono); font-size: 12px; letter-spacing: 0.06em; }
.aso__spinner::before { content: ''; width: 10px; height: 10px; border-radius: 50%; background: var(--signal);
                        animation: aso-pulse 1.2s ease-in-out infinite; }
@keyframes aso-pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
.aso__cursor { display: inline-block; width: 6px; height: 14px; background: var(--amber);
               margin-left: 2px; vertical-align: text-bottom; animation: aso-blink 1s steps(2) infinite; }
@keyframes aso-blink { 50% { opacity: 0; } }
.aso__checklist { display: flex; flex-direction: column; gap: 10px; margin: 0; padding: 0; list-style: none; }
.aso__check-item { display: flex; gap: 12px; align-items: flex-start; padding: 12px 14px; border: 0.5px solid var(--fg-14);
                   border-radius: 8px; background: rgba(245,242,235,0.02); }
.aso__check-ok   { color: oklch(0.78 0.16 145); font-family: var(--mono); font-size: 14px; flex: 0 0 auto; line-height: 1.5; }
.aso__check-fail { color: oklch(0.72 0.18 25); font-family: var(--mono); font-size: 14px; flex: 0 0 auto; line-height: 1.5; }
.aso__check-text { font-family: var(--sans); font-size: 14px; color: var(--fg); line-height: 1.5; }
.aso__check-hint { display: block; font-family: var(--sans); font-size: 13px; color: var(--fg-65);
                   font-style: italic; margin-top: 4px; }
.aso__msg { font-family: var(--serif); font-style: italic; font-size: 17px; line-height: 1.5;
            color: var(--fg-86); margin-bottom: 18px; }
.aso__next { font-family: var(--sans); font-size: 13.5px; color: var(--fg-86); margin-top: 18px; }
.aso__actions { display: flex; gap: 12px; margin-top: 28px; flex-wrap: wrap; }
.aso__btn { display: inline-flex; align-items: center; gap: 8px; font-family: var(--sans); font-size: 13px; font-weight: 600;
            padding: 10px 18px; border-radius: 999px; border: 0.5px solid var(--fg-22); background: transparent;
            color: var(--fg); cursor: pointer; text-decoration: none; transition: border-color 200ms ease, background 200ms ease; }
.aso__btn:hover { border-color: var(--amber); }
.aso__btn--primary { background: var(--amber); border-color: var(--amber); color: var(--bg); }
.aso__btn--primary:hover { filter: brightness(1.08); }
.aso__error { padding: 14px 16px; border: 0.5px solid rgba(255,100,100,0.4); border-radius: 8px;
              background: rgba(255,100,100,0.05); color: var(--fg-86); font-family: var(--sans); font-size: 13.5px; }
`;

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

export interface OverlayHandle {
  root: HTMLDivElement;
  badges: HTMLDivElement;
  bubble: HTMLDivElement;
  actions: HTMLDivElement;
  close: () => void;
  setSpinner: (text: string) => void;
  setMarkdownStreaming: (text: string) => void;
  setHeader: (header: JoRelatorioHeader) => void;
  showDevolucao: (d: JoDevolucao, onRefine: () => void) => void;
  showRelatorioComplete: (r: JoRelatorio, artifactId: string | null) => void;
  showError: (message: string) => void;
}

const ROUTE_LABEL: Record<string, string> = {
  mapear: 'Mapear', estruturar: 'Estruturar', formalizar: 'Formalizar',
  construir: 'Construir', avaliar: 'Avaliar', manter: 'Manter',
};

function badgeForGoNoGo(g: 'GO' | 'GO_MITIGATION' | 'NO_GO'): HTMLSpanElement {
  const el = document.createElement('span');
  el.className = 'aso__badge ' + (
    g === 'GO' ? 'aso__badge--go' :
    g === 'GO_MITIGATION' ? 'aso__badge--mitig' :
    'aso__badge--nogo'
  );
  el.textContent = g === 'GO' ? 'GO' : g === 'GO_MITIGATION' ? 'GO com mitigação' : 'NO-GO';
  return el;
}

// Markdown muito básico — só negrito **x**, itálico *x* e quebras de parágrafo.
// Não rendemos listas/headers no streaming pra não complicar — Carla pode pedir
// upgrade pra um lib leve se a saída do prompt usar mais elementos.
function renderInlineMarkdown(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
}

export function open(verb: string): OverlayHandle {
  ensureStyle();

  // Se já tem overlay aberto, remove pra reabrir limpo
  const existing = document.getElementById(OVERLAY_ID);
  if (existing) existing.remove();

  const root = document.createElement('div');
  root.id = OVERLAY_ID;
  root.className = 'aso';
  root.innerHTML = `
    <div class="aso__card">
      <button class="aso__close" data-role="close" aria-label="Fechar">✕ fechar</button>
      <div class="aso__id">↳ Jô · ${(ROUTE_LABEL[verb] ?? verb).toString()}</div>
      <h2 class="aso__title">Compondo a resposta…</h2>
      <div class="aso__badges" data-role="badges"></div>
      <div class="aso__bubble" data-role="bubble">
        <span class="aso__spinner" data-role="spinner">Lendo seu pedido</span>
      </div>
      <div class="aso__actions" data-role="actions"></div>
    </div>
  `;
  document.body.appendChild(root);

  const badges = root.querySelector('[data-role="badges"]') as HTMLDivElement;
  const bubble = root.querySelector('[data-role="bubble"]') as HTMLDivElement;
  const actions = root.querySelector('[data-role="actions"]') as HTMLDivElement;
  const closeBtn = root.querySelector('[data-role="close"]') as HTMLButtonElement;

  function close(): void {
    root.remove();
  }
  closeBtn.addEventListener('click', close);

  function setSpinner(text: string): void {
    bubble.innerHTML = `<span class="aso__spinner">${text}</span>`;
  }

  function setMarkdownStreaming(text: string): void {
    bubble.innerHTML = renderInlineMarkdown(text) + '<span class="aso__cursor"></span>';
  }

  function setHeader(header: JoRelatorioHeader): void {
    badges.innerHTML = '';
    badges.appendChild(badgeForGoNoGo(header.goNoGo));
    for (const tag of header.diagnostic_tags) {
      const el = document.createElement('span');
      el.className = 'aso__badge aso__badge--tag';
      el.textContent = tag;
      badges.appendChild(el);
    }
    if (header.route_order.length > 0) {
      const el = document.createElement('span');
      el.className = 'aso__badge aso__badge--route';
      el.textContent = '→ ' + header.route_order.map((v) => ROUTE_LABEL[v] ?? v).join(' · ');
      badges.appendChild(el);
    }
  }

  function showDevolucao(d: JoDevolucao, onRefine: () => void): void {
    const title = root.querySelector('.aso__title') as HTMLElement;
    title.textContent = 'Vamos refinar.';

    const parts: string[] = [];
    if (d.message) {
      parts.push(`<p class="aso__msg">${renderInlineMarkdown(d.message)}</p>`);
    }
    parts.push('<ul class="aso__checklist">');
    for (const item of d.checklist) {
      const symbol = item.ok
        ? '<span class="aso__check-ok">✓</span>'
        : '<span class="aso__check-fail">✗</span>';
      const hint = item.hint && !item.ok
        ? `<span class="aso__check-hint">${renderInlineMarkdown(item.hint)}</span>`
        : '';
      parts.push(
        `<li class="aso__check-item">${symbol}<span class="aso__check-text">${renderInlineMarkdown(item.label)}${hint}</span></li>`,
      );
    }
    parts.push('</ul>');
    if (d.next) {
      parts.push(`<p class="aso__next">${renderInlineMarkdown(d.next)}</p>`);
    }
    bubble.innerHTML = parts.join('\n');

    actions.innerHTML = '';
    const refineBtn = document.createElement('button');
    refineBtn.className = 'aso__btn aso__btn--primary';
    refineBtn.type = 'button';
    refineBtn.textContent = 'Refinar respostas';
    refineBtn.addEventListener('click', () => {
      close();
      onRefine();
    });
    actions.appendChild(refineBtn);
  }

  function showRelatorioComplete(r: JoRelatorio, artifactId: string | null): void {
    const title = root.querySelector('.aso__title') as HTMLElement;
    title.textContent = 'Relatório de Diagnóstico';

    setHeader(r);
    bubble.innerHTML = renderInlineMarkdown(r.markdown);

    actions.innerHTML = '';
    if (artifactId) {
      const cta = document.createElement('a');
      cta.className = 'aso__btn aso__btn--primary';
      cta.href = '/minha-jornada';
      cta.textContent = 'Ver no painel →';
      actions.appendChild(cta);
    }
    const joBtn = document.createElement('a');
    joBtn.className = 'aso__btn';
    joBtn.href = '/jo';
    joBtn.textContent = 'Conversar com a Jô';
    actions.appendChild(joBtn);
  }

  function showError(message: string): void {
    const title = root.querySelector('.aso__title') as HTMLElement;
    title.textContent = 'Não consegui processar.';
    bubble.innerHTML = `<div class="aso__error">${renderInlineMarkdown(message)}</div>`;
    actions.innerHTML = '';
    const retryBtn = document.createElement('button');
    retryBtn.className = 'aso__btn';
    retryBtn.type = 'button';
    retryBtn.textContent = 'Fechar';
    retryBtn.addEventListener('click', close);
    actions.appendChild(retryBtn);
  }

  return {
    root, badges, bubble, actions,
    close, setSpinner, setMarkdownStreaming, setHeader,
    showDevolucao, showRelatorioComplete, showError,
  };
}
