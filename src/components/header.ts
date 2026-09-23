/**
 * The index at the left names the screen in view.
 */

import { qsa } from '../lib/dom';

export function initHeader(): void {
  const links = qsa<HTMLAnchorElement>('[data-index] a, [data-index-compact] a');
  const rail = qsa<HTMLElement>('[data-rail] i');
  const order = ['machine', 'actions', 'record', 'launch', 'research', 'decision'];
  const screens = qsa<HTMLElement>('[data-screen]');
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
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 },
  );
  for (const s of screens) io.observe(s);
}
