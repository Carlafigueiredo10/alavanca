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
.chip-intro { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.1em;
              color: var(--amber); margin-bottom: 2px; }
.chip-group { display: flex; flex-direction: column; gap: 8px; }
.chip-group-label { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.14em;
                    text-transform: uppercase; color: var(--fg-50); }
.chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { font-family: var(--sans); font-size: 12px; padding: 5px 11px 5px 9px; border-radius: 999px;
        border: 0.5px solid var(--fg-22); background: transparent; color: var(--fg-86);
        cursor: pointer; transition: border-color 180ms ease, background 180ms ease, color 180ms ease, opacity 180ms ease, transform 180ms ease;
        line-height: 1.3; display: inline-flex; align-items: center; gap: 5px; }
.chip::before { content: '+'; font-family: var(--mono); font-size: 11px; color: var(--fg-50);
                font-weight: 500; transition: color 180ms ease; }
.chip:hover { border-color: var(--fg-50); color: var(--fg); transform: translateY(-1px); }
.chip:hover::before { color: var(--amber); }
.chip.is-active { border-color: var(--amber); background: rgba(217,119,6,0.14); color: var(--fg); opacity: 1; }
.chip.is-active::before { content: '✓'; color: var(--amber); }
.chip:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
/* Coerência: chips fora da matriz ficam dimmed mas continuam clicáveis. */
.chip.is-incoherent { opacity: 0.35; border-style: dashed; }
.chip.is-incoherent:hover { opacity: 0.65; }
.chip.is-coherent { border-color: oklch(0.78 0.16 145 / 0.5); }
.chip-hint { font-family: var(--sans); font-size: 12px; font-style: italic; color: var(--fg-50);
             margin-top: 2px; }
.chip-free { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px;
             border: 0.5px solid var(--amber); border-radius: 8px;
             background: rgba(217,119,6,0.06); margin-bottom: 6px; }
.chip-free-label { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.14em;
                   text-transform: uppercase; color: var(--amber); }
.chip-free-input { font-family: var(--sans); font-size: 14px; color: var(--fg);
                   background: transparent; border: 0; border-bottom: 0.5px solid var(--fg-22);
                   padding: 6px 2px; outline: none; }
.chip-free-input:focus { border-bottom-color: var(--amber); }
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
  const isComposed = typeof palette.composer === 'function';
  const hint = opts.hint ?? (isComposed
    ? 'chips montam a frase automaticamente · pode editar à mão depois'
    : 'ou digite livremente acima');

  container.innerHTML = '';
  container.classList.add('chip-palette');

  // Linha introdutória pra reforçar que os chips são clicáveis. Carla
  // observou que sem essa pista o user fica olhando achando que é só label.
  const intro = document.createElement('div');
  intro.className = 'chip-intro';
  intro.textContent = isComposed
    ? '↓ Clique pra selecionar — múltipla escolha · chips montam a frase'
    : '↓ Clique pra selecionar — múltipla escolha';
  container.appendChild(intro);

  const allBtns: HTMLButtonElement[] = [];
  // Modo template: lista de chips ativos por grupo (multi-pick).
  // Composer recebe a lista por grupo + valores dos campos livres.
  const activeByGroup = new Map<string, string[]>();
  const freeValues = new Map<string, string>();
  if (isComposed) {
    palette.groups.forEach((g) => activeByGroup.set(g.label, []));
    palette.freeFields?.forEach((f) => freeValues.set(f.key, ''));
  }

  // Helper pra renderizar os campos livres (FreeField) — chamado DEPOIS dos
  // chips pra que o user primeiro componha com vocabulário e só no fim
  // nomeie o item específico (lógica narrativa: do tipo pro nominal).
  function renderFreeFields(): void {
    if (!isComposed || !palette.freeFields || palette.freeFields.length === 0) return;
    palette.freeFields.forEach((field) => {
      const wrap = document.createElement('div');
      wrap.className = 'chip-free';
      const lbl = document.createElement('label');
      lbl.className = 'chip-free-label';
      lbl.textContent = field.label;
      wrap.appendChild(lbl);
      const input = document.createElement('input');
      // type='month-year' usa o input nativo <input type="month"> que entrega
      // "YYYY-MM" — devolvemos o valor cru pro composer formatar pt-BR.
      input.type = field.type === 'month-year' ? 'month' : 'text';
      input.className = 'chip-free-input';
      input.placeholder = field.placeholder ?? '';
      input.addEventListener('input', () => {
        freeValues.set(field.key, input.value);
        textarea.value = palette.composer!(activeByGroup, freeValues);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      });
      wrap.appendChild(input);
      container.appendChild(wrap);
    });
  }

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
      btn.dataset.group = group.label;
      btn.textContent = chipText;
      btn.addEventListener('click', () => {
        if (isComposed) {
          // Multi-pick: toggle do chip dentro da lista do grupo.
          // Composer recebe Map<grupo, string[]> + Map<freeKey, value>.
          const cur = activeByGroup.get(group.label) ?? [];
          const idx = cur.indexOf(chipText);
          const next = idx >= 0
            ? cur.filter((_, i) => i !== idx)
            : [...cur, chipText];
          activeByGroup.set(group.label, next);
          textarea.value = palette.composer!(activeByGroup, freeValues);
        } else {
          // Modo concat: toggle no texto do textarea (separado por ` · `).
          textarea.value = toggleChipText(textarea.value, chipText);
        }
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

  // Campos livres no FINAL — depois dos chips e do hint, antes do botão
  // Continuar do wizard. Lógica narrativa: chips primeiro (vocabulário),
  // input nominal por último (preenchimento específico).
  renderFreeFields();

  function syncActive(): void {
    if (isComposed) {
      // Modo template: ativo = chip presente na lista do grupo (estado interno)
      for (const btn of allBtns) {
        const grp = btn.dataset.group!;
        const chip = btn.dataset.chip!;
        const list = activeByGroup.get(grp) ?? [];
        btn.classList.toggle('is-active', list.includes(chip));
      }
      // Aplica coerência visual: chips do grupo dependente ficam dimmed
      // se nenhum chip ativo do grupo "pai" os listar como compatíveis.
      if (palette.coherence) {
        for (const [depGroup, rule] of Object.entries(palette.coherence)) {
          const parentActive = activeByGroup.get(rule.dependsOn) ?? [];
          if (parentActive.length === 0) {
            // Sem seleção no pai → reset (todos neutros)
            for (const btn of allBtns) {
              if (btn.dataset.group === depGroup) {
                btn.classList.remove('is-incoherent', 'is-coherent');
              }
            }
            continue;
          }
          // União das listas coerentes pra cada chip ativo no pai
          const coherentSet = new Set<string>();
          for (const parentChip of parentActive) {
            const list = rule.map[parentChip] ?? [];
            list.forEach((c) => coherentSet.add(c));
          }
          for (const btn of allBtns) {
            if (btn.dataset.group !== depGroup) continue;
            const isActive = btn.classList.contains('is-active');
            const isCoherent = coherentSet.has(btn.dataset.chip!);
            // Não dim chips ativos (user já escolheu, respeita)
            btn.classList.toggle('is-incoherent', !isCoherent && !isActive);
            btn.classList.toggle('is-coherent', isCoherent && !isActive);
          }
        }
      }
    } else {
      // Modo concat: ativo = chip presente no textarea
      const txt = textarea.value;
      for (const btn of allBtns) {
        const chip = btn.dataset.chip!;
        btn.classList.toggle('is-active', chipPresent(txt, chip));
      }
    }
  }

  textarea.addEventListener('input', syncActive);
  syncActive();
}
