/**
 * Fit a single line of type to its container's width.
 *
 * Used for the footer wordmark, which should span the measure exactly rather
 * than approximately.
 *
 * Measured from a Range over the element's own text, which reports the ink width
 * without adding anything to the document. The wrapper clips, so the brief probe
 * size can never widen the page.
 */

import { qsa } from '../lib/dom';
import { onResize } from '../lib/ticker';

const PROBE = 100;

/** Ink width of the element's text, measured without changing its box. */
function inkWidth(node: HTMLElement): number {
  const range = document.createRange();
  range.selectNodeContents(node);
  return range.getBoundingClientRect().width;
}

function fit(node: HTMLElement): void {
  const parent = node.parentElement;
  if (!parent) return;

  const available = parent.clientWidth;
  if (available <= 0) return;

  // Advances scale linearly with font-size, so one probe gets close; a second
  // pass absorbs hinting and tracking rounding so the fit is exact.
  node.style.fontSize = `${PROBE}px`;
  const probed = inkWidth(node);
  if (probed <= 0) return;

  let size = (available / probed) * PROBE;
  node.style.fontSize = `${size.toFixed(2)}px`;

  const actual = inkWidth(node);
  if (actual > 0) size *= available / actual;

  // A hair under, so a sub-pixel rounding can never clip the final letter.
  node.style.fontSize = `${(size * 0.997).toFixed(2)}px`;
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
