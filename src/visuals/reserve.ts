/**
 * Fig. 02 — Rehearsing a reserve decision.
 *
 * An interactive case study for an example dollar issuer. On day 1 access to
 * some of its money is interrupted; day by day for fourteen days it compares
 * the funds available for redemption with cumulative redemption demand.
 * Everything is a share of initial reserves: no figure here is a claim about
 * any real issuer. The historical record sits apart, above the screen.
 *
 * Three disruptions, kept distinct: one partner bank fails; funding stress
 * spreads across banks; or the settlement route the banks share fails. Deposit
 * protection makes deposits at a failed or stressed bank accessible on its
 * day; it does not repair a payment route, which recovers on its own assumed
 * day. Treasuries settle through a separate dealer route: under a route
 * failure the repo line still pays on day 1 and sale proceeds arrive a day
 * late, and repo and sale draw on the same bills, never counted twice.
 *
 * The screen leads with the finding, then the dependency the disruption hits,
 * then the consequence, then the alternatives.
 */

import { prefersReducedMotion } from '../lib/prefers';

export type Scenario = {
  arr: 'one' | 'spread' | 'bills';
  shock: 'partner' | 'common' | 'route';
  pace: 'slow' | 'steady' | 'fast';
  support: '3' | '10' | 'none';
};

export type Run = {
  /** Funds available for redemption by the end of each day, cumulative, % of initial reserves. */
  reach: number[];
  /** Cumulative redemption demand by the end of each day, % of initial reserves. */
  due: number[];
  /** The first day demand exceeds funds available, or null. */
  fails: number | null;
  /** The day deposit access returns, or null within the horizon. */
  access: number | null;
  /** The day of deposit protection, or null. */
  supportDay: number | null;
  cost: string;
  basis: string;
};

const DAYS = 14;

/** The day a failed settlement route is assumed to recover. */
const ROUTE_RECOVERY = 6;

/** What the repo line raises on day 1 when sale proceeds are delayed. */
const REPO_DAY1 = 15;

/** How the reserves are held, and what holding them that way is assumed to cost. */
const ARRANGEMENT = {
  one: { banks: [100], bills: 0, cost: 'Lowest', basis: 'One bank’s fees' },
  spread: { banks: [25, 25, 25, 25], bills: 0, cost: 'Low', basis: 'Fees at four banks' },
  bills: { banks: [5, 5, 5, 5], bills: 80, cost: 'Moderate', basis: 'Four banks, plus a repo line fee' },
} as const;

/** Share of remaining supply redeemed per day, before access is impaired. */
const PACE = { slow: 0.03, steady: 0.06, fast: 0.1 } as const;

/** How many of the arrangement's banks lose access under each disruption. */
function banksHit(arr: Scenario['arr'], shock: Scenario['shock']): number {
  const n = ARRANGEMENT[arr].banks.length;
  if (shock === 'partner') return 1;
  if (shock === 'common') return Math.max(1, n - 1);
  return n; // every account settles through the same route
}

/** The day deposit access returns: protection for a bank, recovery for a route. */
function accessDay(sc: Scenario): number | null {
  if (sc.shock === 'route') return ROUTE_RECOVERY;
  return sc.support === 'none' ? null : Number(sc.support);
}

export function simulate(sc: Scenario): Run {
  const a = ARRANGEMENT[sc.arr];
  const frozenAtStart = a.banks.slice(0, banksHit(sc.arr, sc.shock)).reduce((t, v) => t + v, 0);
  const deposits = a.banks.reduce((t, v) => t + v, 0);
  const access = accessDay(sc);
  // A thinner market under common stress; otherwise 40% of reserves a day.
  const perDay = sc.shock === 'common' ? 20 : 40;

  const reach = [100];
  const due = [0];
  let outstanding = 100;
  let paid = 0;
  let fails: number | null = null;

  for (let d = 1; d <= DAYS; d++) {
    const frozen = access !== null && d >= access ? 0 : frozenAtStart;
    // Doubts about reserve access accelerate redemptions.
    const rate = PACE[sc.pace] * (1 + 3 * (frozen / 100));
    const demand = outstanding * rate;
    outstanding -= demand;
    paid += demand;
    // Repo and sale draw on the same bills: their total never exceeds them.
    const billCash =
      sc.shock === 'route'
        ? Math.min(a.bills, REPO_DAY1 + perDay * (d - 1))
        : Math.min(a.bills, perDay * d);
    const r = deposits - frozen + (a.bills ? billCash : 0);
    reach.push(r);
    due.push(paid);
    if (fails === null && paid > r + 1e-9) fails = d;
  }

  return {
    reach,
    due,
    fails,
    access: access !== null && access <= DAYS ? access : null,
    supportDay: sc.shock === 'route' || sc.support === 'none' ? null : Number(sc.support),
    cost: a.cost,
    basis: a.basis,
  };
}

/** The finding, in plain words, from the current run. */
export function finding(sc: Scenario, run: Run): string {
  if (run.fails === null) {
    return sc.shock === 'route' && sc.arr === 'bills'
      ? 'Four accounts depend on one settlement route, but the Treasuries’ separate dealer route carries redemptions through it.'
      : `No shortfall within ${DAYS} days under these assumptions.`;
  }
  if (sc.shock === 'route' && sc.arr !== 'one') {
    return 'Four accounts depend on one settlement route. Spreading deposits does not remove this interruption.';
  }
  if (run.access === null) return 'Redemptions exceed available funds, and deposit access does not return within the horizon.';
  if (run.fails < run.access) return 'Redemptions exceed available funds before deposit access returns.';
  return `A shortfall begins on day ${run.fails}, after deposit access returns.`;
}

// --- drawing -------------------------------------------------------------------

/** The drawing's size: wide beside the controls, or narrow and taller-set on
    a phone, so its type stays readable at the size it is shown. */
let W = 760;
let H = 360;
let P = { l: 56, r: 24, t: 24, b: 44 };
let DAY_TICKS = [0, 2, 4, 6, 8, 10, 12, 14];
let KEY2 = 236;
let KEY3 = 470;
const setSize = (size: 'wide' | 'narrow' | 'tiny'): void => {
  if (size === 'tiny') {
    W = 330;
    H = 300;
    P = { l: 42, r: 12, t: 30, b: 62 };
    DAY_TICKS = [0, 7, 14];
    KEY2 = -1;
    KEY3 = -1;
  } else if (size === 'narrow') {
    W = 440;
    H = 310;
    P = { l: 46, r: 14, t: 28, b: 62 };
    DAY_TICKS = [0, 7, 14];
    KEY2 = -1;
    KEY3 = -1;
  } else {
    W = 760;
    H = 360;
    P = { l: 56, r: 24, t: 24, b: 44 };
    DAY_TICKS = [0, 2, 4, 6, 8, 10, 12, 14];
    KEY2 = 236;
    KEY3 = 470;
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
 * The shortfall: wherever demand runs above the funds available. Funds hold
 * through each day (a step); demand accrues along the day (a line).
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
  // The key: in one row on the wide drawing, stacked beneath the narrow one.
  const stacked = KEY2 < 0;
  const ky = stacked ? H - 12 : H - 4;
  const k1 = `<path class="rs__reach" d="M ${P.l} ${ky - 4} h 18" /><text x="${P.l + 26}" y="${ky}">Funds available</text>`;
  const k2x = stacked ? P.l + 150 : P.l + KEY2;
  const k2 = `<path class="rs__due" d="M ${k2x} ${ky - 4} h 18" /><text x="${k2x + 26}" y="${ky}">Cumulative demand</text>`;
  const ghostKey =
    KEY3 > 0
      ? `<g class="rs__ghost-key" data-rs-ghost-key><path class="rs__ghost-reach" d="M ${P.l + KEY3} ${H - 8} h 18" /><text x="${P.l + KEY3 + 26}" y="${H - 4}">Saved comparison</text></g>`
      : '';
  return `
    <path class="rs__grid" d="${grid}" />
    <path class="rs__axis" d="M${P.l + 0.5} ${P.t}V${H - P.b + 0.5}H${W - P.r}" />
    ${dayLabels}${valLabels}
    ${stacked ? '' : `<text class="rs__unit rs__unit--day" x="${W - P.r}" y="${H - 6}" text-anchor="end">Day</text>`}
    <text class="rs__unit" x="${P.l}" y="${P.t - 10}">Share of initial reserves</text>
    <g class="rs__shock"><path d="M${Math.round(X(1)) + 0.5} ${P.t}V${H - P.b}" /><text x="${X(1) + 8}" y="${P.t + 14}">Access interrupted</text></g>
    <g class="rs__support" data-rs-support><path d="" /><text x="0" y="${P.t + 14}"></text></g>
    <g class="rs__ghost" data-rs-ghost><path class="rs__ghost-due" d="" /><path class="rs__ghost-reach" d="" /><text x="0" y="0">Saved</text></g>
    <path class="rs__gap" data-rs-gap d="" />
    <path class="rs__due" data-rs-due d="" />
    <path class="rs__reach" data-rs-reach d="" />
    <g class="rs__fail" data-rs-fail><rect x="-7" y="-7" width="14" height="14" transform="rotate(45)" /><text x="0" y="-18" text-anchor="middle"></text></g>
    <g class="rs__key">${k1}${k2}${ghostKey}</g>`;
}

/** The example issuer's holdings, as the dependency map shows them. */
type Part = { name: string; share: number; frozen: boolean; bills: boolean };
function composition(sc: Scenario): Part[] {
  const a = ARRANGEMENT[sc.arr];
  const hit = banksHit(sc.arr, sc.shock);
  const names = a.banks.length === 1 ? ['Bank A'] : ['Bank A', 'Bank B', 'Bank C', 'Bank D'];
  const parts: Part[] = a.banks.map((share, i) => ({ name: names[i]!, share, frozen: i < hit, bills: false }));
  if (a.bills) parts.push({ name: 'Treasury bills', share: a.bills, frozen: false, bills: true });
  return parts;
}

/** What each assumption currently holds, in words, and in brief for "was". */
function assumptions(sc: Scenario): Record<string, { detail: string; brief: string }> {
  const hasBills = sc.arr === 'bills';
  return {
    obligation: { detail: 'Every token redeemable for a dollar, on any day', brief: '' },
    shock: {
      detail:
        sc.shock === 'partner'
          ? 'Lost at one partner bank from day 1, when it fails'
          : sc.shock === 'common'
            ? 'Lost at all but one bank from day 1, under funding stress'
            : 'Every account settles through the failed route, so all are unreachable',
      brief: sc.shock === 'partner' ? 'one partner bank' : sc.shock === 'common' ? 'stress across banks' : 'shared route',
    },
    route: {
      detail:
        sc.shock === 'route'
          ? `The banks’ shared route fails on day 1 and recovers on day ${ROUTE_RECOVERY} (assumed); Treasuries settle through a separate dealer route`
          : 'The banks share one settlement route, which keeps working; Treasuries settle through a separate dealer route',
      brief: sc.shock === 'route' ? 'route down' : 'route working',
    },
    liquidity: {
      detail: !hasBills
        ? 'No bills held; deposits only'
        : sc.shock === 'route'
          ? `Repo raises ${REPO_DAY1}% on day 1; sale proceeds arrive a day late. Together never more than the bills`
          : `Bills reach cash at ${sc.shock === 'common' ? 20 : 40}% of reserves a day`,
      brief: !hasBills ? 'no bills' : sc.shock === 'route' ? 'repo only on day 1' : `${sc.shock === 'common' ? 20 : 40}% a day`,
    },
    pace: {
      detail: `${Math.round(PACE[sc.pace] * 100)}% of remaining supply a day, faster when access is impaired (assumed)`,
      brief: sc.pace,
    },
    support: {
      detail:
        sc.shock === 'route'
          ? 'Not relevant: no bank has failed, and protection does not repair a route'
          : sc.support === 'none'
            ? 'None assumed'
            : `Deposits at the affected banks become accessible on day ${sc.support}`,
      brief: sc.support === 'none' ? 'none' : `day ${sc.support}`,
    },
  };
}

const OUTCOME = (r: Run): string => (r.fails === null ? `No shortfall within ${DAYS} days` : `Shortfall begins: day ${r.fails}`);
const same = (a: Scenario, b: Scenario): boolean =>
  a.arr === b.arr && a.shock === b.shock && a.pace === b.pace && a.support === b.support;

export function initReserve(host: HTMLElement): void {
  const form = host.querySelector<HTMLFormElement>('[data-reserve-controls]');
  const chart = host.querySelector<HTMLElement>('[data-reserve-chart]');
  if (!form || !chart) return;
  const rows = Array.from(host.querySelectorAll<HTMLLabelElement>('.engine__row'));
  const map = host.querySelector<HTMLElement>('[data-engine-map]');
  const findingOut = host.querySelector<HTMLElement>('[data-engine-finding]');
  const assume = host.querySelector<HTMLElement>('[data-engine-assume]');
  const statusText = host.querySelector<HTMLElement>('[data-engine-status-text]');
  const status = host.querySelector<HTMLElement>('[data-engine-status]');
  const commit = host.querySelector<HTMLButtonElement>('[data-engine-commit]');

  // On wide screens the assumptions sit open beside the case; on a phone
  // they fold beneath it, so the finding and the run come first.
  const wide = window.matchMedia('(min-width: 1000px)');
  const folds = Array.from(host.querySelectorAll<HTMLDetailsElement>('[data-engine-explore], [data-engine-sources]'));
  const setFolds = (): void => {
    for (const d of folds) d.open = wide.matches;
  };
  setFolds();
  wide.addEventListener('change', setFolds);

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Funds available for redemption and cumulative redemption demand over fourteen days');
  chart.append(svg);

  let reachPath!: SVGPathElement;
  let duePath!: SVGPathElement;
  let gapPath!: SVGPathElement;
  let fail!: SVGGElement;
  let support!: SVGGElement;
  let ghost!: SVGGElement;
  let narrow = false;
  let size: 'wide' | 'narrow' | 'tiny' = 'wide';
  const sizeFor = (w: number): 'wide' | 'narrow' | 'tiny' => (w < 400 ? 'tiny' : w < 600 ? 'narrow' : 'wide');

  const reduced = prefersReducedMotion();
  let shown: Run | null = null;
  let raf = 0;
  let last: Scenario | null = null;
  /** A comparison the reader chose to save, for this session only. */
  let saved: { sc: Scenario; run: Run } | null = null;

  const paintGhost = (): void => {
    if (!ghost) return;
    const key = svg.querySelector<SVGGElement>('[data-rs-ghost-key]');
    if (!saved) {
      ghost.style.display = 'none';
      if (key) key.style.display = 'none';
      return;
    }
    ghost.style.display = '';
    if (key) key.style.display = '';
    const r = saved.run;
    ghost.querySelector('.rs__ghost-reach')!.setAttribute('d', stepPath(r.reach));
    ghost.querySelector('.rs__ghost-due')!.setAttribute('d', linePath(r.due));
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

  const paint = (reach: number[], due: number[], run: Run, sc: Scenario): void => {
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
      label.textContent = `Shortfall, day ${run.fails}`;
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
    // Where access returns: deposit protection, or the route's recovery.
    if (run.access === null) {
      support.style.display = 'none';
    } else {
      support.style.display = '';
      const sx = Math.round(X(run.access)) + 0.5;
      support.querySelector('path')!.setAttribute('d', `M${sx} ${P.t}V${H - P.b}`);
      const t = support.querySelector('text')!;
      // Late in the run, the label sits to the left of its line.
      const late = sx > W * 0.68;
      t.setAttribute('x', String(late ? sx - 8 : sx + 8));
      t.setAttribute('text-anchor', late ? 'end' : 'start');
      t.textContent = sc.shock === 'route' ? 'Route recovers' : 'Protection';
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

  /**
   * The dependency map: holdings, the routes they depend on, and the
   * obligation they serve. What the disruption hits is lit.
   */
  const dependencies = (sc: Scenario): void => {
    if (!map) return;
    const parts = composition(sc);
    const banks = parts.filter((p) => !p.bills);
    const bills = parts.find((p) => p.bills);
    const routeDown = sc.shock === 'route';
    const node = (cls: string, name: string, note: string): string =>
      `<li class="emap__node ${cls}"><b>${name}</b>${note ? `<span>${note}</span>` : ''}</li>`;
    map.innerHTML =
      `<div class="emap__col"><p class="emap__h">Holdings</p><ul>` +
      banks.map((b) => node(b.frozen ? 'is-hit' : '', `${b.name} · ${b.share}%`, b.frozen ? 'Access lost' : '')).join('') +
      (bills ? node('is-bills', `Treasury bills · ${bills.share}%`, routeDown ? 'Sale proceeds a day late' : '') : '') +
      `</ul></div>` +
      `<div class="emap__col"><p class="emap__h">Access route</p><ul>` +
      node(routeDown ? 'is-hit' : '', banks.length > 1 ? 'Shared settlement route' : 'Settlement route', routeDown ? `Down until day ${ROUTE_RECOVERY}` : `Serves ${banks.length > 1 ? 'all four banks' : 'the bank'}`) +
      (bills ? node('', 'Dealer route', 'Separate; repo pays on day 1') : '') +
      `</ul></div>` +
      `<div class="emap__col"><p class="emap__h">Obligation</p><ul>` +
      node('is-duty', 'Redemptions', 'At par, on demand') +
      `</ul></div>`;
  };

  /**
   * Assumptions, each by its nature. One that changed says so and shows what
   * it was; it stays marked until something else changes.
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
    if (!saved) {
      statusText.textContent = 'Scenario ready';
    } else if (same(saved.sc, sc)) {
      status.classList.add('is-recorded');
      statusText.textContent = 'Saved for this session';
    } else {
      status.classList.add('is-diverged');
      statusText.textContent = 'Differs from saved comparison';
    }
  };

  const update = (): void => {
    const sc = read();
    const run = simulate(sc);
    host.dataset['fails'] = run.fails === null ? 'none' : String(run.fails);
    if (findingOut) {
      findingOut.textContent = finding(sc, run);
      findingOut.classList.toggle('is-fail', run.fails !== null);
    }
    table(sc);
    dependencies(sc);
    assumeRows(sc);
    for (const row of rows) row.classList.toggle('is-on', row.querySelector('input')!.checked);
    setStatus(sc);
    last = sc;

    cancelAnimationFrame(raf);
    const from = shown;
    shown = run;
    if (reduced || !from) {
      paint(run.reach, run.due, run, sc);
      return;
    }
    const start = performance.now();
    const ease = (t: number): number => 1 - (1 - t) ** 3;
    const step = (now: number): void => {
      const t = Math.min(1, (now - start) / 400);
      const k = ease(t);
      const blend = (a: number[], b: number[]): number[] => b.map((v, i) => a[i]! + (v - a[i]!) * k);
      paint(blend(from.reach, run.reach), blend(from.due, run.due), t < 1 ? { ...run, fails: null } : run, sc);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };

  commit?.addEventListener('click', () => {
    const sc = read();
    saved = { sc, run: simulate(sc) };
    host.dataset['saved'] = 'true';
    paintGhost();
    setStatus(sc);
  });

  form.addEventListener('change', update);
  form.addEventListener('submit', (e) => e.preventDefault());

  const fit = (): void => {
    const next = sizeFor(chart.clientWidth);
    if (next === size && shown) return;
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
