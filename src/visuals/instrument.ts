/**
 * The loop, as one instrument.
 *
 * Five stations on a strict grid: State, Evidence and Decision across the
 * top; Futures under Decision and Outcomes under State. The commitment is
 * sealed on the conduit under Evidence, and the return arm closes the loop
 * up the left: update the model. Between Futures and the commitment the
 * conduit opens into three paths and closes again: the futures that could
 * unfold, and the claim that is fixed before one of them does.
 *
 * On entering, the conduits draw in. Then one amber mark travels the loop,
 * pausing at each station and lighting it, and goes round again. It runs
 * only while the figure is on screen and the tab is visible. Under reduced
 * motion everything is simply present and nothing travels.
 */

import { prefersReducedMotion } from '../lib/prefers';

export type InstrumentHandle = { destroy: () => void };

type Station = { key: string; name: string; sub: string };
type Point = { x: number; y: number };
type Stop = { key: string; p: Point };

const STATIONS: Station[] = [
  { key: 'state', name: 'State', sub: 'What is known now' },
  { key: 'evidence', name: 'Evidence', sub: 'What changes the model' },
  { key: 'decision', name: 'Decision', sub: 'The action being tested' },
  { key: 'futures', name: 'Futures', sub: 'How consequences could unfold' },
  { key: 'outcomes', name: 'Outcomes', sub: 'What happened, and how it compared' },
];

const RETURN_LABEL = 'UPDATE THE MODEL';
const COMMIT_LABEL = 'COMMITMENT';

const DRAW_MS = 900;
const HOLD_MS = 1100;

/** The chart paper inside the plate: a faint 40-unit lattice. */
const DEFS = `
  <defs>
    <pattern id="ins-lattice" x="-20" y="-20" width="40" height="40" patternUnits="userSpaceOnUse">
      <path class="ins__lattice" d="M 17 20 H 23 M 20 17 V 23" />
    </pattern>
    <linearGradient id="ins-fade-x" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0" stop-color="#fa9801" stop-opacity="0.6" />
      <stop offset="1" stop-color="#fa9801" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="ins-fade-y" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fa9801" stop-opacity="0.6" />
      <stop offset="1" stop-color="#fa9801" stop-opacity="0" />
    </linearGradient>
  </defs>`;

const pad = (n: number): string => String(n).padStart(2, '0');

/** A station: index, name, node, caption. Labels centred over the node. */
function stationAcross(s: Station, i: number, x: number, y: number): string {
  return `
    <g class="ins__station" data-station="${s.key}" data-x="${x}" data-y="${y}">
      <text class="ins__idx" x="${x}" y="${y - 74}" text-anchor="middle">${pad(i + 1)}</text>
      <text class="ins__name" x="${x}" y="${y - 28}" text-anchor="middle">${s.name}</text>
      <rect class="ins__node" x="${x - 7}" y="${y - 7}" width="14" height="14" />
      <rect class="ins__core" x="${x - 3}" y="${y - 3}" width="6" height="6" />
      <text class="ins__sub" x="${x}" y="${y + 46}" text-anchor="middle">${s.sub}</text>
    </g>`;
}

/** A station beside a vertical spine: labels to the right of the node. */
function stationBeside(s: Station, i: number, x: number, y: number, lx: number): string {
  return `
    <g class="ins__station" data-station="${s.key}" data-x="${x}" data-y="${y}">
      <text class="ins__idx" x="${lx}" y="${y - 30}">${pad(i + 1)}</text>
      <text class="ins__name" x="${lx}" y="${y + 14}">${s.name}</text>
      <rect class="ins__node" x="${x - 9}" y="${y - 9}" width="18" height="18" />
      <rect class="ins__core" x="${x - 4}" y="${y - 4}" width="8" height="8" />
      <text class="ins__sub" x="${lx}" y="${y + 52}">${lines(s.sub)
        .map((t, n) => `<tspan x="${lx}" dy="${n === 0 ? 0 : 34}">${t}</tspan>`)
        .join('')}</text>
    </g>`;
}

/** A caption too long for the narrow plate breaks after its comma. */
function lines(text: string): string[] {
  const at = text.indexOf(', ');
  return text.length > 26 && at > 0 ? [text.slice(0, at + 1), text.slice(at + 2)] : [text];
}

/** The commitment: a sealed diamond across the conduit, labelled. */
function commitment(x: number, y: number, label: string, vertical: boolean): string {
  const tick = vertical
    ? `<path class="ins__tick" d="M ${x - 22} ${y} H ${x + 22}" />`
    : `<path class="ins__tick" d="M ${x} ${y - 20} V ${y + 20}" />`;
  return `
    <g class="ins__commit" data-station="commitment" data-marker data-x="${x}" data-y="${y}">
      ${tick}
      <rect class="ins__seal" x="${x - 7}" y="${y - 7}" width="14" height="14" transform="rotate(45 ${x} ${y})" />
      ${label}
    </g>`;
}

type Layout = { svg: string; stops: Stop[] };

/**
 * Wide screens: a 3 × 2 grid. Columns at 240, 600, 960 — at full width,
 * one to one with the page, so the outer two stand on the essay's edges and
 * the middle one on its centre. Conduits at 120 and 360, on the plate's own
 * 40-unit lattice; the bend down the right at 1100, the return up the left
 * at 100.
 */
function landscape(): Layout {
  const C = [240, 600, 960];
  const T = 120;
  const B = 360;
  const R = 1100;
  const L = 100;
  const K = 22; // corner radius
  const G = 20; // where a conduit stops short of a node
  const W = 1200;
  const H = 460;

  const stops: Stop[] = [
    { key: 'state', p: { x: C[0]!, y: T } },
    { key: 'evidence', p: { x: C[1]!, y: T } },
    { key: 'decision', p: { x: C[2]!, y: T } },
    { key: 'futures', p: { x: C[2]!, y: B } },
    { key: 'commitment', p: { x: C[1]!, y: B } },
    { key: 'outcomes', p: { x: C[0]!, y: B } },
  ];

  const wires = [
    `<path class="ins__wire" data-arrow d="M ${C[0]! + G} ${T} H ${C[1]! - G}" />`,
    `<path class="ins__wire" data-arrow d="M ${C[1]! + G} ${T} H ${C[2]! - G}" />`,
    `<path class="ins__wire" data-arrow d="M ${C[2]! + G} ${T} H ${R - K} Q ${R} ${T} ${R} ${T + K} V ${B - K} Q ${R} ${B} ${R - K} ${B} H ${C[2]! + G}" />`,
    `<path class="ins__wire" data-arrow d="M ${C[2]! - G} ${B} H ${C[1]! + G}" />`,
    `<path class="ins__wire" data-arrow d="M ${C[1]! - G} ${B} H ${C[0]! + G}" />`,
    `<path class="ins__wire ins__wire--return" data-arrow d="M ${C[0]! - G} ${B} H ${L + K} Q ${L} ${B} ${L} ${B - K} V ${T + K} Q ${L} ${T} ${L + K} ${T} H ${C[0]! - G}" />`,
  ].join('');

  // The futures: past the station the conduit opens into three thin paths.
  // The middle one is the conduit itself; the outer two part and fade.
  const s = 14;
  const a = C[2]! - G;
  const fan = `
    <g class="ins__fan" data-fan>
      <path d="M ${a} ${B} C ${a - 36} ${B}, ${a - 44} ${B - s}, ${a - 80} ${B - s} H ${a - 190}" />
      <path d="M ${a} ${B} C ${a - 36} ${B}, ${a - 44} ${B + s}, ${a - 80} ${B + s} H ${a - 190}" />
    </g>`;

  const stations = [
    stationAcross(STATIONS[0]!, 0, C[0]!, T),
    stationAcross(STATIONS[1]!, 1, C[1]!, T),
    stationAcross(STATIONS[2]!, 2, C[2]!, T),
    stationAcross(STATIONS[3]!, 3, C[2]!, B),
    stationAcross(STATIONS[4]!, 4, C[0]!, B),
  ].join('');

  const commit = commitment(
    C[1]!,
    B,
    `<text class="ins__label" x="${C[1]}" y="${B + 46}" text-anchor="middle">${COMMIT_LABEL}</text>`,
    false,
  );

  const mid = (T + B) / 2;
  const svg = `
  <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${DEFS}
    <rect class="ins__paper" x="0" y="0" width="${W}" height="${H}" fill="url(#ins-lattice)" />
    ${fan}
    ${wires}
    ${stations}
    ${commit}
    <text class="ins__label ins__label--return" x="${L - 16}" y="${mid}" transform="rotate(-90 ${L - 16} ${mid})" text-anchor="middle">${RETURN_LABEL}</text>
    <rect class="ins__token" x="-6" y="-6" width="12" height="12" data-token />
    <path class="ins__route" data-loop d="M ${C[0]} ${T} H ${R - K} Q ${R} ${T} ${R} ${T + K} V ${B - K} Q ${R} ${B} ${R - K} ${B} H ${L + K} Q ${L} ${B} ${L} ${B - K} V ${T + K} Q ${L} ${T} ${L + K} ${T} H ${C[0]}" />
  </svg>`;
  return { svg, stops };
}

/** Narrow screens: the same loop, standing, with labels beside the spine. */
function portrait(): Layout {
  const X = 120;
  const LX = 172;
  const RET = 48;
  const K = 22;
  const G = 22;
  const Y = { state: 100, evidence: 280, decision: 460, futures: 640, commitment: 840, outcomes: 980 };
  const W = 640;
  const H = 1120;

  const stops: Stop[] = (['state', 'evidence', 'decision', 'futures', 'commitment', 'outcomes'] as const).map(
    (key) => ({ key, p: { x: X, y: Y[key] } }),
  );

  const wires = [
    `<path class="ins__wire" data-arrow d="M ${X} ${Y.state + G} V ${Y.evidence - G}" />`,
    `<path class="ins__wire" data-arrow d="M ${X} ${Y.evidence + G} V ${Y.decision - G}" />`,
    `<path class="ins__wire" data-arrow d="M ${X} ${Y.decision + G} V ${Y.futures - G}" />`,
    `<path class="ins__wire" data-arrow d="M ${X} ${Y.futures + G} V ${Y.commitment - G}" />`,
    `<path class="ins__wire" data-arrow d="M ${X} ${Y.commitment + G} V ${Y.outcomes - G}" />`,
    `<path class="ins__wire ins__wire--return" data-arrow d="M ${X - G} ${Y.outcomes} H ${RET + K} Q ${RET} ${Y.outcomes} ${RET} ${Y.outcomes - K} V ${Y.state + K} Q ${RET} ${Y.state} ${RET + K} ${Y.state} H ${X - G}" />`,
  ].join('');

  const s = 16;
  const a = Y.futures + G;
  const fan = `
    <g class="ins__fan ins__fan--down" data-fan>
      <path d="M ${X} ${a} C ${X} ${a + 30}, ${X - s} ${a + 38}, ${X - s} ${a + 70} V ${a + 150}" />
      <path d="M ${X} ${a} C ${X} ${a + 30}, ${X + s} ${a + 38}, ${X + s} ${a + 70} V ${a + 150}" />
    </g>`;

  const stations = [
    stationBeside(STATIONS[0]!, 0, X, Y.state, LX),
    stationBeside(STATIONS[1]!, 1, X, Y.evidence, LX),
    stationBeside(STATIONS[2]!, 2, X, Y.decision, LX),
    stationBeside(STATIONS[3]!, 3, X, Y.futures, LX),
    stationBeside(STATIONS[4]!, 4, X, Y.outcomes, LX),
  ].join('');

  const commit = commitment(
    X,
    Y.commitment,
    `<text class="ins__label" x="${LX}" y="${Y.commitment + 7}">${COMMIT_LABEL}</text>`,
    true,
  );

  const mid = (Y.state + Y.outcomes) / 2;
  const svg = `
  <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${DEFS}
    <rect class="ins__paper" x="0" y="0" width="${W}" height="${H}" fill="url(#ins-lattice)" />
    ${fan}
    ${wires}
    ${stations}
    ${commit}
    <text class="ins__label ins__label--return" x="${RET - 16}" y="${mid}" transform="rotate(-90 ${RET - 16} ${mid})" text-anchor="middle">${RETURN_LABEL}</text>
    <rect class="ins__token" x="-7" y="-7" width="14" height="14" data-token />
    <path class="ins__route" data-loop d="M ${X} ${Y.state} V ${Y.outcomes} H ${RET + K} Q ${RET} ${Y.outcomes} ${RET} ${Y.outcomes - K} V ${Y.state + K} Q ${RET} ${Y.state} ${RET + K} ${Y.state} H ${X}" />
  </svg>`;
  return { svg, stops };
}

export function initInstrument(host: HTMLElement): InstrumentHandle {
  const fig = host.querySelector<HTMLElement>('[data-instrument-figure]');
  if (!fig) return { destroy: () => undefined };

  const reduced = prefersReducedMotion();
  const narrow = window.matchMedia('(max-width: 759px)');

  let wires: SVGPathElement[] = [];
  let played = false;
  let visible = false;
  let raf = 0;
  let startTimer = 0;

  // The travelling mark.
  let token: SVGRectElement | null = null;
  let route: SVGPathElement | null = null;
  let marks: Array<{ key: string; at: number }> = [];
  let total = 0;
  let pos = 0;
  let next = 0;
  let holdUntil = 0;
  let last = 0;
  let speed = 0.24;

  /** A chevron at the end of a conduit, so its direction is never in doubt. */
  const addHead = (path: SVGPathElement): void => {
    const len = path.getTotalLength();
    const tip = path.getPointAtLength(len);
    const back = path.getPointAtLength(Math.max(0, len - 6));
    const angle = (Math.atan2(tip.y - back.y, tip.x - back.x) * 180) / Math.PI;
    const head = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    head.setAttribute('d', 'M -7 -4.5 L 1 0 L -7 4.5');
    head.setAttribute('class', path.classList.contains('ins__wire--return') ? 'ins__head ins__head--return' : 'ins__head');
    head.setAttribute('transform', `translate(${tip.x} ${tip.y}) rotate(${angle.toFixed(1)})`);
    path.parentNode?.insertBefore(head, path.nextSibling);
  };

  const light = (key: string | null): void => {
    for (const g of fig.querySelectorAll<SVGGElement>('[data-station]')) {
      if (g.dataset['station'] === key) g.setAttribute('data-live', '');
      else g.removeAttribute('data-live');
    }
  };

  const place = (at: number): void => {
    if (!token || !route) return;
    const p = route.getPointAtLength(at);
    token.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);
  };

  /** Where along the route each stop lies, found by sampling the route. */
  const measure = (stops: Stop[]): void => {
    if (!route) return;
    total = route.getTotalLength();
    const step = 2;
    marks = stops.map((s) => {
      let best = 0;
      let bestD = Infinity;
      for (let l = 0; l <= total; l += step) {
        const p = route!.getPointAtLength(l);
        const d = (p.x - s.p.x) ** 2 + (p.y - s.p.y) ** 2;
        if (d < bestD) {
          bestD = d;
          best = l;
        }
      }
      // Then finely, either side of the coarse answer.
      for (let l = Math.max(0, best - step); l <= Math.min(total, best + step); l += 0.05) {
        const p = route!.getPointAtLength(l);
        const d = (p.x - s.p.x) ** 2 + (p.y - s.p.y) ** 2;
        if (d < bestD) {
          bestD = d;
          best = l;
        }
      }
      return { key: s.key, at: s.key === 'state' ? 0 : best };
    });
    marks.sort((m, n) => m.at - n.at);
  };

  const tick = (now: number): void => {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(50, now - (last || now));
    last = now;
    if (now < holdUntil) return;

    const target = next < marks.length ? marks[next]!.at : total;
    pos = Math.min(target, pos + dt * speed);
    place(pos);

    if (pos >= target) {
      if (next >= marks.length) {
        // Back at the start: State again.
        pos = 0;
        next = 1;
        light('state');
      } else {
        light(marks[next]!.key);
        next += 1;
      }
      holdUntil = now + HOLD_MS;
    } else if (pos > 0) {
      light(null);
    }
  };

  const run = (): void => {
    if (reduced || raf || !visible || document.hidden || !token || marks.length === 0) return;
    token.style.opacity = '1';
    last = 0;
    raf = requestAnimationFrame(tick);
  };

  const halt = (): void => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  const drawIn = (): void => {
    wires.forEach((w, i) => {
      const length = w.getTotalLength();
      w.style.transition = 'none';
      w.style.strokeDasharray = `${length}`;
      w.style.strokeDashoffset = `${length}`;
      w.getBoundingClientRect();
      w.style.transition = `stroke-dashoffset ${DRAW_MS}ms ${120 * i}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      w.style.strokeDashoffset = '0';
    });
    window.setTimeout(() => {
      for (const w of wires) addHead(w);
    }, DRAW_MS * 0.8);
    startTimer = window.setTimeout(() => {
      light('state');
      next = 1;
      pos = 0;
      holdUntil = performance.now() + HOLD_MS;
      run();
    }, DRAW_MS + 120 * wires.length);
  };

  const build = (): void => {
    halt();
    window.clearTimeout(startTimer);
    const layout = narrow.matches ? portrait() : landscape();
    fig.classList.toggle('is-portrait', narrow.matches);
    fig.innerHTML = layout.svg;
    wires = Array.from(fig.querySelectorAll<SVGPathElement>('[data-arrow]'));
    token = fig.querySelector<SVGRectElement>('[data-token]');
    route = fig.querySelector<SVGPathElement>('[data-loop]');
    speed = narrow.matches ? 0.2 : 0.24;
    measure(layout.stops);
    place(0);

    if (reduced) {
      token?.remove();
      token = null;
      for (const w of wires) addHead(w);
      return;
    }
    if (token) token.style.opacity = '0';
    if (played) {
      for (const w of wires) addHead(w);
      light('state');
      pos = 0;
      next = 1;
      holdUntil = performance.now() + HOLD_MS;
      run();
    }
  };

  build();
  const onBreak = (): void => build();
  narrow.addEventListener('change', onBreak);

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible && !played) {
        played = true;
        if (reduced) return;
        drawIn();
      } else if (visible) {
        run();
      } else {
        halt();
      }
    },
    { threshold: 0.15 },
  );
  io.observe(fig);

  const onVisibility = (): void => {
    if (document.hidden) halt();
    else run();
  };
  document.addEventListener('visibilitychange', onVisibility);

  return {
    destroy: () => {
      halt();
      window.clearTimeout(startTimer);
      io.disconnect();
      narrow.removeEventListener('change', onBreak);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
