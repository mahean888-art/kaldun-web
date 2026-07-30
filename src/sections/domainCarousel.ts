/**
 * The domains carousel.
 *
 * Large heading upper-left, a horizontal strip of cards that bleeds past the
 * viewport, an abstract monochrome visual per card, and controls that work.
 */

import { el, svg } from '../lib/dom';
import { DOMAINS } from '../data/domains';
import { makeGlyph, prepareGlyphDraw } from '../visuals/glyphs';

function circleArrow(): HTMLElement {
  const wrap = el('span', { class: 'circle-arrow', 'aria-hidden': 'true' });
  wrap.append(
    svg('svg', { viewBox: '0 0 16 16', fill: 'none', width: '14', height: '14' }, [
      svg('path', {
        d: 'M3 13L13 3M13 3H5.5M13 3v7.5',
        stroke: 'currentColor',
        'stroke-width': '1.1',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      }),
    ]),
  );
  return wrap;
}

export function renderDomainCarousel(viewport: HTMLElement): void {
  const cards = DOMAINS.map((domain, i) => {
    const visual = el('div', { class: 'domain-card__visual glyph' });
    visual.append(makeGlyph(domain.glyph, domain.seed));

    return el(
      'a',
      {
        class: 'domain-card',
        'data-carousel-item': '',
        href: `domains.html#${domain.id}`,
        'aria-label': `${domain.name} — open domain`,
        style: `--card-i:${i}`,
      },
      [
        visual,
        el('div', { class: 'domain-card__body' }, [
          el('span', { class: 't-label t-label--bronze' }, [String(i + 1).padStart(2, '0')]),
          el('h3', { class: 'domain-card__title' }, [domain.name]),
          el('p', { class: 'domain-card__text' }, [domain.card]),
          el('div', { class: 'domain-card__foot' }, [
            el('span', { class: 't-label' }, ['Open domain']),
            circleArrow(),
          ]),
        ]),
      ],
    );
  });

  viewport.replaceChildren(...cards);
  prepareGlyphDraw(viewport);
}
