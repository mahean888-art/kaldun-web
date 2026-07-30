/**
 * The Kaldun mark, rebuilt as geometry.
 *
 * A crimson beacon — a bowl with three risers — inside a gold measuring ring.
 * Drawn from coordinates rather than shipped as a raster, so it stays crisp at
 * every size, in the header, in the footer and as the favicon.
 */

import { svg } from '../lib/dom';

const BOWL = 'M13 27.4C13 34.5 17.9 39.6 24 39.6C30.1 39.6 35 34.5 35 27.4Z';

/** Three risers: outer pair equal, centre one taller. */
const RISERS: Array<[number, number]> = [
  [13, 16.6],
  [21.4, 12.4],
  [29.8, 16.6],
];

const RISER_W = 5.2;

export function makeMark(size = 34): SVGElement {
  const risers = RISERS.map(([x, y]) =>
    svg('rect', {
      x,
      y,
      width: RISER_W,
      height: 27.4 - y,
      fill: 'var(--crimson)',
    }),
  );

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
      svg('circle', { cx: 24, cy: 24, r: 23, fill: 'var(--void)' }),
      svg('circle', {
        cx: 24,
        cy: 24,
        r: 22.2,
        fill: 'none',
        stroke: 'var(--gold)',
        'stroke-width': 1.1,
      }),
      svg('path', { d: BOWL, fill: 'var(--crimson)' }),
      ...risers,
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
