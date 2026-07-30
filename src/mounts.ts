/**
 * Page composition. The prose lives in index.html; this fills in the parts that
 * are driven by data, and points every action at the right destination.
 */

import { el, qs, qsa } from './lib/dom';
import { initRingField } from './visuals/ringField';
import { mountMarks } from './visuals/mark';
import { initClock } from './components/clock';
import { initFitText } from './components/fitText';
import { initStack } from './sections/stack';
import { MOVEMENTS } from './data/engine';
import { DOMAINS } from './data/domains';
import { BACKGROUNDS_SHORT } from './data/fellowship';
import { CALENDLY, EMAIL, PILLARS, RECORD_FIELDS, THESIS_SHOWS } from './data/site';

/** Both primary actions open the same scheduling link. */
function wireActions(root: ParentNode): void {
  for (const node of qsa<HTMLAnchorElement>('[data-book]', root)) {
    node.href = CALENDLY;
    node.target = '_blank';
    node.rel = 'noopener noreferrer';
  }
  for (const node of qsa<HTMLAnchorElement>('[data-email]', root)) {
    node.href = `mailto:${EMAIL}`;
    if (!node.textContent?.trim()) node.textContent = EMAIL;
  }
}

export function mountHome(root: ParentNode = document): void {
  mountMarks(root);
  initClock(root);
  initFitText(root);
  wireActions(root);

  const canvas = qs<HTMLCanvasElement>('[data-ring-field]', root);
  if (canvas) initRingField(canvas);

  const pillars = qs('[data-pillars]', root);
  if (pillars) {
    pillars.replaceChildren(
      ...PILLARS.map((pillar) =>
        el('article', { class: 'pillar' }, [
          el('span', { class: 'pillar__ord' }, [pillar.ordinal]),
          el('h3', { class: 'pillar__title' }, [pillar.title]),
          el('p', { class: 'pillar__body' }, [pillar.body]),
        ]),
      ),
    );
  }

  const thesisList = qs('[data-thesis-list]', root);
  if (thesisList) {
    thesisList.replaceChildren(...THESIS_SHOWS.map((item) => el('li', {}, [item])));
  }

  const engineStack = qs<HTMLElement>('[data-engine-stack]', root);
  if (engineStack) {
    initStack({ root: engineStack, items: MOVEMENTS, label: 'Engine movements' });
  }

  const domainStack = qs<HTMLElement>('[data-domain-stack]', root);
  if (domainStack) {
    initStack({ root: domainStack, items: DOMAINS, label: 'Decision domains' });
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

  const backgrounds = qs('[data-backgrounds]', root);
  if (backgrounds) {
    backgrounds.replaceChildren(
      ...BACKGROUNDS_SHORT.map((item) => el('span', { class: 'chip' }, [item])),
    );
  }
}
