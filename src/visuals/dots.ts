/**
 * Dot art, generated: the fan of futures in the mission window, and the four
 * domain drawings. Every drawing is a halftone on one grid pitch, orange on
 * paper, with a single charcoal mark at the point that matters. The fan draws
 * from left to right once it enters view, the charcoal path last; the domain
 * drawings hold still and shimmer faintly on hover.
 */

import { prefersReducedMotion } from '../lib/prefers';

const NS = 'http://www.w3.org/2000/svg';
const f = (n: number): string => n.toFixed(1);

/** A deterministic pseudo-random source, so every visit draws the same. */
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

// --- the fan of futures ---------------------------------------------------------------

export function initFan(host: HTMLElement): void {
  const W = 560;
  const H = 440;
  const O = [44, 300];
  const r = rng(7);
  const out: string[] = [];
  // Eight futures fan out; each is a quadratic path sampled into dots.
  const ends: Array<[number, number, number]> = [
    [520, 70, 120], [528, 140, 60], [530, 205, 40], [526, 265, 10], [522, 320, -10], [520, 370, -30], [515, 410, -40], [470, 430, -50],
  ];
  const along = (cx: number, cy: number, ex: number, ey: number, step: number): Array<[number, number, number]> => {
    const pts: Array<[number, number, number]> = [];
    let last: [number, number] | null = null;
    for (let i = 0; i <= 400; i++) {
      const t = i / 400;
      const x = (1 - t) ** 2 * O[0]! + 2 * (1 - t) * t * cx + t * t * ex;
      const y = (1 - t) ** 2 * O[1]! + 2 * (1 - t) * t * cy + t * t * ey;
      if (!last || Math.hypot(x - last[0], y - last[1]) >= step) {
        pts.push([x, y, t]);
        last = [x, y];
      }
    }
    return pts;
  };
  ends.forEach(([ex, ey, bend], k) => {
    const cx = (O[0]! + ex) / 2;
    const cy = (O[1]! + ey) / 2 + bend;
    for (const [x, y, t] of along(cx, cy, ex, ey, 9)) {
      // Halftone: dots grow toward the middle of the run and thin at its end.
      const rad = 1.1 + 1.5 * Math.sin(Math.PI * Math.min(1, t * 1.1)) * (0.75 + 0.25 * r());
      const o = 0.35 + 0.55 * (1 - t * 0.6);
      out.push(`<circle class="fd" cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" style="--d:${(t * 1.6 + k * 0.04).toFixed(2)}s;fill-opacity:${o.toFixed(2)}"/>`);
    }
  });
  // The found arrangement: one charcoal path that climbs to a solid block.
  const found = along(250, 250, 470, 120, 8);
  for (const [x, y, t] of found) out.push(`<circle class="fd fd--k" cx="${f(x)}" cy="${f(y)}" r="2.1" style="--d:${(1.9 + t * 0.9).toFixed(2)}s"/>`);
  out.push(`<rect class="fd fd--block" x="466" y="96" width="34" height="34" style="--d:2.85s"/>`);
  out.push(`<rect class="fd--origin" x="${O[0]! - 6}" y="${O[1]! - 6}" width="12" height="12"/>`);
  host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">${out.join('')}</svg>`;
  if (prefersReducedMotion()) {
    host.classList.add('is-drawn');
    return;
  }
  const io = new IntersectionObserver(
    (e) => {
      if (!e.some((x) => x.isIntersecting)) return;
      io.disconnect();
      host.classList.add('is-drawn');
    },
    { threshold: 0.35 },
  );
  io.observe(host);
}

// --- the four domain drawings -----------------------------------------------------------

type Field = (x: number, y: number) => number; // 0..1 ink at a point of the 0..1 square
type Mark = [number, number, number, number]; // charcoal block: x, y, w, h in the square

const clamp = (v: number): number => Math.max(0, Math.min(1, v));
const band = (d: number, w: number): number => clamp(1 - Math.abs(d) / w);

const DRAW: Record<string, { field: Field; mark: Mark }> = {
  // A · stacked vault blocks; the mark on the block where cash sits idle.
  res: {
    field: (x, y) => {
      let v = 0;
      const blocks: Array<[number, number, number, number]> = [
        [0.12, 0.62, 0.56, 0.24], [0.22, 0.36, 0.56, 0.24], [0.32, 0.1, 0.56, 0.24],
      ];
      for (const [bx, by, bw, bh] of blocks) {
        if (x > bx && x < bx + bw && y > by && y < by + bh) {
          const edge = Math.min(x - bx, bx + bw - x, y - by, by + bh - y);
          v = Math.max(v, edge < 0.03 ? 1 : 0.32 + 0.4 * (1 - (y - by) / bh));
        }
      }
      return v;
    },
    mark: [0.7, 0.12, 0.08, 0.08],
  },
  // B · interlocking rings; the mark where they cross.
  cred: {
    field: (x, y) => {
      const a = band(Math.hypot(x - 0.38, y - 0.5) - 0.26, 0.06);
      const b = band(Math.hypot(x - 0.62, y - 0.5) - 0.26, 0.06);
      return Math.max(a, b);
    },
    mark: [0.465, 0.255, 0.07, 0.07],
  },
  // C · a storm spiral; the mark at its eye.
  risk: {
    field: (x, y) => {
      const dx = x - 0.5;
      const dy = y - 0.5;
      const rr = Math.hypot(dx, dy);
      if (rr > 0.47 || rr < 0.035) return 0;
      // Three turns of an Archimedean arm, thinning toward the edge.
      const th = Math.atan2(dy, dx) / (2 * Math.PI);
      const k = th + rr * 6.4;
      const frac = k - Math.floor(k);
      return band(frac - 0.5, 0.3) * clamp(1.25 - rr * 1.7);
    },
    mark: [0.465, 0.465, 0.07, 0.07],
  },
  // D · rows of solar panels; the mark at the end of the last row, where the penalty binds.
  proj: {
    field: (x, y) => {
      for (let i = 0; i < 4; i++) {
        const y0 = 0.16 + i * 0.2;
        const skew = (x - 0.1) * 0.18;
        const yy = y - y0 - skew;
        const cell = ((x - 0.08) / 0.13) % 1;
        if (x > 0.08 && x < 0.86 && yy > 0 && yy < 0.11 && cell < 0.86) return 0.55 + 0.45 * (1 - yy / 0.11);
      }
      return 0;
    },
    mark: [0.84, 0.86, 0.07, 0.07],
  },
};

export function initDots(root: ParentNode = document): void {
  for (const host of root.querySelectorAll<HTMLElement>('[data-dot]')) {
    const d = DRAW[host.dataset['dot'] ?? ''];
    if (!d) continue;
    const W = 260;
    const H = 190;
    const P = 7; // one grid pitch for every drawing
    const S = Math.min(W, H) * 0.96;
    const ox = (W - S) / 2;
    const oy = (H - S) / 2;
    const r = rng(host.dataset['dot']!.length * 31);
    const out: string[] = [];
    for (let gy = P / 2; gy < H; gy += P) {
      for (let gx = P / 2; gx < W; gx += P) {
        const v = d.field((gx - ox) / S, (gy - oy) / S);
        if (v <= 0.04) continue;
        const rad = 0.5 + 2.6 * v;
        out.push(`<circle cx="${f(gx)}" cy="${f(gy)}" r="${f(Math.min(rad, P * 0.46))}" style="--s:${(r() * 2).toFixed(2)}s"/>`);
      }
    }
    const [mx, my, mw, mh] = d.mark;
    const m = `<rect class="dk" x="${f(ox + mx * S)}" y="${f(oy + my * S)}" width="${f(mw * S)}" height="${f(mh * S)}"/>`;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = `<g class="dd">${out.join('')}</g>${m}`;
    host.replaceChildren(svg);
  }
}
