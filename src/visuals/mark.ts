/**
 * The Foresight Machines mark: one line branching into three.
 *
 * Read right to left — the single shaft is the present; at the fork it opens
 * into three futures. Drawn as strokes in currentColor, so it takes the ink
 * of whatever band it stands on.
 */

import { svg } from '../lib/dom';

const SHAFT = 'M62 20H32';
const MID = 'M32 20H8';
const UP = 'M32 20C24 20 17 15.5 10 7';
const DOWN = 'M32 20C24 20 17 24.5 10 33';

export function makeMark(size = 26): SVGElement {
  return svg(
    'svg',
    {
      viewBox: '0 0 64 40',
      width: Math.round(size * 1.6),
      height: size,
      fill: 'none',
      'aria-hidden': 'true',
      focusable: 'false',
      class: 'mark',
    },
    [
      svg('path', {
        d: `${SHAFT} ${MID} ${UP} ${DOWN}`,
        stroke: 'currentColor',
        'stroke-width': 3.4,
        'stroke-linecap': 'round',
      }),
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
