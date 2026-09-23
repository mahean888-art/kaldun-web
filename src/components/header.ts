/**
 * Header behaviour: no drawn bar on the hero, a thin opaque bar once the page
 * scrolls, and a true readout at the right of the bar: the screen in view.
 */

import { qs, qsa } from '../lib/dom';
import { onFrame, type Frame } from '../lib/ticker';

export function initHeader(): void {
  const header = qs<HTMLElement>('[data-header]');
  if (!header) return;

  let stuck = false;
  onFrame((frame: Frame) => {
    const nextStuck = frame.scrollY > 12;
    if (nextStuck !== stuck) {
      stuck = nextStuck;
      header.classList.toggle('is-stuck', stuck);
    }
  });

  // The screen in view, read into the bar. Whichever screen crosses the line
  // a third of the way down the viewport is the one named.
  const read = qs<HTMLElement>('[data-screen-read]', header);
  const screens = qsa<HTMLElement>('[data-screen-code]');
  if (!read || screens.length === 0) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        read.textContent = `${el.dataset['screenCode']} / ${el.dataset['screenName']}`;
      }
    },
    { rootMargin: '-33% 0px -66% 0px', threshold: 0 },
  );
  for (const s of screens) io.observe(s);
}
