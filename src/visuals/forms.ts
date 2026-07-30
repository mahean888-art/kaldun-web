/**
 * Living forms.
 *
 * One mechanic, nine bodies. Every panel shows the same law at work: a present
 * sweeping through a form from left to right. Ahead of the sweep the marks drift
 * and spread — the further from now, the wider they wander. Behind it they are
 * fixed and quiet: resolved, and no longer free to move. The sweep loops, and the
 * future re-opens.
 *
 * That is the whole argument of the site rendered as motion, so the figures are
 * not decoration attached to the copy — they are the copy, moving.
 *
 * A body is described as a density field rather than as drawing instructions:
 * `field(x, y)` returns 0..1, with y running −1 → 1 top to bottom and x running
 * −aspect → aspect, so a circle is a circle on any plate. The renderer samples
 * the field for where marks belong; the law does the rest.
 */

import { clamp, seeded } from '../lib/math';
import { dpr, prefersReducedMotion } from '../lib/prefers';
import { onFrame, onResize, type Frame } from '../lib/ticker';

export type Field = (x: number, y: number) => number;

/** `aspect` is halfWidth / halfHeight. */
type FormFactory = (seed: number, aspect: number) => Field;

export type FormName =
  | 'core'
  | 'lightcone'
  | 'lobes'
  | 'torus'
  | 'strata'
  | 'wavefront'
  | 'aperture'
  | 'dissolve'
  | 'descent';

/* --- field helpers ------------------------------------------------------ */

const len = (x: number, y: number): number => Math.sqrt(x * x + y * y);

/** Soft-edged band around a value: 1 at the centre of the band, 0 outside. */
const band = (v: number, centre: number, halfWidth: number, soft = 0.35): number => {
  const d = Math.abs(v - centre) / halfWidth;
  if (d >= 1) return 0;
  return d < 1 - soft ? 1 : (1 - d) / soft;
};

/** Cheap value noise, smooth enough for shading and fully deterministic. */
function makeNoise(seed: number): (x: number, y: number) => number {
  const rnd = seeded(seed);
  const size = 64;
  const grid = new Float32Array(size * size);
  for (let i = 0; i < grid.length; i++) grid[i] = rnd();

  const at = (ix: number, iy: number): number =>
    grid[((iy + size) % size) * size + ((ix + size) % size)] ?? 0;

  return (x, y) => {
    const fx = x * size;
    const fy = y * size;
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
}

/* --- the bodies --------------------------------------------------------- */

/**
 * World — the state of the world as it stands: a globe ruled by its own
 * graticule, lit from one side, heavier along the limb. No handle, no
 * instrument; the thing itself.
 */
function core(seed: number, _aspect: number): Field {
  const n = makeNoise(seed);
  return (x, y) => {
    const r = len(x / 0.94, y / 0.94);
    if (r > 1) return 0;

    // Read the disc as a sphere so the ruling wraps the way a globe's does.
    const lat = Math.asin(clamp(y / 0.94, -1, 1));
    const cosLat = Math.max(Math.cos(lat), 0.08);
    const lon = Math.asin(clamp(x / 0.94 / cosLat, -1, 1));

    const parallels = Math.pow(Math.abs(Math.cos(lat * 7)), 12);
    const meridians = Math.pow(Math.abs(Math.cos(lon * 6)), 10) * cosLat;
    const graticule = Math.min(1, parallels + meridians);

    // Continents: a coherent noise mass, so the globe is not a bare grid.
    const land = clamp((n(x * 1.15 + 5, y * 1.15 + 2) - 0.5) * 3.2);

    // Limb brighter than the body; terminator falling to the left.
    const limb = r > 0.93 ? 1 : 0;
    const daylight = 0.32 + 0.68 * clamp((x + 0.75) / 1.5);

    const d = Math.max(limb, Math.max(graticule * 0.85, land * 0.6) * daylight);
    return clamp(d);
  };
}

/** Light cone — one present, opening into everything reachable from it. */
function lightcone(seed: number, aspect: number): Field {
  const n = makeNoise(seed);
  return (xRaw, y) => {
    const x = xRaw / aspect;
    const t = (x + 0.94) / 1.88;
    if (t <= 0.02 || t > 1) return 0;
    const half = 0.05 + Math.pow(t, 0.8) * 0.82;
    const q = Math.abs(y) / half;
    if (q > 1) return 0;
    const grain = 0.5 + 0.5 * Math.cos(y * 22 + t * 3.2);
    const fade = Math.pow(1 - t, 0.5) * 0.8 + 0.2;
    const rim = q > 0.9 ? 1.3 : 1;
    return clamp(fade * rim * (0.34 + 0.66 * grain) * (0.7 + 0.5 * n(x + 7, y * 1.6)));
  };
}

/** Lobes — a distribution: one mass carrying the weight, and its tails. */
function lobes(seed: number, aspect: number): Field {
  const n = makeNoise(seed);
  const centres: Array<[number, number, number, number]> = [
    [-0.38, 0.06, 0.6, 1],
    [0.26, -0.22, 0.4, 0.6],
    [0.64, 0.28, 0.26, 0.36],
    [0.88, -0.42, 0.15, 0.2],
  ];
  return (xRaw, y) => {
    const x = xRaw / aspect;
    let d = 0;
    for (const [cx, cy, r, weight] of centres) {
      const q = len((x - cx) / (r * 1.2), (y - cy) / r);
      if (q < 1) d = Math.max(d, weight * (q > 0.82 ? 1 : 0.66));
    }
    if (d === 0) return 0;
    return clamp(d * (0.7 + 0.5 * n(x * 1.1 + 11, y * 1.1)));
  };
}

/** Torus — the cycle: rings returning on themselves, read in perspective. */
function torus(seed: number, aspect: number): Field {
  const n = makeNoise(seed);
  return (xRaw, y) => {
    const x = xRaw / aspect;
    const r = len(x / 0.95, (y + 0.02) / 0.44);
    if (r > 1.02) return 0;
    const rings =
      band(r, 0.24, 0.07) +
      band(r, 0.44, 0.06) +
      band(r, 0.62, 0.055) +
      band(r, 0.78, 0.05) +
      band(r, 0.92, 0.045);
    const centre = band(r, 0.09, 0.09);
    const d = Math.min(1, rings + centre * 0.85);
    if (d <= 0.02) return 0;
    const lit = y > 0 ? 1 : 0.7;
    return clamp(d * lit * (0.68 + 0.5 * n(x + 19, y * 2.2)));
  };
}

/** Strata — layers laid down over time, each thinner than the last. */
function strata(seed: number, aspect: number): Field {
  const n = makeNoise(seed);
  const layers: Array<[number, number, number]> = [
    [-0.62, 0.15, 1],
    [-0.26, 0.12, 0.8],
    [0.06, 0.1, 0.62],
    [0.34, 0.08, 0.46],
    [0.58, 0.06, 0.32],
    [0.79, 0.05, 0.22],
  ];
  return (xRaw, y) => {
    const x = xRaw / aspect;
    const reach = 0.96 - Math.pow(clamp((y + 1) / 2), 0.8) * 0.26;
    if (Math.abs(x) > reach) return 0;
    let d = 0;
    for (const [cy, half, weight] of layers) {
      const b = band(y, cy, half, 0.5);
      if (b > 0) d = Math.max(d, b * weight);
    }
    if (d === 0) return 0;
    const taper = 0.55 + 0.45 * (1 - clamp((x + 1) / 2));
    return clamp(d * taper * (0.7 + 0.5 * n(x * 1.4 + 29, y * 1.4)));
  };
}

/** Wavefront — arrival, spreading from a point until something stops it. */
function wavefront(seed: number, aspect: number): Field {
  const n = makeNoise(seed);
  return (xRaw, y) => {
    const x = xRaw / aspect;
    const ox = -0.88;
    if (x < ox - 0.02) return 0;
    const r = len((x - ox) / 1.74, y / 0.94);
    if (r > 1) return 0;
    const rings =
      band(r, 0.16, 0.07) +
      band(r, 0.34, 0.065) +
      band(r, 0.52, 0.06) +
      band(r, 0.7, 0.05) +
      band(r, 0.87, 0.042);
    const d = Math.min(1, rings);
    if (d <= 0.02) return 0;
    return clamp(d * (0.4 + 0.6 * (1 - r)) * (0.7 + 0.5 * n(x + 37, y * 1.8)));
  };
}

/** Aperture — the boundary of what is known, and the gap you decide through. */
function aperture(seed: number, _aspect: number): Field {
  const n = makeNoise(seed);
  return (x, y) => {
    const r = len(x / 0.88, y / 0.82);
    const ring = band(r, 0.78, 0.24, 0.5);
    if (ring <= 0.02) return 0;
    if (Math.abs(Math.atan2(y, x)) < 0.34) return 0;
    const heavier = 0.6 + 0.4 * clamp((y + 0.9) / 1.8);
    return clamp(ring * heavier * (0.66 + 0.55 * n(x * 1.2 + 43, y * 1.2)));
  };
}

/** Dissolve — a mass that comes apart, clumping as it goes. */
function dissolve(seed: number, aspect: number): Field {
  const n = makeNoise(seed);
  return (xRaw, y) => {
    const x = xRaw / aspect;
    const t = clamp((x + 0.95) / 1.9);
    if (len(x / 0.94, y / 0.7) > 1.04) return 0;
    const grain = n(x * 2.6 + 53, y * 2.6);
    const threshold = 0.12 + Math.pow(t, 1.35) * 0.7;
    if (grain < threshold) return 0;
    const strength = (grain - threshold) / Math.max(1 - threshold, 0.001);
    return clamp(strength * (1 - Math.pow(t, 1.6) * 0.5) * 1.5);
  };
}

/** Descent — one event, falling through orders of consequence. */
function descent(seed: number, aspect: number): Field {
  const n = makeNoise(seed);
  const steps: Array<[number, number, number]> = [
    [-0.8, 0.2, 0.32],
    [-0.44, 0.34, 0.5],
    [-0.06, 0.5, 0.72],
    [0.34, 0.72, 1],
    [0.74, 0.44, 0.58],
  ];
  return (xRaw, y) => {
    const x = xRaw / aspect;
    let d = 0;
    for (const [cx, halfW, weight] of steps) {
      const q = len((x - cx) / (halfW * 0.6), (y + 0.1) / (halfW * 1.15));
      if (q < 1) d = Math.max(d, weight * (q > 0.8 ? 1.1 : 0.64));
    }
    if (d === 0) return 0;
    return clamp(d * (0.68 + 0.5 * n(x * 1.3 + 61, y * 1.3)));
  };
}

const FORMS: Record<FormName, FormFactory> = {
  core,
  lightcone,
  lobes,
  torus,
  strata,
  wavefront,
  aperture,
  dissolve,
  descent,
};

/* --- the animator ------------------------------------------------------- */

type Mark = {
  /** Settled position, in field space. */
  hx: number;
  hy: number;
  /** Field density here — drives brightness and mark length. */
  d: number;
  phase: number;
  freq: number;
  /** How far this mark wanders while it is still in the future. */
  amp: number;
  /** A few marks resolve in the accent colour. */
  accent: 0 | 1 | 2;
};

export type FormHandle = { destroy: () => void };

/** One full pass of the present across the body, in milliseconds. */
const PERIOD = 11000;

export function initForm(canvas: HTMLCanvasElement, name: FormName, seed = 1): FormHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { destroy: () => undefined };

  const reduced = prefersReducedMotion();
  let w = 0;
  let h = 0;
  let halfH = 0;
  let aspect = 1;
  let cx = 0;
  let cy = 0;
  let marks: Mark[] = [];

  const build = (): void => {
    const rnd = seeded(seed * 7919 + 13);
    const field = FORMS[name](seed, aspect);
    const target = Math.round(clamp((w * h) / 105, 1200, 4400));
    marks = [];

    // Rejection sampling: the body decides where its marks belong.
    let guard = 0;
    while (marks.length < target && guard < target * 60) {
      guard += 1;
      const x = (rnd() * 2 - 1) * aspect;
      const y = rnd() * 2 - 1;
      const d = field(x, y);
      if (d <= 0.02 || rnd() > d) continue;
      const a = rnd();
      marks.push({
        hx: x,
        hy: y,
        d,
        phase: rnd() * Math.PI * 2,
        freq: 0.00035 + rnd() * 0.0009,
        amp: 0.035 + rnd() * 0.11,
        accent: a < 0.02 ? 1 : a < 0.07 ? 2 : 0,
      });
    }
  };

  const resize = (): void => {
    const rect = canvas.getBoundingClientRect();
    const nextW = Math.max(Math.round(rect.width), 1);
    const nextH = Math.max(Math.round(rect.height), 1);
    if (nextW < 8 || nextH < 8) return;

    const ratio = dpr(2);
    w = nextW;
    h = nextH;
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const inset = 0.05;
    halfH = (h * (1 - inset * 2)) / 2;
    aspect = (w * (1 - inset * 2)) / 2 / halfH;
    cx = w / 2;
    cy = h / 2;
    build();
  };

  const draw = (frame: Frame): void => {
    if (w < 8 || marks.length === 0) return;
    const time = frame.time;

    // The present, crossing the body and a little past each edge.
    const cycle = reduced ? 1 : ((time % PERIOD) / PERIOD) * 1.24 - 0.12;
    const sweep = -aspect + cycle * (aspect * 2);
    const horizon = aspect * 2;

    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'butt';

    // Rake of the engraving, constant across every body.
    const dx = Math.cos(-0.62);
    const dy = Math.sin(-0.62);

    for (const m of marks) {
      const ahead = (m.hx - sweep) / horizon;

      let driftY = 0;
      let driftX = 0;
      let alpha: number;

      if (ahead > 0) {
        // Still in the future: free to move, and freer the further out it is.
        const reach = Math.min(1, ahead * 3.4);
        const wobble = Math.sin(time * m.freq + m.phase);
        driftY = wobble * m.amp * reach;
        driftX = Math.cos(time * m.freq * 0.7 + m.phase) * m.amp * reach * 0.4;
        // Unformed further out, but never invisible: the body must always read.
        alpha = (0.12 + m.d * 0.34) * (1 - Math.min(0.42, ahead * 0.6));
      } else {
        // Resolved: fixed where it landed, and quieter for it.
        alpha = 0.11 + m.d * 0.4;
      }

      // Brightest right at the present, where the future is being decided.
      const nearNow = 1 - Math.min(1, Math.abs(ahead) / 0.06);
      if (nearNow > 0) alpha += nearNow * 0.34 * m.d;

      const px = cx + (m.hx + driftX) * halfH;
      const py = cy + (m.hy + driftY) * halfH;
      const length = 1.1 + m.d * 3 + (ahead > 0 ? 0 : 0.5);

      if (m.accent === 1 && ahead <= 0) {
        // A resolved mark, committed in red.
        ctx.strokeStyle = `rgba(224, 68, 52, ${(alpha * 2).toFixed(3)})`;
        ctx.lineWidth = 1.1;
      } else if (m.accent === 2) {
        ctx.strokeStyle = `rgba(217, 166, 38, ${(alpha * 1.15).toFixed(3)})`;
        ctx.lineWidth = 0.9;
      } else {
        ctx.strokeStyle = `rgba(237, 232, 222, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 0.9;
      }

      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + dx * length, py + dy * length);
      ctx.stroke();
    }

    // The present itself: a hairline, only while it is crossing the body.
    if (!reduced && cycle > 0 && cycle < 1) {
      const sx = cx + sweep * halfH;
      const grad = ctx.createLinearGradient(sx - 26, 0, sx + 4, 0);
      grad.addColorStop(0, 'rgba(224, 68, 52, 0)');
      grad.addColorStop(1, 'rgba(224, 68, 52, 0.1)');
      ctx.fillStyle = grad;
      ctx.fillRect(sx - 26, 0, 28, h);

      ctx.strokeStyle = 'rgba(224, 68, 52, 0.34)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, h * 0.06);
      ctx.lineTo(sx, h * 0.94);
      ctx.stroke();
    }
  };

  resize();

  const stopResize = onResize(resize);
  let stopFrame: (() => void) | null = null;

  const still = (): void =>
    draw({ dt: 0, time: PERIOD, scrollY: 0, velocity: 0, vh: window.innerHeight, vw: window.innerWidth });

  if (reduced) {
    still();
  } else {
    // Only the visible panel animates.
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
