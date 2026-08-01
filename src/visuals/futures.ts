/**
 * Two field figures in one material: ink dust on white.
 *
 * 'problem' — rows of set type disintegrate as they run right: the text a model
 * can hold gives way to the drifting, unmodelled world. The next token is not
 * the next state, drawn literally.
 *
 * 'thesis' — a belief field: dust condenses into a calibrated distribution,
 * the crimson resolution line strikes it where reality lands, and the field
 * opens again to hold the next question.
 */

import { clamp, seeded } from '../lib/math';
import { dpr, prefersReducedMotion } from '../lib/prefers';
import { onFrame, onResize, type Frame } from '../lib/ticker';

export type FuturesVariant = 'problem' | 'thesis';
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

type DustMark = {
  hx: number;
  hy: number;
  sx: number;
  sy: number;
  phase: number;
  tone: 0 | 1 | 2;
  a: number;
};

export function initFutures(canvas: HTMLCanvasElement, variant: FuturesVariant): FuturesHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { destroy: () => undefined };

  const reduced = prefersReducedMotion();
  let w = 0;
  let h = 0;
  let type: TypeMark[] = [];
  let dust: DustMark[] = [];

  const build = (): void => {
    const rnd = seeded(variant === 'problem' ? 4111 : 9719);

    if (variant === 'problem') {
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
      return;
    }

    // Thesis: a two-mode density, filled with dust by rejection sampling.
    const gauss = (u: number, m: number, s: number): number =>
      Math.exp(-((u - m) * (u - m)) / (2 * s * s));
    const f = (u: number): number => 0.9 * gauss(u, 0.36, 0.14) + 0.62 * gauss(u, 0.7, 0.085);
    dust = [];
    const N = 1050;
    const base = h * 0.88;
    const H = h * 0.72;
    let guard = 0;
    while (dust.length < N && guard < N * 40) {
      guard += 1;
      const u = 0.06 + rnd() * 0.88;
      const height = f(u) * H;
      const hx = u * w;
      const hy = base - rnd() * height;
      const a = rnd() * Math.PI * 2;
      const mag = h * (0.25 + rnd() * 0.75);
      const t = rnd();
      dust.push({
        hx,
        hy,
        sx: Math.cos(a) * mag,
        sy: Math.sin(a) * mag * 0.7,
        phase: rnd() * Math.PI * 2,
        tone: t < 0.03 ? 2 : t < 0.06 ? 1 : 0,
        a: 0.2 + rnd() * 0.4,
      });
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

  const drawProblem = (t: number): void => {
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

  const PERIOD = 10000;

  const drawThesis = (t: number): void => {
    const cyc = reduced ? 0.45 : (t % PERIOD) / PERIOD;

    // Dispersal: open at the ends of the cycle, condensed in the middle.
    let disp: number;
    if (cyc < 0.34) disp = 1 - easeInOut(cyc / 0.34);
    else if (cyc < 0.62) disp = 0;
    else disp = easeInOut((cyc - 0.62) / 0.38);

    // The baseline the distribution stands on.
    ctx.strokeStyle = `rgba(${INK}, 0.22)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.03, h * 0.88);
    ctx.lineTo(w * 0.97, h * 0.88);
    ctx.stroke();

    for (const m of dust) {
      const jitter = reduced ? 0 : Math.sin(t * 0.0008 + m.phase) * 1.6;
      const px = m.hx + m.sx * disp;
      const py = m.hy + m.sy * disp + jitter;
      const s = 1.3 + (1 - disp) * 0.9;
      const alpha = m.a * (0.55 + (1 - disp) * 0.6) * (m.tone === 2 ? 1.5 : 1);
      ctx.fillStyle = colour(m.tone, alpha);
      ctx.fillRect(px - s / 2, py - s / 2, s, s);
    }

    // While the belief is condensed, reality strikes its line through it.
    if (disp < 0.08 && !reduced) {
      const local = clamp((0.62 - cyc) / 0.28);
      const strike = clamp((0.34 < cyc ? cyc - 0.34 : 0) / 0.06);
      const x = w * 0.36;
      const top = h * 0.1 + (1 - strike) * h * 0.3;
      ctx.strokeStyle = `rgba(${CRIMSON}, ${(0.75 * strike * local).toFixed(3)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, h * 0.88);
      ctx.stroke();
      ctx.fillStyle = `rgba(${CRIMSON}, ${(0.9 * strike * local).toFixed(3)})`;
      ctx.fillRect(x - 2.5, h * 0.88 - 2.5, 5, 5);
    }
  };

  const easeInOut = (x: number): number => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

  const draw = (frame: Frame): void => {
    if (w < 8) return;
    elapsed += frame.dt;
    if (!reduced && elapsed < FRAME_MS) return;
    elapsed = 0;
    ctx.clearRect(0, 0, w, h);
    if (variant === 'problem') drawProblem(frame.time);
    else drawThesis(frame.time);
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
