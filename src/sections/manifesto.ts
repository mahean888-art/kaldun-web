/**
 * The manifesto crawl: the argument advances into depth inside the gilt TV.
 *
 * Native scroll only. The TV is position: sticky inside a tall wrapper; this
 * module reads scroll progress (rAF-throttled) into one CSS variable, --p,
 * which the crawl plane's transform consumes — nothing else runs per frame,
 * and nothing hijacks the scroll. When the crawl completes, the bezel's
 * state mark flips to committed. Under reduced motion, or without JS, the
 * manifesto stands flat and fully readable inside the screen.
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

  let committed = false;
  let ticking = false;
  const read = (): void => {
    ticking = false;
    const rect = host.getBoundingClientRect();
    const runway = rect.height - window.innerHeight;
    const p = runway <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / runway));
    crawl.style.setProperty('--p', p.toFixed(4));
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
