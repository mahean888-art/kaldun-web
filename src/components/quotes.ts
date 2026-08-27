/**
 * Decisions you can run: one question at a time, held long enough to read,
 * then the next — the way a room hears them asked. Each carries the desk
 * that owns it and the domain it comes from. Click, or the keyboard,
 * advances; time advances anyway.
 */

import { qs } from '../lib/dom';
import { prefersReducedMotion } from '../lib/prefers';
import { QUESTIONS } from '../data/questions';

const HOLD_MS = 6400;
const SWAP_MS = 480;

export function initQuotes(root: HTMLElement): void {
  const textEl = qs<HTMLElement>('[data-quote-text]', root);
  const roleEl = qs<HTMLElement>('[data-quote-role]', root);
  const indexEl = qs<HTMLElement>('[data-quote-index]', root);
  const barEl = qs<HTMLElement>('[data-quote-bar]', root);
  if (!textEl || !roleEl || !indexEl) return;

  const reduced = prefersReducedMotion();
  let i = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let visible = false;

  const render = (): void => {
    const q = QUESTIONS[i]!;
    textEl.textContent = `“${q.text}”`;
    roleEl.textContent = `— ${q.role} · ${q.domain}`;
    indexEl.textContent = `${String(i + 1).padStart(2, '0')} / ${QUESTIONS.length}`;
    if (barEl && !reduced) {
      barEl.style.transition = 'none';
      barEl.style.transform = 'scaleX(0)';
      barEl.getBoundingClientRect();
      barEl.style.transition = `transform ${HOLD_MS}ms linear`;
      barEl.style.transform = 'scaleX(1)';
    }
  };

  const show = (next: number): void => {
    i = ((next % QUESTIONS.length) + QUESTIONS.length) % QUESTIONS.length;
    if (reduced) {
      render();
      return;
    }
    root.classList.add('is-swapping');
    window.setTimeout(() => {
      render();
      root.classList.remove('is-swapping');
    }, SWAP_MS * 0.5);
  };

  const arm = (): void => {
    if (timer) clearTimeout(timer);
    if (reduced) return;
    timer = setTimeout(() => {
      if (visible) show(i + 1);
      arm();
    }, HOLD_MS);
  };

  root.addEventListener('click', () => {
    show(i + 1);
    arm();
  });
  root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      show(i + 1);
      arm();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      show(i - 1);
      arm();
    }
  });

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible) arm();
      else if (timer) clearTimeout(timer);
    },
    { threshold: 0.25 },
  );
  io.observe(root);

  render();
}
