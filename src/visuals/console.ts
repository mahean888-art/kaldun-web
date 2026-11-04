/**
 * Where we start: one story in three tabs, drawn as the network behind a
 * digital dollar.
 *
 *   Model      the network at rest: the issuer, its reserves, its banks, its
 *              partners and its holders, with three kinds of channel.
 *   Futures    the network in motion through a week. Redemptions arrive as
 *              pulses of light from holders and partners, through the issuer,
 *              out to the banks. Weekday mornings run through many banks;
 *              weekend nights narrow to the four that pay at any hour. Where a
 *              promise would slip, that bank rings orange. A scrubber fills one
 *              dot a week across 78 weeks; the scenarios replay it under a
 *              different condition.
 *   Discovery  the network rearranged: the fund grows, two business-hours
 *              banks shrink, one real-time bank grows, and a weekend route opens
 *              through a fifth.
 *
 * The stages advance every eight seconds once in view, until the visitor
 * touches the console. Under reduced motion nothing moves; the replay is drawn
 * whole and the rearrangement is immediate.
 */

import { prefersReducedMotion } from '../lib/prefers';

const STAGES = ['model', 'futures', 'discovery'] as const;
type Stage = (typeof STAGES)[number];
type Scen = 'typical' | 'weekends' | 'partner' | 'rates';
const NS = 'http://www.w3.org/2000/svg';
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Redemption volume, 0–1, by day (0 = Monday) and hour (ET). */
function volume(d: number, h: number, scen: Scen): number {
  const us = Math.exp(-(((h - 12.5) / 3.6) ** 2));
  const eu = 0.8 * Math.exp(-(((h - 5) / 2) ** 2));
  const asia = (scen === 'partner' ? 1.5 : 0.75) * Math.exp(-(((((h + 3) % 24) - 1) / 2.6) ** 2));
  let v = 0.15 + us + eu + asia;
  if (d >= 5) v *= 0.3;
  return Math.min(1, v / 1.6);
}
const open = (d: number, h: number): boolean => d < 5 && h >= 8 && h < 18;

export function initConsole(root: HTMLElement): void {
  const reduced = prefersReducedMotion();
  const body = root.querySelector<HTMLElement>('.cons__body')!;
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('.cons__tab'));
  const svg = root.querySelector<SVGSVGElement>('svg.nw')!;
  const pulses = svg.querySelector<SVGGElement>('[data-pulses]')!;
  const hourOut = root.querySelector<HTMLElement>('[data-hour]');
  const weeks = Array.from(root.querySelectorAll<HTMLElement>('.cons__weeks i'));
  const play = root.querySelector<HTMLButtonElement>('[data-play]');
  const scenBtns = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-scen]'));
  const edge = (k: string): SVGPathElement | null => svg.querySelector(`[data-e="${k}"]`);
  const node = (k: string): SVGGElement | null => svg.querySelector(`[data-n="${k}"]`);

  let stage: Stage = 'model';
  let scen: Scen = 'typical';
  let playing = !reduced;
  let touched = false;
  let timer = 0;
  let raf = 0;
  let clock = 0; // hours into the week
  let week = 0;
  let last = 0;

  const show = (st: Stage): void => {
    stage = st;
    body.dataset['stage'] = st;
    tabs.forEach((t, i) => {
      const on = STAGES[i] === st;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    for (const el of root.querySelectorAll<HTMLElement>('[data-line]')) el.hidden = el.dataset['line'] !== st;
    for (const el of root.querySelectorAll<HTMLElement>('[data-only]')) el.hidden = el.dataset['only'] !== st;
    root.querySelector('.cons__pane')?.setAttribute('aria-labelledby', `st-${st}`);
    if (st === 'futures') {
      if (reduced) for (const w of weeks) w.classList.add('is-on');
      start();
    } else {
      pulses.replaceChildren();
      for (const n of svg.querySelectorAll('.is-slip')) n.classList.remove('is-slip');
      for (const n of svg.querySelectorAll('.is-quiet')) n.classList.remove('is-quiet');
    }
  };

  /** One pulse of light along a path, out and gone. */
  const pulse = (path: SVGPathElement, back: boolean, warm: boolean, dur: number): void => {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('r', warm ? '3' : '2.4');
    c.setAttribute('class', `nw-p${warm ? ' nw-p--warm' : ''}`);
    pulses.append(c);
    const len = path.getTotalLength();
    const t0 = performance.now();
    const step = (now: number): void => {
      const k = Math.min(1, (now - t0) / dur);
      const p = path.getPointAtLength((back ? 1 - k : k) * len);
      c.setAttribute('cx', p.x.toFixed(1));
      c.setAttribute('cy', p.y.toFixed(1));
      c.style.opacity = String(Math.sin(Math.PI * k));
      if (k < 1 && stage === 'futures') requestAnimationFrame(step);
      else c.remove();
    };
    requestAnimationFrame(step);
  };

  /** Advance the replayed week by one hour: send redemptions through the network. */
  const hour = (): void => {
    const d = Math.floor(clock / 24) % 7;
    const h = Math.floor(clock % 24);
    if (hourOut) hourOut.textContent = `${DAYS[d]} ${String(h).padStart(2, '0')}:00`;
    const v = scen === 'weekends' && d < 5 ? volume(5, h, scen) : volume(d, h, scen);
    const bankHours = open(d, h) && scen !== 'weekends';
    for (let k = 5; k <= 8; k++) node(`b${k}`)?.classList.toggle('is-quiet', !bankHours);
    for (const k of ['custodian', 'fund']) node(k)?.classList.toggle('is-quiet', !bankHours);
    // In from holders and partners …
    const ins = ['exch', 'wallets', 'nets', 'apps'];
    const n = Math.round(1 + v * 4);
    for (let i = 0; i < n; i++) {
      const k = ins[Math.floor(Math.random() * (scen === 'partner' && Math.random() < 0.5 ? 1 : ins.length))]!;
      const p = edge(k);
      if (p) window.setTimeout(() => pulse(p, true, false, 900), i * 110);
    }
    // … and out to the banks that are open.
    const banks = bankHours ? [1, 2, 3, 4, 5, 6, 7, 8] : [1, 2, 3, 4];
    for (let i = 0; i < Math.round(1 + v * 3); i++) {
      const b = banks[Math.floor(Math.random() * banks.length)]!;
      const p = edge(`b${b}`);
      if (p) window.setTimeout(() => pulse(p, false, b <= 4, 1000), 380 + i * 140);
    }
    // A promise would slip: heavy partner evenings at the two smallest real-time banks.
    const slip = scen === 'partner' ? !bankHours && v > 0.62 : !bankHours && v > 0.78;
    for (const k of ['b3', 'b4']) node(k)?.classList.toggle('is-slip', slip && (k === 'b3' || v > 0.85));
    if (scen === 'rates') node('fund')?.classList.add('is-warm');
    else node('fund')?.classList.remove('is-warm');
  };

  const loop = (now: number): void => {
    raf = 0;
    if (stage !== 'futures' || !playing) return;
    if (!last) last = now;
    // A week every eight seconds: three hours a third of a second.
    if (now - last > 330) {
      last = now;
      clock += 3;
      hour();
      if (clock >= 168) {
        clock = 0;
        weeks[week % weeks.length]?.classList.add('is-on');
        week += 1;
        if (week % weeks.length === 0) for (const w of weeks) w.classList.remove('is-on');
      }
      // Within a week, fill the scrubber in proportion so it reads as moving.
      weeks[week % weeks.length]?.style.setProperty('--k', String(clock / 168));
    }
    raf = requestAnimationFrame(loop);
  };
  const start = (): void => {
    if (reduced) return;
    if (!raf) raf = requestAnimationFrame(loop);
  };

  play?.addEventListener('click', () => {
    playing = !playing;
    play.classList.toggle('is-paused', !playing);
    play.setAttribute('aria-label', playing ? 'Pause the replay' : 'Play the replay');
    last = 0;
    start();
  });
  for (const b of scenBtns) {
    b.addEventListener('click', () => {
      scen = b.dataset['scen'] as Scen;
      for (const x of scenBtns) x.classList.toggle('is-on', x === b);
      clock = scen === 'weekends' ? 120 : 0;
    });
  }

  tabs.forEach((t, i) => t.addEventListener('click', () => show(STAGES[i]!)));
  root.querySelector('.cons__tabs')?.addEventListener('keydown', (e) => {
    const k = (e as KeyboardEvent).key;
    if (k !== 'ArrowRight' && k !== 'ArrowLeft') return;
    const i = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const n = tabs[(i + (k === 'ArrowRight' ? 1 : 2)) % 3]!;
    n.focus();
    n.click();
    e.preventDefault();
  });

  const stop = (): void => {
    touched = true;
    window.clearTimeout(timer);
  };
  root.addEventListener('pointerdown', stop, { capture: true });
  root.addEventListener('keydown', stop, { capture: true });
  const advance = (): void => {
    if (touched) return;
    const i = STAGES.indexOf(stage);
    if (i >= 2) return;
    show(STAGES[i + 1]!);
    timer = window.setTimeout(advance, 8000);
  };

  show('model');
  if (reduced) return;
  const io = new IntersectionObserver(
    (e) => {
      if (!e.some((x) => x.isIntersecting)) return;
      io.disconnect();
      if (!touched) timer = window.setTimeout(advance, 8000);
    },
    { threshold: 0.35 },
  );
  io.observe(root);
}
