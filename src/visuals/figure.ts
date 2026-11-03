/**
 * Figure 01 — a model to explore with, a record to improve from.
 *
 * One drawn instrument, not a row of cards: five stations on a conduit
 * (Evidence, System model, Search and simulate, Evaluate alternatives,
 * Decision). Beneath it run two returns that must never be confused: the
 * search loop, in amber, from evaluation back to search, which improves the
 * alternatives inside the model; and the learning loop, dashed in charcoal,
 * from the decision through the world back to the model, which improves the
 * model against evidence. Objectives and constraints enter at the decision,
 * from the institution. Nothing runs from a proposal into execution.
 *
 * Names only on the drawing; what each stage holds is set beneath it. On a
 * phone the instrument stands upright. A mark travels the conduit and the
 * learning loop, lighting each station; the search loop turns on its own.
 * Under reduced motion everything is simply present.
 */

import { prefersReducedMotion } from '../lib/prefers';

type Layout = { svg: string; stops: Array<[number, number]> };

const NAMES = ['Evidence', 'System model', 'Search and simulate', 'Evaluate alternatives', 'Decision'];
const pad = (n: number): string => String(n).padStart(2, '0');

const head = (x: number, y: number, deg: number, cls = 'fg-head'): string =>
  `<path class="${cls}" d="M-7 -4.5L1 0L-7 4.5" transform="translate(${x} ${y}) rotate(${deg})"/>`;

function node(i: number, x: number, y: number, r: number): string {
  if (i === 4) return `<rect class="fg-seal" x="${x - r}" y="${y - r}" width="${2 * r}" height="${2 * r}" transform="rotate(45 ${x} ${y})"/>`;
  const k = Math.round(r * 0.45);
  return `<rect class="fg-node" x="${x - r}" y="${y - r}" width="${2 * r}" height="${2 * r}"/><rect class="fg-core" x="${x - k}" y="${y - k}" width="${2 * k}" height="${2 * k}"/>`;
}

function grid(w: number, h: number, step: number): string {
  let d = '';
  for (let x = step; x < w; x += step) d += `M${x + 0.5} 0V${h}`;
  for (let y = step; y < h; y += step) d += `M0 ${y + 0.5}H${w}`;
  return `<path class="fg-grid" d="${d}"/>`;
}

function landscape(): Layout {
  const W = 1200;
  const H = 480;
  const X = [110, 355, 600, 845, 1090];
  const Y = 220;
  const G = 22;
  const LY = 392;
  const wires = X.slice(0, -1)
    .map((x, i) => `<path class="fg-wire" d="M${x + G} ${Y}H${X[i + 1]! - G}"/>${head(X[i + 1]! - G, Y, 0)}`)
    .join('');
  const stations = X.map(
    (x, i) => `<g class="fg-st" data-st="${i}">
      <text class="fg-idx" x="${x}" y="${Y - 82}" text-anchor="middle">${pad(i + 1)}</text>
      <text class="fg-name" x="${x}" y="${Y - 40}" text-anchor="middle">${NAMES[i]}</text>
      ${node(i, x, Y, i === 4 ? 10 : 8)}
    </g>`,
  ).join('');
  const search = `<g class="fg-search"><path class="fg-loop-s" d="M${X[3]} ${Y + G}C${X[3]} ${Y + 110} ${X[2]} ${Y + 110} ${X[2]} ${Y + G}"/>${head(X[2]!, Y + G, -90, 'fg-head fg-head--am')}
    <text class="fg-lab fg-lab--am" x="${(X[2]! + X[3]!) / 2}" y="${Y + 112}" text-anchor="middle">SEARCH LOOP · SIMULATION TESTS ALTERNATIVES</text></g>`;
  const learning = `<g class="fg-learning"><path class="fg-loop-l" d="M${X[4]} ${Y + G}V${LY}H${X[1]}V${Y + G}"/>${head(X[1]!, Y + G, -90, 'fg-head')}
    <text class="fg-lab fg-lab--ink" x="${(X[1]! + X[4]!) / 2}" y="${LY + 30}" text-anchor="middle">LEARNING LOOP · OUTCOMES TEST THE MODEL</text></g>`;
  const ix = 1166;
  const input = `<g class="fg-input"><text class="fg-lab fg-lab--ink" x="${ix + 20}" y="44" text-anchor="end">OBJECTIVES AND CONSTRAINTS</text>
    <path class="fg-in" d="M${ix} 82V${Y}H${X[4]! + 18}"/>${head(X[4]! + 18, Y, 180)}</g>`;
  const route = `M${X[0]} ${Y}H${X[4]}V${LY}H${X[1]}V${Y}`;
  return {
    svg: `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">${grid(W, H, 60)}${search}${learning}${wires}${input}${stations}
      <rect class="fg-token" x="-6" y="-6" width="12" height="12" data-token/><path class="fg-route" d="${route}" data-route/></svg>`,
    stops: X.map((x) => [x, Y] as [number, number]),
  };
}

function portrait(): Layout {
  const W = 640;
  const SX = 230;
  const LX = 280;
  const Y = [170, 340, 510, 680, 850];
  const H = 1060;
  const G = 24;
  const LXL = 70;
  const wires = Y.slice(0, -1)
    .map((y, i) => `<path class="fg-wire" d="M${SX} ${y + G}V${Y[i + 1]! - G}"/>${head(SX, Y[i + 1]! - G, 90)}`)
    .join('');
  const stations = Y.map(
    (y, i) => `<g class="fg-st" data-st="${i}">
      <text class="fg-idx" x="${LX}" y="${y - 22}">${pad(i + 1)}</text>
      <text class="fg-name" x="${LX}" y="${y + 18}">${NAMES[i]}</text>
      ${node(i, SX, y, i === 4 ? 13 : 11)}
    </g>`,
  ).join('');
  const sx = 150;
  const search = `<g class="fg-search"><path class="fg-loop-s" d="M${SX - G} ${Y[3]}C${sx} ${Y[3]} ${sx} ${Y[2]} ${SX - G} ${Y[2]}"/>${head(SX - G, Y[2]!, 0, 'fg-head fg-head--am')}
    <text class="fg-lab fg-lab--am" x="${sx - 26}" y="${(Y[2]! + Y[3]!) / 2}" transform="rotate(-90 ${sx - 26} ${(Y[2]! + Y[3]!) / 2})" text-anchor="middle">SEARCH LOOP</text></g>`;
  const by = H - 60;
  const learning = `<g class="fg-learning"><path class="fg-loop-l" d="M${SX} ${Y[4]! + G}V${by}H${LXL}V${Y[1]}H${SX - G}"/>${head(SX - G, Y[1]!, 0)}
    <text class="fg-lab fg-lab--ink" x="${LXL - 22}" y="${(Y[1]! + by) / 2}" transform="rotate(-90 ${LXL - 22} ${(Y[1]! + by) / 2})" text-anchor="middle">LEARNING LOOP</text>
</g>`;
  const input = `<g class="fg-input"><text class="fg-lab fg-lab--ink" x="${LX}" y="${Y[4]! + 70}">OBJECTIVES AND CONSTRAINTS</text>
    <path class="fg-in" d="M${LX - 14} ${Y[4]! + 64}H${SX + 34}V${Y[4]! + 22}"/>${head(SX + 34, Y[4]! + 20, -90)}</g>`;
  const route = `M${SX} ${Y[0]}V${by}H${LXL}V${Y[1]}H${SX}`;
  return {
    svg: `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">${grid(W, H, 80)}${search}${learning}${wires}${input}${stations}
      <rect class="fg-token" x="-8" y="-8" width="16" height="16" data-token/><path class="fg-route" d="${route}" data-route/></svg>`,
    stops: Y.map((y) => [SX, y] as [number, number]),
  };
}

export function initFigure(fig: HTMLElement): void {
  const art = fig.querySelector<HTMLElement>('[data-f1-art]');
  if (!art) return;
  const reduced = prefersReducedMotion();
  const narrow = window.matchMedia('(max-width: 759px)');
  let seen = false;

  /** One tracing pulse along each loop, once, when the figure is first seen. */
  const pulse = (): void => {
    if (reduced) return;
    for (const loop of art.querySelectorAll<SVGPathElement>('.fg-loop-s, .fg-loop-l')) {
      const p = loop.cloneNode() as SVGPathElement;
      p.setAttribute('class', `fg-pulse${loop.classList.contains('fg-loop-s') ? ' fg-pulse--s' : ''}`);
      p.setAttribute('pathLength', '100');
      loop.after(p);
    }
  };

  const build = (): void => {
    const l = narrow.matches ? portrait() : landscape();
    art.innerHTML = l.svg;
    art.classList.toggle('is-portrait', narrow.matches);
    art.querySelector('[data-token]')?.remove();
    if (seen) art.classList.add('is-seen');
  };

  const io = new IntersectionObserver(
    (e) => {
      if (!e.some((x) => x.isIntersecting)) return;
      io.disconnect();
      seen = true;
      pulse();
      art.classList.add('is-seen');
    },
    { threshold: 0.4 },
  );
  io.observe(art);
  narrow.addEventListener('change', build);
  build();
}
