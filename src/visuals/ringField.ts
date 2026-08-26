/**
 * The hero drawing.
 *
 * A measuring instrument, not a decoration: concentric rings ruled with graduated
 * ticks, a dotted horizon, and radial sightlines. It reads as the dial of
 * something that measures time forward — the present at the centre, futures
 * graduated outward.
 *
 * It is drawn to the right of the headline and faded at its inner edge, so the
 * display type is never crossed by a line.
 */

import { seeded } from '../lib/math';
import { dpr, prefersReducedMotion } from '../lib/prefers';
import { onFrame, onResize, type Frame } from '../lib/ticker';

type Ring = {
  /** Radius as a fraction of the base radius. */
  r: number;
  kind: 'solid' | 'ticked' | 'dotted' | 'graduated' | 'hatched';
  alpha: number;
  /** Radians per millisecond. */
  spin: number;
  tone: 'cream' | 'gold' | 'crimson';
};

const RINGS: Ring[] = [
  { r: 0.2, kind: 'solid', alpha: 0.22, spin: 0, tone: 'cream' },
  { r: 0.32, kind: 'graduated', alpha: 0.3, spin: 0.0000075, tone: 'cream' },
  { r: 0.44, kind: 'hatched', alpha: 0.17, spin: -0.0000041, tone: 'cream' },
  { r: 0.54, kind: 'dotted', alpha: 0.42, spin: -0.0000052, tone: 'gold' },
  { r: 0.62, kind: 'ticked', alpha: 0.26, spin: 0.0000034, tone: 'cream' },
  { r: 0.74, kind: 'hatched', alpha: 0.13, spin: 0.0000022, tone: 'cream' },
  { r: 0.86, kind: 'graduated', alpha: 0.22, spin: -0.0000026, tone: 'cream' },
  { r: 0.97, kind: 'dotted', alpha: 0.3, spin: 0.0000019, tone: 'gold' },
  { r: 1.06, kind: 'solid', alpha: 0.14, spin: 0, tone: 'cream' },
];

/* Ink ruling with signal bearings: an instrument engraved on chart-paper. */
const TONES: Record<Ring['tone'], [number, number, number]> = {
  cream: [30, 33, 40],
  gold: [104, 112, 121],
  crimson: [185, 31, 46],
};

export type RingHandle = { destroy: () => void };

export function initRingField(canvas: HTMLCanvasElement): RingHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { destroy: () => undefined };

  const reduced = prefersReducedMotion();
  let w = 0;
  let h = 0;
  let base = 0;
  let cx = 0;
  let cy = 0;

  /** Radial sightlines: fixed bearings, a few of them crimson. */
  const sightlines = (() => {
    const rnd = seeded(1654);
    return Array.from({ length: 30 }, (_, i) => ({
      angle: (i / 30) * Math.PI * 2 + rnd() * 0.14,
      from: 0.18 + rnd() * 0.5,
      to: 0.76 + rnd() * 0.36,
      crimson: i % 8 === 3,
      alpha: 0.14 + rnd() * 0.22,
    }));
  })();

  const resize = (): void => {
    const rect = canvas.getBoundingClientRect();
    const ratio = dpr(2);
    w = Math.max(rect.width, 1);
    h = Math.max(rect.height, 1);
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    // The whole dial fits its box: the outermost ring (1.06 base) plus its
    // graduations stays inside both dimensions, centred.
    cx = w * 0.5;
    cy = h * 0.5;
    base = (Math.min(w, h) / 2) * 0.88;
  };

  const stroke = (tone: Ring['tone'], alpha: number): string => {
    const [r, g, b] = TONES[tone];
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
  };

  const drawRing = (ring: Ring, time: number): void => {
    const radius = base * ring.r;
    const phase = reduced ? 0 : time * ring.spin;

    if (ring.kind === 'solid') {
      ctx.strokeStyle = stroke(ring.tone, ring.alpha);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }

    if (ring.kind === 'hatched') {
      // A woven band: dense short strokes between two radii. This is what makes
      // the dial read as an engraved instrument rather than a set of circles.
      const count = Math.max(120, Math.round(radius * 1.5));
      const inner = radius;
      const outer = radius * 1.075;
      ctx.strokeStyle = stroke(ring.tone, ring.alpha);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const a = phase * 0.6 + (i / count) * Math.PI * 2;
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        ctx.moveTo(cx + cos * inner, cy + sin * inner);
        ctx.lineTo(cx + cos * outer, cy + sin * outer);
      }
      ctx.stroke();
      return;
    }

    if (ring.kind === 'dotted') {
      const count = Math.max(80, Math.round(radius * 0.75));
      const path = new Path2D();
      for (let i = 0; i < count; i++) {
        const a = phase + (i / count) * Math.PI * 2;
        path.rect(cx + Math.cos(a) * radius - 0.6, cy + Math.sin(a) * radius - 0.6, 1.2, 1.2);
      }
      ctx.fillStyle = stroke(ring.tone, ring.alpha);
      ctx.fill(path);
      return;
    }

    // 'ticked' and 'graduated' are ruled scales; graduated marks every fifth
    // division longer, the way an instrument dial is engraved.
    // Two paths — major and minor divisions — rather than a stroke per tick.
    const divisions = ring.kind === 'graduated' ? 144 : 72;
    const majors = new Path2D();
    const minors = new Path2D();
    for (let i = 0; i < divisions; i++) {
      const a = phase + (i / divisions) * Math.PI * 2;
      const major = ring.kind === 'graduated' && i % 5 === 0;
      const len = major ? radius * 0.055 : radius * 0.024;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const path = major ? majors : minors;
      path.moveTo(cx + cos * radius, cy + sin * radius);
      path.lineTo(cx + cos * (radius + len), cy + sin * (radius + len));
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = stroke(ring.tone, ring.alpha);
    ctx.stroke(minors);
    ctx.strokeStyle = stroke(ring.tone, ring.alpha * 1.9);
    ctx.stroke(majors);
  };

  let elapsed = 0;

  const draw = (frame: Frame): void => {
    elapsed += frame.dt;
    if (!reduced && elapsed < 33) return;
    elapsed = 0;

    const time = frame.time;
    ctx.clearRect(0, 0, w, h);

    // Sightlines first, so the rings sit on top of them.
    ctx.lineWidth = 1;
    const plain = new Path2D();
    const accent = new Path2D();
    for (const line of sightlines) {
      const drift = reduced ? 0 : Math.sin(time * 0.00008 + line.angle) * 0.012;
      const a = line.angle + drift;
      const path = line.crimson ? accent : plain;
      path.moveTo(cx + Math.cos(a) * base * line.from, cy + Math.sin(a) * base * line.from);
      path.lineTo(cx + Math.cos(a) * base * line.to, cy + Math.sin(a) * base * line.to);
    }
    ctx.strokeStyle = stroke('cream', 0.1);
    ctx.stroke(plain);
    ctx.strokeStyle = stroke('crimson', 0.4);
    ctx.stroke(accent);

    for (const ring of RINGS) drawRing(ring, time);

    // The present: a single crimson square at the centre of the dial.
    const beat = reduced ? 1 : 0.7 + Math.sin(time * 0.0014) * 0.3;
    ctx.fillStyle = `rgba(185, 31, 46, ${(0.55 + 0.45 * beat).toFixed(3)})`;
    ctx.fillRect(cx - 2.5, cy - 2.5, 5, 5);

    ctx.strokeStyle = stroke('crimson', 0.22 * beat);
    ctx.beginPath();
    ctx.arc(cx, cy, base * 0.12, 0, Math.PI * 2);
    ctx.stroke();
  };

  resize();
  const stopResize = onResize(resize);
  let stopFrame: (() => void) | null = null;

  if (reduced) {
    draw({ dt: 0, time: 0, scrollY: 0, velocity: 0, vh: window.innerHeight, vw: window.innerWidth });
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
