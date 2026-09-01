/**
 * The domain motif: one diagrammatic material, varied per domain.
 *
 * Trunk and present state, a fan of thin future traces, a small distribution
 * strip along the right edge, one peripheral tail trace, and a record tick.
 * Static — drawn once per selection and on resize. Tuned by three numbers:
 * spread (concentration → even), tail (how visible the tail trace is), and
 * reach (how far the lead carries into time).
 */

import { seeded } from '../lib/math';
import { dpr } from '../lib/prefers';
import { onResize } from '../lib/ticker';

export type MotifHandle = { set: (p: MotifParams) => void; destroy: () => void };

export type MotifParams = { spread: number; tail: number; reach: number; seed: number };

const N = 46;

export function initMotif(canvas: HTMLCanvasElement, initial: MotifParams): MotifHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { set: () => undefined, destroy: () => undefined };

  let params = initial;

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

    const rnd = seeded(params.seed);
    const nx = w * 0.16;
    const ny = h * 0.52;

    // Ink on bone: the light theme's near-black.
    const INK = '16, 16, 19';
    const MUTE = '107, 110, 102';

    // Trunk with graduations.
    ctx.strokeStyle = `rgba(${INK}, 0.55)`;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(0, ny);
    ctx.lineTo(nx, ny);
    ctx.stroke();
    ctx.strokeStyle = `rgba(${INK}, 0.25)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = nx - 18; gx > 4; gx -= 18) {
      ctx.moveTo(gx, ny - 3);
      ctx.lineTo(gx, ny + 3);
    }
    ctx.stroke();

    // Weights: a profile between one strong lead and an even spread.
    const peak = 0.3 + rnd() * 0.4;
    const weights = Array.from({ length: N }, (_, i) => {
      const u = i / (N - 1);
      const core = Math.exp(-((u - peak) ** 2) / 0.02);
      return core * (1 - params.spread) + params.spread * (0.45 + rnd() * 0.3);
    });
    const max = Math.max(...weights);
    const lead = weights.indexOf(max);

    const endY = (i: number): number => (0.08 + (i / (N - 1)) * 0.84) * h;
    const pathTo = (i: number, cut = 1): void => {
      const ey = endY(i);
      const dx = (w - nx) * cut;
      ctx.moveTo(nx, ny);
      ctx.bezierCurveTo(nx + dx * 0.36, ny, nx + dx * 0.64, ey - (ey - ny) * 0.24, nx + dx, ey);
    };

    for (let i = 0; i < N; i++) {
      const wt = weights[i]! / max;
      ctx.strokeStyle = `rgba(${INK}, ${(0.05 + wt * 0.3).toFixed(3)})`;
      ctx.lineWidth = wt > 0.8 ? 1.2 : 1;
      ctx.beginPath();
      pathTo(i, 0.55 + wt * 0.25);
      ctx.stroke();
    }

    // The lead carries into time by `reach`.
    ctx.strokeStyle = `rgba(${INK}, 0.85)`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    pathTo(lead, 0.6 + params.reach * 0.4);
    ctx.stroke();

    // The peripheral tail trace.
    if (params.tail > 0.05) {
      const tailIdx = peak < 0.5 ? N - 2 : 1;
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = `rgba(${INK}, ${(0.2 + params.tail * 0.55).toFixed(3)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      pathTo(tailIdx, 0.9);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Distribution strip along the right edge.
    const bx = w - 26;
    for (let i = 0; i < N; i += 2) {
      const wt = weights[i]! / max;
      ctx.fillStyle = `rgba(${INK}, ${(0.12 + wt * 0.5).toFixed(3)})`;
      ctx.fillRect(bx, endY(i) - 1.5, 4 + wt * 16, 2);
    }

    // The present.
    ctx.fillStyle = `rgba(${INK}, 0.95)`;
    ctx.beginPath();
    ctx.arc(nx, ny, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '500 10px "Geist Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = `rgba(${MUTE}, 0.95)`;
    ctx.fillText('T₀', nx, ny + 12);

    // The record tick: one committed claim, marked at the field's foot.
    const rx = w * 0.82;
    ctx.strokeStyle = `rgba(${INK}, 0.7)`;
    ctx.lineWidth = 1;
    ctx.strokeRect(rx - 5, h - 22, 10, 10);
    ctx.fillStyle = `rgba(${INK}, 0.7)`;
    ctx.fillRect(rx - 1.5, h - 18.5, 3, 3);
  };

  draw();
  const stopResize = onResize(draw);

  return {
    set: (p: MotifParams) => {
      params = p;
      draw();
    },
    destroy: () => stopResize(),
  };
}
