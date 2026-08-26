/**
 * The domain tabs: a horizontal segmented bar, one card at a time — the Aaru
 * pattern. Each card carries the domain's tagline, its three runnable
 * questions, and a small live distribution glyph. Selection is by click and
 * by keyboard.
 */

import { el, qs } from '../lib/dom';
import { initGlyph, type GlyphHandle } from '../visuals/glyphs';
import type { Domain } from '../data/domains';

type Options = {
  root: HTMLElement;
  items: Domain[];
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
        id: `tab-${item.ordinal}`,
        'aria-controls': `card-${item.ordinal}`,
        'aria-selected': String(i === 0),
        tabindex: i === 0 ? '0' : '-1',
      },
      [item.label],
    ),
  );

  const glyphs: HTMLCanvasElement[] = [];
  const cards = items.map((item, i) => {
    const glyph = el('canvas', { class: 'dcard__glyph' }) as unknown as HTMLCanvasElement;
    glyphs.push(glyph);
    return el(
      'article',
      {
        class: 'dcard',
        role: 'tabpanel',
        id: `card-${item.ordinal}`,
        'aria-labelledby': `tab-${item.ordinal}`,
        hidden: i !== 0,
      },
      [
        el('div', { class: 'dcard__head' }, [
          el('div', {}, [
            el('span', { class: 'dcard__ord' }, [item.ordinal]),
            el('h3', { class: 'dcard__title' }, [item.label]),
            el('p', { class: 'dcard__tagline' }, [item.tagline]),
          ]),
          glyph,
        ]),
        el(
          'ul',
          { class: 'dcard__questions' },
          item.questions.map((q) => el('li', {}, [q])),
        ),
      ],
    );
  });

  barHost.setAttribute('role', 'tablist');
  barHost.setAttribute('aria-label', label);
  barHost.replaceChildren(...tabs);
  panelHost.replaceChildren(...cards);

  /** One live glyph at a time; a hidden panel has no box to measure. */
  let live: GlyphHandle | null = null;
  let liveIndex = -1;

  const activate = (index: number): void => {
    if (liveIndex === index) return;
    live?.destroy();
    const canvas = glyphs[index];
    if (canvas) live = initGlyph(canvas, (index + 1) * 733);
    liveIndex = index;
  };

  const select = (index: number, focus = false): void => {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    cards.forEach((card, i) => {
      card.hidden = i !== index;
    });
    activate(index);
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
