/**
 * Header behaviour: no drawn bar on the hero, a thin opaque bar once the page
 * scrolls, and the reading-progress ruling. The markup carries only the mark
 * and one action, so there is no drawer to manage.
 */

import { qs } from '../lib/dom';
import { clamp } from '../lib/math';
import { onFrame, type Frame } from '../lib/ticker';

export function initHeader(): void {
  const header = qs<HTMLElement>('[data-header]');
  if (!header) return;

  let stuck = false;
  let lastRead = -1;

  onFrame((frame: Frame) => {
    const nextStuck = frame.scrollY > 12;
    if (nextStuck !== stuck) {
      stuck = nextStuck;
      header.classList.toggle('is-stuck', stuck);
    }

    const doc = document.documentElement;
    const span = Math.max(doc.scrollHeight - frame.vh, 1);
    const read = Math.round(clamp(frame.scrollY / span) * 500) / 500;
    if (read !== lastRead) {
      lastRead = read;
      header.style.setProperty('--read', String(read));
    }
  });
}
