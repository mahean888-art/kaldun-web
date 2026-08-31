/**
 * The domain stack: five domains laid out in full — ordinal, name,
 * description, then the use cases that run there. Nothing folds, nothing is
 * clicked; the reader scrolls a single editorial column.
 */

import { el } from '../lib/dom';
import type { Domain } from '../data/domains';

type Options = {
  root: HTMLElement;
  items: Domain[];
  /** Accessible name for the stack. */
  label: string;
};

export function initDomainStack({ root, items, label }: Options): void {
  if (items.length === 0) return;
  root.setAttribute('role', 'list');
  root.setAttribute('aria-label', label);

  for (const item of items) {
    root.append(
      el('div', { class: 'dstack__row', role: 'listitem', 'data-reveal': 'fade' }, [
        el('span', { class: 'dstack__no' }, [item.ordinal]),
        el('div', { class: 'dstack__body' }, [
          el('h3', { class: 'dstack__name' }, [item.label]),
          el('p', { class: 'dstack__desc' }, [item.description]),
          el('p', { class: 'dstack__caselabel' }, ['Use cases']),
          el(
            'ul',
            { class: 'dstack__cases' },
            item.cases.map((c) => el('li', {}, [c])),
          ),
        ]),
      ]),
    );
  }
}
