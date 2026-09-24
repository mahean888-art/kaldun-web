/**
 * The index at the left names the screen in view.
 */

import { qsa } from '../lib/dom';

/** Astromech's scroll-in: opacity 0, y 24, once, as each enters. */
function initEnter(): void {
  const items = qsa<HTMLElement>('[data-screen], .row, .fig, .form > *');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (const el of items) el.classList.add('will-enter');
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-entered');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0 },
  );
  for (const el of items) {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-entered');
    else io.observe(el);
  }
}

/** The present, kept: the time in San Francisco, to the second. */
function initClock(): void {
  const out = document.querySelector<HTMLElement>('[data-clock]');
  if (!out) return;
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const tick = (): void => { out.textContent = fmt.format(new Date()); };
  tick();
  window.setInterval(tick, 1000);
}

export function initHeader(): void {
  initEnter();
  initClock();
  document.documentElement.classList.add('is-loaded');
  const links = qsa<HTMLAnchorElement>('[data-index-compact] a');
  const rail = qsa<HTMLElement>('[data-rail] i');
  const order = ['launch', 'challenge', 'unlock-1', 'unlock-2', 'machine-foresight', 'decision'];
  const screens = qsa<HTMLElement>('[data-move], #decision');
  if (links.length === 0 || screens.length === 0) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const id = (e.target as HTMLElement).id;
        for (const a of links) a.classList.toggle('is-on', a.getAttribute('href') === `#${id}`);
        rail.forEach((dot, i) => dot.classList.toggle('is-on', order[i] === id));
      }
    },
    { rootMargin: '-6% 0px -68% 0px', threshold: 0 },
  );
  for (const s of screens) io.observe(s);
}
