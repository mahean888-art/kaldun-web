/**
 * The Machine: the loop, written as a run log.
 *
 * Six stations in time notation — T₀ state, Δ intervention, T₁…Tₙ futures,
 * U consequence, R resolution, T₀′ learning — joined by grey conduits, with
 * one white return arm closing the loop: the machine runs again. Each
 * conduit is drawn in when the figure enters the viewport, gains an
 * arrowhead, then carries a pale pulse for as long as it is on screen.
 */

import { prefersReducedMotion } from '../lib/prefers';

export type InstrumentHandle = { destroy: () => void };

type Arrow = {
  path: SVGPathElement;
  flow?: Animation | undefined;
  pulseEl?: SVGPathElement | undefined;
};

const DRAW_MS = 900;

type Station = { sym: string; name: string; sub: string };

const STATIONS: Station[] = [
  { sym: 'S', name: 'State', sub: 'Known, unknown, changing now' },
  { sym: 'E', name: 'Evidence', sub: 'Sources, provenance, disagreement' },
  { sym: '&#916;', name: 'Intervention', sub: 'An action, alternative, or shock' },
  { sym: 'T&#8321;&#8230;T&#8345;', name: 'Futures', sub: 'Many paths, weighted — and their tails' },
  { sym: 'R', name: 'Resolution', sub: 'Committed before, evaluated after' },
];

/** One station: run index above, name, register dot, sub beneath. */
function station(s: Station, i: number, x: number, y: number, terminal: boolean): string {
  const dot = terminal ? 'ins__dot ins__dot--t' : 'ins__dot';
  return `
    <text class="ins__idx" x="${x}" y="${y - 68}" text-anchor="middle">${i + 1} / ${STATIONS.length}</text>
    <text class="ins__name ins__name--sm" x="${x}" y="${y - 38}" text-anchor="middle"><tspan class="ins__sym">${s.sym}</tspan><tspan> — ${s.name}</tspan></text>
    <rect class="${dot}" x="${x - 3.5}" y="${y - 3.5}" width="7" height="7" />
    <text class="ins__sub ins__sub--sm" x="${x}" y="${y + 38}" text-anchor="middle">${s.sub}</text>`;
}

/**
 * Desktop: the loop as a circuit — three stations across, a bend down the
 * right edge, three back, and the white return closing the loop up the left.
 * The bends run outside the text columns, so no conduit ever crosses a label.
 */
function landscape(): string {
  const XS = [176, 620, 1064];
  // The return row sits staggered beneath the gaps of the forward row, so
  // the loop fills its field instead of leaving a hollow corner.
  const FUT = 842;
  const RES = 398;
  const TOP = 152;
  const BOT = 372;
  const GAP = 18;

  const stations = [
    ...XS.map((x, i) => station(STATIONS[i]!, i, x, TOP, i === 0)),
    station(STATIONS[3]!, 3, FUT, BOT, false),
    station(STATIONS[4]!, 4, RES, BOT, true),
  ].join('\n');

  const forward = [
    `<path data-arrow="grey" d="M ${XS[0]! + GAP} ${TOP} H ${XS[1]! - GAP}" />`,
    `<path data-arrow="grey" d="M ${XS[1]! + GAP} ${TOP} H ${XS[2]! - GAP}" />`,
    // Down the right edge, outside the intervention/futures columns.
    `<path data-arrow="grey" d="M ${XS[2]! + GAP} ${TOP} H 1172 Q 1196 ${TOP} 1196 ${TOP + 24} V ${BOT - 24} Q 1196 ${BOT} 1172 ${BOT} H ${FUT + GAP}" />`,
    `<path data-arrow="grey" d="M ${FUT - GAP} ${BOT} H ${RES + GAP}" />`,
  ].join('\n');

  // The learning arm: up the left edge, back into the state — the machine runs again.
  const ret = `<path data-arrow="amber" d="M ${RES - GAP} ${BOT} H 84 Q 60 ${BOT} 60 ${BOT - 24} V ${TOP + 24} Q 60 ${TOP} 84 ${TOP} H ${XS[0]! - GAP}" />`;
  const mid = Math.round((TOP + BOT) / 2);

  return `
  <svg viewBox="0 0 1240 476" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${forward}
    ${ret}
    ${stations}
    <text class="ins__label ins__label--amber" x="34" y="${mid}" transform="rotate(-90 34 ${mid})" text-anchor="middle">The machine runs again</text>
  </svg>`;
}

/** Narrow screens: the same loop, standing. */
function portrait(): string {
  const ROW0 = 104;
  const STEP = 182;
  const CX = 360;

  const stations = STATIONS.map((s, i) => {
    const y = ROW0 + i * STEP;
    return `
    <text class="ins__idx" x="${CX}" y="${y - 30}" text-anchor="middle">${i + 1} / ${STATIONS.length}</text>
    <text class="ins__name" x="${CX}" y="${y}" text-anchor="middle"><tspan class="ins__sym">${s.sym}</tspan><tspan> — ${s.name}</tspan></text>
    <text class="ins__sub" x="${CX}" y="${y + 32}" text-anchor="middle">${s.sub}</text>`;
  }).join('\n');

  const conduits = STATIONS.slice(0, -1)
    .map((_, i) => {
      const from = ROW0 + i * STEP + 56;
      const to = ROW0 + (i + 1) * STEP - 58;
      return `<path data-arrow="grey" d="M ${CX} ${from} V ${to}" />`;
    })
    .join('\n');

  const lastY = ROW0 + (STATIONS.length - 1) * STEP;
  const ret = `<path data-arrow="amber" d="M 232 ${lastY - 6} H 106 Q 82 ${lastY - 6} 82 ${lastY - 30} V ${ROW0 + 18} Q 82 ${ROW0 - 6} 106 ${ROW0 - 6} H 248" />`;
  const mid = Math.round((ROW0 + lastY) / 2);

  return `
  <svg viewBox="0 0 640 ${lastY + 64}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${conduits}
    ${ret}
    ${stations}
    <text class="ins__label ins__label--amber" x="58" y="${mid}" transform="rotate(-90 58 ${mid})" text-anchor="middle">The machine runs again</text>
  </svg>`;
}

export function initInstrument(host: HTMLElement): InstrumentHandle {
  const fig = host.querySelector<HTMLElement>('[data-instrument-figure]');
  if (!fig) return { destroy: () => undefined };

  const reduced = prefersReducedMotion();
  const narrow = window.matchMedia('(max-width: 759px)');
  let arrows: Arrow[] = [];
  let played = false;
  let visible = false;

  const clearFlows = (): void => {
    for (const a of arrows) {
      a.flow?.cancel();
      a.pulseEl?.remove();
      a.flow = undefined;
      a.pulseEl = undefined;
    }
  };

  /** A chevron at the conduit's end, so its direction is never in doubt. */
  const addHead = (a: Arrow): void => {
    const len = a.path.getTotalLength();
    const tip = a.path.getPointAtLength(len);
    const back = a.path.getPointAtLength(Math.max(0, len - 6));
    const angle = (Math.atan2(tip.y - back.y, tip.x - back.x) * 180) / Math.PI;
    const head = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    head.setAttribute('d', 'M -10 -7.5 L 3.5 0 L -10 7.5');
    head.setAttribute('class', 'ins__head');
    head.setAttribute('transform', `translate(${tip.x} ${tip.y}) rotate(${angle.toFixed(1)})`);
    head.style.stroke = getComputedStyle(a.path).stroke;
    a.path.parentNode?.insertBefore(head, a.path.nextSibling);
  };

  const startFlow = (a: Arrow): void => {
    if (reduced || typeof a.path.animate !== 'function') return;
    const length = a.path.getTotalLength();
    const pulse = Math.min(110, Math.max(44, length * 0.2));
    const from = length + pulse;
    const flow = a.path.cloneNode(false) as SVGPathElement;
    flow.removeAttribute('data-arrow');
    flow.setAttribute('class', 'ins__pulse');
    flow.style.strokeDasharray = `${pulse} ${length + pulse}`;
    flow.style.strokeDashoffset = `${from}`;
    a.path.parentNode?.insertBefore(flow, a.path.nextSibling);
    a.pulseEl = flow;
    a.flow = flow.animate([{ strokeDashoffset: from }, { strokeDashoffset: 0 }], {
      duration: Math.max(2000, length * 4),
      iterations: Infinity,
      easing: 'linear',
      delay: Math.random() * 800,
    });
  };

  const drawIn = (): void => {
    arrows.forEach((a, i) => {
      const length = a.path.getTotalLength();
      a.path.style.transition = 'none';
      a.path.style.strokeDasharray = `${length}`;
      a.path.style.strokeDashoffset = `${length}`;
      a.path.getBoundingClientRect();
      a.path.style.transition = `stroke-dashoffset ${DRAW_MS}ms ${110 * i}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      a.path.style.strokeDashoffset = '0';
    });
    window.setTimeout(
      () => {
        for (const a of arrows) {
          addHead(a);
          startFlow(a);
        }
      },
      DRAW_MS * 0.8,
    );
  };

  const build = (): void => {
    clearFlows();
    fig.innerHTML = narrow.matches ? portrait() : landscape();
    arrows = Array.from(fig.querySelectorAll<SVGPathElement>('[data-arrow]')).map((path) => ({
      path,
    }));
    if (reduced || played) {
      for (const a of arrows) {
        a.path.style.strokeDasharray = '';
        a.path.style.strokeDashoffset = '';
        addHead(a);
      }
      if (played && visible && !reduced) for (const a of arrows) startFlow(a);
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
        if (!reduced) drawIn();
      } else {
        for (const a of arrows) {
          if (visible) a.flow?.play();
          else a.flow?.pause();
        }
      }
    },
    { threshold: 0.12 },
  );
  io.observe(fig);

  return {
    destroy: () => {
      io.disconnect();
      clearFlows();
      narrow.removeEventListener('change', onBreak);
    },
  };
}
