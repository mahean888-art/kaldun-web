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

const DARK: [number, number, number] = [10, 10, 11]; // --ground (dark)
const LIGHT: [number, number, number] = [251, 250, 247]; // --ground (light)

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

  const toLight = host.dataset['dissolve'] !== 'light-dark';
  const from = toLight ? DARK : LIGHT;
  const to = toLight ? LIGHT : DARK;

  const draw = (): void => {
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
