/**
 * The globe: one striking shared figure for the domains — the world as a slow,
 * rotating point-field, ruled by its graticule, lit from the west, with a few
 * crimson sites marking where decisions land. Ink on the page's white, drawn
 * as an orthographic projection so it reads as an instrument, not a render.
 */

import { seeded } from '../lib/math';
import { dpr, prefersReducedMotion } from '../lib/prefers';
import { onFrame, onResize, type Frame } from '../lib/ticker';

export type GlobeHandle = { destroy: () => void };

const INK = '16, 16, 16';
const CRIMSON = '185, 31, 46';
const FRAME_MS = 33;
const TILT = 0.42;
const POINTS = 4200;

/** Cheap wrapped value noise on the sphere for a stable continent mask. */
function makeLand(seed: number): (lat: number, lon: number) => number {
  const rnd = seeded(seed);
  const size = 48;
  const grid = new Float32Array(size * size);
  for (let i = 0; i < grid.length; i++) grid[i] = rnd();
  const at = (x: number, y: number): number =>
    grid[((y % size) + size) % size * size + (((x % size) + size) % size)] ?? 0;
  const sample = (u: number, v: number): number => {
    const fx = u * size;
    const fy = v * size;
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const tx = fx - ix;
    const ty = fy - iy;
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    const a = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * sx;
    const b = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * sx;
    return a + (b - a) * sy;
  };
  return (lat, lon) => {
    const u = (lon / (Math.PI * 2) + 0.5) * 1.6;
    const v = (lat / Math.PI + 0.5) * 1.6;
    return sample(u, v) * 0.65 + sample(u * 2.3, v * 2.3) * 0.35;
  };
}

type Pt = { lat: number; lon: number; land: boolean };

export function initGlobe(canvas: HTMLCanvasElement): GlobeHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { destroy: () => undefined };

  const reduced = prefersReducedMotion();
  let w = 0;
  let h = 0;

  const land = makeLand(1377);
  const rnd = seeded(524287);

  // Fibonacci sphere: even coverage, no pole clumping.
  const pts: Pt[] = [];
  const GA = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < POINTS; i++) {
    const y = 1 - (i / (POINTS - 1)) * 2;
    const lat = Math.asin(y);
    const lon = ((i * GA) % (Math.PI * 2)) - Math.PI;
    pts.push({ lat, lon, land: land(lat, lon) > 0.5 });
  }

  // Sites: fixed bearings that pulse when they face the viewer.
  const sites = Array.from({ length: 5 }, () => ({
    lat: (rnd() - 0.5) * 1.9,
    lon: (rnd() * 2 - 1) * Math.PI,
    phase: rnd() * Math.PI * 2,
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

  /** Project a lat/lon at rotation rot; returns [sx, sy, zFront, shade]. */
  const project = (lat: number, lon: number, rot: number, cx: number, cy: number, R: number): [number, number, number, number] => {
    const L = lon + rot;
    const x = Math.cos(lat) * Math.sin(L);
    let y = Math.sin(lat);
    let z = Math.cos(lat) * Math.cos(L);
    const y2 = y * Math.cos(TILT) - z * Math.sin(TILT);
    z = y * Math.sin(TILT) + z * Math.cos(TILT);
    y = y2;
    // Light from the upper west.
    const shade = Math.max(0, -x * 0.62 + y * 0.3 + z * 0.72);
    return [cx + x * R, cy - y * R, z, shade];
  };

  let elapsed = 0;

  const draw = (frame: Frame): void => {
    if (w < 8) return;
    elapsed += frame.dt;
    if (!reduced && elapsed < FRAME_MS) return;
    elapsed = 0;

    const t = frame.time;
    const rot = reduced ? 0.6 : t * 0.000045;
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w / 2, h / 2) * 0.86;

    ctx.clearRect(0, 0, w, h);

    // Limb.
    ctx.strokeStyle = `rgba(${INK}, 0.5)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();

    // Graticule: parallels and meridians as short front-face segments.
    ctx.strokeStyle = `rgba(${INK}, 0.16)`;
    ctx.beginPath();
    const seg = 48;
    for (let p = -60; p <= 60; p += 30) {
      const lat = (p / 180) * Math.PI;
      let prev: [number, number, number, number] | null = null;
      for (let i = 0; i <= seg; i++) {
        const lon = (i / seg) * Math.PI * 2 - Math.PI;
        const cur = project(lat, lon, rot, cx, cy, R);
        if (prev && prev[2] > 0 && cur[2] > 0) {
          ctx.moveTo(prev[0], prev[1]);
          ctx.lineTo(cur[0], cur[1]);
        }
        prev = cur;
      }
    }
    for (let m = 0; m < 12; m++) {
      const lon = (m / 12) * Math.PI * 2 - Math.PI;
      let prev: [number, number, number, number] | null = null;
      for (let i = 0; i <= seg; i++) {
        const lat = (i / seg) * Math.PI - Math.PI / 2;
        const cur = project(lat, lon, rot, cx, cy, R);
        if (prev && prev[2] > 0 && cur[2] > 0) {
          ctx.moveTo(prev[0], prev[1]);
          ctx.lineTo(cur[0], cur[1]);
        }
        prev = cur;
      }
    }
    ctx.stroke();

    // Continents: bucketed by alpha so the field is a handful of fills.
    const buckets: Array<Path2D | null> = [null, null, null, null];
    for (const p of pts) {
      if (!p.land) continue;
      const [sx, sy, z, shade] = project(p.lat, p.lon, rot, cx, cy, R);
      if (z <= 0.02) continue;
      const a = 0.3 + shade * 0.6;
      const k = Math.min(3, Math.floor(a * 4));
      let path = buckets[k];
      if (!path) {
        path = new Path2D();
        buckets[k] = path;
      }
      const s = 1.5 + shade * 1.3;
      path.rect(sx - s / 2, sy - s / 2, s, s);
    }
    buckets.forEach((path, k) => {
      if (!path) return;
      ctx.fillStyle = `rgba(${INK}, ${(0.22 + (k / 3) * 0.6).toFixed(3)})`;
      ctx.fill(path);
    });

    // Sites: crimson marks with a breathing ring while they face us.
    for (const s of sites) {
      const [sx, sy, z] = project(s.lat, s.lon, rot, cx, cy, R);
      if (z <= 0.15) continue;
      const beat = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.0016 + s.phase);
      ctx.fillStyle = `rgba(${CRIMSON}, ${(0.5 + z * 0.5).toFixed(3)})`;
      ctx.fillRect(sx - 2.2, sy - 2.2, 4.4, 4.4);
      ctx.strokeStyle = `rgba(${CRIMSON}, ${(0.35 * (1 - beat) * z).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 4 + beat * 9, 0, Math.PI * 2);
      ctx.stroke();
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
  }

  return {
    destroy: () => {
      stopFrame?.();
      stopResize();
    },
  };
}
