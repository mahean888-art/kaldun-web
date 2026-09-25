/**
 * Page composition. The prose lives in index.html; this fills in the parts that
 * are driven by data, and points every action at the right destination.
 */

import { qs, qsa, el } from './lib/dom';
import { initInstrument } from './visuals/instrument';
import { ACTIONS } from './data/actions';
import { EMAIL, FORM_ENDPOINT } from './data/site';

function wireEmail(root: ParentNode): void {
  for (const node of qsa<HTMLAnchorElement>('[data-email]', root)) {
    node.href = `mailto:${EMAIL}`;
    const slot = node.querySelector<HTMLElement>('[data-email-text]');
    if (slot) slot.textContent = EMAIL;
    else if (!node.textContent?.trim()) node.textContent = EMAIL;
  }
  for (const node of qsa<HTMLAnchorElement>('[data-mail]', root)) {
    const subject = node.dataset['mail'] ?? '';
    node.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}`;
  }
}

/** The actions: an index of five, each read as one phrase — Allocate capital. */
function mountActions(root: ParentNode): void {
  const host = qs<HTMLElement>('[data-actions]', root);
  if (!host) return;
  host.append(
    ...ACTIONS.map((a) =>
      el('li', { class: 'act' }, [
        el('span', { class: 'act__no' }, [a.ordinal]),
        el('span', { class: 'act__head' }, [`${a.verb} `, el('em', {}, [a.object])]),
        el('span', { class: 'act__line' }, [a.line]),
      ]),
    ),
  );
}

/**
 * The decision form. With an endpoint configured, the fields are posted there.
 * Without one, or if the post fails, the fields become a mail to the address
 * in the sender's own mail app. Either way the page says what happened, and
 * when it is the mail app, the message is shown ready to copy, so a visitor
 * without a mail app loses nothing.
 */
function wireForm(root: ParentNode): void {
  const form = qs<HTMLFormElement>('[data-decision-form]', root);
  const done = qs<HTMLElement>('[data-form-done]', root);
  if (!form || !done) return;
  const button = qs<HTMLButtonElement>('button[type="submit"]', form);
  const label = button?.textContent ?? '';
  const head = qs<HTMLElement>('[data-done-head]', done);
  const lead = qs<HTMLElement>('[data-done-lead]', done);
  const text = qs<HTMLElement>('[data-done-text]', done);
  const actions = qs<HTMLElement>('[data-done-actions]', done);
  const copy = qs<HTMLButtonElement>('[data-done-copy]', done);
  const mail = qs<HTMLAnchorElement>('[data-done-mail]', done);
  const subject = 'Bring us a decision';
  let message = '';

  const reveal = (): void => {
    done.hidden = false;
    done.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const showSent = (reply: string): void => {
    if (head) head.textContent = 'Received';
    if (lead) lead.textContent = `Thank you. We will reply to ${reply}.`;
    if (text) text.hidden = true;
    if (actions) actions.hidden = true;
    reveal();
  };

  const showMail = (body: string, href: string): void => {
    message = `To: ${EMAIL}\nSubject: ${subject}\n\n${body}`;
    if (text) {
      text.hidden = false;
      text.textContent = message;
    }
    if (actions) actions.hidden = false;
    if (mail) mail.href = href;
    if (copy) copy.textContent = 'Copy message';
    reveal();
  };

  copy?.addEventListener('click', () => {
    void navigator.clipboard?.writeText(message).then(
      () => {
        copy.textContent = 'Copied';
      },
      () => {
        if (text) window.getSelection()?.selectAllChildren(text);
      },
    );
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const get = (k: string): string => String(data.get(k) ?? '').trim();
    const fields = { decision: get('decision'), stake: get('stake'), change: get('change'), reply: get('reply') };
    const body = [
      `The decision:\n${fields.decision}`,
      `What is at stake:\n${fields.stake}`,
      `What would change my mind:\n${fields.change}`,
      `Reply to: ${fields.reply}`,
    ].join('\n\n');
    const href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    form.dataset['mailto'] = href;

    const byMail = (): void => {
      showMail(body, href);
      window.location.href = href;
    };

    if (!FORM_ENDPOINT) {
      byMail();
      return;
    }
    if (button) {
      button.disabled = true;
      button.textContent = 'Sending';
    }
    fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...fields, _subject: subject }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        showSent(fields.reply);
      })
      .catch(byMail)
      .finally(() => {
        if (button) {
          button.disabled = false;
          button.textContent = label;
        }
      });
  });
}

export function mountHome(root: ParentNode = document): void {
  wireEmail(root);
  mountActions(root);
  wireForm(root);
  const instrument = qs<HTMLElement>('[data-instrument]', root);
  if (instrument) initInstrument(instrument);
}
