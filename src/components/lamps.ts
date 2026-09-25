/**
 * Lamps. Every one means something.
 *
 * In the bar, seven lamps stand for the page: the top, the five movements of
 * the launch, and the decision. Sections already passed are lit, sections
 * ahead are open rings, and the one being read is lit and beeps. Only one
 * lamp ever beeps.
 *
 * In the hero, a row of lamps between the State and Futures marks runs the
 * world forward: they light one by one from State toward Futures, the last
 * beeps, and the row starts again. Discrete, like a panel; nothing slides.
 *
 * Under reduced motion the bar lamps still follow the page, nothing beeps,
 * and the hero row rests half lit.
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
  const row = qs<HTMLElement>('[data-hero-lamps]');
  if (!row) return;
  const lamps = qsa<HTMLElement>('i', row);
  const n = lamps.length;

  const show = (lit: number, beep: boolean): void => {
    lamps.forEach((l, i) => {
      l.classList.toggle('is-lit', i < lit);
      l.classList.toggle('is-beep', beep && i === lit - 1);
    });
  };

  if (reduced()) {
    show(Math.ceil(n / 2), false);
    return;
  }

  // One step every 420ms; at the end the last lamp beeps for three beats,
  // then the row goes dark for a beat and starts again.
  const STEP = 420;
  const HOLD = 6; // steps spent beeping at the end
  const DARK = 2; // steps dark before the next run
  const cycle = n + HOLD + DARK;
  let step = 0;
  let timer = 0;
  let visible = true;

  const tick = (): void => {
    const s = step % cycle;
    if (s < n) show(s + 1, false);
    else if (s < n + HOLD) show(n, true);
    else show(0, false);
    step += 1;
  };

  const run = (): void => {
    if (timer || !visible || document.hidden) return;
    timer = window.setInterval(tick, STEP);
  };
  const halt = (): void => {
    window.clearInterval(timer);
    timer = 0;
  };

  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    if (visible) run();
    else halt();
  });
  io.observe(row);
  document.addEventListener('visibilitychange', () => (document.hidden ? halt() : run()));
  tick();
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
