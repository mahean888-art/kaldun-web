/**
 * The hero drawing: one past, many futures, in ink on the dark ground.
 *
 * A hundred and twenty futures leave the present in a graded fan — most
 * drawn faintly, the leading few in pure white. Points of light travel the
 * strongest paths continuously; grey dust hangs in the field; the trunk is a
 * measured line with graduations and the present is a small sunburst. On a
 * steady beat a pulse runs the trunk and the fan re-weights — evidence in,
 * futures re-drawn.
 */

import { seeded } from '../lib/math';
import { dpr, prefersReducedMotion } from '../lib/prefers';
import { onFrame, onResize, type Frame } from '../lib/ticker';

export type BranchHandle = { destroy: () => void };

const N = 120;
const LIGHTS = 9;
const DUST = 150;
const BEAT_MS = 3600;
const PULSE_MS = 430;
const EASE_MS = 1050;

const easeOut = (t: number): number => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

/** A lumpy, unimodal weight profile over the fan. */
function sample(rnd: () => number): number[] {
  const peak = 0.22 + rnd() * 0.56;
  const width = 0.09 + rnd() * 0.16;
  const w = Array.from({ length: N }, (_, i) => {
    const u = i / (N - 1);
    const core = Math.exp(-((u - peak) ** 2) / (2 * width * width));
    return core * (0.55 + rnd() * 0.45) + rnd() * 0.05;
  });
  const max = Math.max(...w);
  return w.map((v) => v / max);
}

/** The hero verb, answered in the traces. */
type Mode = 'decide' | 'commit' | 'allocate' | 'build' | 'insure';

/** Shape a base profile to the word in view. */
function shapeFor(mode: Mode, rnd: () => number): number[] {
  const base = sample(rnd);
  if (mode === 'commit' || mode === 'build') {
    // One path gains weight and carries forward.
    const lead = base.indexOf(Math.max(...base));
    return base.map((v, i) => {
      const d = Math.abs(i - lead) / N;
      const focus = Math.exp(-(d * d) / 0.0012);
      return Math.min(1, v * 0.3 + focus);
    });
  }
  if (mode === 'allocate') {
    // A measured distribution spreads across the paths.
    return base.map(() => 0.42 + rnd() * 0.3);
  }
  if (mode === 'insure') {
    // A peripheral tail trace becomes visible.
    const tail = rnd() < 0.5 ? 2 : N - 3;
    return base.map((v, i) => (Math.abs(i - tail) < 2 ? 0.92 : v * 0.75));
  }
  return base; // decide: paths separate modestly
}

export function initBranches(canvas: HTMLCanvasElement): BranchHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { destroy: () => undefined };

  const reduced = prefersReducedMotion();
  const rnd = seeded(1654);

  let w = 0;
  let h = 0;
  let nx = 0;
  let ny = 0;

  /** Endpoint spread across the right edge, fixed for the life of the page. */
  const lanes = Array.from({ length: N }, (_, i) => {
    const u = i / (N - 1);
    return 0.05 + u * 0.9 + (rnd() - 0.5) * 0.01;
  });

  /** Which engraving tone a path takes: most gold, a few warm white. */
  const tones = Array.from({ length: N }, (_, i) => (i % 6 === 2 ? 'white' : 'gold'));

  const dust = Array.from({ length: DUST }, () => ({
    // Concentrated in the fan's field, thinning toward the edges.
    u: 0.34 + rnd() * 0.64,
    v: 0.06 + rnd() * 0.88,
    a: 0.04 + rnd() * 0.16,
    tw: rnd() * Math.PI * 2,
    s: rnd() < 0.08 ? 1.7 : 1,
  }));

  const lights = Array.from({ length: LIGHTS }, (_, k) => ({
    t: rnd(),
    speed: 0.00006 + rnd() * 0.00007,
    slot: k, // rank among the strongest paths
  }));

  let current = sample(rnd);
  let from = current.slice();
  let target = current.slice();
  let easeStart = -1;
  let lastBeat = 0;
  let mode: Mode = 'decide';
  let modeChanged = false;
  let hovered = false;

  const onVerb = (event: Event): void => {
    const verb = (event as CustomEvent<{ verb: string }>).detail?.verb as Mode | undefined;
    if (!verb || verb === mode) return;
    mode = verb;
    modeChanged = true;
  };
  document.addEventListener('fm:verb', onVerb);

  const resize = (): void => {
    const rect = canvas.getBoundingClientRect();
    const ratio = dpr(2);
    w = Math.max(rect.width, 1);
    h = Math.max(rect.height, 1);
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    nx = w * 0.3;
    ny = h * 0.5;
  };

  /** Control points of path i, for both stroking and light positions. */
  const ctrl = (i: number): [number, number, number, number, number, number, number, number] => {
    const ey = lanes[i]! * h;
    const dx = w - nx;
    return [nx, ny, nx + dx * 0.34, ny, nx + dx * 0.62, ey - (ey - ny) * 0.22, w + 2, ey];
  };

  const trace = (i: number): void => {
    const [x0, y0, x1, y1, x2, y2, x3, y3] = ctrl(i);
    ctx.moveTo(x0, y0);
    ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
  };

  const pointAt = (i: number, t: number): [number, number] => {
    const [x0, y0, x1, y1, x2, y2, x3, y3] = ctrl(i);
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    return [a * x0 + b * x1 + c * x2 + d * x3, a * y0 + b * y1 + c * y2 + d * y3];
  };

  const draw = (time: number): void => {
    ctx.clearRect(0, 0, w, h);

    // Horizon graduations: T₁ … Tₙ, ruled faintly across the field.
    ctx.font = '500 10px "Geist Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const marks: Array<[number, string]> = [
      [0.46, 'T₁'],
      [0.62, 'T₂'],
      [0.78, 'T₃'],
      [0.94, 'Tₙ'],
    ];
    for (const [fx, label] of marks) {
      const x = w * fx;
      ctx.strokeStyle = 'rgba(244, 243, 240, 0.06)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 6]);
      ctx.beginPath();
      ctx.moveTo(x, 44);
      ctx.lineTo(x, h - 8);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(138, 136, 128, 0.9)';
      ctx.fillText(label, x, 28);
    }

    // Gold dust in the field, a few grains breathing.
    for (let k = 0; k < DUST; k++) {
      const g = dust[k]!;
      const tw = reduced ? 1 : 0.75 + 0.25 * Math.sin(time * 0.0008 + g.tw);
      ctx.fillStyle = `rgba(185, 183, 178, ${(g.a * tw).toFixed(3)})`;
      ctx.fillRect(g.u * w, g.v * h, g.s, g.s);
    }

    // The word in view re-draws the futures the moment it changes.
    if (modeChanged) {
      modeChanged = false;
      from = current.slice();
      target = shapeFor(mode, rnd);
      easeStart = time;
    }

    // Weights, mid-ease if a re-weight is in flight.
    if (easeStart >= 0) {
      const t = easeOut((time - easeStart) / EASE_MS);
      for (let i = 0; i < N; i++) current[i] = from[i]! + (target[i]! - from[i]!) * t;
      if (t >= 1) easeStart = -1;
    }

    // Rank the strongest paths once per frame.
    const order = current
      .map((v, i) => [v, i] as const)
      .sort((a, b) => b[0] - a[0])
      .map(([, i]) => i);
    const leadSet = new Set(order.slice(0, 4));

    // The engraved fan.
    for (let i = 0; i < N; i++) {
      if (leadSet.has(i)) continue;
      const wt = current[i]!;
      ctx.strokeStyle =
        tones[i] === 'white'
          ? `rgba(244, 243, 240, ${(0.04 + wt * 0.18).toFixed(3)})`
          : `rgba(185, 183, 178, ${(0.04 + wt * 0.26).toFixed(3)})`;
      ctx.lineWidth = wt > 0.75 ? 1.3 : 1;
      ctx.beginPath();
      trace(i);
      ctx.stroke();
    }

    // The burnished leads: a wide soft under-stroke, then a bright core.
    for (const i of leadSet) {
      const wt = current[i]!;
      ctx.strokeStyle = `rgba(255, 255, 255, ${(0.06 + wt * 0.08).toFixed(3)})`;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      trace(i);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255, 255, 255, ${(0.42 + wt * 0.5).toFixed(3)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      trace(i);
      ctx.stroke();
    }

    // `build`: the strongest path lengthens into time — its far reach burns
    // brighter than the rest of its run.
    if (mode === 'build') {
      const lead = order[0]!;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      const [sx, sy] = pointAt(lead, 0.58);
      ctx.moveTo(sx, sy);
      for (let t = 0.62; t <= 1.001; t += 0.04) {
        const [px, py] = pointAt(lead, Math.min(1, t));
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Light travelling the strongest paths, continuously.
    if (!reduced) {
      for (const l of lights) {
        l.t += l.speed * 33;
        if (l.t >= 1) l.t -= 1;
        const path = order[l.slot % order.length]!;
        const t0 = l.t;
        const [ax, ay] = pointAt(path, Math.max(0, t0 - 0.045));
        const [bx, by] = pointAt(path, t0);
        const fade = t0 > 0.85 ? (1 - t0) / 0.15 : 1;
        ctx.strokeStyle = `rgba(255, 255, 255, ${(0.72 * fade).toFixed(3)})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
    }

    // Everything that has already happened: one measured line, graduated.
    ctx.strokeStyle = 'rgba(244, 243, 240, 0.5)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-2, ny);
    ctx.lineTo(nx, ny);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(244, 243, 240, 0.26)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = nx - 26; gx > 8; gx -= 26) {
      ctx.moveTo(gx, ny - 4);
      ctx.lineTo(gx, ny + 4);
    }
    ctx.stroke();

    // Evidence arriving: a pulse runs the trunk; on landing the fan re-weights.
    if (!reduced) {
      const phase = time - lastBeat;
      if (phase >= BEAT_MS) {
        lastBeat = time - (phase % BEAT_MS);
        from = current.slice();
        target = shapeFor(mode, rnd);
        easeStart = time + PULSE_MS;
      } else if (phase < PULSE_MS) {
        const p = phase / PULSE_MS;
        const px = p * nx;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(Math.max(0, px - 16), ny);
        ctx.lineTo(px, ny);
        ctx.stroke();
      }
    }

    // The present: a small sunburst, engraved.
    const beat = reduced ? 1 : 0.8 + Math.sin(time * 0.0015) * 0.2;
    ctx.strokeStyle = `rgba(244, 243, 240, ${(0.4 * beat).toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let r = 0; r < 12; r++) {
      const a = (r / 12) * Math.PI * 2;
      ctx.moveTo(nx + Math.cos(a) * 7, ny + Math.sin(a) * 7);
      ctx.lineTo(nx + Math.cos(a) * (r % 3 === 0 ? 13 : 10), ny + Math.sin(a) * (r % 3 === 0 ? 13 : 10));
    }
    ctx.stroke();
    ctx.fillStyle = `rgba(255, 255, 255, ${(0.7 + 0.3 * beat).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(nx, ny, 2.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '500 11px "Geist Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(185, 183, 178, 0.9)';
    // On calm hover the present names itself in full.
    ctx.fillText(hovered ? 'STATE T₀' : 'T₀', nx, ny + 18);
  };

  let elapsed = 0;
  const tick = (frame: Frame): void => {
    elapsed += frame.dt;
    if (elapsed < 33) return;
    elapsed = 0;
    draw(frame.time);
  };

  resize();
  const stopResize = onResize(resize);
  let stopFrame: (() => void) | null = null;

  canvas.addEventListener('pointerenter', () => {
    hovered = true;
    if (reduced) draw(0);
  });
  canvas.addEventListener('pointerleave', () => {
    hovered = false;
    if (reduced) draw(0);
  });

  if (reduced) {
    draw(0);
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (visible && !stopFrame) stopFrame = onFrame(tick);
        else if (!visible && stopFrame) {
          stopFrame();
          stopFrame = null;
        }
      },
      { threshold: 0 },
    );
    io.observe(canvas);
  }

  return {
    destroy: () => {
      stopFrame?.();
      stopResize();
      document.removeEventListener('fm:verb', onVerb);
    },
  };
}
