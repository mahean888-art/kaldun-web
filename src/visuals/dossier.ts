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
