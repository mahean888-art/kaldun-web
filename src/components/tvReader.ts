/**
 * The manifesto reader: a television you enter to read.
 *
 * The essay lives once in the section, collapsed behind a "Read as text"
 * control. "Read the manifesto" opens a modal dialog: the page lifts and
 * dims, a horizontal aperture opens into a charcoal set, the screen powers
 * on, and the same essay stands on it as ordinary, selectable text with
 * manual scrolling. The dialog is modal, so focus stays inside; Escape and
 * the Close control both close it and return focus to the control that
 * opened it. Under reduced motion the reader simply appears.
 */

import { qs, qsa } from '../lib/dom';
import { prefersReducedMotion } from '../lib/prefers';

const CLOSE_MS = 260;

export function initTvReader(root: ParentNode = document): void {
  const source = qs<HTMLElement>('#manifesto-text', root);
  const toggle = qs<HTMLButtonElement>('[data-text-toggle]', root);
  if (source && toggle) {
    toggle.addEventListener('click', () => {
      const open = !source.classList.contains('is-open');
      source.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Hide text' : 'Read as text';
    });
  }

  const dialog = qs<HTMLDialogElement>('[data-tv-reader]', root);
  if (!dialog || !source || typeof dialog.showModal !== 'function') return;

  const essay = qs<HTMLElement>('[data-tv-essay]', dialog);
  const screen = qs<HTMLElement>('[data-tv-screen]', dialog);
  if (essay && essay.childElementCount === 0) essay.innerHTML = source.innerHTML;

  const html = document.documentElement;
  let opener: HTMLElement | null = null;
  let closing = false;

  const settle = (): void => {
    dialog.classList.remove('is-on', 'is-closing', 'is-instant');
    html.classList.remove('is-reading');
    closing = false;
    opener?.focus();
    opener = null;
  };

  const open = (from: HTMLElement): void => {
    if (dialog.open) return;
    opener = from;
    const instant = prefersReducedMotion();
    dialog.classList.toggle('is-instant', instant);
    html.classList.add('is-reading');
    dialog.showModal();
    if (screen) screen.scrollTop = 0;
    // One frame after the set exists, the aperture opens.
    requestAnimationFrame(() => {
      dialog.classList.add('is-on');
      screen?.focus({ preventScroll: true });
    });
  };

  const close = (): void => {
    if (closing || !dialog.open) return;
    closing = true;
    if (prefersReducedMotion()) {
      dialog.close();
      return;
    }
    dialog.classList.add('is-closing');
    window.setTimeout(() => dialog.close(), CLOSE_MS);
  };

  dialog.addEventListener('cancel', (event) => {
    // Escape: run the set down before the dialog goes.
    if (!closing && !prefersReducedMotion()) {
      event.preventDefault();
      close();
    }
  });
  dialog.addEventListener('close', settle);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });
  for (const button of qsa<HTMLElement>('[data-tv-close]', dialog)) button.addEventListener('click', close);
  for (const button of qsa<HTMLElement>('[data-tv-open]', root)) {
    button.addEventListener('click', () => open(button));
  }
}
