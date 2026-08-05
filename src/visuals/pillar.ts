/**
 * The record pillar: a classical column set from tiny digits — the ledger as
 * architecture. Drawn once per resize; a handful of glyphs are gold or crimson
 * so the mass reads as a record, not a texture.
 */

import { seeded } from '../lib/math';
import { dpr } from '../lib/prefers';
import { onResize } from '../lib/ticker';

export type PillarHandle = { destroy: () => void };

/** Silhouette test in normalised coords: y 0 (top) to 1, x -1..1. */
function inside(x: number, y: number): boolean {
  const ax = Math.abs(x);
  if (y < 0.055) return ax < 0.54; // abacus
  if (y < 0.16) return ax < 0.54 - ((y - 0.055) / 0.105) * 0.2; // capital taper
  if (y < 0.19) return ax < 0.37; // neck ring
  if (y < 0.8) return ax < 0.3 + 0.02 * Math.sin(((y - 0.19) / 0.61) * Math.PI); // shaft
  if (y < 0.83) return ax < 0.37; // base ring
  if (y < 0.92) return ax < 0.35 + ((y - 0.83) / 0.09) * 0.16; // plinth taper
  return ax < 0.56; // slab
}

export function initPillar(canvas: HTMLCanvasElement): PillarHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { destroy: () => undefined };

  const draw = (): void => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 8) return;
    const ratio = dpr(2);
    const w = rect.width;
    const h = rect.height;
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const rnd = seeded(1654);
    const cell = Math.max(7, Math.floor(w / 15));
    const font = Math.floor(cell * 0.92);
    ctx.font = `500 ${font}px "Geist Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let gy = 0; gy < Math.floor(h / cell); gy++) {
      for (let gx = 0; gx < Math.floor(w / cell); gx++) {
        const px = (gx + 0.5) * cell;
        const py = (gy + 0.5) * cell;
        const nx = (px / w) * 2 - 1;
        const ny = py / h;
        if (!inside(nx, ny)) continue;
        const r = rnd();
        const glyph = r < 0.82 ? String(Math.floor(rnd() * 10)) : r < 0.94 ? '·' : ['%', '/', '='][Math.floor(rnd() * 3)] ?? '·';
        const tone = rnd();
        if (tone < 0.05) ctx.fillStyle = 'rgba(185, 31, 46, 0.85)';
        else if (tone < 0.13) ctx.fillStyle = 'rgba(168, 124, 16, 0.8)';
        else ctx.fillStyle = `rgba(16, 16, 16, ${(0.28 + rnd() * 0.4).toFixed(3)})`;
        ctx.fillText(glyph, px, py);
      }
    }
  };

  draw();
  const stopResize = onResize(draw);
  if (document.fonts) document.fonts.ready.then(draw).catch(() => undefined);

  return { destroy: () => stopResize() };
}
