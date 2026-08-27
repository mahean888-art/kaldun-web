/**
 * The horizon behind the use cases: a planet's limb set from seeded dust,
 * rising into the band from below. Drawn once per resize — a still field,
 * dense at the limb, thinning outward, with a few crimson bearings.
 */

import { seeded } from '../lib/math';
import { dpr } from '../lib/prefers';
import { onResize } from '../lib/ticker';

export type ArcHandle = { destroy: () => void };

export function initArc(canvas: HTMLCanvasElement): ArcHandle {
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

    // The limb: a circle far larger than the band, centred well below it.
    const R = w * 1.15;
    const cx = w * 0.5;
    const cy = h + R * 0.82;

    const rnd = seeded(42);
    const count = Math.round(Math.min(2600, w * 1.9));
    for (let i = 0; i < count; i++) {
      // Bias dust toward the limb; scatter thins with distance above it.
      const band = Math.pow(rnd(), 2.2) * R * 0.24;
      const r = R - band;
      const a = -Math.PI / 2 + (rnd() - 0.5) * 1.5;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (y < -4 || y > h + 4 || x < -4 || x > w + 4) continue;
      const near = 1 - band / (R * 0.24);
      const crimson = rnd() < 0.045;
      const alpha = (0.06 + 0.3 * near * rnd()) * (crimson ? 1.6 : 1);
      ctx.fillStyle = crimson
        ? `rgba(226, 96, 107, ${alpha.toFixed(3)})`
        : `rgba(214, 219, 226, ${alpha.toFixed(3)})`;
      const s = rnd() < 0.06 ? 1.8 : 1.1;
      ctx.fillRect(x, y, s, s);
    }

    // The limb itself: one faint arc.
    ctx.strokeStyle = 'rgba(214, 219, 226, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, R, -Math.PI / 2 - 0.75, -Math.PI / 2 + 0.75);
    ctx.stroke();
  };

  draw();
  const stopResize = onResize(draw);
  return { destroy: () => stopResize() };
}
