/**
 * Strata — a small, dependency-free Canvas2D renderer for stratified CAD
 * objects in the language of the Dune production dossiers: a solid is drawn
 * as a stack of hairline horizontal sections, bottom to top, each one painted
 * over the last. The sides of the object resolve into dense contour bands; the
 * top resolves into a single crisp plan.
 *
 * In our context every slice is one simulated state of a world, which is why
 * the objects are built this way rather than as shaded models.
 */

export type Pt = readonly [number, number];
export type Poly = readonly Pt[];

export interface Section {
  outer: Poly;
  holes?: readonly Poly[];
  /** Draw this section's outline in the accent colour. */
  accent?: boolean;
  /** Stable body id, used to find each body's top slice. */
  id?: string;
}

export interface StrataSolid {
  /** Model height in model units. */
  height: number;
  /** Number of slices. */
  slices: number;
  /** Sections at normalised height t ∈ [0, 1]. */
  at: (t: number) => readonly Section[];
}

export interface StrataStyle {
  line: string; // rgb triplet "r, g, b"
  fill: string; // rgb triplet
  fillTop?: string; // rgb triplet, the sunlit top fill
  accent: string; // rgb triplet
  lineAlpha?: number;
  fillAlpha?: number;
}

export interface IsoView {
  cx: number;
  cy: number;
  scale: number;
  rot: number; // radians about Z
  tilt: number; // plan foreshortening, 0.5 = classic iso
  lift: number; // screen units per model unit of height
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

export function circle(cx: number, cy: number, r: number, seg = 64): Poly {
  const out: Pt[] = [];
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return out;
}

export function ellipse(cx: number, cy: number, rx: number, ry: number, seg = 64): Poly {
  const out: Pt[] = [];
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return out;
}

/** Rectangle centred on (cx, cy) with 45° chamfered corners. */
export function chamfer(cx: number, cy: number, w: number, h: number, c: number): Poly {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const y0 = cy - h / 2;
  const y1 = cy + h / 2;
  const k = Math.max(0, Math.min(c, w / 2, h / 2));
  return [
    [x0 + k, y0],
    [x1 - k, y0],
    [x1, y0 + k],
    [x1, y1 - k],
    [x1 - k, y1],
    [x0 + k, y1],
    [x0, y1 - k],
    [x0, y0 + k],
  ];
}

/** Rounded rectangle centred on (cx, cy). */
export function rounded(cx: number, cy: number, w: number, h: number, r: number, seg = 8): Poly {
  const k = Math.max(0.01, Math.min(r, w / 2, h / 2));
  const out: Pt[] = [];
  const corners: Array<[number, number, number]> = [
    [cx + w / 2 - k, cy - h / 2 + k, -Math.PI / 2],
    [cx + w / 2 - k, cy + h / 2 - k, 0],
    [cx - w / 2 + k, cy + h / 2 - k, Math.PI / 2],
    [cx - w / 2 + k, cy - h / 2 + k, Math.PI],
  ];
  for (const [ox, oy, a0] of corners) {
    for (let i = 0; i <= seg; i++) {
      const a = a0 + (i / seg) * (Math.PI / 2);
      out.push([ox + Math.cos(a) * k, oy + Math.sin(a) * k]);
    }
  }
  return out;
}

/** Elongated hull: pointed bow and stern, slightly bellied midsection. */
export function hull(cx: number, cy: number, len: number, wid: number, bow = 0.22, seg = 22): Poly {
  const top: Pt[] = [];
  const bot: Pt[] = [];
  for (let i = 0; i <= seg; i++) {
    const u = i / seg; // 0..1 along length
    const x = cx - len / 2 + u * len;
    const e = Math.min(u / bow, (1 - u) / bow, 1);
    const w = (wid / 2) * Math.sin((Math.min(e, 1) * Math.PI) / 2) ** 0.7;
    top.push([x, cy - w]);
    bot.push([x, cy + w]);
  }
  return [...top, ...bot.reverse()];
}

export function scalePoly(p: Poly, sx: number, sy: number, cx = 0, cy = 0): Poly {
  return p.map(([x, y]) => [cx + (x - cx) * sx, cy + (y - cy) * sy] as Pt);
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

export function project(v: IsoView, x: number, y: number, z: number): Pt {
  const c = Math.cos(v.rot);
  const s = Math.sin(v.rot);
  const px = x * c - y * s;
  const py = x * s + y * c;
  return [v.cx + px * v.scale, v.cy + py * v.scale * v.tilt - z * v.lift * v.scale];
}

function tracePoly(ctx: CanvasRenderingContext2D, pts: readonly Pt[]): void {
  if (!pts.length) return;
  ctx.moveTo(pts[0]![0], pts[0]![1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]![0], pts[i]![1]);
  ctx.closePath();
}

/**
 * Draws the solid in 3/4 view. `progress` (0..1) lets the stack build up from
 * the base, used for a quiet draw-in when a plate first comes into view.
 */
export function drawIso(
  ctx: CanvasRenderingContext2D,
  solid: StrataSolid,
  view: IsoView,
  style: StrataStyle,
  progress = 1,
): void {
  const n = solid.slices;
  const upto = Math.max(1, Math.round(n * Math.max(0, Math.min(1, progress))));
  const la = style.lineAlpha ?? 0.62;
  const fa = style.fillAlpha ?? 1;

  ctx.save();
  ctx.lineJoin = 'round';
  for (let i = 0; i < upto; i++) {
    const t = n === 1 ? 1 : i / (n - 1);
    const z = t * solid.height;
    const last = i === upto - 1;
    const depth = (sec: Section): number => {
      let sy = 0;
      for (const [x, y] of sec.outer) sy += project(view, x, y, 0)[1];
      return sy / Math.max(1, sec.outer.length);
    };
    const sections = [...solid.at(t)].sort((a, b) => depth(a) - depth(b));
    for (const sec of sections) {
      ctx.beginPath();
      tracePoly(ctx, sec.outer.map(([x, y]) => project(view, x, y, z)));
      for (const h of sec.holes ?? []) tracePoly(ctx, h.map(([x, y]) => project(view, x, y, z)));

      const fillRgb = last && style.fillTop ? style.fillTop : style.fill;
      ctx.fillStyle = `rgba(${fillRgb}, ${fa})`;
      ctx.fill('evenodd');

      // Ambient occlusion: lower strata read slightly deeper.
      const a = last ? Math.min(1, la + 0.3) : la * (0.55 + 0.45 * t);
      ctx.strokeStyle = sec.accent ? `rgba(${style.accent}, ${Math.min(1, a + 0.25)})` : `rgba(${style.line}, ${a})`;
      ctx.lineWidth = last ? 1.05 : 0.6;
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Orthographic top view: every slice outline in plan, a contour drawing. */
export function drawPlan(
  ctx: CanvasRenderingContext2D,
  solid: StrataSolid,
  cx: number,
  cy: number,
  scale: number,
  style: StrataStyle,
  every = 3,
  rot = 0,
): void {
  const n = solid.slices;
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  ctx.save();
  ctx.lineJoin = 'round';
  for (let i = 0; i < n; i += every) {
    const t = i / (n - 1);
    for (const sec of solid.at(t)) {
      ctx.beginPath();
      const map = (p: Poly): Pt[] =>
        p.map(([x, y]) => [cx + (x * c - y * s) * scale, cy + (x * s + y * c) * scale] as Pt);
      tracePoly(ctx, map(sec.outer));
      for (const h of sec.holes ?? []) tracePoly(ctx, map(h));
      ctx.strokeStyle = sec.accent ? `rgba(${style.accent}, 0.95)` : `rgba(${style.line}, ${0.16 + 0.5 * t})`;
      ctx.lineWidth = sec.accent ? 1 : 0.6;
      ctx.stroke();
    }
  }
  // The top section, firm.
  for (const sec of solid.at(1)) {
    ctx.beginPath();
    const map = (p: Poly): Pt[] =>
      p.map(([x, y]) => [cx + (x * c - y * s) * scale, cy + (x * s + y * c) * scale] as Pt);
    tracePoly(ctx, map(sec.outer));
    for (const h of sec.holes ?? []) tracePoly(ctx, map(h));
    ctx.strokeStyle = `rgba(${style.line}, 0.95)`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

/** Orthographic front elevation: each slice as a level line across its extent. */
export function drawElevation(
  ctx: CanvasRenderingContext2D,
  solid: StrataSolid,
  cx: number,
  baseY: number,
  scale: number,
  lift: number,
  style: StrataStyle,
): void {
  const n = solid.slices;
  ctx.save();
  let prev: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const y = baseY - t * solid.height * lift * scale;
    const spans: Array<[number, number]> = [];
    for (const sec of solid.at(t)) {
      let mn = Infinity;
      let mx = -Infinity;
      for (const [x] of sec.outer) {
        mn = Math.min(mn, x);
        mx = Math.max(mx, x);
      }
      spans.push([mn, mx]);
      ctx.beginPath();
      ctx.moveTo(cx + mn * scale, y);
      ctx.lineTo(cx + mx * scale, y);
      ctx.strokeStyle = sec.accent ? `rgba(${style.accent}, 0.95)` : `rgba(${style.line}, ${0.25 + 0.55 * t})`;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
    // Silhouette verticals between consecutive levels.
    if (prev.length === spans.length) {
      const py = baseY - ((i - 1) / (n - 1)) * solid.height * lift * scale;
      ctx.beginPath();
      spans.forEach(([a, b], k) => {
        const [pa, pb] = prev[k]!;
        ctx.moveTo(cx + pa * scale, py);
        ctx.lineTo(cx + a * scale, y);
        ctx.moveTo(cx + pb * scale, py);
        ctx.lineTo(cx + b * scale, y);
      });
      ctx.strokeStyle = `rgba(${style.line}, 0.85)`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    prev = spans;
  }
  ctx.restore();
}

/** Sets a canvas up for crisp drawing at device pixel ratio. Returns CSS size. */
export function fitCanvas(canvas: HTMLCanvasElement): { w: number; h: number; ctx: CanvasRenderingContext2D } | null {
  const r = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(r.width));
  const h = Math.max(1, Math.round(r.height));
  const dpr = Math.min(2.5, window.devicePixelRatio || 1);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { w, h, ctx };
}

/** Dashed leader callout in the manner of the Fremen radio plate. */
export function callout(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  elbow: Pt,
  to: Pt,
  label: string,
  rgb: string,
  align: 'left' | 'right' = 'right',
): void {
  ctx.save();
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = `rgba(${rgb}, 0.8)`;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(elbow[0], elbow[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = `rgba(${rgb}, 1)`;
  ctx.beginPath();
  ctx.arc(from[0], from[1], 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '400 11px "Instrument Serif", Georgia, serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = align === 'right' ? 'left' : 'right';
  ctx.fillText(label, to[0] + (align === 'right' ? 6 : -6), to[1]);
  ctx.restore();
}
