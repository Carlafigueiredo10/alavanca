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
  JoPlan,
  JoSection,
} from './response-types';
import { attachChipPalette } from '../wizard/chips';
import type { ChipPalette } from '../wizard/chip-palettes';

const OVERLAY_ID = 'alavanca-structured-overlay';
const STYLE_ID = 'alavanca-structured-overlay-style';

const CSS = `
.aso { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center;
       background: oklch(0.10 0.010 95 / 0.92); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
       padding: 40px 24px; }
.aso__card { position: relative; max-width: 880px; width: 100%; max-height: 100%;
             display: flex; flex-direction: column;
             border: 0.5px solid var(--fg-22); border-radius: 14px; background: oklch(0.10 0.010 95 / 0.85);
             box-shadow: 0 40px 120px -30px oklch(0 0 0 / 0.6); overflow: hidden; }
.aso__card-head { padding: 36px 36px 0; flex-shrink: 0; }
.aso__card-body { padding: 0 36px 12px; flex: 1; overflow-y: auto; min-height: 0; }
.aso__card-foot { padding: 16px 36px 20px; flex-shrink: 0; border-top: 0.5px solid var(--fg-14);
                  background: oklch(0.10 0.010 95 / 0.95); }
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
.aso__actions { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.aso__btn { display: inline-flex; align-items: center; gap: 8px; font-family: var(--sans); font-size: 13px; font-weight: 600;
            padding: 10px 18px; border-radius: 999px; border: 0.5px solid var(--fg-22); background: transparent;
            color: var(--fg); cursor: pointer; text-decoration: none; transition: border-color 200ms ease, background 200ms ease; }
.aso__btn:hover { border-color: var(--amber); }
.aso__btn--primary { background: var(--amber); border-color: var(--amber); color: var(--bg); }
.aso__btn--primary:hover { filter: brightness(1.08); }
.aso__error { padding: 14px 16px; border: 0.5px solid rgba(255,100,100,0.4); border-radius: 8px;
              background: rgba(255,100,100,0.05); color: var(--fg-86); font-family: var(--sans); font-size: 13.5px; }
.aso__refine-field { display: flex; flex-direction: column; gap: 8px; padding: 14px 16px;
                     border: 0.5px solid var(--fg-14); border-radius: 8px; background: rgba(245,242,235,0.02); }
.aso__refine-field--fail { border-left: 1.5px solid oklch(0.72 0.18 25); }
.aso__refine-field--ok   { border-left: 1.5px solid oklch(0.78 0.16 145); }
.aso__refine-head { display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap; }
.aso__refine-symbol { font-family: var(--mono); font-size: 13px; flex: 0 0 auto; }
.aso__refine-symbol--ok { color: oklch(0.78 0.16 145); }
.aso__refine-symbol--fail { color: oklch(0.72 0.18 25); }
.aso__refine-label { font-family: var(--sans); font-size: 14px; color: var(--fg); font-weight: 500; }
.aso__refine-hint { font-family: var(--sans); font-size: 13px; color: var(--fg-65); font-style: italic; line-height: 1.5; }
.aso__refine-textarea { width: 100%; min-height: 92px; padding: 10px 12px; border: 0.5px solid var(--fg-22);
                        border-radius: 6px; background: rgba(0,0,0,0.25); color: var(--fg); font-family: var(--sans);
                        font-size: 14px; line-height: 1.5; resize: vertical; box-sizing: border-box; }
.aso__refine-textarea:focus { outline: 2px solid var(--amber); outline-offset: 1px; border-color: var(--amber); }
.aso__btn:disabled { opacity: 0.5; cursor: not-allowed; }
.aso__refine-compact { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 14px;
                       background: transparent; border: 0; cursor: pointer; text-align: left; color: var(--fg-86);
                       font-family: var(--sans); font-size: 14px; transition: color 200ms ease; }
.aso__refine-compact:hover { color: var(--fg); }
.aso__refine-compact .aso__refine-label { flex: 1; }
.aso__refine-edit { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.12em;
                    color: var(--fg-45); transition: color 200ms ease; }
.aso__refine-compact:hover .aso__refine-edit { color: var(--amber); }
.aso__refine-compact.is-open .aso__refine-edit { color: var(--amber); }
.aso__refine-field--collapsed { padding: 0; }
.aso__refine-expanded { padding: 10px 14px 14px; display: flex; flex-direction: column; gap: 10px; }
.aso__plan-summary { font-family: var(--serif); font-style: italic; font-size: 15.5px;
                     line-height: 1.45; color: var(--fg); margin: 0 0 18px; max-width: 640px; }
.aso__section-card { border: 0.5px solid var(--fg-14); border-radius: 10px; margin-bottom: 12px;
                     overflow: hidden; transition: border-color 200ms ease; }
.aso__section-card[data-status="streaming"] { border-color: var(--amber); }
.aso__section-card[data-status="done"] { border-color: rgba(120,180,140,0.4); }
.aso__section-card[data-status="partial"] { border-color: rgba(217,119,6,0.5); }
.aso__section-card[data-status="error"] { border-color: rgba(255,100,100,0.4); }
.aso__section-head { display: flex; align-items: center; gap: 12px; padding: 12px 16px;
                     background: rgba(245,242,235,0.03); }
.aso__section-status { font-family: var(--mono); font-size: 14px; flex: 0 0 auto;
                       width: 18px; text-align: center; }
.aso__section-status--pending { color: var(--fg-45); }
.aso__section-status--streaming { color: var(--amber); animation: aso-pulse 1.2s ease-in-out infinite; }
.aso__section-status--done { color: oklch(0.78 0.16 145); }
.aso__section-status--partial { color: var(--amber); }
.aso__section-status--error { color: oklch(0.72 0.18 25); }
.aso__section-title { font-family: var(--sans); font-size: 14px; font-weight: 500; color: var(--fg); flex: 1; }
.aso__section-action { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.12em;
                       color: var(--fg-50); background: transparent; border: 0; cursor: pointer;
                       padding: 4px 8px; transition: color 200ms ease; }
.aso__section-action:hover { color: var(--amber); }
.aso__section-body { padding: 12px 16px 14px; font-family: var(--sans); font-size: 13.5px;
                     line-height: 1.65; color: var(--fg-86); white-space: pre-wrap; word-break: break-word; }
.aso__section-body strong { color: var(--fg); font-weight: 600; }
.aso__section-body em { font-family: var(--serif); font-style: italic; color: var(--fg); }
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
  // refineCtx (opcional): habilita edição inline + Reprocessar dentro do overlay.
  //  - currentValues: alinhado por índice ao d.checklist (i-ésimo valor = i-ésimo item)
  //  - onResubmit: chamado com (valores, opts). opts.force=true → "Gerar mesmo assim"
  //  - fieldLabels: rótulos a usar no lugar dos labels do checklist
  //  - fieldPalettes: palettes de chips por campo (alinhado por índice)
  // Sem refineCtx: comportamento legado (botão "Fechar").
  showDevolucao: (
    d: JoDevolucao,
    refineCtx?: {
      currentValues: string[];
      onResubmit: (updated: string[], opts?: { force?: boolean }) => void | Promise<void>;
      fieldLabels?: string[];
      fieldPalettes?: (ChipPalette | null)[];
    } | null,
  ) => void;
  showRelatorioComplete: (r: JoRelatorio, artifactId: string | null) => void;
  // ── Sections-first (JoPlan) ──
  // showPlan inicializa cards (todas pending). setSectionMarkdown atualiza
  // o corpo durante streaming. setSectionStatus muda o ícone do head.
  // showPlanComplete finaliza com CTAs.
  showPlan: (plan: JoPlan) => void;
  setSectionMarkdown: (sectionId: string, markdown: string) => void;
  setSectionStatus: (sectionId: string, status: JoSection['status']) => void;
  showPlanComplete: (artifactId: string | null) => void;
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
      <div class="aso__card-head">
        <div class="aso__id">↳ Jô · ${(ROUTE_LABEL[verb] ?? verb).toString()}</div>
        <h2 class="aso__title">Compondo a resposta…</h2>
        <div class="aso__badges" data-role="badges"></div>
      </div>
      <div class="aso__card-body">
        <div class="aso__bubble" data-role="bubble">
          <span class="aso__spinner" data-role="spinner">Lendo seu pedido</span>
        </div>
      </div>
      <div class="aso__card-foot">
        <div class="aso__actions" data-role="actions"></div>
      </div>
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

  function showDevolucao(
    d: JoDevolucao,
    refineCtx?: {
      currentValues: string[];
      onResubmit: (updated: string[], opts?: { force?: boolean }) => void | Promise<void>;
      fieldLabels?: string[];
      fieldPalettes?: (ChipPalette | null)[];
    } | null,
  ): void {
    const title = root.querySelector('.aso__title') as HTMLElement;
    title.textContent = 'Vamos refinar.';

    const canRefine = !!refineCtx && refineCtx.currentValues.length > 0;

    // Sem refineCtx: comportamento legado (só checklist + botão Refinar/Fechar)
    if (!canRefine) {
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
      const closeBtnAction = document.createElement('button');
      closeBtnAction.className = 'aso__btn';
      closeBtnAction.type = 'button';
      closeBtnAction.textContent = 'Fechar';
      closeBtnAction.addEventListener('click', close);
      actions.appendChild(closeBtnAction);
      return;
    }

    // Modo refine: render textareas inline, alinhadas por índice ao checklist.
    // Se o checklist tem N itens e currentValues tem M, percorre min(N, M).
    const ctx = refineCtx!;
    const labels = ctx.fieldLabels ?? [];
    const n = Math.min(d.checklist.length, ctx.currentValues.length);

    bubble.innerHTML = '';
    if (d.message) {
      const msg = document.createElement('p');
      msg.className = 'aso__msg';
      msg.innerHTML = renderInlineMarkdown(d.message);
      bubble.appendChild(msg);
    }

    const fieldsWrap = document.createElement('div');
    fieldsWrap.style.display = 'flex';
    fieldsWrap.style.flexDirection = 'column';
    fieldsWrap.style.gap = '12px';

    // Estratégia anti-fadiga: ✓ entram colapsados (chip pequeno só com o label).
    // ✗ entram expandidos (textarea + chips + hint). Click no ✓ expande pra
    // permitir edição opcional. Auto-scrolla ao 1º ✗ depois do render.
    const textareas: HTMLTextAreaElement[] = [];
    const firstFailEls: HTMLElement[] = [];

    for (let i = 0; i < n; i++) {
      const item = d.checklist[i];
      const fieldEl = document.createElement('div');
      fieldEl.className = 'aso__refine-field ' + (item.ok ? 'aso__refine-field--ok' : 'aso__refine-field--fail');

      // ── Sempre cria a textarea (pra ✓ ela fica oculta até clicar pra expandir) ──
      const ta = document.createElement('textarea');
      ta.className = 'aso__refine-textarea';
      ta.value = ctx.currentValues[i] ?? '';
      ta.rows = 4;
      textareas.push(ta);

      if (item.ok) {
        // ── ✓ colapsado: linha compacta clicável ──
        fieldEl.classList.add('aso__refine-field--collapsed');

        const compact = document.createElement('button');
        compact.type = 'button';
        compact.className = 'aso__refine-compact';
        compact.innerHTML =
          '<span class="aso__refine-symbol aso__refine-symbol--ok">✓</span>' +
          `<span class="aso__refine-label">${(labels[i] ?? item.label)}</span>` +
          '<span class="aso__refine-edit">editar ↘</span>';
        fieldEl.appendChild(compact);

        // Conteúdo escondido (revelado no click)
        const expanded = document.createElement('div');
        expanded.className = 'aso__refine-expanded';
        expanded.style.display = 'none';
        expanded.appendChild(ta);

        const palette = ctx.fieldPalettes?.[i];
        if (palette) {
          const chipBox = document.createElement('div');
          expanded.appendChild(chipBox);
          attachChipPalette({ container: chipBox, textarea: ta, palette });
        }
        fieldEl.appendChild(expanded);

        compact.addEventListener('click', () => {
          const showing = expanded.style.display !== 'none';
          expanded.style.display = showing ? 'none' : 'block';
          compact.classList.toggle('is-open', !showing);
          if (!showing) {
            ta.focus();
          }
        });
      } else {
        // ── ✗ expandido: head + hint + textarea + chips ──
        const head = document.createElement('div');
        head.className = 'aso__refine-head';
        const sym = document.createElement('span');
        sym.className = 'aso__refine-symbol aso__refine-symbol--fail';
        sym.textContent = '✗';
        head.appendChild(sym);
        const lbl = document.createElement('span');
        lbl.className = 'aso__refine-label';
        lbl.textContent = labels[i] ?? item.label;
        head.appendChild(lbl);
        fieldEl.appendChild(head);

        if (item.hint) {
          const hintEl = document.createElement('div');
          hintEl.className = 'aso__refine-hint';
          hintEl.innerHTML = renderInlineMarkdown(item.hint);
          fieldEl.appendChild(hintEl);
        }

        fieldEl.appendChild(ta);

        const palette = ctx.fieldPalettes?.[i];
        if (palette) {
          const chipBox = document.createElement('div');
          fieldEl.appendChild(chipBox);
          attachChipPalette({ container: chipBox, textarea: ta, palette });
        }

        if (firstFailEls.length === 0) firstFailEls.push(fieldEl);
      }

      fieldsWrap.appendChild(fieldEl);
    }
    bubble.appendChild(fieldsWrap);

    // Auto-scroll ao 1º ✗ pra economizar scroll manual.
    if (firstFailEls.length > 0) {
      setTimeout(() => {
        firstFailEls[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }

    if (d.next) {
      const next = document.createElement('p');
      next.className = 'aso__next';
      next.innerHTML = renderInlineMarkdown(d.next);
      bubble.appendChild(next);
    }

    actions.innerHTML = '';
    const resubmitBtn = document.createElement('button');
    resubmitBtn.className = 'aso__btn aso__btn--primary';
    resubmitBtn.type = 'button';
    resubmitBtn.textContent = 'Reprocessar';
    resubmitBtn.addEventListener('click', async () => {
      const updated = textareas.map((t) => t.value.trim());
      const failedEmpty = d.checklist
        .slice(0, n)
        .map((it, i) => (!it.ok && updated[i].length < 12 ? i : -1))
        .filter((i) => i >= 0);
      if (failedEmpty.length > 0) {
        textareas[failedEmpty[0]].focus();
        return;
      }
      resubmitBtn.disabled = true;
      forceBtn.disabled = true;
      resubmitBtn.textContent = 'Reprocessando…';
      try {
        await ctx.onResubmit(updated);
      } catch {
        resubmitBtn.disabled = false;
        forceBtn.disabled = false;
        resubmitBtn.textContent = 'Reprocessar';
      }
    });
    actions.appendChild(resubmitBtn);

    // "Gerar mesmo assim": pula a devolução, força a Jô a produzir o doc com
    // o que tem (com caveat de input parcial). Carla pediu pra evitar loop
    // infinito quando ela está convicta que o input é suficiente.
    const forceBtn = document.createElement('button');
    forceBtn.className = 'aso__btn';
    forceBtn.type = 'button';
    forceBtn.textContent = 'Gerar mesmo assim ↑';
    forceBtn.title = 'Pula validação e gera com input atual (marcado como parcial)';
    forceBtn.addEventListener('click', async () => {
      const updated = textareas.map((t) => t.value.trim());
      forceBtn.disabled = true;
      resubmitBtn.disabled = true;
      forceBtn.textContent = 'Gerando…';
      try {
        await ctx.onResubmit(updated, { force: true });
      } catch {
        forceBtn.disabled = false;
        resubmitBtn.disabled = false;
        forceBtn.textContent = 'Gerar mesmo assim ↑';
      }
    });
    actions.appendChild(forceBtn);
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

  // ── Sections-first (JoPlan) ──
  // Mapa de section.id → elementos DOM, mantido entre showPlan / set* / complete.
  // Sobrevive porque o overlay não recria o DOM entre essas chamadas.
  const sectionEls = new Map<string, {
    card: HTMLDivElement;
    status: HTMLSpanElement;
    body: HTMLDivElement;
  }>();

  function showPlan(plan: JoPlan): void {
    const titleEl = root.querySelector('.aso__title') as HTMLElement;
    titleEl.textContent = plan.title || 'Plano';

    // Summary no lugar dos badges (mantém o slot pra usar visualmente).
    badges.innerHTML = '';
    if (plan.summary) {
      const summary = document.createElement('p');
      summary.className = 'aso__plan-summary';
      summary.textContent = plan.summary;
      badges.appendChild(summary);
    }

    bubble.innerHTML = '';
    sectionEls.clear();
    for (const section of plan.sections) {
      const card = document.createElement('div');
      card.className = 'aso__section-card';
      card.dataset.sectionId = section.id;
      card.dataset.status = section.status;

      const head = document.createElement('div');
      head.className = 'aso__section-head';

      const status = document.createElement('span');
      status.className = 'aso__section-status aso__section-status--' + section.status;
      status.textContent = symbolForStatus(section.status);
      head.appendChild(status);

      const titleSpan = document.createElement('span');
      titleSpan.className = 'aso__section-title';
      titleSpan.textContent = section.title;
      head.appendChild(titleSpan);

      card.appendChild(head);

      const body = document.createElement('div');
      body.className = 'aso__section-body';
      body.style.display = section.markdown ? 'block' : 'none';
      if (section.markdown) body.innerHTML = renderInlineMarkdown(section.markdown);
      card.appendChild(body);

      bubble.appendChild(card);
      sectionEls.set(section.id, { card, status, body });
    }

    // Limpa actions — botões finais aparecem só em showPlanComplete.
    actions.innerHTML = '';
  }

  function setSectionMarkdown(sectionId: string, markdown: string): void {
    const el = sectionEls.get(sectionId);
    if (!el) return;
    el.body.style.display = 'block';
    el.body.innerHTML = renderInlineMarkdown(markdown) + '<span class="aso__cursor"></span>';
  }

  function setSectionStatus(sectionId: string, status: JoSection['status']): void {
    const el = sectionEls.get(sectionId);
    if (!el) return;
    el.card.dataset.status = status;
    el.status.textContent = symbolForStatus(status);
    el.status.className = 'aso__section-status aso__section-status--' + status;
    // Remove cursor quando termina
    if (status !== 'streaming') {
      const cursor = el.body.querySelector('.aso__cursor');
      if (cursor) cursor.remove();
    }
    // Scroll suave pro card que entrou em streaming
    if (status === 'streaming') {
      setTimeout(() => el.card.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
    }
  }

  function showPlanComplete(artifactId: string | null): void {
    actions.innerHTML = '';
    if (artifactId) {
      const cta = document.createElement('a');
      cta.className = 'aso__btn aso__btn--primary';
      cta.href = `/jornada/${artifactId}`;
      cta.textContent = 'Ver no painel →';
      actions.appendChild(cta);

      const pdf = document.createElement('a');
      pdf.className = 'aso__btn';
      pdf.href = `/jornada/${artifactId}/imprimir?auto=1`;
      pdf.target = '_blank';
      pdf.rel = 'noopener';
      pdf.textContent = 'Baixar PDF ↗';
      actions.appendChild(pdf);
    }
    const closeBtn = document.createElement('button');
    closeBtn.className = 'aso__btn';
    closeBtn.type = 'button';
    closeBtn.textContent = 'Fechar';
    closeBtn.addEventListener('click', close);
    actions.appendChild(closeBtn);
  }

  return {
    root, badges, bubble, actions,
    close, setSpinner, setMarkdownStreaming, setHeader,
    showDevolucao, showRelatorioComplete,
    showPlan, setSectionMarkdown, setSectionStatus, showPlanComplete,
    showError,
  };
}

function symbolForStatus(status: JoSection['status']): string {
  switch (status) {
    case 'pending':   return '○';
    case 'streaming': return '◐';
    case 'done':      return '✓';
    case 'partial':   return '⚠';
    case 'error':     return '✕';
    default:          return '○';
  }
}
