/**
 * Method: four steps over one figure, the hero's world and its fan of futures. The steps advance on their own
 * while the section is in view, a bar filling under the active one; choosing a
 * step holds it there. Under reduced motion nothing advances.
 */
import { prefersReducedMotion } from '../lib/prefers';

const DWELL = 4800;

export function initSteps(root: HTMLElement): void {
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const stage = root.querySelector<HTMLElement>('.mt__stage');
  if (!tabs.length) return;
  let i = 0;
  let timer = 0;
  let held = prefersReducedMotion();
  const show = (n: number, focus = false): void => {
    i = n;
    tabs.forEach((t, k) => {
      const on = k === n;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      t.classList.remove('is-running');
    });
    if (stage) stage.dataset['step'] = String(n);
    if (focus) tabs[n]!.focus();
    if (!held) {
      void tabs[n]!.offsetWidth;
      tabs[n]!.classList.add('is-running');
    }
  };
  const next = (): void => show((i + 1) % tabs.length);
  const run = (): void => {
    window.clearInterval(timer);
    if (!held) timer = window.setInterval(next, DWELL);
  };
  const hold = (): void => {
    held = true;
    window.clearInterval(timer);
    tabs.forEach((t) => t.classList.remove('is-running'));
  };
  tabs.forEach((t, k) =>
    t.addEventListener('click', () => {
      hold();
      show(k);
    }),
  );
  root.querySelector('[role="tablist"]')?.addEventListener('keydown', (ev) => {
    const key = (ev as KeyboardEvent).key;
    const d = key === 'ArrowDown' || key === 'ArrowRight' ? 1 : key === 'ArrowUp' || key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    ev.preventDefault();
    hold();
    show((i + d + tabs.length) % tabs.length, true);
  });
  const io = new IntersectionObserver(
    (en) => {
      const vis = en.some((e) => e.isIntersecting);
      if (vis && !held) {
        show(i);
        run();
      } else window.clearInterval(timer);
    },
    { threshold: 0.35 },
  );
  show(0);
  io.observe(root);
}
