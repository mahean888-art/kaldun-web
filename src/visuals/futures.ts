/**
 * The dissolve.
 *
 * Rows of set type disintegrate as they run right: the text a model can hold
 * gives way to the drifting, unmodelled world. The next token is not the next
 * state, drawn literally, in ink dust on white.
 */

import { clamp, seeded } from '../lib/math';
import { dpr, prefersReducedMotion } from '../lib/prefers';
import { onFrame, onResize, type Frame } from '../lib/ticker';

export type FuturesHandle = { destroy: () => void };

const INK = '16, 16, 16';
const CRIMSON = '185, 31, 46';
const GOLD = '168, 124, 16';
const FRAME_MS = 40;

const GLYPHS = 'abcdefghijklmnopqrstuvwxyz0123456789';

type TypeMark = {
  px: number;
  py: number;
  char: string;
  /** Unit scatter direction for the dissolve. */
  jx: number;
  jy: number;
  phase: number;
  freq: number;
  tone: 0 | 1 | 2;
};

export function initFutures(canvas: HTMLCanvasElement): FuturesHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { destroy: () => undefined };

  const reduced = prefersReducedMotion();
  let w = 0;
  let h = 0;
  let type: TypeMark[] = [];

  const build = (): void => {
    const rnd = seeded(4111);
    type = [];
    const cell = 12;
    const rowH = Math.max(15, Math.round(h / 11));
    for (let row = 0; row * rowH + 12 < h; row++) {
      // Ragged line lengths, like set copy.
      const rowEnd = w * (0.82 + rnd() * 0.18);
      for (let col = 0; col * cell + 8 < rowEnd; col++) {
        const a = rnd() * Math.PI * 2;
        const t = rnd();
        type.push({
          px: col * cell + 6 + rnd() * 2,
          py: row * rowH + 12,
          char: GLYPHS[Math.floor(rnd() * GLYPHS.length)] ?? 'x',
          jx: Math.cos(a),
          jy: Math.sin(a),
          phase: rnd() * Math.PI * 2,
          freq: 0.0003 + rnd() * 0.0006,
          tone: t < 0.025 ? 2 : t < 0.05 ? 1 : 0,
        });
      }
    }
  };

  const resize = (): void => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 8) return;
    const ratio = dpr(2);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    build();
  };

  const colour = (tone: 0 | 1 | 2, alpha: number): string => {
    const c = tone === 2 ? CRIMSON : tone === 1 ? GOLD : INK;
    return `rgba(${c}, ${clamp(alpha).toFixed(3)})`;
  };

  let elapsed = 0;

  const draw = (frame: Frame): void => {
    if (w < 8) return;
    elapsed += frame.dt;
    if (!reduced && elapsed < FRAME_MS) return;
    elapsed = 0;

    const t = frame.time;
    ctx.clearRect(0, 0, w, h);
    ctx.font = '500 11px "Geist Mono", monospace';
    // The dissolve boundary breathes slowly, row by row.
    for (const m of type) {
      const wave = reduced ? 0 : Math.sin(t * 0.00018 + m.py * 0.02) * 0.05;
      // 1 at the left edge, 0 deep in the world.
      const c = clamp(1 - (m.px / w - (0.16 + wave)) / 0.62);

      if (c > 0.985) {
        // Held text: exact, quiet, printed.
        ctx.fillStyle = colour(m.tone, 0.34 + c * 0.28);
        ctx.fillText(m.char, m.px, m.py);
        continue;
      }

      // Losing its place: scattered further the further out it sits.
      const loose = Math.pow(1 - c, 1.35);
      const drift = reduced ? 0.5 : Math.sin(t * m.freq + m.phase);
      // Blown rightward, into the world, as well as scattered.
      const dx = m.jx * loose * 60 + loose * loose * w * 0.16 + drift * loose * 12;
      const dy = m.jy * loose * 68 + Math.cos(t * m.freq * 0.8 + m.phase) * loose * 12;

      if (c > 0.55) {
        // Still a character, but adrift.
        ctx.fillStyle = colour(m.tone, 0.2 + c * 0.35);
        ctx.fillText(m.char, m.px + dx, m.py + dy);
      } else {
        // Dust. The letter is gone; only its position survives.
        const s = 1.3 + c * 1.3;
        ctx.fillStyle = colour(m.tone, (0.22 + c * 0.38) * (m.tone === 2 ? 1.6 : 1));
        ctx.fillRect(m.px + dx - s / 2, m.py + dy - s / 2, s, s);
      }
    }
  };

  resize();
  const stopResize = onResize(resize);
  let stopFrame: (() => void) | null = null;

  const still = (): void => {
    elapsed = FRAME_MS;
    draw({ dt: FRAME_MS, time: 0, scrollY: 0, velocity: 0, vh: window.innerHeight, vw: window.innerWidth });
  };

  if (reduced) {
    still();
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (visible && !stopFrame) stopFrame = onFrame(draw);
        else if (!visible && stopFrame) {
          stopFrame();
          stopFrame = null;
        }
      },
      { threshold: 0 },
    );
    io.observe(canvas);
    still();
  }

  return {
    destroy: () => {
      stopFrame?.();
      stopResize();
    },
  };
}
