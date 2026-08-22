/**
 * The changing verb.
 *
 * "Run the world forward before you decide." — the last word steps through the
 * decisions Ulmo is pointed at and comes to rest on the one it started with.
 * The words roll through a crimson slot: each rises into the place the last one
 * left, holds long enough to be read, and the slot's width follows it so the
 * full stop never jumps.
 *
 * The sequence plays once. It is a statement of range, not a loop that nags.
 */

import { qsa } from '../lib/dom';
import { prefersReducedMotion } from '../lib/prefers';

/** Starts and ends on the word already in the markup. */
const WORDS = [
  'decide',
  'allocate',
  'invest',
  'insure',
  'expand',
  'deploy',
  'build',
  'commit',
  'decide',
];

/** How long a word stands before the next one takes its place. */
const HOLD = 1400;
/** Must match the transition in rotor.css. */
const SWAP = 420;

function mount(host: HTMLElement): void {
  const ghost = document.createElement('span');
  ghost.className = 'rotor__ghost';
  ghost.setAttribute('aria-hidden', 'true');

  // The slot is the highlight, and it clips the roll.
  const slot = document.createElement('span');
  slot.className = 'rotor__slot';

  let word = document.createElement('span');
  word.className = 'rotor__word is-in';
  word.textContent = WORDS[0] ?? 'decide';

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

  if (prefersReducedMotion()) return;

  let index = 0;
  let timer = 0;

  const step = (): void => {
    index += 1;
    const next = WORDS[index];
    if (!next) return;

    const outgoing = word;
    const incoming = document.createElement('span');
    incoming.className = 'rotor__word is-below';
    incoming.textContent = next;
    slot.append(incoming);

    // The width leads the word by a hair, so the stop settles as it arrives.
    setWidth(next);
    ghost.textContent = next;

    // Next frame, so the entering word animates from below rather than appearing.
    requestAnimationFrame(() => {
      outgoing.classList.remove('is-in');
      outgoing.classList.add('is-above');
      incoming.classList.remove('is-below');
      incoming.classList.add('is-in');
    });

    window.setTimeout(() => outgoing.remove(), SWAP + 60);
    word = incoming;

    if (index < WORDS.length - 1) timer = window.setTimeout(step, HOLD);
  };

  timer = window.setTimeout(step, HOLD);

  // If the tab is hidden the sequence would play to nobody; hold it instead.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) window.clearTimeout(timer);
    else if (index < WORDS.length - 1) timer = window.setTimeout(step, HOLD);
  });
}

export function initRotor(root: ParentNode = document): void {
  for (const host of qsa<HTMLElement>('[data-rotor]', root)) mount(host);
}
