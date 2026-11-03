/**
 * The world, modelled: a generated plan of parcels, the routes between them,
 * and what happens when one of them is disrupted.
 *
 * A plan is cut from one seeded field into blocks, streets and strips, the
 * way land is divided. Some parcels hold an institution (a small square) and
 * dependencies run between them along orthogonal routes. Every few seconds
 * one institution is disrupted: the shock travels along its dependencies,
 * lighting what it reaches, while three futures run forward from it. The plan
 * drifts slowly toward the viewer, so the world keeps arriving.
 *
 * In the hero the plan lies on the ground and recedes to a horizon; it is
 * projected here, in script, onto one flat canvas the size of its panel, and
 * fades into paper with distance. In the mission it is seen from above.
 * Everything is drawn in a few batched paths, at most thirty times a second,
 * and not at all while the page is scrolling, off screen, or in a hidden tab.
 * Under reduced motion one composed moment is drawn and held.
 */

import { prefersReducedMotion } from '../lib/prefers';

type Rect = { x: number; y: number; w: number; h: number };
type Parcel = Rect & { kind: number; tone: number };
type Site = { x: number; y: number; parcel: Parcel };
type Route = { a: number; b: number; len: number; bend: 'hv' | 'vh' };
type Pulse = { route: Route; from: number; to: number; t0: number; dur: number; depth: number };
type Glow = { site: Site; t0: number };
type Future = { site: Site; t0: number; seed: number };
/** A changed arrangement: a new connection found between two institutions. */
type Find = { a: Site; b: Site; bend: 'hv' | 'vh'; t0: number };

export type WorldOptions = {
  seed?: number;
  /** Drift toward the viewer, in plan pixels per second. 0 holds it still. */
  drift?: number;
  /** Seconds between disruptions. */
  every?: number;
  /** Seen on the ground, receding (the hero), or from above (a plate). */
  view?: 'ground' | 'above';
  /** The finest pixel ratio drawn. */
  maxDpr?: number;
  /** Report the move being made (model, futures, discovery) on this element. */
  phases?: HTMLElement | null;
};

const INK = '23, 20, 16';
const AMBER = '243, 146, 0';
const FRAME_MS = 1000 / 30;
const BANDS = 5;

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cut land the way it is divided: a survey of blocks, then streets, lots, strips. */
export function divide(bounds: Rect, block: number, rand: () => number): Parcel[] {
  const out: Parcel[] = [];
  const push = (r: Rect, kind: number): void => {
    if (r.w > 3 && r.h > 3) out.push({ ...r, kind, tone: rand() });
  };
  const cut = (r: Rect, depth: number): void => {
    const area = r.w * r.h;
    const stop = depth > 2 && (area < 1800 || rand() < 0.16 + depth * 0.05);
    if (stop || r.w < 26 || r.h < 26) {
      // Some lots are farmed in strips, as fields are.
      if (rand() < 0.2 && area > 3000) {
        const across = r.w > r.h;
        const n = 3 + Math.floor(rand() * 5);
        const span = (across ? r.w : r.h) / n;
        for (let i = 0; i < n; i++) {
          push(across ? { x: r.x + i * span, y: r.y, w: span - 1.5, h: r.h } : { x: r.x, y: r.y + i * span, w: r.w, h: span - 1.5 }, 5);
        }
      } else {
        const roll = rand();
        push(r, roll < 0.52 ? 0 : roll < 0.72 ? 1 : roll < 0.85 ? 2 : roll < 0.96 ? 3 : 4);
      }
      return;
    }
    const gap = depth < 2 ? 9 : depth < 4 ? 5 : 3;
    const vertical = r.w > r.h ? rand() < 0.8 : rand() < 0.2;
    const f = 0.3 + rand() * 0.4;
    if (vertical) {
      const w1 = Math.round(r.w * f);
      cut({ x: r.x, y: r.y, w: w1 - gap / 2, h: r.h }, depth + 1);
      cut({ x: r.x + w1 + gap / 2, y: r.y, w: r.w - w1 - gap / 2, h: r.h }, depth + 1);
    } else {
      const h1 = Math.round(r.h * f);
      cut({ x: r.x, y: r.y, w: r.w, h: h1 - gap / 2 }, depth + 1);
      cut({ x: r.x, y: r.y + h1 + gap / 2, w: r.w, h: r.h - h1 - gap / 2 }, depth + 1);
    }
  };
  const cols = Math.max(2, Math.round(bounds.w / block));
  const rows = Math.max(2, Math.round(bounds.h / block));
  const cw = bounds.w / cols;
  const ch = bounds.h / rows;
  const AVE = 16;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      cut({ x: bounds.x + i * cw + AVE / 2, y: bounds.y + j * ch + AVE / 2, w: cw - AVE, h: ch - AVE }, 1);
    }
  }
  return out;
}

export function initWorld(host: HTMLElement, opts: WorldOptions = {}): { destroy: () => void } {
  const canvas = document.createElement('canvas');
  canvas.className = 'world__canvas';
  host.replaceChildren(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return { destroy: () => undefined };

  const reduced = prefersReducedMotion();
  const seed = opts.seed ?? 1654;
  const ground = (opts.view ?? 'ground') === 'ground';
  const drift = reduced ? 0 : opts.drift ?? 9;
  const every = (opts.every ?? 4.2) * 1000;

  // The panel, and the plan laid out on it.
  let W = 0;
  let H = 0;
  let dpr = 1;
  let PW = 0; // plan width
  let PD = 0; // plan depth
  let D = 1; // the depth at which things appear at half size
  let horizon = 0;
  let front = 0;

  let parcels: Parcel[] = [];
  let sites: Site[] = [];
  let routes: Route[] = [];
  let links: number[][] = [];
  let pulses: Pulse[] = [];
  let glows: Glow[] = [];
  let futures: Future[] = [];
  let finds: Find[] = [];
  let lastShock = -1e9;
  let phase = '';
  let offset = 0;
  let last = 0;
  let drawn = 0;
  let next = 0;
  let raf = 0;
  let visible = false;
  let scrollingUntil = 0;
  let rand = rng(seed);

  /** Plan depth → how near: 1 at the front edge, toward 0 at the horizon. */
  const scaleAt = (v: number): number => (ground ? 1 / (1 + Math.max(-0.5 * D, v) / D) : 1);

  /** A plan point to the screen. The plan's depth runs away from the viewer. */
  const project = (x: number, v: number): [number, number] => {
    if (!ground) return [x, v];
    const s = scaleAt(v);
    return [W / 2 + (x - PW / 2) * s, horizon + (front - horizon) * s];
  };

  /** Where a plan y sits now, as depth from the front edge. */
  const depthOf = (y: number): number => {
    const v = (y - offset) % PD;
    return v < 0 ? v + PD : v;
  };

  /** How much of a line survives the haze at this depth. */
  const haze = (v: number): number => {
    if (!ground) return 1;
    const s = scaleAt(v);
    return Math.max(0, Math.min(1, (s - 0.18) / 0.4));
  };

  const build = (): void => {
    const w = Math.round(host.clientWidth);
    const h = Math.round(host.clientHeight);
    if (w === 0 || h === 0) return;
    dpr = Math.min(window.devicePixelRatio || 1, opts.maxDpr ?? 1.5);
    W = w;
    H = h;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    if (ground) {
      horizon = H * 0.3;
      front = H * 1.04;
      D = H * 0.85;
      PW = W * 2.3;
      PD = D * 4.2;
    } else {
      PW = W;
      PD = H;
    }

    rand = rng(seed);
    const block = ground ? Math.max(170, Math.min(270, W / 6)) : Math.max(120, Math.min(200, W / 2.4));
    parcels = divide({ x: 0, y: 0, w: PW, h: PD }, block, rand);

    sites = parcels
      .filter((p) => p.kind !== 5 && p.w * p.h > 1800 && rand() < 0.5)
      .map((p) => ({ x: Math.round(p.x + p.w / 2), y: Math.round(p.y + p.h / 2), parcel: p }));

    const seen = new Set<string>();
    routes = [];
    links = sites.map(() => []);
    sites.forEach((s, i) => {
      const nearest = sites
        .map((t, j) => ({ j, d: Math.hypot(t.x - s.x, t.y - s.y) }))
        .filter((o) => o.j !== i && o.d < 340)
        .sort((m, n) => m.d - n.d)
        .slice(0, 2 + (rand() < 0.35 ? 1 : 0));
      for (const o of nearest) {
        const key = i < o.j ? `${i}-${o.j}` : `${o.j}-${i}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const t = sites[o.j]!;
        const k = routes.length;
        routes.push({ a: i, b: o.j, len: Math.abs(t.x - s.x) + Math.abs(t.y - s.y), bend: rand() < 0.5 ? 'hv' : 'vh' });
        links[i]!.push(k);
        links[o.j]!.push(k);
      }
    });
  };

  // --- drawing ------------------------------------------------------------------

  /** A plan rectangle, from depth v (near) to v + h (far), as a screen quad. */
  const quad = (path: Path2D, x: number, v: number, w: number, h: number): void => {
    const [ax, ay] = project(x, v);
    const [bx, by] = project(x + w, v);
    const [cx, cy] = project(x + w, v + h);
    const [dx, dy] = project(x, v + h);
    path.moveTo(ax, ay);
    path.lineTo(bx, by);
    path.lineTo(cx, cy);
    path.lineTo(dx, dy);
    path.closePath();
  };

  /** Each parcel at the depth it sits now, and again across the seam. */
  const placements = (p: Rect): number[] => {
    const v = depthOf(p.y);
    return v + p.h > PD ? [v, v - PD] : [v];
  };

  const seen = (x: number, v: number, w: number, h: number): boolean => {
    if (!ground) return v + h > 0 && v < H && x + w > 0 && x < W;
    if (v + h < -D * 0.04) return false;
    const s = scaleAt(Math.max(0, v));
    if (s < 0.18) return false;
    const [l] = project(x, Math.max(0, v));
    const [r] = project(x + w, Math.max(0, v));
    return r > -20 && l < W + 20 && r - l > 1.5;
  };

  const drawPlan = (): void => {
    const band = (): Path2D[] => Array.from({ length: BANDS }, () => new Path2D());
    const outline = band();
    const strip = band();
    const shade = band();
    const deep = band();
    const warm = band();
    const hatch = band();

    for (const p of parcels) {
      for (const v of placements(p)) {
        if (!seen(p.x, v, p.w, p.h)) continue;
        const a = haze(Math.max(0, v + p.h / 2));
        if (a <= 0) continue;
        const b = Math.min(BANDS - 1, Math.floor(a * BANDS));
        quad(p.kind === 5 ? strip[b]! : outline[b]!, p.x, v, p.w, p.h);
        if (p.kind === 1 || (p.kind === 5 && p.tone > 0.5)) quad(shade[b]!, p.x, v, p.w, p.h);
        else if (p.kind === 3) quad(deep[b]!, p.x, v, p.w, p.h);
        else if (p.kind === 4) quad(warm[b]!, p.x, v, p.w, p.h);
        else if (p.kind === 2 && a > 0.3) {
          // Hatching: straight lines stay straight in perspective.
          for (let u = 7; u < p.w + p.h; u += 7) {
            const [sx, sy] = project(p.x + Math.max(0, u - p.h), v + Math.min(u, p.h));
            const [ex, ey] = project(p.x + Math.min(u, p.w), v + Math.max(0, u - p.w));
            hatch[b]!.moveTo(sx, sy);
            hatch[b]!.lineTo(ex, ey);
          }
        }
      }
    }

    ctx.lineWidth = 1;
    for (let b = 0; b < BANDS; b++) {
      const a = (b + 1) / BANDS;
      ctx.fillStyle = `rgba(${INK}, ${0.04 * a})`;
      ctx.fill(shade[b]!);
      ctx.fillStyle = `rgba(${INK}, ${0.085 * a})`;
      ctx.fill(deep[b]!);
      ctx.fillStyle = `rgba(${AMBER}, ${0.14 * a})`;
      ctx.fill(warm[b]!);
      ctx.strokeStyle = `rgba(${INK}, ${0.15 * a})`;
      ctx.stroke(hatch[b]!);
      ctx.strokeStyle = `rgba(${INK}, ${0.17 * a})`;
      ctx.stroke(strip[b]!);
      ctx.strokeStyle = `rgba(${INK}, ${0.36 * a})`;
      ctx.stroke(outline[b]!);
    }

    // Dependencies, then institutions.
    const deps = new Path2D();
    for (const r of routes) {
      const a = sites[r.a]!;
      const b = sites[r.b]!;
      const va = depthOf(a.y);
      const vb = va + (b.y - a.y);
      if (haze(Math.max(0, Math.min(va, vb))) < 0.35) continue;
      const pts: Array<[number, number]> =
        r.bend === 'hv' ? [[a.x, va], [b.x, va], [b.x, vb]] : [[a.x, va], [a.x, vb], [b.x, vb]];
      pts.forEach(([x, v], i) => {
        const [sx, sy] = project(x, v);
        if (i === 0) deps.moveTo(sx, sy);
        else deps.lineTo(sx, sy);
      });
    }
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = `rgba(${INK}, 0.22)`;
    ctx.stroke(deps);
    ctx.setLineDash([]);

    for (const s of sites) {
      const v = depthOf(s.y);
      const a = haze(v);
      if (a < 0.2) continue;
      const [sx, sy] = project(s.x, v);
      if (sx < -4 || sx > W + 4 || sy < -4 || sy > H + 4) continue;
      const k = Math.max(1.5, 4 * scaleAt(v));
      ctx.fillStyle = `rgba(${INK}, ${0.9 * a})`;
      ctx.fillRect(sx - k / 2, sy - k / 2, k, k);
    }
  };

  /** A point along a route, travelling from one end, in plan coordinates. */
  const along = (r: Route, from: number, t: number): [number, number] => {
    const a = sites[from]!;
    const b = sites[from === r.a ? r.b : r.a]!;
    const first = r.bend === 'hv' ? (from === r.a ? 'h' : 'v') : from === r.a ? 'v' : 'h';
    const d1 = first === 'h' ? Math.abs(b.x - a.x) : Math.abs(b.y - a.y);
    const s = t * r.len;
    if (first === 'h') {
      if (s <= d1) return [a.x + Math.sign(b.x - a.x) * s, a.y];
      return [b.x, a.y + Math.sign(b.y - a.y) * (s - d1)];
    }
    if (s <= d1) return [a.x, a.y + Math.sign(b.y - a.y) * s];
    return [a.x + Math.sign(b.x - a.x) * (s - d1), b.y];
  };

  const drawLive = (now: number): void => {
    // What the shock has reached.
    glows = glows.filter((g) => now - g.t0 < 3800);
    for (const g of glows) {
      const age = (now - g.t0) / 3800;
      const life = age < 0.08 ? age / 0.08 : 1 - (age - 0.08) / 0.92;
      const p = g.site.parcel;
      const path = new Path2D();
      let a = 0;
      for (const v of placements(p)) {
        if (!seen(p.x, v, p.w, p.h)) continue;
        quad(path, p.x, v, p.w, p.h);
        a = Math.max(a, haze(Math.max(0, v)));
      }
      if (!a) continue;
      ctx.fillStyle = `rgba(${AMBER}, ${0.45 * life * a})`;
      ctx.fill(path);
      ctx.strokeStyle = `rgba(${AMBER}, ${life * a})`;
      ctx.lineWidth = 1.25;
      ctx.stroke(path);
      const v = depthOf(g.site.y);
      const [sx, sy] = project(g.site.x, v);
      const k = Math.max(3, 7 * scaleAt(v));
      ctx.fillStyle = `rgba(${AMBER}, ${life * a})`;
      ctx.fillRect(sx - k / 2, sy - k / 2, k, k);
    }

    // Futures: three paths run forward from the disruption, and fade.
    futures = futures.filter((f) => now - f.t0 < 3400);
    for (const f of futures) {
      const age = (now - f.t0) / 3400;
      const grow = Math.min(1, age / 0.45);
      const fade = age < 0.55 ? 1 : 1 - (age - 0.55) / 0.45;
      const v0 = depthOf(f.site.y);
      const reach = (ground ? D * 1.6 : Math.min(v0 - 10, H * 0.45)) * grow;
      for (let i = -1; i <= 1; i++) {
        const spread = i * (50 + f.seed * 70) * grow;
        ctx.strokeStyle = `rgba(${AMBER}, ${(i === 0 ? 0.95 : 0.6) * fade})`;
        ctx.lineWidth = i === 0 ? 1.6 : 1.1;
        ctx.beginPath();
        for (let k = 0; k <= 24; k++) {
          const t = k / 24;
          const e = t * t * (3 - 2 * t);
          const [sx, sy] = project(f.site.x + spread * e, ground ? v0 + reach * t : v0 - reach * t);
          if (k === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }
    }

    // The shock in transit.
    const arrived: Pulse[] = [];
    pulses = pulses.filter((pu) => {
      const t = (now - pu.t0) / pu.dur;
      if (t < 0) return true;
      if (t >= 1) {
        arrived.push(pu);
        return false;
      }
      const ref = sites[pu.from]!.y;
      const v0 = depthOf(ref);
      ctx.strokeStyle = `rgba(${AMBER}, 0.75)`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i <= 20; i++) {
        const [x, y] = along(pu.route, pu.from, (t * i) / 20);
        const [sx, sy] = project(x, v0 + (y - ref));
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      const [x, y] = along(pu.route, pu.from, t);
      const v = v0 + (y - ref);
      const [sx, sy] = project(x, v);
      const k = Math.max(3, 6 * scaleAt(v));
      ctx.fillStyle = `rgb(${AMBER})`;
      ctx.fillRect(sx - k / 2, sy - k / 2, k, k);
      return true;
    });
    for (const pu of arrived) {
      glows.push({ site: sites[pu.to]!, t0: now });
      spread(pu.to, now, pu.depth + 1, new Set([pu.from, pu.to]));
    }

    // Discovery: the new connection draws itself, holds, and fades.
    finds = finds.filter((f) => now - f.t0 < 4200);
    for (const f of finds) {
      const age = now - f.t0;
      if (age < 0) continue;
      const grow = 1 - (1 - Math.min(1, age / 1300)) ** 3;
      const fade = age < 3200 ? 1 : 1 - (age - 3200) / 1000;
      const va = depthOf(f.a.y);
      const vb = va + (f.b.y - f.a.y);
      const pts: Array<[number, number]> =
        f.bend === 'hv' ? [[f.a.x, va], [f.b.x, va], [f.b.x, vb]] : [[f.a.x, va], [f.a.x, vb], [f.b.x, vb]];
      const seg1 = Math.abs(pts[1]![0] - pts[0]![0]) + Math.abs(pts[1]![1] - pts[0]![1]);
      const seg2 = Math.abs(pts[2]![0] - pts[1]![0]) + Math.abs(pts[2]![1] - pts[1]![1]);
      let left = (seg1 + seg2) * grow;
      ctx.strokeStyle = `rgba(${AMBER}, ${fade})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      let [px, py] = project(pts[0]![0], pts[0]![1]);
      ctx.moveTo(px, py);
      let end: [number, number] = [pts[0]![0], pts[0]![1]];
      for (let k = 1; k < 3 && left > 0; k++) {
        const [ax, av] = pts[k - 1]!;
        const [bx, bv] = pts[k]!;
        const len = Math.abs(bx - ax) + Math.abs(bv - av);
        const t = len ? Math.min(1, left / len) : 1;
        end = [ax + (bx - ax) * t, av + (bv - av) * t];
        for (let i = 1; i <= 12; i++) {
          const u = (t * i) / 12;
          [px, py] = project(ax + (bx - ax) * u, av + (bv - av) * u);
          ctx.lineTo(px, py);
        }
        left -= len;
      }
      ctx.stroke();
      const [ex, ey] = project(end[0], end[1]);
      ctx.fillStyle = `rgba(${AMBER}, ${fade})`;
      ctx.fillRect(ex - 3.5, ey - 3.5, 7, 7);
      if (grow >= 1) {
        const p = f.b.parcel;
        const path = new Path2D();
        for (const v of placements(p)) if (seen(p.x, v, p.w, p.h)) quad(path, p.x, v, p.w, p.h);
        ctx.fillStyle = `rgba(${AMBER}, ${0.28 * fade})`;
        ctx.fill(path);
        ctx.strokeStyle = `rgba(${AMBER}, ${fade})`;
        ctx.lineWidth = 1.5;
        ctx.stroke(path);
      }
    }
  };

  const draw = (now: number): void => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawPlan();
    drawLive(now);
  };

  // --- the shock ------------------------------------------------------------------

  /** Disrupt an institution where the viewer can see it, clear of the words. */
  const disrupt = (now: number): void => {
    if (sites.length < 3) return;
    const pool = sites
      .map((s, i) => {
        const [sx, sy] = project(s.x, depthOf(s.y));
        return { i, sx, sy };
      })
      .filter((o) => {
        if (links[o.i]!.length < 2) return false;
        if (o.sx < W * 0.08 || o.sx > W * 0.92 || o.sy < H * 0.12 || o.sy > H * 0.9) return false;
        if (!ground) return true;
        // Beside the headline, or below the words.
        return o.sy > H * 0.74 || Math.abs(o.sx - W / 2) > W * 0.3;
      });
    const pick = pool.length ? pool[Math.floor(rand() * pool.length)]!.i : Math.floor(rand() * sites.length);
    const s = sites[pick]!;
    glows.push({ site: s, t0: now });
    futures.push({ site: s, t0: now, seed: rand() });
    spread(pick, now, 0, new Set([pick]));
    lastShock = now;

    // Then discovery: a connection the plan did not have, to an institution
    // near enough to matter, drawn after the futures have been explored.
    const linked = new Set(links[pick]!.map((k) => (routes[k]!.a === pick ? routes[k]!.b : routes[k]!.a)));
    const cands = sites
      .map((t, j) => ({ t, j, d: Math.abs(t.x - s.x) + Math.abs(t.y - s.y) }))
      .filter((o) => o.j !== pick && !linked.has(o.j) && o.d > 140 && o.d < 420)
      .filter((o) => {
        const [sx, sy] = project(o.t.x, depthOf(s.y) + (o.t.y - s.y));
        return sx > W * 0.06 && sx < W * 0.94 && sy > H * 0.2 && sy < H * 0.98;
      });
    if (cands.length) {
      const o = cands[Math.floor(rand() * cands.length)]!;
      finds.push({ a: s, b: o.t, bend: rand() < 0.5 ? 'hv' : 'vh', t0: now + 2300 });
    }
  };

  const spread = (from: number, now: number, depth: number, reached: Set<number>): void => {
    if (depth > 2) return;
    const out = links[from]!.slice().sort(() => rand() - 0.5).slice(0, depth === 0 ? 3 : 2);
    for (const k of out) {
      const r = routes[k]!;
      const to = r.a === from ? r.b : r.a;
      if (reached.has(to)) continue;
      reached.add(to);
      pulses.push({ route: r, from, to, t0: now + 220 + depth * 40, dur: 700 + r.len * 4.2, depth });
    }
  };

  // --- running --------------------------------------------------------------------

  const tick = (now: number): void => {
    raf = requestAnimationFrame(tick);
    if (now - drawn < FRAME_MS || now < scrollingUntil) return;
    drawn = now;
    const dt = Math.min(100, now - (last || now));
    last = now;
    offset = (offset + (drift * dt) / 1000) % PD;
    if (now >= next) {
      disrupt(now);
      next = now + every;
    }
    if (opts.phases) {
      const since = now - lastShock;
      const p = since < 2300 ? 'futures' : since < 5800 ? 'discovery' : 'model';
      if (p !== phase) {
        phase = p;
        opts.phases.dataset['phase'] = p;
      }
    }
    draw(now);
  };

  const start = (): void => {
    if (reduced || raf || !visible || document.hidden || !W) return;
    last = 0;
    if (!next) next = performance.now() + 500;
    raf = requestAnimationFrame(tick);
  };
  const stop = (): void => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  /** Under reduced motion: one composed moment, held. */
  const still = (): void => {
    const t0 = 10000;
    disrupt(t0);
    for (let t = t0; t < t0 + 2400; t += 40) {
      for (const pu of pulses.slice()) {
        if (t - pu.t0 >= pu.dur) {
          pulses.splice(pulses.indexOf(pu), 1);
          glows.push({ site: sites[pu.to]!, t0: t });
          spread(pu.to, t, pu.depth + 1, new Set([pu.from, pu.to]));
        }
      }
    }
    for (const f of finds) f.t0 = t0;
    draw(t0 + 1500);
    if (opts.phases) opts.phases.dataset['phase'] = 'discovery';
  };

  const fit = (): void => {
    stop();
    pulses = [];
    glows = [];
    futures = [];
    finds = [];
    build();
    if (!W) return;
    if (reduced) still();
    else {
      draw(performance.now());
      start();
    }
  };

  let queued = 0;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(queued);
    queued = requestAnimationFrame(() => {
      if (Math.round(host.clientWidth) !== W || Math.round(host.clientHeight) !== H) fit();
    });
  });
  ro.observe(host);

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible) start();
      else stop();
    },
    { threshold: 0 },
  );
  io.observe(host);

  const onVisibility = (): void => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVisibility);

  // While the reader scrolls, the world holds still: it costs nothing then.
  const onScroll = (): void => {
    scrollingUntil = performance.now() + 160;
    last = 0;
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  fit();

  return {
    destroy: () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('scroll', onScroll);
    },
  };
}
