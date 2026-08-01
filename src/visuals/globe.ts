/**
 * The world under the domains: an enormous sphere of drifting ink dust rising
 * from below the section — mostly hidden, only its upper limb cresting into
 * view, turning slowly. Dust gathers at the silhouette and thins toward the
 * face; a loose atmosphere of particles hangs above the limb. A few crimson
 * grains ride the surface: the decisions.
 */

import { seeded } from '../lib/math';
import { dpr, prefersReducedMotion } from '../lib/prefers';
import { onFrame, onResize, type Frame } from '../lib/ticker';

export type GlobeHandle = { destroy: () => void };

const INK = '16, 16, 16';
const CRIMSON = '185, 31, 46';
const FRAME_MS = 33;
const POINTS = 7600;
const LOOSE = 430;

type Grain = { lat: number; lon: number; r: number; a: number; tw: number; crimson: boolean };
type Mote = { u: number; v: number; a: number; phase: number; freq: number };

export function initGlobe(canvas: HTMLCanvasElement): GlobeHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { destroy: () => undefined };

  const reduced = prefersReducedMotion();
  let w = 0;
  let h = 0;

  const rnd = seeded(1377);

  // Grains scattered at random over the crown — random, not a lattice, so the
  // surface reads as dust and weather rather than machined rings.
  const grains: Grain[] = [];
  for (let i = 0; i < POINTS; i++) {
    const y = 0.42 + rnd() * 0.58;
    grains.push({
      lat: Math.asin(y),
      lon: (rnd() * 2 - 1) * Math.PI,
      r: 0.985 + rnd() * 0.035,
      a: 0.25 + rnd() * 0.75,
      tw: rnd() * Math.PI * 2,
      crimson: rnd() < 0.004,
    });
  }

  // The loose atmosphere: motes that hang above the limb and drift.
  const motes: Mote[] = Array.from({ length: LOOSE }, () => ({
    u: rnd(),
    v: rnd(),
    a: 0.08 + rnd() * 0.3,
    phase: rnd() * Math.PI * 2,
    freq: 0.00006 + rnd() * 0.00018,
  }));

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

    const t = frame.time;
    const rot = reduced ? 0.8 : t * 0.00003;

    // The sphere is far larger than the canvas; only its crown is visible.
    const R = Math.max(w * 0.52, h * 1.15);
    const cx = w / 2;
    const cy = h + R * 0.55;

    ctx.clearRect(0, 0, w, h);

    // Surface dust. Limb-weighted: densest at the silhouette, thin on the face.
    const buckets: Array<Path2D | null> = new Array(5).fill(null);
    const crimsonPath = new Path2D();
    for (const g of grains) {
      const L = g.lon + rot;
      const x = Math.cos(g.lat) * Math.sin(L);
      const y = Math.sin(g.lat);
      const z = Math.cos(g.lat) * Math.cos(L);
      if (z <= 0) continue;
      const sx = cx + x * R * g.r;
      const sy = cy - y * R * g.r;
      if (sy < -8 || sy > h + 8 || sx < -8 || sx > w + 8) continue;

      // z near 0 is the limb; the face fades away.
      const limb = Math.pow(1 - z, 1.3);
      const twinkle = reduced ? 0.8 : 0.65 + 0.35 * Math.sin(t * 0.0011 + g.tw);
      const alpha = (0.1 + limb * 0.95) * g.a * twinkle;
      if (alpha < 0.03) continue;

      if (g.crimson) {
        crimsonPath.rect(sx - 1.4, sy - 1.4, 2.8, 2.8);
        continue;
      }
      const k = Math.min(4, Math.floor(alpha * 6));
      let path = buckets[k];
      if (!path) {
        path = new Path2D();
        buckets[k] = path;
      }
      const s = 1.1 + limb * 1.7;
      path.rect(sx - s / 2, sy - s / 2, s, s);
    }
    buckets.forEach((path, k) => {
      if (!path) return;
      ctx.fillStyle = `rgba(${INK}, ${(0.12 + (k / 4) * 0.68).toFixed(3)})`;
      ctx.fill(path);
    });
    ctx.fillStyle = `rgba(${CRIMSON}, 0.8)`;
    ctx.fill(crimsonPath);

    // Atmosphere: dust hanging above the crown, rising and falling slowly.
    const loose = new Path2D();
    for (const m of motes) {
      const mx = m.u * w + (reduced ? 0 : Math.sin(t * m.freq + m.phase) * 26);
      // Held near the limb: distance above the sphere surface at this x.
      const dx = (mx - cx) / R;
      if (Math.abs(dx) > 0.995) continue;
      const surface = cy - Math.sqrt(1 - dx * dx) * R;
      const my = surface - 6 - m.v * h * 0.42 + (reduced ? 0 : Math.cos(t * m.freq * 1.3 + m.phase) * 14);
      if (my < -4 || my > h + 4) continue;
      loose.rect(mx - 0.7, my - 0.7, 1.4, 1.4);
    }
    ctx.fillStyle = `rgba(${INK}, 0.28)`;
    ctx.fill(loose);
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
