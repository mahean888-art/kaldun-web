/**
 * The hero's lamp strip, alive: a few lamps hold steady and breathe, the rest
 * flicker on and off at their own slow rhythms, like a machine at work.
 */
import { prefersReducedMotion } from '../lib/prefers';

export function initLeds(): void {
  const strip = document.querySelector<HTMLElement>('[data-clusters]');
  if (!strip || prefersReducedMotion()) return;
  const lamps = Array.from(strip.querySelectorAll<HTMLElement>('i.d, i.l'));
  if (!lamps.length) return;
  lamps.forEach((l, k) => { if (k % 5 === 2) l.classList.add('is-pulse'); });
  const flick = lamps.filter((_, k) => k % 5 !== 2);
  let t = 0;
  const tick = (): void => {
    if (!document.hidden) {
      for (let n = 0; n < 3; n++) {
        const l = flick[Math.floor(Math.random() * flick.length)]!;
        if (l.classList.contains('is-on')) { l.classList.remove('is-on'); l.classList.add('is-off'); }
        else if (l.classList.contains('is-off')) l.classList.remove('is-off');
        else l.classList.add(l.classList.contains('d') ? 'is-on' : 'is-off');
      }
    }
    t = window.setTimeout(tick, 420 + Math.random() * 520);
  };
  t = window.setTimeout(tick, 1600);
  void t;
}
