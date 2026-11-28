/**
 * Worlds: one question at a time. The four kinds of question are chosen once
 * for all three worlds, so a reader sees the same intervention across money,
 * power and trade. While the section is in view the questions step on their
 * own; the first click or key hands control to the reader.
 */
import { prefersReducedMotion } from '../lib/prefers';

const STEP_MS = 5200;

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
    { threshold: 0.35 },
  );
  io.observe(root);
}

/**
 * The folder frame, drawn to each card's real size so the tab never
 * stretches: a low shoulder on the left for the label, a 45° step up, and a
 * second line inset inside the first.
 */
function drawFrames(root: HTMLElement): void {
  const cards = Array.from(root.querySelectorAll<HTMLElement>('.wk'));
  const path = (w: number, h: number, i: number): string => {
    const r = 18 - i * 0.5, sh = 46, step = 40, x0 = Math.min(w * 0.42, 190);
    const L = 0.75 + i, T = 0.75 + i, R = w - 0.75 - i, B = h - 0.75 - i, S = sh + i;
    return `M${L} ${S + r}A${r} ${r} 0 0 1 ${L + r} ${S}H${x0 - i * 0.4}L${x0 + step - i * 0.4} ${T}H${R - r}A${r} ${r} 0 0 1 ${R} ${T + r}V${B - r}A${r} ${r} 0 0 1 ${R - r} ${B}H${L + r}A${r} ${r} 0 0 1 ${L} ${B - r}Z`;
  };
  const draw = (c: HTMLElement): void => {
    const svg = c.querySelector<SVGSVGElement>('.wk__frame');
    if (!svg) return;
    const w = c.clientWidth, h = c.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.querySelector('.wk__o')?.setAttribute('d', path(w, h, 0));
    svg.querySelector('.wk__i')?.setAttribute('d', path(w, h, 10));
  };
  const ro = new ResizeObserver((es) => es.forEach((e) => draw(e.target as HTMLElement)));
  cards.forEach((c) => { draw(c); ro.observe(c); });
}
