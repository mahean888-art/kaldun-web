/**
 * The learning loop, as one instrument.
 *
 * Six stations on a strict grid, read clockwise: Observe, Model and Compare
 * actions across the top; Record expectations, Evaluate outcomes and Test
 * corrections back along the bottom. Past Compare actions the conduit opens
 * into three paths: the options, each run forward. Record expectations is
 * the sealed diamond, the point past which the claim cannot change. The
 * return arm closes the loop up the left: keep the original forecast.
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
  { key: 'observe', name: 'Observe', sub: 'Evidence as it arrives' },
  { key: 'model', name: 'Model', sub: 'The institution and its world' },
  { key: 'compare', name: 'Compare actions', sub: 'Each option run forward' },
  { key: 'record', name: 'Record expectations', sub: 'Committed before the outcome' },
  { key: 'evaluate', name: 'Evaluate outcomes', sub: 'Scored against what happened' },
  { key: 'test', name: 'Test corrections', sub: 'On cases held out' },
];

const RETURN_LABEL = 'KEEP THE ORIGINAL FORECAST';

const DRAW_MS = 900;
const HOLD_MS = 1100;

const DEFS = `
  <defs>
    <linearGradient id="ins-fade-x" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0" stop-color="#fa9801" stop-opacity="0.6" />
      <stop offset="1" stop-color="#fa9801" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="ins-fade-xr" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fa9801" stop-opacity="0.6" />
      <stop offset="1" stop-color="#fa9801" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="ins-fade-y" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fa9801" stop-opacity="0.6" />
      <stop offset="1" stop-color="#fa9801" stop-opacity="0" />
    </linearGradient>
  </defs>`;

const pad = (n: number): string => String(n).padStart(2, '0');

/**
 * The drawing grid under the loop: fine lines on a module, as elsewhere on the
 * site, with none on the plate's own edges. Lines sit on half units so they
 * draw one crisp pixel wide at one to one, exactly where the launch screen's
 * grid lines fall.
 */
function grid(w: number, h: number, major: number, minor = 0): string {
  const steps = (length: number, step: number): number[] => {
    const out: number[] = [];
    for (let v = step; v < length; v += step) out.push(v);
    return out;
  };
  const lines = (xs: number[], ys: number[]): string =>
    xs.map((x) => `M${x + 0.5} 0V${h}`).join('') + ys.map((y) => `M0 ${y + 0.5}H${w}`).join('');
  const off = (v: number): boolean => v % major !== 0;
  const minors = minor ? lines(steps(w, minor).filter(off), steps(h, minor).filter(off)) : '';
  return (
    (minors ? `<path class="ins__grid ins__grid--minor" d="${minors}" />` : '') +
    `<path class="ins__grid ins__grid--major" d="${lines(steps(w, major), steps(h, major))}" />`
  );
}

/** A station's node: an open square with a core, or, where expectations are
    recorded, the sealed diamond across the conduit. */
function node(key: string, x: number, y: number, r: number, vertical: boolean): string {
  if (key === 'record') {
    const tick = vertical
      ? `<path class="ins__tick" d="M ${x - 3 * r} ${y} H ${x + 3 * r}" />`
      : `<path class="ins__tick" d="M ${x} ${y - 3 * r} V ${y + 3 * r}" />`;
    return `${tick}<rect class="ins__seal" x="${x - r}" y="${y - r}" width="${2 * r}" height="${2 * r}" transform="rotate(45 ${x} ${y})" />`;
  }
  const c = Math.round(r * 0.45);
  return `<rect class="ins__node" x="${x - r}" y="${y - r}" width="${2 * r}" height="${2 * r}" />
      <rect class="ins__core" x="${x - c}" y="${y - c}" width="${2 * c}" height="${2 * c}" />`;
}

/** A station: index, name, node, caption. Labels centred over the node. */
function stationAcross(s: Station, i: number, x: number, y: number): string {
  return `
    <g class="ins__station" data-station="${s.key}" data-x="${x}" data-y="${y}">
      <text class="ins__idx" x="${x}" y="${y - 74}" text-anchor="middle">${pad(i + 1)}</text>
      <text class="ins__name" x="${x}" y="${y - 28}" text-anchor="middle">${s.name}</text>
      ${node(s.key, x, y, 7, false)}
      <text class="ins__sub" x="${x}" y="${y + 46}" text-anchor="middle">${s.sub}</text>
    </g>`;
}

/** A station beside a vertical spine: labels to the right of the node. */
function stationBeside(s: Station, i: number, x: number, y: number, lx: number): string {
  return `
    <g class="ins__station" data-station="${s.key}" data-x="${x}" data-y="${y}">
      <text class="ins__idx" x="${lx}" y="${y - 30}">${pad(i + 1)}</text>
      <text class="ins__name" x="${lx}" y="${y + 14}">${s.name}</text>
      ${node(s.key, x, y, 9, true)}
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

type Layout = { svg: string; stops: Stop[] };

/**
 * Wide screens: a 3 × 2 grid. Columns at 240, 600, 960 — at full width,
 * one to one with the page, so the outer two stand on the essay's edges and
 * the middle one on its centre. Conduits at 240 and 480, with the first row
 * of the plate left for the figure's heading. Under it all, the site's
 * drawing grid: majors every 120 (the launch screen's own lines, so each
 * station and both conduits sit on one), minors every 24. The bend down the
 * right at 1100, the return up the left at 100.
 */
function landscape(): Layout {
  const C = [240, 600, 960];
  const T = 240;
  const B = 480;
  const R = 1100;
  const L = 100;
  const K = 22; // corner radius
  const G = 20; // where a conduit stops short of a node
  const W = 1200;
  const H = 600;

  const at: Record<string, Point> = {
    observe: { x: C[0]!, y: T },
    model: { x: C[1]!, y: T },
    compare: { x: C[2]!, y: T },
    record: { x: C[2]!, y: B },
    evaluate: { x: C[1]!, y: B },
    test: { x: C[0]!, y: B },
  };
  const stops: Stop[] = STATIONS.map((s) => ({ key: s.key, p: at[s.key]! }));

  const wires = [
    `<path class="ins__wire" data-arrow d="M ${C[0]! + G} ${T} H ${C[1]! - G}" />`,
    `<path class="ins__wire" data-arrow d="M ${C[1]! + G} ${T} H ${C[2]! - G}" />`,
    `<path class="ins__wire" data-arrow d="M ${C[2]! + G} ${T} H ${R - K} Q ${R} ${T} ${R} ${T + K} V ${B - K} Q ${R} ${B} ${R - K} ${B} H ${C[2]! + G}" />`,
    `<path class="ins__wire" data-arrow d="M ${C[2]! - G} ${B} H ${C[1]! + G}" />`,
    `<path class="ins__wire" data-arrow d="M ${C[1]! - G} ${B} H ${C[0]! + G}" />`,
    `<path class="ins__wire ins__wire--return" data-arrow d="M ${C[0]! - G} ${B} H ${L + K} Q ${L} ${B} ${L} ${B - K} V ${T + K} Q ${L} ${T} ${L + K} ${T} H ${C[0]! - G}" />`,
  ].join('');

  // Past Compare actions the conduit opens into three thin paths: the
  // options, each run forward. The middle one is the conduit itself.
  const s = 12;
  const a = C[2]! + G;
  const fan = `
    <g class="ins__fan ins__fan--right" data-fan>
      <path d="M ${a} ${T} C ${a + 26} ${T}, ${a + 32} ${T - s}, ${a + 58} ${T - s} H ${R - 14}" />
      <path d="M ${a} ${T} C ${a + 26} ${T}, ${a + 32} ${T + s}, ${a + 58} ${T + s} H ${R - 14}" />
    </g>`;

  const stations = STATIONS.map((st, i) => stationAcross(st, i, at[st.key]!.x, at[st.key]!.y)).join('');

  const mid = (T + B) / 2;
  const svg = `
  <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${DEFS}
    ${grid(W, H, 120, 24)}
    ${fan}
    ${wires}
    ${stations}
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
  // The first row is left for the figure's heading.
  const Y: Record<string, number> = { observe: 220, model: 400, compare: 580, record: 760, evaluate: 940, test: 1120 };
  const W = 640;
  const H = 1280;

  const keys = STATIONS.map((st) => st.key);
  const y = (k: string): number => Y[k]!;
  const stops: Stop[] = keys.map((key) => ({ key, p: { x: X, y: y(key) } }));

  const first = y(keys[0]!);
  const last = y(keys[keys.length - 1]!);
  const wires = [
    ...keys.slice(0, -1).map((k, i) => `<path class="ins__wire" data-arrow d="M ${X} ${y(k) + G} V ${y(keys[i + 1]!) - G}" />`),
    `<path class="ins__wire ins__wire--return" data-arrow d="M ${X - G} ${last} H ${RET + K} Q ${RET} ${last} ${RET} ${last - K} V ${first + K} Q ${RET} ${first} ${RET + K} ${first} H ${X - G}" />`,
  ].join('');

  const s = 16;
  const a = y('compare') + G;
  const fan = `
    <g class="ins__fan ins__fan--down" data-fan>
      <path d="M ${X} ${a} C ${X} ${a + 26}, ${X - s} ${a + 34}, ${X - s} ${a + 62} V ${a + 136}" />
      <path d="M ${X} ${a} C ${X} ${a + 26}, ${X + s} ${a + 34}, ${X + s} ${a + 62} V ${a + 136}" />
    </g>`;

  const stations = STATIONS.map((st, i) => stationBeside(st, i, X, y(st.key), LX)).join('');

  const mid = (first + last) / 2;
  const svg = `
  <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${DEFS}
    ${grid(W, H, 80)}
    ${fan}
    ${wires}
    ${stations}
    <text class="ins__label ins__label--return" x="${RET - 16}" y="${mid}" transform="rotate(-90 ${RET - 16} ${mid})" text-anchor="middle">${RETURN_LABEL}</text>
    <rect class="ins__token" x="-7" y="-7" width="14" height="14" data-token />
    <path class="ins__route" data-loop d="M ${X} ${first} V ${last} H ${RET + K} Q ${RET} ${last} ${RET} ${last - K} V ${first + K} Q ${RET} ${first} ${RET + K} ${first} H ${X}" />
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
      return { key: s.key, at: s.key === STATIONS[0]!.key ? 0 : best };
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
        light(STATIONS[0]!.key);
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
      light(STATIONS[0]!.key);
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
      light(STATIONS[0]!.key);
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
