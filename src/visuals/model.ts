/**
 * The hero's artwork: a white model of one connected system.
 *
 * One small economy on a single plate, drawn the way architects build white
 * massing models: a solar field with battery storage, a substation and a
 * transmission line, a factory, a warehouse, a port crane and a ship, and a
 * lender's tower. Modern massing, no ornament. Charcoal lines carry goods and power; finer dashed lines carry
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
const sx = (x: number, y: number): number => (x * 0.96 - y * 0.4) * S;
const sy = (x: number, y: number, z: number): number => (x * 0.12 + y * 0.4) * S - z * S * 0.9;
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

/** A soft shadow on the ground, cast toward the back. */
const shadow = (x: number, y: number, w: number, d: number, k = 0.5): string =>
  poly([[x + k, y - k * 0.4, 0], [x + w + k, y - k * 0.4, 0], [x + w + k, y + d, 0], [x + k, y + d, 0]], 'm-shadow');

type Part = { key: number; svg: string; base: V; id: string };

/** Floor lines on the two visible faces of a box: a curtain wall. */
function floors(x: number, y: number, z: number, w: number, d: number, h: number, step: number): string {
  let s = '';
  for (let k = z + step; k < z + h - 0.01; k += step) s += line([x, y + d, k], [x + w, y + d, k], 'm-floor') + line([x + w, y, k], [x + w, y + d, k], 'm-floor');
  return s;
}

function scene(): { parts: Part[]; lines: string; money: string; found: string; slack: string; notes: string; labels: string } {
  const parts: Part[] = [];
  // Draw far to near: smaller y first, then smaller x.
  const add = (id: string, base: V, svg: string, key = base[1] + base[0] * 0.18): void => {
    parts.push({ id, base, svg, key });
  };

  // Water and the quay edge, beneath everything.
  {
    let w = poly([[26.4, -3, -0.04], [36, -3, -0.04], [36, 14, -0.04], [26.4, 14, -0.04]], 'm-water');
    for (const x of [27.2, 30.4, 32.2]) w += line([x, -2, -0.04], [x, 13, -0.04], 'm-ripple');
    w += line([26.4, -3, 0], [26.4, 14, 0], 'm-quay');
    add('water', [30, 6, 0], w, -100);
  }

  // Solar field: four rows of tilted panels on low legs.
  for (let r = 0; r < 4; r++) {
    const y = 4.8 + r * 1.15;
    let s = '';
    for (let x = 0.8; x < 6.5; x += 1.9) s += line([x, y + 0.65, 0], [x, y + 0.65, 0.3], 'm-leg') + line([x, y + 0.1, 0], [x, y + 0.1, 0.62], 'm-leg');
    s += poly([[0.5, y + 0.75, 0.3], [6.5, y + 0.75, 0.3], [6.5, y, 0.68], [0.5, y, 0.68]], 'm-panel');
    for (let x = 1.0; x < 6.5; x += 0.5) s += line([x, y + 0.75, 0.3], [x, y, 0.68], 'm-cell');
    add('solar', [3.5, y + 0.4, 0], s, y + 0.4);
  }

  // Storage: three containers beside the field.
  for (let i = 0; i < 3; i++) {
    const y = 5.0 + i * 1.2;
    add('storage', [8.2, y, 0], shadow(7.4, y, 1.6, 0.85, 0.35) + box(7.4, y, 0, 1.6, 0.85, 0.8) + line([7.4, y + 0.85, 0.62], [9.0, y + 0.85, 0.62], 'm-floor'), y + 0.85 + 1.5);
  }

  // The lender: a slim tower on a podium, behind the substation.
  {
    let s = shadow(9.4, 0.4, 2.4, 2.4, 0.9) + box(9.4, 0.4, 0, 2.4, 2.4, 0.34);
    s += box(9.8, 0.8, 0.34, 1.6, 1.6, 2.2) + floors(9.8, 0.8, 0.34, 1.6, 1.6, 2.2, 0.275);
    s += box(10.05, 1.05, 2.54, 1.1, 1.1, 0.14);
    add('lender', [10.6, 1.6, 0], s);
  }

  // Substation: a pad, two transformers and a gantry.
  {
    let s = shadow(10, 5.4, 2.6, 2.6, 0.4) + box(10, 5.4, 0, 2.6, 2.6, 0.08);
    s += box(10.35, 5.8, 0.08, 0.8, 0.7, 0.72) + box(10.35, 6.9, 0.08, 0.8, 0.7, 0.72);
    for (const y of [5.7, 7.6]) s += box(11.85, y, 0.08, 0.14, 0.14, 1.55);
    s += box(11.85, 5.7, 1.63, 0.14, 2.04, 0.1);
    add('substation', [11.3, 6.7, 0], s);
  }

  // Transmission: two lattice masts.
  const mast = (x: number, y: number): string => {
    const t: V = [x, y, 3.0];
    let s = '';
    for (const [a, b] of [[-0.3, -0.3], [0.3, -0.3], [0.3, 0.3], [-0.3, 0.3]] as const) s += line([x + a, y + b, 0], t, 'm-steel');
    s += line([x - 0.16, y + 0.16, 1.4], [x + 0.16, y + 0.16, 1.4], 'm-steel');
    s += line([x, y - 0.85, 2.7], [x, y + 0.85, 2.7], 'm-steel');
    return s;
  };
  add('mast', [14.4, 6.7, 0], mast(14.4, 6.7));
  add('mast', [16.4, 6.7, 0], mast(16.4, 6.7));

  // Factory: a hall with a north-light roof and a stack.
  {
    let s = shadow(17.6, 5, 4, 3.2, 0.7) + box(17.6, 5, 0, 4, 3.2, 1.2);
    for (let i = 0; i < 4; i++) {
      const x = 17.6 + i;
      s += poly([[x, 5, 1.2], [x, 8.2, 1.2], [x + 1, 8.2, 1.7], [x + 1, 5, 1.7]], 'm-t');
      s += poly([[x + 1, 5, 1.2], [x + 1, 8.2, 1.2], [x + 1, 8.2, 1.7], [x + 1, 5, 1.7]], 'm-glass');
      s += poly([[x, 8.2, 1.2], [x + 1, 8.2, 1.2], [x + 1, 8.2, 1.7]], 'm-l');
    }
    s += box(18.1, 5.3, 0, 0.4, 0.4, 3.0);
    add('factory', [19.6, 6.6, 0], s);
  }

  // Warehouse: a flat-roofed shed with loading doors.
  {
    let s = shadow(22.4, 5, 3.2, 2.6, 0.6) + box(22.4, 5, 0, 3.2, 2.6, 1.15);
    for (let i = 0; i < 4; i++) s += poly([[22.75 + i * 0.75, 7.6, 0], [23.2 + i * 0.75, 7.6, 0], [23.2 + i * 0.75, 7.6, 0.62], [22.75 + i * 0.75, 7.6, 0.62]], 'm-door');
    add('warehouse', [24, 6.3, 0], s);
  }

  // The port: a gantry crane on the quay and a container ship alongside.
  {
    let hull = box(27.5, 3.0, -0.04, 1.6, 6.4, 0.6);
    for (let i = 0; i < 4; i++) hull += box(27.65, 4.3 + i * 1.15, 0.56, 1.3, 1.0, 0.42 + (i % 2) * 0.36, 'm-box');
    hull += box(27.65, 3.15, 0.56, 1.3, 0.9, 1.15);
    add('ship', [28.3, 6.2, 0], hull);
    let c = '';
    for (const [x, y] of [[25.9, 5.4], [25.9, 6.7], [26.9, 5.4], [26.9, 6.7]] as const) c += box(x, y, 0, 0.14, 0.14, 2.9);
    c += box(25.6, 5.4, 2.9, 4.4, 1.44, 0.18) + box(25.85, 5.6, 3.08, 0.9, 1.0, 0.36);
    add('crane', [26.4, 6.8, 0], c);
  }

  const arc = (a: V, b: V, lift: number, cls: string, extra = ''): string => {
    const ax = sx(a[0], a[1]);
    const ay = sy(...a);
    const bx = sx(b[0], b[1]);
    const by = sy(...b);
    const mx = (ax + bx) / 2;
    const my = lift >= 0 ? Math.min(ay, by) - lift : Math.max(ay, by) - lift;
    return `<path class="${cls}" ${extra} d="M${ax.toFixed(1)} ${ay.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}"/>`;
  };

  // Goods and power: solid charcoal. Wires sag between the masts.
  const SOL: V = [6.5, 7.3, 0.4];
  const SUB: V = [10.35, 7.25, 0.6];
  const lines =
    arc([6.5, 6.2, 0.4], [7.4, 6.2, 0.5], 6, 'm-flow', 'data-draw') +
    arc(SOL, SUB, 14, 'm-flow', 'data-draw data-solar') +
    arc([11.92, 6.7, 1.68], [14.4, 6.7, 2.7], 4, 'm-flow', 'data-draw') +
    arc([14.4, 6.7, 2.7], [16.4, 6.7, 2.7], -12, 'm-flow', 'data-draw') +
    arc([16.4, 6.7, 2.7], [17.6, 6.7, 1.5], -6, 'm-flow', 'data-draw') +
    arc([21.6, 6.6, 0.6], [22.4, 6.4, 0.6], 8, 'm-flow', 'data-draw') +
    arc([25.6, 6.2, 0.5], [27.5, 6.2, 0.7], 14, 'm-flow', 'data-draw');

  // Money and obligations: finer dashed charcoal, from the lender.
  const O: V = [10.6, 2.8, 0.34];
  const money =
    arc(O, [3.5, 6.4, 0.68], 34, 'm-money', 'data-draw data-loan') +
    arc(O, [19.6, 6.5, 1.7], 40, 'm-money', 'data-draw') +
    arc(O, [24, 6.3, 1.15], 52, 'm-money', 'data-draw');

  // The discovery: the loan in two stages, and storage wired to the substation.
  const ST: V = [8.2, 6.2, 0.8];
  const found =
    arc(O, ST, 22, 'm-found', 'data-found') +
    arc(ST, [3.5, 6.4, 0.68], 18, 'm-found', 'data-found') +
    `<rect class="m-stage" data-found-node x="${(sx(ST[0], ST[1]) - 4).toFixed(1)}" y="${(sy(...ST) - 4).toFixed(1)}" width="8" height="8" transform="rotate(45 ${sx(ST[0], ST[1]).toFixed(1)} ${sy(...ST).toFixed(1)})"/>` +
    arc([9.0, 7.0, 0.5], [10.35, 7.0, 0.5], 8, 'm-found', 'data-found');

  // In one of the futures, the line from the solar field goes slack.
  const slack = arc(SOL, SUB, -18, 'm-slack');

  // Notes: set in clear slots above the plate, a rule under the words and a
  // drop to the point. Wide: one line. Narrow: two lines, centred.
  const f = (n: number): string => n.toFixed(1);
  const CH = 8.6; // the width of one mono character at the note size, in view units
  const note = (id: string, at: V, side: 'l' | 'r', text: string, cls = ''): string => {
    const x = sx(at[0], at[1]);
    const y = sy(...at);
    const w = text.length * CH;
    const tx = side === 'l' ? -24 : 640;
    const ry = -8;
    const r0 = Math.min(tx, x);
    const r1 = Math.max(tx + w, x);
    // Left: a drop to a rule under the words. Right: out along the point's height, then up.
    const lead = side === 'l' ? `M${f(x)} ${f(y)}V${ry}M${f(r0)} ${ry}H${f(r1)}` : `M${f(x)} ${f(y)}H${tx}V${ry}H${f(tx + w)}`;
    const wide = `<g class="m-w"><path d="${lead}"/><text x="${tx}" y="-18">${text}</text></g>`;
    const [head, rest] = text.split(' · ');
    const cx = 360;
    const narrow = `<g class="m-n"><path d="M${f(x)} ${f(y)}V-44"/><text x="${cx}" y="-88" text-anchor="middle"><tspan x="${cx}">${head} ·</tspan><tspan x="${cx}" dy="1.25em">${rest}</tspan></text></g>`;
    return `<g class="m-note ${cls}" data-note="${id}">${wide}${narrow}<circle cx="${f(x)}" cy="${f(y)}" r="2.5"/></g>`;
  };
  const notes =
    note('condition', [10.75, 6.25, 0.8], 'l', 'CONDITION · TRANSFORMERS 6 MONTHS LATE') +
    note('binding', [11.4, 2.4, 1.6], 'r', 'BINDING · FIRST DEBT PAYMENT') +
    note('found', ST, 'l', 'FOUND · STAGE THE LOAN WITH DELIVERIES', 'm-note--found');

  // What each thing is, set on the ground in front of it.
  const lab = (t: string, x: number, y: number, anchor = 'start'): string =>
    `<text x="${f(sx(x, y))}" y="${f(sy(x, y, 0))}" text-anchor="${anchor}">${t}</text>`;
  const labels =
    lab('SOLAR', 0.6, 9.75) + lab('STORAGE', 7.4, 8.85) + lab('SUBSTATION', 10, 8.75) + lab('LENDER', 9.2, 1.5, 'end') +
    lab('FACTORY', 17.6, 8.95) + lab('WAREHOUSE', 22.4, 8.35) + lab('PORT', 25.9, 8.1);

  return { parts: parts.sort((m, n) => m.key - n.key), lines, money, found, slack, notes, labels };
}

function ground(): string {
  let d = '';
  for (let x = -4; x <= 31; x++) d += `M${sx(x, -1).toFixed(1)} ${sy(x, -1, 0).toFixed(1)}L${sx(x, 16).toFixed(1)} ${sy(x, 16, 0).toFixed(1)}`;
  for (let y = -1; y <= 16; y++) d += `M${sx(-4, y).toFixed(1)} ${sy(-4, y, 0).toFixed(1)}L${sx(31, y).toFixed(1)} ${sy(31, y, 0).toFixed(1)}`;
  return `<path class="m-grid" d="${d}" mask="url(#m-fade)"/>`;
}

const ease = (t: number): number => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) ** 3);
const span = (t: number, a: number, b: number): number => Math.max(0, Math.min(1, (t - a) / (b - a)));

export function initModel(host: HTMLElement): void {
  const panel = host.closest('.hero')?.querySelector<HTMLElement>('.hero__panel') ?? null;
  const sc = scene();
  // The view: wide, the plate cropped at its sides so it runs off the frame;
  // on a phone, closer in on the lender, the substation and the masts.
  const wideView = '-70 -46 1140 312';
  const narrowView = '40 -112 640 356';
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
    <g class="m-labels" data-labels>${sc.labels}</g>
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
  const labels = svg.querySelector<SVGGElement>('[data-labels]');
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
    const fan: Array<[number, number]> = [[-46, -20], [0, -34], [46, -20]];
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
    if (labels) labels.style.opacity = String(ease(span(t, 3200, 4000)));
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
