/**
 * The Foresight Machines mark: a medallion.
 *
 * A thin double ring — the instrument's bezel — around the branching line:
 * one past arriving at the present and opening into three futures, with the
 * present marked as a point. Engraved in strokes, in currentColor, so it
 * takes the ink of whatever band it stands on.
 */

import { svg } from '../lib/dom';

const TRUNK = 'M9 24H23.5';
const MID = 'M23.5 24H38';
const UP = 'M23.5 24C29 24 33 21.4 36.5 16.5';
const DOWN = 'M23.5 24C29 24 33 26.6 36.5 31.5';

export function makeMark(size = 26): SVGElement {
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
      svg('circle', { cx: 24, cy: 24, r: 22.6, stroke: 'currentColor', 'stroke-width': 1.5 }),
      svg('circle', {
        cx: 24,
        cy: 24,
        r: 19.4,
        stroke: 'currentColor',
        'stroke-width': 0.75,
        opacity: 0.55,
      }),
      svg('path', {
        d: `${TRUNK} ${MID} ${UP} ${DOWN}`,
        stroke: 'currentColor',
        'stroke-width': 2.2,
        'stroke-linecap': 'round',
      }),
      svg('circle', { cx: 23.5, cy: 24, r: 2.1, fill: 'currentColor', stroke: 'none' }),
    ],
  );
}

/** Replace every [data-mark] placeholder with the drawn mark. */
export function mountMarks(root: ParentNode = document): void {
  for (const host of root.querySelectorAll<HTMLElement>('[data-mark]')) {
    const size = Number(host.dataset.mark) || 26;
    host.replaceChildren(makeMark(size));
  }
}
