// Helper reusável pra plugar uma palette de chips num textarea. Funciona tanto
// no wizard form (.astro) quanto no overlay de refinamento (TS injetado).
//
// Mecânica:
//  - Click no chip → se o texto exato já está no textarea (entre separadores
//    ` · ` ou nas bordas), remove (toggle off); senão concatena no fim.
//  - Textarea segue livre pra digitar — chips são atalhos, não controlam o estado.
//  - Estado visual "is-active" sincronizado com o conteúdo do textarea via input event.

import type { ChipPalette } from './chip-palettes';

const SEP = ' · ';
const STYLE_ID = 'alavanca-chip-style';

const CSS = `
.chip-palette { display: flex; flex-direction: column; gap: 14px; margin: 12px 0 6px; }
.chip-group { display: flex; flex-direction: column; gap: 8px; }
.chip-group-label { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.14em;
                    text-transform: uppercase; color: var(--fg-50); }
.chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { font-family: var(--sans); font-size: 12px; padding: 5px 11px; border-radius: 999px;
        border: 0.5px solid var(--fg-22); background: transparent; color: var(--fg-86);
        cursor: pointer; transition: border-color 180ms ease, background 180ms ease, color 180ms ease;
        line-height: 1.3; }
.chip:hover { border-color: var(--fg-50); color: var(--fg); }
.chip.is-active { border-color: var(--amber); background: rgba(217,119,6,0.14); color: var(--fg); }
.chip:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
.chip-hint { font-family: var(--sans); font-size: 12px; font-style: italic; color: var(--fg-50);
             margin-top: 2px; }
`;

function ensureChipStyle(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

function splitParts(text: string): string[] {
  return text
    .split(SEP)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function chipPresent(text: string, chip: string): boolean {
  return splitParts(text).includes(chip);
}

function toggleChipText(text: string, chip: string): string {
  const parts = splitParts(text);
  const idx = parts.indexOf(chip);
  if (idx >= 0) {
    parts.splice(idx, 1);
  } else {
    parts.push(chip);
  }
  return parts.join(SEP);
}

export interface AttachChipsOptions {
  container: HTMLElement;
  textarea: HTMLTextAreaElement;
  palette: ChipPalette;
  hint?: string; // texto opcional sob os chips (ex: "ou digite o seu próprio")
}

export function attachChipPalette(opts: AttachChipsOptions): void {
  ensureChipStyle();

  const { container, textarea, palette } = opts;
  const hint = opts.hint ?? 'ou digite livremente acima';

  container.innerHTML = '';
  container.classList.add('chip-palette');

  const allBtns: HTMLButtonElement[] = [];

  palette.groups.forEach((group) => {
    const groupEl = document.createElement('div');
    groupEl.className = 'chip-group';

    const labelEl = document.createElement('div');
    labelEl.className = 'chip-group-label';
    labelEl.textContent = group.label;
    groupEl.appendChild(labelEl);

    const row = document.createElement('div');
    row.className = 'chip-row';
    group.chips.forEach((chipText) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.dataset.chip = chipText;
      btn.textContent = chipText;
      btn.addEventListener('click', () => {
        textarea.value = toggleChipText(textarea.value, chipText);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        syncActive();
      });
      row.appendChild(btn);
      allBtns.push(btn);
    });
    groupEl.appendChild(row);
    container.appendChild(groupEl);
  });

  if (hint) {
    const hintEl = document.createElement('div');
    hintEl.className = 'chip-hint';
    hintEl.textContent = hint;
    container.appendChild(hintEl);
  }

  function syncActive(): void {
    const txt = textarea.value;
    for (const btn of allBtns) {
      const chip = btn.dataset.chip!;
      btn.classList.toggle('is-active', chipPresent(txt, chip));
    }
  }

  textarea.addEventListener('input', syncActive);
  syncActive();
}
