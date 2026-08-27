/**
 * The hero drawing: the mark, alive.
 *
 * One line — everything that has already happened — arrives at the present
 * and branches into many futures, each drawn at the weight the machine gives
 * it. On a steady beat a pulse of evidence runs the trunk; when it lands at
 * T₀ the fan re-weights: paths deepen, fade, and the leading future moves.
 * Drawn in ink on chart paper; the lamp is deep amber.
 * Nothing else animates. State change is the only motion.
 */

import { seeded } from '../lib/math';
import { dpr, prefersReducedMotion } from '../lib/prefers';
import { onFrame, onResize, type Frame } from '../lib/ticker';

export type BranchHandle = { destroy: () => void };

const N = 56;
const BEAT_MS = 3200;
const PULSE_MS = 420;
const EASE_MS = 950;

const ease = (t: number): number => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

/** A lumpy, unimodal weight profile over the fan. */
function sample(rnd: () => number): number[] {
  const peak = 0.22 + rnd() * 0.56;
  const width = 0.1 + rnd() * 0.16;
  const w = Array.from({ length: N }, (_, i) => {
    const u = i / (N - 1);
    const core = Math.exp(-((u - peak) ** 2) / (2 * width * width));
    return core * (0.55 + rnd() * 0.45) + rnd() * 0.06;
  });
  const max = Math.max(...w);
  return w.map((v) => v / max);
}

export function initBranches(canvas: HTMLCanvasElement): BranchHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { destroy: () => undefined };

  const reduced = prefersReducedMotion();
  const rnd = seeded(1654);

  let w = 0;
  let h = 0;
  let nx = 0;
  let ny = 0;

  /** Endpoint spread across the right edge, fixed for the life of the page. */
  const lanes = Array.from({ length: N }, (_, i) => {
    const u = i / (N - 1);
    return 0.06 + u * 0.88 + (rnd() - 0.5) * 0.012;
  });

  let current = sample(rnd);
  let from = current.slice();
  let target = current.slice();
  let easeStart = -1;
  let lastBeat = 0;

  const resize = (): void => {
    const rect = canvas.getBoundingClientRect();
    const ratio = dpr(2);
    w = Math.max(rect.width, 1);
    h = Math.max(rect.height, 1);
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    nx = w * 0.3;
    ny = h * 0.5;
  };

  const path = (i: number): void => {
    const ey = lanes[i]! * h;
    const dx = w - nx;
    ctx.moveTo(nx, ny);
    ctx.bezierCurveTo(nx + dx * 0.34, ny, nx + dx * 0.62, ey - (ey - ny) * 0.22, w + 2, ey);
  };

  const draw = (time: number): void => {
    ctx.clearRect(0, 0, w, h);

    // Horizon graduations: T₁ … Tₙ, ruled faintly across the fan.
    ctx.font = '500 10px "Geist Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const marks: Array<[number, string]> = [
      [0.46, 'T₁'],
      [0.62, 'T₂'],
      [0.78, 'T₃'],
      [0.94, 'Tₙ'],
    ];
    for (const [fx, label] of marks) {
      const x = w * fx;
      ctx.strokeStyle = 'rgba(14, 17, 22, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 6]);
      ctx.beginPath();
      ctx.moveTo(x, 44);
      ctx.lineTo(x, h - 8);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(104, 112, 121, 0.85)';
      ctx.fillText(label, x, 28);
    }

    // The weights, mid-ease if a re-weight is in flight.
    if (easeStart >= 0) {
      const t = ease((time - easeStart) / EASE_MS);
      for (let i = 0; i < N; i++) current[i] = from[i]! + (target[i]! - from[i]!) * t;
      if (t >= 1) easeStart = -1;
    }

    // The futures. The leading path takes the lamp; the rest are graded ink.
    let lead = 0;
    for (let i = 1; i < N; i++) if (current[i]! > current[lead]!) lead = i;

    for (let i = 0; i < N; i++) {
      if (i === lead) continue;
      const wt = current[i]!;
      ctx.strokeStyle = `rgba(14, 17, 22, ${(0.05 + wt * 0.3).toFixed(3)})`;
      ctx.lineWidth = wt > 0.72 ? 1.4 : 1;
      ctx.beginPath();
      path(i);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(138, 100, 19, 0.95)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    path(lead);
    ctx.stroke();

    // Everything that has already happened: one line, no width to argue about.
    ctx.strokeStyle = 'rgba(14, 17, 22, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-2, ny);
    ctx.lineTo(nx, ny);
    ctx.stroke();

    // Evidence arriving: a pulse runs the trunk, and on landing the fan
    // re-weights.
    if (!reduced) {
      const phase = time - lastBeat;
      if (phase >= BEAT_MS) {
        lastBeat = time - (phase % BEAT_MS);
        from = current.slice();
        target = sample(rnd);
        easeStart = time + PULSE_MS;
      } else if (phase < PULSE_MS) {
        const p = phase / PULSE_MS;
        const px = p * nx;
        ctx.strokeStyle = 'rgba(166, 122, 24, 0.95)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(Math.max(0, px - 14), ny);
        ctx.lineTo(px, ny);
        ctx.stroke();
      }
    }

    // The present.
    const beat = reduced ? 1 : 0.75 + Math.sin(time * 0.0016) * 0.25;
    ctx.fillStyle = `rgba(138, 100, 19, ${(0.65 + 0.35 * beat).toFixed(3)})`;
    ctx.fillRect(nx - 2.5, ny - 2.5, 5, 5);
    ctx.font = '500 11px "Geist Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(138, 100, 19, 0.9)';
    ctx.fillText('T₀', nx, ny + 12);
  };

  let elapsed = 0;
  const tick = (frame: Frame): void => {
    elapsed += frame.dt;
    if (elapsed < 33) return;
    elapsed = 0;
    draw(frame.time);
  };

  resize();
  const stopResize = onResize(resize);
  let stopFrame: (() => void) | null = null;

  if (reduced) {
    draw(0);
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (visible && !stopFrame) stopFrame = onFrame(tick);
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
