/**
 * The Kaldun mark, built from coordinates.
 *
 * A red vessel with three risers standing out of it, held in a dark disc: the
 * bowl below the horizon, what rises from it above. Drawn rather than shipped as
 * a raster, so it stays exact in the header, the footer and the favicon.
 *
 * The vessel's flat edge sits on the disc's centre line; the outer risers are
 * chamfered on their outer top corner and the centre riser stands tallest.
 */

import { svg } from '../lib/dom';

const VESSEL = 'M4.65 24C4.65 34.7 13.3 43.35 24 43.35C34.7 43.35 43.35 34.7 43.35 24Z';
const RISER_LEFT = 'M11.9 24V15.9L13.9 13.9H17.1V24Z';
const RISER_CENTRE = 'M21.4 24V8H26.6V24Z';
const RISER_RIGHT = 'M36.1 24V15.9L34.1 13.9H30.9V24Z';

export function makeMark(size = 34): SVGElement {
  const red = (d: string): SVGElement => svg('path', { d, fill: 'var(--crimson)' });

  return svg(
    'svg',
    {
      viewBox: '0 0 48 48',
      width: size,
      height: size,
      fill: 'none',
      'aria-hidden': 'true',
      focusable: 'false',
      class: 'mark',
    },
    [
      svg('circle', { cx: 24, cy: 24, r: 23.4, fill: '#0d0d0d' }),
      // A hairline in the mark's own yellow, so the disc reads on a dark page.
      svg('circle', {
        cx: 24,
        cy: 24,
        r: 22.9,
        fill: 'none',
        stroke: 'var(--gold)',
        'stroke-width': 1,
      }),
      red(VESSEL),
      red(RISER_LEFT),
      red(RISER_CENTRE),
      red(RISER_RIGHT),
    ],
  );
}

/** Fill every `[data-mark]` host in the document. */
export function mountMarks(root: ParentNode = document): void {
  for (const host of Array.from(root.querySelectorAll<HTMLElement>('[data-mark]'))) {
    const size = Number(host.dataset.mark || '34');
    host.replaceChildren(makeMark(Number.isFinite(size) && size > 0 ? size : 34));
  }
}
