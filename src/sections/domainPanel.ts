/**
 * The domains: a vertical index of five, and one panel visible at a time.
 * Every panel is rendered once and stacked in the same cell, so the section
 * keeps the height of its tallest panel and never shifts on selection. Each
 * panel opens with who it is for, then the heading, then one paragraph.
 */

import { el } from '../lib/dom';
import { wireTabs } from '../lib/tabs';
import type { Domain } from '../data/domains';

type Options = {
  root: HTMLElement;
  items: Domain[];
  /** Accessible name for the index. */
  label: string;
};

export function initDomainPanel({ root, items, label }: Options): void {
  if (items.length === 0) return;

  const tabs = items.map((item, i) =>
    el(
      'button',
      {
        type: 'button',
        class: 'dpanel__tab',
        role: 'tab',
        id: `domain-tab-${item.ordinal}`,
        'aria-controls': `domain-panel-${item.ordinal}`,
        'aria-selected': String(i === 0),
        tabindex: i === 0 ? '0' : '-1',
      },
      [el('span', { class: 'dpanel__no' }, [item.ordinal]), el('span', {}, [item.label])],
    ),
  );

  const index = el(
    'div',
    { class: 'dpanel__index', role: 'tablist', 'aria-label': label, 'aria-orientation': 'vertical' },
    tabs,
  );

  const panels = items.map((item, i) =>
    el(
      'div',
      {
        class: 'dpanel__panel',
        id: `domain-panel-${item.ordinal}`,
        role: 'tabpanel',
        'aria-labelledby': `domain-tab-${item.ordinal}`,
        'aria-hidden': String(i !== 0),
      },
      [
        el('p', { class: 'dpanel__aud' }, [item.audience]),
        el('h3', { class: 'dpanel__question' }, [item.question]),
        el('p', { class: 'dpanel__returns' }, [item.returns]),
      ],
    ),
  );

  root.append(index, el('div', { class: 'dpanel__stack' }, panels));
  wireTabs({ tabs, panels });
}
