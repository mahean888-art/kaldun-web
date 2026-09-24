/**
 * The Machine: the loop, drawn thin.
 *
 * Five stations — State, Evidence, Decision, Futures, Outcomes — joined by
 * fine conduits, with one return arm in the hue: update the model. A small
 * commitment marker sits on the conduit before Outcomes: the point past which
 * the claim cannot change. Each conduit is drawn in when the figure enters
 * the viewport, gains a chevron, then carries a faint pulse while on screen.
 */

import { prefersReducedMotion } from '../lib/prefers';

export type InstrumentHandle = { destroy: () => void };

type Arrow = {
  path: SVGPathElement;
  flow?: Animation | undefined;
  pulseEl?: SVGPathElement | undefined;
};

const DRAW_MS = 900;

type Station = { name: string; sub: string };

const STATIONS: Station[] = [
  { name: 'State', sub: 'What is known now' },
  { name: 'Evidence', sub: 'What changes the model' },
  { name: 'Decision', sub: 'The action being tested' },
  { name: 'Futures', sub: 'How consequences could unfold' },
  { name: 'Outcomes', sub: 'What happened, and how it compared' },
];

const RETURN_LABEL = 'Update the model';

/** One station: the word, a plain plate beneath it, the dot, the caption. */
function station(s: Station, x: number, y: number, terminal: boolean): string {
  const dot = terminal ? 'ins__dot ins__dot--t' : 'ins__dot';
  const w = s.name.length * 18 + 28;
  return `
    <rect class="ins__plate" x="${x - w / 2}" y="${y - 58}" width="${w}" height="40" />
    <text class="ins__name" x="${x}" y="${y - 28}" text-anchor="middle">${s.name}</text>
    <rect class="${dot}" x="${x - 2.5}" y="${y - 2.5}" width="5" height="5" />
    <text class="ins__sub" x="${x}" y="${y + 34}" text-anchor="middle">${s.sub}</text>`;
}

/** The commitment marker, on a conduit at (x, y). */
function marker(x: number, y: number, labelBelow = true): string {
  const ly = labelBelow ? y + 24 : y - 14;
  return `
    <rect class="ins__marker" x="${x - 4.5}" y="${y - 4.5}" width="9" height="9" data-marker />
    <text class="ins__marker-label" x="${x}" y="${ly}" text-anchor="middle">Commitment</text>`;
}

/** The faint lattice beside Futures: a 6 × 4 field of small squares. */
function field(x: number, y: number): string {
  return `<rect class="ins__field" x="${x}" y="${y}" width="72" height="48" fill="url(#ins-cells)" />`;
}

const DEFS = `
  <defs>
    <pattern id="ins-cells" width="12" height="12" patternUnits="userSpaceOnUse">
      <rect class="ins__cell" x="4.5" y="4.5" width="3" height="3" />
    </pattern>
  </defs>`;

/**
 * Desktop: the loop as a circuit — three stations across, a bend down the
 * right edge, two back, and the return closing the loop up the left.
 */
function landscape(): string {
  const XS = [176, 620, 1064];
  const FUT = 842;
  const OUT = 398;
  const TOP = 152;
  const BOT = 372;
  const GAP = 16;

  const stations = [
    ...XS.map((x, i) => station(STATIONS[i]!, x, TOP, i === 0)),
    station(STATIONS[3]!, FUT, BOT, false),
    station(STATIONS[4]!, OUT, BOT, true),
  ].join('\n');

  const forward = [
    `<path data-arrow="grey" d="M ${XS[0]! + GAP} ${TOP} H ${XS[1]! - GAP}" />`,
    `<path data-arrow="grey" d="M ${XS[1]! + GAP} ${TOP} H ${XS[2]! - GAP}" />`,
    `<path data-arrow="grey" d="M ${XS[2]! + GAP} ${TOP} H 1172 Q 1196 ${TOP} 1196 ${TOP + 24} V ${BOT - 24} Q 1196 ${BOT} 1172 ${BOT} H ${FUT + GAP}" />`,
    `<path data-arrow="grey" d="M ${FUT - GAP} ${BOT} H ${OUT + GAP}" />`,
  ].join('\n');

  const ret = `<path data-arrow="amber" d="M ${OUT - GAP} ${BOT} H 84 Q 60 ${BOT} 60 ${BOT - 24} V ${TOP + 24} Q 60 ${TOP} 84 ${TOP} H ${XS[0]! - GAP}" />`;
  const mid = Math.round((TOP + BOT) / 2);

  return `
  <svg viewBox="0 0 1240 476" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${DEFS}
    ${field(FUT - 36, 256)}
    ${forward}
    ${ret}
    ${stations}
    ${marker(Math.round((FUT + OUT) / 2), BOT)}
    <text class="ins__label ins__label--amber" x="34" y="${mid}" transform="rotate(-90 34 ${mid})" text-anchor="middle">${RETURN_LABEL}</text>
  </svg>`;
}

/** Narrow screens: the same loop, standing. */
function portrait(): string {
  const ROW0 = 96;
  const STEP = 168;
  const CX = 360;

  const stations = STATIONS.map((s, i) => {
    const y = ROW0 + i * STEP;
    const w = s.name.length * 18 + 28;
    return `
    <rect class="ins__plate" x="${CX - w / 2}" y="${y - 24}" width="${w}" height="32" />
    <text class="ins__name" x="${CX}" y="${y}" text-anchor="middle">${s.name}</text>
    <text class="ins__sub" x="${CX}" y="${y + 30}" text-anchor="middle">${s.sub}</text>`;
  }).join('\n');

  const conduits = STATIONS.slice(0, -1)
    .map((_, i) => {
      const from = ROW0 + i * STEP + 50;
      const to = ROW0 + (i + 1) * STEP - 44;
      return `<path data-arrow="grey" d="M ${CX} ${from} V ${to}" />`;
    })
    .join('\n');

  const lastY = ROW0 + (STATIONS.length - 1) * STEP;
  const ret = `<path data-arrow="amber" d="M 232 ${lastY - 6} H 106 Q 82 ${lastY - 6} 82 ${lastY - 30} V ${ROW0 + 18} Q 82 ${ROW0 - 6} 106 ${ROW0 - 6} H 248" />`;
  const mid = Math.round((ROW0 + lastY) / 2);
  // The marker on the conduit between Futures and Outcomes.
  const my = ROW0 + 3 * STEP + 50 + (STEP - 94) / 2;

  return `
  <svg viewBox="0 0 640 ${lastY + 64}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${DEFS}
    ${field(CX + 120, ROW0 + 3 * STEP - 24)}
    ${conduits}
    ${ret}
    ${stations}
    <rect class="ins__marker" x="${CX - 4.5}" y="${my - 4.5}" width="9" height="9" data-marker />
    <text class="ins__marker-label" x="${CX + 14}" y="${my + 4}" text-anchor="start">Commitment</text>
    <text class="ins__label ins__label--amber" x="58" y="${mid}" transform="rotate(-90 58 ${mid})" text-anchor="middle">${RETURN_LABEL}</text>
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
    head.setAttribute('d', 'M -6 -4 L 2 0 L -6 4');
    head.setAttribute('class', 'ins__head');
    head.setAttribute('transform', `translate(${tip.x} ${tip.y}) rotate(${angle.toFixed(1)})`);
    head.style.stroke = getComputedStyle(a.path).stroke;
    a.path.parentNode?.insertBefore(head, a.path.nextSibling);
  };

  const startFlow = (a: Arrow): void => {
    if (reduced || typeof a.path.animate !== 'function') return;
    const length = a.path.getTotalLength();
    const pulse = Math.min(80, Math.max(30, length * 0.15));
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
