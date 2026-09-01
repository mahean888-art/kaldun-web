/**
 * The changing verb.
 *
 * "Run the world forward before you decide." — the verb steps through the
 * institutional commitments the machine is pointed at. Slow, quiet, and
 * deliberate: each verb holds long enough to be read, crossfades to the
 * next, and the slot's width snaps with the ghost so the full stop never
 * jumps. The cycle pauses while the reader hovers, focuses, or selects, and
 * never runs at all under reduced motion.
 *
 * Each change is announced as a `fm:verb` event, so the hero's fan of
 * futures can answer the word in view.
 */

import { qsa } from '../lib/dom';
import { prefersReducedMotion } from '../lib/prefers';

/** Starts on `decide` and returns to it; five verbs, no more. */
const VERBS = ['decide', 'commit', 'allocate', 'build', 'insure'];

/** How long a verb stands before the next takes its place. */
const HOLD = 3200;
/** Must match the crossfade in rotor css. */
const FADE = 320;

function mount(host: HTMLElement): void {
  const ghost = document.createElement('span');
  ghost.className = 'rotor__ghost';
  ghost.setAttribute('aria-hidden', 'true');

  const slot = document.createElement('span');
  slot.className = 'rotor__slot';

  let word = document.createElement('span');
  word.className = 'rotor__word is-in';
  word.textContent = VERBS[0] ?? 'decide';

  ghost.textContent = word.textContent;
  slot.append(word);
  host.replaceChildren(ghost, slot);

  /** The ghost sits in flow, so it fixes the baseline and gives us a ruler. */
  const measure = (text: string): number => {
    const held = ghost.textContent;
    ghost.textContent = text;
    const width = ghost.getBoundingClientRect().width;
    ghost.textContent = held;
    return width;
  };

  const setWidth = (text: string): void => {
    const width = measure(text);
    if (width > 0) host.style.width = `${width.toFixed(2)}px`;
  };

  setWidth(word.textContent ?? '');
  if (document.fonts) {
    document.fonts.ready.then(() => setWidth(word.textContent ?? '')).catch(() => undefined);
  }

  const announce = (verb: string): void => {
    document.dispatchEvent(new CustomEvent('fm:verb', { detail: { verb } }));
  };
  announce(VERBS[0] ?? 'decide');

  if (prefersReducedMotion()) return;

  let index = 0;
  let paused = false;
  let hovered = false;
  let timer = 0;

  const schedule = (): void => {
    window.clearTimeout(timer);
    timer = window.setTimeout(step, HOLD);
  };

  const step = (): void => {
    if (paused || hovered || document.hidden) {
      schedule();
      return;
    }
    // A live selection means someone is reading closely; hold still.
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      schedule();
      return;
    }

    index = (index + 1) % VERBS.length;
    const next = VERBS[index] ?? 'decide';

    const outgoing = word;
    const incoming = document.createElement('span');
    incoming.className = 'rotor__word is-out';
    incoming.textContent = next;
    slot.append(incoming);

    setWidth(next);
    ghost.textContent = next;
    announce(next);

    requestAnimationFrame(() => {
      outgoing.classList.remove('is-in');
      outgoing.classList.add('is-out');
      incoming.classList.remove('is-out');
      incoming.classList.add('is-in');
    });

    window.setTimeout(() => outgoing.remove(), FADE + 60);
    word = incoming;
    schedule();
  };

  const title = host.closest('.hero__title') ?? host;
  title.addEventListener('mouseenter', () => (hovered = true));
  title.addEventListener('mouseleave', () => (hovered = false));
  title.addEventListener('focusin', () => (paused = true));
  title.addEventListener('focusout', () => (paused = false));

  schedule();
}

export function initRotor(root: ParentNode = document): void {
  for (const host of qsa<HTMLElement>('[data-rotor]', root)) mount(host);
}
