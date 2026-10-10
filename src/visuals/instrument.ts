/**
 * The learning loop, as one instrument.
 *
 * Six stations on a strict grid. Observe feeds Model as evidence arrives;
 * Model, Compare actions and Record expectations follow, then Score
 * expectations and Test revisions back along the bottom. Past Compare actions
 * the conduit opens into three paths: the options, each run forward. Record
 * expectations is the sealed diamond, the point past which the claim cannot
 * change, and the original record is preserved there. A tested revision
 * branches: accepted, it returns to Model as a new version; rejected, the
 * existing model is retained.
 *
 * On entering, the conduits draw in. Then one amber mark travels the loop,
 * pausing at each station and lighting it; after the first pass it goes round
 * again from Model. It runs only while the figure is on screen and the tab is
 * visible. Under reduced motion everything is simply present.
 */

import { prefersReducedMotion } from '../lib/prefers';

export type InstrumentHandle = { destroy: () => void };

type Station = { key: string; name: string; sub: string };
type Point = { x: number; y: number };
type Stop = { key: string; p: Point };

const STATIONS: Station[] = [
  { key: 'observe', name: 'Observe', sub: 'Evidence, with its source and time' },
  { key: 'model', name: 'Model', sub: 'The institution and its dependencies' },
  { key: 'compare', name: 'Compare actions', sub: 'Consequences under stated assumptions' },
  { key: 'record', name: 'Record expectations', sub: 'Preserve the action and model version' },
  { key: 'score', name: 'Score expectations', sub: 'Compare with observed outcomes' },
  { key: 'test', name: 'Test revisions', sub: 'Evaluate on separate cases' },
];

const ACCEPT_LABEL = 'ACCEPTED · NEW MODEL VERSION';
const REJECT_LABEL = 'REJECTED · MODEL RETAINED';
const RECORD_LABEL = 'ORIGINAL RECORD PRESERVED';

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

/** A caption too long for the narrow plate breaks after its comma, or else
    at the space nearest its middle. */
function lines(text: string): string[] {
  if (text.length <= 26) return [text];
  const at = text.indexOf(', ');
  if (at > 0) return [text.slice(0, at + 1), text.slice(at + 2)];
  const mid = text.length / 2;
  let best = -1;
  for (let i = text.indexOf(' '); i >= 0; i = text.indexOf(' ', i + 1)) if (best < 0 || Math.abs(i - mid) < Math.abs(best - mid)) best = i;
  return best > 0 ? [text.slice(0, best), text.slice(best + 1)] : [text];
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
  const K = 22; // corner radius
  const G = 20; // where a conduit stops short of a node
  const W = 1200;
  const H = 600;

  const at: Record<string, Point> = {
    observe: { x: C[0]!, y: T },
    model: { x: C[1]!, y: T },
    compare: { x: C[2]!, y: T },
    record: { x: C[2]!, y: B },
    score: { x: C[1]!, y: B },
    test: { x: C[0]!, y: B },
  };
  const stops: Stop[] = STATIONS.map((s) => ({ key: s.key, p: at[s.key]! }));

  // The branch after Test revisions: out to the left, then either up and back
  // into the conduit before Model (accepted), or on to a stop (rejected).
  const JX = 128; // where the branch turns up
  const MY = 360; // the middle row, clear of every label
  const IN = 420; // where an accepted revision rejoins the conduit to Model
  const accepted = `M ${C[0]! - G} ${B} H ${JX + K} Q ${JX} ${B} ${JX} ${B - K} V ${MY + K} Q ${JX} ${MY} ${JX + K} ${MY} H ${IN - K} Q ${IN} ${MY} ${IN} ${MY - K} V ${T + 12}`;

  const wires = [
    `<path class="ins__wire" data-arrow d="M ${C[0]! + G} ${T} H ${C[1]! - G}" />`,
    `<path class="ins__wire" data-arrow d="M ${C[1]! + G} ${T} H ${C[2]! - G}" />`,
    `<path class="ins__wire" data-arrow d="M ${C[2]! + G} ${T} H ${R - K} Q ${R} ${T} ${R} ${T + K} V ${B - K} Q ${R} ${B} ${R - K} ${B} H ${C[2]! + G}" />`,
    `<path class="ins__wire" data-arrow d="M ${C[2]! - G} ${B} H ${C[1]! + G}" />`,
    `<path class="ins__wire" data-arrow d="M ${C[1]! - G} ${B} H ${C[0]! + G}" />`,
    `<path class="ins__wire ins__wire--return" data-arrow d="${accepted}" />`,
  ].join('');
  const reject = `<path class="ins__wire ins__wire--reject" d="M ${JX} ${B - K} V ${B + 62} M ${JX - 9} ${B + 62} H ${JX + 9}" />`;

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

  const svg = `
  <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${DEFS}
    ${grid(W, H, 120, 24)}
    ${fan}
    ${wires}
    ${reject}
    ${stations}
    <text class="ins__label ins__label--return" x="${IN + 14}" y="${MY - 30}">${ACCEPT_LABEL}</text>
    <text class="ins__label ins__label--reject" x="${JX + 18}" y="${B + 76}">${REJECT_LABEL}</text>
    <text class="ins__label ins__label--record" x="${C[2]}" y="${B + 76}" text-anchor="middle">${RECORD_LABEL}</text>
    <rect class="ins__token" x="-6" y="-6" width="12" height="12" data-token />
    <path class="ins__route" data-loop d="M ${C[0]} ${T} H ${R - K} Q ${R} ${T} ${R} ${T + K} V ${B - K} Q ${R} ${B} ${R - K} ${B} H ${JX + K} Q ${JX} ${B} ${JX} ${B - K} V ${MY + K} Q ${JX} ${MY} ${JX + K} ${MY} H ${IN - K} Q ${IN} ${MY} ${IN} ${MY - K} V ${T + K} Q ${IN} ${T} ${IN + K} ${T} H ${C[1]}" />
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
  const Y: Record<string, number> = { observe: 220, model: 400, compare: 580, record: 760, score: 960, test: 1140 };
  const W = 640;
  const H = 1320;

  const keys = STATIONS.map((st) => st.key);
  const y = (k: string): number => Y[k]!;
  const stops: Stop[] = keys.map((key) => ({ key, p: { x: X, y: y(key) } }));

  const back = y('model'); // an accepted revision returns to Model
  const last = y(keys[keys.length - 1]!);
  const wires = [
    ...keys.slice(0, -1).map((k, i) => `<path class="ins__wire" data-arrow d="M ${X} ${y(k) + G} V ${y(keys[i + 1]!) - G}" />`),
    `<path class="ins__wire ins__wire--return" data-arrow d="M ${X - G} ${last} H ${RET + K} Q ${RET} ${last} ${RET} ${last - K} V ${back + K} Q ${RET} ${back} ${RET + K} ${back} H ${X - G}" />`,
  ].join('');
  const reject = `<path class="ins__wire ins__wire--reject" d="M ${X} ${last + G} V ${last + 120} M ${X - 12} ${last + 120} H ${X + 12}" />`;

  const s = 16;
  const a = y('compare') + G;
  const fan = `
    <g class="ins__fan ins__fan--down" data-fan>
      <path d="M ${X} ${a} C ${X} ${a + 26}, ${X - s} ${a + 34}, ${X - s} ${a + 62} V ${a + 136}" />
      <path d="M ${X} ${a} C ${X} ${a + 26}, ${X + s} ${a + 34}, ${X + s} ${a + 62} V ${a + 136}" />
    </g>`;

  const stations = STATIONS.map((st, i) => stationBeside(st, i, X, y(st.key), LX)).join('');

  const mid = (back + last) / 2;
  const svg = `
  <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${DEFS}
    ${grid(W, H, 80)}
    ${fan}
    ${wires}
    ${reject}
    ${stations}
    <text class="ins__label ins__label--return" x="${RET - 16}" y="${mid}" transform="rotate(-90 ${RET - 16} ${mid})" text-anchor="middle">${ACCEPT_LABEL}</text>
    <text class="ins__label ins__label--reject" x="${LX}" y="${last + 126}">${REJECT_LABEL}</text>
    <text class="ins__label ins__label--record" x="${LX}" y="${y('record') + 126}">${RECORD_LABEL}</text>
    <rect class="ins__token" x="-7" y="-7" width="14" height="14" data-token />
    <path class="ins__route" data-loop d="M ${X} ${y('observe')} V ${last} H ${RET + K} Q ${RET} ${last} ${RET} ${last - K} V ${back + K} Q ${RET} ${back} ${RET + K} ${back} H ${X}" />
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
        // An accepted revision has reached Model: round again from there.
        pos = marks[1]!.at;
        next = 2;
        light(marks[1]!.key);
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
