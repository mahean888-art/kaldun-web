/**
 * The page's small machinery: scroll-in, the clock, the lamps.
 */

import { qsa } from '../lib/dom';
import { initLamps } from './lamps';
import { initHeroGrid } from './heroGrid';

/** Astromech's scroll-in: opacity 0, y 24, once, as each enters. */
function initEnter(): void {
  const items = qsa<HTMLElement>('[data-screen], .fig, .form > *');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (const el of items) el.classList.add('will-enter');
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-entered');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0 },
  );
  for (const el of items) {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-entered');
    else io.observe(el);
  }
}

/**
 * The present, kept: the time in San Francisco, to the second, with the zone
 * as it stands that day (PDT in summer, PST in winter).
 */
function initClock(): void {
  const out = document.querySelector<HTMLElement>('[data-clock]');
  if (!out) return;
  const zoneOut = document.querySelector<HTMLElement>('[data-clock-zone]');
  const tz = 'America/Los_Angeles';
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const zone = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' });
  const tick = (): void => {
    const now = new Date();
    out.textContent = fmt.format(now);
    const name = zone.formatToParts(now).find((p) => p.type === 'timeZoneName')?.value;
    if (zoneOut && name && /^P[SD]T$/.test(name)) zoneOut.textContent = name;
  };
  tick();
  window.setInterval(tick, 1000);
}

export function initHeader(): void {
  initEnter();
  initClock();
  initLamps();
  initHeroGrid();
  document.documentElement.classList.add('is-loaded');
}
