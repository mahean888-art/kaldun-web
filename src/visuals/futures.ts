/**
 * The branching-futures diagram.
 *
 * One origin. In the 'problem' variant a single bold path — the answer — runs
 * straight and stops at a terminal bar, while a fan of probability-weighted
 * futures keeps going without it. In the 'thesis' variant the fan is the whole
 * subject: weighted branches, an evidence pulse that travels out from the
 * origin and re-weights them, and a score mark where the strongest resolves.
 */

import { seeded } from '../lib/math';
import { dpr, prefersReducedMotion } from '../lib/prefers';
import { onFrame, onResize, type Frame } from '../lib/ticker';

export type FuturesVariant = 'problem' | 'thesis';
export type FuturesHandle = { destroy: () => void };

const INK = '16, 16, 16';
const CRIMSON = '185, 31, 46';
const GOLD = '168, 124, 16';

/** One evidence pulse per period, in ms. */
const PERIOD = 7000;
const FRAME_MS = 33;

type Branch = { end: number; ctrl: number; wA: number; wB: number; prob: string };

export function initFutures(canvas: HTMLCanvasElement, variant: FuturesVariant): FuturesHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { destroy: () => undefined };

  const reduced = prefersReducedMotion();
  let w = 0;
  let h = 0;

  const rnd = seeded(variant === 'problem' ? 41 : 97);
  // End heights as fractions of half-height; two weight sets to breathe between.
  const branches: Branch[] = [-0.82, -0.46, -0.12, 0.2, 0.55, 0.86].map((end, i) => {
    const wA = i === 2 ? 0.95 : 0.18 + rnd() * 0.5;
    return {
      end,
      ctrl: end * (0.35 + rnd() * 0.2),
      wA,
      wB: Math.max(0.1, Math.min(1, wA + (rnd() - 0.5) * 0.55)),
      prob: '',
    };
  });
  // Probabilities that always sum to 100, printed on the three strongest.
  const label = (v: number): string => `.${String(Math.round(v * 100)).padStart(2, '0')}`;

  const resize = (): void => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 8) return;
    const ratio = dpr(2);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  let elapsed = 0;

  const draw = (frame: Frame): void => {
    if (w < 8) return;
    elapsed += frame.dt;
    if (!reduced && elapsed < FRAME_MS) return;
    elapsed = 0;

    const t = reduced ? 0.35 : ((frame.time % PERIOD) / PERIOD);
    // Weight blend: evidence pulse (first 25% of the cycle) eases A -> B, the
    // next cycle eases back, so the view visibly changes when evidence lands.
    const half = Math.floor((reduced ? 0 : frame.time / PERIOD)) % 2 === 1;
    const ease = t < 0.25 ? t / 0.25 : 1;
    const mix = half ? 1 - ease : ease;

    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';

    const x0 = w * 0.06;
    const y0 = h * 0.5;
    const x1 = w * 0.95;
    const mono = '600 10px "Geist Mono", monospace';

    // Origin: the present.
    ctx.fillStyle = `rgba(${CRIMSON}, 0.95)`;
    ctx.fillRect(x0 - 3.5, y0 - 3.5, 7, 7);
    ctx.font = mono;
    ctx.fillStyle = `rgba(${INK}, 0.45)`;
    ctx.fillText(variant === 'thesis' ? 'STATE T0' : 'NOW', x0 - 2, y0 + 26);

    // The fan.
    let strongest = 0;
    let strongestW = 0;
    branches.forEach((b, i) => {
      const bw = b.wA + (b.wB - b.wA) * mix;
      if (bw > strongestW) {
        strongestW = bw;
        strongest = i;
      }
    });

    branches.forEach((b, i) => {
      const bw = b.wA + (b.wB - b.wA) * mix;
      const ey = y0 + b.end * h * 0.42;
      const cy = y0 + b.ctrl * h * 0.42;
      const alpha = 0.14 + bw * 0.6;

      ctx.strokeStyle = i === strongest ? `rgba(${CRIMSON}, ${(0.35 + bw * 0.5).toFixed(3)})` : `rgba(${INK}, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 0.8 + bw * 1.5;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(w * 0.55, cy, x1, ey);
      ctx.stroke();

      // Terminal tick, sized by weight.
      const tick = 2 + bw * 4;
      ctx.fillStyle = i === strongest ? `rgba(${CRIMSON}, 0.9)` : `rgba(${INK}, ${(alpha + 0.15).toFixed(3)})`;
      ctx.fillRect(x1 - tick / 2, ey - tick / 2, tick, tick);

      // Probability on the three heaviest.
      if (bw > 0.42) {
        ctx.font = mono;
        ctx.fillStyle = `rgba(${INK}, 0.5)`;
        ctx.fillText(label(bw * 0.42), x1 - 34, ey - 7);
      }
    });

    if (variant === 'problem') {
      // The answer: one bold straight line that stops well short of the futures.
      const stopX = w * 0.46;
      ctx.strokeStyle = `rgba(${INK}, 0.9)`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(stopX, y0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(stopX, y0 - 7);
      ctx.lineTo(stopX, y0 + 7);
      ctx.stroke();
      ctx.font = mono;
      ctx.fillStyle = `rgba(${INK}, 0.55)`;
      ctx.fillText('THE ANSWER STOPS', x0 + 46, y0 - 12);
      ctx.fillStyle = `rgba(${INK}, 0.4)`;
      ctx.fillText('THE WORLD CONTINUES', x1 - 128, h * 0.08);
    } else {
      // Evidence pulse: a gold dot running the strongest branch while weights move.
      if (!reduced && t < 0.25) {
        const p = t / 0.25;
        const b = branches[strongest];
        if (b) {
          const ey = y0 + b.end * h * 0.42;
          const cy = y0 + b.ctrl * h * 0.42;
          const px = (1 - p) * (1 - p) * x0 + 2 * (1 - p) * p * w * 0.55 + p * p * x1;
          const py = (1 - p) * (1 - p) * y0 + 2 * (1 - p) * p * cy + p * p * ey;
          ctx.fillStyle = `rgba(${GOLD}, 0.95)`;
          ctx.beginPath();
          ctx.arc(px, py, 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.font = mono;
      ctx.fillStyle = `rgba(${INK}, 0.4)`;
      ctx.fillText('FUTURES T1 - TN', x1 - 96, h * 0.08);
      ctx.fillStyle = `rgba(${GOLD}, 0.85)`;
      ctx.fillText('EVIDENCE RE-WEIGHTS', x0, h * 0.94);
      ctx.fillStyle = `rgba(${CRIMSON}, 0.85)`;
      ctx.fillText('SCORED ON RESOLUTION', x1 - 132, h * 0.94);
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
