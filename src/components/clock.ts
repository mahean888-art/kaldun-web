/**
 * The hero's standing clock.
 *
 * Kaldun's whole claim is that time is the input, so the page shows the actual
 * present rather than a static string. New York, because that is where the
 * decisions this is built for get signed.
 */

import { qsa } from '../lib/dom';

const ZONE = 'America/New_York';

const formatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: ZONE,
});

/** "3:45PM" — no space, the way a readout prints it. */
function now(): string {
  return formatter
    .format(new Date())
    .replace(/ |\s/g, '')
    .toUpperCase();
}

export function initClock(root: ParentNode = document): void {
  const nodes = qsa<HTMLElement>('[data-clock]', root);
  if (nodes.length === 0) return;

  const render = (): void => {
    const value = now();
    for (const node of nodes) node.textContent = value;
  };

  render();
  // Aligned to the next minute, then every minute.
  window.setTimeout(() => {
    render();
    window.setInterval(render, 60000);
  }, 60000 - (Date.now() % 60000));
}
