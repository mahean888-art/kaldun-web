/**
 * Worlds: Dune-styled chamfered cards with Aaru-clear capability switching.
 * Click or arrow-key any of the 5 capabilities to compare across all three
 * worlds simultaneously, or toggle "View all 5" to inspect every capability
 * inside each world at once. No disruptive auto-flip while reading.
 */

export function initDossier(root: HTMLElement): void {
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-dq]'));
  const qs = Array.from(root.querySelectorAll<HTMLElement>('[data-dq-q]'));
  const defs = Array.from(root.querySelectorAll<HTMLElement>('[data-dq-d]'));
  const allBtn = root.querySelector<HTMLButtonElement>('[data-dq-all]');

  drawFrames(root);
  if (!tabs.length) return;

  let showAll = false;

  const setAll = (on: boolean): void => {
    showAll = on;
    root.classList.toggle('is-all', on);
    if (allBtn) {
      allBtn.setAttribute('aria-pressed', String(on));
      allBtn.textContent = on ? 'Compare one' : 'View all 5';
    }
    // Redraw chamfered frames after layout height updates
    requestAnimationFrame(() => redrawAll(root));
  };

  const show = (n: number, focus = false): void => {
    if (showAll) setAll(false);
    tabs.forEach((t, k) => {
      const on = k === n;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    qs.forEach((q) => q.classList.toggle('is-on', q.dataset['dqQ'] === String(n)));
    defs.forEach((d) => d.classList.toggle('is-on', d.dataset['dqD'] === String(n)));
  };

  tabs.forEach((t, k) => {
    t.addEventListener('click', () => show(k));
    t.addEventListener('keydown', (e) => {
      let n = -1;
      if (e.key === 'ArrowRight') n = (k + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') n = (k + tabs.length - 1) % tabs.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = tabs.length - 1;
      if (n < 0) return;
      e.preventDefault();
      show(n, true);
    });
  });

  allBtn?.addEventListener('click', () => setAll(!showAll));

  show(0);
}

function drawCard(c: HTMLElement): void {
  const svg = c.querySelector<SVGSVGElement>('.wk__frame');
  if (!svg) return;
  const w = c.clientWidth;
  const h = c.clientHeight;
  if (!w || !h) return;
  const path = (inset: number): string => {
    const r = 12 - inset * 0.35;
    const sh = 38;
    const step = 30;
    const x0 = Math.min(w * 0.44, 178);
    const L = 0.75 + inset;
    const T = 0.75 + inset;
    const R = w - 0.75 - inset;
    const B = h - 0.75 - inset;
    const S = sh + inset;
    return `M${L} ${S + r}A${r} ${r} 0 0 1 ${L + r} ${S}H${x0 - inset * 0.4}L${x0 + step - inset * 0.4} ${T}H${R - r}A${r} ${r} 0 0 1 ${R} ${T + r}V${B - r}A${r} ${r} 0 0 1 ${R - r} ${B}H${L + r}A${r} ${r} 0 0 1 ${L} ${B - r}Z`;
  };
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.querySelector('.wk__o')?.setAttribute('d', path(0));
  svg.querySelector('.wk__i')?.setAttribute('d', path(8));
}

function redrawAll(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('.wk').forEach(drawCard);
}

function drawFrames(root: HTMLElement): void {
  const cards = Array.from(root.querySelectorAll<HTMLElement>('.wk'));
  const ro = new ResizeObserver((es) => es.forEach((e) => drawCard(e.target as HTMLElement)));
  cards.forEach((c) => {
    drawCard(c);
    ro.observe(c);
  });
}
