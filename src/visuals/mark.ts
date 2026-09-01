/**
 * The Foresight Machines emblem — the founder's design.
 *
 * A crimson vessel: the half-disc of what has already happened, carrying
 * three towers of what may — the center risen furthest to a peak, the two
 * beside it chamfered toward it — inside a thin gold ring on the dark.
 */

import { svg } from '../lib/dom';

const RING = '#c9a35c';
const EMBLEM = '#b13a3a';

const VESSEL = 'M10.5 26 A13.5 13.5 0 0 0 37.5 26 Z';
const CENTER = 'M21.6 26 V12.2 L24 9.6 L26.4 12.2 V26 Z';
const LEFT = 'M14.6 26 V17.4 L19.4 14.2 V26 Z';
const RIGHT = 'M33.4 26 V17.4 L28.6 14.2 V26 Z';

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
      svg('circle', { cx: 24, cy: 24, r: 21.2, stroke: RING, 'stroke-width': 1.4 }),
      svg('path', { d: VESSEL, fill: EMBLEM }),
      svg('path', { d: CENTER, fill: EMBLEM }),
      svg('path', { d: LEFT, fill: EMBLEM }),
      svg('path', { d: RIGHT, fill: EMBLEM }),
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
