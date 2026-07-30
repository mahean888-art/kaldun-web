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

function render(nodes: HTMLElement[]): void {
  const now = formatter.format(new Date()).replace(/ /g, ' ');
  for (const node of nodes) node.textContent = now;
}

export function initClock(root: ParentNode = document): void {
  const nodes = qsa<HTMLElement>('[data-clock]', root);
  if (nodes.length === 0) return;
  render(nodes);
  // Aligned to the next minute, then every minute.
  const delay = 60000 - (Date.now() % 60000);
  window.setTimeout(() => {
    render(nodes);
    window.setInterval(() => render(nodes), 60000);
  }, delay);
}
