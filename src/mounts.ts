/**
 * Page composition. The prose lives in index.html; this fills in the parts that
 * are driven by data, and points every action at the right destination.
 */

import { qs, qsa, el } from './lib/dom';
import { mountMarks } from './visuals/mark';
import { initBranches } from './visuals/branches';
import { initInstrument } from './visuals/instrument';
import { initRotor } from './components/rotor';
import { initPillar } from './sections/pillar';
import { ACTIONS } from './data/actions';
import { RECORD_BANDS } from './data/record';
import { EMAIL } from './data/site';

/**
 * The address is data, not markup — one place to change it. `[data-email]`
 * shows and links the address; `[data-mail="Subject"]` composes a mail with
 * that subject, so a decision and a residency application arrive distinctly.
 */
function wireEmail(root: ParentNode): void {
  for (const node of qsa<HTMLAnchorElement>('[data-email]', root)) {
    node.href = `mailto:${EMAIL}`;
    if (!node.textContent?.trim()) node.textContent = EMAIL;
  }
  for (const node of qsa<HTMLAnchorElement>('[data-mail]', root)) {
    const subject = node.dataset['mail'] ?? '';
    node.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}`;
  }
}

/** The actions ledger: five rows, static, in the order the essay gives them. */
function mountActions(root: ParentNode): void {
  const host = qs<HTMLElement>('[data-actions]', root);
  if (!host) return;
  host.append(
    ...ACTIONS.map((a) =>
      el('li', { class: 'ledger__row' }, [
        el('span', { class: 'ledger__no' }, [a.ordinal]),
        el('span', { class: 'ledger__verb' }, [a.verb]),
        el('span', { class: 'ledger__object' }, [a.object]),
        el('span', { class: 'ledger__line' }, [a.line]),
      ]),
    ),
  );
}

export function mountHome(root: ParentNode = document): void {
  mountMarks(root);
  initRotor(root);
  wireEmail(root);
  mountActions(root);

  const branches = qs<HTMLCanvasElement>('canvas[data-branches]', root);
  if (branches) initBranches(branches);

  const instrument = qs<HTMLElement>('[data-instrument]', root);
  if (instrument) initInstrument(instrument);

  const pillar = qs<HTMLElement>('[data-pillar]', root);
  if (pillar) initPillar({ root: pillar, bands: RECORD_BANDS });
}
