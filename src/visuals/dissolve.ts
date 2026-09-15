/**
 * The seam between two grounds: a shallow, ordered lattice.
 *
 * A halftone of squares on a fixed grid. Each cell holds one square of the
 * next ground whose side grows linearly down the band — from nothing at the
 * top to the full cell at the bottom — so the crossing is a regular lattice
 * that darkens (or lightens) monotonically, never confetti. The two grounds
 * are read from whatever the seam sits between and painted in device pixels,
 * so every edge stays hard. Painted once, repainted only on resize.
 */

import { dpr } from '../lib/prefers';
import { onResize } from '../lib/ticker';

export type DissolveHandle = { destroy: () => void };

type RGB = [number, number, number];

const DARK: RGB = [18, 18, 20]; // --ground (dark), the fallback
const LIGHT: RGB = [247, 245, 240]; // --ground (light), the fallback

/** The lattice pitch in device pixels: one cell, one growing square. */
const PITCH = 8;

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

export function initDissolve(host: HTMLElement): DissolveHandle {
  const canvas = host.querySelector<HTMLCanvasElement>('canvas');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return { destroy: () => undefined };

  const toLight = host.dataset['dissolve'] === 'dark-light';

  const draw = (): void => {
    const from = groundOf(host.previousElementSibling) ?? (toLight ? DARK : LIGHT);
    const to = groundOf(host.nextElementSibling) ?? (toLight ? LIGHT : DARK);

    const rect = canvas.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return;
    const ratio = dpr(2);
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);

    const W = canvas.width;
    const H = canvas.height;
    const img = ctx.createImageData(W, H);
    const cellRows = Math.ceil(H / PITCH);
    for (let cy = 0; cy < cellRows; cy++) {
      // Hold the pure grounds at both edges so the seam meets its neighbours
      // exactly; the square's side ramps linearly between them.
      const t = Math.min(1, Math.max(0, ((cy + 0.5) / cellRows) * 1.1 - 0.05));
      // Even sides only, so every square stays centred in its cell and the
      // remainder never collects on one edge into a continuous rule.
      const side = 2 * Math.round((t * PITCH) / 2);
      const inset = (PITCH - side) / 2;
      for (let y = cy * PITCH; y < Math.min(H, (cy + 1) * PITCH); y++) {
        const ly = y - cy * PITCH;
        const inY = ly >= inset && ly < inset + side;
        for (let x = 0; x < W; x++) {
          const lx = x % PITCH;
          const c = inY && lx >= inset && lx < inset + side ? to : from;
          const i = (y * W + x) * 4;
          img.data[i] = c[0]!;
          img.data[i + 1] = c[1]!;
          img.data[i + 2] = c[2]!;
          img.data[i + 3] = 255;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  };

  draw();
  const stopResize = onResize(draw);

  return { destroy: () => stopResize() };
}
