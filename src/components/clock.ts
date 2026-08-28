/**
 * The header clock: the machine's own T₀, ticking in UTC. One second of
 * resolution — the page always knows what time it believes it is.
 */

import { qs } from '../lib/dom';

export function initClock(root: ParentNode = document): void {
  const host = qs<HTMLElement>('[data-utc]', root);
  if (!host) return;

  const pad = (n: number): string => String(n).padStart(2, '0');
  const tick = (): void => {
    const d = new Date();
    host.textContent = `T₀ ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
  };

  tick();
  window.setInterval(tick, 1000);
}
