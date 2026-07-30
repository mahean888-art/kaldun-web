/**
 * Isolated prediction versus connected foresight.
 *
 * Tabs across the five domains; each tab replaces the whole worked example. The
 * left column is what a single answer gives you, the right column is what the
 * Engine returns, and the bottom is the action someone actually took.
 */

import { el } from '../lib/dom';
import { DECISIONS } from '../data/decisions';
import { initTabs } from '../components/tabs';

function futureRow(future: { label: string; odds: number; note?: string }): HTMLElement {
  const fill = el('span', { class: 'meter__fill' });
  fill.style.setProperty('--v', String(future.odds));
  return el('div', { class: 'future' }, [
    el('span', { class: 'future__label' }, [future.label]),
    el('span', { class: 'future__odds' }, [`${future.odds}%`]),
    el('div', { class: 'future__meter meter' }, [fill]),
    ...(future.note ? [el('span', { class: 'future__note' }, [future.note])] : []),
  ]);
}

export function renderDecisionModule(root: HTMLElement): void {
  const tablist = el('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Decision domains' });
  const panels: HTMLElement[] = [];

  DECISIONS.forEach((decision, i) => {
    const id = `decision-panel-${decision.domainId}`;
    const tabId = `decision-tab-${decision.domainId}`;

    tablist.append(
      el(
        'button',
        {
          type: 'button',
          class: 'tab',
          role: 'tab',
          id: tabId,
          'aria-controls': id,
          'aria-selected': String(i === 0),
          'data-tab': decision.domainId,
          tabindex: i === 0 ? '0' : '-1',
        },
        [decision.tab],
      ),
    );

    const panel = el(
      'div',
      {
        class: 'tabpanel decision',
        role: 'tabpanel',
        id,
        'aria-labelledby': tabId,
        tabindex: '0',
        hidden: i !== 0,
      },
      [
        el('div', { class: 'decision__head' }, [
          el('span', { class: 't-label t-label--bronze' }, [decision.label]),
        ]),
        el('div', { class: 'decision__grid' }, [
          el('div', { class: 'decision__col' }, [
            el('span', { class: 'decision__col-title' }, ['Current view']),
            el('p', { class: 'decision__col-body' }, [decision.currentView]),
            el('span', { class: 'decision__col-tag' }, ['One answer']),
          ]),
          el('div', { class: 'decision__col decision__col--kaldun' }, [
            el('span', { class: 'decision__col-title' }, ['Kaldun']),
            el('p', { class: 'decision__col-body' }, [decision.kaldun]),
            el('p', { class: 'decision__col-qualifier' }, [decision.qualifier]),
            el('span', { class: 'decision__col-tag' }, ['Connected futures']),
          ]),
        ]),
        el('div', { class: 'decision__futures' }, [
          el('div', { class: 'console__pane-title' }, [
            el('span', {}, ['Futures returned']),
            el('span', { class: 'footnote' }, ['Illustrative']),
          ]),
          ...decision.futures.map(futureRow),
        ]),
        el('div', { class: 'decision__outcome' }, [
          el('span', { class: 'decision__col-title' }, ['Decision']),
          el('p', { class: 'decision__decision' }, [decision.decision]),
          el(
            'a',
            { class: 'link-arrow', href: `domains.html#${decision.domainId}` },
            ['See the full decision', el('span', {}, ['→'])],
          ),
        ]),
      ],
    );

    panels.push(panel);
  });

  root.replaceChildren(tablist, ...panels);

  // Meters fill when their panel becomes visible.
  const animate = (): void => {
    for (const panel of panels) {
      if (panel.hidden) {
        panel.classList.remove('is-in');
      } else {
        requestAnimationFrame(() => panel.classList.add('is-in'));
      }
    }
  };

  // Tabs are wired here directly, so the module is not marked [data-tabs]
  // and the global initialiser leaves it alone.
  initTabs(root, animate);
  animate();

  // Keep the first panel's meters at zero until the module is scrolled to.
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.disconnect();
        animate();
      }
    },
    { threshold: 0.2 },
  );
  io.observe(root);
}
