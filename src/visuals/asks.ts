/**
 * The three questions, set the way Aaru sets its own: a numbered list beside
 * one framed view. Choosing a question opens it to the concrete questions an
 * institution would bring, and redraws the model in the view from another
 * part of the world. On a phone every question stands open.
 */

import { initWorld } from './world';

export function initAsks(root: ParentNode = document): void {
  const box = root.querySelector<HTMLElement>('[data-asks]');
  if (!box) return;
  const items = Array.from(box.querySelectorAll<HTMLElement>('[data-ask]'));
  const host = box.querySelector<HTMLElement>('[data-ask-world]');
  const label = box.querySelector<HTMLElement>('[data-ask-label]');
  let world: { destroy: () => void } | null = null;
  const seeds = [2023, 911, 4417];

  const show = (i: number, focus = false): void => {
    items.forEach((it, k) => {
      const on = k === i;
      it.classList.toggle('is-open', on);
      const b = it.querySelector<HTMLButtonElement>('button');
      b?.setAttribute('aria-expanded', String(on));
      if (on && focus) b?.focus();
    });
    if (label) label.textContent = items[i]?.dataset['label'] ?? '';
    if (host) {
      world?.destroy();
      world = initWorld(host, { seed: seeds[i] ?? 2023, drift: 4, every: 4.2, view: 'above', ink: '236, 228, 214' });
    }
  };

  items.forEach((it, i) => {
    const b = it.querySelector<HTMLButtonElement>('button');
    b?.addEventListener('click', () => show(i));
    b?.addEventListener('keydown', (e) => {
      const n = items.length;
      const go = e.key === 'ArrowDown' ? (i + 1) % n : e.key === 'ArrowUp' ? (i - 1 + n) % n : -1;
      if (go < 0) return;
      e.preventDefault();
      show(go, true);
    });
  });
  box.classList.add('is-live');
  show(0);
}
