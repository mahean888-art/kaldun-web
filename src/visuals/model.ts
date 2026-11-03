/**
 * The hero's artwork: a white model of one connected system.
 *
 * One small economy on a single plate, drawn the way architects build white
 * massing models: a solar field with battery storage, a substation and a
 * transmission line, a factory, a warehouse beside a port crane and a ship,
 * and a bank. Charcoal lines carry goods and power; finer dashed lines carry
 * money and obligations. The ground is the orange reference grid.
 *
 * One slow pass of about twelve seconds, then rest:
 *   Model     — the blocks rise from the grid and the lines draw in.
 *   Futures   — three translucent copies of the plate fan out behind it; in
 *               one the line to the solar field goes slack. The conditions
 *               are named as they bind.
 *   Discovery — the copies fold back; the loan to the solar field is redrawn
 *               in orange as two stages, and the battery gains a line to the
 *               substation.
 * The rest state carries the whole idea on its own; under reduced motion it
 * is all that is drawn. The motion never moves any text on the page.
 */

import { prefersReducedMotion } from '../lib/prefers';

const S = 40; // pixels per plate unit

// A shallow oblique view: the plate runs left to right across the frame, its
// depth falling gently toward the viewer, its height straight up.
type V = [number, number, number];
const sx = (x: number, y: number): number => (x * 0.96 - y * 0.42) * S;
const sy = (x: number, y: number, z: number): number => (x * 0.16 + y * 0.46) * S - z * S * 0.92;
const P = ([x, y, z]: V): string => `${sx(x, y).toFixed(1)},${sy(x, y, z).toFixed(1)}`;
const poly = (pts: V[], cls: string): string => `<polygon class="${cls}" points="${pts.map(P).join(' ')}"/>`;
const line = (a: V, b: V, cls: string): string => `<line class="${cls}" x1="${sx(a[0], a[1]).toFixed(1)}" y1="${sy(...a).toFixed(1)}" x2="${sx(b[0], b[1]).toFixed(1)}" y2="${sy(...b).toFixed(1)}"/>`;

/** A box: its two visible sides, then its top. */
function box(x: number, y: number, z: number, w: number, d: number, h: number, tone = ''): string {
  const t = z + h;
  return (
    poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, t], [x, y + d, t]], `m-l ${tone}`) +
    poly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, t], [x + w, y, t]], `m-r ${tone}`) +
    poly([[x, y, t], [x + w, y, t], [x + w, y + d, t], [x, y + d, t]], `m-t ${tone}`)
  );
}

/** A gabled roof running along x, ridge across the middle of y. */
function gable(x: number, y: number, z: number, w: number, d: number, rise: number): string {
  const m = y + d / 2;
  const r = z + rise;
  return (
    poly([[x, y, z], [x + w, y, z], [x + w, m, r], [x, m, r]], 'm-t') +
    poly([[x, m, r], [x + w, m, r], [x + w, y + d, z], [x, y + d, z]], 'm-l') +
    poly([[x + w, y, z], [x + w, y + d, z], [x + w, m, r]], 'm-r')
  );
}

/** A soft shadow on the ground, cast toward the back. */
const shadow = (x: number, y: number, w: number, d: number, k = 0.5): string =>
  poly([[x + k, y - k * 0.4, 0], [x + w + k, y - k * 0.4, 0], [x + w + k, y + d, 0], [x + k, y + d, 0]], 'm-shadow');

type Part = { key: number; svg: string; base: V; id: string };

function scene(): { parts: Part[]; lines: string; money: string; found: string; slack: string; notes: string } {
  const parts: Part[] = [];
  // Nearer the viewer is larger y, then larger x: draw far to near.
  const add = (id: string, base: V, svg: string, key = base[1] + base[0] * 0.18): void => {
    parts.push({ id, base, svg, key: key === -100 ? key : base[1] + base[0] * 0.18 });
  };

  // Solar field: rows of tilted panels on low legs.
  for (let r = 0; r < 5; r++) {
    const y = 5.2 + r * 1.05;
    let s = '';
    for (let x = 1; x < 7; x += 2) s += line([x + 0.2, y + 0.3, 0], [x + 0.2, y + 0.3, 0.35], 'm-leg') + line([x + 1.6, y + 0.3, 0], [x + 1.6, y + 0.3, 0.35], 'm-leg');
    s += poly([[1, y + 0.7, 0.3], [7, y + 0.7, 0.3], [7, y, 0.72], [1, y, 0.72]], 'm-panel');
    for (let x = 1.5; x < 7; x += 0.5) s += line([x, y + 0.7, 0.3], [x, y, 0.72], 'm-cell');
    add('solar', [4, y + 0.35, 0], s, 4 + y);
  }

  // Battery storage: three containers beside the field.
  for (let i = 0; i < 3; i++) {
    const y = 5.4 + i * 1.25;
    add('battery', [8.5, y, 0], shadow(7.7, y, 1.7, 0.9) + box(7.7, y, 0, 1.7, 0.9, 0.85) + line([7.9, y + 0.9, 0.2], [9.2, y + 0.9, 0.2], 'm-cell'), 8.5 + y);
  }

  // Substation: a pad, two transformers and a gantry.
  {
    let s = shadow(10, 6, 2.6, 2.6) + box(10, 6, 0, 2.6, 2.6, 0.08);
    s += box(10.4, 6.5, 0.08, 0.8, 0.7, 0.75) + box(10.4, 7.6, 0.08, 0.8, 0.7, 0.75);
    for (const y of [6.3, 8.3]) s += box(11.9, y, 0.08, 0.16, 0.16, 1.9);
    s += box(11.9, 6.3, 1.98, 0.16, 2.16, 0.12);
    add('substation', [11.3, 7.3, 0], s);
  }

  // Transmission line: two pylons and their wires, to the factory.
  const pylon = (x: number, y: number): string =>
    line([x - 0.35, y - 0.35, 0], [x, y, 3.1], 'm-steel') +
    line([x + 0.35, y + 0.35, 0], [x, y, 3.1], 'm-steel') +
    line([x - 0.35, y + 0.35, 0], [x, y, 3.1], 'm-steel') +
    line([x, y - 0.8, 2.75], [x, y + 0.8, 2.75], 'm-steel');
  add('pylon', [14, 7.3, 0], pylon(14, 7.3), 14 + 7.3);
  add('pylon', [16.3, 7.3, 0], pylon(16.3, 7.3), 16.3 + 7.3);

  // Factory: a hall with a sawtooth roof and a stack.
  {
    let s = shadow(17.4, 5.2, 4, 3.4, 0.8) + box(17.4, 5.2, 0, 4, 3.4, 1.3);
    for (let i = 0; i < 4; i++) {
      const x = 17.4 + i;
      s += poly([[x, 5.2, 1.3], [x, 8.6, 1.3], [x + 1, 8.6, 1.85], [x + 1, 5.2, 1.85]], 'm-t');
      s += poly([[x + 1, 5.2, 1.3], [x + 1, 8.6, 1.3], [x + 1, 8.6, 1.85], [x + 1, 5.2, 1.85]], 'm-glass');
      s += poly([[x, 8.6, 1.3], [x + 1, 8.6, 1.3], [x + 1, 8.6, 1.85]], 'm-l');
    }
    s += box(18, 5.5, 0, 0.45, 0.45, 3.4);
    add('factory', [19.4, 6.9, 0], s);
  }

  // The warehouse, the quay, a crane and a ship at the right of the plate.
  {
    const s = shadow(21, 5, 4.2, 2.6, 0.7) + box(21, 5, 0, 4.2, 2.6, 1.15) + gable(21, 5, 1.15, 4.2, 2.6, 0.45);
    add('warehouse', [23.1, 6.3, 0], s);
    let w = poly([[26.2, -1, -0.06], [33, -1, -0.06], [33, 15, -0.06], [26.2, 15, -0.06]], 'm-water');
    for (let x = 26.6; x < 33; x += 0.5) w += line([x, -0.6, -0.06], [x, 14.6, -0.06], 'm-ripple');
    add('water', [29, 7, 0], w, -100);
    let hull = shadow(27.4, 3.4, 1.6, 6.2, 0.4) + box(27.4, 3.4, -0.06, 1.6, 6.2, 0.62);
    for (let i = 0; i < 4; i++) hull += box(27.55, 4.6 + i * 1.15, 0.56, 1.3, 1.0, 0.45 + (i % 2) * 0.4, 'm-box');
    hull += box(27.55, 3.55, 0.56, 1.3, 0.9, 1.25);
    add('ship', [28.2, 6.5, 0], hull);
    let c = '';
    for (const [x, y] of [[25.4, 5.6], [25.4, 7.0], [26.5, 5.6], [26.5, 7.0]] as const) c += box(x, y, 0, 0.18, 0.18, 3.1);
    c += box(25.2, 5.6, 3.1, 4.6, 1.58, 0.22) + box(25.4, 5.8, 3.32, 1, 1.1, 0.42);
    add('crane', [26, 6.4, 0], c);
  }

  // The bank: plinth, columns, entablature, pediment. Its form clear, unbranded.
  {
    let s = shadow(11.2, 10.4, 4.2, 2.6, 0.7) + box(11.2, 10.4, 0, 4.2, 2.6, 0.28);
    s += box(11.6, 10.6, 0.28, 3.4, 1.7, 1.3);
    for (let i = 0; i < 6; i++) s += box(11.7 + i * 0.62, 12.35, 0.28, 0.22, 0.22, 1.3);
    s += box(11.5, 10.5, 1.58, 3.9, 2.2, 0.26) + gable(11.5, 10.5, 1.84, 3.9, 2.2, 0.55);
    add('bank', [13.3, 11.7, 0], s);
  }

  // Goods and power: solid charcoal.
  const arc = (a: V, b: V, lift: number, cls: string, extra = ''): string => {
    const ax = sx(a[0], a[1]);
    const ay = sy(...a);
    const bx = sx(b[0], b[1]);
    const by = sy(...b);
    const mx = (ax + bx) / 2;
    const my = Math.min(ay, by) - lift;
    return `<path class="${cls}" ${extra} d="M${ax.toFixed(1)} ${ay.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}"/>`;
  };
  const lines =
    arc([7, 7.5, 0.5], [7.7, 7.2, 0.6], 6, 'm-flow', 'data-draw') +
    arc([9.4, 7.4, 0.8], [11.2, 7.3, 0.85], 10, 'm-flow', 'data-draw') +
    arc([12, 7.3, 1.95], [14, 7.3, 2.75], 8, 'm-flow', 'data-draw') +
    arc([14, 7.3, 2.75], [16.3, 7.3, 2.75], 12, 'm-flow', 'data-draw') +
    arc([16.3, 7.3, 2.75], [17.6, 7.3, 1.6], 8, 'm-flow', 'data-draw') +
    arc([21.4, 6.9, 0.8], [21.2, 6.3, 0.9], 10, 'm-flow', 'data-draw') +
    arc([25.2, 6.4, 0.4], [27.6, 6.5, 1.0], 16, 'm-flow', 'data-draw');

  // Money and obligations: finer dashed charcoal, from the bank.
  const money =
    arc([13.3, 11.6, 2.4], [4, 7.6, 0.8], 70, 'm-money', 'data-draw data-loan') +
    arc([13.3, 11.6, 2.4], [19.4, 7, 1.9], 54, 'm-money', 'data-draw') +
    arc([13.3, 11.6, 2.4], [23.1, 6.3, 1.6], 70, 'm-money', 'data-draw');

  // The discovery: the loan in two stages, and the battery wired to the substation.
  const found =
    arc([13.3, 11.6, 2.4], [8.5, 7.4, 0.9], 46, 'm-found', 'data-found') +
    arc([8.5, 7.4, 0.9], [4, 7.6, 0.8], 28, 'm-found', 'data-found') +
    `<rect class="m-stage" data-found-node x="${(sx(8.5, 7.4) - 4).toFixed(1)}" y="${(sy(8.5, 7.4, 0.9) - 4).toFixed(1)}" width="8" height="8" transform="rotate(45 ${sx(8.5, 7.4).toFixed(1)} ${sy(8.5, 7.4, 0.9).toFixed(1)})"/>` +
    arc([9.2, 7.6, 0.9], [10.4, 7.8, 0.85], 14, 'm-found', 'data-found');

  // In one of the futures, the line to the solar field goes slack.
  const a = [9.4, 7.4, 0.8] as V;
  const b = [11.2, 7.3, 0.85] as V;
  const slack = `<path class="m-slack" d="M${sx(a[0], a[1]).toFixed(1)} ${sy(...a).toFixed(1)}Q${((sx(a[0], a[1]) + sx(b[0], b[1])) / 2).toFixed(1)} ${(sy(...a) + 22).toFixed(1)} ${sx(b[0], b[1]).toFixed(1)} ${sy(...b).toFixed(1)}"/>`;

  const note = (id: string, at: V, dx: number, dy: number, text: string, cls = ''): string => {
    const x = sx(at[0], at[1]);
    const y = sy(...at);
    const f = (n: number): string => n.toFixed(1);
    // Wide: one line beside the leader. Narrow: two lines centred over the model.
    const [head, rest] = text.split(' · ');
    const cx = 370;
    const ty = -16;
    const wide = `<g class="m-w"><line x1="${f(x)}" y1="${f(y)}" x2="${f(x + dx)}" y2="${f(y + dy)}"/><text x="${f(x + dx + (dx < 0 ? -6 : 6))}" y="${f(y + dy + 4)}" text-anchor="${dx < 0 ? 'end' : 'start'}">${text}</text></g>`;
    const narrow = `<g class="m-n"><line x1="${f(x)}" y1="${f(y)}" x2="${f(cx)}" y2="${f(ty + 36)}"/><text x="${cx}" y="${f(ty)}" text-anchor="middle"><tspan x="${cx}">${head} ·</tspan><tspan x="${cx}" dy="1.2em">${rest}</tspan></text></g>`;
    return `<g class="m-note ${cls}" data-note="${id}">${wide}${narrow}<circle cx="${f(x)}" cy="${f(y)}" r="2.5"/></g>`;
  };
  const notes =
    note('condition', [11.2, 6.8, 0.9], -10, -86, 'CONDITION · TRANSFORMERS 6 MONTHS LATE') +
    note('binding', [15.4, 10.4, 2.2], 30, -70, 'BINDING · FIRST DEBT PAYMENT') +
    note('found', [8.5, 7.4, 0.9], 40, -96, 'FOUND · STAGE THE LOAN WITH DELIVERIES', 'm-note--found');

  return { parts: parts.sort((m, n) => m.key - n.key), lines, money, found, slack, notes };
}

function ground(): string {
  let d = '';
  for (let x = -4; x <= 31; x++) d += `M${sx(x, -3).toFixed(1)} ${sy(x, -3, 0).toFixed(1)}L${sx(x, 16).toFixed(1)} ${sy(x, 16, 0).toFixed(1)}`;
  for (let y = -3; y <= 16; y++) d += `M${sx(-4, y).toFixed(1)} ${sy(-4, y, 0).toFixed(1)}L${sx(31, y).toFixed(1)} ${sy(31, y, 0).toFixed(1)}`;
  return `<path class="m-grid" d="${d}" mask="url(#m-fade)"/>`;
}

const ease = (t: number): number => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) ** 3);
const span = (t: number, a: number, b: number): number => Math.max(0, Math.min(1, (t - a) / (b - a)));

export function initModel(host: HTMLElement): void {
  const panel = host.closest('.hero')?.querySelector<HTMLElement>('.hero__panel') ?? null;
  const sc = scene();
  // The view: wide, the plate cropped at its sides so it runs off the frame;
  // on a phone, closer in on the bank, the substation and the factory.
  const wideView = '-70 40 1140 300';
  const narrowView = '60 -50 620 390';
  const narrow = window.matchMedia('(max-width: 759px)');
  const vb = narrow.matches ? narrowView : wideView;

  // The futures are drawn as outlines of the same plate, without shadows.
  const outline = sc.parts.filter((p) => p.id !== 'water').map((p) => p.svg.replace(/<polygon class="m-shadow"[^>]*\/>/g, '')).join('');
  host.innerHTML = `<svg class="mdl" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs>
      <radialGradient id="m-fade-g" cx="50%" cy="55%" r="55%"><stop offset="0.55" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
      <mask id="m-fade"><rect x="-600" y="-400" width="2400" height="1200" fill="url(#m-fade-g)"/></mask>
      <filter id="m-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
    </defs>
    ${ground()}
    <g class="m-futures" data-futures>
      <g class="m-copy" data-copy="0">${outline}</g>
      <g class="m-copy" data-copy="1">${outline}${sc.slack}</g>
      <g class="m-copy" data-copy="2">${outline}</g>
    </g>
    <g class="m-parts">${sc.parts.map((p) => `<g class="m-part" data-part="${p.id}" data-bx="${sx(p.base[0], p.base[1]).toFixed(1)}" data-by="${sy(...p.base).toFixed(1)}">${p.svg}</g>`).join('')}</g>
    <g class="m-lines">${sc.lines}</g>
    <g class="m-moneys">${sc.money}</g>
    <g class="m-founds">${sc.found}</g>
    <g class="m-notes">${sc.notes}</g>
  </svg>`;

  const svg = host.querySelector('svg')!;
  narrow.addEventListener('change', () => svg.setAttribute('viewBox', narrow.matches ? narrowView : wideView));
  const parts = Array.from(svg.querySelectorAll<SVGGElement>('.m-part'));
  const draws = Array.from(svg.querySelectorAll<SVGPathElement>('[data-draw]'));
  const founds = Array.from(svg.querySelectorAll<SVGPathElement>('[data-found]'));
  const node = svg.querySelector<SVGRectElement>('[data-found-node]');
  const loan = svg.querySelector<SVGPathElement>('[data-loan]');
  const copies = Array.from(svg.querySelectorAll<SVGGElement>('[data-copy]'));
  const note = (id: string): SVGGElement | null => svg.querySelector(`[data-note="${id}"]`);
  for (const p of [...draws, ...founds]) {
    const l = p.getTotalLength();
    p.style.setProperty('--len', String(l));
    p.style.strokeDasharray = p.classList.contains('m-money') ? '' : `${l}`;
  }

  const phase = (p: string): void => {
    if (!panel) return;
    if (p) panel.dataset['phase'] = p;
    else delete panel.dataset['phase'];
  };

  // The whole scene at a moment in the pass, t in milliseconds.
  const at = (t: number): void => {
    parts.forEach((g, i) => {
      const k = ease(span(t, 150 + i * 110, 900 + i * 110));
      const bx = g.dataset['bx'];
      const by = g.dataset['by'];
      g.setAttribute('transform', `translate(${bx} ${by}) scale(1 ${k.toFixed(3)}) translate(${-Number(bx)} ${-Number(by)})`);
      g.style.opacity = String(Math.min(1, k * 3));
    });
    draws.forEach((p, i) => {
      const k = ease(span(t, 2500 + i * 90, 3500 + i * 90));
      if (p.classList.contains('m-money')) p.style.opacity = String(k * (1 - 0.6 * ease(span(t, 8200, 8700)) * (p === loan ? 1 : 0)));
      else p.style.strokeDashoffset = String(Number(p.style.getPropertyValue('--len')) * (1 - k));
    });
    // Futures: fan out, hold, fold back.
    const out = ease(span(t, 3900, 4900)) * (1 - ease(span(t, 7400, 8200)));
    const fan: Array<[number, number]> = [[-60, -34], [0, -58], [60, -34]];
    copies.forEach((c, i) => {
      const [dx, dy] = fan[i]!;
      c.setAttribute('transform', `translate(${(dx * out).toFixed(1)} ${(dy * out).toFixed(1)})`);
      c.style.opacity = String(0.55 * out);
    });
    const show = (id: string, a: number, b: number): void => {
      const n = note(id);
      if (n) n.style.opacity = String(ease(span(t, a, a + 500)) * (1 - ease(span(t, b, b + 500))));
    };
    // On a phone the notes share one slot, so the condition hands over to the binding.
    show('condition', 5000, narrow.matches ? 5700 : 7400);
    show('binding', 6200, 7400);
    // Discovery.
    founds.forEach((p, i) => {
      const a = 8600 + i * 900;
      p.style.strokeDashoffset = String(Number(p.style.getPropertyValue('--len')) * (1 - ease(span(t, a, a + 1000))));
    });
    if (node) node.style.opacity = String(ease(span(t, 9400, 9800)));
    const f = note('found');
    if (f) f.style.opacity = String(ease(span(t, 10600, 11200)));
    phase(t < 3800 ? 'model' : t < 8200 ? 'futures' : t < 12600 ? 'discovery' : '');
  };

  if (prefersReducedMotion()) {
    at(20000);
    return;
  }
  at(0);
  let raf = 0;
  let start = 0;
  const run = (now: number): void => {
    if (!start) start = now;
    const t = now - start;
    at(t);
    if (t < 12800) raf = requestAnimationFrame(run);
  };
  const io = new IntersectionObserver((e) => {
    if (!e.some((x) => x.isIntersecting)) return;
    io.disconnect();
    raf = requestAnimationFrame(run);
  });
  io.observe(host);
  void raf;
}
