/**
 * Charts for the run: real series, drawn at their real pixel size.
 *
 * (from the step-by-step version)
 *
 * Six steps (Question, Model, Replay, Look ahead, Discover / Optimize /
 * Coordinate, Answer), each with one figure that shows the evidence behind it.
 * Three kinds of decision share the same steps; the tabs swap the data.
 *
 * Every chart is drawn at its real pixel size and redrawn on resize, so the
 * labels stay legible at any width. Numbers are computed from the series they
 * describe (the replay error, the weeks that fall short), never typed in apart
 * from them.
 */

export type Kind = 'optimize' | 'discover' | 'coordinate';
type Iv = { m: number; lo: number; hi: number };
type IvRow = { label: string; a: Iv; b: Iv; note: string };
type Pt = { x: number; y: number };
type Mark = Pt & { label: string; tone: 'grey' | 'ink' | 'orange'; short?: string };
type Effect = { label: string; v: number; fmt: string; ghost?: Pt };

const NS = 'http://www.w3.org/2000/svg';
const INK = '#141210';
const MUT = '#8a857c';
const GRID = 'rgba(20,18,16,0.08)';
const OR = '#f39200';
const ORD = '#b86a00';
const GREY = '#bdb7ac';

/* ------------------------------------------------------------------ helpers */

const el = (tag: string, cls?: string, html?: string): HTMLElement => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};
const sv = (tag: string, a: Record<string, string | number>, parent?: Element): SVGElement => {
  const e = document.createElementNS(NS, tag);
  for (const k in a) e.setAttribute(k, String(a[k]));
  parent?.appendChild(e);
  return e;
};
const txt = (parent: Element, x: number, y: number, s: string, o: Record<string, string | number> = {}): SVGElement => {
  const { 'font-family': ff = 'var(--mono)', ...rest } = o;
  const t = sv('text', { x, y, 'font-size': 12, fill: MUT, ...rest, style: `font-family:${ff}` }, parent);
  t.textContent = s;
  return t;
};
const rng = (seed: number) => (): number => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const svgOf = (w: number, h: number): SVGSVGElement => {
  const s = sv('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}`, role: 'img' }) as SVGSVGElement;
  return s;
};

/* ------------------------------------------------------------------- series */

const WEEKS = 78;
const XL: Array<[number, string]> = [[0, 'May 2025'], [26, 'Nov 2025'], [52, 'May 2026'], [77, 'Nov 2026']];

/** An observed weekly series, and the model's replay of it, scaled to a set mean error. */
function observed(seed: number, base: number, amp: number, trend: number): number[] {
  const r = rng(seed);
  return Array.from({ length: WEEKS }, (_, i) => base + trend * i + amp * Math.sin(i / 6.3) + amp * 0.5 * Math.sin(i / 2.1 + 1) + (r() - 0.5) * amp * 0.8);
}
function replayOf(obs: number[], seed: number, mae: number): number[] {
  const r = rng(seed);
  const e = obs.map(() => r() - 0.5);
  const k = mae / (e.reduce((s, v) => s + Math.abs(v), 0) / e.length);
  return obs.map((v, i) => v * (1 + e[i]! * k));
}
export const meanErr = (a: number[], b: number[]): number => a.reduce((s, v, i) => s + Math.abs(b[i]! - v) / v, 0) / a.length;

export const OBS_B = observed(11, 430, 46, 1.1);
export const REP_B = replayOf(OBS_B, 5, 0.018);
export const WITH_N = (() => {
  const r = rng(23);
  return OBS_B.map((v, i) => v * (1.22 + 0.1 * Math.sin(i / 3.7) + (r() - 0.5) * 0.12));
})();
export const LIMIT_B = (() => {
  const s = [...WITH_N].sort((a, b) => b - a);
  return (s[6]! + s[7]!) / 2; // exactly seven weeks above
})();
export const IDLE_NOW = observed(31, 2.1, 0.09, 0);
export const IDLE_OPT = IDLE_NOW.map((v, i) => v - 0.6 + 0.03 * Math.sin(i / 2.7));
export const OBS_E = observed(41, 8.4, 0.18, 0.012);
export const REP_E = replayOf(OBS_E, 9, 0.017);

/* ------------------------------------------------------------------- charts */

type LineCfg = {
  series: Array<{ v: number[]; color: string; dash?: string; w?: number }>;
  min: number; max: number; ticks: number[]; fmt: (v: number) => string;
  limit?: { v: number; label: string }; over?: number[]; h?: number; xl?: boolean;
};
export function lines(w: number, c: LineCfg): SVGSVGElement {
  const h = c.h ?? 220;
  const L = 52, R = 12, T = 10, B = 28;
  const s = svgOf(w, h);
  const X = (i: number) => L + (i / (WEEKS - 1)) * (w - L - R);
  const Y = (v: number) => T + (1 - (v - c.min) / (c.max - c.min)) * (h - T - B);
  c.ticks.forEach((t) => {
    sv('line', { x1: L, x2: w - R, y1: Y(t), y2: Y(t), stroke: GRID }, s);
    txt(s, L - 8, Y(t) + 4, c.fmt(t), { 'text-anchor': 'end' });
  });
  XL.forEach(([i, l], k) => txt(s, X(i), h - 8, w < 480 && k % 2 ? '' : l, { 'text-anchor': k === 0 ? 'start' : k === XL.length - 1 ? 'end' : 'middle' }));
  (c.over ?? []).forEach((i) => sv('rect', { x: X(i) - 2.5, y: T, width: 5, height: h - T - B, fill: 'rgba(243,146,0,0.14)' }, s));
  if (c.limit) {
    sv('line', { x1: L, x2: w - R, y1: Y(c.limit.v), y2: Y(c.limit.v), stroke: INK, 'stroke-dasharray': '3 3' }, s);
    txt(s, w - R, Y(c.limit.v) - 6, c.limit.label, { 'text-anchor': 'end', fill: INK });
  }
  c.series.forEach((se) => {
    const d = se.v.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join('');
    sv('path', { d, fill: 'none', stroke: se.color, 'stroke-width': se.w ?? 1.5, 'stroke-dasharray': se.dash ?? '', 'stroke-linejoin': 'round' }, s);
  });
  (c.over ?? []).forEach((i) => sv('circle', { cx: X(i), cy: Y(c.series[c.series.length - 1]!.v[i]!), r: 3, fill: OR }, s));
  return s;
}

export type IvCfg = { rows: IvRow[]; min: number; max: number; ticks: number[]; fmt: (v: number) => string; a?: string; b?: string; compact?: boolean };
export function intervals(w: number, c: IvCfg): SVGSVGElement {
  const narrow = w < 560;
  const L = narrow ? 8 : c.compact ? 200 : 230, R = narrow ? 112 : 150, rowH = narrow ? 82 : c.compact ? 46 : 60, T = 22, B = 24;
  const h = T + rowH * c.rows.length + B;
  const s = svgOf(w, h);
  const X = (v: number) => L + ((v - c.min) / (c.max - c.min)) * (w - L - R);
  const ca = w - (narrow ? 64 : 84), cb = w - 4;
  txt(s, ca, 12, c.a ?? '', { 'text-anchor': 'end' });
  txt(s, cb, 12, c.b ?? '', { 'text-anchor': 'end', fill: ORD });
  c.ticks.forEach((t) => {
    sv('line', { x1: X(t), x2: X(t), y1: T, y2: h - B, stroke: GRID }, s);
    txt(s, X(t), h - 8, c.fmt(t), { 'text-anchor': 'middle' });
  });
  c.rows.forEach((r, k) => {
    const y0 = T + k * rowH;
    sv('line', { x1: 0, x2: w, y1: y0, y2: y0, stroke: GRID }, s);
    const ly = c.compact && !narrow ? y0 + 28 : y0 + 24;
    txt(s, narrow ? L : 0, ly, r.label, { fill: INK, 'font-family': 'var(--sans)', 'font-size': 13 });
    if (!c.compact || narrow) txt(s, narrow ? L : 0, ly + 18, r.note, { 'font-family': 'var(--sans)', 'font-size': 12 });
    const ya = narrow ? y0 + 56 : c.compact ? y0 + 16 : y0 + 24, yb = ya + 14;
    ([[r.a, ya, false], [r.b, yb, true]] as Array<[Iv, number, boolean]>).forEach(([iv, y, strong]) => {
      const col = strong ? OR : GREY;
      sv('line', { x1: X(iv.lo), x2: X(iv.hi), y1: y, y2: y, stroke: col, 'stroke-width': 2, 'stroke-linecap': 'round' }, s);
      sv('circle', { cx: X(iv.m), cy: y, r: 4.5, fill: strong ? OR : '#fff', stroke: col, 'stroke-width': 1.5 }, s);
    });
    txt(s, ca, (ya + yb) / 2 + 4, c.fmt(r.a.m), { 'text-anchor': 'end', fill: MUT, 'font-size': 13 });
    txt(s, cb, (ya + yb) / 2 + 4, c.fmt(r.b.m), { 'text-anchor': 'end', fill: ORD, 'font-size': 13 });
  });
  return s;
}

type ScCfg = {
  pts: Pt[]; marks: Mark[]; xmin: number; xmax: number; ymin: number; ymax: number;
  xt: number[]; yt: number[]; xf: (v: number) => string; yf: (v: number) => string;
  xlab: string; ylab: string; quad?: boolean; h?: number; ghost?: { from: Pt; to: Pt; label: string } | undefined;
};
export function scatter(w: number, c: ScCfg): SVGSVGElement {
  const h = c.h ?? Math.max(260, Math.min(340, w * 0.5));
  const L = 52, R = 26, T = 18, B = 44;
  const s = svgOf(w, h);
  const X = (v: number) => L + ((v - c.xmin) / (c.xmax - c.xmin)) * (w - L - R);
  const Y = (v: number) => T + (1 - (v - c.ymin) / (c.ymax - c.ymin)) * (h - T - B);
  if (c.quad) {
    sv('rect', { x: X(0), y: T, width: w - R - X(0), height: Y(0) - T, fill: 'rgba(243,146,0,0.07)' }, s);
    txt(s, w - R - 8, T + 16, 'Both sides gain', { 'text-anchor': 'end', fill: ORD });
  }
  c.yt.forEach((t) => {
    sv('line', { x1: L, x2: w - R, y1: Y(t), y2: Y(t), stroke: c.quad && t === 0 ? 'rgba(20,18,16,0.3)' : GRID }, s);
    txt(s, L - 8, Y(t) + 4, c.yf(t), { 'text-anchor': 'end' });
  });
  c.xt.forEach((t) => {
    sv('line', { x1: X(t), x2: X(t), y1: T, y2: h - B, stroke: c.quad && t === 0 ? 'rgba(20,18,16,0.3)' : GRID }, s);
    txt(s, X(t), h - B + 18, c.xf(t), { 'text-anchor': 'middle' });
  });
  txt(s, w - R, h - 6, c.xlab, { 'text-anchor': 'end' });
  txt(s, L, T - 6, c.ylab, {});
  c.pts.forEach((p) => sv('circle', { cx: X(p.x), cy: Y(p.y), r: 2.6, fill: 'rgba(20,18,16,0.22)' }, s));
  if (c.ghost) {
    const g = c.ghost;
    sv('line', { x1: X(g.from.x), y1: Y(g.from.y), x2: X(g.to.x), y2: Y(g.to.y), stroke: INK, 'stroke-dasharray': '3 3' }, s);
    sv('circle', { cx: X(g.to.x), cy: Y(g.to.y), r: 6, fill: '#fff', stroke: INK, 'stroke-width': 1.5 }, s);
    txt(s, X(g.to.x) + 11, Y(g.to.y) + 4, g.label, { fill: INK });
  }
  c.marks.forEach((m) => {
    const col = m.tone === 'orange' ? OR : m.tone === 'ink' ? INK : '#9e978b';
    sv('circle', { cx: X(m.x), cy: Y(m.y), r: m.tone === 'orange' ? 7 : 5.5, fill: col, stroke: '#fff', 'stroke-width': 2 }, s);
    const label = w < 560 ? m.short ?? m.label : m.label;
    const len = label.length * 7.3;
    const right = X(m.x) + 12 + len < w - R || X(m.x) - 12 - len < L;
    const t = txt(s, X(m.x) + (right ? 12 : -12), Y(m.y) + (m.tone === 'orange' ? (Y(m.y) < T + 20 ? 18 : -10) : 4), label, { 'text-anchor': right ? 'start' : 'end', fill: m.tone === 'orange' ? ORD : INK });
    t.setAttribute('paint-order', 'stroke');
    t.setAttribute('stroke', '#fff');
    t.setAttribute('stroke-width', '4');
  });
  return s;
}

/** Effects as bars from zero; a selected row is marked. */
export function effects(rows: Effect[], max: number, sel: number, onPick: ((i: number) => void) | null): HTMLElement {
  const box = el('div', 'rx-ef');
  rows.forEach((r, i) => {
    const b = el(onPick ? 'button' : 'div', 'rx-ef__r' + (i === sel ? ' is-on' : ''));
    if (onPick) {
      (b as HTMLButtonElement).type = 'button';
      b.setAttribute('aria-pressed', String(i === sel));
      b.addEventListener('click', () => onPick(i === sel ? -1 : i));
    }
    const pct = Math.min(50, (Math.abs(r.v) / max) * 50);
    b.append(
      el('span', 'rx-ef__l', r.label),
      el('span', 'rx-ef__t', `<i class="rx-ef__z"></i><i class="rx-ef__b ${r.v < 0 ? 'is-neg' : ''}" style="${r.v < 0 ? `right:50%` : `left:50%`};width:${pct}%"></i>`),
      el('span', 'rx-ef__v', r.fmt),
    );
    box.append(b);
  });
  return box;
}

/* --------------------------------------------------------------------- data */

export const pct = (v: number) => `${Math.round(v)}%`;
const bn = (v: number) => `$${v.toFixed(1)}B`;
export const mn = (v: number) => `$${Math.round(v)}M`;
const sm = (v: number) => (v === 0 ? '0' : `${v > 0 ? '+' : '−'}$${Math.abs(v)}M`);

function cloud(seed: number, n: number, f: (r: () => number) => Pt | null): Pt[] {
  const r = rng(seed);
  const out: Pt[] = [];
  while (out.length < n) {
    const p = f(r);
    if (p) out.push(p);
  }
  return out;
}

type Step5 = {
  name: string; h: string; p: string; title: string; sub: string; cap: string;
  sc: Omit<ScCfg, 'ghost'>; efTitle: string; efSub: string; ef: Effect[]; efMax: number; pick: boolean;
};
export type Run = {
  q: string; goal: string; may: Array<[string, boolean]>; hold: string[]; files: string[]; asked: string;
  p: string[]; // prose for steps 1–4 and 6 (index by step)
  model: 'one' | 'two'; unknown: string; routeCap: string;
  replay: 'counterfactual' | 'idle' | 'two';
  iv: IvCfg & { a: string; b: string; title: string; sub: string; cap: string };
  s5: Step5;
  answer: string; items: string[]; cmp: Array<[string, string, string]>; cmpH: [string, string];
  futures: string; change: string; stamp: string;
};

const DISCOVER_PTS = cloud(3, 309, (r) => {
  const x = r() * 1.6;
  const y = 58 + r() * 40 * (0.35 + 0.65 * Math.min(1, x / 1.2)) * (0.55 + r() * 0.45) + (r() < 0.06 ? 8 : 0);
  return y < 99.4 && !(x < 0.45 && y > 93) ? { x, y } : null;
});
const OPT_PTS = cloud(7, 198, (r) => {
  const x = 1.2 + r() * 1.4;
  const cap = x >= 1.5 ? 100 : 100 - (1.5 - x) * 26;
  const y = cap - r() ** 1.8 * 9;
  return y > 90.5 && y <= 100 && !(Math.abs(x - 1.5) < 0.03 && y > 99.6) ? { x, y: Math.min(y, 99.95) } : null;
});
const COORD_PTS = cloud(13, 45, (r) => {
  const x = -50 + r() * 70, y = -12 + r() * 58;
  const ok = x + y < 18 && !(x > 4 && y > 6);
  return ok ? { x, y } : null;
});

export const RUNS: Record<Kind, Run> = {
  discover: {
    q: 'Can we offer instant redemption to Partner N’s merchants?',
    goal: 'every redemption paid within minutes, at any hour',
    may: [['Reserve mix', true], ['Cash by bank', true], ['Timing', true], ['Partner limits', true], ['Partner terms', true]],
    hold: ['Reserve policy', 'OCC rule', 'Service promises'],
    files: ['partner_n_draft_v3.pdf', 'partner_n_merchants.csv'],
    asked: 'Treasury',
    p: [
      'A question, a goal, what may change and what must hold. Anything outside ‘What may change’ stays fixed.',
      'The world is shared by every machine: banks and their settlement windows, partners, rates, chains. The issuer’s records and policy stay its own. What is not known is kept in view.',
      'The model replays past events and is checked against what happened. Then it replays them again with Partner N included.',
      'Slow and fast adoption, a partner doubling, a bank leaving. Each range is the spread across what the model does not know.',
      '',
      'Written down before the outcome, then scored against it.',
    ],
    model: 'one',
    unknown: 'How Partner N’s merchants will redeem. Estimated from two similar partners until their own activity is in.',
    routeCap: 'Share of instant redemptions by bank, last 90 days',
    replay: 'counterfactual',
    iv: {
      title: 'Promise holds', sub: 'Share of futures in which every redemption is paid within minutes, by condition.',
      a: 'The draft', b: 'Found by the machine', cap: '1,000 futures over two years · dot is the median, line the 90% range',
      min: 60, max: 100, ticks: [60, 70, 80, 90, 100], fmt: pct,
      rows: [
        { label: 'Adoption is slow', note: 'First to strain: nothing, until year two', a: { m: 96, lo: 93, hi: 98 }, b: { m: 100, lo: 99, hi: 100 } },
        { label: 'Adoption is fast', note: 'First to strain: bank B, within five months', a: { m: 73, lo: 66, hi: 79 }, b: { m: 100, lo: 98, hi: 100 } },
        { label: 'Partner N doubles in a year', note: 'First to strain: bank B, within eight months', a: { m: 81, lo: 75, hi: 86 }, b: { m: 100, lo: 98, hi: 100 } },
        { label: 'A bank leaves', note: 'First to strain: the other instant banks, within days', a: { m: 88, lo: 83, hi: 92 }, b: { m: 99, lo: 97, hi: 100 } },
      ],
    },
    s5: {
      name: 'Discover', h: 'Then, a search.',
      p: 'From the draft, the machine tries arrangements no one listed, and keeps the ones that hold in the past and in every future.',
      title: '312 arrangements tried', sub: 'Each dot is one arrangement, scored in the fast-adoption futures.',
      cap: 'Promise holds against extra cash held at banks',
      sc: {
        pts: DISCOVER_PTS,
        marks: [
          { x: 1.2, y: 73, label: 'The draft', tone: 'grey' },
          { x: 0.7, y: 91, label: 'A fifth instant bank · Treasury’s idea', tone: 'ink', short: 'Fifth bank' },
          { x: 0.4, y: 100, label: 'Found by the machine', tone: 'orange' },
        ],
        xmin: 0, xmax: 1.6, ymin: 55, ymax: 102, xt: [0, 0.4, 0.8, 1.2, 1.6], yt: [60, 70, 80, 90, 100],
        xf: (v) => `$${v.toFixed(1)}B`, yf: pct, xlab: 'Extra cash at banks', ylab: 'Promise holds',
      },
      efTitle: 'What each term adds', efSub: 'Remove one term from the found arrangement and run the same futures again. Select a term to see it on the chart.',
      ef: [
        { label: 'Daily instant limit per merchant', v: -16, fmt: '−16 pts', ghost: { x: 0.4, y: 84 } },
        { label: 'Morning redemption from the fund', v: -11, fmt: '−11 pts', ghost: { x: 0.4, y: 89 } },
        { label: 'Notice before very large redemptions', v: -7, fmt: '−7 pts', ghost: { x: 0.4, y: 93 } },
      ],
      efMax: 20, pick: true,
    },
    answer: 'Yes, with three terms.',
    items: ['A daily instant limit per merchant.', 'Notice from Partner N before very large redemptions.', 'A morning redemption from the reserve fund, sized to the day’s expected flow.'],
    cmpH: ['The draft', 'With the terms'],
    cmp: [['Promise holds, fast adoption', '73%', '100%'], ['Extra cash at banks', '$1.2B', '$0.4B']],
    futures: '100%',
    change: 'Partner N moves its volume to weekends, or a bank changes its limits.',
    stamp: 'Recorded Nov 6 · before outcome · Model v15',
  },
  optimize: {
    q: 'How much cash should we keep at each bank next week?',
    goal: 'every redemption paid within minutes, at any hour',
    may: [['Reserve mix', false], ['Cash by bank', true], ['Timing', true], ['Partner limits', false], ['Partner terms', false]],
    hold: ['Reserve policy', 'OCC rule', 'Service promises'],
    files: ['bank_balances_hourly.csv'],
    asked: 'Treasury',
    p: [
      'A weekly question with the same goal. Only cash by bank and timing may change.',
      'The same world, updated this morning: a bank changed its settlement window, and every machine took the change.',
      'The model replays past weeks and is checked against what happened. Then it replays them again under the optimized plan.',
      'Redemptions rising, the largest partner redeeming at once, a bank closing its window early. Each range is the spread across what the model does not know.',
      '',
      'Written down before the week starts, then scored against it.',
    ],
    model: 'one',
    unknown: 'Next week’s redemptions. Taken from the futures, not from a single forecast.',
    routeCap: 'Share of instant redemptions by bank, last 90 days',
    replay: 'idle',
    iv: {
      title: 'Promise holds', sub: 'Share of futures in which every redemption is paid within minutes, by condition.',
      a: 'Current plan', b: 'Optimized plan', cap: '1,000 futures over next week · dot is the median, line the 90% range',
      min: 94, max: 100, ticks: [94, 96, 98, 100], fmt: pct,
      rows: [
        { label: 'Redemptions rise 30%', note: 'First to strain: nothing', a: { m: 100, lo: 99, hi: 100 }, b: { m: 100, lo: 99, hi: 100 } },
        { label: 'The largest partner redeems at once', note: 'First to strain: the instant banks, for an hour', a: { m: 100, lo: 98.6, hi: 100 }, b: { m: 100, lo: 98.2, hi: 100 } },
        { label: 'A bank closes its window early', note: 'First to strain: nothing', a: { m: 100, lo: 99.2, hi: 100 }, b: { m: 99.6, lo: 97.8, hi: 100 } },
        { label: 'Rates move a point', note: 'First to strain: nothing', a: { m: 100, lo: 99.5, hi: 100 }, b: { m: 100, lo: 99.3, hi: 100 } },
      ],
    },
    s5: {
      name: 'Optimize', h: 'Then, the best plan.',
      p: 'The machine tries cash by bank across the same futures and keeps the plan with the least idle cash that still keeps the promise.',
      title: '200 cash plans tried', sub: 'Each dot is one plan for next week, scored across the futures.',
      cap: 'Promise holds against idle cash at banks',
      sc: {
        pts: OPT_PTS,
        marks: [
          { x: 2.1, y: 100, label: 'Current plan', tone: 'grey' },
          { x: 1.5, y: 100, label: 'Optimized', tone: 'orange' },
        ],
        xmin: 1.2, xmax: 2.6, ymin: 90, ymax: 100.8, xt: [1.2, 1.6, 2.0, 2.4], yt: [90, 92, 94, 96, 98, 100],
        xf: (v) => `$${v.toFixed(1)}B`, yf: pct, xlab: 'Idle cash at banks', ylab: 'Promise holds',
      },
      efTitle: 'Where the $0.6B comes from', efSub: 'Change in cash held, by bank, next week. The four instant banks keep today’s balances.',
      ef: [
        { label: 'Bank E', v: -0.25, fmt: '−$0.25B' },
        { label: 'Bank F', v: -0.2, fmt: '−$0.20B' },
        { label: 'Bank G', v: -0.15, fmt: '−$0.15B' },
        { label: 'Instant banks A–D', v: 0, fmt: '$0' },
      ],
      efMax: 0.3, pick: false,
    },
    answer: 'Hold $0.6B less at banks next week.',
    items: ['Draw it from banks E, F and G, which carry the least redemption volume.', 'Keep the instant banks at today’s balances.', 'Move it back if redemptions rise more than 30%.'],
    cmpH: ['Current', 'Optimized'],
    cmp: [['Idle cash at banks', '$2.1B', '$1.5B'], ['Promise holds', '100%', '100%']],
    futures: '100%',
    change: 'Redemptions rise more than 30%, or a bank changes its window again.',
    stamp: 'Recorded Nov 13 · before outcome · Model v15',
  },
  coordinate: {
    q: 'Which terms with Exchange E grow balances that stay?',
    goal: 'more long-held balances, at the same cost',
    may: [['Reserve mix', false], ['Cash by bank', false], ['Timing', false], ['Partner limits', false], ['Partner terms', true]],
    hold: ['Reserve policy', 'OCC rule', 'E’s risk limits'],
    files: ['exchange_e_proposal.pdf'],
    asked: 'Treasury, with Exchange E',
    p: [
      'A question asked of two machines. Only the terms between the issuer and Exchange E may change.',
      'Each side runs its own machine on the shared world. Neither model is shared; only terms and scores pass between them.',
      'Each machine replays its own past and is checked against what happened. E reports its score, not its data.',
      'The same futures, run in both machines. Each scores only its own side.',
      '',
      'Written down before the outcome, with both models’ versions, then scored against it.',
    ],
    model: 'two',
    unknown: 'How E’s users respond to new terms. Estimated by E’s machine, not ours.',
    routeCap: '',
    replay: 'two',
    iv: {
      title: 'Long-held balances in two years', sub: 'Balances on Exchange E held longer than a month, by condition.',
      a: 'Current terms', b: 'Found by both machines', cap: '1,000 futures over two years · dot is the median, line the 90% range',
      min: 7.5, max: 12.5, ticks: [8, 9, 10, 11, 12], fmt: bn,
      rows: [
        { label: 'As today', note: 'Rates, prices and listings move as they have', a: { m: 9.0, lo: 8.6, hi: 9.4 }, b: { m: 11.4, lo: 10.9, hi: 11.9 } },
        { label: 'Rates fall a point', note: 'Reserve income falls for both sides', a: { m: 9.0, lo: 8.4, hi: 9.6 }, b: { m: 11.4, lo: 10.6, hi: 12.1 } },
        { label: 'A rival exchange lists the dollar', note: 'Some balances move', a: { m: 8.6, lo: 7.9, hi: 9.3 }, b: { m: 10.8, lo: 9.9, hi: 11.6 } },
        { label: 'Prices swing', note: 'Holders move in and out fast', a: { m: 8.8, lo: 8.0, hi: 9.5 }, b: { m: 11.1, lo: 10.2, hi: 11.9 } },
      ],
    },
    s5: {
      name: 'Coordinate', h: 'Then, terms both sides accept.',
      p: 'Term sets are tried in both machines. Each scores its own side, and only terms that leave both better off are kept.',
      title: '48 term sets tried in both machines', sub: 'Each dot is one set of terms: our income against E’s revenue, per year.',
      cap: 'Change per year against current terms',
      sc: {
        pts: COORD_PTS,
        marks: [
          { x: 0, y: 0, label: 'Current terms', tone: 'grey' },
          { x: -38, y: 38, label: 'E’s proposal', tone: 'ink' },
          { x: 9, y: 12, label: 'Found by both machines', tone: 'orange', short: 'Found by both' },
        ],
        xmin: -50, xmax: 25, ymin: -15, ymax: 48, xt: [-40, -20, 0, 20], yt: [-10, 0, 10, 20, 30, 40],
        xf: sm, yf: sm, xlab: 'Our income', ylab: 'E’s revenue', quad: true,
      },
      efTitle: 'What each term adds', efSub: 'Long-held balances in two years, against current terms.',
      ef: [
        { label: 'E’s share rises the longer balances stay', v: 1.6, fmt: '+$1.6B' },
        { label: 'Lower share on balances that leave within a month', v: 0.5, fmt: '+$0.5B' },
        { label: 'Shares reset if reserve yields move sharply', v: 0.3, fmt: '+$0.3B' },
      ],
      efMax: 2, pick: false,
    },
    answer: 'Terms both machines accept.',
    items: ['E’s share rises the longer balances stay.', 'It falls on balances that leave within a month.', 'The shares reset if reserve yields move sharply.'],
    cmpH: ['Today', 'Found'],
    cmp: [['Long-held balances', '$9.0B', '$11.4B'], ['Our income, per year', '—', '+$9M'], ['E’s revenue, per year', '—', '+$12M']],
    futures: 'Both gain',
    change: 'Reserve yields fall below 2%, or a rival exchange matches the terms.',
    stamp: 'Recorded Nov 12 · before outcome · Model v15 · E’s model v7',
  },
};

/** Draw a chart now and again whenever its box changes width. */
export function live(host: HTMLElement, draw: (w: number) => Element): void {
  let last = -1;
  const go = (): void => {
    const w = Math.floor(host.clientWidth);
    if (w <= 0 || w === last) return;
    last = w;
    host.replaceChildren(draw(w));
  };
  go();
  new ResizeObserver(go).observe(host);
}

/** Reserve → instant banks → partners, widths by share of instant redemptions. */
export function route(w: number, withN: boolean, h = 250): SVGSVGElement {
  const s = svgOf(w, h);
  const narrow = w < 560;
  const banks: Array<[string, number]> = [['Bank B', 58], ['Bank A', 19], ['Bank C', 14], ['Bank D', 9]];
  const x0 = narrow ? 64 : 140, x1 = w * 0.47, x2 = w - (narrow ? 64 : 140);
  const T = 14, H = h - 2 * T, gap = 10;
  const tot = H - gap * (banks.length - 1);
  const nodeH = H * 0.46, n0 = (h - nodeH) / 2;
  const band = (xa: number, ya: number, ha: number, xb: number, yb: number, hb: number) => {
    const m = (xa + xb) / 2;
    return `M${xa} ${ya}C${m} ${ya} ${m} ${yb} ${xb} ${yb}L${xb} ${yb + hb}C${m} ${yb + hb} ${m} ${ya + ha} ${xa} ${ya + ha}Z`;
  };
  let y = T, ys = n0;
  banks.forEach(([name, sh], k) => {
    const bh = (sh / 100) * tot, eh = (sh / 100) * nodeH;
    const fill = k === 0 ? 'rgba(20,18,16,0.14)' : 'rgba(20,18,16,0.06)';
    sv('path', { d: band(x0, ys, eh, x1 - 5, y, bh), fill }, s);
    sv('path', { d: band(x1 + 5, y, bh, x2, ys, eh), fill }, s);
    sv('rect', { x: x1 - 5, y, width: 10, height: bh, fill: k === 0 ? INK : '#8f897f' }, s);
    txt(s, x1 + 14, y + Math.min(bh / 2, 18) + 4, `${name} · ${sh}%`, { fill: INK });
    y += bh + gap;
    ys += eh;
  });
  sv('rect', { x: x0 - 4, y: n0, width: 4, height: nodeH, fill: INK }, s);
  sv('rect', { x: x2, y: n0, width: 4, height: nodeH, fill: INK }, s);
  txt(s, x0 - 12, h / 2 - 3, narrow ? 'Reserve' : 'Reserve fund', { 'text-anchor': 'end', fill: INK, 'font-family': 'var(--sans)', 'font-size': 13 });
  if (!narrow) txt(s, x0 - 12, h / 2 + 14, 'and bank cash', { 'text-anchor': 'end', 'font-family': 'var(--sans)', 'font-size': 12 });
  txt(s, x2 + 12, h / 2 - 3, narrow ? 'Partners' : '140 partners', { fill: INK, 'font-family': 'var(--sans)', 'font-size': 13 });
  if (!narrow) txt(s, x2 + 12, h / 2 + 14, 'and their merchants', { 'font-family': 'var(--sans)', 'font-size': 12 });
  if (withN) {
    const yB = T + 0.58 * tot * 0.62;
    const yN = n0 + nodeH + 26;
    sv('path', { d: `M${x2 + 2} ${yN}C${(x1 + x2) / 2} ${yN} ${(x1 + x2) / 2} ${yB} ${x1 + 5} ${yB}`, fill: 'none', stroke: OR, 'stroke-width': 2, 'stroke-dasharray': '5 4' }, s);
    sv('circle', { cx: x2 + 2, cy: yN, r: 4, fill: OR }, s);
    txt(s, x2 + 12, yN + 4, narrow ? 'N, draft' : 'Partner N, draft', { fill: ORD, 'font-family': 'var(--sans)', 'font-size': 13 });
  }
  return s;
}


export const legend = (items: Array<[string, string]>): HTMLElement =>
  el('p', 'rx-lg', items.map(([c, l]) => `<span><i class="rx-lg__${c}"></i>${l}</span>`).join(''));
