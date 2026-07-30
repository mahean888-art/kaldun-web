/**
 * The Kaldun mark, rebuilt from coordinates.
 *
 * A red dome over three descending tines, held in a dark disc: the sun above
 * the horizon and what falls from it. Drawn rather than shipped as a raster, so
 * it stays exact in the header, the footer and the favicon.
 *
 * The dome's flat edge sits on the disc's centre line; the outer tines are
 * chamfered on their outer corner and the centre tine runs deepest.
 */

import { svg } from '../lib/dom';

const DOME = 'M4.4 24A19.6 19.6 0 0 1 43.6 24Z';
const TINE_LEFT = 'M11.6 24H15.9V35.6L11.6 31.4Z';
const TINE_CENTRE = 'M21.4 24H26.6V40.2H21.4Z';
const TINE_RIGHT = 'M36.4 24H32.1V35.6L36.4 31.4Z';

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
      red(DOME),
      red(TINE_LEFT),
      red(TINE_CENTRE),
      red(TINE_RIGHT),
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
