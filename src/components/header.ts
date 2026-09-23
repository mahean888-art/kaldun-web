/**
 * The index at the left names the screen in view.
 */

import { qsa } from '../lib/dom';

export function initHeader(): void {
  const links = qsa<HTMLAnchorElement>('[data-index] a');
  const screens = qsa<HTMLElement>('[data-screen]');
  if (links.length === 0 || screens.length === 0) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const id = (e.target as HTMLElement).id;
        for (const a of links) a.classList.toggle('is-on', a.getAttribute('href') === `#${id}`);
      }
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 },
  );
  for (const s of screens) io.observe(s);
}
