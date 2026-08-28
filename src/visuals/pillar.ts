/**
 * The Record pillar: a classical column set from tiny digits — the ledger as
 * architecture. Most glyphs are pale ink; a scattering stand amber for the
 * claims still open. Every few seconds one open claim resolves: its glyph
 * settles from amber to pale, the way a dashed line becomes solid.
 */

import { seeded } from '../lib/math';
import { dpr, prefersReducedMotion } from '../lib/prefers';
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

type Cell = { px: number; py: number; glyph: string; tone: 'open' | 'gold' | 'ink'; alpha: number };

export function initPillar(canvas: HTMLCanvasElement): PillarHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { destroy: () => undefined };

  const reduced = prefersReducedMotion();
  let cells: Cell[] = [];
  let font = 10;

  // The pillar takes the ink of the band it stands on.
  const dark = Boolean(canvas.closest('.theme-dark'));
  const INK = dark ? '242, 237, 227' : '14, 17, 22';
  const OPEN = dark ? '226, 192, 127' : '138, 100, 19';
  const GOLD = dark ? '154, 122, 69' : '122, 95, 42';

  const paintCell = (c: Cell): void => {
    ctx.clearRect(c.px - font * 0.6, c.py - font * 0.6, font * 1.2, font * 1.2);
    if (c.tone === 'open') ctx.fillStyle = `rgba(${OPEN}, ${(0.85 * c.alpha).toFixed(3)})`;
    else if (c.tone === 'gold') ctx.fillStyle = `rgba(${GOLD}, ${(0.7 * c.alpha).toFixed(3)})`;
    else ctx.fillStyle = `rgba(${INK}, ${((dark ? 0.6 : 0.5) * c.alpha).toFixed(3)})`;
    ctx.fillText(c.glyph, c.px, c.py);
  };

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
    const cell = Math.max(6, Math.floor(w / 23));
    font = Math.floor(cell * 0.92);
    ctx.font = `500 ${font}px "Geist Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    cells = [];
    for (let gy = 0; gy < Math.floor(h / cell); gy++) {
      const py = (gy + 0.5) * cell;
      const ny = py / h;
      // Find the row's half-width and set its glyphs symmetric about the
      // axis, so the silhouette's edges are clean rather than grid-jagged.
      let hw = 0;
      for (let probe = 1; probe >= 0; probe -= 1 / 64) {
        if (inside(probe, ny)) {
          hw = probe;
          break;
        }
      }
      if (hw === 0) continue;
      const halfPx = hw * (w / 2);
      const n = Math.max(1, Math.round((halfPx * 2) / cell));
      for (let k = 0; k < n; k++) {
        const px = w / 2 - halfPx + (k + 0.5) * ((halfPx * 2) / n);
        const r = rnd();
        const glyph =
          r < 0.82 ? String(Math.floor(rnd() * 10)) : r < 0.94 ? '·' : (['%', '/', '='][Math.floor(rnd() * 3)] ?? '·');
        const t = rnd();
        const tone: Cell['tone'] = t < 0.055 ? 'open' : t < 0.13 ? 'gold' : 'ink';
        const c: Cell = { px, py, glyph, tone, alpha: 0.5 + rnd() * 0.5 };
        cells.push(c);
        paintCell(c);
      }
    }
  };

  draw();
  const stopResize = onResize(draw);

  // Resolution, one claim at a time: an open (crimson) glyph settles to pale
  // ink and a fresh claim opens elsewhere. State change is the only motion.
  let timer: ReturnType<typeof setInterval> | null = null;
  if (!reduced) {
    timer = setInterval(() => {
      const open = cells.filter((c) => c.tone === 'open');
      const closed = cells.filter((c) => c.tone === 'ink');
      const settle = open[Math.floor(Math.random() * open.length)];
      const reopen = closed[Math.floor(Math.random() * closed.length)];
      ctx.font = `500 ${font}px "Geist Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (settle) {
        settle.tone = 'ink';
        paintCell(settle);
      }
      if (reopen) {
        reopen.tone = 'open';
        paintCell(reopen);
      }
    }, 1600);
  }

  return {
    destroy: () => {
      stopResize();
      if (timer) clearInterval(timer);
    },
  };
}
