/**
 * Horizontal carousel.
 *
 * The scroller is a real overflow container with scroll-snap, so touch, trackpad
 * and keyboard scrolling all work natively and nothing has to be re-implemented.
 * On top of that: prev/next buttons that step one card, mouse drag-to-pan, a
 * progress rail, and correct disabled states at both ends.
 */

import { qs, qsa } from '../lib/dom';
import { clamp } from '../lib/math';
import { onResize } from '../lib/ticker';

type Options = {
  root: HTMLElement;
};

const EPS = 2;

export function initCarousel({ root }: Options): void {
  const viewport = qs<HTMLElement>('[data-carousel-viewport]', root);
  if (!viewport) return;

  const prev = qs<HTMLButtonElement>('[data-carousel-prev]', root);
  const next = qs<HTMLButtonElement>('[data-carousel-next]', root);
  const thumb = qs<HTMLElement>('[data-carousel-thumb]', root);

  const cards = (): HTMLElement[] => qsa<HTMLElement>('[data-carousel-item]', viewport);

  const step = (): number => {
    const items = cards();
    const first = items[0];
    const second = items[1];
    if (!first) return viewport.clientWidth * 0.8;
    if (second) return second.offsetLeft - first.offsetLeft;
    return first.offsetWidth;
  };

  const maxScroll = (): number => Math.max(viewport.scrollWidth - viewport.clientWidth, 0);

  const sync = (): void => {
    const max = maxScroll();
    const x = viewport.scrollLeft;

    if (prev) prev.disabled = x <= EPS;
    if (next) next.disabled = x >= max - EPS;

    if (thumb) {
      const ratio = viewport.clientWidth / Math.max(viewport.scrollWidth, 1);
      const width = clamp(ratio, 0.12, 1);
      const travel = 1 - width;
      const pos = max <= 0 ? 0 : clamp(x / max);
      thumb.style.setProperty('--thumb-w', `${(width * 100).toFixed(2)}%`);
      thumb.style.setProperty('--thumb-x', `${((pos * travel * 100) / width).toFixed(2)}%`);
    }

    // Mark the leading card so its visual can lift.
    const items = cards();
    const lead = items.findIndex((item) => item.offsetLeft >= x - EPS);
    items.forEach((item, i) => item.classList.toggle('is-lead', i === lead));
  };

  const scrollBy = (dir: 1 | -1): void => {
    viewport.scrollBy({ left: dir * step(), behavior: 'smooth' });
  };

  prev?.addEventListener('click', () => scrollBy(-1));
  next?.addEventListener('click', () => scrollBy(1));

  viewport.addEventListener('scroll', sync, { passive: true });
  onResize(sync);

  // Keyboard: the viewport is focusable so arrows page through the cards.
  viewport.setAttribute('tabindex', '0');
  viewport.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollBy(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollBy(-1);
    }
  });

  // --- mouse drag-to-pan (touch keeps native behaviour) ------------------
  let dragging = false;
  let startX = 0;
  let startScroll = 0;
  let moved = 0;

  viewport.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    dragging = true;
    moved = 0;
    startX = event.clientX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add('is-dragging');
  });

  const endDrag = (): void => {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove('is-dragging');
    // Re-engage snapping at the nearest card.
    const s = step();
    if (s > 0) {
      viewport.scrollTo({ left: Math.round(viewport.scrollLeft / s) * s, behavior: 'smooth' });
    }
    sync();
  };

  viewport.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const delta = event.clientX - startX;
    moved = Math.max(moved, Math.abs(delta));
    viewport.scrollLeft = startScroll - delta;
  });

  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('pointerleave', endDrag);

  // Swallow the click that ends a drag so cards do not navigate accidentally.
  viewport.addEventListener(
    'click',
    (event) => {
      if (moved > 8) {
        event.preventDefault();
        event.stopPropagation();
        moved = 0;
      }
    },
    true,
  );

  sync();
  // Card widths depend on fonts and images settling.
  window.addEventListener('load', sync);
  if (document.fonts) void document.fonts.ready.then(sync);
}

/** Initialise every carousel in the document. */
export function initCarousels(root: ParentNode = document): void {
  for (const node of qsa<HTMLElement>('[data-carousel]', root)) initCarousel({ root: node });
}
