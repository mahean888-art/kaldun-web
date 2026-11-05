/**
 * One screen per section: if a band's content is still taller than the window
 * after the CSS has done what it can, scale it down to fit (never below 72%).
 */
export function initFit(): void {
  const q = window.matchMedia('(min-width: 1024px) and (min-height: 560px)');
  const wraps = Array.from(document.querySelectorAll<HTMLElement>('.band[data-screen] > .wrap'));
  if (!wraps.length) return;
  const fit = (): void => {
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
    const avail = window.innerHeight - (header > 0 && header < 200 ? header : 54);
    for (const w of wraps) {
      w.style.removeProperty('zoom');
      if (!q.matches) continue;
      const h = w.getBoundingClientRect().height;
      if (h > avail) w.style.setProperty('zoom', String(Math.max(0.72, avail / h)));
    }
  };
  let t = 0;
  const later = (): void => {
    cancelAnimationFrame(t);
    t = requestAnimationFrame(fit);
  };
  fit();
  window.addEventListener('resize', later);
  window.addEventListener('load', later);
  void document.fonts?.ready.then(later);
}
