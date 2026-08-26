/**
 * The living fan.
 *
 * One present, opening into weighted futures. It draws once, drifts on seeded
 * noise, and re-weights every few seconds when evidence lands — it never loops.
 * Colour is the probability ramp: faint ink for the improbable, deep signal
 * blue for the likely. Solid is observed — the short trunk entering the origin;
 * everything ahead of the origin is dashed, because it is only possible.
 *
 * The canvas is sticky inside the fanfield, so the same running belief sits
 * behind the hero and stays quietly behind the manifesto as the beats arrive.
 */

import { clamp, seeded } from '../lib/math';
import { dpr, prefersReducedMotion } from '../lib/prefers';
import { onFrame, onResize, type Frame } from '../lib/ticker';

export type FanHandle = { destroy: () => void };

const INK: [number, number, number] = [14, 17, 22];
const SIGNAL: [number, number, number] = [23, 51, 230];
const FRAME_MS = 33;
/** Evidence lands roughly this often, in ms. */
const EVIDENCE_MS = 7000;
const DRAW_IN_MS = 1600;
const BRANCHES = 11;

const mix = (a: number, b: number, t: number): number => a + (b - a) * t;
const ramp = (w: number, alpha: number): string => {
  const t = Math.pow(w, 1.5);
  const r = Math.round(mix(INK[0], SIGNAL[0], t));
  const g = Math.round(mix(INK[1], SIGNAL[1], t));
  const b = Math.round(mix(INK[2], SIGNAL[2], t));
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
};

type Branch = { endV: number; c1V: number; c2V: number; w: number; target: number; phase: number };

export function initFan(canvas: HTMLCanvasElement): FanHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { destroy: () => undefined };

  const reduced = prefersReducedMotion();
  let w = 0;
  let h = 0;

  const rnd = seeded(1654);
  const branches: Branch[] = Array.from({ length: BRANCHES }, (_, i) => {
    const endV = 0.06 + (i / (BRANCHES - 1)) * 0.9 + (rnd() - 0.5) * 0.04;
    return {
      endV,
      c1V: mix(0.6, endV, 0.3) + (rnd() - 0.5) * 0.08,
      c2V: mix(0.6, endV, 0.72) + (rnd() - 0.5) * 0.06,
      w: 0.15 + rnd() * 0.7,
      target: 0.15 + rnd() * 0.7,
      phase: rnd() * Math.PI * 2,
    };
  });
  // One branch always carries real weight, so the fan reads.
  const lead = branches[Math.floor(BRANCHES / 2)];
  if (lead) {
    lead.w = 0.95;
    lead.target = 0.95;
  }

  /** Deterministic re-weighting: evidence arrives, the view changes. */
  const reweigh = (): void => {
    let strongest = 0;
    branches.forEach((b) => {
      b.target = clamp(b.target + (rnd() - 0.5) * 0.55, 0.08, 1);
      strongest = Math.max(strongest, b.target);
    });
    // Renormalise so someone is always near certain enough to point at.
    if (strongest < 0.7) branches.forEach((b) => (b.target = clamp(b.target + (0.75 - strongest), 0.08, 1)));
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
  };

  let elapsed = 0;
  let born = -1;
  let lastEvidence = 0;

  const draw = (frame: Frame): void => {
    if (w < 8) return;
    elapsed += frame.dt;
    if (!reduced && elapsed < FRAME_MS) return;
    elapsed = 0;

    const t = frame.time;
    if (born < 0) born = t;
    const age = t - born;

    // Evidence: weights step toward new targets, eased below.
    if (!reduced && t - lastEvidence > EVIDENCE_MS && age > DRAW_IN_MS) {
      lastEvidence = t;
      reweigh();
    }
    for (const b of branches) b.w += (b.target - b.w) * (reduced ? 1 : 0.06);

    // Draw-in: the fan appears once and never replays.
    const reveal = reduced ? 1 : clamp(age / DRAW_IN_MS);

    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';

    const ox = w * 0.07;
    const oy = h * 0.6;
    const ex = w * 1.02;

    // The observed past: one solid trunk entering the origin.
    ctx.strokeStyle = ramp(0.4, 0.5);
    ctx.lineWidth = 1.6;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(-8, oy);
    ctx.lineTo(ox, oy);
    ctx.stroke();

    // The possible: dashed branches, weighted by the ramp.
    for (const b of branches) {
      const drift = reduced ? 0 : Math.sin(t * 0.00016 + b.phase) * h * 0.012;
      const ey = b.endV * h + drift;
      const c1y = b.c1V * h + drift * 0.4;
      const c2y = b.c2V * h + drift * 0.8;
      const alpha = 0.08 + b.w * 0.34;

      ctx.strokeStyle = ramp(b.w, alpha * reveal);
      ctx.lineWidth = 0.8 + b.w * 1.6;
      ctx.setLineDash([7, 6]);
      ctx.lineDashOffset = reduced ? 0 : -t * 0.004;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.bezierCurveTo(mix(ox, ex, 0.35), c1y, mix(ox, ex, 0.72), c2y, ex, ey);
      ctx.stroke();

      // Terminal tick, sized by weight.
      if (reveal > 0.98) {
        const s = 2 + b.w * 5;
        ctx.setLineDash([]);
        ctx.fillStyle = ramp(b.w, (0.25 + b.w * 0.6) * reveal);
        ctx.fillRect(ex - w * 0.03 - s / 2, ey - s / 2, s, s);
      }
    }

    // The present.
    ctx.setLineDash([]);
    ctx.fillStyle = ramp(1, 0.9);
    ctx.fillRect(ox - 3.5, oy - 3.5, 7, 7);
  };

  resize();
  const stopResize = onResize(resize);
  let stopFrame: (() => void) | null = null;

  if (reduced) {
    draw({ dt: FRAME_MS, time: 0, scrollY: 0, velocity: 0, vh: window.innerHeight, vw: window.innerWidth });
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
  }

  return {
    destroy: () => {
      stopFrame?.();
      stopResize();
    },
  };
}
