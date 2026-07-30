/**
 * The standing line at the foot of the page: the institutions this is built for,
 * scrolling once, quietly. Duplicated so the loop is seamless.
 */

import { el } from '../lib/dom';
import { INSTITUTIONS } from '../data/institutions';

export function renderMarquee(track: HTMLElement): void {
  const items = INSTITUTIONS.map((institution) =>
    el('span', { class: 'marquee__item' }, [institution.who]),
  );
  const copy = items.map((node) => node.cloneNode(true) as HTMLElement);
  track.replaceChildren(...items, ...copy);
}
