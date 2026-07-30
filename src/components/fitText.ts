/**
 * Fit a single line of type to its container's width.
 *
 * Used for the footer wordmark, which should span the measure exactly rather
 * than approximately. Measured once, then on debounced resize and after fonts
 * settle — never per frame.
 */

import { qsa } from '../lib/dom';
import { onResize } from '../lib/ticker';

function fit(node: HTMLElement): void {
  const parent = node.parentElement;
  if (!parent) return;

  const available = parent.clientWidth;
  if (available <= 0) return;

  // Measure at a known size against the text's own intrinsic width — a block
  // element's scrollWidth would just report the container. Glyph advances scale
  // linearly with font-size, so one measurement is enough.
  const probe = 100;
  node.style.fontSize = `${probe}px`;
  node.style.width = 'max-content';
  const measured = node.getBoundingClientRect().width;
  node.style.width = '';
  if (measured <= 0) return;

  // A hair under, so letter-spacing rounding can never push past the measure.
  node.style.fontSize = `${Math.floor((available / measured) * probe * 0.982 * 100) / 100}px`;
}

export function initFitText(root: ParentNode = document): void {
  const nodes = qsa<HTMLElement>('[data-fit-text]', root);
  if (nodes.length === 0) return;

  const run = (): void => {
    for (const node of nodes) fit(node);
  };

  run();
  onResize(run);
  if (document.fonts) void document.fonts.ready.then(run);
  window.addEventListener('load', run);
}
