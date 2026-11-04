/**
 * The luminous dot system: one way of drawing for the whole site.
 *
 * Every figure is a field of dots on a strict 8 px grid, orange on paper. A
 * dot's size, opacity and glow say how much passes through that point; one
 * charcoal mark sits at the point that matters. The same renderer draws the
 * field of futures (in the mission window and on the manifesto) and the four
 * domain drawings.
 *
 * The field of futures is computed, not painted: a few hundred simulated
 * paths fan out from one origin, and each grid cell counts how many pass
 * through it, so the field glows densest along the likely corridor and fades
 * at its edges. One path, the arrangement found, climbs out of the corridor
 * to a lit endpoint; it is drawn in charcoal.
 *
 * Canvases breathe slowly (opacity ±10% over six seconds) unless the visitor
 * prefers reduced motion; domain drawings intensify along their mechanism on
 * hover for a moment, and are otherwise still.
 */

import { prefersReducedMotion } from '../lib/prefers';

const PITCH = 7;
const AMBER: [number, number, number] = [240, 144, 10];
const INK = '#171410';

type Grid = { cols: number; rows: number; v: Float32Array };
type Art = { grid: Grid; ink: Array<[number, number]>; lit: Array<[number, number]>; hot?: Float32Array; floor?: number };

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const grid = (w: number, h: number): Grid => {
  const cols = Math.floor(w / PITCH);
  const rows = Math.floor(h / PITCH);
  return { cols, rows, v: new Float32Array(cols * rows) };
};

/** A 3 × 3 box blur, so densities read as a soft glow rather than single tracks. */
function blur(g: Grid): void {
  const out = new Float32Array(g.v.length);
  for (let y = 0; y < g.rows; y++) {
    for (let x = 0; x < g.cols; x++) {
      let sum = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx;
        const yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= g.cols || yy >= g.rows) continue;
        sum += g.v[yy * g.cols + xx]! * (dx === 0 && dy === 0 ? 2 : 1);
        n += dx === 0 && dy === 0 ? 2 : 1;
      }
      out[y * g.cols + x] = sum / n;
    }
  }
  g.v.set(out);
}

// --- the field of futures ---------------------------------------------------------------

function futures(w: number, h: number): Art {
  const g = grid(w, h);
  const r = rng(42);
  const ox = 3;
  const oy = Math.round(g.rows * 0.58);
  const N = 2400;
  // Each future keeps its own heading, with noise that compounds with time:
  // together they fan out from the origin, densest along the likely corridor.
  const gauss = (): number => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());
  for (let n = 0; n < N; n++) {
    const slope = gauss() * 0.3 - 0.04;
    let wob = 0;
    for (let x = ox; x < g.cols; x++) {
      wob += gauss() * 0.22;
      const y = oy + slope * (x - ox) + wob;
      const yi = Math.round(y);
      if (yi < 0 || yi >= g.rows) break;
      g.v[yi * g.cols + x]! += 1;
    }
  }
  blur(g);
  blur(g);
  // Each column against its own peak: at every horizon, the likely corridor
  // glows and the edges fade, with a gentle dimming as the futures spread.
  for (let x = 0; x < g.cols; x++) {
    let mx = 0;
    for (let y = 0; y < g.rows; y++) mx = Math.max(mx, g.v[y * g.cols + x]!);
    if (!mx) continue;
    const t = x / g.cols;
    for (let y = 0; y < g.rows; y++) {
      const i = y * g.cols + x;
      g.v[i] = Math.pow(g.v[i]! / mx, 1.15) * (1 - 0.3 * t);
    }
  }
  // The arrangement found: leaves the corridor and climbs to a lit endpoint.
  const ink: Array<[number, number]> = [];
  const end: [number, number] = [g.cols - 6, Math.round(g.rows * 0.16)];
  for (let x = ox; x <= end[0]; x++) {
    const t = (x - ox) / (end[0] - ox);
    const y = oy + (end[1] - oy) * (t * t * (3 - 2 * t));
    ink.push([x, Math.round(y)]);
  }
  return { grid: g, ink, lit: [end, [ox, oy]], floor: 0.05 };
}

// --- the domain drawings ------------------------------------------------------------------

/** A · a 24-hour ring, glowing where redemptions arrive; four lit dots are the real-time banks. */
function clock(w: number, h: number): Art {
  const g = grid(w, h);
  const cx = g.cols / 2;
  const cy = g.rows / 2;
  const R = Math.min(g.cols, g.rows) * 0.36;
  const hot = new Float32Array(g.v.length);
  for (let y = 0; y < g.rows; y++) {
    for (let x = 0; x < g.cols; x++) {
      const d = Math.hypot(x - cx, y - cy);
      const band = Math.max(0, 1 - Math.abs(d - R) / 2.2);
      if (!band) continue;
      const hr = ((Math.atan2(x - cx, -(y - cy)) / (2 * Math.PI) + 1) % 1) * 24;
      const load = 0.22 + Math.exp(-(((hr - 12.5) / 3.4) ** 2)) + 0.7 * Math.exp(-(((hr - 4.5) / 2) ** 2)) + 0.6 * Math.exp(-(((hr - 21.5) / 2.2) ** 2));
      g.v[y * g.cols + x] = band * Math.min(1, load / 1.2);
      hot[y * g.cols + x] = band * (hr < 8 || hr >= 18 ? 1 : 0.2);
    }
  }
  const lit: Array<[number, number]> = [0, 6, 18, 21].map((hr) => {
    const a = (hr / 24) * 2 * Math.PI;
    return [Math.round(cx + Math.sin(a) * R), Math.round(cy - Math.cos(a) * R)];
  });
  return { grid: g, ink: [[Math.round(cx), Math.round(cy)]], lit, hot };
}

/** B · a maturity wall: columns of dots by year, one column glowing hot. */
function wall(w: number, h: number): Art {
  const g = grid(w, h);
  const hot = new Float32Array(g.v.length);
  const years = 9;
  const heights = [0.22, 0.3, 0.36, 0.48, 0.92, 0.44, 0.34, 0.26, 0.18];
  const span = Math.floor((g.cols - 4) / years);
  for (let k = 0; k < years; k++) {
    const x0 = 2 + k * span;
    const top = Math.round(g.rows * (1 - heights[k]!) - 2);
    for (let x = x0; x < x0 + span - 1; x++) {
      for (let y = top; y < g.rows - 2; y++) {
        const i = y * g.cols + x;
        g.v[i] = k === 4 ? 1 : 0.42 + 0.2 * ((g.rows - y) / g.rows);
        hot[i] = k === 4 ? 1 : 0;
      }
    }
  }
  const x4 = 2 + 4 * span + Math.floor((span - 1) / 2);
  return { grid: g, ink: [[x4, Math.round(g.rows * 0.08) - 1]], lit: [], hot };
}

/** C · many small policyholders, all wired to one bright shared node: a common provider. */
function shared(w: number, h: number): Art {
  const g = grid(w, h);
  const hot = new Float32Array(g.v.length);
  const r = rng(9);
  const hub: [number, number] = [Math.round(g.cols * 0.5), Math.round(g.rows * 0.5)];
  const nodes: Array<[number, number]> = [];
  // Policyholders on two loose rings around the one provider they all depend on.
  for (const [count, k] of [[12, 0.27], [20, 0.44]] as const) {
    for (let n = 0; n < count; n++) {
      const a = (n / count) * Math.PI * 2 + (k > 0.3 ? 0.13 : 0) + (r() - 0.5) * 0.08;
      const R = Math.min(g.cols, g.rows) * k;
      nodes.push([Math.round(hub[0] + Math.cos(a) * R * (g.cols / g.rows > 1.2 ? 1.5 : 1)), Math.round(hub[1] + Math.sin(a) * R)]);
    }
  }
  for (const [x, y] of nodes) {
    // The wire: faint dots from the policyholder to the shared provider.
    const steps = Math.max(Math.abs(x - hub[0]), Math.abs(y - hub[1]));
    for (let s = 1; s < steps; s++) {
      const px = Math.round(x + ((hub[0] - x) * s) / steps);
      const py = Math.round(y + ((hub[1] - y) * s) / steps);
      const i = py * g.cols + px;
      g.v[i] = Math.max(g.v[i]!, 0.16 + 0.5 * (s / steps) ** 2);
      hot[i] = 1;
    }
    g.v[y * g.cols + x] = 0.62;
  }
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (dx * dx + dy * dy <= 5) g.v[(hub[1] + dy) * g.cols + hub[0] + dx] = 1;
  return { grid: g, ink: [hub], lit: [], hot };
}

/** D · solar rows feeding a line; one supply link glows where the delay binds. */
function supply(w: number, h: number): Art {
  const g = grid(w, h);
  const hot = new Float32Array(g.v.length);
  const rows = 4;
  const lineY = g.rows - 4;
  for (let k = 0; k < rows; k++) {
    const y0 = 3 + k * 5;
    for (let y = y0; y < y0 + 3; y++) {
      for (let x = 3; x < Math.round(g.cols * 0.56); x++) {
        if ((x - 3) % 6 === 5) continue;
        g.v[y * g.cols + x] = 0.5 + 0.12 * (y0 + 2 - y);
      }
    }
    // Each row feeds down to the line.
    const fx = Math.round(g.cols * 0.56) + 1 + k * 2;
    for (let y = y0 + 1; y <= lineY; y++) g.v[y * g.cols + fx] = Math.max(g.v[y * g.cols + fx]!, 0.3);
  }
  for (let x = Math.round(g.cols * 0.56); x < g.cols - 3; x++) {
    const i = lineY * g.cols + x;
    const binding = x > g.cols * 0.72 && x < g.cols * 0.84;
    g.v[i] = binding ? 1 : 0.42;
    hot[i] = binding ? 1 : 0;
    if (binding) {
      g.v[(lineY - 1) * g.cols + x] = 0.55;
      g.v[(lineY + 1) * g.cols + x] = 0.55;
      hot[(lineY - 1) * g.cols + x] = 1;
      hot[(lineY + 1) * g.cols + x] = 1;
    }
  }
  return { grid: g, ink: [[Math.round(g.cols * 0.78), lineY - 3]], lit: [], hot };
}

const ARTS: Record<string, (w: number, h: number) => Art> = { futures, clock, wall, shared, supply };

/** Paint an art onto a canvas at the device's resolution. `boost` lifts the mechanism. */
function paint(canvas: HTMLCanvasElement, art: Art, boost = 0): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const { cols, rows, v } = art.grid;
  const W = cols * PITCH;
  const H = rows * PITCH;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  const c = canvas.getContext('2d');
  if (!c) return;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, W, H);
  const [R, G, B] = AMBER;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      let k = v[i]!;
      if (art.hot && boost) k = Math.min(1, k + art.hot[i]! * boost * 0.45);
      // The whole grid is present, faintly; brightness is what passes through.
      if (k < 0.04) {
        if (!art.floor) continue;
        k = art.floor;
      }
      const rad = 0.9 + 2.4 * k;
      c.shadowBlur = 8 * k;
      c.shadowColor = `rgba(${R},${G},${B},${(0.55 * k).toFixed(3)})`;
      c.fillStyle = `rgba(${R},${G},${B},${(0.12 + 0.88 * k).toFixed(3)})`;
      c.beginPath();
      c.arc(x * PITCH + PITCH / 2, y * PITCH + PITCH / 2, rad, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.shadowBlur = 0;
  // The charcoal mark: the path found (or the point that matters).
  c.fillStyle = INK;
  for (const [x, y] of art.ink) {
    c.beginPath();
    c.arc(x * PITCH + PITCH / 2, y * PITCH + PITCH / 2, art.ink.length > 4 ? 2.1 : 0, 0, Math.PI * 2);
    c.fill();
  }
  if (art.ink.length <= 4) for (const [x, y] of art.ink) c.fillRect(x * PITCH + PITCH / 2 - 6, y * PITCH + PITCH / 2 - 6, 12, 12);
  // Lit points: an orange square at the end of the path found, lit dots on the ring.
  for (const [n, [x, y]] of art.lit.entries()) {
    const big = art.ink.length > 4 && n === 0;
    c.shadowBlur = big ? 18 : 10;
    c.shadowColor = `rgba(${R},${G},${B},0.85)`;
    c.fillStyle = `rgb(${R},${G},${B})`;
    if (big) c.fillRect(x * PITCH + PITCH / 2 - 9, y * PITCH + PITCH / 2 - 9, 18, 18);
    else {
      c.beginPath();
      c.arc(x * PITCH + PITCH / 2, y * PITCH + PITCH / 2, 4.2, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.shadowBlur = 0;
}

export function initFields(root: ParentNode = document): void {
  const reduced = prefersReducedMotion();
  for (const canvas of root.querySelectorAll<HTMLCanvasElement>('canvas[data-field]')) {
    const make = ARTS[canvas.dataset['field'] ?? ''];
    if (!make) continue;
    let art: Art | null = null;
    const box = canvas.parentElement!;
    let lastW = 0;
    const draw = (): void => {
      const cs = getComputedStyle(box);
      const w = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const ratio = Number(canvas.dataset['ratio'] ?? (560 / 520));
      const fill = canvas.dataset['fill'] !== undefined;
      const h = fill ? box.clientHeight : canvas.dataset['field'] === 'futures' ? w / ratio : box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      if (w < 8 || Math.abs(w - lastW) < 2) return;
      lastW = w;
      art = make(w, h);
      paint(canvas, art);
    };
    new ResizeObserver(draw).observe(box);
    draw();
    if (!reduced) canvas.classList.add('is-breathing');
    // Hover lifts the mechanism for a moment, then lets it settle.
    const card = canvas.closest<HTMLElement>('[data-glow]');
    if (card && !reduced) {
      let raf = 0;
      card.addEventListener('pointerenter', () => {
        cancelAnimationFrame(raf);
        const t0 = performance.now();
        const step = (now: number): void => {
          const t = (now - t0) / 1500;
          if (art) paint(canvas, art, Math.sin(Math.min(1, t) * Math.PI));
          if (t < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      });
    }
  }
}
