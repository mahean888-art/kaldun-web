/**
 * The manifesto's reading line.
 *
 * The argument stands in a grey column; each paragraph brightens to ink once
 * its top crosses a line about two-fifths of the way up the viewport, and
 * dims again if the reader scrolls back above it. One rAF-throttled scroll
 * read while the column is near the viewport, nine rect reads per frame at
 * most, nothing hijacked. Under reduced motion every line is simply lit.
 */

import { prefersReducedMotion } from '../lib/prefers';

export type ManifestoHandle = { destroy: () => void };

/** The reading line, as a fraction of the viewport height from the top. */
const LINE = 0.62;

export function initManifesto(host: HTMLElement): ManifestoHandle {
  const paras = Array.from(host.querySelectorAll<HTMLElement>('.manifesto__para'));
  if (paras.length === 0) return { destroy: () => undefined };

  if (prefersReducedMotion()) {
    for (const p of paras) p.classList.add('is-lit');
    return { destroy: () => undefined };
  }

  let ticking = false;
  const read = (): void => {
    ticking = false;
    const vh = window.innerHeight;
    const rect = host.getBoundingClientRect();
    // Far away: everything above is lit, everything below is not — one write.
    if (rect.bottom < -vh || rect.top > vh * 2) {
      const lit = rect.bottom < 0;
      for (const p of paras) p.classList.toggle('is-lit', lit);
      return;
    }
    const line = vh * LINE;
    for (const p of paras) {
      p.classList.toggle('is-lit', p.getBoundingClientRect().top < line);
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
