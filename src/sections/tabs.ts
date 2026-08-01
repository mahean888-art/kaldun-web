/**
 * The domain tabs: a horizontal segmented bar, one decorated card per domain.
 * Selection is by click and by keyboard; one card at a time, nothing driven by
 * scroll.
 */

import { el, qs } from '../lib/dom';
import type { StackItem } from './stack';

type Options = {
  root: HTMLElement;
  items: StackItem[];
  /** Accessible name for the tab list. */
  label: string;
};

export function initTabs({ root, items, label }: Options): void {
  const barHost = qs<HTMLElement>('[data-tabbar]', root);
  const panelHost = qs<HTMLElement>('[data-tab-panel]', root);
  if (!barHost || !panelHost || items.length === 0) return;

  const tabs = items.map((item, i) =>
    el(
      'button',
      {
        type: 'button',
        class: 'tabbar__tab',
        role: 'tab',
        id: `tab-${item.id}`,
        'aria-controls': `card-${item.id}`,
        'aria-selected': String(i === 0),
        tabindex: i === 0 ? '0' : '-1',
      },
      [item.label],
    ),
  );

  const cards = items.map((item, i) =>
    el(
      'article',
      {
        class: 'dcard',
        role: 'tabpanel',
        id: `card-${item.id}`,
        'aria-labelledby': `tab-${item.id}`,
        hidden: i !== 0,
      },
      [
        ...(item.note ? [el('p', { class: 'dcard__who' }, [item.note])] : []),
        el('h3', { class: 'dcard__title' }, [item.title]),
        el('p', { class: 'dcard__body' }, [item.body]),
        ...(item.rows
          ? [
              el(
                'div',
                { class: 'dcard__rows' },
                item.rows.map(([k, v]) =>
                  el('div', { class: 'dcard__row' }, [
                    el('span', { class: 'dcard__key' }, [k]),
                    el('span', { class: 'dcard__value' }, [v]),
                  ]),
                ),
              ),
            ]
          : []),
        ...(item.chips
          ? [
              el('div', { class: 'dcard__chips' }, [
                el('span', { class: 't-label' }, [item.chipsLabel ?? 'Use cases']),
                el(
                  'div',
                  { class: 'chips' },
                  item.chips.map((chip) => el('span', { class: 'chip' }, [chip])),
                ),
              ]),
            ]
          : []),
      ],
    ),
  );

  barHost.setAttribute('role', 'tablist');
  barHost.setAttribute('aria-label', label);
  barHost.replaceChildren(...tabs);
  panelHost.replaceChildren(...cards);

  const select = (index: number, focus = false): void => {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    cards.forEach((card, i) => {
      card.hidden = i !== index;
    });
    if (focus) tabs[index]?.focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', (event) => {
      const last = tabs.length - 1;
      let next = -1;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = i === last ? 0 : i + 1;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = i === 0 ? last : i - 1;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = last;
      if (next >= 0) {
        event.preventDefault();
        select(next, true);
      }
    });
  });

  select(0);
}
