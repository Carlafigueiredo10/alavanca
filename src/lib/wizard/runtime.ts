// Runtime compartilhado dos wizards dos 6 verbos. Cada página de wizard
// chama `attachWizardRuntime(cfg)` no seu <script> e ganha automaticamente:
//
//  - Navegação entre steps (textareas, stepper, botões back/next/generate)
//  - Chip palettes por step (atalhos de itens recorrentes)
//  - Geração → /api/journey/generate (com refine context e replacesArtifactId)
//  - Edição inline na devolução (Reprocessar dentro do overlay)
//  - Pré-fill via ?from=<artifactId> (edita peça anterior → cria nova versão)
//  - Restauração de state via localStorage (volta do login)
//  - Banner "Editando peça anterior" quando aplicável
//
// Cada wizard só precisa fornecer: verb, número de steps, rótulos dos campos,
// palettes opcionais, chave de localStorage, buildPrompt (fallback demo), e o
// rótulo do botão de geração. Tudo o que muda entre verbos vira config.

import { submitWizard, type SubmitWizardArgs, type WizardVerb } from '../journey/wizard-submit';
import { attachChipPalette } from './chips';
import type { ChipPalette } from './chip-palettes';

export interface WizardRuntimeConfig {
  verb: WizardVerb;
  /** Quantidade de telas (steps) — bate com os data-step="N" da página. */
  stepCount: number;
  /** Rótulos por campo (mostrados no overlay de refinamento, alinhados aos steps). */
  fieldLabels: string[];
  /** Palettes de chips por step (mesma ordem). undefined/null em algum índice = sem chips. */
  palettes?: (ChipPalette | null | undefined)[];
  /** Chave de localStorage para restoreState (volta do login com state preservado). */
  stateKey: string;
  /** Constrói o fallbackText (modo demo / não-estruturado / anônimo). */
  buildPrompt: (values: string[]) => string;
  /** fallbackSource (passado pro submitWizard pra rastreabilidade). */
  fallbackSource: string;
  /** Tamanho mínimo aceito por campo (default 12 chars trimmed). */
  minLength?: number;
  /** Texto do botão final (default 'Gerar →'). */
  generateLabel?: string;
  /** Mensagem do botão durante o submit (default 'Encaminhando à Jô…'). */
  submittingLabel?: string;
}

export function attachWizardRuntime(cfg: WizardRuntimeConfig): void {
  const minLen = cfg.minLength ?? 12;
  const submittingLabel = cfg.submittingLabel ?? 'Encaminhando à Jô…';
  const N = cfg.stepCount;
  const stepNums = Array.from({ length: N }, (_, i) => i + 1);
  const answers: string[] = Array(N).fill('');
  let editingArtifactId: string | null = null;

  const steps = document.querySelectorAll<HTMLDivElement>('.wizard-step');
  const stepperItems = document.querySelectorAll<HTMLDivElement>('.stepper .step');

  function showStep(n: number): void {
    steps.forEach((el) => {
      const num = Number(el.dataset.step);
      const isActive = num === n;
      el.classList.toggle('is-active', isActive);
      el.classList.remove('is-visible');
      if (isActive) {
        requestAnimationFrame(() => el.classList.add('is-visible'));
        const input = el.querySelector<HTMLTextAreaElement>('.step-input');
        setTimeout(() => input?.focus(), 80);
      }
    });
    stepperItems.forEach((el) => {
      const num = Number(el.dataset.step);
      el.classList.toggle('is-active', num === n);
      el.classList.toggle('is-done', num < n);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Bind inputs + chip palettes + navegação
  stepNums.forEach((n) => {
    const input = document.querySelector<HTMLTextAreaElement>(`[data-step-input="${n}"]`);
    if (!input) return;
    const counter = document.querySelector<HTMLSpanElement>(`[data-step-counter="${n}"]`);
    const chipContainer = document.querySelector<HTMLDivElement>(`[data-chip-palette="${n}"]`);
    const palette = cfg.palettes?.[n - 1];
    if (chipContainer && palette) {
      attachChipPalette({ container: chipContainer, textarea: input, palette });
    }

    const nextBtn =
      document.querySelector<HTMLButtonElement>(`[data-step-next="${n}"]`) ||
      (n === N ? document.querySelector<HTMLButtonElement>('[data-generate]') : null);

    function refresh(): void {
      const val = input!.value.trim();
      answers[n - 1] = val;
      if (counter) counter.textContent = String(input!.value.length);
      if (nextBtn) nextBtn.disabled = val.length < minLen;
    }
    input.addEventListener('input', refresh);

    const backBtn = document.querySelector<HTMLButtonElement>(`[data-step-back="${n}"]`);
    backBtn?.addEventListener('click', () => {
      if (n > 1) showStep(n - 1);
    });

    if (n < N) {
      nextBtn?.addEventListener('click', () => {
        if (answers[n - 1].length < minLen) return;
        showStep(n + 1);
      });
    }
  });

  const generateBtn = document.querySelector<HTMLButtonElement>('[data-generate]')!;
  if (cfg.generateLabel) generateBtn.textContent = cfg.generateLabel;

  function buildArgs(vals: string[]): SubmitWizardArgs {
    const wizardInput: Record<string, string> = {};
    vals.forEach((v, i) => { wizardInput[String(i + 1)] = v; });
    return {
      verb: cfg.verb,
      wizardInput,
      fallbackText: cfg.buildPrompt(vals),
      fallbackSource: cfg.fallbackSource,
      replacesArtifactId: editingArtifactId,
      refine: {
        fieldLabels: cfg.fieldLabels,
        fieldPalettes: (cfg.palettes ?? undefined) as (ChipPalette | null)[] | undefined,
        currentValues: vals,
        rebuild: (updated: string[]) => {
          // Sincroniza state local + DOM com os valores editados no overlay,
          // assim se o user fechar antes do done, o form mantém os refinos.
          stepNums.forEach((n, idx) => {
            const v = updated[idx] ?? '';
            answers[idx] = v;
            const ta = document.querySelector<HTMLTextAreaElement>(`[data-step-input="${n}"]`);
            const counter = document.querySelector<HTMLSpanElement>(`[data-step-counter="${n}"]`);
            if (ta) ta.value = v;
            if (counter) counter.textContent = String(v.length);
          });
          return buildArgs(updated.slice(0, N));
        },
      },
    };
  }

  generateBtn.addEventListener('click', async () => {
    if (answers.some((v) => v.length < minLen)) return;
    generateBtn.disabled = true;
    generateBtn.textContent = submittingLabel;
    await submitWizard(buildArgs([...answers]));
  });

  // ── Restauração após login ──
  function restoreState(): boolean {
    try {
      const raw = localStorage.getItem(cfg.stateKey);
      if (!raw) return false;
      localStorage.removeItem(cfg.stateKey);
      const saved = JSON.parse(raw) as Record<string, string | number>;
      const ts = typeof saved.ts === 'number' ? saved.ts : 0;
      if (Date.now() - ts > 3_600_000) return false;
      let restored = false;
      stepNums.forEach((n) => {
        const v = typeof saved[String(n)] === 'string' ? (saved[String(n)] as string) : '';
        if (v.length === 0) return;
        answers[n - 1] = v;
        const ta = document.querySelector<HTMLTextAreaElement>(`[data-step-input="${n}"]`);
        const counter = document.querySelector<HTMLSpanElement>(`[data-step-counter="${n}"]`);
        if (ta) {
          ta.value = v;
          ta.dispatchEvent(new Event('input'));
        }
        if (counter) counter.textContent = String(v.length);
        restored = true;
      });
      return restored;
    } catch {
      return false;
    }
  }

  // ── Pre-fill via ?from=<id> (edita peça anterior → cria nova versão) ──
  async function prefillFromArtifact(artifactId: string): Promise<boolean> {
    try {
      const resp = await fetch(`/api/journey/artifacts/${encodeURIComponent(artifactId)}`);
      if (!resp.ok) return false;
      const data = await resp.json() as { artifact?: { wizard_input?: unknown } };
      const wi = data.artifact?.wizard_input as Record<string, unknown> | undefined;
      if (!wi) return false;
      let any = false;
      stepNums.forEach((n) => {
        const v = wi[String(n)];
        if (typeof v !== 'string' || v.length === 0) return;
        answers[n - 1] = v;
        const ta = document.querySelector<HTMLTextAreaElement>(`[data-step-input="${n}"]`);
        const counter = document.querySelector<HTMLSpanElement>(`[data-step-counter="${n}"]`);
        if (ta) {
          ta.value = v;
          ta.dispatchEvent(new Event('input'));
        }
        if (counter) counter.textContent = String(v.length);
        any = true;
      });
      if (any) {
        editingArtifactId = artifactId;
        showEditingBanner();
      }
      return any;
    } catch {
      return false;
    }
  }

  function showEditingBanner(): void {
    if (document.getElementById('editing-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'editing-banner';
    banner.style.cssText =
      'max-width:760px;margin:24px auto 0;padding:12px 18px;' +
      'border:0.5px solid var(--amber);border-radius:10px;' +
      'background:rgba(217,119,6,0.08);font-family:var(--sans);' +
      'font-size:13.5px;color:var(--fg);display:flex;' +
      'justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;';
    banner.innerHTML =
      '<span><strong>Editando peça anterior.</strong> Ao gerar, ' +
      'cria uma nova versão (rastreabilidade preservada).</span>' +
      '<a href="/minha-jornada" style="font-family:var(--mono);' +
      'font-size:11px;letter-spacing:0.14em;color:var(--fg-65);' +
      'text-decoration:none;">Cancelar ↩</a>';
    const stepperBar = document.querySelector('.stepper-bar');
    if (stepperBar?.parentElement) {
      stepperBar.parentElement.insertBefore(banner, stepperBar);
    } else {
      document.body.prepend(banner);
    }
  }

  // ── Bootstrap ──
  (async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromId = urlParams.get('from');
    let prefilled = false;
    if (fromId) prefilled = await prefillFromArtifact(fromId);
    const restored = !prefilled && restoreState();
    if ((prefilled || restored) && answers.every((v) => v.length >= minLen)) {
      showStep(N);
    } else {
      showStep(1);
    }
  })();
}
