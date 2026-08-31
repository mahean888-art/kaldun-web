/**
 * Page composition. The prose lives in index.html; this fills in the parts that
 * are driven by data, and points every action at the right destination.
 */

import { el, qs, qsa } from './lib/dom';
import { mountMarks } from './visuals/mark';
import { initBranches } from './visuals/branches';
import { initInstrument } from './visuals/instrument';
import { initPillar } from './visuals/pillar';
import { initRotor } from './components/rotor';
import { initClock } from './components/clock';
import { initDecision } from './components/decision';
import { initTabs } from './sections/tabs';
import { DOMAINS } from './data/domains';
import { EMAIL, RECORD_FIELDS } from './data/site';

/** The address is data, not markup — one place to change it. */
function wireEmail(root: ParentNode): void {
  for (const node of qsa<HTMLAnchorElement>('[data-email]', root)) {
    node.href = `mailto:${EMAIL}`;
    if (!node.textContent?.trim()) node.textContent = EMAIL;
  }
}

export function mountHome(root: ParentNode = document): void {
  mountMarks(root);
  initRotor(root);
  initClock(root);
  wireEmail(root);
  initDecision(root);

  const branches = qs<HTMLCanvasElement>('canvas[data-branches]', root);
  if (branches) initBranches(branches);

  const instrument = qs<HTMLElement>('[data-instrument]', root);
  if (instrument) initInstrument(instrument);

  const pillar = qs<HTMLCanvasElement>('canvas[data-pillar]', root);
  if (pillar) initPillar(pillar);

  const domainTabs = qs<HTMLElement>('[data-domain-tabs]', root);
  if (domainTabs) {
    initTabs({ root: domainTabs, items: DOMAINS, label: 'Use cases' });
  }

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
