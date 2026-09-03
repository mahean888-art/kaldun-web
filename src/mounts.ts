/**
 * Page composition. The prose lives in index.html; this fills in the parts that
 * are driven by data, and points every action at the right destination.
 */

import { qs, qsa } from './lib/dom';
import { mountMarks } from './visuals/mark';
import { initBranches } from './visuals/branches';
import { initDissolve } from './visuals/dissolve';
import { initInstrument } from './visuals/instrument';
import { initRotor } from './components/rotor';
import { initClock } from './components/clock';
import { initDecision } from './components/decision';
import { initManifesto } from './sections/manifesto';
import { initDomainPanel } from './sections/domainPanel';
import { DOMAINS } from './data/domains';
import { EMAIL } from './data/site';

/** The address is data, not markup — one place to change it. */
function wireEmail(root: ParentNode): void {
  for (const node of qsa<HTMLAnchorElement>('[data-email]', root)) {
    node.href = `mailto:${EMAIL}`;
    if (!node.textContent?.trim()) node.textContent = EMAIL;
  }
}

/** The record slip's one calm expansion. */
function wireSlip(root: ParentNode): void {
  const toggle = qs<HTMLButtonElement>('[data-slip-toggle]', root);
  const history = qs<HTMLElement>('[data-slip-history]', root);
  if (!toggle || !history) return;
  toggle.addEventListener('click', () => {
    const open = history.hidden;
    history.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  });
}

export function mountHome(root: ParentNode = document): void {
  mountMarks(root);
  initRotor(root);
  initClock(root);
  wireEmail(root);
  initDecision(root);
  wireSlip(root);

  const branches = qs<HTMLCanvasElement>('canvas[data-branches]', root);
  if (branches) initBranches(branches);

  const manifesto = qs<HTMLElement>('[data-manifesto]', root);
  if (manifesto) initManifesto(manifesto);

  const instrument = qs<HTMLElement>('[data-instrument]', root);
  if (instrument) initInstrument(instrument);

  for (const seam of qsa<HTMLElement>('[data-dissolve]', root)) {
    initDissolve(seam);
  }

  const domains = qs<HTMLElement>('[data-domain-panel]', root);
  if (domains) {
    initDomainPanel({ root: domains, items: DOMAINS, label: 'Domains' });
  }
}
