/**
 * The machine's own T₀, ticking in UTC wherever the page shows it — the hero's
 * callout and the Horizon's state mark keep the same time.
 */

import { qsa } from '../lib/dom';

export function initClock(root: ParentNode = document): void {
  const hosts = qsa<HTMLElement>('[data-utc]', root);
  if (hosts.length === 0) return;

  const pad = (n: number): string => String(n).padStart(2, '0');
  const tick = (): void => {
    const d = new Date();
    const now = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
    for (const host of hosts) host.textContent = now;
  };

  tick();
  window.setInterval(tick, 1000);
}
