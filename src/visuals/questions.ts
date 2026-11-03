/**
 * The three questions, each answered on a plate drawn in the hero's own
 * language: a surveyed plan of parcels, seen from above, with one amber story
 * told on it and at most two labels.
 *
 *   1. Conditions change — a delay at one parcel travels along its
 *      dependencies until the first constraint binds.
 *   2. Act differently — the same plan twice: commit now, or commit later,
 *      with the cost shifted.
 *   3. A better arrangement — the original route runs through a blocked
 *      parcel; a new one is found around it, committed in three stages.
 *
 * Labels are HTML, laid over the drawing, so they keep a readable size at
 * every width. The drawings are illustrations of the kind of result a model
 * gives, not results. On wide screens the questions are tabs beside one
 * plate; on a phone all three stand, and each plays when it comes into view.
 */

import { divide, rng } from './world';

type P = { x: number; y: number; w: number; h: number; kind: number; tone: number };
type Tag = { x: number; y: number; text: string; at: 'tl' | 'tr' | 'bl' | 'br'; tone?: 'am' | 'ink' };

const VW = 420;
const VH = 300;

const c = (p: P): [number, number] => [p.x + p.w / 2, p.y + p.h / 2];

/** The parcel under a point, or failing that the nearest whole parcel. */
function at(ps: P[], x: number, y: number): P {
  const whole = ps.filter((p) => p.kind !== 5 && p.w > 18 && p.h > 18);
  const hit = whole.find((p) => x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h);
  if (hit) return hit;
  return whole.reduce((best, p) => {
    const [bx, by] = c(best);
    const [px, py] = c(p);
    return (px - x) ** 2 + (py - y) ** 2 < (bx - x) ** 2 + (by - y) ** 2 ? p : best;
  });
}

function plan(seed: number, w = VW - 16, h = VH - 16, x = 8, y = 8, block = 104): P[] {
  return divide({ x, y, w, h }, block, rng(seed)) as P[];
}

const rect = (p: P, cls: string, extra = ''): string =>
  `<rect class="${cls}" x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}" width="${p.w.toFixed(1)}" height="${p.h.toFixed(1)}"${extra}/>`;

function base(ps: P[]): string {
  return ps
    .map((p) => rect(p, p.kind === 2 ? 'pl-p pl-p--hatch' : p.kind === 1 || p.kind === 3 ? 'pl-p pl-p--shade' : p.kind === 5 ? 'pl-p pl-p--strip' : 'pl-p'))
    .join('');
}

/** An orthogonal route between two parcels' centres. */
function route(a: P, b: P, bend: 'hv' | 'vh'): string {
  const [ax, ay] = c(a);
  const [bx, by] = c(b);
  return bend === 'hv' ? `M${ax} ${ay}H${bx}V${by}` : `M${ax} ${ay}V${by}H${bx}`;
}

const pct = (v: number, of: number): string => `${((v / of) * 100).toFixed(2)}%`;

function tags(list: Tag[]): string {
  return list
    .map((t) => `<span class="pl-tag pl-tag--${t.at}${t.tone === 'ink' ? ' pl-tag--ink' : ''}" style="left:${pct(t.x, VW)};top:${pct(t.y, VH)}">${t.text}</span>`)
    .join('');
}

const svg = (body: string, label: string): string => `<svg class="pl" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="${label}">${body}</svg>`;

function conditions(): string {
  const ps = plan(11);
  const s = at(ps, 64, 236);
  const c1 = at(ps, 168, 214);
  const c2 = at(ps, 252, 132);
  const c3 = at(ps, 344, 70);
  const [sx, sy] = c(s);
  return (
    svg(
      base(ps) +
        rect(c1, 'pl-hit', ' style="--i:1"') +
        rect(c2, 'pl-hit', ' style="--i:2"') +
        rect(c3, 'pl-bind', ' style="--i:3"') +
        `<path class="pl-route" style="--i:0" d="${route(s, c1, 'hv')}"/>` +
        `<path class="pl-route" style="--i:1" d="${route(c1, c2, 'vh')}"/>` +
        `<path class="pl-route" style="--i:2" d="${route(c2, c3, 'hv')}"/>` +
        rect(s, 'pl-src') +
        `<rect class="pl-node" x="${sx - 3}" y="${sy - 3}" width="6" height="6"/>`,
      'A delay at one parcel travels along its dependencies until capacity, the first constraint, binds.',
    ) +
    tags([
      { x: s.x, y: s.y - 6, text: 'Delay', at: 'bl' },
      { x: c3.x - 8, y: c3.y + 2, text: 'First constraint to bind', at: 'tr' },
    ])
  );
}

function alternatives(): string {
  const half = (VW - 30) / 2;
  const ph = VH - 46;
  const ps = plan(5, half, ph, 0, 0, 92);
  const near = (x: number, y: number, r: number): P[] =>
    ps.filter((p) => p.kind !== 5 && p.w > 14 && p.h > 14 && Math.hypot(c(p)[0] - x, c(p)[1] - y) < r);
  const now = near(half * 0.55, ph * 0.58, 44);
  const later = near(half * 0.3, ph * 0.3, 30);
  const draw = (dx: number, body: string): string => `<g transform="translate(${dx} 38)">${base(ps)}${body}</g>`;
  const a = draw(8, now.map((p) => rect(p, 'pl-src pl-now')).join(''));
  const b = draw(22 + half, now.map((p) => rect(p, 'pl-ghost')).join('') + later.map((p) => rect(p, 'pl-src pl-late')).join(''));
  const g = now.reduce((m, p) => ({ x: Math.min(m.x, p.x), y: Math.max(m.y, p.y + p.h) }), { x: Infinity, y: 0 });
  return (
    svg(`${a}${b}<path class="pl-split" d="M${VW / 2} 0V${VH}"/>`, 'The same plan twice: commit now, or commit later with the cost shifted to a later window.') +
    tags([
      { x: 8, y: 10, text: 'A · Commit now', at: 'tl', tone: 'ink' },
      { x: 22 + half, y: 10, text: 'B · Commit later', at: 'tl', tone: 'ink' },
      { x: 22 + half + g.x, y: 38 + g.y + 6, text: 'Cost shifts here', at: 'tl' },
    ])
  );
}

function arrangement(): string {
  const ps = plan(7);
  const s = at(ps, 60, 240);
  const x = at(ps, 200, 150);
  const t = at(ps, 352, 64);
  const a1 = at(ps, 300, 250);
  const [sx, sy] = c(s);
  const [xx, xy] = c(x);
  const [tx, ty] = c(t);
  const [ax] = c(a1);
  const k = 7;
  const stages = [
    [ax, sy, 1],
    [ax, ty, 2],
    [tx, ty, 3],
  ] as const;
  return (
    svg(
      base(ps) +
        rect(x, 'pl-block') +
        `<path class="pl-x" d="M${xx - k} ${xy - k}l${2 * k} ${2 * k}M${xx + k} ${xy - k}l${-2 * k} ${2 * k}"/>` +
        `<path class="pl-old" d="M${sx} ${sy}V${xy}H${tx}V${ty}"/>` +
        rect(t, 'pl-target') +
        `<path class="pl-route" style="--i:0" d="M${sx} ${sy}H${ax}"/>` +
        `<path class="pl-route" style="--i:1" d="M${ax} ${sy}V${ty}"/>` +
        `<path class="pl-route" style="--i:2" d="M${ax} ${ty}H${tx}"/>` +
        rect(s, 'pl-src') +
        stages
          .map(([px, py, n], i) => `<g class="pl-stage" style="--i:${i}"><rect x="${px - 8}" y="${py - 8}" width="16" height="16"/><text x="${px}" y="${py + 4}">${n}</text></g>`)
          .join(''),
      'The original route runs through a blocked parcel. A new arrangement goes around it, committed in three stages.',
    ) +
    tags([
      { x: xx + 12, y: xy - 12, text: 'Original', at: 'bl', tone: 'ink' },
      { x: ax - 12, y: sy + 14, text: 'New terms required', at: 'tr' },
    ])
  );
}

function trust(): string {
  // Before the decision, the record; after it, what was expected, what was
  // observed, and the revision that was tested.
  const W = 1000;
  const H = 260;
  const d = 330;
  const e = W - 150;
  const exp = `M${d} 140C${d + 180} 128 ${d + 380} 104 ${e} 70`;
  const obs = `M${d} 140C${d + 160} 152 ${d + 360} 190 ${e} 206`;
  const rev = `M${d} 140C${d + 180} 146 ${d + 380} 168 ${e} 186`;
  const gap = `M${d} 140C${d + 180} 128 ${d + 380} 104 ${e} 70V206C${d + 360} 190 ${d + 160} 152 ${d} 140Z`;
  const ticks = Array.from({ length: 21 }, (_, i) => `M${40 + i * 46} 236v6`).join('');
  const lab = (x: number, y: number, t: string, cls = ''): string =>
    `<span class="pl-tag pl-tag--plain ${cls}" style="left:${((x / W) * 100).toFixed(2)}%;top:${((y / H) * 100).toFixed(2)}%">${t}</span>`;
  return (
    `<svg class="pl" viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <path class="pl-axis" d="M40 236H${W - 40}"/><path class="pl-ticks" d="${ticks}"/>
      <path class="pl-record" d="M40 140H${d}"/>
      <path class="pl-decide" d="M${d} 24V236"/>
      <path class="pl-gap" d="${gap}"/>
      <path class="pl-exp" d="${exp}"/>
      <path class="pl-obs" d="${obs}"/>
      <path class="pl-rev" d="${rev}"/>
      <rect class="pl-node" x="${d - 4}" y="136" width="8" height="8"/>
    </svg>` +
    lab(40, 118, 'Record') +
    lab(d + 12, 24, 'Decision') +
    lab(e + 12, 70, 'Expected', 'pl-tag--end') +
    lab(e + 12, 186, 'Revised, tested', 'pl-tag--am pl-tag--end') +
    lab(e + 12, 206, 'Observed', 'pl-tag--end')
  );
}

export function initQuestions(root: ParentNode = document): void {
  const make: Record<string, () => string> = { '1': conditions, '2': alternatives, '3': arrangement };
  for (const host of root.querySelectorAll<HTMLElement>('[data-field]')) host.innerHTML = make[host.dataset['field'] ?? '']?.() ?? '';
  const t = root.querySelector<HTMLElement>('[data-trust]');
  if (t) t.innerHTML = trust();

  const box = root.querySelector<HTMLElement>('[data-questions]');
  if (!box) return;
  const tabs = Array.from(box.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panels = Array.from(box.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
  const wide = window.matchMedia('(min-width: 900px)');
  let current = 0;

  /** Play a plate's story from the start. */
  const play = (panel: HTMLElement): void => {
    panel.classList.remove('is-run');
    void panel.offsetWidth;
    panel.classList.add('is-run');
  };

  const show = (i: number, focus = false): void => {
    current = i;
    tabs.forEach((tab, k) => {
      tab.setAttribute('aria-selected', String(k === i));
      tab.tabIndex = k === i ? 0 : -1;
    });
    panels.forEach((p, k) => {
      p.hidden = wide.matches && k !== i;
    });
    if (wide.matches) play(panels[i]!);
    if (focus) tabs[i]?.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => show(i));
    tab.addEventListener('keydown', (e) => {
      const n = tabs.length;
      const go =
        e.key === 'ArrowDown' || e.key === 'ArrowRight'
          ? (i + 1) % n
          : e.key === 'ArrowUp' || e.key === 'ArrowLeft'
            ? (i - 1 + n) % n
            : e.key === 'Home'
              ? 0
              : e.key === 'End'
                ? n - 1
                : -1;
      if (go < 0) return;
      e.preventDefault();
      show(go, true);
    });
  });
  box.classList.add('is-tabs');
  wide.addEventListener('change', () => show(current));

  // Each plate plays when it is first seen; on a phone, each in turn.
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const panel = e.target as HTMLElement;
        if (!panel.hidden) play(panel);
        io.unobserve(panel);
      }
    },
    { threshold: 0.35 },
  );
  panels.forEach((p) => io.observe(p));
  show(0);
}
