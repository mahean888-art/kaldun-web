/**
 * Domain glyphs: a small live distribution in the brand grammar. Bars on the
 * probability ramp, the mode in signal blue, re-estimated every few seconds —
 * a state change, not an ambient shimmer.
 */

import { clamp, seeded } from '../lib/math';
import { dpr, prefersReducedMotion } from '../lib/prefers';
import { onFrame, onResize, type Frame } from '../lib/ticker';

export type GlyphHandle = { destroy: () => void };

const INK: [number, number, number] = [14, 17, 22];
const SIGNAL: [number, number, number] = [23, 51, 230];
const BARS = 14;
const FRAME_MS = 50;
const RESTEP_MS = 6000;

const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

export function initGlyph(canvas: HTMLCanvasElement, seed: number): GlyphHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { destroy: () => undefined };

  const reduced = prefersReducedMotion();
  const rnd = seeded(seed);
  let w = 0;
  let h = 0;

  /** A lumpy unimodal-ish mass, not noise. */
  const sample = (): number[] => {
    const peak = 2 + Math.floor(rnd() * (BARS - 4));
    return Array.from({ length: BARS }, (_, i) => {
      const d = Math.abs(i - peak) / BARS;
      return clamp(Math.exp(-d * d * 26) * (0.65 + rnd() * 0.35) + rnd() * 0.12, 0.05, 1);
    });
  };

  let heights = sample();
  let targets = heights;
  let lastStep = 0;

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

    if (!reduced && frame.time - lastStep > RESTEP_MS) {
      lastStep = frame.time;
      targets = sample();
    }

    ctx.clearRect(0, 0, w, h);
    const gap = 2;
    const bw = (w - gap * (BARS - 1)) / BARS;
    const top = Math.max(...heights);

    for (let i = 0; i < BARS; i++) {
      const target = targets[i] ?? 0.4;
      const cur = heights[i] ?? 0.4;
      const next = cur + (target - cur) * (reduced ? 1 : 0.08);
      heights[i] = next;
      const t = Math.pow(next / top, 1.6);
      const bh = Math.max(2, next * (h - 2));
      ctx.fillStyle = `rgba(${Math.round(mix(INK[0], SIGNAL[0], t))}, ${Math.round(
        mix(INK[1], SIGNAL[1], t),
      )}, ${Math.round(mix(INK[2], SIGNAL[2], t))}, ${(0.25 + t * 0.65).toFixed(3)})`;
      ctx.fillRect(i * (bw + gap), h - bh, bw, bh);
    }
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
    draw({ dt: FRAME_MS, time: 0, scrollY: 0, velocity: 0, vh: window.innerHeight, vw: window.innerWidth });
  }

  return {
    destroy: () => {
      stopFrame?.();
      stopResize();
    },
  };
}
