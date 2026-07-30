/**
 * Generated line-art glyphs.
 *
 * Kaldun's symbolic register is the Chaldean astronomer-scribe: the stepped
 * ziggurat, the ruled clay tablet, the eclipse cycle, the gnomon's shadow. All
 * of it is drawn here as geometry — deterministic, resolution-independent,
 * hairline-thin — rather than shipped as decorative artwork.
 *
 * Every stroked path carries `data-draw` so it inscribes itself on reveal.
 */

import { svg } from '../lib/dom';
import { seeded } from '../lib/math';

const VB = 100;

export type GlyphName =
  | 'ziggurat'
  | 'tablet'
  | 'saros'
  | 'gnomon'
  | 'branching'
  | 'lattice'
  | 'ephemeris'
  | 'convergence';

type Stroke = {
  /** stroke-width */
  w?: number;
  /** opacity */
  o?: number;
  /** draw-on delay index */
  d?: number;
};

function line(d: string, s: Stroke = {}): SVGElement {
  return svg('path', {
    d,
    stroke: 'currentColor',
    'stroke-width': s.w ?? 0.8,
    opacity: s.o ?? 1,
    'vector-effect': 'non-scaling-stroke',
    'data-draw': '',
    style: `--d:${s.d ?? 0}`,
  });
}

function dot(cx: number, cy: number, r = 1.6, o = 0.9): SVGElement {
  return svg('circle', {
    cx: Number(cx.toFixed(2)),
    cy: Number(cy.toFixed(2)),
    r,
    fill: 'currentColor',
    stroke: 'none',
    opacity: o,
  });
}

function frame(children: SVGElement[]): SVGElement {
  return svg(
    'svg',
    {
      viewBox: `0 0 ${VB} ${VB}`,
      fill: 'none',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
      focusable: 'false',
      preserveAspectRatio: 'xMidYMid meet',
    },
    children,
  );
}

/** Stepped ziggurat — the hierarchy of state beneath a forecast. */
function ziggurat(): SVGElement[] {
  const out: SVGElement[] = [];
  const tiers = 5;
  const baseW = 78;
  const h = 12;
  for (let i = 0; i < tiers; i++) {
    const w = baseW - i * 13;
    const x = (VB - w) / 2;
    const y = 84 - i * h;
    out.push(line(`M${x} ${y}h${w}v${-h}h${-w}z`, { d: i, o: 0.55 + i * 0.1 }));
  }
  out.push(line('M50 84V22', { w: 0.6, o: 0.4, d: 5 }));
  out.push(dot(50, 15, 2.4));
  return out;
}

/** Ruled clay tablet with wedge marks — the Record. */
function tablet(seed = 7): SVGElement[] {
  const rnd = seeded(seed);
  const out: SVGElement[] = [line('M16 12h68v76H16z', { d: 0, o: 0.8 })];
  for (let r = 0; r < 7; r++) {
    const y = 22 + r * 9.6;
    out.push(line(`M22 ${y}h56`, { w: 0.5, o: 0.3, d: r + 1 }));
    const marks = 3 + Math.floor(rnd() * 4);
    for (let m = 0; m < marks; m++) {
      const x = 24 + rnd() * 50;
      out.push(
        line(`M${x.toFixed(1)} ${(y - 3.4).toFixed(1)}l1.9 2.2l-1.9 2.2`, {
          w: 0.7,
          o: 0.7,
          d: r + 1,
        }),
      );
    }
  }
  return out;
}

/** Saros spiral — the cycle that only pays off if you keep watching. */
function saros(): SVGElement[] {
  const turns = 3.15;
  const total = 200;
  const pts: string[] = [];
  for (let i = 0; i <= total; i++) {
    const t = i / total;
    const a = t * Math.PI * 2 * turns - Math.PI / 2;
    const r = 6 + t * 38;
    pts.push(`${(50 + Math.cos(a) * r).toFixed(2)} ${(50 + Math.sin(a) * r).toFixed(2)}`);
  }
  const out = [line(`M${pts.join('L')}`, { w: 0.7, o: 0.85 })];
  for (let k = 1; k <= 3; k++) {
    const r = 6 + (k / turns) * 38;
    out.push(line(`M${(50 + r).toFixed(1)} 47.5v5`, { w: 0.9, o: 0.8, d: k }));
  }
  out.push(dot(50, 44, 1.8));
  return out;
}

/** Gnomon — time as the thing that supervises. */
function gnomon(): SVGElement[] {
  const out: SVGElement[] = [
    line('M18 78h64', { d: 0 }),
    line('M50 78V24', { d: 1 }),
    line('M50 78L78 62', { w: 0.6, o: 0.5, d: 2 }),
  ];
  for (let i = 0; i < 9; i++) {
    const a = (-Math.PI / 2) * (1 - i / 8) - 0.02;
    const x = 50 + Math.cos(a) * 30;
    const y = 78 + Math.sin(a) * 30;
    out.push(
      line(
        `M${x.toFixed(1)} ${y.toFixed(1)}l${(Math.cos(a) * 4).toFixed(1)} ${(Math.sin(a) * 4).toFixed(1)}`,
        { w: 0.6, o: 0.45, d: 3 + i * 0.2 },
      ),
    );
  }
  out.push(dot(50, 24, 2));
  return out;
}

/** Branching states — one present, several futures. */
function branching(seed = 11): SVGElement[] {
  const rnd = seeded(seed);
  const out: SVGElement[] = [];
  const grow = (x: number, y: number, depth: number, spread: number): void => {
    if (depth === 0) return;
    const kids = depth === 3 ? 2 : rnd() > 0.45 ? 2 : 1;
    for (let k = 0; k < kids; k++) {
      const dy = (k === 0 ? -1 : 1) * spread * (0.6 + rnd() * 0.7);
      const nx = x + 22 + rnd() * 5;
      const ny = Math.max(12, Math.min(88, y + (kids === 1 ? dy * 0.4 : dy)));
      out.push(
        line(
          `M${x.toFixed(1)} ${y.toFixed(1)}C${(x + 11).toFixed(1)} ${y.toFixed(1)} ${(nx - 11).toFixed(1)} ${ny.toFixed(1)} ${nx.toFixed(1)} ${ny.toFixed(1)}`,
          { w: depth === 3 ? 0.9 : 0.6, o: 0.3 + depth * 0.18, d: 4 - depth },
        ),
      );
      if (depth === 1) out.push(dot(nx, ny, 1.5, 0.85));
      grow(nx, ny, depth - 1, spread * 0.62);
    }
  };
  out.push(line('M8 50h6', { w: 1 }));
  grow(14, 50, 3, 26);
  out.push(dot(14, 50, 2.6));
  return out;
}

/** Propagation lattice — consequences crossing categories. */
function lattice(seed = 23): SVGElement[] {
  const rnd = seeded(seed);
  const cols = 5;
  const rows = 4;
  const nodes: Array<{ x: number; y: number }> = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      nodes.push({ x: 14 + c * 18, y: 20 + r * 20 + (c % 2 ? 6 : 0) });
    }
  }
  const out: SVGElement[] = [];
  for (let c = 0; c < cols - 1; c++) {
    for (let r = 0; r < rows; r++) {
      const from = nodes[c * rows + r];
      if (!from) continue;
      const links = rnd() > 0.5 ? 2 : 1;
      for (let l = 0; l < links; l++) {
        const tr = Math.min(rows - 1, Math.max(0, r + (l === 0 ? 0 : rnd() > 0.5 ? 1 : -1)));
        const to = nodes[(c + 1) * rows + tr];
        if (!to) continue;
        out.push(line(`M${from.x} ${from.y}L${to.x} ${to.y}`, { w: 0.5, o: 0.28 + rnd() * 0.4, d: c }));
      }
    }
  }
  for (const n of nodes) out.push(dot(n.x, n.y, 1.3, 0.8));
  return out;
}

/** Ephemeris columns — a compressed field of tabulated expectation. */
function ephemeris(seed = 31): SVGElement[] {
  const rnd = seeded(seed);
  const out: SVGElement[] = [line('M14 86h72', { d: 0, o: 0.7 })];
  for (let i = 0; i < 22; i++) {
    const x = 15 + i * 3.3;
    const h = 8 + Math.pow(rnd(), 1.6) * 58;
    out.push(line(`M${x.toFixed(1)} 86V${(86 - h).toFixed(1)}`, { w: 1.2, o: 0.22 + (h / 66) * 0.6, d: i * 0.12 }));
  }
  out.push(line('M14 30h72', { w: 0.5, o: 0.28, d: 3 }));
  return out;
}

/** Convergence — futures narrowing as evidence arrives. */
function convergence(seed = 41): SVGElement[] {
  const rnd = seeded(seed);
  const out: SVGElement[] = [];
  const lanes = 9;
  for (let i = 0; i < lanes; i++) {
    const y0 = 14 + i * (72 / (lanes - 1));
    const wobble = (rnd() - 0.5) * 14;
    out.push(
      line(
        `M12 ${y0.toFixed(1)}C38 ${(y0 + wobble).toFixed(1)} 58 ${(50 + (y0 - 50) * 0.32).toFixed(1)} 88 50`,
        { w: 0.6, o: 0.26 + Math.abs(i - 4) * 0.06, d: i * 0.15 },
      ),
    );
  }
  out.push(line('M88 42v16', { w: 1, o: 0.9, d: 2 }));
  out.push(dot(88, 50, 2.2));
  return out;
}

const builders: Record<GlyphName, (seed?: number) => SVGElement[]> = {
  ziggurat: () => ziggurat(),
  tablet: (s) => tablet(s),
  saros: () => saros(),
  gnomon: () => gnomon(),
  branching: (s) => branching(s),
  lattice: (s) => lattice(s),
  ephemeris: (s) => ephemeris(s),
  convergence: (s) => convergence(s),
};

export function makeGlyph(name: GlyphName, seed?: number): SVGElement {
  return frame(builders[name](seed));
}

/**
 * Measure every drawable path so CSS can animate stroke-dashoffset.
 * Runs once, after the glyphs are in the document.
 */
export function prepareGlyphDraw(root: ParentNode = document): void {
  const paths = Array.from(root.querySelectorAll<SVGPathElement>('[data-draw]'));
  for (const p of paths) {
    let len = 400;
    try {
      const measured = p.getTotalLength();
      if (Number.isFinite(measured) && measured > 0) len = measured;
    } catch {
      /* jsdom / detached node — keep the fallback */
    }
    p.style.setProperty('--len', String(Math.ceil(len)));
  }
}

/** Fill every `[data-glyph]` placeholder in the document. */
export function mountGlyphs(root: ParentNode = document): void {
  const hosts = Array.from(root.querySelectorAll<HTMLElement>('[data-glyph]'));
  for (const host of hosts) {
    const name = host.dataset.glyph as GlyphName | undefined;
    if (!name || !(name in builders)) continue;
    const seed = Number(host.dataset.glyphSeed ?? '7');
    host.replaceChildren(makeGlyph(name, seed));
  }
  prepareGlyphDraw(root);
}
