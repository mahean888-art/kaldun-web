/**
 * Where we start: one issuer's weekend, across 1,000 futures.
 *
 * Dollars are redeemed at any hour; the banks that hold the cash close from
 * Friday afternoon to Monday morning. Whatever is redeemed while they are
 * closed must already sit at the banks. This is a small working model of that:
 *
 *   - 1,000 seeded futures of hourly redemptions, Friday 12:00 to Monday
 *     12:00 ET, with an evening peak, heavier weekends, and rare very large
 *     redemptions;
 *   - four terms the machine may change (a daily limit per merchant, notice
 *     for very large redemptions, a morning fund redemption every day, a
 *     second bank with longer hours);
 *   - for any set of terms, the cash to prefund is the 95th percentile, over
 *     the futures, of the largest run of redemptions between two refills.
 *
 * All 16 sets of terms are run. "The machine's terms" is the set with the
 * least prefunding that still pays at least 99% of volume at once. Every
 * number on screen is computed here, not typed in.
 */
import { prefersReducedMotion } from '../lib/prefers';

type Term = 'limit' | 'notice' | 'fund' | 'bank';
const TERMS: Term[] = ['limit', 'notice', 'fund', 'bank'];
const HOURS = 72; // Fri 12:00 -> Mon 12:00 ET
const N = 1000;

/* ------------------------------------------------------------------ the model */

const rng = (seed: number) => (): number => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const clockHour = (t: number): number => (12 + t) % 24;
const dayOf = (t: number): number => Math.floor((12 + t) / 24); // 0 Fri, 1 Sat, 2 Sun, 3 Mon

/** Ordinary hourly redemptions and rare very large ones, for each future. */
function futures(): { base: Float64Array[]; big: Float64Array[] } {
  const r = rng(20261113);
  const base: Float64Array[] = [];
  const big: Float64Array[] = [];
  for (let f = 0; f < N; f++) {
    const level = 0.8 + r() * 0.5; // how busy this weekend is
    const b = new Float64Array(HOURS);
    const g = new Float64Array(HOURS);
    for (let t = 0; t < HOURS; t++) {
      const h = clockHour(t);
      const day = Math.exp(-((h - 20) ** 2) / 18) * 1.1 + 0.35 + (h < 7 ? -0.2 : 0);
      const wk = dayOf(t) === 1 || dayOf(t) === 2 ? 1.35 : 1;
      const noise = Math.exp((r() + r() + r() - 1.5) * 0.55);
      b[t] = Math.max(0, day * wk * level * noise);
      if (r() < 0.012) g[t] = 4 + r() * 6;
    }
    base.push(b);
    big.push(g);
  }
  return { base, big };
}

type Result = { prefund: number; instant: number; lo: Float64Array; mid: Float64Array; hi: Float64Array; refills: number[]; open: Array<[number, number]> };

function run(F: ReturnType<typeof futures>, on: Set<Term>): Result {
  const LIMIT = 1.65;
  // When the banks are open: Friday until 17:00 (20:00 with the second bank),
  // Monday from 9:00 (Sunday 18:00 with it).
  const close = on.has('bank') ? 8 : 5;
  const reopen = on.has('bank') ? 54 : 69;
  const open: Array<[number, number]> = [[0, close], [reopen, HOURS]];
  const isOpen = (t: number): boolean => t < close || t >= reopen;
  // Refills: the bank reopening, and with the fund term, 8:00 each weekend day.
  const refills = on.has('fund') ? [20, 44] : [];
  const peaks: number[] = [];
  const paths = Array.from({ length: HOURS }, () => new Float64Array(N));
  let total = 0;
  let late = 0;
  for (let f = 0; f < N; f++) {
    let run = 0;
    let peak = 0;
    for (let t = 0; t < HOURS; t++) {
      let d = F.base[f]![t]!;
      let g = F.big[f]![t]!;
      total += d + g;
      if (on.has('limit') && d > LIMIT) {
        late += d - LIMIT;
        d = LIMIT;
      }
      if (on.has('notice')) g = 0; // scheduled for Monday, with notice: still paid as promised
      if (isOpen(t)) run = 0;
      else {
        if (refills.includes(t)) run = 0;
        run += d + g;
      }
      paths[t]![f] = run;
      if (run > peak) peak = run;
    }
    peaks.push(peak);
  }
  peaks.sort((a, b) => a - b);
  const q = (arr: Float64Array, p: number): number => {
    const s = Array.from(arr).sort((a, b) => a - b);
    return s[Math.floor(p * (s.length - 1))]!;
  };
  const lo = new Float64Array(HOURS), mid = new Float64Array(HOURS), hi = new Float64Array(HOURS);
  for (let t = 0; t < HOURS; t++) {
    lo[t] = q(paths[t]!, 0.05);
    mid[t] = q(paths[t]!, 0.5);
    hi[t] = q(paths[t]!, 0.95);
  }
  return { prefund: peaks[Math.floor(0.95 * (N - 1))]!, instant: 1 - late / total, lo, mid, hi, refills, open };
}

/* ------------------------------------------------------------------ the chart */

const L = 60, R = 18, T = 58, B = 30;

function chart(res: Result, today: Result, ymax: number, W: number, H: number): string {
  const X = (t: number): number => L + (t / (HOURS - 1)) * (W - L - R);
  const Y = (v: number): number => T + (1 - v / ymax) * (H - T - B);
  const pts = (a: Float64Array): string => Array.from(a).map((v, t) => `${X(t).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  let s = `<svg viewBox="0 0 ${W} ${H}" class="wk-svg" role="img" aria-label="Cash needed at banks through the weekend, across 1,000 futures.">`;
  // lanes: dollars move at any hour; banks open only in their windows
  s += `<text x="${L - 8}" y="14" text-anchor="end" class="wt">Dollars</text><line x1="${L}" x2="${W - R}" y1="10" y2="10" class="lane-on"/>`;
  s += `<text x="${L - 8}" y="34" text-anchor="end" class="wt">Banks</text>`;
  res.open.forEach(([a, b]) => (s += `<line x1="${X(a)}" x2="${X(Math.min(b, HOURS - 1))}" y1="30" y2="30" class="lane-on"/>`));
  s += `<line x1="${X(res.open[0]![1])}" x2="${X(res.open[1]![0])}" y1="30" y2="30" class="lane-off"/>`;
  s += `<text x="${(X(res.open[0]![1]) + X(res.open[1]![0])) / 2}" y="46" text-anchor="middle" class="wt q">closed, Friday to Monday</text>`;
  // closed shading
  s += `<rect x="${X(res.open[0]![1])}" y="${T}" width="${X(res.open[1]![0]) - X(res.open[0]![1])}" height="${H - T - B}" class="closed"/>`;
  // grid and axis
  [0, 0.25, 0.5, 0.75, 1].forEach((k) => {
    const v = today.prefund * k;
    s += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/>`;
    s += `<text x="${L - 8}" y="${Y(v) + 4}" text-anchor="end" class="wt q">${Math.round((v / today.prefund) * 100)}%</text>`;
  });
  (W < 520 ? [[12, 'Sat'], [36, 'Sun'], [60, 'Mon']] : [[0, 'Fri 12:00'], [12, 'Sat 0:00'], [36, 'Sun 0:00'], [60, 'Mon 0:00'], [71, 'Mon 12:00']]).forEach(([t, l]) => {
    s += `<text x="${X(t as number)}" y="${H - 8}" text-anchor="${t === 0 ? 'start' : t === 71 ? 'end' : 'middle'}" class="wt q">${l}</text>`;
  });
  // today's terms, for reference
  s += `<polyline points="${pts(today.hi)}" class="today"/>`;
  // the band and the median
  s += `<polygon points="${pts(res.hi)} ${Array.from(res.lo).map((v, t) => `${X(t).toFixed(1)},${Y(v).toFixed(1)}`).reverse().join(' ')}" class="band"/>`;
  s += `<polyline points="${pts(res.mid)}" class="med"/>`;
  // refills
  res.refills.forEach((t) => (s += `<line x1="${X(t)}" x2="${X(t)}" y1="${T}" y2="${H - B}" class="refill"/><text x="${X(t) + 5}" y="${T + 12}" class="wt or">fund 8:00</text>`));
  // the prefunding line
  s += `<line x1="${L}" x2="${W - R}" y1="${Y(res.prefund)}" y2="${Y(res.prefund)}" class="pre"/>`;
  s += `<text x="${W - R}" y="${Y(res.prefund) - 6}" text-anchor="end" class="wt b">prefund ${Math.round((res.prefund / today.prefund) * 100)}%</text>`;
  return s + '</svg>';
}

/* --------------------------------------------------------------------- init */

export function initRun(root: HTMLElement): void {
  const reduced = prefersReducedMotion();
  const host = root.querySelector<HTMLElement>('[data-chart]');
  const btns = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-term]'));
  const setBtns = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-set]'));
  const oCash = root.querySelector<HTMLElement>('[data-o-cash]');
  const oInst = root.querySelector<HTMLElement>('[data-o-inst]');
  const win = root.querySelector<HTMLElement>('.tm__win');
  const stage = root.querySelector<HTMLElement>('.tm__stage');
  if (!host || !oCash || !oInst || !win || !stage) return;

  const F = futures();
  const key = (s: Set<Term>): string => TERMS.filter((t) => s.has(t)).join('+');
  const cache = new Map<string, Result>();
  const get = (s: Set<Term>): Result => {
    const k = key(s);
    if (!cache.has(k)) cache.set(k, run(F, s));
    return cache.get(k)!;
  };
  const today = get(new Set());
  // Try every set of terms; keep the least prefunding that pays 99% at once.
  let best = new Set<Term>();
  for (let m = 0; m < 16; m++) {
    const s = new Set(TERMS.filter((_, i) => m & (1 << i)));
    const r = get(s);
    if (r.instant >= 0.99 && r.prefund < get(best).prefund) best = s;
  }
  const ymax = today.prefund * 1.12;

  let on = new Set<Term>();
  const paint = (): void => {
    const r = get(on);
    host.innerHTML = chart(r, today, ymax, Math.max(300, host.clientWidth), Math.max(220, host.clientHeight));
    btns.forEach((b) => b.setAttribute('aria-pressed', String(on.has(b.dataset['term'] as Term))));
    oCash.textContent = `${Math.round((r.prefund / today.prefund) * 100)}%`;
    oInst.textContent = `${(Math.floor(r.instant * 1000) / 10).toFixed(1)}%`;
    const isBest = key(on) === key(best);
    setBtns.forEach((b) => b.classList.toggle('is-on', (b.dataset['set'] === 'machine' && isBest) || (b.dataset['set'] === 'today' && on.size === 0)));
    root.classList.toggle('is-best', isBest);
  };

  let timers: number[] = [];
  const stop = (): void => {
    timers.forEach(clearTimeout);
    timers = [];
  };
  btns.forEach((b) =>
    b.addEventListener('click', () => {
      stop();
      const t = b.dataset['term'] as Term;
      on = new Set(on);
      if (on.has(t)) on.delete(t);
      else on.add(t);
      paint();
    }),
  );
  setBtns.forEach((b) =>
    b.addEventListener('click', () => {
      stop();
      on = b.dataset['set'] === 'machine' ? new Set(best) : new Set();
      paint();
    }),
  );

  // Fit: full width, no taller than the screen allows.
  const wide = window.matchMedia('(min-width: 768px)');
  const fit = (): void => {
    if (!wide.matches) {
      win.style.transform = '';
      stage.style.height = '';
      stage.style.maxWidth = '';
      return;
    }
    const pad = 40;
    const outer = (stage.parentElement as HTMLElement).clientWidth;
    const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
    const k = Math.min(1, (outer - pad) / 1120, (window.innerHeight - headerH - 96 - pad) / 640);
    win.style.transform = `scale(${k})`;
    stage.style.maxWidth = `${pad + 1120 * k}px`;
    stage.style.height = `${pad + 640 * k}px`;
  };
  fit();
  window.addEventListener('resize', () => {
    fit();
    paint();
  });

  // At rest: the machine's terms. When first seen: start from today's and add
  // the machine's terms one at a time.
  if (reduced) {
    on = new Set(best);
    paint();
    return;
  }
  on = new Set(best);
  paint();
  const io = new IntersectionObserver(
    (es) => {
      if (!es.some((e) => e.isIntersecting)) return;
      io.disconnect();
      on = new Set();
      paint();
      const order = TERMS.filter((t) => best.has(t));
      order.forEach((t, i) =>
        timers.push(
          window.setTimeout(() => {
            on = new Set(on).add(t);
            paint();
          }, 1400 + i * 1100),
        ),
      );
    },
    { threshold: 0.4 },
  );
  io.observe(win);
}
