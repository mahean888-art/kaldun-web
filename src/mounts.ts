/**
 * Page composition. The prose lives in index.html; this fills in the parts
 * driven by data, starts the figures, and points every action at the
 * decision moment.
 */

import { el, qs, qsa } from './lib/dom';
import { mountMarks } from './visuals/mark';
import { initRingField } from './visuals/ringField';
import { initInstrument } from './visuals/instrument';
import { initRotor } from './components/rotor';
import { initDecision } from './components/decision';
import { initTabs } from './sections/tabs';
import { DOMAINS } from './data/domains';
import { EMAIL, RECORD_FIELDS } from './data/site';

function wireEmail(root: ParentNode): void {
  for (const node of qsa<HTMLAnchorElement>('[data-email]', root)) {
    node.href = `mailto:${EMAIL}`;
    if (!node.textContent?.trim()) node.textContent = EMAIL;
  }
}

export function mountHome(root: ParentNode = document): void {
  mountMarks(root);
  initRotor(root);
  wireEmail(root);
  initDecision(root);

  const dial = qs<HTMLCanvasElement>('[data-ring-field]', root);
  if (dial) initRingField(dial);

  const instrument = qs<HTMLElement>('[data-instrument]', root);
  if (instrument) initInstrument(instrument);

  const tabsRoot = qs<HTMLElement>('[data-domain-tabs]', root);
  if (tabsRoot) initTabs({ root: tabsRoot, items: DOMAINS, label: 'Decision domains' });

  const spec = qs('[data-record-spec]', root);
  if (spec) {
    spec.replaceChildren(
      ...RECORD_FIELDS.map(([key, value]) =>
        el('div', { class: 'spec__row' }, [
          el('span', { class: 'spec__key' }, [key]),
          el('span', { class: 'spec__value' }, [value]),
        ]),
      ),
    );
  }
}
