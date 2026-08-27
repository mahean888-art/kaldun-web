/**
 * The decision moment.
 *
 * Every "Run a decision" opens this, not a scheduler: three questions and a
 * contact — what decision, when must it be made, what would change your mind.
 * Sending composes a mail to the single address with the answers in place; a
 * quiet secondary link books a call for those who prefer to talk first.
 */

import { qs, qsa } from '../lib/dom';
import { CALENDLY, EMAIL } from '../data/site';

export function initDecision(root: ParentNode = document): void {
  const dialog = qs<HTMLDialogElement>('[data-decision]', root);
  const form = qs<HTMLFormElement>('[data-decision-form]', root);
  if (!dialog || !form) return;

  const calendly = qs<HTMLAnchorElement>('[data-calendly]', dialog);
  if (calendly) calendly.href = CALENDLY;

  for (const opener of qsa<HTMLAnchorElement>('[data-book]', root)) {
    opener.addEventListener('click', (event) => {
      event.preventDefault();
      dialog.showModal();
    });
  }

  qs<HTMLButtonElement>('[data-decision-close]', dialog)?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    // A click on the backdrop lands on the dialog element itself.
    if (event.target === dialog) dialog.close();
  });

  form.addEventListener('submit', () => {
    // The site's grammar, in the first interaction anyone has with it.
    const stamp = qs<HTMLElement>('[data-committed]', dialog);
    if (stamp) {
      const now = new Date();
      const pad = (n: number): string => String(n).padStart(2, '0');
      stamp.textContent = `COMMITTED ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} UTC`;
    }
    const data = new FormData(form);
    const body = [
      `What decision:`,
      String(data.get('decision') ?? ''),
      ``,
      `When must it be made:`,
      String(data.get('deadline') ?? ''),
      ``,
      `What would change your mind:`,
      String(data.get('evidence') ?? ''),
      ``,
      `Contact: ${String(data.get('contact') ?? '')}`,
    ].join('\n');
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent('Run a decision')}&body=${encodeURIComponent(body)}`;
  });
}
