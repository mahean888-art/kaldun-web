/**
 * The hero's drawing grid, fitted to its panel.
 *
 * The panel is divided into whole cells near 144px, so every major line
 * meets the frame at the same interval on all four sides, and each cell
 * holds six fine divisions. Lines sit on half pixels so they draw at one
 * crisp pixel. The panel's own frame is the outermost line.
 */

import { qs } from '../lib/dom';

const MAJOR = 144;
const DIVISIONS = 6;
const NS = 'http://www.w3.org/2000/svg';

/** Half-pixel positions for n equal parts of a length, edges excluded. */
function stops(length: number, parts: number): number[] {
  const out: number[] = [];
  for (let i = 1; i < parts; i++) out.push(Math.round((i * length) / parts) + 0.5);
  return out;
}

function draw(host: HTMLElement): void {
  const w = host.clientWidth;
  const h = host.clientHeight;
  if (w === 0 || h === 0) return;
  if (host.dataset['fit'] === `${w}x${h}`) return;

  const cols = Math.max(2, Math.round(w / MAJOR));
  const rows = Math.max(2, Math.round(h / MAJOR));

  const majorX = stops(w, cols);
  const majorY = stops(h, rows);
  const onMajor = (set: number[], v: number): boolean => set.includes(v);
  const minorX = stops(w, cols * DIVISIONS).filter((x) => !onMajor(majorX, x));
  const minorY = stops(h, rows * DIVISIONS).filter((y) => !onMajor(majorY, y));

  const d = (xs: number[], ys: number[]): string =>
    xs.map((x) => `M${x} 0V${h}`).join('') + ys.map((y) => `M0 ${y}H${w}`).join('');

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', String(w));
  svg.setAttribute('height', String(h));
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('shape-rendering', 'crispEdges');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('data-cols', String(cols));
  svg.setAttribute('data-rows', String(rows));
  svg.innerHTML =
    `<path class="hero__grid-minor" d="${d(minorX, minorY)}" />` +
    `<path class="hero__grid-major" d="${d(majorX, majorY)}" />`;

  host.replaceChildren(svg);
  host.dataset['fit'] = `${w}x${h}`;
  host.classList.add('is-fit');
}

export function initHeroGrid(): void {
  const host = qs<HTMLElement>('.hero__grid');
  if (!host) return;
  let queued = false;
  const schedule = (): void => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      draw(host);
    });
  };
  draw(host);
  new ResizeObserver(schedule).observe(host);
}
