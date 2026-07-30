/**
 * Fit a single line of type to its container's width.
 *
 * Used for the footer wordmark, which should span the measure exactly rather
 * than approximately.
 *
 * The measurement is taken from a canvas text metric, so nothing is ever added to
 * the document to measure it. Measuring by resizing the visible element — or by
 * parking a probe node off-screen — lets the layout report a document wider than
 * the viewport while the measurement is in flight.
 */

import { qsa } from '../lib/dom';
import { onResize } from '../lib/ticker';

const PROBE = 100;

let context: CanvasRenderingContext2D | null = null;

function getContext(): CanvasRenderingContext2D | null {
  if (context) return context;
  context = document.createElement('canvas').getContext('2d');
  return context;
}

/** Letter-spacing in px, resolved at the probe size. */
function spacingPx(value: string): number {
  if (value.endsWith('em')) return Number.parseFloat(value) * PROBE;
  if (value.endsWith('px')) return Number.parseFloat(value);
  return 0;
}

function fit(node: HTMLElement): void {
  const parent = node.parentElement;
  const ctx = getContext();
  if (!parent || !ctx) return;

  const available = parent.clientWidth;
  if (available <= 0) return;

  const style = getComputedStyle(node);
  const text =
    style.textTransform === 'uppercase'
      ? (node.textContent ?? '').toUpperCase()
      : (node.textContent ?? '');
  if (!text) return;

  ctx.font = `${style.fontWeight} ${PROBE}px ${style.fontFamily}`;
  const tracking = spacingPx(style.letterSpacing);
  // Advances scale linearly with font-size, so one measurement is enough.
  const measured = ctx.measureText(text).width + tracking * Math.max(text.length - 1, 0);
  if (measured <= 0) return;

  node.style.fontSize = `${Math.floor((available / measured) * PROBE * 0.985 * 100) / 100}px`;
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
