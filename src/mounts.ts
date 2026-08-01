/**
 * Page composition. The prose lives in index.html; this fills in the parts that
 * are driven by data, and points every action at the right destination.
 */

import { el, qs, qsa } from './lib/dom';
import { initRingField } from './visuals/ringField';
import { mountMarks } from './visuals/mark';
import { initFutures, type FuturesVariant } from './visuals/futures';
import { initGlobe } from './visuals/globe';
import { initPillar } from './visuals/pillar';
import { initClock } from './components/clock';
import { initFitText } from './components/fitText';
import { initStack } from './sections/stack';
import { initTabs } from './sections/tabs';
import { MOVEMENTS } from './data/engine';
import { DOMAINS } from './data/domains';
import { BLOCKS } from './data/fellowship';
import { CALENDLY, EMAIL, RECORD_FIELDS, STATEMENTS, THESIS_SHOWS } from './data/site';

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

  for (const node of qsa<HTMLCanvasElement>('canvas[data-futures]', root)) {
    initFutures(node, node.dataset.futures as FuturesVariant);
  }

  const statements = qs('[data-statements]', root);
  if (statements) {
    statements.replaceChildren(...STATEMENTS.map((line) => el('li', {}, [line])));
  }

  const thesisList = qs('[data-thesis-list]', root);
  if (thesisList) {
    thesisList.replaceChildren(...THESIS_SHOWS.map((item) => el('li', {}, [item])));
  }

  const engineStack = qs<HTMLElement>('[data-engine-stack]', root);
  if (engineStack) {
    initStack({ root: engineStack, items: MOVEMENTS, label: 'Engine movements' });
  }

  const domainTabs = qs<HTMLElement>('[data-domain-tabs]', root);
  if (domainTabs) {
    initTabs({ root: domainTabs, items: DOMAINS, label: 'Decision domains' });
  }

  const globe = qs<HTMLCanvasElement>('[data-globe]', root);
  if (globe) initGlobe(globe);

  const pillar = qs<HTMLCanvasElement>('[data-pillar]', root);
  if (pillar) initPillar(pillar);

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

  const blocks = qs('[data-fellowship-blocks]', root);
  if (blocks) {
    blocks.replaceChildren(
      ...BLOCKS.map((block) =>
        el('article', { class: 'block', 'data-reveal': 'fade' }, [
          el('h3', { class: 'block__label' }, [block.label]),
          el('p', { class: 'block__body' }, [block.body]),
          ...(block.items
            ? [
                el(
                  'ul',
                  { class: 'block__items' },
                  block.items.map((item) => el('li', {}, [item])),
                ),
              ]
            : []),
        ]),
      ),
    );
  }
}
