/**
 * The hero: a world, and its futures.
 *
 * In front, one small world on a white plate, rendered in Blender with soft
 * light and contact shadows: a coast and a port, towers, a solar field with
 * storage, a factory, a data center, a road and a rail line. Behind it, eight
 * slices of frosted acrylic, each etched with the same world in a slightly
 * different state, fanned like a deck of cards held open. One glows from
 * within in warm orange: the same world with one changed connection.
 *
 * Each slice is its own render, so the browser can stack them behind the world
 * and move them. Fine lines of warm light run along the roads, rails and links,
 * on paths projected through the same camera (scripts/hero/deck.py).
 *
 * One pass of ten seconds, then rest:
 *   0–2 s   the world rests in light; the flows move.            MODEL
 *   2–6 s   the slices rise out of the plate one by one and fan
 *           open, their silhouettes flickering through states.    FUTURES
 *   6–8 s   they settle; one ignites, and the flows brighten
 *           along the changed connection.                         DISCOVERY
 * Then it holds, and only the flows keep moving. Under reduced motion, or on a
 * slow device, the still is shown instead.
 */

import deck from '../data/deck.json';
import { prefersReducedMotion } from '../lib/prefers';

type P = [number, number, number];
type View = { w: number; h: number; paths: Record<string, P[][]> };
const DATA = deck as unknown as Record<'wide' | 'narrow', View>;
const N = 8;
const LIT = 3;

const ease = (t: number): number => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) ** 3);
const span = (t: number, a: number, b: number): number => Math.max(0, Math.min(1, (t - a) / (b - a)));

type Track = { pts: P[]; acc: number[]; len: number };
function track(path: P[], W: number, H: number): Track {
  const pts = path.map(([x, y, s]) => [x * W, y * H, s] as P);
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1]! + Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]));
  return { pts, acc, len: acc[acc.length - 1]! };
}
function at(t: Track, d: number): P {
  if (d <= 0) return t.pts[0]!;
  if (d >= t.len) return t.pts[t.pts.length - 1]!;
  let lo = 0;
  let hi = t.acc.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (t.acc[m]! < d) lo = m;
    else hi = m;
  }
  const a = t.pts[lo]!;
  const b = t.pts[hi]!;
  const k = (d - t.acc[lo]!) / (t.acc[hi]! - t.acc[lo]! || 1);
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, Math.min(a[2], b[2])];
}

export function initDeck(host: HTMLElement): void {
  const hero = host.closest('.hero');
  const panel = hero?.querySelector<HTMLElement>('.hero__panel') ?? null;
  const clusters = hero?.querySelector<HTMLElement>('[data-clusters]') ?? null;
  const stage = host.querySelector<HTMLElement>('[data-deck-stage]');
  const canvas = host.querySelector<HTMLCanvasElement>('canvas');
  if (!stage || !canvas) return;
  const c = canvas.getContext('2d');
  if (!c) return;
  const narrowQ = window.matchMedia('(max-width: 759px)');
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  const still = prefersReducedMotion() || (navigator.hardwareConcurrency ?? 4) <= 2 || !!nav.connection?.saveData;

  const view = (): 'wide' | 'narrow' => (narrowQ.matches ? 'narrow' : 'wide');
  const slices: HTMLImageElement[] = [];
  let plain: HTMLImageElement | null = null;
  let lit: HTMLImageElement | null = null;
  let world: HTMLImageElement | null = null;

  /** Build the layers for the current framing: slices behind, the world in front. */
  const layers = (): void => {
    const v = view();
    const layer = (src: string, cls: string): HTMLImageElement => {
      const im = new Image();
      im.src = `/deck-${src}-${v}.webp`;
      im.alt = '';
      im.decoding = 'async';
      im.className = `deck__l ${cls}`;
      im.setAttribute('aria-hidden', 'true');
      return im;
    };
    stage.querySelectorAll('.deck__l').forEach((n) => n.remove());
    slices.length = 0;
    for (let k = N - 1; k >= 0; k--) {
      const im = layer(k === LIT ? `slice${k}p` : `slice${k}`, 'deck__slice');
      im.style.setProperty('--k', String(k));
      slices[k] = im;
      stage.append(im);
      if (k === LIT) {
        plain = im;
        lit = layer(`slice${k}`, 'deck__slice deck__lit');
        lit.style.setProperty('--k', String(k));
        stage.append(lit);
      }
    }
    world = layer('world', 'deck__world');
    // If the layers can't load, the still stays: the picture never goes blank.
    world.addEventListener('error', () => host.classList.remove('is-live'), { once: true });
    stage.append(world);
    stage.append(canvas);
  };

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let tracks: Record<string, Track[]> = {};

  /** Size the stage to the render's proportions, bottom-aligned; the fan may rise behind the copy. */
  const layout = (): void => {
    const v = DATA[view()];
    const r = host.getBoundingClientRect();
    const ar = v.w / v.h;
    let w = r.width;
    let h = w / ar;
    const room = r.height * (narrowQ.matches ? 1.0 : 1.15);
    if (h > room && room > 40) {
      h = room;
      w = h * ar;
    }
    W = Math.max(1, Math.round(w));
    H = Math.max(1, Math.round(h));
    stage.style.width = `${W}px`;
    stage.style.height = `${H}px`;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    scale = W / 1300;
    tracks = Object.fromEntries(Object.entries(v.paths).map(([k, ls]) => [k, ls.map((l) => track(l, W, H))]));
  };

  /** A comet of warm light running along a track. */
  const comets = (tr: Track, time: number, n: number, v: number, len: number, alpha: number, width: number): void => {
    const gap = tr.len / n;
    for (let i = 0; i < n; i++) {
      const head = (i * gap + (time / 1000) * v * scale) % tr.len;
      const tail = Math.max(0, head - len * scale);
      const steps = 10;
      for (let s = 0; s < steps; s++) {
        const d0 = tail + ((head - tail) * s) / steps;
        const d1 = tail + ((head - tail) * (s + 1)) / steps;
        const a = at(tr, d0);
        const b = at(tr, d1);
        if (!a[2] || !b[2]) continue;
        const k = (s + 1) / steps;
        c.strokeStyle = `rgba(255,${(170 + 50 * k) | 0},${(90 + 60 * k) | 0},${(alpha * k).toFixed(3)})`;
        c.lineWidth = width * scale;
        c.beginPath();
        c.moveTo(a[0], a[1]);
        c.lineTo(b[0], b[1]);
        c.stroke();
      }
    }
  };

  const phase = (p: string): void => {
    if (!panel) return;
    if (p) panel.dataset['phase'] = p;
    else delete panel.dataset['phase'];
  };

  const rnd = (k: number, t: number): number => {
    const x = Math.sin(k * 91.7 + Math.floor(t / 90) * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };

  /** One frame: t is time in the pass (ms); clock runs the light. */
  const frame = (t: number, clock: number): void => {
    // The slices rise one by one and fan open, flickering through states; then settle.
    slices.forEach((im, k) => {
      if (!im) return;
      const a = 2000 + (N - 1 - k) * 380;
      const rise = ease(span(t, a, a + 900));
      const flick = t > a && t < 6000 ? 0.55 + 0.45 * rnd(k, t) : 1;
      im.style.clipPath = `inset(${((1 - rise) * 100).toFixed(1)}% 0 0 0)`;
      im.style.transform = `translateY(${((1 - rise) * 6).toFixed(2)}%)`;
      im.style.opacity = String(rise * flick);
    });
    const ignite = ease(span(t, 6200, 7600));
    if (lit && plain) {
      lit.style.clipPath = plain.style.clipPath;
      lit.style.transform = plain.style.transform;
      lit.style.opacity = String(ignite);
      plain.style.opacity = String(Number(plain.style.opacity || 1) * (1 - ignite));
    }
    // The light on the world.
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    c.lineCap = 'round';
    const into = ease(span(t, 0, 1200));
    for (const tr of tracks['rail'] ?? []) comets(tr, clock, 5, 60, 90, 0.75 * into, 1.6);
    for (const tr of tracks['road'] ?? []) comets(tr, clock, 4, 48, 60, 0.7 * into, 1.4);
    for (const tr of tracks['link'] ?? []) comets(tr, clock, 2, 36, 40, 0.6 * into, 1.2);
    const f = tracks['found']?.[0];
    if (f && ignite > 0) {
      // The changed connection draws itself, then runs brighter than the rest.
      const upto = f.len * ignite;
      c.shadowColor = 'rgba(240,144,10,0.9)';
      c.shadowBlur = 10 * scale;
      c.strokeStyle = 'rgba(240,144,10,0.95)';
      c.lineWidth = 2 * scale;
      c.beginPath();
      let moved = false;
      for (let i = 0; i < f.pts.length && f.acc[i]! <= upto; i++) {
        const [x, y] = f.pts[i]!;
        if (!moved) {
          c.moveTo(x, y);
          moved = true;
        } else c.lineTo(x, y);
      }
      const [ex, ey] = at(f, upto);
      c.lineTo(ex, ey);
      c.stroke();
      c.shadowBlur = 0;
      if (ignite >= 1) comets(f, clock, 3, 70, 50, 1, 2.6);
    }
    phase(t < 2000 ? 'model' : t < 6200 ? 'futures' : t < 9600 ? 'discovery' : '');
    clusters?.classList.toggle('b1', t >= 100);
    clusters?.classList.toggle('b2', t >= 2000);
    clusters?.classList.toggle('b3', t >= 6200);
  };

  let t0 = 0;
  let raf = 0;
  let held = -1;
  let visible = true;
  const loop = (now: number): void => {
    if (!t0) t0 = now;
    frame(held >= 0 ? held : now - t0, now);
    raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
  };
  const start = (): void => {
    if (!raf) raf = requestAnimationFrame(loop);
  };
  host.addEventListener('deck-at', (e) => {
    held = Number((e as CustomEvent).detail);
    frame(held, performance.now());
  });

  if (still) {
    host.classList.add('is-still');
    layout();
    new ResizeObserver(layout).observe(host);
    return;
  }
  layers();
  layout();
  host.classList.add('is-live');
  new ResizeObserver(() => {
    layout();
  }).observe(host);
  narrowQ.addEventListener('change', () => {
    layers();
    layout();
  });
  clusters?.classList.remove('b1', 'b2', 'b3');
  frame(0, 0);
  const io = new IntersectionObserver((e) => {
    visible = e.some((x) => x.isIntersecting);
    if (visible) start();
  });
  io.observe(host);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && visible) start();
  });
}
