/**
 * Worlds: capability selector synced across the three Dune-framed world cards.
 * Selecting a capability (Predict, Optimize, Discover, Coordinate, Price risk)
 * shows the matching definition and real institutional question in every world.
 */
import { prefersReducedMotion } from '../lib/prefers';

const STEP_MS = 5600;

export function initDossier(root: HTMLElement): void {
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-dq]'));
  const qs = Array.from(root.querySelectorAll<HTMLElement>('[data-dq-q]'));
  const defs = Array.from(root.querySelectorAll<HTMLElement>('[data-dq-d]'));
  drawFrames(root);
  if (!tabs.length) return;
  let cur = 0;
  let timer = 0;
  let held = prefersReducedMotion();

  const show = (n: number, focus = false): void => {
    cur = n;
    tabs.forEach((t, k) => {
      const on = k === n;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    qs.forEach((q) => q.classList.toggle('is-on', q.dataset['dqQ'] === String(n)));
    defs.forEach((d) => d.classList.toggle('is-on', d.dataset['dqD'] === String(n)));
    root.style.setProperty('--dq-ms', `${STEP_MS}ms`);
    root.classList.remove('is-ticking');
    void root.offsetWidth;
    if (!held) root.classList.add('is-ticking');
  };

  const stop = (): void => {
    held = true;
    window.clearInterval(timer);
    root.classList.remove('is-ticking');
  };
  const run = (): void => {
    if (held) return;
    window.clearInterval(timer);
    show(cur);
    timer = window.setInterval(() => show((cur + 1) % tabs.length), STEP_MS);
  };

  tabs.forEach((t, k) => {
    t.addEventListener('click', () => {
      stop();
      show(k);
    });
    t.addEventListener('keydown', (e) => {
      let n = -1;
      if (e.key === 'ArrowRight') n = (k + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') n = (k + tabs.length - 1) % tabs.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = tabs.length - 1;
      if (n < 0) return;
      e.preventDefault();
      stop();
      show(n, true);
    });
  });

  show(0);
  const io = new IntersectionObserver(
    (es) => {
      if (es.some((e) => e.isIntersecting)) run();
      else window.clearInterval(timer);
    },
    { threshold: 0.25 },
  );
  io.observe(root);
}

/**
 * Draw the Dune-styled chamfered folder silhouette precisely to each card's
 * rendered dimensions so the notched top-left tab and inner hairline stay
 * razor-sharp at every viewport width.
 */
function drawFrames(root: HTMLElement): void {
  const cards = Array.from(root.querySelectorAll<HTMLElement>('.wk'));
  const path = (w: number, h: number, i: number): string => {
    if (w < 40 || h < 40) return '';
    const r = Math.max(8, 16 - i * 0.45);
    const sh = 40;
    const step = 34;
    const x0 = Math.min(w * 0.4, 164);
    const L = 0.75 + i;
    const T = 0.75 + i;
    const R = w - 0.75 - i;
    const B = h - 0.75 - i;
    const S = sh + i;
    return `M${L} ${S + r}A${r} ${r} 0 0 1 ${L + r} ${S}H${x0 - i * 0.4}L${x0 + step - i * 0.4} ${T}H${R - r}A${r} ${r} 0 0 1 ${R} ${T + r}V${B - r}A${r} ${r} 0 0 1 ${R - r} ${B}H${L + r}A${r} ${r} 0 0 1 ${L} ${B - r}Z`;
  };
  const draw = (c: HTMLElement): void => {
    const svg = c.querySelector<SVGSVGElement>('.wk__frame');
    if (!svg) return;
    const w = c.clientWidth;
    const h = c.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.querySelector('.wk__o')?.setAttribute('d', path(w, h, 0));
    svg.querySelector('.wk__i')?.setAttribute('d', path(w, h, 9));
  };
  const ro = new ResizeObserver((es) => es.forEach((e) => draw(e.target as HTMLElement)));
  cards.forEach((c) => {
    draw(c);
    ro.observe(c);
  });
}
