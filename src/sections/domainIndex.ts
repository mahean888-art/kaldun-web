/**
 * The question index: five numbered rows, one open at a time. Each row is a
 * domain — its name in the serif, its bet in italic, its runnable questions
 * beneath. Height animates through the grid-rows trick in CSS, so opening a
 * row never measures anything and never jumps.
 */

import { el } from '../lib/dom';
import type { Domain } from '../data/domains';

type Options = {
  root: HTMLElement;
  items: Domain[];
  /** Accessible name for the index. */
  label: string;
};

export function initDomainIndex({ root, items, label }: Options): void {
  if (items.length === 0) return;
  root.setAttribute('role', 'list');
  root.setAttribute('aria-label', label);

  const rows = items.map((item, i) => {
    const head = el(
      'button',
      {
        type: 'button',
        class: 'dindex__head',
        id: `dindex-head-${item.ordinal}`,
        'aria-controls': `dindex-panel-${item.ordinal}`,
        'aria-expanded': String(i === 0),
      },
      [
        el('span', { class: 'dindex__no' }, [item.ordinal]),
        el('span', { class: 'dindex__name' }, [item.label]),
        el('span', { class: 'dindex__mark', 'aria-hidden': 'true' }, ['+']),
      ],
    );

    const body = el('div', { class: 'dindex__body' }, [
      el('p', { class: 'dindex__tagline' }, [item.tagline]),
      el(
        'ul',
        { class: 'dindex__qs' },
        item.questions.map((q) => el('li', {}, [q])),
      ),
    ]);

    const panel = el(
      'div',
      {
        class: 'dindex__panel',
        id: `dindex-panel-${item.ordinal}`,
        role: 'region',
        'aria-labelledby': `dindex-head-${item.ordinal}`,
      },
      [el('div', { class: 'dindex__clip' }, [body])],
    );

    const row = el('div', { class: i === 0 ? 'dindex__row is-open' : 'dindex__row', role: 'listitem' }, [
      head,
      panel,
    ]);
    return { row, head };
  });

  const openRow = (index: number): void => {
    rows.forEach(({ row, head }, i) => {
      const open = i === index;
      row.classList.toggle('is-open', open);
      head.setAttribute('aria-expanded', String(open));
    });
  };

  rows.forEach(({ row, head }, i) => {
    head.addEventListener('click', () => {
      // Re-clicking the open row leaves it open: the index always shows one
      // domain, the way the page always shows one live thing.
      openRow(i);
    });
    root.append(row);
  });
}
