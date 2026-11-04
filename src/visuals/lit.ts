/**
 * The hero: the lit model.
 *
 * One white plate with five objects (a bank, a solar field with storage, a
 * factory, a warehouse and port, a city block of offices), rendered in Blender
 * with Cycles: soft global illumination and contact shadows, baked into a still
 * (scripts/hero/scene.py). The channels are etched into the plate. The same
 * script projects every channel through the same camera into src/data/lit.json,
 * so the light here runs exactly along the grooves, and hides where a building
 * stands in front of it.
 *
 * Flows are light, not lines. One pass of about twelve seconds, then rest:
 *   Model      money runs as orange light from the bank, goods and power as
 *              pale light along the front.
 *   Futures    the money fans into faint branches across the plate; the one
 *              that reaches the port dims and thins: a delay.
 *   Discovery  one new channel etches itself from the bank to the solar field:
 *              the loan, staged with deliveries. Its light runs brighter, the
 *              dimmed branch recovers, and a single tag names it.
 * At rest the plate is calm: the one bright channel and its tag, and the
 * ordinary flows running quietly in ink and pearl. Only the found channel is
 * orange. Under reduced motion, or on a slow device, the rest state is drawn
 * once over the still.
 */

import lit from '../data/lit.json';
import { prefersReducedMotion } from '../lib/prefers';

type P = [number, number, number?];
type View = { w: number; h: number; paths: Record<string, P[][]>; tag: [number, number] };
const DATA = lit as unknown as Record<'wide' | 'narrow', View>;

const ease = (t: number): number => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) ** 3);
const span = (t: number, a: number, b: number): number => Math.max(0, Math.min(1, (t - a) / (b - a)));
const smooth = (a: number, b: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** A path in pixels, with its cumulative length, for placing light along it. */
type Track = { pts: Array<[number, number, number]>; acc: number[]; len: number };
function track(path: P[], W: number, H: number): Track {
  const pts = path.map(([x, y, s]) => [x * W, y * H, s ?? 1] as [number, number, number]);
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1]! + Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]));
  return { pts, acc, len: acc[acc.length - 1]! };
}
function at(t: Track, d: number): [number, number, number] {
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

export function initLit(host: HTMLElement): void {
  const hero = host.closest('.hero');
  const panel = hero?.querySelector<HTMLElement>('.hero__panel') ?? null;
  const clusters = hero?.querySelector<HTMLElement>('[data-clusters]') ?? null;
  const stage = host.querySelector<HTMLElement>('[data-lit-stage]');
  const canvas = host.querySelector<HTMLCanvasElement>('canvas');
  const tag = host.querySelector<HTMLElement>('[data-lit-tag]');
  if (!stage || !canvas || !tag) return;
  const c = canvas.getContext('2d');
  if (!c) return;
  const narrowQ = window.matchMedia('(max-width: 759px)');
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  const still = prefersReducedMotion() || (navigator.hardwareConcurrency ?? 4) <= 2 || !!nav.connection?.saveData;

  let view: View = DATA.wide;
  let W = 1;
  let H = 1;
  let dpr = 1;
  let tracks: Record<string, Track[]> = {};
  let scale = 1;

  /** Size the stage to the still's own proportions, as large as the space allows. */
  const layout = (): void => {
    view = narrowQ.matches ? DATA.narrow : DATA.wide;
    const r = host.getBoundingClientRect();
    const ar = view.w / view.h;
    let w = r.width;
    let h = w / ar;
    if (h > r.height && r.height > 40) {
      h = r.height;
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
    scale = W / 1100;
    tracks = Object.fromEntries(Object.entries(view.paths).map(([k, ls]) => [k, ls.map((l) => track(l, W, H))]));
    // The tag sits above the found channel's run, on a hairline leader.
    const f = tracks['found']?.[0];
    if (f) {
      const p = at(f, f.len * 0.42);
      // On a phone the tag starts at its leader, clear of the frame's edge.
      tag.style.left = `${(narrowQ.matches ? 6 : p[0]).toFixed(1)}px`;
      tag.style.top = `${p[1].toFixed(1)}px`;
    }
  };

  const dot = (x: number, y: number, r: number, fill: string, glow: string, blur: number): void => {
    c.shadowColor = glow;
    c.shadowBlur = blur;
    c.fillStyle = fill;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  };

  /** Light running along a track: n beads, moving at v px/s, shaped by `look`. */
  const run = (
    tr: Track,
    time: number,
    n: number,
    v: number,
    look: (k: number, pos: number) => [number, string, string, number] | null,
  ): void => {
    const gap = tr.len / n;
    for (let i = 0; i < n; i++) {
      const d = (i * gap + (time / 1000) * v * scale) % tr.len;
      const [x, y, seen] = at(tr, d);
      if (!seen) continue;
      const k = d / tr.len;
      const s = look(k, d);
      if (!s) continue;
      // Fade in and out at the ends of each run, so light rises from the groove.
      const edge = Math.min(1, d / (12 * scale), (tr.len - d) / (12 * scale));
      if (edge <= 0) continue;
      c.globalAlpha = edge;
      dot(x, y, s[0] * scale, s[1], s[2], s[3] * scale);
    }
    c.globalAlpha = 1;
  };

  const phase = (p: string): void => {
    if (!panel) return;
    if (p) panel.dataset['phase'] = p;
    else delete panel.dataset['phase'];
  };
  const beats = (t: number): void => {
    clusters?.classList.toggle('b1', t >= 150);
    clusters?.classList.toggle('b2', t >= 3900);
    clusters?.classList.toggle('b3', t >= 8200);
  };

  /** One frame. t is the time in the pass (ms); clock drives the beads. */
  const frame = (t: number, clock: number): void => {
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    const into = ease(span(t, 0, 1400));
    const rest = smooth(9800, 12200, t); // ordinary flows settle into ink and pearl
    const fan = ease(span(t, 3900, 5200)) * (1 - ease(span(t, 9800, 11400)));
    const etch = ease(span(t, 8600, 9900));
    const recover = smooth(9200, 10400, t);

    // Goods and power: pale pearls along the front channels.
    for (const tr of tracks['goods'] ?? []) {
      run(tr, clock, Math.max(4, Math.round(tr.len / (34 * scale))), 26, () => [2.1, `rgba(255,255,255,${0.95 * into})`, 'rgba(110,88,58,0.55)', 4]);
    }
    // Money: orange light from the bank during the pass; ink at rest.
    const mA = into * (1 - 0.5 * rest);
    for (const tr of tracks['money'] ?? []) {
      run(tr, clock, Math.max(4, Math.round(tr.len / (38 * scale))), 34, () => {
        const r = 240 + (23 - 240) * rest;
        const g = 144 + (20 - 144) * rest;
        const b = 10 + (16 - 10) * rest;
        return [2.2 - 0.5 * rest, `rgba(${r | 0},${g | 0},${b | 0},${(0.9 * mA).toFixed(3)})`, `rgba(240,144,10,${(0.7 * (1 - rest)).toFixed(3)})`, 8 * (1 - rest)];
      });
    }
    // Futures: faint branches; the one that reaches the port dims and thins.
    if (fan > 0.01) {
      (tracks['futures'] ?? []).forEach((tr, i) => {
        run(tr, clock, Math.max(6, Math.round(tr.len / (22 * scale))), 30, (k) => {
          const grow = Math.min(1, fan * 1.35 - k * 0.35);
          if (grow <= 0 || k > grow * 1.2) return null;
          let a = 0.5 * fan;
          let r = 1.6;
          if (i === 2) {
            const delay = smooth(0.55, 0.92, k) * (1 - recover);
            a *= 1 - 0.85 * delay;
            r *= 1 - 0.55 * delay;
          }
          return [r, `rgba(240,144,10,${a.toFixed(3)})`, `rgba(240,144,10,${(a * 0.8).toFixed(3)})`, 6];
        });
      });
    }
    // Discovery: the new channel etches itself, then its light runs brighter.
    const f = tracks['found']?.[0];
    if (f && etch > 0) {
      const upto = f.len * etch;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      const stroke = (w: number, style: string, blur: number, glow: string): void => {
        c.beginPath();
        let moved = false;
        for (let i = 0; i < f.pts.length; i++) {
          if (f.acc[i]! > upto) break;
          const [x, y] = f.pts[i]!;
          if (!moved) {
            c.moveTo(x, y);
            moved = true;
          } else c.lineTo(x, y);
        }
        const [ex, ey] = at(f, upto);
        c.lineTo(ex, ey);
        c.shadowBlur = blur;
        c.shadowColor = glow;
        c.strokeStyle = style;
        c.lineWidth = w;
        c.stroke();
      };
      stroke(4.2 * scale, 'rgba(112,86,52,0.22)', 0, 'transparent'); // the groove
      stroke(1.8 * scale, 'rgba(240,144,10,0.95)', 10 * scale, 'rgba(240,144,10,0.8)'); // its light
      c.shadowBlur = 0;
      if (etch >= 1) {
        const bright = ease(span(t, 9900, 10600));
        run(f, clock, Math.max(5, Math.round(f.len / (26 * scale))), 44, () => [2.8, `rgba(255,190,90,${bright.toFixed(3)})`, 'rgba(240,144,10,0.95)', 12]);
      }
    }
    c.shadowBlur = 0;
    tag.style.opacity = String(ease(span(t, 10600, 11300)));
    phase(t < 3800 ? 'model' : t < 8200 ? 'futures' : t < 12600 ? 'discovery' : '');
    beats(t);
  };

  let t0 = 0;
  let raf = 0;
  let held = -1;
  let visible = true;
  const REST = 12800;
  const loop = (now: number): void => {
    if (!t0) t0 = now;
    const t = held >= 0 ? held : now - t0;
    frame(t, now);
    if (visible && !document.hidden) raf = requestAnimationFrame(loop);
    else raf = 0;
  };
  const start = (): void => {
    if (!raf) raf = requestAnimationFrame(loop);
  };

  // For review: draw any moment of the pass on request.
  host.addEventListener('lit-at', (e) => {
    held = Number((e as CustomEvent).detail);
    frame(held, performance.now());
  });

  const relayout = (): void => {
    layout();
    if (still) frame(20000, 0);
  };
  new ResizeObserver(relayout).observe(host);
  narrowQ.addEventListener('change', relayout);
  layout();
  host.classList.add('is-live');

  if (still) {
    frame(20000, 0);
    return;
  }
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
  void REST;
}
