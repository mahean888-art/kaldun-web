/**
 * Fig. 01 — A reserve decision under stress.
 *
 * An illustrative simulation, deliberately small. An issuer holds reserves
 * against a digital dollar; on day 1 access to some of its bank deposits is
 * interrupted. Day by day for fourteen days it compares the cash it can reach
 * with the redemptions it owes. Doubts about access make redemptions come
 * faster; policy support, if it comes, restores the frozen deposits on its
 * day. Everything is a share of reserves: no figure here is a claim about any
 * real issuer. The historical record sits apart, above the controls.
 */

import { prefersReducedMotion } from '../lib/prefers';

export type Scenario = {
  arr: 'one' | 'spread' | 'bills';
  shock: 'partner' | 'common';
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
  cost: 'Lowest' | 'Low' | 'Moderate';
};

const DAYS = 14;

/** How the reserves are held: deposits per bank, and short-dated bills. */
const ARRANGEMENT = {
  one: { banks: [100], bills: 0, cost: 'Lowest' },
  spread: { banks: [25, 25, 25, 25], bills: 0, cost: 'Low' },
  bills: { banks: [5, 5, 5, 5], bills: 80, cost: 'Moderate' },
} as const;

/** Share of outstanding supply redeemed per day, before any loss of confidence. */
const PACE = { slow: 0.03, steady: 0.06, fast: 0.1 } as const;

export function simulate(sc: Scenario): Run {
  const a = ARRANGEMENT[sc.arr];
  // Which banks lose access: the partner (the first) alone, or under common
  // funding stress, all but one.
  const hit = sc.shock === 'partner' ? 1 : Math.max(1, a.banks.length - 1);
  const frozenAtStart = a.banks.slice(0, hit).reduce((t, v) => t + v, 0);
  const deposits = a.banks.reduce((t, v) => t + v, 0);
  // Bills reach cash through sale or repo from day 1; under common stress the
  // market absorbs less of them each day.
  const billsPerDay = sc.shock === 'common' ? 20 : 40;
  const supportDay = sc.support === 'none' ? null : Number(sc.support);

  const reach = [100];
  const due = [0];
  let outstanding = 100;
  let paid = 0;
  let fails: number | null = null;

  for (let d = 1; d <= DAYS; d++) {
    const frozen = supportDay !== null && d >= supportDay ? 0 : frozenAtStart;
    // Doubts about reserve access accelerate redemptions.
    const rate = PACE[sc.pace] * (1 + 3 * (frozen / 100));
    const demand = outstanding * rate;
    outstanding -= demand;
    paid += demand;
    const r = deposits - frozen + Math.min(a.bills, billsPerDay * d);
    reach.push(r);
    due.push(paid);
    if (fails === null && paid > r + 1e-9) fails = d;
  }

  return { reach, due, fails, supportDay, cost: a.cost };
}

// --- drawing -------------------------------------------------------------------

/** The drawing's size: wide beside the controls, or narrow and taller-set on
    a phone, so its type stays readable at the size it is shown. */
let W = 760;
let H = 360;
let P = { l: 56, r: 24, t: 24, b: 44 };
let DAY_TICKS = [0, 2, 4, 6, 8, 10, 12, 14];
let KEY2 = 176;
const setSize = (size: 'wide' | 'narrow' | 'tiny'): void => {
  if (size === 'tiny') {
    W = 330;
    H = 290;
    P = { l: 42, r: 12, t: 30, b: 50 };
    DAY_TICKS = [0, 7, 14];
    KEY2 = 148;
  } else if (size === 'narrow') {
    W = 420;
    H = 300;
    P = { l: 46, r: 14, t: 28, b: 48 };
    DAY_TICKS = [0, 7, 14];
    KEY2 = 150;
  } else {
    W = 760;
    H = 360;
    P = { l: 56, r: 24, t: 24, b: 44 };
    DAY_TICKS = [0, 2, 4, 6, 8, 10, 12, 14];
    KEY2 = 176;
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
  return `
    <path class="rs__grid" d="${grid}" />
    <path class="rs__axis" d="M${P.l + 0.5} ${P.t}V${H - P.b + 0.5}H${W - P.r}" />
    ${dayLabels}${valLabels}
    <text class="rs__unit rs__unit--day" x="${W - P.r}" y="${H - 6}" text-anchor="end">Day</text>
    <text class="rs__unit" x="${P.l}" y="${P.t - 10}">Share of reserves</text>
    <g class="rs__shock"><path d="M${Math.round(X(1)) + 0.5} ${P.t}V${H - P.b}" /><text x="${X(1) + 8}" y="${P.t + 14}">Access interrupted</text></g>
    <g class="rs__support" data-rs-support><path d="" /><text x="0" y="${P.t + 14}">Support</text></g>
    <path class="rs__gap" data-rs-gap d="" />
    <path class="rs__due" data-rs-due d="" />
    <path class="rs__reach" data-rs-reach d="" />
    <g class="rs__fail" data-rs-fail><rect x="-7" y="-7" width="14" height="14" transform="rotate(45)" /><text x="0" y="-18" text-anchor="middle"></text></g>
    <g class="rs__key">
      <path class="rs__reach" d="M ${P.l + 16} ${H - 8} h 22" /><text x="${P.l + 46}" y="${H - 4}">Cash reachable</text>
      <path class="rs__due" d="M ${P.l + KEY2} ${H - 8} h 22" /><text x="${P.l + KEY2 + 30}" y="${H - 4}">Redemptions due</text>
    </g>`;
}

/** The reserves of an arrangement as segments, with those cut off on day 1. */
function composition(sc: Scenario): Array<{ name: string; share: number; frozen: boolean; bills: boolean }> {
  const a = ARRANGEMENT[sc.arr];
  const hit = sc.shock === 'partner' ? 1 : Math.max(1, a.banks.length - 1);
  const names = a.banks.length === 1 ? ['Bank A'] : ['Bank A', 'Bank B', 'Bank C', 'Bank D'];
  const parts: Array<{ name: string; share: number; frozen: boolean; bills: boolean }> = a.banks.map((share, i) => ({ name: names[i]!, share, frozen: i < hit, bills: false }));
  if (a.bills) parts.push({ name: 'Treasury bills', share: a.bills, frozen: false, bills: true });
  return parts;
}

/** What each assumption currently holds, in words. */
function assumptions(sc: Scenario): Record<string, string> {
  return {
    shock:
      sc.shock === 'partner'
        ? 'Lost at one partner bank from day 1'
        : 'Lost at all but one bank from day 1',
    liquidity:
      sc.arr === 'bills'
        ? `Bills reach cash at ${sc.shock === 'common' ? '20' : '40'}% of reserves a day`
        : 'No bills held; deposits only',
    pace: `${Math.round(PACE[sc.pace] * 100)}% of supply a day, faster as doubts about access grow`,
    support: sc.support === 'none' ? 'None assumed' : `Frozen deposits restored on day ${sc.support}`,
  };
}

const OUTCOME = (r: Run): string => (r.fails === null ? `Holds ${DAYS} days` : `Fails day ${r.fails}`);

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
  // The drawing follows the width it is given, not the window: narrow and
  // taller-set where its pane is narrow, so its type stays readable.
  let narrow = false;
  let size: 'wide' | 'narrow' | 'tiny' = 'wide';
  const sizeFor = (w: number): 'wide' | 'narrow' | 'tiny' => (w < 400 ? 'tiny' : w < 560 ? 'narrow' : 'wide');
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
  };

  const reduced = prefersReducedMotion();
  let shown: Run | null = null;
  let raf = 0;
  let last: Scenario | null = null;
  const flashes = new Map<string, number>();

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
      // On the narrow drawing the label sits beside the mark, clear of the
      // support line: to its left, or to its right early in the run.
      if (narrow) {
        const early = run.fails <= 4;
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
      const r = simulate({ ...sc, arr: input.value as Scenario['arr'] });
      row.classList.toggle('is-fail', r.fails !== null);
      row.dataset['fails'] = r.fails === null ? 'none' : String(r.fails);
      row.querySelector('[data-col="outcome"]')!.textContent = OUTCOME(r);
      row.querySelector('[data-col="reach"]')!.textContent = `${Math.round(r.reach[1]!)}%`;
      row.querySelector('[data-col="cost"]')!.textContent = r.cost;
    }
  };

  /** The selected arrangement's reserves, with what is cut off hatched. */
  const composite = (sc: Scenario): void => {
    if (!mix) return;
    const parts = composition(sc);
    mix.innerHTML =
      `<p class="engine__label">Reserves, ${rows.find((r) => r.querySelector('input')!.checked)?.querySelector('b')?.textContent ?? ''}</p>` +
      `<div class="engine__bars">${parts
        .map((p) => `<span class="${p.frozen ? 'is-frozen' : ''}${p.bills ? ' is-bills' : ''}" style="flex-grow:${p.share}" title="${p.name} ${p.share}%"></span>`)
        .join('')}</div>` +
      `<ul class="engine__legend">${parts
        .map((p) => `<li class="${p.frozen ? 'is-frozen' : ''}${p.bills ? ' is-bills' : ''}"><i></i>${p.name}<b>${p.share}%</b>${p.frozen ? '<em>Access lost</em>' : ''}</li>`)
        .join('')}</ul>`;
  };

  /** Assumptions, each by its nature; the one just changed says so. */
  const assumeRows = (sc: Scenario): void => {
    if (!assume) return;
    const words = assumptions(sc);
    const changed = new Set<string>();
    if (last) {
      if (last.shock !== sc.shock) changed.add('shock').add('liquidity');
      if (last.arr !== sc.arr) changed.add('liquidity');
      if (last.pace !== sc.pace) changed.add('pace');
      if (last.support !== sc.support) changed.add('support');
    }
    for (const li of assume.querySelectorAll<HTMLElement>('[data-assume]')) {
      const key = li.dataset['assume']!;
      li.querySelector('[data-assume-detail]')!.textContent = words[key] ?? '';
      if (changed.has(key) && !reduced) {
        li.classList.add('is-revised');
        window.clearTimeout(flashes.get(key));
        flashes.set(key, window.setTimeout(() => li.classList.remove('is-revised'), 1800));
      }
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
    if (last && status && statusText) {
      status.classList.remove('is-recorded');
      statusText.textContent = 'Model current';
    }
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
    if (!status || !statusText) return;
    status.classList.add('is-recorded');
    statusText.textContent = 'Expectations recorded · to be scored against outcomes';
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
