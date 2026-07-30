/**
 * Pinned sequence.
 *
 * A tall band whose inner panel is `position: sticky`. As the page scrolls
 * through the band, the active card swaps and the rail advances. The page never
 * stops scrolling — no wheel capture, no scroll-jacking — so a reader can always
 * keep going, and a rail click just scrolls to the matching offset.
 *
 * Markup contract:
 *   [data-sequence]                      the tall band
 *     [data-sequence-rail-item]          one per step (button)
 *     [data-sequence-card]               one per step
 */

import { qsa } from '../lib/dom';
import { clamp } from '../lib/math';
import { trackScroll } from '../lib/scrollLink';
import { prefersReducedMotion } from '../lib/prefers';

export function initSequence(band: HTMLElement): void {
  const cards = qsa<HTMLElement>('[data-sequence-card]', band);
  const railItems = qsa<HTMLElement>('[data-sequence-rail-item]', band);
  const steps = cards.length;
  if (steps === 0) return;

  band.style.setProperty('--steps', String(steps));

  let active = -1;

  const setActive = (index: number): void => {
    const next = clamp(index, 0, steps - 1);
    if (next === active) return;
    active = next;
    cards.forEach((card, i) => {
      const on = i === next;
      card.classList.toggle('is-active', on);
      card.setAttribute('aria-hidden', String(!on));
    });
    railItems.forEach((item, i) => {
      const on = i === next;
      item.classList.toggle('is-active', on);
      item.setAttribute('aria-selected', String(on));
    });
    band.style.setProperty('--active', String(next));
  };

  trackScroll(band, 'pin', (p) => {
    // Slight bias so a step holds a moment before handing over.
    setActive(Math.floor(clamp(p * 0.999) * steps));
  });

  railItems.forEach((item, i) => {
    item.setAttribute('role', 'tab');
    item.addEventListener('click', () => {
      const rect = band.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const span = Math.max(rect.height - window.innerHeight, 1);
      const target = top + ((i + 0.5) / steps) * span;
      window.scrollTo({
        top: target,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      });
      setActive(i);
    });
  });

  setActive(0);
}

export function initSequences(root: ParentNode = document): void {
  for (const node of qsa<HTMLElement>('[data-sequence]', root)) initSequence(node);
}
