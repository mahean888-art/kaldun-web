/**
 * The instrument: Kaldun's loop drawn as a wiring diagram.
 *
 * Five stations joined by thick rounded conduits, in the manner of a lab
 * schematic: crimson arms ask (run forward, what if, perturb), grey arms
 * ground (the state feeds everything), the single ink arm decides. Each
 * conduit is drawn in once when the figure enters the viewport, then carries
 * a pale pulse that travels its length for as long as the figure is on
 * screen. The counterfactual control swaps which question the lower station
 * is asking; the state stamp ticks as signal pulses land.
 */

import { prefersReducedMotion } from '../lib/prefers';

export type InstrumentHandle = { destroy: () => void };

type Arrow = {
  path: SVGPathElement;
  flow?: Animation | undefined;
  pulseEl?: SVGPathElement | undefined;
};

const DRAW_MS = 1100;

const MODES = ['assumption', 'action', 'shock'] as const;
type Mode = (typeof MODES)[number];

/** The lower station's sub-line, with one question live. */
function counterSub(x: number, y: number): string {
  const words = MODES.map((m) => `<tspan data-word="${m}">${m}</tspan>`).join('<tspan> · </tspan>');
  return `<text class="ins__sub" x="${x}" y="${y}" text-anchor="middle">${words}</text>`;
}

function landscape(): string {
  return `
  <svg viewBox="0 0 1240 640" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <!-- conduits, in travel order of their pulses -->
    <path data-arrow="grey" d="M 1116 348 H 1046" />
    <path data-arrow="grey" d="M 942 300 V 142 Q 942 118 918 118 H 786" />
    <path data-arrow="grey" d="M 884 348 H 478" />
    <path data-arrow="red"  d="M 262 300 V 142 Q 262 118 286 118 H 566" />
    <path data-arrow="ink"  d="M 700 152 V 300 Q 700 324 676 324 H 486" />
    <path data-arrow="red"  d="M 262 400 V 522 Q 262 546 286 546 H 506" />
    <path data-arrow="red"  d="M 818 562 H 934 Q 958 562 958 538 V 420" />

    <!-- stations -->
    <text class="ins__name" x="300" y="356" text-anchor="middle">The decision</text>
    <text class="ins__sub"  x="300" y="384" text-anchor="middle">what is on the table</text>

    <text class="ins__name" x="656" y="106" text-anchor="middle">Futures</text>
    <text class="ins__sub"  x="656" y="134" text-anchor="middle">T&#8321; &#8594; T&#8345;</text>

    <text class="ins__name" x="660" y="568" text-anchor="middle">Counterfactuals</text>
    ${counterSub(660, 596)}

    <text class="ins__name" x="966" y="356" text-anchor="middle">Live state</text>
    <text class="ins__sub"  x="966" y="384" text-anchor="middle">T&#8320; &#183; what is true now</text>

    <text class="ins__name" x="1178" y="356" text-anchor="middle">Signals</text>

    <!-- conduit labels -->
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
    ${counterSub(320, 790)}

    <text class="ins__label ins__label--grey" x="336" y="300">Runs from now</text>
    <text class="ins__label ins__label--ink"  x="336" y="490">Decide</text>
    <text class="ins__label ins__label--red"  x="336" y="680">What if</text>
    <text class="ins__label ins__label--red"  x="40" y="480" transform="rotate(-90 40 480)" text-anchor="middle">Run forward</text>
    <text class="ins__label ins__label--red"  x="602 " y="480" transform="rotate(90 602 480)" text-anchor="middle">Perturb</text>
  </svg>`;
}

export function initInstrument(host: HTMLElement): InstrumentHandle {
  const figure = host.querySelector<HTMLElement>('[data-instrument-figure]');
  const stamp = host.querySelector<HTMLElement>('[data-state-version]');
  const buttons = Array.from(host.querySelectorAll<HTMLButtonElement>('[data-mode]'));
  if (!figure) return { destroy: () => undefined };

  const reduced = prefersReducedMotion();
  const narrow = window.matchMedia('(max-width: 759px)');

  let arrows: Arrow[] = [];
  let played = false;
  let visible = false;
  let version = 317;
  let tick: ReturnType<typeof setInterval> | null = null;

  const applyMode = (mode: Mode): void => {
    for (const btn of buttons) {
      btn.setAttribute('aria-pressed', String(btn.dataset.mode === mode));
    }
    for (const word of figure.querySelectorAll<SVGElement>('[data-word]')) {
      word.classList.toggle('is-live', word.dataset.word === mode);
    }
  };

  const activeMode = (): Mode =>
    (buttons.find((b) => b.getAttribute('aria-pressed') === 'true')?.dataset.mode as Mode) ??
    'action';

  const clearFlows = (): void => {
    for (const a of arrows) {
      a.flow?.cancel();
      a.pulseEl?.remove();
      a.flow = undefined;
      a.pulseEl = undefined;
    }
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
        for (const a of arrows) startFlow(a);
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
    applyMode(activeMode());
    if (reduced || played) {
      // Already revealed once (or motion is off): show the finished figure.
      for (const a of arrows) {
        a.path.style.strokeDasharray = '';
        a.path.style.strokeDashoffset = '';
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
      if (visible && !tick && !reduced) {
        tick = setInterval(() => {
          version += 1;
          if (stamp) stamp.textContent = `v.${String(version).padStart(4, '0')}`;
        }, 6400);
      } else if (!visible && tick) {
        clearInterval(tick);
        tick = null;
      }
    },
    { threshold: 0.2 },
  );
  io.observe(figure);

  const onModeClick = (event: Event): void => {
    const btn = (event.currentTarget as HTMLButtonElement) ?? null;
    const mode = btn?.dataset.mode as Mode | undefined;
    if (mode) applyMode(mode);
  };
  for (const btn of buttons) btn.addEventListener('click', onModeClick);

  const onBreak = (): void => build();
  narrow.addEventListener('change', onBreak);

  return {
    destroy: () => {
      io.disconnect();
      clearFlows();
      if (tick) clearInterval(tick);
      narrow.removeEventListener('change', onBreak);
      for (const btn of buttons) btn.removeEventListener('click', onModeClick);
    },
  };
}
