/**
 * The probability field.
 *
 * One restrained figure: a live point at NOW, and a bundle of trajectories that
 * opens to the right into a distribution of possible futures. Uncertainty widens
 * with horizon, so the spread — and the motion — grows with distance from NOW.
 *
 * Deliberately quiet: hairline strokes, no colour except the NOW point, no
 * labels, no particles. It reads as an instrument, not a screensaver.
 */

import { clamp, seeded } from '../lib/math';
import { dpr, prefersReducedMotion } from '../lib/prefers';
import { onFrame, onResize, type Frame } from '../lib/ticker';

type Trajectory = {
  /** Normalised control offsets, one per sample. */
  offsets: number[];
  phase: number;
  speed: number;
  amp: number;
  weight: number;
  accent: boolean;
};

type Pulse = {
  track: number;
  t: number;
  speed: number;
};

const SAMPLES = 30;

export type FieldHandle = {
  destroy: () => void;
};

export function initProbabilityField(canvas: HTMLCanvasElement): FieldHandle {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return { destroy: () => undefined };

  const reduced = prefersReducedMotion();
  const density = Number(canvas.dataset.density ?? '46');

  let width = 0;
  let height = 0;
  let ratio = 1;
  let trajectories: Trajectory[] = [];
  let pulses: Pulse[] = [];
  const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

  /**
   * NOW sits low and left — the origin of a timeline, not the centre of a
   * decoration — so the futures fan up and to the right across open space and
   * never compete with the headline. The label is a DOM node positioned from
   * these same coordinates, so the two can never drift apart.
   */
  const origin = (): { x: number; y: number } => {
    // Two layouts: the field either overlays the hero's right half (absolute)
    // or sits stacked beneath the copy (in flow). Read which one is live rather
    // than guessing from the canvas width.
    const host = canvas.parentElement;
    const overlaid = host ? getComputedStyle(host).position === 'absolute' : false;
    return {
      x: width * (overlaid ? 0.05 : 0.1),
      y: height * (overlaid ? 0.5 : 0.52),
    };
  };

  const label = canvas.parentElement?.querySelector<HTMLElement>('[data-field-now]') ?? null;

  const placeLabel = (): void => {
    if (!label) return;
    const o = origin();
    label.style.transform = `translate3d(${Math.round(o.x + 13)}px, ${Math.round(o.y - 30)}px, 0)`;
  };

  const build = (): void => {
    const rnd = seeded(20191);
    const count = Math.max(14, Math.round(density * clamp(width / 1200, 0.45, 1.15)));
    trajectories = [];
    for (let i = 0; i < count; i++) {
      // Bias the bundle towards the centre: a distribution, not a fan.
      const bias = (rnd() + rnd() + rnd()) / 3 - 0.5;
      const offsets: number[] = [];
      let drift = 0;
      for (let s = 0; s < SAMPLES; s++) {
        const t = s / (SAMPLES - 1);
        // Random walk whose step size grows with the horizon.
        drift += (rnd() - 0.5) * 0.055 * (0.25 + t * 1.9);
        offsets.push(bias * t * 1.7 + drift);
      }
      trajectories.push({
        offsets,
        phase: rnd() * Math.PI * 2,
        speed: 0.00016 + rnd() * 0.00028,
        amp: 0.1 + rnd() * 0.34,
        weight: 0.06 + Math.pow(1 - Math.abs(bias) * 1.7, 3) * 0.2,
        accent: i % 11 === 4,
      });
    }
    pulses = [
      { track: 3, t: 0.1, speed: 0.00019 },
      { track: Math.floor(count * 0.55), t: 0.62, speed: 0.00014 },
    ];
  };

  const resize = (): void => {
    const rect = canvas.getBoundingClientRect();
    ratio = dpr(2);
    width = Math.max(rect.width, 1);
    height = Math.max(rect.height, 1);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    build();
    placeLabel();
  };

  const endX = (): number => width * 0.985;

  /** Where the centre of the bundle sits at horizon t — it rises as it opens. */
  const spine = (t: number, oy: number): number => oy + (height * 0.44 - oy) * (t * (2 - t));

  const drawRuling = (): void => {
    // Ephemeris columns: the time grid a scribe would rule before writing.
    const o = origin();
    const x0 = o.x;
    const x1 = endX();
    ctx.lineWidth = 1;
    for (let i = 1; i <= 7; i++) {
      const t = i / 7;
      const x = x0 + (x1 - x0) * t;
      const centre = spine(t, o.y);
      const half = height * 0.06 + t * height * 0.3;
      ctx.strokeStyle = `rgba(236, 231, 221, ${(0.05 - t * 0.024).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(x, centre - half);
      ctx.lineTo(x, centre + half);
      ctx.stroke();

      // Wedge tick at the foot of each column.
      ctx.strokeStyle = `rgba(193, 135, 63, ${(0.3 - t * 0.16).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(x, centre + half);
      ctx.lineTo(x, centre + half + 5);
      ctx.stroke();
    }
  };

  const pointAt = (
    traj: Trajectory,
    s: number,
    time: number,
    ox: number,
    oy: number,
    span: number,
    spread: number,
  ): [number, number] => {
    const t = s / (SAMPLES - 1);
    const breathe = reduced ? 0 : Math.sin(time * traj.speed + traj.phase + t * 2.4) * traj.amp * t;
    const drag = (pointer.y - 0.5) * 0.5 * t;
    const raw = (traj.offsets[s] ?? 0) + breathe + drag;
    const x = ox + span * t + (pointer.x - 0.5) * 6 * t;
    const y = spine(t, oy) + raw * spread * Math.pow(t, 0.78);
    return [x, y];
  };

  const draw = (frame: Frame): void => {
    const time = frame.time;
    const o = origin();
    const x0 = o.x;
    const x1 = endX();
    const span = x1 - x0;
    const spread = height * 0.42;

    ctx.clearRect(0, 0, width, height);

    // Ease the pointer so the field never snaps.
    pointer.x += (pointer.tx - pointer.x) * 0.045;
    pointer.y += (pointer.ty - pointer.y) * 0.045;

    drawRuling();

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (const traj of trajectories) {
      ctx.beginPath();
      for (let s = 0; s < SAMPLES; s++) {
        const [x, y] = pointAt(traj, s, time, x0, o.y, span, spread);
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineWidth = traj.accent ? 1.15 : 0.85;
      ctx.strokeStyle = traj.accent
        ? `rgba(193, 135, 63, ${(traj.weight * 1.5 + 0.1).toFixed(3)})`
        : `rgba(236, 231, 221, ${traj.weight.toFixed(3)})`;
      ctx.stroke();

      // Terminal state: a faint mark where this future lands.
      const [ex, ey] = pointAt(traj, SAMPLES - 1, time, x0, o.y, span, spread);
      ctx.fillStyle = traj.accent
        ? 'rgba(227, 184, 119, 0.6)'
        : `rgba(236, 231, 221, ${(traj.weight * 1.6).toFixed(3)})`;
      ctx.fillRect(ex, ey - 0.5, 3, 1);
    }

    // Evidence travelling forward along a trajectory.
    if (!reduced) {
      for (const pulse of pulses) {
        pulse.t += pulse.speed * frame.dt;
        if (pulse.t > 1) pulse.t -= 1;
        const traj = trajectories[pulse.track % trajectories.length];
        if (!traj) continue;
        const s = Math.min(SAMPLES - 1, Math.floor(pulse.t * (SAMPLES - 1)));
        const [px, py] = pointAt(traj, s, time, x0, o.y, span, spread);
        const fade = Math.sin(pulse.t * Math.PI);
        ctx.fillStyle = `rgba(124, 155, 255, ${(0.55 * fade).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, 1.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // NOW — the one point of colour on the page.
    const oy = o.y;
    const glow = ctx.createRadialGradient(x0, oy, 0, x0, oy, 40);
    glow.addColorStop(0, 'rgba(43, 91, 255, 0.34)');
    glow.addColorStop(1, 'rgba(43, 91, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x0, oy, 40, 0, Math.PI * 2);
    ctx.fill();

    // A slow expanding ring: evidence arriving at the present.
    if (!reduced) {
      const ringT = ((time * 0.00022) % 1);
      ctx.strokeStyle = `rgba(124, 155, 255, ${(0.3 * (1 - ringT)).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x0, oy, 5 + ringT * 28, 0, Math.PI * 2);
      ctx.stroke();
    }

    const beat = reduced ? 1 : 0.74 + Math.sin(time * 0.0016) * 0.26;
    ctx.fillStyle = `rgba(120, 156, 255, ${(0.9 * beat).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x0, oy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x0, oy, 1.7, 0, Math.PI * 2);
    ctx.fill();
  };

  resize();

  let stopFrame: (() => void) | null = null;
  const stopResize = onResize(resize);

  if (reduced) {
    draw({ dt: 0, time: 0, scrollY: 0, velocity: 0, vh: window.innerHeight, vw: window.innerWidth });
  } else {
    // Only animate while the canvas is on screen.
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (visible && !stopFrame) {
          stopFrame = onFrame(draw);
        } else if (!visible && stopFrame) {
          stopFrame();
          stopFrame = null;
        }
      },
      { threshold: 0 },
    );
    io.observe(canvas);
  }

  const onPointer = (event: PointerEvent): void => {
    const rect = canvas.getBoundingClientRect();
    pointer.tx = clamp((event.clientX - rect.left) / Math.max(rect.width, 1));
    pointer.ty = clamp((event.clientY - rect.top) / Math.max(rect.height, 1));
  };

  if (!reduced && window.matchMedia('(hover: hover)').matches) {
    window.addEventListener('pointermove', onPointer, { passive: true });
  }

  return {
    destroy: () => {
      stopFrame?.();
      stopResize();
      window.removeEventListener('pointermove', onPointer);
    },
  };
}
