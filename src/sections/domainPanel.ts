/**
 * The domains: a quiet vertical index of five, and one panel at a time —
 * the question, then one line on what the Machine returns. Writing only;
 * the words carry the section.
 * Selection by click and by keyboard.
 */

import { el } from '../lib/dom';
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
        'aria-controls': 'domain-panel',
        'aria-selected': String(i === 0),
        tabindex: i === 0 ? '0' : '-1',
      },
      [el('span', {}, [item.label])],
    ),
  );

  const index = el(
    'div',
    { class: 'dpanel__index', role: 'tablist', 'aria-label': label, 'aria-orientation': 'vertical' },
    tabs,
  );

  const question = el('h3', { class: 'dpanel__question' }, [items[0]!.question]);
  const returns = el('p', { class: 'dpanel__returns' }, [items[0]!.returns]);

  const panel = el(
    'div',
    { class: 'dpanel__panel', id: 'domain-panel', role: 'tabpanel', 'aria-labelledby': 'domain-tab-01' },
    [question, returns],
  );

  root.append(index, panel);

  let active = 0;
  const select = (i: number, focus = false): void => {
    active = i;
    const item = items[i]!;
    tabs.forEach((tab, k) => {
      tab.setAttribute('aria-selected', String(k === i));
      tab.tabIndex = k === i ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', `domain-tab-${item.ordinal}`);
    panel.classList.remove('is-in');
    question.textContent = item.question;
    returns.textContent = item.returns;
    requestAnimationFrame(() => panel.classList.add('is-in'));
    if (focus) tabs[i]?.focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', (event) => {
      const delta = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
      if (delta === 0) return;
      event.preventDefault();
      select((active + delta + items.length) % items.length, true);
    });
  });

  panel.classList.add('is-in');
}
