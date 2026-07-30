/**
 * One requestAnimationFrame loop for the whole page.
 *
 * Every scroll-linked effect and every canvas subscribes here. Having a single
 * loop means: one scroll read per frame, no competing rAF chains, and a clean
 * way to pause everything when the tab is hidden.
 */

export type Frame = {
  /** Milliseconds since the previous frame, clamped to avoid jumps. */
  dt: number;
  /** Milliseconds since the ticker started. */
  time: number;
  /** document.scrollingElement.scrollTop for this frame. */
  scrollY: number;
  /** Smoothed scroll delta in px, signed. Useful for velocity effects. */
  velocity: number;
  /** Viewport height. */
  vh: number;
  /** Viewport width. */
  vw: number;
};

type Task = (frame: Frame) => void;

const tasks = new Set<Task>();

let running = false;
let raf = 0;
let last = 0;
let started = 0;
let velocity = 0;
let prevScroll = 0;

const frame: Frame = {
  dt: 16.67,
  time: 0,
  scrollY: 0,
  velocity: 0,
  vh: window.innerHeight,
  vw: window.innerWidth,
};

function measureViewport(): void {
  frame.vh = window.innerHeight;
  frame.vw = window.innerWidth;
}

function loop(now: number): void {
  if (!running) return;
  raf = requestAnimationFrame(loop);

  const dt = Math.min(now - last, 50);
  last = now;

  const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
  const delta = scrollY - prevScroll;
  prevScroll = scrollY;
  // Exponential smoothing keeps velocity-driven effects from twitching.
  velocity += (delta - velocity) * 0.18;

  frame.dt = dt;
  frame.time = now - started;
  frame.scrollY = scrollY;
  frame.velocity = velocity;

  for (const task of tasks) {
    try {
      task(frame);
    } catch (error) {
      // A single broken effect must never stop the page from animating.
      console.error('[ticker] task failed', error);
      tasks.delete(task);
    }
  }
}

function start(): void {
  if (running) return;
  running = true;
  last = performance.now();
  started = last;
  prevScroll = window.scrollY;
  measureViewport();
  raf = requestAnimationFrame(loop);
}

function stop(): void {
  running = false;
  cancelAnimationFrame(raf);
}

/** Register a per-frame task. Returns an unsubscribe function. */
export function onFrame(task: Task): () => void {
  tasks.add(task);
  if (tasks.size > 0) start();
  return () => {
    tasks.delete(task);
    if (tasks.size === 0) stop();
  };
}

/** Force a viewport re-measure (called by the resize observer). */
export function refreshViewport(): void {
  measureViewport();
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stop();
  } else if (tasks.size > 0) {
    start();
  }
});

let resizeTimer = 0;
window.addEventListener(
  'resize',
  () => {
    measureViewport();
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('kaldun:resize'));
    }, 140);
  },
  { passive: true },
);

/** Subscribe to the debounced resize event. */
export function onResize(fn: () => void): () => void {
  const handler = () => fn();
  window.addEventListener('kaldun:resize', handler);
  return () => window.removeEventListener('kaldun:resize', handler);
}
