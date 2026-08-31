/**
 * Page composition. The prose lives in index.html; this fills in the parts that
 * are driven by data, and points every action at the right destination.
 */

import { qs, qsa } from './lib/dom';
import { mountMarks } from './visuals/mark';
import { initBranches } from './visuals/branches';
import { initDissolve } from './visuals/dissolve';
import { initInstrument } from './visuals/instrument';
import { initPillar, type PillarVariant } from './visuals/pillar';
import { initRotor } from './components/rotor';
import { initClock } from './components/clock';
import { initDecision } from './components/decision';
import { initDomainIndex } from './sections/domainIndex';
import { DOMAINS } from './data/domains';
import { EMAIL } from './data/site';

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

  for (const seam of qsa<HTMLElement>('[data-dissolve]', root)) {
    initDissolve(seam);
  }

  for (const canvas of qsa<HTMLCanvasElement>('canvas[data-pillar]', root)) {
    initPillar(canvas, (canvas.dataset['pillar'] || 'graded') as PillarVariant);
  }

  const index = qs<HTMLElement>('[data-domain-index]', root);
  if (index) {
    initDomainIndex({ root: index, items: DOMAINS, label: 'Use cases' });
  }
}
