/**
 * The manifesto: the set opens as it arrives, then the argument crawls.
 *
 * Native scroll only. The television is position: sticky inside a tall band.
 * This module writes two numbers on the band, rAF-throttled: --open, which
 * runs 0 → 1 while the set travels from the bottom of the viewport up to its
 * seat (the whole slab opens from a line on the approach — never a blank,
 * pinned frame), and --p, the crawl's progress along the pinned runway.
 * Nothing else runs per frame, and nothing hijacks the scroll. Under reduced
 * motion, or without JS, the manifesto stands flat and fully readable.
 */

import { prefersReducedMotion } from '../lib/prefers';

export type ManifestoHandle = { destroy: () => void };

export function initManifesto(host: HTMLElement): ManifestoHandle {
  const crawl = host.querySelector<HTMLElement>('[data-crawl]');
  const stateMark = host.querySelector<HTMLElement>('[data-signal-state]');
  if (!crawl) return { destroy: () => undefined };

  if (prefersReducedMotion()) {
    host.classList.add('is-static');
    return { destroy: () => undefined };
  }

  host.classList.add('is-live');

  const stick = host.querySelector<HTMLElement>('.signal__stick');
  let committed = false;
  let ticking = false;
  const read = (): void => {
    ticking = false;
    const rect = host.getBoundingClientRect();
    const vh = window.innerHeight;
    // The approach: from the band's top entering at the bottom of the
    // viewport to its arrival at the sticky seat.
    const seat = stick ? parseFloat(getComputedStyle(stick).top) || 0 : 0;
    const open = Math.min(1, Math.max(0, (vh - rect.top) / Math.max(1, vh - seat)));
    host.style.setProperty('--open', open.toFixed(4));
    const runway = rect.height - vh;
    const p = runway <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / runway));
    host.style.setProperty('--p', p.toFixed(4));
    const done = p >= 0.96;
    if (done !== committed) {
      committed = done;
      stateMark?.replaceChildren(done ? 'State: committed' : 'State: incomplete');
      host.classList.toggle('is-complete', done);
    }
  };

  const onScroll = (): void => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(read);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  read();

  return {
    destroy: () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    },
  };
}
