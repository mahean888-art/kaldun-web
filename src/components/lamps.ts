/**
 * Lamps. Every one means something.
 *
 * In the bar, seven lamps stand for the page: the top, the five movements of
 * the launch, and the decision. Sections already passed are lit, sections
 * ahead are open rings, and the one being read is lit and beeps. Only one
 * lamp ever beeps.
 *
 * Beneath the hero's panel, a strip of lamp clusters, as on a machine's
 * console: the last lamp beeps, and a few others change state slowly.
 *
 * Under reduced motion the bar lamps still follow the page, and nothing
 * beeps or changes.
 */

import { qs, qsa } from '../lib/dom';

const reduced = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initBarLamps(): void {
  const lamps = qsa<HTMLAnchorElement>('[data-lamps] a');
  if (lamps.length === 0) return;
  const stops = lamps
    .map((a) => document.querySelector<HTMLElement>(a.getAttribute('href') ?? ''))
    .filter((el): el is HTMLElement => el !== null);
  if (stops.length !== lamps.length) return;

  let current = -1;
  const update = (): void => {
    // The section being read is the last one whose top has passed a line a
    // third of the way down the screen; at the very bottom, the last one.
    const line = window.innerHeight * 0.34;
    let at = 0;
    stops.forEach((el, i) => {
      if (el.getBoundingClientRect().top <= line) at = i;
    });
    const end = document.documentElement.scrollHeight - window.innerHeight - 2;
    if (window.scrollY >= end) at = stops.length - 1;
    if (at === current) return;
    current = at;
    lamps.forEach((a, i) => {
      a.classList.toggle('is-past', i < at);
      a.classList.toggle('is-on', i === at);
      if (i === at) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
  };

  let queued = false;
  const onScroll = (): void => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      update();
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
}

function initHeroLamps(): void {
  const strip = qs<HTMLElement>('[data-hero-lamps]');
  if (!strip) return;
  const lamps = qsa<HTMLElement>('i:not(.gap)', strip);
  if (lamps.length === 0) return;

  // The last lamp beeps. A few others change state on their own slow,
  // staggered periods, so the panel is alive without flickering.
  lamps[lamps.length - 1]!.classList.add('is-beep');
  if (reduced()) return;

  const blinkers: Array<[number, number]> = [
    [2, 2600],
    [9, 3900],
    [15, 3100],
    [24, 5200],
    [31, 4400],
  ];
  let timers: number[] = [];
  let visible = true;

  const run = (): void => {
    if (timers.length || !visible || document.hidden) return;
    timers = blinkers
      .filter(([i]) => lamps[i])
      .map(([i, ms]) => window.setInterval(() => lamps[i]!.classList.toggle('is-alt'), ms));
  };
  const halt = (): void => {
    for (const t of timers) window.clearInterval(t);
    timers = [];
  };

  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    if (visible) run();
    else halt();
  });
  io.observe(strip);
  document.addEventListener('visibilitychange', () => (document.hidden ? halt() : run()));
  run();
}

/** The footer's wordmark scans in, top to bottom, once. */
function initFootMark(): void {
  const mark = qs<HTMLElement>('[data-foot-mark]');
  if (!mark || reduced()) return;
  mark.classList.add('will-scan');
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      mark.classList.add('is-scanned');
      io.disconnect();
    },
    { threshold: 0.35 },
  );
  io.observe(mark);
}

export function initLamps(): void {
  initBarLamps();
  initHeroLamps();
  initFootMark();
}
