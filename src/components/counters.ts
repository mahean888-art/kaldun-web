/**
 * Numeric counters that settle on their real value when scrolled into view.
 * The final value is written in the HTML, so a reader without JS sees the truth.
 *
 *   <span data-count="945" data-count-suffix=" TWh">945 TWh</span>
 */

import { qsa } from '../lib/dom';
import { easeOutCubic } from '../lib/math';
import { prefersReducedMotion } from '../lib/prefers';

const DURATION = 1250;

function animate(node: HTMLElement): void {
  const target = Number(node.dataset.count ?? '0');
  if (!Number.isFinite(target)) return;
  const decimals = Number(node.dataset.countDecimals ?? '0');
  const prefix = node.dataset.countPrefix ?? '';
  const suffix = node.dataset.countSuffix ?? '';
  const start = performance.now();

  const write = (value: number): void => {
    node.textContent = `${prefix}${value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`;
  };

  const frame = (now: number): void => {
    const t = Math.min((now - start) / DURATION, 1);
    write(target * easeOutCubic(t));
    if (t < 1) requestAnimationFrame(frame);
  };

  write(0);
  requestAnimationFrame(frame);
}

export function initCounters(root: ParentNode = document): void {
  const nodes = qsa<HTMLElement>('[data-count]', root);
  if (nodes.length === 0 || prefersReducedMotion()) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        animate(entry.target as HTMLElement);
      }
    },
    { threshold: 0.5 },
  );

  for (const node of nodes) io.observe(node);
}
