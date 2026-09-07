/**
 * The seam between dark and light, crossed the Aaru way: a stochastic dither.
 * Each cell of a fine grid flips to the destination ground with a probability
 * eased over the band's height, so the theme arrives as grain — granular,
 * hard-edged, and never a gradient. Grains are measured in device pixels and
 * scaled by an exact integer, so nothing is ever resampled. Painted once,
 * repainted only on resize; nothing runs while the page scrolls.
 */

import { seeded } from '../lib/math';
import { dpr } from '../lib/prefers';
import { onResize } from '../lib/ticker';

export type DissolveHandle = { destroy: () => void };

type RGB = [number, number, number];

const DARK: RGB = [18, 18, 20]; // --ground (dark), the fallback
const LIGHT: RGB = [247, 245, 240]; // --ground (light), the fallback

/** An opaque colour from a computed background, or nothing. */
function opaque(value: string): RGB | null {
  const m = value.match(/rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/);
  if (!m || (m[4] !== undefined && Number(m[4]) < 0.5)) return null;
  return [+m[1]!, +m[2]!, +m[3]!];
}

/** The ground a neighbour actually stands on: its own, or its nearest ancestor's. */
function groundOf(start: Element | null): RGB | null {
  let node: Element | null = start;
  while (node && node !== document.documentElement) {
    const c = opaque(getComputedStyle(node).backgroundColor);
    if (c) return c;
    node = node.parentElement;
  }
  return null;
}

/** Grain size in device pixels: one CSS pixel on a 2× screen, two on a 1×. */
const CELL_DEVICE = 2;

function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

export function initDissolve(host: HTMLElement): DissolveHandle {
  const canvas = host.querySelector<HTMLCanvasElement>('canvas');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return { destroy: () => undefined };

  const toLight = host.dataset['dissolve'] === 'dark-light';

  const draw = (): void => {
    // The two grounds are whatever the seam actually sits between — so a
    // colour field dissolves into ink exactly as ink dissolves into bone.
    const from = groundOf(host.previousElementSibling) ?? (toLight ? DARK : LIGHT);
    const to = groundOf(host.nextElementSibling) ?? (toLight ? LIGHT : DARK);

    // The canvas bleeds past the host (see CSS), so size from its own box —
    // the painted grain must cover every pixel the element can occupy.
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return;
    const ratio = dpr(2);
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);

    const cols = Math.ceil(canvas.width / CELL_DEVICE);
    const rows = Math.ceil(canvas.height / CELL_DEVICE);

    // Paint at grain resolution, then scale up with smoothing off — one
    // drawImage instead of tens of thousands of rects.
    const grain = document.createElement('canvas');
    grain.width = cols;
    grain.height = rows;
    const gctx = grain.getContext('2d');
    if (!gctx) return;

    const img = gctx.createImageData(cols, rows);
    const rnd = seeded(1654 + rows);
    for (let y = 0; y < rows; y++) {
      // Hold the pure grounds at both edges so the seam meets its neighbours
      // exactly, and ease the odds between them — twice, so the mixed zone
      // gathers at the middle of the band and the grounds stay pure longer.
      const t = smoothstep(smoothstep((y / (rows - 1)) * 1.14 - 0.07));
      for (let x = 0; x < cols; x++) {
        const c = rnd() < t ? to : from;
        const i = (y * cols + x) * 4;
        img.data[i] = c[0]!;
        img.data[i + 1] = c[1]!;
        img.data[i + 2] = c[2]!;
        img.data[i + 3] = 255;
      }
    }
    gctx.putImageData(img, 0, 0);

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(grain, 0, 0, cols, rows, 0, 0, canvas.width, canvas.height);
  };

  draw();
  const stopResize = onResize(draw);

  return { destroy: () => stopResize() };
}
