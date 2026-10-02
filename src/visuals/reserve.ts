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
const setSize = (narrow: boolean): void => {
  W = narrow ? 420 : 760;
  H = narrow ? 330 : 360;
  P = narrow ? { l: 46, r: 14, t: 28, b: 48 } : { l: 56, r: 24, t: 24, b: 44 };
  DAY_TICKS = narrow ? [0, 7, 14] : [0, 2, 4, 6, 8, 10, 12, 14];
  KEY2 = narrow ? 150 : 176;
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
    <text class="rs__unit" x="${W - P.r}" y="${H - 6}" text-anchor="end">Day</text>
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

export function initReserve(host: HTMLElement): void {
  const form = host.querySelector<HTMLFormElement>('[data-reserve-controls]');
  const chart = host.querySelector<HTMLElement>('[data-reserve-chart]');
  if (!form || !chart) return;
  const outcome = host.querySelector<HTMLElement>('[data-read-outcome]');
  const reachOut = host.querySelector<HTMLElement>('[data-read-reach]');
  const costOut = host.querySelector<HTMLElement>('[data-read-cost]');

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Cash reachable and redemptions due over fourteen days');
  chart.append(svg);

  let reachPath!: SVGPathElement;
  let duePath!: SVGPathElement;
  let gapPath!: SVGPathElement;
  let fail!: SVGGElement;
  let support!: SVGGElement;
  const narrow = window.matchMedia('(max-width: 599px)');
  const draw = (): void => {
    setSize(narrow.matches);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.classList.toggle('is-narrow', narrow.matches);
    svg.innerHTML = frame();
    reachPath = svg.querySelector<SVGPathElement>('[data-rs-reach]')!;
    duePath = svg.querySelector<SVGPathElement>('[data-rs-due]')!;
    gapPath = svg.querySelector<SVGPathElement>('[data-rs-gap]')!;
    fail = svg.querySelector<SVGGElement>('[data-rs-fail]')!;
    support = svg.querySelector<SVGGElement>('[data-rs-support]')!;
  };
  draw();

  const reduced = prefersReducedMotion();
  let shown: Run | null = null;
  let raf = 0;

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
      if (narrow.matches) {
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

  const update = (): void => {
    const run = simulate(read());
    host.dataset['fails'] = run.fails === null ? 'none' : String(run.fails);
    if (outcome) {
      outcome.textContent = run.fails === null ? `Holds through day ${DAYS}` : `Fails on day ${run.fails}`;
      outcome.classList.toggle('is-fail', run.fails !== null);
    }
    if (reachOut) reachOut.textContent = `${Math.round(run.reach[1]!)}%`;
    if (costOut) costOut.textContent = run.cost;

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
      const mix = (a: number[], b: number[]): number[] => b.map((v, i) => a[i]! + (v - a[i]!) * k);
      paint(mix(from.reach, run.reach), mix(from.due, run.due), t < 1 ? { ...run, fails: null } : run);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };

  form.addEventListener('change', update);
  narrow.addEventListener('change', () => {
    draw();
    shown = null;
    update();
  });
  form.addEventListener('submit', (e) => e.preventDefault());
  update();
}
