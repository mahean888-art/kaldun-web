/**
 * Panel figures.
 *
 * One abstract plate per Engine movement and per decision domain, generated from
 * coordinates rather than drawn by hand. Each is a diagram of the thing it sits
 * beside — a measured field, a branching, a distribution, a cycle, a cascade — in
 * the mark's three colours.
 *
 * Deterministic: the same seed always produces the same plate, so the page looks
 * identical on every load and in every screenshot. The viewBox ratio matches the
 * plate's CSS aspect-ratio exactly, so nothing is ever letterboxed.
 */

import { svg } from '../lib/dom';
import { seeded } from '../lib/math';

/** 12:5 — matches `.figure { aspect-ratio: 12 / 5 }`. */
const W = 420;
const H = 175;
const PAD = 26;
const FLOOR = H - 26;
const CEIL = 24;

export type FigureName =
  | 'state'
  | 'forward'
  | 'explicit'
  | 'learn'
  | 'allocation'
  | 'wavefront'
  | 'curves'
  | 'correlation'
  | 'cascade';

type S = { w?: number; o?: number; d?: number; c?: 'cream' | 'gold' | 'red' };

const COLOUR = {
  cream: 'var(--cream)',
  gold: 'var(--gold)',
  red: 'var(--crimson-hi)',
} as const;

function line(d: string, s: S = {}): SVGElement {
  return svg('path', {
    d,
    fill: 'none',
    stroke: COLOUR[s.c ?? 'cream'],
    'stroke-width': s.w ?? 1,
    opacity: s.o ?? 0.5,
    'vector-effect': 'non-scaling-stroke',
    'data-draw': '',
    style: `--d:${s.d ?? 0}`,
  });
}

function dot(x: number, y: number, r = 2, s: S = {}): SVGElement {
  return svg('circle', {
    cx: x.toFixed(1),
    cy: y.toFixed(1),
    r,
    fill: COLOUR[s.c ?? 'cream'],
    opacity: s.o ?? 0.8,
  });
}

function box(x: number, y: number, w: number, h: number, s: S = {}): SVGElement {
  return svg('rect', {
    x: x.toFixed(1),
    y: y.toFixed(1),
    width: Math.max(w, 0.5).toFixed(1),
    height: Math.max(h, 0.5).toFixed(1),
    fill: COLOUR[s.c ?? 'cream'],
    opacity: s.o ?? 0.5,
  });
}

/** The ruled scale every plate shares, so the set reads as one instrument. */
function scale(divisions = 16): SVGElement[] {
  const out: SVGElement[] = [line(`M${PAD} ${FLOOR}H${W - PAD}`, { o: 0.2 })];
  for (let i = 0; i <= divisions; i++) {
    const x = PAD + (i / divisions) * (W - PAD * 2);
    const major = i % 4 === 0;
    out.push(
      line(`M${x.toFixed(1)} ${FLOOR}v${major ? 7 : 3.5}`, {
        c: 'gold',
        o: major ? 0.55 : 0.24,
      }),
    );
  }
  return out;
}

/* --- Engine ------------------------------------------------------------ */

/** Known state: a measured field, denser where the evidence is. */
function state(seed = 1): SVGElement[] {
  const rnd = seeded(seed);
  const out: SVGElement[] = [...scale()];
  const cols = 22;
  for (let c = 0; c <= cols; c++) {
    const x = PAD + (c / cols) * (W - PAD * 2);
    const n = 2 + Math.floor(rnd() * 5);
    for (let i = 0; i < n; i++) {
      const y = CEIL + rnd() * (FLOOR - CEIL - 8);
      out.push(
        rnd() > 0.4
          ? box(x - 1.7, y, 3.4, 3.4, { o: 0.4 + rnd() * 0.55 })
          : dot(x, y + 1.7, 1.5, { c: 'gold', o: 0.7 }),
      );
    }
  }
  // The present: the column being read now.
  const now = W - PAD - 46;
  out.push(line(`M${now} ${CEIL - 6}V${FLOOR}`, { c: 'red', o: 0.9, w: 1.3, d: 2 }));
  out.push(dot(now, (CEIL + FLOOR) / 2, 3, { c: 'red', o: 1 }));
  return out;
}

/** Run it forward: one present, branching. */
function forward(seed = 2): SVGElement[] {
  const rnd = seeded(seed);
  const out: SVGElement[] = [...scale()];
  const x0 = PAD + 8;
  const y0 = (CEIL + FLOOR) / 2;
  const span = (W - PAD * 2 - 20) / 3;

  const grow = (x: number, y: number, depth: number, spread: number): void => {
    if (depth === 0) return;
    for (let k = 0; k < 2; k++) {
      const nx = x + span * (0.9 + rnd() * 0.2);
      const ny = Math.max(CEIL, Math.min(FLOOR - 6, y + (k === 0 ? -spread : spread) * (0.6 + rnd() * 0.7)));
      out.push(
        line(
          `M${x.toFixed(1)} ${y.toFixed(1)}C${(x + span * 0.45).toFixed(1)} ${y.toFixed(1)} ${(nx - span * 0.45).toFixed(1)} ${ny.toFixed(1)} ${nx.toFixed(1)} ${ny.toFixed(1)}`,
          { w: depth === 3 ? 1.7 : 1.15, o: 0.3 + depth * 0.2, d: 3 - depth },
        ),
      );
      if (depth === 1) {
        out.push(dot(nx, ny, 2.4, { c: 'gold', o: 0.95 }));
        // The terminal edge: where each future lands.
        out.push(line(`M${(W - PAD + 2).toFixed(1)} ${ny.toFixed(1)}h6`, { c: 'gold', o: 0.5, d: 3 }));
      }
      grow(nx, ny, depth - 1, spread * 0.55);
    }
  };

  grow(x0, y0, 3, 40);
  // The present, and the boundary the futures are read against.
  out.push(line(`M${x0} ${CEIL - 4}V${FLOOR}`, { c: 'red', o: 0.35, d: 0 }));
  out.push(line(`M${W - PAD} ${CEIL - 4}V${FLOOR}`, { c: 'gold', o: 0.3, d: 3 }));
  out.push(dot(x0, y0, 4, { c: 'red', o: 1 }));
  return out;
}

/** Explicit futures: the odds, stated as bar lengths. */
function explicit(): SVGElement[] {
  const weights = [0.54, 0.23, 0.15, 0.08];
  const out: SVGElement[] = [];
  const usable = W - PAD * 2 - 6;
  weights.forEach((wt, i) => {
    const y = CEIL + 12 + i * 32;
    out.push(line(`M${PAD + 6} ${y}H${W - PAD}`, { o: 0.14 }));
    out.push(
      box(PAD + 6, y - 6, usable * wt, 6, {
        c: i === 0 ? 'red' : 'cream',
        o: i === 0 ? 0.95 : 0.5 - i * 0.09,
      }),
    );
    for (let t = 1; t <= 4; t++) {
      const x = PAD + 6 + (usable / 4) * t;
      out.push(line(`M${x.toFixed(1)} ${y}v5`, { o: 0.24, c: 'gold' }));
    }
  });
  out.push(line(`M${PAD + 6} ${CEIL}V${FLOOR + 4}`, { o: 0.35, w: 1.3 }));
  return out;
}

/** Learn from reality: a cycle closed by resolution marks. */
function learn(): SVGElement[] {
  const cx = W / 2;
  const cy = (CEIL + FLOOR) / 2;
  const turns = 2.6;
  const rMax = (FLOOR - CEIL) / 2 - 2;
  const pts: string[] = [];
  for (let i = 0; i <= 220; i++) {
    const t = i / 220;
    const a = t * Math.PI * 2 * turns - Math.PI / 2;
    const r = 8 + t * rMax;
    pts.push(`${(cx + Math.cos(a) * r * 2.1).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`);
  }
  const out: SVGElement[] = [line(`M${pts.join('L')}`, { w: 1.1, o: 0.55 })];
  for (let k = 1; k <= 3; k++) {
    const r = 8 + (k / turns) * rMax;
    out.push(
      line(`M${(cx + r * 2.1).toFixed(1)} ${(cy - 7).toFixed(1)}v14`, {
        c: 'gold',
        o: 0.9,
        w: 1.5,
        d: k,
      }),
    );
  }
  out.push(dot(cx, cy - 7, 3.2, { c: 'red', o: 1 }));
  return out;
}

/* --- Domains ----------------------------------------------------------- */

/** Capital: one commitment, split three ways and staged forward. */
function allocation(seed = 5): SVGElement[] {
  const rnd = seeded(seed);
  const out: SVGElement[] = [...scale(12)];
  const stages = 5;
  const top = CEIL + 12;
  const bottom = FLOOR - 24;
  const height = bottom - top;
  const xs = Array.from({ length: stages }, (_, i) => PAD + (i / (stages - 1)) * (W - PAD * 2));

  // Each lane's share of the commitment at each stage; they always sum to 1.
  const shares: number[][] = [];
  for (let s = 0; s < stages; s++) {
    const raw = [0.5 + rnd() * 0.22, 0.3 + rnd() * 0.16, 0.16 + rnd() * 0.14];
    const total = raw.reduce((a, b) => a + b, 0);
    shares.push(raw.map((v) => v / total));
  }

  // Ribbons: one filled band per lane, thickness tracking its share.
  for (let lane = 0; lane < 3; lane++) {
    const tops: Array<[number, number]> = [];
    const bots: Array<[number, number]> = [];
    for (let s = 0; s < stages; s++) {
      const before = shares[s]?.slice(0, lane).reduce((a, b) => a + b, 0) ?? 0;
      const share = shares[s]?.[lane] ?? 0;
      const y0 = top + before * height + lane * 3;
      tops.push([xs[s] ?? 0, y0]);
      bots.push([xs[s] ?? 0, y0 + share * height]);
    }
    const d =
      `M${tops.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}` +
      `L${[...bots].reverse().map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`;

    out.push(
      svg('path', {
        d,
        fill: lane === 0 ? COLOUR.red : COLOUR.cream,
        'fill-opacity': lane === 0 ? 0.17 : 0.05,
        stroke: lane === 0 ? COLOUR.red : COLOUR.cream,
        'stroke-width': lane === 0 ? 1.3 : 1,
        'stroke-opacity': lane === 0 ? 0.95 : 0.36,
        'vector-effect': 'non-scaling-stroke',
        'data-draw': '',
        style: `--d:${lane}`,
      }),
    );
  }

  // Stage gates, with a trigger mark at each one.
  for (let s = 1; s < stages; s++) {
    const x = xs[s] ?? 0;
    out.push(line(`M${x.toFixed(1)} ${top - 6}V${bottom + 8}`, { c: 'gold', o: 0.3, d: s * 0.4 }));
    out.push(dot(x, top - 8, 1.8, { c: 'gold', o: 0.85 }));
  }

  // The commitment itself.
  out.push(box(PAD - 4, top, 3, height, { c: 'red', o: 1 }));
  return out;
}

/** Market: a wavefront meeting the incumbent's edge. */
function wavefront(): SVGElement[] {
  const out: SVGElement[] = [...scale()];
  const x0 = PAD + 6;
  const y0 = (CEIL + FLOOR) / 2;
  const step = (W - PAD * 2) / 7.5;
  for (let i = 1; i <= 7; i++) {
    const r = i * step;
    const ry = Math.min(r, (FLOOR - CEIL) / 2 + 6);
    out.push(
      svg('path', {
        d: `M${x0} ${(y0 - ry).toFixed(1)}A${r.toFixed(1)} ${ry.toFixed(1)} 0 0 1 ${x0} ${(y0 + ry).toFixed(1)}`,
        fill: 'none',
        stroke: i === 1 ? COLOUR.red : COLOUR.cream,
        'stroke-width': i === 1 ? 1.5 : 1,
        opacity: i === 1 ? 0.95 : 0.42 - i * 0.04,
        'vector-effect': 'non-scaling-stroke',
        'data-draw': '',
        style: `--d:${i * 0.5}`,
      }),
    );
  }
  out.push(line(`M${W - PAD - 34} ${CEIL - 6}V${FLOOR}`, { c: 'gold', o: 0.75, w: 1.4, d: 4 }));
  out.push(dot(x0, y0, 3.4, { c: 'red', o: 1 }));
  return out;
}

/** Technology: cost curves crossing at a commitment gate. */
function curves(seed = 7): SVGElement[] {
  const rnd = seeded(seed);
  const out: SVGElement[] = [...scale()];
  for (let k = 0; k < 3; k++) {
    const start = CEIL + 6 + k * 22;
    const drop = 0.45 + rnd() * 0.4;
    const pts: string[] = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      const x = PAD + t * (W - PAD * 2);
      const y = start + (FLOOR - 14 - start) * Math.pow(t, 0.62) * drop - Math.sin(t * 7 + k) * 3.5;
      pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    out.push(
      line(`M${pts.join('L')}`, {
        c: k === 0 ? 'red' : 'cream',
        o: k === 0 ? 0.9 : 0.38,
        w: k === 0 ? 1.4 : 1,
        d: k,
      }),
    );
  }
  out.push(line(`M${(W * 0.6).toFixed(1)} ${CEIL - 6}V${FLOOR}`, { c: 'gold', o: 0.65, w: 1.3, d: 3 }));
  return out;
}

/** Resilience: failures that share a dependency, arriving together. */
function correlation(seed = 8): SVGElement[] {
  const rnd = seeded(seed);
  const cols = 8;
  const rows = 4;
  const out: SVGElement[] = [];
  const pos = (c: number, r: number): [number, number] => [
    PAD + (c / (cols - 1)) * (W - PAD * 2),
    CEIL + 2 + (r / (rows - 1)) * (FLOOR - CEIL - 10),
  ];

  for (let c = 0; c < cols - 1; c++) {
    for (let r = 0; r < rows; r++) {
      const [x1, y1] = pos(c, r);
      const tr = Math.max(0, Math.min(rows - 1, r + (rnd() > 0.55 ? 1 : 0)));
      const [x2, y2] = pos(c + 1, tr);
      const hot = c >= cols - 4 && r % 2 === 1;
      out.push(
        line(`M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`, {
          c: hot ? 'red' : 'cream',
          o: hot ? 0.8 : 0.14 + rnd() * 0.14,
          d: c * 0.4,
        }),
      );
    }
  }
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const [x, y] = pos(c, r);
      const hot = c === cols - 1 && r % 2 === 1;
      out.push(dot(x, y, hot ? 2.8 : 1.7, { c: hot ? 'red' : 'gold', o: hot ? 1 : 0.5 }));
    }
  }
  return out;
}

/** Policy: one rule, five orders of consequence, the third largest. */
function cascade(): SVGElement[] {
  const out: SVGElement[] = [];
  const steps = 5;
  const magnitudes = [0.24, 0.4, 0.58, 0.86, 0.5];
  const usable = W - PAD * 2;
  for (let i = 0; i < steps; i++) {
    const y = CEIL + i * 26;
    out.push(
      box(PAD, y, usable * (magnitudes[i] ?? 0.3), 6, {
        c: i === 3 ? 'red' : 'cream',
        o: i === 3 ? 0.95 : 0.46 - i * 0.05,
      }),
    );
    out.push(line(`M${PAD} ${y + 6}H${W - PAD}`, { o: 0.1 }));
    if (i < steps - 1) {
      out.push(line(`M${PAD + 5} ${y + 8}v13`, { c: 'gold', o: 0.5, d: i * 0.6 }));
      out.push(line(`M${PAD + 2} ${y + 17}l3 4l3 -4`, { c: 'gold', o: 0.5, d: i * 0.6 }));
    }
  }
  out.push(dot(PAD, CEIL, 3.2, { c: 'gold', o: 1 }));
  return out;
}

const BUILDERS: Record<FigureName, (seed?: number) => SVGElement[]> = {
  state,
  forward,
  explicit: () => explicit(),
  learn: () => learn(),
  allocation,
  wavefront: () => wavefront(),
  curves,
  correlation,
  cascade: () => cascade(),
};

export function makeFigure(name: FigureName, seed?: number): SVGElement {
  return svg(
    'svg',
    {
      viewBox: `0 0 ${W} ${H}`,
      fill: 'none',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
      focusable: 'false',
      preserveAspectRatio: 'none',
    },
    BUILDERS[name](seed),
  );
}

/** Measure drawable paths so CSS can inscribe them. */
export function prepareFigures(root: ParentNode = document): void {
  for (const p of Array.from(root.querySelectorAll<SVGPathElement>('.figure [data-draw]'))) {
    let len = 400;
    try {
      const measured = p.getTotalLength();
      if (Number.isFinite(measured) && measured > 0) len = measured;
    } catch {
      /* keep the fallback */
    }
    p.style.setProperty('--len', String(Math.ceil(len)));
  }
}
