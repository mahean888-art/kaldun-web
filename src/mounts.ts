/**
 * Page composition. The prose lives in index.html; this fills in the parts that
 * are driven by data, and points every action at the right destination.
 */

import { qs, qsa, el } from './lib/dom';
import { initInstrument } from './visuals/instrument';
import { ACTIONS } from './data/actions';
import { RECORD_BANDS } from './data/record';
import { EMAIL } from './data/site';

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

/** The actions: five rows. */
function mountActions(root: ParentNode): void {
  const host = qs<HTMLElement>('[data-actions]', root);
  if (!host) return;
  host.append(
    ...ACTIONS.map((a) =>
      el('li', { class: 'row' }, [
        el('span', { class: 'row__no' }, [a.ordinal]),
        el('span', { class: 'row__head' }, [a.verb]),
        el('span', { class: 'row__text' }, [a.line]),
      ]),
    ),
  );
}

/** The record: four rows. */
function mountRecord(root: ParentNode): void {
  const host = qs<HTMLElement>('[data-record-rows]', root);
  if (!host) return;
  host.append(
    ...RECORD_BANDS.map((b) =>
      el('li', { class: 'row' }, [
        el('span', { class: 'row__no' }, [b.ordinal]),
        el('span', { class: 'row__head row__head--sans' }, [b.name]),
        el('span', { class: 'row__text' }, [b.body]),
      ]),
    ),
  );
}

/**
 * The decision form composes a mail. Nothing is stored anywhere: the fields
 * become the subject and body of a message to the address, in the sender's
 * own mail client.
 */
function wireForm(root: ParentNode): void {
  const form = qs<HTMLFormElement>('[data-decision-form]', root);
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const get = (k: string): string => String(data.get(k) ?? '').trim();
    const body = [
      `The decision:\n${get('decision')}`,
      `What is at stake:\n${get('stake')}`,
      `What would change my mind:\n${get('change')}`,
      `Reply to: ${get('reply')}`,
    ].join('\n\n');
    const href = `mailto:${EMAIL}?subject=${encodeURIComponent('Bring us a decision')}&body=${encodeURIComponent(body)}`;
    form.dataset['mailto'] = href;
    window.location.href = href;
  });
}

export function mountHome(root: ParentNode = document): void {
  wireEmail(root);
  mountActions(root);
  mountRecord(root);
  wireForm(root);
  const instrument = qs<HTMLElement>('[data-instrument]', root);
  if (instrument) initInstrument(instrument);
}
