/**
 * The Machine: the loop, written as a run log.
 *
 * Six stations in time notation — T₀ state, Δ intervention, T₁…Tₙ futures,
 * U consequence, R resolution, T₀′ learning — joined by grey conduits, with
 * one crimson return arm closing the loop: the machine runs again. Each
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
  { sym: 'T&#8320;', name: 'State', sub: 'What is true now' },
  { sym: '&#916;', name: 'Intervention', sub: 'The move on the table' },
  { sym: 'T&#8321;&#8230;T&#8345;', name: 'Futures', sub: 'Worlds that follow, weighted' },
  { sym: 'U', name: 'Consequence', sub: 'What each world means' },
  { sym: 'R', name: 'Resolution', sub: 'What actually happened' },
  { sym: 'T&#8320;&#8242;', name: 'Learning', sub: 'The state updates' },
];

/** Desktop: the loop as a transit line, reading left to right and back. */
function landscape(): string {
  const XS = [96, 306, 516, 726, 936, 1146];
  const Y = 196;

  const stations = STATIONS.map((s, i) => {
    const x = XS[i]!;
    const dot = i === 0 || i === STATIONS.length - 1 ? 'ins__dot ins__dot--t' : 'ins__dot';
    return `
    <rect class="${dot}" x="${x - 3.5}" y="${Y - 3.5}" width="7" height="7" />
    <text class="ins__name ins__name--sm" x="${x}" y="${Y - 40}" text-anchor="middle"><tspan class="ins__sym">${s.sym}</tspan><tspan> — ${s.name}</tspan></text>
    <text class="ins__sub ins__sub--sm" x="${x}" y="${Y + 38}" text-anchor="middle">${s.sub}</text>`;
  }).join('\n');

  const conduits = XS.slice(0, -1)
    .map((x, i) => `<path data-arrow="grey" d="M ${x + 18} ${Y} H ${XS[i + 1]! - 18}" />`)
    .join('\n');

  const last = XS[XS.length - 1]!;
  const first = XS[0]!;
  const ret = `<path data-arrow="amber" d="M ${last} ${Y + 58} V 296 Q ${last} 320 ${last - 24} 320 H ${first + 24} Q ${first} 320 ${first} 296 V ${Y + 18}" />`;

  return `
  <svg viewBox="0 0 1240 372" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${conduits}
    ${ret}
    ${stations}
    <text class="ins__label ins__label--amber" x="621" y="356" text-anchor="middle">The machine runs again</text>
  </svg>`;
}

/** Narrow screens: the same loop, standing. */
function portrait(): string {
  const ROW0 = 80;
  const STEP = 168;
  const CX = 360;

  const stations = STATIONS.map((s, i) => {
    const y = ROW0 + i * STEP;
    return `
    <text class="ins__name" x="${CX}" y="${y}" text-anchor="middle"><tspan class="ins__sym">${s.sym}</tspan><tspan> — ${s.name}</tspan></text>
    <text class="ins__sub" x="${CX}" y="${y + 32}" text-anchor="middle">${s.sub}</text>`;
  }).join('\n');

  const conduits = STATIONS.slice(0, -1)
    .map((_, i) => {
      const from = ROW0 + i * STEP + 56;
      const to = ROW0 + (i + 1) * STEP - 44;
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
