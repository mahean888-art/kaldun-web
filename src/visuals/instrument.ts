/**
 * The Instrument.
 *
 * The six-primitive loop, drawn as a working diagram: Signals feed the live
 * State, Drivers act on it, Futures fan out of it; the Counterfactual enters
 * from below — the decision entering the machine — and Resolution returns to
 * State on a thin dashed line that solidifies when an outcome lands,
 * incrementing the state version.
 *
 * One inference cycle every ~13 seconds, then stillness. Every motion is a
 * state change; nothing eases in for atmosphere. The one operable control is
 * the counterfactual arm: the same world, run differently.
 */

import { clamp, seeded } from '../lib/math';
import { dpr, prefersReducedMotion } from '../lib/prefers';
import { onFrame, onResize, type Frame } from '../lib/ticker';

export type InstrumentHandle = { destroy: () => void };

const INK: [number, number, number] = [14, 17, 22];
const SIGNAL: [number, number, number] = [23, 51, 230];
const FRAME_MS = 33;
const PERIOD = 13000;
const FUTURES = 5;

const mix = (a: number, b: number, t: number): number => a + (b - a) * t;
const ink = (a: number): string => `rgba(${INK[0]}, ${INK[1]}, ${INK[2]}, ${a.toFixed(3)})`;
const ramp = (wgt: number, a: number): string => {
  const t = Math.pow(wgt, 1.4);
  return `rgba(${Math.round(mix(INK[0], SIGNAL[0], t))}, ${Math.round(mix(INK[1], SIGNAL[1], t))}, ${Math.round(
    mix(INK[2], SIGNAL[2], t),
  )}, ${a.toFixed(3)})`;
};
const ease = (x: number): number => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

export type Mode = 'assumption' | 'action' | 'shock';
const MODE_SEED: Record<Mode, number> = { assumption: 11, action: 29, shock: 47 };

export function initInstrument(host: HTMLElement): InstrumentHandle {
  const canvas = host.querySelector<HTMLCanvasElement>('canvas');
  const ctx = canvas?.getContext('2d');
  const stamp = host.querySelector<HTMLElement>('[data-state-version]');
  const buttons = Array.from(host.querySelectorAll<HTMLButtonElement>('.instrument__mode'));
  if (!canvas || !ctx) return { destroy: () => undefined };

  const reduced = prefersReducedMotion();
  let w = 0;
  let h = 0;
  let vertical = false;
  let mode: Mode = 'action';
  let version = 317;
  let versionShown = 317;
  let cycleStart = -1;
  let weights = sample(mode);
  let targets = weights;

  function sample(m: Mode): number[] {
    const rnd = seeded(MODE_SEED[m] * 1000 + version);
    const out = Array.from({ length: FUTURES }, () => 0.15 + rnd() * 0.6);
    out[Math.floor(rnd() * FUTURES)] = 0.95;
    return out;
  }

  const setStamp = (): void => {
    if (stamp && versionShown !== version) {
      versionShown = version;
      stamp.textContent = `v.${String(version).padStart(4, '0')}`;
    }
  };

  /** Map (along-flow u, cross v) to pixels; the phone runs the flow downward. */
  const P = (u: number, v: number): [number, number] =>
    vertical ? [v * w, u * h] : [u * w, v * h];

  const resize = (): void => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 8) return;
    const ratio = dpr(2);
    w = rect.width;
    h = rect.height;
    vertical = h > w * 1.05;
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const node = (u: number, v: number, label: string, boxed = false, flash = 0): void => {
    const [x, y] = P(u, v);
    if (boxed) {
      ctx.strokeStyle = ink(0.55 + flash * 0.4);
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.strokeRect(x - 34, y - 15, 68, 30);
      if (flash > 0) {
        ctx.fillStyle = `rgba(${SIGNAL[0]}, ${SIGNAL[1]}, ${SIGNAL[2]}, ${(flash * 0.1).toFixed(3)})`;
        ctx.fillRect(x - 34, y - 15, 68, 30);
      }
    }
    ctx.fillStyle = flash > 0 ? ramp(1, 0.6 + flash * 0.4) : ink(0.85);
    ctx.fillRect(x - 2.5, y - 2.5, 5, 5);
    ctx.font = '600 10px "Geist Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = ink(0.6);
    ctx.fillText(label, x, y - (boxed ? 24 : 14));
  };

  const arrow = (from: [number, number], to: [number, number], alpha: number, dashed = false): void => {
    const [x1, y1] = from;
    const [x2, y2] = to;
    ctx.strokeStyle = ink(alpha);
    ctx.lineWidth = 1;
    ctx.setLineDash(dashed ? [4, 5] : []);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(a - 0.45) * 6, y2 - Math.sin(a - 0.45) * 6);
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(a + 0.45) * 6, y2 - Math.sin(a + 0.45) * 6);
    ctx.stroke();
  };

  let elapsed = 0;

  const draw = (frame: Frame): void => {
    if (w < 8) return;
    elapsed += frame.dt;
    if (!reduced && elapsed < FRAME_MS) return;
    elapsed = 0;

    const t = frame.time;
    if (cycleStart < 0) cycleStart = t;
    const cy = reduced ? 0.98 : ((t - cycleStart) / PERIOD) % 1;
    // A completed cycle resolves: the version steps forward.
    if (!reduced && t - cycleStart >= PERIOD) {
      cycleStart += PERIOD * Math.floor((t - cycleStart) / PERIOD);
      version += 1;
      targets = sample(mode);
    }
    setStamp();
    for (let i = 0; i < FUTURES; i++) {
      const target = targets[i] ?? 0.5;
      const cur = weights[i] ?? 0.5;
      weights[i] = cur + (target - cur) * (reduced ? 1 : 0.07);
    }

    ctx.clearRect(0, 0, w, h);

    // Time-spaced dot grid: rulings drift apart as time runs out to the right.
    ctx.fillStyle = ink(0.06);
    for (let k = 0; k <= 12; k++) {
      const u = 0.04 + 0.92 * Math.pow(k / 12, 1.35);
      for (let m = 0.06; m <= 0.94; m += 0.06) {
        const [x, y] = P(u, m);
        ctx.fillRect(x - 0.7, y - 0.7, 1.4, 1.4);
      }
    }

    const U = { signals: 0.07, state: 0.29, drivers: 0.51, origin: 0.68, ends: 0.95, counter: 0.6 };
    const flashState = clamp(1 - Math.abs(cy - 0.1) / 0.06);

    // The spine: observed, solid.
    arrow(P(U.signals + 0.015, 0.5), P(U.state - 0.045, 0.5), 0.4);
    arrow(P(U.state + 0.045, 0.5), P(U.drivers - 0.015, 0.5), 0.4);
    arrow(P(U.drivers + 0.015, 0.5), P(U.origin - 0.012, 0.5), 0.4);

    // The futures: possible, dashed, weighted by the ramp.
    for (let i = 0; i < FUTURES; i++) {
      const wgt = weights[i] ?? 0.5;
      const v = 0.16 + (i / (FUTURES - 1)) * 0.68;
      const [ox, oy] = P(U.origin, 0.5);
      const [ex, ey] = P(U.ends, v);
      ctx.strokeStyle = ramp(wgt, 0.14 + wgt * 0.5);
      ctx.lineWidth = 0.8 + wgt * 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.quadraticCurveTo(mix(ox, ex, 0.55), mix(oy, ey, 0.85), ex, ey);
      ctx.stroke();
      ctx.setLineDash([]);
      const s = 2 + wgt * 5;
      ctx.fillStyle = ramp(wgt, 0.3 + wgt * 0.6);
      ctx.fillRect(ex - s / 2, ey - s / 2, s, s);
    }

    // The counterfactual arm: the decision entering the machine.
    arrow(P(U.counter, 0.86), P(U.origin - 0.006, 0.545), 0.45, true);

    // Resolution: from the leading future back to State. Dashed while the
    // outcome is open; solid in the moment it lands.
    const leadIndex = weights.indexOf(Math.max(...weights));
    const leadV = 0.16 + (leadIndex / (FUTURES - 1)) * 0.68;
    const resDraw = reduced ? 1 : clamp((cy - 0.55) / 0.2);
    const resSolid = reduced ? 0 : clamp((cy - 0.78) / 0.07) * (1 - clamp((cy - 0.92) / 0.08));
    if (resDraw > 0) {
      const [sx, sy] = P(U.ends, leadV);
      const [tx, ty] = P(U.state, 0.565);
      const [c1x, c1y] = P(0.66, 1.04);
      const [c2x, c2y] = P(0.38, 0.92);
      ctx.strokeStyle = resSolid > 0 ? ramp(1, 0.35 + resSolid * 0.5) : ink(0.3 * resDraw);
      ctx.lineWidth = 1 + resSolid;
      ctx.setLineDash(resSolid > 0.5 ? [] : [4, 5]);
      // Progressive draw via dash trickery is overkill; alpha carries arrival.
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.bezierCurveTo(c1x, c1y, c2x, c2y, tx, ty);
      ctx.stroke();
      ctx.font = '600 10px "Geist Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = resSolid > 0 ? ramp(1, 0.8) : ink(0.45 * resDraw);
      const [lx, ly] = P(0.52, vertical ? 0.99 : 0.97);
      ctx.fillText('RESOLUTION', lx, ly);
    }

    // Pulse: one packet of evidence running the spine.
    if (!reduced && cy < 0.3) {
      const p = ease(cy / 0.3);
      const u = mix(U.signals, U.origin, p);
      const [px, py] = P(u, 0.5);
      ctx.fillStyle = ramp(1, 0.9);
      ctx.beginPath();
      ctx.arc(px, py, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }

    node(U.signals, 0.5, 'SIGNALS');
    node(U.state, 0.5, 'LIVE STATE', true, flashState + resSolid);
    node(U.drivers, 0.5, 'DRIVERS');
    node(U.origin, 0.5, 'FUTURES');
  };

  const setMode = (next: Mode): void => {
    mode = next;
    targets = sample(mode);
    // Re-run the forward pass now: the same world, run differently.
    cycleStart = performance.now() - PERIOD * 0.12;
    for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.mode === next));
  };
  for (const b of buttons) {
    b.addEventListener('click', () => setMode((b.dataset.mode as Mode) ?? 'action'));
  }

  resize();
  const stopResize = onResize(resize);
  let stopFrame: (() => void) | null = null;

  if (reduced) {
    draw({ dt: FRAME_MS, time: 0, scrollY: 0, velocity: 0, vh: window.innerHeight, vw: window.innerWidth });
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (visible && !stopFrame) stopFrame = onFrame(draw);
        else if (!visible && stopFrame) {
          stopFrame();
          stopFrame = null;
        }
      },
      { threshold: 0 },
    );
    io.observe(canvas);
    draw({ dt: FRAME_MS, time: 0, scrollY: 0, velocity: 0, vh: window.innerHeight, vw: window.innerWidth });
  }

  return {
    destroy: () => {
      stopFrame?.();
      stopResize();
    },
  };
}
