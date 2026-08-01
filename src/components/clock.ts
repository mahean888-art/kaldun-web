/**
 * The hero's standing clock.
 *
 * Kaldun's whole claim is that time is the input, so the page shows the actual
 * present — to the second, with a small instrument dial whose marker sweeps
 * once a minute. New York, because that is where the decisions this is built
 * for get signed.
 */

import { qs, qsa } from '../lib/dom';
import { dpr, prefersReducedMotion } from '../lib/prefers';

const ZONE = 'America/New_York';

const formatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
  timeZone: ZONE,
});

function render(nodes: HTMLElement[]): void {
  const now = formatter.format(new Date()).replace(/ /g, ' ');
  for (const node of nodes) node.textContent = now;
}

function drawDial(canvas: HTMLCanvasElement, reduced: boolean): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const size = 40;
  const ratio = dpr(2);
  canvas.width = size * ratio;
  canvas.height = size * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const c = size / 2;
  const R = size / 2 - 2;

  const paint = (): void => {
    ctx.clearRect(0, 0, size, size);

    // Ring and the twelve divisions of an instrument face.
    ctx.strokeStyle = 'rgba(16, 16, 16, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(c, c, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(16, 16, 16, 0.35)';
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.moveTo(c + Math.cos(a) * (R - 3.5), c + Math.sin(a) * (R - 3.5));
      ctx.lineTo(c + Math.cos(a) * R, c + Math.sin(a) * R);
    }
    ctx.stroke();

    // The second marker, sweeping; the minute, filled behind it.
    const ms = Date.now() % 60000;
    const a = (ms / 60000) * Math.PI * 2 - Math.PI / 2;
    ctx.strokeStyle = 'rgba(185, 31, 46, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c, c, R - 1, -Math.PI / 2, a);
    ctx.stroke();
    ctx.fillStyle = 'rgba(185, 31, 46, 0.95)';
    ctx.beginPath();
    ctx.arc(c + Math.cos(a) * (R - 1), c + Math.sin(a) * (R - 1), 2, 0, Math.PI * 2);
    ctx.fill();

    // The present at the centre.
    ctx.fillRect(c - 2, c - 2, 4, 4);
  };

  paint();
  if (!reduced) window.setInterval(paint, 500);
}

export function initClock(root: ParentNode = document): void {
  const nodes = qsa<HTMLElement>('[data-clock]', root);
  if (nodes.length === 0) return;
  const reduced = prefersReducedMotion();

  render(nodes);
  // With seconds on display, tick every second, aligned to the wall clock.
  const tick = (): void => render(nodes);
  window.setTimeout(() => {
    tick();
    window.setInterval(tick, 1000);
  }, 1000 - (Date.now() % 1000));

  const dial = qs<HTMLCanvasElement>('[data-clock-dial]', root);
  if (dial) drawDial(dial, reduced);
}
