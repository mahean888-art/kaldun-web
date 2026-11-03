/**
 * The hero's artwork: one system, made visible, then rearranged.
 *
 * A constructed model stands on an orange reference grid, seen at a shallow
 * oblique angle: a pool of resources, an agreement that bridges them to
 * capacity, a row of capacity, and the obligation they all serve, with
 * dependencies arcing above. The motion tells a short story with resting
 * states between its moves:
 *
 *   1. Model     — the parts and their relationships take form.
 *   2. Futures   — conditions vary: translucent variants of the same structure.
 *   3. Discovery — the arrangement itself changes: a staged connection is
 *                  found beside the original, which stays visible.
 *
 * Varying conditions and changing an arrangement look different on purpose:
 * the first is drawn as translucent outlines of the same parts, the second as
 * a new orange connection. Under reduced motion the discovered arrangement is
 * drawn once, beside the original, and held. The corner marks of the panel
 * light with the move being made (data-phase on the panel).
 */

import { prefersReducedMotion } from '../lib/prefers';

const NS = 'http://www.w3.org/2000/svg';

// The projection: x runs to the lower right, y to the lower left, z up.
const K = 34;
const CX = K * 0.92;
const SY = K * 0.4;
const ZY = K * 0.95;
const OX = 230;
const OY = 92;

const pt = (x: number, y: number, z: number): [number, number] => [OX + (x - y) * CX, OY + (x + y) * SY - z * ZY];
const pts = (list: Array<[number, number, number]>): string =>
  list.map(([x, y, z]) => pt(x, y, z).map((v) => v.toFixed(1)).join(',')).join(' ');

type Box = { x: number; y: number; z: number; w: number; d: number; h: number };

/** The three faces of a box a viewer sees: top, the +x face, the +y face. */
function faces(b: Box): { top: string; right: string; left: string } {
  const { x, y, z, w, d, h } = b;
  const t = z + h;
  return {
    top: pts([[x, y, t], [x + w, y, t], [x + w, y + d, t], [x, y + d, t]]),
    right: pts([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, t], [x + w, y, t]]),
    left: pts([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, t], [x, y + d, t]]),
  };
}

const ease = (t: number): number => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) ** 3);
const clamp01 = (t: number): number => Math.max(0, Math.min(1, t));
const span = (t: number, a: number, b: number): number => clamp01((t - a) / (b - a));

// --- the system ------------------------------------------------------------------

const POOL: Box[] = [0, 1, 2, 3].map((i) => ({ x: 0.6, y: 2.2, z: i * 0.36, w: 2.2, d: 2.2, h: 0.3 }));
const PIERS: Box[] = [
  { x: 3.6, y: 2.95, z: 0, w: 0.28, d: 0.5, h: 1.15 },
  { x: 6.2, y: 2.95, z: 0, w: 0.28, d: 0.5, h: 1.15 },
];
const DECK: Box = { x: 2.8, y: 2.85, z: 1.15, w: 4.4, d: 0.7, h: 0.16 };
const CAP_X = [7.4, 8.4, 9.4, 10.4, 11.4];
const CAP_H = [1.7, 2.3, 1.9, 2.6, 2.1];
const capBox = (i: number, h: number): Box => ({ x: CAP_X[i]!, y: 2.6, z: 0, w: 0.72, d: 1.2, h });
const PLINTH: Box = { x: 13.1, y: 1.6, z: 0, w: 1.2, d: 1.2, h: 3.4 };

/** Variants of the same capacity under different conditions. */
const VARIANTS = [
  [1.2, 1.9, 1.3, 2.0, 1.5],
  [2.0, 2.7, 2.3, 3.0, 2.5],
];

/** The discovered arrangement: commit in stages, each span landing as capacity arrives. */
const STAGES: Box[] = [
  { x: 2.8, y: 4.6, z: 0.62, w: 1.55, d: 0.55, h: 0.14 },
  { x: 4.45, y: 4.6, z: 0.92, w: 1.55, d: 0.55, h: 0.14 },
  { x: 6.1, y: 4.6, z: 1.22, w: 1.55, d: 0.55, h: 0.14 },
];
const STAGE_PIERS: Box[] = [
  { x: 4.3, y: 4.62, z: 0, w: 0.2, d: 0.5, h: 0.62 },
  { x: 5.95, y: 4.62, z: 0, w: 0.2, d: 0.5, h: 0.92 },
  { x: 7.55, y: 4.62, z: 0, w: 0.2, d: 0.5, h: 1.22 },
];

const W = 760;
const H = 470;

function el<K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number>, parent?: Element): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  parent?.appendChild(node);
  return node;
}

type BoxView = { g: SVGGElement; top: SVGPolygonElement; right: SVGPolygonElement; left: SVGPolygonElement };

function boxView(parent: Element, cls: string): BoxView {
  const g = el('g', { class: `sys__box ${cls}` }, parent);
  return {
    g,
    left: el('polygon', { class: 'sys__face sys__face--left' }, g),
    right: el('polygon', { class: 'sys__face sys__face--right' }, g),
    top: el('polygon', { class: 'sys__face sys__face--top' }, g),
  };
}

function place(v: BoxView, b: Box): void {
  const f = faces(b);
  v.top.setAttribute('points', f.top);
  v.right.setAttribute('points', f.right);
  v.left.setAttribute('points', f.left);
}

/** An arc above the structure, from one point to another. */
function arc(a: [number, number, number], b: [number, number, number], lift: number): string {
  const [ax, ay] = pt(...a);
  const [bx, by] = pt(...b);
  const mx = (ax + bx) / 2;
  const my = Math.min(ay, by) - lift;
  return `M${ax.toFixed(1)} ${ay.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
}

function ground(svg: SVGSVGElement): void {
  const g = el('g', { class: 'sys__ground' }, svg);
  const X0 = -1;
  const X1 = 16;
  const Y0 = -0.5;
  const Y1 = 7;
  const fade = (x: number, y: number): number => {
    const dx = (x - 7.5) / 9;
    const dy = (y - 3.2) / 4.4;
    return Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
  };
  for (let x = X0; x <= X1; x++) {
    for (let y = Y0; y < Y1; y += 0.5) {
      const a = fade(x, y + 0.25);
      if (a < 0.04) continue;
      const [x1, y1] = pt(x, y, 0);
      const [x2, y2] = pt(x, y + 0.5, 0);
      el('line', { x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1), 'stroke-opacity': (a * 0.55).toFixed(2) }, g);
    }
  }
  for (let y = Math.ceil(Y0); y <= Y1; y++) {
    for (let x = X0; x < X1; x += 0.5) {
      const a = fade(x + 0.25, y);
      if (a < 0.04) continue;
      const [x1, y1] = pt(x, y, 0);
      const [x2, y2] = pt(x + 0.5, y, 0);
      el('line', { x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1), 'stroke-opacity': (a * 0.55).toFixed(2) }, g);
    }
  }
}

// The story, in milliseconds. The first pass builds the model; then the
// futures and the discovery repeat, with rests between.
const BUILD = 2600;
const REST1 = 1600;
const FUT = 5200;
const REST2 = 600;
const DISC = 5600;
const OUT = 1100;
const LOOP = FUT + REST2 + DISC + OUT + REST1;

export function initSystem(host: HTMLElement): void {
  const panel = host.closest<HTMLElement>('.hero__panel');
  const reduced = prefersReducedMotion();

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'sys', 'aria-hidden': 'true', focusable: 'false' });
  host.replaceChildren(svg);
  ground(svg);

  // Shadows on the ground, for presence.
  const shade = el('g', { class: 'sys__shade' }, svg);
  const shadow = (b: Box): void => {
    el('polygon', { points: pts([[b.x + 0.25, b.y + 0.25, 0], [b.x + b.w + 0.25, b.y + 0.25, 0], [b.x + b.w + 0.25, b.y + b.d + 0.25, 0], [b.x + 0.25, b.y + b.d + 0.25, 0]]) }, shade);
  };
  [POOL[0]!, ...PIERS, ...CAP_X.map((_, i) => capBox(i, 1)), PLINTH].forEach(shadow);

  // The discovered arrangement sits nearer the viewer than the original, so
  // it is drawn after the parts it passes in front of.
  const futures = el('g', { class: 'sys__futures' }, svg);
  const pool = POOL.map((_, i) => boxView(svg, i === POOL.length - 1 ? 'sys__box--resource' : 'sys__box--slab'));
  const piers = PIERS.map(() => boxView(svg, 'sys__box--pier'));
  const deck = boxView(svg, 'sys__box--agreement');
  const caps = CAP_X.map(() => boxView(svg, 'sys__box--capacity'));
  const fills = CAP_X.map(() => boxView(svg, 'sys__box--fill'));
  const plinth = boxView(svg, 'sys__box--obligation');
  const ghosts = VARIANTS.map(() => CAP_X.map(() => boxView(futures, 'sys__box--ghost')));
  const discovery = el('g', { class: 'sys__discovery' }, svg);
  const stagePiers = STAGE_PIERS.map(() => boxView(discovery, 'sys__box--pier sys__box--new'));
  const stages = STAGES.map(() => boxView(discovery, 'sys__box--stage'));
  const links = el('g', { class: 'sys__links' }, svg);
  const dep1 = el('path', { class: 'sys__dep', d: arc([1.7, 3.3, 1.44], [13.7, 2.2, 3.4], 70) }, links);
  const dep2 = el('path', { class: 'sys__dep', d: arc([9.8, 3.2, 1.9], [13.7, 2.2, 3.4], 36) }, links);
  const newLink = el('path', { class: 'sys__link-new', d: arc([1.7, 4.4, 1.44], [7.9, 3.4, 1.7], 22) }, discovery);
  const tag = el('g', { class: 'sys__tag' }, discovery);
  const [tx, ty] = pt(5.2, 5.6, 0);
  el('path', { d: `M${tx.toFixed(1)} ${(ty - 4).toFixed(1)} v14` }, tag);
  el('text', { x: (tx + 6).toFixed(1), y: (ty + 24).toFixed(1) }, tag).textContent = 'STAGED COMMITMENT';

  const labels = el('g', { class: 'sys__labels' }, svg);
  const label = (text: string, at: [number, number, number], anchor = 'middle'): void => {
    const [x, y] = pt(...at);
    el('text', { x: x.toFixed(1), y: y.toFixed(1), 'text-anchor': anchor }, labels).textContent = text;
  };
  label('RESOURCES', [1.7, 4.9, 0], 'end');
  label('AGREEMENT', [5.0, 2.2, 2.0]);
  label('CAPACITY', [9.0, 5.4, 0]);
  label('OBLIGATION', [14.4, 3.4, 0], 'start');

  const dl1 = (dep1 as SVGPathElement).getTotalLength?.() ?? 600;
  const dl2 = (dep2 as SVGPathElement).getTotalLength?.() ?? 300;
  const dl3 = (newLink as SVGPathElement).getTotalLength?.() ?? 300;
  dep1.style.strokeDasharray = `${dl1}`;
  dep2.style.strokeDasharray = `${dl2}`;
  newLink.style.strokeDasharray = `${dl3}`;

  let phase = '';
  const setPhase = (p: string): void => {
    if (p === phase || !panel) return;
    phase = p;
    panel.dataset['phase'] = p;
  };

  /** The whole scene at a moment: b is how far the model is built (0–1). */
  const render = (b: number, fut: number, variant: number, disc: number): void => {
    POOL.forEach((box, i) => place(pool[i]!, { ...box, h: box.h * ease(span(b, i * 0.06, 0.3 + i * 0.06)) }));
    PIERS.forEach((box, i) => place(piers[i]!, { ...box, h: box.h * ease(span(b, 0.25, 0.5)) }));
    const db = ease(span(b, 0.4, 0.62));
    place(deck, { ...DECK, w: DECK.w * db, h: db ? DECK.h : 0 });
    CAP_X.forEach((_, i) => {
      const h = CAP_H[i]! * ease(span(b, 0.45 + i * 0.05, 0.75 + i * 0.05));
      place(caps[i]!, capBox(i, h));
      // Capacity in use: an orange level inside each column.
      place(fills[i]!, { ...capBox(i, h * 0.42), x: CAP_X[i]! + 0.06, y: 2.66, w: 0.6, d: 1.08 });
    });
    place(plinth, { ...PLINTH, h: PLINTH.h * ease(span(b, 0.6, 0.92)) });
    deck.g.style.opacity = String(1 - 0.55 * disc);

    const lk = ease(span(b, 0.8, 1));
    dep1.style.strokeDashoffset = String(dl1 * (1 - lk));
    dep2.style.strokeDashoffset = String(dl2 * (1 - lk));

    // Futures: the same capacity, under other conditions.
    VARIANTS.forEach((hs, v) => {
      const on = fut * (variant === v ? 1 : variant + 1 === v ? 0 : 0);
      ghosts[v]!.forEach((view, i) => place(view, capBox(i, hs[i]!)));
      ghosts[v]!.forEach((view) => (view.g.style.opacity = String(on)));
    });

    // Discovery: the staged connection, span by span.
    STAGES.forEach((box, i) => {
      const s = ease(span(disc, 0.12 + i * 0.22, 0.34 + i * 0.22));
      place(stages[i]!, { ...box, w: box.w * s, h: s ? box.h : 0 });
      place(stagePiers[i]!, { ...STAGE_PIERS[i]!, h: STAGE_PIERS[i]!.h * ease(span(disc, i * 0.22, 0.2 + i * 0.22)) });
    });
    newLink.style.strokeDashoffset = String(dl3 * (1 - ease(span(disc, 0.7, 1))));
    discovery.style.opacity = disc > 0 ? '1' : '0';
    tag.style.opacity = String(ease(span(disc, 0.75, 1)));
    labels.style.opacity = String(ease(span(b, 0.85, 1)));
  };

  // Fit the drawing to the model, not to the whole ground.
  render(1, 1, 0, 1);
  tag.style.opacity = '1';
  const parts = [shade, ...[pool, piers, [deck], caps, [plinth], stages].flat().map((v) => v.g), links, discovery, labels];
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const g of parts) {
    const b = (g as SVGGraphicsElement).getBBox();
    if (!b.width && !b.height) continue;
    x0 = Math.min(x0, b.x);
    y0 = Math.min(y0, b.y);
    x1 = Math.max(x1, b.x + b.width);
    y1 = Math.max(y1, b.y + b.height);
  }
  if (Number.isFinite(x0)) {
    const padX = (x1 - x0) * 0.06;
    const padY = (y1 - y0) * 0.1;
    svg.setAttribute('viewBox', `${(x0 - padX).toFixed(0)} ${(y0 - padY).toFixed(0)} ${(x1 - x0 + 2 * padX).toFixed(0)} ${(y1 - y0 + 2 * padY).toFixed(0)}`);
  }

  if (reduced) {
    render(1, 0, 0, 1);
    setPhase('discovery');
    return;
  }

  render(0, 0, 0, 0);
  setPhase('model');

  let raf = 0;
  let t0 = 0;
  let paused = 0;
  let visible = false;
  let last = 0;

  const frame = (now: number): void => {
    raf = requestAnimationFrame(frame);
    if (now - last < 1000 / 40) return;
    last = now;
    const t = now - t0;
    if (t < BUILD) {
      render(t / BUILD, 0, 0, 0);
      setPhase('model');
      return;
    }
    const u = (t - BUILD - REST1 + LOOP) % LOOP;
    // Rest after building, then the loop: futures → discovery → back.
    if (t < BUILD + REST1) {
      render(1, 0, 0, 0);
      setPhase('model');
      return;
    }
    if (u < FUT) {
      const half = FUT / 2;
      const variant = u < half ? 0 : 1;
      const local = u < half ? u : u - half;
      const f = Math.min(span(local, 0, 500), 1 - span(local, half - 500, half));
      render(1, f, variant, 0);
      setPhase('futures');
    } else if (u < FUT + REST2) {
      render(1, 0, 0, 0);
      setPhase('model');
    } else if (u < FUT + REST2 + DISC) {
      render(1, 0, 0, span(u - FUT - REST2, 0, DISC * 0.6));
      setPhase('discovery');
    } else if (u < FUT + REST2 + DISC + OUT) {
      const o = span(u - FUT - REST2 - DISC, 0, OUT);
      render(1, 0, 0, 1 - o);
      discovery.style.opacity = String(1 - o);
      setPhase('discovery');
    } else {
      render(1, 0, 0, 0);
      setPhase('model');
    }
  };

  const start = (): void => {
    if (raf || !visible || document.hidden) return;
    if (!t0) t0 = performance.now();
    else if (paused) t0 += performance.now() - paused;
    paused = 0;
    raf = requestAnimationFrame(frame);
  };
  const stop = (): void => {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
    paused = performance.now();
  };

  new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    if (visible) start();
    else stop();
  }).observe(host);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
}
