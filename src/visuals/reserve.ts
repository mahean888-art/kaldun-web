/**
 * Fig. 02 — A reserve decision, as the engine runs it.
 *
 * A deliberately small simulation for a synthetic dollar issuer. On day 1
 * access to some of its money is interrupted; day by day for fourteen days it
 * compares the cash it can reach with the redemptions it owes. Doubts about
 * access make redemptions come faster; policy support, if it comes, restores
 * the frozen deposits on its day. Everything is a share of reserves: no figure
 * here is a claim about any real issuer. The historical record sits apart,
 * above the screen.
 *
 * Three stresses: one partner bank fails; funding stress spreads across
 * banks; or the settlement route the banks share fails, so every account
 * that settles through it freezes at once and Treasury proceeds arrive a day
 * late. The last is the point of the figure: four accounts can still be one
 * route.
 */

import { prefersReducedMotion } from '../lib/prefers';

export type Scenario = {
  arr: 'one' | 'spread' | 'bills';
  shock: 'partner' | 'common' | 'route';
  pace: 'slow' | 'steady' | 'fast';
  support: '3' | '10' | 'none';
};

export type Run = {
  /** Cash reachable by the end of each day, % of reserves, days 0–14. */
  reach: number[];
  /** Redemptions due by the end of each day, cumulative, % of reserves. */
  due: number[];
  /** The first day redemptions due exceed cash reachable, or null. */
  fails: number | null;
  /** The support day, or null. */
  supportDay: number | null;
  cost: string;
  basis: string;
};

const DAYS = 14;

/** How the reserves are held, and what holding them that way is assumed to cost. */
const ARRANGEMENT = {
  one: { banks: [100], bills: 0, cost: 'Lowest', basis: 'One bank’s fees' },
  spread: { banks: [25, 25, 25, 25], bills: 0, cost: 'Low', basis: 'Fees at four banks' },
  bills: { banks: [5, 5, 5, 5], bills: 80, cost: 'Moderate', basis: 'Four banks, plus a repo line fee' },
} as const;

/** What the repo line raises on day 1 when the settlement route is down. */
const REPO_DAY1 = 15;

/** Share of outstanding supply redeemed per day, before any loss of confidence. */
const PACE = { slow: 0.03, steady: 0.06, fast: 0.1 } as const;

/** How many of the arrangement's banks lose access under each stress. */
function banksHit(arr: Scenario['arr'], shock: Scenario['shock']): number {
  const n = ARRANGEMENT[arr].banks.length;
  if (shock === 'partner') return 1;
  if (shock === 'common') return Math.max(1, n - 1);
  return n; // every account settles through the same route
}

/** Treasury bills: how much reaches cash per day, and from which day. */
function billFlow(shock: Scenario['shock']): { perDay: number; from: number } {
  if (shock === 'common') return { perDay: 20, from: 1 }; // a thinner market
  if (shock === 'route') return { perDay: 40, from: 2 }; // proceeds a day late
  return { perDay: 40, from: 1 };
}

export function simulate(sc: Scenario): Run {
  const a = ARRANGEMENT[sc.arr];
  const hit = banksHit(sc.arr, sc.shock);
  const frozenAtStart = a.banks.slice(0, hit).reduce((t, v) => t + v, 0);
  const deposits = a.banks.reduce((t, v) => t + v, 0);
  const flow = billFlow(sc.shock);
  const supportDay = sc.support === 'none' ? null : Number(sc.support);

  const reach = [100];
  const due = [0];
  let outstanding = 100;
  let paid = 0;
  let fails: number | null = null;

  for (let d = 1; d <= DAYS; d++) {
    const restored = supportDay !== null && d >= supportDay;
    const frozen = restored ? 0 : frozenAtStart;
    // Doubts about reserve access accelerate redemptions.
    const rate = PACE[sc.pace] * (1 + 3 * (frozen / 100));
    const demand = outstanding * rate;
    outstanding -= demand;
    paid += demand;
    // On the shared route, sale proceeds arrive a day late, but the repo line
    // is with a dealer elsewhere and still pays on day 1. Support restores
    // the route, so proceeds flow normally from then.
    const billCash =
      sc.shock === 'route' && !restored
        ? Math.min(a.bills, REPO_DAY1 + flow.perDay * Math.max(0, d - 1))
        : Math.min(a.bills, flow.perDay * Math.max(0, d - (restored ? Math.min(flow.from, d) : flow.from) + 1));
    const r = deposits - frozen + (a.bills ? billCash : 0);
    reach.push(r);
    due.push(paid);
    if (fails === null && paid > r + 1e-9) fails = d;
  }

  return { reach, due, fails, supportDay, cost: a.cost, basis: a.basis };
}

// --- drawing -------------------------------------------------------------------

/** The drawing's size: wide beside the controls, or narrow and taller-set on
    a phone, so its type stays readable at the size it is shown. */
let W = 760;
let H = 360;
let P = { l: 56, r: 24, t: 24, b: 44 };
let DAY_TICKS = [0, 2, 4, 6, 8, 10, 12, 14];
let KEY2 = 176;
let KEY3 = 360;
const setSize = (size: 'wide' | 'narrow' | 'tiny'): void => {
  if (size === 'tiny') {
    W = 330;
    H = 290;
    P = { l: 42, r: 12, t: 30, b: 50 };
    DAY_TICKS = [0, 7, 14];
    KEY2 = 148;
    KEY3 = -1;
  } else if (size === 'narrow') {
    W = 420;
    H = 300;
    P = { l: 46, r: 14, t: 28, b: 48 };
    DAY_TICKS = [0, 7, 14];
    KEY2 = 150;
    KEY3 = -1;
  } else {
    W = 760;
    H = 360;
    P = { l: 56, r: 24, t: 24, b: 44 };
    DAY_TICKS = [0, 2, 4, 6, 8, 10, 12, 14];
    KEY2 = 176;
    KEY3 = 360;
  }
};
const X = (d: number): number => P.l + (d / DAYS) * (W - P.l - P.r);
const Y = (v: number): number => P.t + (1 - v / 100) * (H - P.t - P.b);

const NS = 'http://www.w3.org/2000/svg';

/** A step line: the value holds through each day, then moves. */
function stepPath(vs: number[]): string {
  let d = `M ${X(0).toFixed(1)} ${Y(vs[0]!).toFixed(1)}`;
  for (let i = 1; i < vs.length; i++) d += ` H ${X(i).toFixed(1)} V ${Y(vs[i]!).toFixed(1)}`;
  return d;
}

/** A smooth line through the day ends. */
function linePath(vs: number[]): string {
  return vs.map((v, i) => `${i === 0 ? 'M' : 'L'} ${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
}

/**
 * The shortfall: wherever redemptions due run above the cash reachable. Cash
 * holds through each day (a step); redemptions accrue along the day (a line).
 */
function shortfall(reach: number[], due: number[]): string {
  const STEP = 0.02;
  const at = (x: number): [number, number] => {
    const i = Math.min(DAYS - 1, Math.floor(x));
    const f = x - i;
    return [reach[x >= DAYS ? DAYS : i]!, due[i]! + (due[i + 1]! - due[i]!) * f];
  };
  const shapes: string[] = [];
  let top: string[] = [];
  let base: string[] = [];
  const close = (): void => {
    if (top.length > 1) shapes.push(`M ${top.join(' L ')} L ${base.reverse().join(' L ')} Z`);
    top = [];
    base = [];
  };
  for (let x = 0; x <= DAYS + 1e-9; x += STEP) {
    const [r, d] = at(x);
    if (d > r) {
      top.push(`${X(x).toFixed(1)} ${Y(d).toFixed(1)}`);
      base.push(`${X(x).toFixed(1)} ${Y(r).toFixed(1)}`);
    } else close();
  }
  close();
  return shapes.join(' ');
}

function frame(): string {
  const days = Array.from({ length: DAYS + 1 }, (_, d) => d);
  const grid =
    days.map((d) => `M${Math.round(X(d)) + 0.5} ${P.t}V${H - P.b}`).join('') +
    [0, 25, 50, 75, 100].map((v) => `M${P.l} ${Math.round(Y(v)) + 0.5}H${W - P.r}`).join('');
  const dayLabels = DAY_TICKS
    .map((d) => `<text class="rs__tick" x="${X(d)}" y="${H - P.b + 22}" text-anchor="middle">${d}</text>`)
    .join('');
  const valLabels = [0, 50, 100]
    .map((v) => `<text class="rs__tick" x="${P.l - 12}" y="${Y(v) + 4}" text-anchor="end">${v}%</text>`)
    .join('');
  const ghostKey =
    KEY3 > 0
      ? `<g class="rs__ghost-key" data-rs-ghost-key><path class="rs__ghost-reach" d="M ${P.l + KEY3} ${H - 8} h 22" /><text x="${P.l + KEY3 + 30}" y="${H - 4}">Recorded expectation</text></g>`
      : '';
  return `
    <path class="rs__grid" d="${grid}" />
    <path class="rs__axis" d="M${P.l + 0.5} ${P.t}V${H - P.b + 0.5}H${W - P.r}" />
    ${dayLabels}${valLabels}
    <text class="rs__unit rs__unit--day" x="${W - P.r}" y="${H - 6}" text-anchor="end">Day</text>
    <text class="rs__unit" x="${P.l}" y="${P.t - 10}">Share of reserves</text>
    <g class="rs__shock"><path d="M${Math.round(X(1)) + 0.5} ${P.t}V${H - P.b}" /><text x="${X(1) + 8}" y="${P.t + 14}">Access interrupted</text></g>
    <g class="rs__support" data-rs-support><path d="" /><text x="0" y="${P.t + 14}">Support</text></g>
    <g class="rs__ghost" data-rs-ghost><path class="rs__ghost-due" d="" /><path class="rs__ghost-reach" d="" /><text x="${W - P.r}" y="0" text-anchor="end">Recorded, day 0</text></g>
    <path class="rs__gap" data-rs-gap d="" />
    <path class="rs__due" data-rs-due d="" />
    <path class="rs__reach" data-rs-reach d="" />
    <g class="rs__fail" data-rs-fail><rect x="-7" y="-7" width="14" height="14" transform="rotate(45)" /><text x="0" y="-18" text-anchor="middle"></text></g>
    <g class="rs__key">
      <path class="rs__reach" d="M ${P.l + 16} ${H - 8} h 22" /><text x="${P.l + 46}" y="${H - 4}">Cash reachable</text>
      <path class="rs__due" d="M ${P.l + KEY2} ${H - 8} h 22" /><text x="${P.l + KEY2 + 30}" y="${H - 4}">Redemptions due</text>
      ${ghostKey}
    </g>`;
}

/** The reserves of an arrangement as segments, with those cut off on day 1. */
type Part = { name: string; share: number; frozen: boolean; bills: boolean; delayed: boolean };
function composition(sc: Scenario): Part[] {
  const a = ARRANGEMENT[sc.arr];
  const hit = banksHit(sc.arr, sc.shock);
  const names = a.banks.length === 1 ? ['Bank A'] : ['Bank A', 'Bank B', 'Bank C', 'Bank D'];
  const parts: Part[] = a.banks.map((share, i) => ({ name: names[i]!, share, frozen: i < hit, bills: false, delayed: false }));
  if (a.bills) parts.push({ name: 'Treasury bills', share: a.bills, frozen: false, bills: true, delayed: sc.shock === 'route' });
  return parts;
}

/** What each assumption currently holds, in words, and in brief for "was". */
function assumptions(sc: Scenario): Record<string, { detail: string; brief: string }> {
  const hasBills = sc.arr === 'bills';
  const flow = billFlow(sc.shock);
  return {
    obligation: { detail: 'Every token redeemable for a dollar, on any day', brief: '' },
    shock: {
      detail:
        sc.shock === 'partner'
          ? 'Lost at one partner bank from day 1'
          : sc.shock === 'common'
            ? 'Lost at all but one bank from day 1'
            : 'Lost at every bank settling through the failed route',
      brief: sc.shock === 'partner' ? 'one partner bank' : sc.shock === 'common' ? 'stress across banks' : 'shared route',
    },
    liquidity: {
      detail: !hasBills
        ? 'No bills held; deposits only'
        : sc.shock === 'route'
          ? 'Repo line covers 15% on day 1; sale proceeds arrive a day late'
          : `Bills reach cash at ${flow.perDay}% of reserves a day`,
      brief: !hasBills ? 'no bills' : sc.shock === 'route' ? 'repo only on day 1' : `${flow.perDay}% a day`,
    },
    pace: {
      detail: `${Math.round(PACE[sc.pace] * 100)}% of supply a day, faster as doubts about access grow`,
      brief: sc.pace,
    },
    support: {
      detail: sc.support === 'none' ? 'None assumed' : `Frozen deposits restored on day ${sc.support}`,
      brief: sc.support === 'none' ? 'none' : `day ${sc.support}`,
    },
  };
}

const OUTCOME = (r: Run): string => (r.fails === null ? `Holds ${DAYS} days` : `Fails day ${r.fails}`);
const same = (a: Scenario, b: Scenario): boolean =>
  a.arr === b.arr && a.shock === b.shock && a.pace === b.pace && a.support === b.support;

export function initReserve(host: HTMLElement): void {
  const form = host.querySelector<HTMLFormElement>('[data-reserve-controls]');
  const chart = host.querySelector<HTMLElement>('[data-reserve-chart]');
  if (!form || !chart) return;
  const rows = Array.from(host.querySelectorAll<HTMLLabelElement>('.engine__row'));
  const mix = host.querySelector<HTMLElement>('[data-engine-mix]');
  const assume = host.querySelector<HTMLElement>('[data-engine-assume]');
  const statusText = host.querySelector<HTMLElement>('[data-engine-status-text]');
  const status = host.querySelector<HTMLElement>('[data-engine-status]');
  const commit = host.querySelector<HTMLButtonElement>('[data-engine-commit]');

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Cash reachable and redemptions due over fourteen days');
  chart.append(svg);

  let reachPath!: SVGPathElement;
  let duePath!: SVGPathElement;
  let gapPath!: SVGPathElement;
  let fail!: SVGGElement;
  let support!: SVGGElement;
  let ghost!: SVGGElement;
  // The drawing follows the width it is given, not the window: narrow and
  // taller-set where its pane is narrow, so its type stays readable.
  let narrow = false;
  let size: 'wide' | 'narrow' | 'tiny' = 'wide';
  const sizeFor = (w: number): 'wide' | 'narrow' | 'tiny' => (w < 400 ? 'tiny' : w < 560 ? 'narrow' : 'wide');

  const reduced = prefersReducedMotion();
  let shown: Run | null = null;
  let raf = 0;
  let last: Scenario | null = null;
  /** The expectation committed before the outcome: what was run, and its result. */
  let recorded: { sc: Scenario; run: Run } | null = null;

  const paintGhost = (): void => {
    if (!ghost) return;
    const key = svg.querySelector<SVGGElement>('[data-rs-ghost-key]');
    if (!recorded) {
      ghost.style.display = 'none';
      if (key) key.style.display = 'none';
      return;
    }
    ghost.style.display = '';
    if (key) key.style.display = '';
    const r = recorded.run;
    ghost.querySelector('.rs__ghost-reach')!.setAttribute('d', stepPath(r.reach));
    ghost.querySelector('.rs__ghost-due')!.setAttribute('d', linePath(r.due));
    // The label sits on the recorded cash line, just after the interruption:
    // above it, or below it where the line runs near the top labels.
    const label = ghost.querySelector('text')!;
    const lv = r.reach[2]!;
    label.setAttribute('text-anchor', 'start');
    label.setAttribute('x', String(X(2) + 6));
    label.setAttribute('y', String(lv > 85 ? Y(lv) + 16 : Y(lv) - 7));
  };

  const draw = (): void => {
    setSize(size);
    narrow = size !== 'wide';
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.classList.toggle('is-narrow', narrow);
    svg.classList.toggle('is-small', size === 'tiny');
    svg.classList.toggle('is-mid', size === 'wide' && chart.clientWidth < 720);
    svg.innerHTML = frame();
    reachPath = svg.querySelector<SVGPathElement>('[data-rs-reach]')!;
    duePath = svg.querySelector<SVGPathElement>('[data-rs-due]')!;
    gapPath = svg.querySelector<SVGPathElement>('[data-rs-gap]')!;
    fail = svg.querySelector<SVGGElement>('[data-rs-fail]')!;
    support = svg.querySelector<SVGGElement>('[data-rs-support]')!;
    ghost = svg.querySelector<SVGGElement>('[data-rs-ghost]')!;
    paintGhost();
  };

  const read = (): Scenario => {
    const data = new FormData(form);
    return {
      arr: data.get('arr') as Scenario['arr'],
      shock: data.get('shock') as Scenario['shock'],
      pace: data.get('pace') as Scenario['pace'],
      support: data.get('support') as Scenario['support'],
    };
  };

  const paint = (reach: number[], due: number[], run: Run): void => {
    reachPath.setAttribute('d', stepPath(reach));
    duePath.setAttribute('d', linePath(due));
    gapPath.setAttribute('d', run.fails === null ? '' : shortfall(reach, due));

    if (run.fails === null) {
      fail.style.display = 'none';
    } else {
      fail.style.display = '';
      const fx = X(run.fails);
      const fy = Y(due[run.fails]!);
      fail.setAttribute('transform', `translate(${fx.toFixed(1)} ${fy.toFixed(1)})`);
      const label = fail.querySelector('text')!;
      label.textContent = `Fails, day ${run.fails}`;
      // Early failures sit low on the chart; their label goes to the right of
      // the mark, clear of the axis. On the narrow drawing the label always
      // sits beside the mark, clear of the support line.
      const early = run.fails <= 4;
      if (narrow || early) {
        label.setAttribute('text-anchor', early ? 'start' : 'end');
        label.setAttribute('x', early ? '12' : '-12');
        label.setAttribute('y', early ? '-16' : '-10');
      } else {
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('x', '0');
        label.setAttribute('y', '-18');
      }
    }
    if (run.supportDay === null) {
      support.style.display = 'none';
    } else {
      support.style.display = '';
      const sx = Math.round(X(run.supportDay)) + 0.5;
      support.querySelector('path')!.setAttribute('d', `M${sx} ${P.t}V${H - P.b}`);
      support.querySelector('text')!.setAttribute('x', String(sx + 8));
    }
  };

  /** Every arrangement, run under the same scenario: the comparison. */
  const table = (sc: Scenario): void => {
    for (const row of rows) {
      const input = row.querySelector('input')!;
      const arr = input.value as Scenario['arr'];
      const r = simulate({ ...sc, arr });
      row.classList.toggle('is-fail', r.fails !== null);
      row.dataset['fails'] = r.fails === null ? 'none' : String(r.fails);
      row.querySelector('[data-col="outcome"]')!.textContent = OUTCOME(r);
      row.querySelector('[data-col="reach"]')!.textContent = `${Math.round(r.reach[1]!)}%`;
      row.querySelector('[data-col="cost"]')!.innerHTML = `${r.cost}<small>${r.basis}</small>`;
      // Spreading accounts does not spread access when they share one route.
      const flag = row.querySelector<HTMLElement>('[data-flag]');
      if (flag) flag.hidden = !(sc.shock === 'route' && arr !== 'one');
    }
  };

  /** The selected arrangement's reserves, with what is cut off hatched. */
  const composite = (sc: Scenario): void => {
    if (!mix) return;
    const parts = composition(sc);
    const cls = (p: Part): string => [p.frozen && 'is-frozen', p.bills && 'is-bills', p.delayed && 'is-delayed'].filter(Boolean).join(' ');
    mix.innerHTML =
      `<p class="engine__label">Reserves, ${rows.find((r) => r.querySelector('input')!.checked)?.querySelector('b')?.textContent ?? ''}</p>` +
      `<div class="engine__bars">${parts
        .map((p) => `<span class="${cls(p)}" style="flex-grow:${p.share}" title="${p.name} ${p.share}%"></span>`)
        .join('')}</div>` +
      `<ul class="engine__legend">${parts
        .map((p) => `<li class="${cls(p)}"><i></i>${p.name}<b>${p.share}%</b>${p.frozen ? '<em>Access lost</em>' : p.delayed ? '<em>A day late</em>' : ''}</li>`)
        .join('')}</ul>`;
  };

  /**
   * Assumptions, each by its nature. One that changed says so and shows what
   * it was; it stays marked until something else changes. A recalculation is
   * not learning, so nothing else is claimed.
   */
  const assumeRows = (sc: Scenario): void => {
    if (!assume) return;
    const now = assumptions(sc);
    const before = last ? assumptions(last) : null;
    const changed = new Set<string>();
    if (before) for (const k of Object.keys(now)) if (now[k]!.detail !== before[k]!.detail) changed.add(k);
    for (const li of assume.querySelectorAll<HTMLElement>('[data-assume]')) {
      const key = li.dataset['assume']!;
      li.querySelector('[data-assume-detail]')!.textContent = now[key]?.detail ?? '';
      if (!before || !last || same(last, sc)) continue;
      const on = changed.has(key);
      li.classList.toggle('is-revised', on);
      const em = li.querySelector('em');
      if (em) em.textContent = on && before[key]!.brief ? `Revised · was ${before[key]!.brief}` : 'Revised';
    }
  };

  const setStatus = (sc: Scenario): void => {
    if (!status || !statusText) return;
    status.classList.remove('is-recorded', 'is-diverged');
    if (!recorded) {
      statusText.textContent = 'Model current';
    } else if (same(recorded.sc, sc)) {
      status.classList.add('is-recorded');
      statusText.textContent = 'Expectation recorded · to be scored';
    } else {
      status.classList.add('is-diverged');
      statusText.textContent = 'Diverges from the record';
    }
  };

  const update = (): void => {
    const sc = read();
    const run = simulate(sc);
    host.dataset['fails'] = run.fails === null ? 'none' : String(run.fails);
    table(sc);
    composite(sc);
    assumeRows(sc);
    for (const row of rows) row.classList.toggle('is-on', row.querySelector('input')!.checked);
    setStatus(sc);
    last = sc;

    cancelAnimationFrame(raf);
    const from = shown;
    shown = run;
    if (reduced || !from) {
      paint(run.reach, run.due, run);
      return;
    }
    const start = performance.now();
    const ease = (t: number): number => 1 - (1 - t) ** 3;
    const step = (now: number): void => {
      const t = Math.min(1, (now - start) / 400);
      const k = ease(t);
      const blend = (a: number[], b: number[]): number[] => b.map((v, i) => a[i]! + (v - a[i]!) * k);
      paint(blend(from.reach, run.reach), blend(from.due, run.due), t < 1 ? { ...run, fails: null } : run);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };

  commit?.addEventListener('click', () => {
    const sc = read();
    recorded = { sc, run: simulate(sc) };
    host.dataset['recorded'] = 'true';
    paintGhost();
    setStatus(sc);
  });

  form.addEventListener('change', update);
  form.addEventListener('submit', (e) => e.preventDefault());

  const fit = (): void => {
    const next = sizeFor(chart.clientWidth);
    if (next === size && shown) {
      svg.classList.toggle('is-mid', size === 'wide' && chart.clientWidth < 720);
      return;
    }
    size = next;
    draw();
    shown = null;
    update();
  };
  new ResizeObserver(() => requestAnimationFrame(fit)).observe(chart);
  size = sizeFor(chart.clientWidth);
  draw();
  update();
}
