/**
 * The Foresight Machines sigil: the gate of futures.
 *
 * An austere, symmetric emblem in straight strokes — from the base line of
 * what has already happened, a central column rises furthest, flanked by two
 * columns that branch from it at right angles: three futures standing off
 * one past. Heraldic, angular, and drawn in currentColor so it takes the
 * ink of whatever band it stands on.
 */

import { svg } from '../lib/dom';

const SIGIL = 'M10 41H38 M24 41V7 M24 29H14V13 M24 29H34V13';

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
      svg('path', {
        d: SIGIL,
        stroke: 'currentColor',
        'stroke-width': 3,
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
