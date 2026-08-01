/**
 * The rail-and-panel section.
 *
 * A numbered list on the left, one detail panel on the right, sticky while the
 * section is in view. Used twice — for the Engine's four movements and for the
 * five decision domains — so the two read as the same kind of object.
 *
 * Selection is by click and by keyboard. Nothing is driven by scroll position,
 * so the page never fights the reader.
 */

import { el, qs } from '../lib/dom';
import { initConcept, type ConceptHandle, type ConceptName } from '../visuals/concept';

export type StackItem = {
  id: string;
  /** Concept glyph drawn beside the panel copy. */
  glyph?: ConceptName;
  /** Floating terms placed around the glyph. */
  tags?: string[];
  ordinal: string;
  /** Rail label — short. */
  label: string;
  /** Panel headline. */
  title: string;
  /** Panel body copy. */
  body: string;
  /** Optional second paragraph. */
  note?: string;
  /** Key/value rows under the body. */
  rows?: Array<[string, string]>;
  /** Chips under the rows. */
  chips?: string[];
  /** Small caption above the chips. */
  chipsLabel?: string;
};

type Options = {
  root: HTMLElement;
  items: StackItem[];
  /** Accessible name for the rail. */
  label: string;
};

export function initStack({ root, items, label }: Options): void {
  const railHost = qs<HTMLElement>('[data-stack-rail]', root);
  const panelHost = qs<HTMLElement>('[data-stack-panel]', root);
  if (!railHost || !panelHost || items.length === 0) return;

  const buttons = items.map((item, i) =>
    el(
      'button',
      {
        type: 'button',
        class: 'rail__item',
        role: 'tab',
        id: `rail-${item.id}`,
        'aria-controls': `panel-${item.id}`,
        'aria-selected': String(i === 0),
        tabindex: i === 0 ? '0' : '-1',
      },
      [
        el('span', { class: 'rail__ord' }, [item.ordinal]),
        el('span', { class: 'rail__label' }, [item.label]),
      ],
    ),
  );

  const panels = items.map((item, i) =>
    el(
      'div',
      {
        class: 'panel',
        role: 'tabpanel',
        id: `panel-${item.id}`,
        'aria-labelledby': `rail-${item.id}`,
        hidden: i !== 0,
      },
      [
        // Two real columns: prose stacks on the left, figure and data on the
        // right. Each column packs naturally, so neither can stretch the other
        // apart and leave dead space between title and body.
        el('div', { class: 'panel__main' }, [
          el('h3', { class: 'panel__title' }, [item.title]),
          el('p', { class: 'panel__body' }, [item.body]),
          ...(item.note ? [el('p', { class: 'panel__note' }, [item.note])] : []),
        ]),
        el('div', { class: 'panel__side' }, [
          ...(item.glyph
            ? [
                el('div', { class: 'figure figure--concept', 'data-glyph': item.glyph }, [
                  el('canvas', {}),
                ]),
              ]
            : []),
          ...(item.rows
            ? [
                el(
                  'dl',
                  { class: 'panel__rows' },
                  item.rows.flatMap(([k, v]) => [el('dt', {}, [k]), el('dd', {}, [v])]),
                ),
              ]
            : []),
        ]),
        ...(item.chips
          ? [
              el('div', { class: 'panel__chips' }, [
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

  railHost.setAttribute('role', 'tablist');
  railHost.setAttribute('aria-label', label);
  railHost.replaceChildren(...buttons);
  panelHost.replaceChildren(...panels);

  /**
   * A figure animates only while its panel is on screen. A hidden panel has no
   * box to measure, so the concept is mounted the first time its panel is shown
   * and the previous one is torn down — one running canvas at a time.
   */
  let live: ConceptHandle | null = null;
  let livePanel: HTMLElement | null = null;

  const activate = (panel: HTMLElement): void => {
    if (livePanel === panel) return;
    const host = panel.querySelector<HTMLElement>('.figure--concept');
    if (!host) return;
    const item = items.find((it) => `panel-${it.id}` === panel.id);
    live?.destroy();
    live = initConcept(host, host.dataset.glyph as ConceptName, item?.tags ?? []);
    livePanel = panel;
    host.classList.add('is-in');
  };

  const select = (index: number, focus = false): void => {
    buttons.forEach((btn, i) => {
      btn.setAttribute('aria-selected', String(i === index));
      btn.tabIndex = i === index ? 0 : -1;
    });
    panels.forEach((panel, i) => {
      panel.hidden = i !== index;
      if (i === index) activate(panel);
    });
    root.style.setProperty('--active', String(index));
    if (focus) buttons[index]?.focus();
  };

  buttons.forEach((btn, i) => {
    btn.addEventListener('click', () => select(i));
    btn.addEventListener('keydown', (event) => {
      const last = buttons.length - 1;
      let next = -1;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = i === last ? 0 : i + 1;
      else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = i === 0 ? last : i - 1;
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
