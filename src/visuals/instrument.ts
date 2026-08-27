/**
 * The Machine: the loop drawn as a wiring diagram.
 *
 * Five stations joined by thick rounded conduits, in the manner of a lab
 * schematic: crimson arms ask (run forward, what if, perturb), grey arms
 * ground every run in the live state, the single ink arm decides. Each
 * conduit is drawn in once when the figure enters the viewport, gains an
 * arrowhead so its direction is never in doubt, then carries a pale pulse
 * that travels its length for as long as the figure is on screen.
 */

import { prefersReducedMotion } from '../lib/prefers';

export type InstrumentHandle = { destroy: () => void };

type Arrow = {
  path: SVGPathElement;
  flow?: Animation | undefined;
  pulseEl?: SVGPathElement | undefined;
};

const DRAW_MS = 1100;

function landscape(): string {
  return `
  <svg viewBox="0 0 1240 640" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <path data-arrow="grey" d="M 1116 348 H 1046" />
    <path data-arrow="grey" d="M 942 300 V 142 Q 942 118 918 118 H 786" />
    <path data-arrow="grey" d="M 884 348 H 478" />
    <path data-arrow="red"  d="M 262 300 V 142 Q 262 118 286 118 H 560" />
    <path data-arrow="ink"  d="M 700 152 V 300 Q 700 324 676 324 H 486" />
    <path data-arrow="red"  d="M 262 400 V 522 Q 262 546 286 546 H 506" />
    <path data-arrow="red"  d="M 818 562 H 934 Q 958 562 958 538 V 420" />

    <text class="ins__name" x="300" y="356" text-anchor="middle">The decision</text>
    <text class="ins__sub"  x="300" y="384" text-anchor="middle">what is on the table</text>

    <text class="ins__name" x="656" y="106" text-anchor="middle">Futures</text>
    <text class="ins__sub"  x="656" y="134" text-anchor="middle">T&#8321; &#8594; T&#8345;</text>

    <text class="ins__name" x="660" y="568" text-anchor="middle">Counterfactuals</text>
    <text class="ins__sub"  x="660" y="596" text-anchor="middle">assumption &#183; action &#183; shock</text>

    <text class="ins__name" x="966" y="356" text-anchor="middle">Live state</text>
    <text class="ins__sub"  x="966" y="384" text-anchor="middle">T&#8320; &#183; what is true now</text>

    <text class="ins__name" x="1178" y="356" text-anchor="middle">Signals</text>

    <text class="ins__label ins__label--red"  x="330" y="98">Run forward</text>
    <text class="ins__label ins__label--ink"  x="718" y="244">Decide</text>
    <text class="ins__label ins__label--grey" x="928" y="98" text-anchor="end">Futures run from now</text>
    <text class="ins__label ins__label--grey" x="648" y="392" text-anchor="middle">The decision reads the state</text>
    <text class="ins__label ins__label--red"  x="330" y="528">What if</text>
    <text class="ins__label ins__label--red"  x="876" y="544" text-anchor="middle">Perturb</text>
  </svg>`;
}

function portrait(): string {
  return `
  <svg viewBox="0 0 640 1100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <path data-arrow="grey" d="M 320 88 V 152" />
    <path data-arrow="grey" d="M 320 250 V 334" />
    <path data-arrow="ink"  d="M 320 440 V 524" />
    <path data-arrow="red"  d="M 222 566 H 84 Q 60 566 60 542 V 410 Q 60 386 84 386 H 218" />
    <path data-arrow="red"  d="M 320 630 V 714" />
    <path data-arrow="red"  d="M 432 756 H 556 Q 580 756 580 732 V 220 Q 580 196 556 196 H 442" />

    <text class="ins__name" x="320" y="66" text-anchor="middle">Signals</text>

    <text class="ins__name" x="320" y="200" text-anchor="middle">Live state</text>
    <text class="ins__sub"  x="320" y="228" text-anchor="middle">T&#8320; &#183; what is true now</text>

    <text class="ins__name" x="320" y="382" text-anchor="middle">Futures</text>
    <text class="ins__sub"  x="320" y="410" text-anchor="middle">T&#8321; &#8594; T&#8345;</text>

    <text class="ins__name" x="320" y="572" text-anchor="middle">The decision</text>
    <text class="ins__sub"  x="320" y="600" text-anchor="middle">what is on the table</text>

    <text class="ins__name" x="320" y="762" text-anchor="middle">Counterfactuals</text>
    <text class="ins__sub"  x="320" y="790" text-anchor="middle">assumption &#183; action &#183; shock</text>

    <text class="ins__label ins__label--grey" x="336" y="300">Runs from now</text>
    <text class="ins__label ins__label--ink"  x="336" y="490">Decide</text>
    <text class="ins__label ins__label--red"  x="336" y="680">What if</text>
    <text class="ins__label ins__label--red"  x="40" y="480" transform="rotate(-90 40 480)" text-anchor="middle">Run forward</text>
    <text class="ins__label ins__label--red"  x="602" y="480" transform="rotate(90 602 480)" text-anchor="middle">Perturb</text>
  </svg>`;
}

export function initInstrument(host: HTMLElement): InstrumentHandle {
  const figure = host.querySelector<HTMLElement>('[data-instrument-figure]');
  if (!figure) return { destroy: () => undefined };

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
    head.setAttribute('d', 'M -11 -8.5 L 4 0 L -11 8.5');
    head.setAttribute('class', 'ins__head');
    head.setAttribute('transform', `translate(${tip.x} ${tip.y}) rotate(${angle.toFixed(1)})`);
    head.style.stroke = getComputedStyle(a.path).stroke;
    a.path.parentNode?.insertBefore(head, a.path.nextSibling);
  };

  const startFlow = (a: Arrow): void => {
    if (reduced || typeof a.path.animate !== 'function') return;
    const length = a.path.getTotalLength();
    const pulse = Math.min(120, Math.max(56, length * 0.18));
    const from = length + pulse;
    const flow = a.path.cloneNode(false) as SVGPathElement;
    flow.removeAttribute('data-arrow');
    flow.setAttribute('class', 'ins__pulse');
    flow.style.strokeDasharray = `${pulse} ${length + pulse}`;
    flow.style.strokeDashoffset = `${from}`;
    a.path.parentNode?.insertBefore(flow, a.path.nextSibling);
    a.pulseEl = flow;
    a.flow = flow.animate([{ strokeDashoffset: from }, { strokeDashoffset: 0 }], {
      duration: Math.max(2400, length * 4.2),
      iterations: Infinity,
      easing: 'linear',
      delay: Math.random() * 900,
    });
  };

  const drawIn = (): void => {
    arrows.forEach((a, i) => {
      const length = a.path.getTotalLength();
      a.path.style.transition = 'none';
      a.path.style.strokeDasharray = `${length}`;
      a.path.style.strokeDashoffset = `${length}`;
      a.path.getBoundingClientRect();
      a.path.style.transition = `stroke-dashoffset ${DRAW_MS}ms ${90 * i}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      a.path.style.strokeDashoffset = '0';
    });
    window.setTimeout(
      () => {
        for (const a of arrows) {
          addHead(a);
          startFlow(a);
        }
      },
      DRAW_MS * 0.72,
    );
  };

  const build = (): void => {
    clearFlows();
    figure.innerHTML = narrow.matches ? portrait() : landscape();
    arrows = Array.from(figure.querySelectorAll<SVGPathElement>('[data-arrow]')).map((path) => ({
      path,
    }));
    if (reduced || played) {
      for (const a of arrows) {
        a.path.style.strokeDasharray = '';
        a.path.style.strokeDashoffset = '';
        addHead(a);
      }
      if (played && visible) for (const a of arrows) startFlow(a);
    }
  };

  const setFlowsRunning = (run: boolean): void => {
    for (const a of arrows) {
      if (run) a.flow?.play();
      else a.flow?.pause();
    }
  };

  build();

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible && !played) {
        played = true;
        if (!reduced) drawIn();
      } else {
        setFlowsRunning(visible);
      }
    },
    { threshold: 0.2 },
  );
  io.observe(figure);

  const onBreak = (): void => build();
  narrow.addEventListener('change', onBreak);

  return {
    destroy: () => {
      io.disconnect();
      clearFlows();
      narrow.removeEventListener('change', onBreak);
    },
  };
}
