/**
 * The Record as one object: a tall pillar of four connected bands, and the
 * explanation of whichever band is selected beside it. The pillar is still;
 * selection changes its illumination, nothing else. Every explanation is
 * rendered once and stacked in the same cell, offset to sit level with its
 * band, so the section never changes height.
 */

import { el } from '../lib/dom';
import { wireTabs } from '../lib/tabs';
import type { Band } from '../data/record';

type Options = {
  root: HTMLElement;
  bands: Band[];
};

export function initPillar({ root, bands }: Options): void {
  if (bands.length === 0) return;

  const tabs = bands.map((band, i) =>
    el(
      'button',
      {
        type: 'button',
        class: 'pillar__band',
        role: 'tab',
        id: `record-band-${band.ordinal}`,
        'aria-controls': `record-panel-${band.ordinal}`,
        'aria-selected': String(i === 0),
        tabindex: i === 0 ? '0' : '-1',
      },
      [el('span', { class: 'pillar__no' }, [band.ordinal]), el('span', { class: 'pillar__name' }, [band.name])],
    ),
  );

  const pillar = el(
    'div',
    { class: 'pillar', role: 'tablist', 'aria-label': 'What the record holds', 'aria-orientation': 'vertical' },
    tabs,
  );

  const panels = bands.map((band, i) =>
    el(
      'div',
      {
        class: 'inspect__panel',
        id: `record-panel-${band.ordinal}`,
        role: 'tabpanel',
        'aria-labelledby': `record-band-${band.ordinal}`,
        'aria-hidden': String(i !== 0),
        style: `--i: ${i}`,
      },
      [
        el('p', { class: 'inspect__label' }, [`${band.ordinal} — ${band.name}`]),
        el('h3', { class: 'inspect__claim' }, [band.claim]),
        el('p', { class: 'inspect__body' }, [band.body]),
      ],
    ),
  );

  root.append(pillar, el('div', { class: 'inspect__stack' }, panels));
  wireTabs({ tabs, panels });
}
