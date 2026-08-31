/**
 * The Record pillars: classical columns set from tiny digits — the ledger as
 * architecture. Three variants stand side by side and tell the loop in order:
 *
 *   sealed  — claims keep opening: pale ink glyphs turn pure white and stand.
 *   graded  — reality resolves them: white glyphs settle to grey, one by one.
 *   learned — the column at rest, almost all settled; now and then one glyph
 *             re-opens and settles again — the loop starting over.
 *
 * State change is the only motion.
 */

import { seeded } from '../lib/math';
import { dpr, prefersReducedMotion } from '../lib/prefers';
import { onResize } from '../lib/ticker';

export type PillarHandle = { destroy: () => void };

export type PillarVariant = 'sealed' | 'graded' | 'learned';

/** Silhouette test in normalised coords: y 0 (top) to 1, x -1..1. */
function inside(x: number, y: number): boolean {
  const ax = Math.abs(x);
  if (y < 0.055) return ax < 0.54; // abacus
  if (y < 0.16) return ax < 0.54 - ((y - 0.055) / 0.105) * 0.2; // capital taper
  if (y < 0.19) return ax < 0.37; // neck ring
  if (y < 0.8) return ax < 0.34 + 0.02 * Math.sin(((y - 0.19) / 0.61) * Math.PI); // shaft
  if (y < 0.83) return ax < 0.37; // base ring
  if (y < 0.92) return ax < 0.35 + ((y - 0.83) / 0.09) * 0.16; // plinth taper
  return ax < 0.56; // slab
}

type Cell = { px: number; py: number; glyph: string; tone: 'open' | 'mid' | 'ink'; alpha: number };

type Tuning = {
  /** Share of glyphs standing white when the column first paints. */
  openShare: number;
  /** Share in the middle grey. */
  midShare: number;
  /** What one beat of the clock does. */
  beat: 'open' | 'settle' | 'flicker';
  seed: number;
};

const TUNINGS: Record<PillarVariant, Tuning> = {
  sealed: { openShare: 0.1, midShare: 0.08, beat: 'open', seed: 1654 },
  graded: { openShare: 0.07, midShare: 0.1, beat: 'settle', seed: 1729 },
  learned: { openShare: 0.015, midShare: 0.12, beat: 'flicker', seed: 1900 },
};

export function initPillar(canvas: HTMLCanvasElement, variant: PillarVariant = 'graded'): PillarHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { destroy: () => undefined };

  const tuning = TUNINGS[variant];
  const reduced = prefersReducedMotion();
  let cells: Cell[] = [];
  let font = 10;

  const INK = '185, 183, 178';
  const OPEN = '255, 255, 255';
  const MID = '138, 136, 128';

  const paintCell = (c: Cell): void => {
    ctx.clearRect(c.px - font * 0.6, c.py - font * 0.6, font * 1.2, font * 1.2);
    if (c.tone === 'open') ctx.fillStyle = `rgba(${OPEN}, ${(0.9 * c.alpha).toFixed(3)})`;
    else if (c.tone === 'mid') ctx.fillStyle = `rgba(${MID}, ${(0.7 * c.alpha).toFixed(3)})`;
    else ctx.fillStyle = `rgba(${INK}, ${(0.62 * c.alpha).toFixed(3)})`;
    ctx.fillText(c.glyph, c.px, c.py);
  };

  const setFont = (): void => {
    ctx.font = `500 ${font}px "Geist Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
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

    const rnd = seeded(tuning.seed);
    // Slim columns: fewer, larger glyphs than the old single pillar.
    const cell = Math.max(7, Math.floor(w / 15));
    font = Math.floor(cell * 0.92);
    setFont();

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
        const tone: Cell['tone'] =
          t < tuning.openShare ? 'open' : t < tuning.openShare + tuning.midShare ? 'mid' : 'ink';
        const c: Cell = { px, py, glyph, tone, alpha: 0.5 + rnd() * 0.5 };
        cells.push(c);
        paintCell(c);
      }
    }
  };

  draw();
  const stopResize = onResize(draw);

  const pick = (tone: Cell['tone']): Cell | undefined => {
    const pool = cells.filter((c) => c.tone === tone);
    return pool[Math.floor(Math.random() * pool.length)];
  };

  let timer: ReturnType<typeof setInterval> | null = null;
  let flickerTimer: ReturnType<typeof setTimeout> | null = null;

  if (!reduced) {
    timer = setInterval(() => {
      setFont();
      if (tuning.beat === 'open') {
        // A new claim is sealed; the column holds its census steady by
        // letting the oldest white settle once the count runs high.
        const fresh = pick('ink');
        if (fresh) {
          fresh.tone = 'open';
          paintCell(fresh);
        }
        if (cells.filter((c) => c.tone === 'open').length > cells.length * 0.14) {
          const settle = pick('open');
          if (settle) {
            settle.tone = 'ink';
            paintCell(settle);
          }
        }
      } else if (tuning.beat === 'settle') {
        // Reality answers: one open claim resolves, and one arrives from the
        // sealed column to take its place in the queue.
        const settle = pick('open');
        if (settle) {
          settle.tone = 'ink';
          paintCell(settle);
        }
        const arrive = pick('ink');
        if (arrive) {
          arrive.tone = 'open';
          paintCell(arrive);
        }
      } else {
        // Learned: at rest — one glyph briefly re-opens, then settles again.
        const wake = pick('ink');
        if (wake) {
          wake.tone = 'open';
          paintCell(wake);
          flickerTimer = setTimeout(() => {
            setFont();
            wake.tone = 'ink';
            paintCell(wake);
          }, 700);
        }
      }
    }, variant === 'learned' ? 2600 : 1600);
  }

  return {
    destroy: () => {
      stopResize();
      if (timer) clearInterval(timer);
      if (flickerTimer) clearTimeout(flickerTimer);
    },
  };
}
