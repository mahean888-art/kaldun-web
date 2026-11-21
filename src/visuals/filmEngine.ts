/**
 * 02 · How it works — Universal Foresight Optical Instrument
 *
 * Completely universal across money, power, compute, trade, and every institution
 * (zero domain-specific financial clutter). Rendered as a precision 2x-DPR
 * optical lithography instrument on calibrated obsidian (#110f0c):
 *
 *   01 · Model     — Three coupled 3D strata (World · Institutions · Rules) bound by live dependency arcs
 *   02 · Simulate  — Branching future cone (T0 -> T+N) swept by an adversarial stress front
 *   03 · Intervene — Decisive inflection node (Delta) carving one golden trajectory that holds above threshold
 *   04 · Record    — Concentric chronometric vernier rings locking to zero around the pre-outcome seal
 */
import { prefersReducedMotion } from '../lib/prefers';

const DURS = [5800, 6400, 6400, 5800] as const;

const META = [
  {
    plate: '01 · Model',
    sk: 'Executable world',
    sv: 'Entities, contracts, constraints, markets, and rules coupled in one state space',
    code: 'COUPLED SYSTEM · WORLD MODEL',
  },
  {
    plate: '02 · Simulate',
    sk: 'Adversarial horizon',
    sv: 'Historical crises and the smallest shock that breaks the plan',
    code: 'BRANCHING CONE · STRESS FRONT',
  },
  {
    plate: '03 · Intervene',
    sk: 'Plan that holds',
    sv: 'The allocation, terms, or sequence that keeps the system intact',
    code: 'INFLECTION Δ · VIABLE PATH',
  },
  {
    plate: '04 · Record',
    sk: 'Pre-outcome ledger',
    sv: 'Answer and evidence committed and hashed before the outcome arrives',
    code: 'VERIFIABLE RECORD · SEALED',
  },
] as const;

const damp = (curr: number, target: number, lambda: number, dt: number): number =>
  curr + (target - curr) * (1 - Math.exp(-lambda * dt));

// Deterministic PRNG for crisp reproducible scientific geometry
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(4219);

// Stage 01 · Model nodes & inter-strata dependency edges
const MODEL_NODES = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * Math.PI * 2;
  const radius = i % 2 === 0 ? 1.0 : 0.66;
  const tier = i % 3 === 0 ? 1 : i % 3 === 1 ? 0 : -1;
  return { angle, radius, tier, phase: rng() * Math.PI * 2, major: i % 4 === 0 };
});

const MODEL_EDGES: Array<[number, number, number]> = [];
for (let i = 0; i < MODEL_NODES.length; i++) {
  MODEL_EDGES.push([i, (i + 3) % MODEL_NODES.length, rng()]);
  if (i % 2 === 0) MODEL_EDGES.push([i, (i + 7) % MODEL_NODES.length, rng()]);
}

// Stage 02 & 03 · 38 branching future trajectories
const CONE_BRANCHES = Array.from({ length: 38 }, (_, i) => {
  const spread = ((i / 37) - 0.5) * 2; // -1 .. +1
  const isBreak = spread > 0.14 || (i % 5 === 0 && spread > -0.2);
  const breakU = 0.34 + rng() * 0.34;
  const waveAmp = 0.06 + rng() * 0.12;
  const waveFreq = 1.6 + rng() * 2.4;
  const phase = rng() * Math.PI * 2;
  const weight = 0.4 + rng() * 0.6;
  return { spread, isBreak, breakU, waveAmp, waveFreq, phase, weight };
});

// Stage 04 · Deterministic cryptographic seal bit-matrix (32 cells)
const SEAL_BITS = Array.from({ length: 32 }, (_, i) => ((i * 17 + 9) % 5 === 0 ? 2 : (i * 11 + 3) % 3 === 0 ? 1 : 0));

export function initFilmEngine(host: HTMLElement): void {
  const canvas = host.querySelector<HTMLCanvasElement>('[data-film-canvas]');
  const chs = Array.from(host.querySelectorAll<HTMLButtonElement>('[data-go]'));
  const play = host.querySelector<HTMLButtonElement>('[data-play]');
  const playT = host.querySelector<HTMLElement>('[data-play-t]');
  const plateEl = host.querySelector<HTMLElement>('[data-film-plate]');
  const skEl = host.querySelector<HTMLElement>('[data-film-sk]');
  const svEl = host.querySelector<HTMLElement>('[data-film-sv]');
  const codeEl = host.querySelector<HTMLElement>('[data-film-code]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduced = prefersReducedMotion();
  let step = 0;
  let playing = !reduced;
  let visible = false;
  let stepStart = performance.now();
  let lastNow = performance.now();
  let raf = 0;
  let W = 900;
  let H = 520;
  let dpr = 1;
  let px = 0;
  let py = 0;
  let tx = 0;
  let ty = 0;
  const w = [1, 0, 0, 0];

  const syncDom = (): void => {
    host.dataset['s'] = String(step + 1);
    host.classList.toggle('is-paused', !playing);
    chs.forEach((b, i) => {
      b.classList.toggle('is-on', i === step);
      if (i === step) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
    });
    const m = META[step]!;
    if (plateEl) plateEl.textContent = m.plate;
    if (skEl) skEl.textContent = m.sk;
    if (svEl) svEl.textContent = m.sv;
    if (codeEl) codeEl.textContent = m.code;
    if (play) play.setAttribute('aria-label', playing ? 'Pause the sequence' : 'Play the sequence');
    if (playT) playT.textContent = playing ? 'Pause' : 'Play';
  };

  const setStep = (idx: number, manual = false): void => {
    step = ((idx % 4) + 4) % 4;
    stepStart = performance.now();
    if (manual) playing = false;
    syncDom();
    host.style.setProperty('--p', playing ? '0' : '1');
  };

  const resize = (): void => {
    const stage = canvas.parentElement;
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    if (r.width < 20 || r.height < 20) return;
    W = Math.round(r.width);
    H = Math.round(r.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  };

  // Isometric-perspective helper for Stage 01 coupled strata
  const project3D = (
    x: number,
    y: number,
    z: number,
    yaw: number,
    pitch: number,
    cx: number,
    cy: number,
    scale: number,
  ): [number, number, number] => {
    const cyaw = Math.cos(yaw);
    const syaw = Math.sin(yaw);
    const rx = x * cyaw - z * syaw;
    const rz = x * syaw + z * cyaw;
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const ry = y * cp - rz * sp;
    const fz = y * sp + rz * cp;
    const persp = 4.6 / (4.6 - fz * 0.55);
    return [cx + rx * scale * persp, cy - ry * scale * persp, fz];
  };

  const drawFrame = (now: number): void => {
    const dt = Math.min((now - lastNow) / 1000, 0.08);
    lastNow = now;
    const t = reduced ? 2.2 : now / 1000;

    if (playing && !reduced) {
      const dur = DURS[step]!;
      const elapsed = now - stepStart;
      if (elapsed >= dur) {
        step = (step + 1) % 4;
        stepStart = now;
        syncDom();
        host.style.setProperty('--p', '0');
      } else {
        host.style.setProperty('--p', (elapsed / dur).toFixed(4));
      }
    } else {
      host.style.setProperty('--p', '1');
    }

    px = damp(px, tx, 4.5, dt);
    py = damp(py, ty, 4.5, dt);
    for (let i = 0; i < 4; i++) {
      w[i] = damp(w[i]!, i === step ? 1 : 0, 5.0, dt);
    }

    const wModel = w[0]!;
    const wSim = w[1]!;
    const wInt = w[2]!;
    const wRec = w[3]!;
    const compact = W < 540;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. Calibrated Deep Warm-Obsidian Optical Substrate (#110f0c)
    ctx.fillStyle = '#110f0c';
    ctx.fillRect(0, 0, W, H);

    // Subtle precision optical dot-matrix field across the aperture
    const gridGap = compact ? 18 : 16;
    ctx.fillStyle = 'rgba(235, 224, 204, 0.06)';
    for (let gy = gridGap; gy < H - 10; gy += gridGap) {
      for (let gx = gridGap; gx < W - 10; gx += gridGap) {
        ctx.fillRect(gx, gy, 1, 1);
      }
    }

    // Calibrated optical bench border ticks (Astromech/Zeiss precision)
    ctx.strokeStyle = 'rgba(243, 146, 0, 0.24)';
    ctx.lineWidth = 1;
    for (let yTick = 24; yTick < H - 20; yTick += 16) {
      const major = yTick % 64 === 0;
      const len = major ? 9 : 4;
      ctx.beginPath();
      ctx.moveTo(0, yTick + 0.5);
      ctx.lineTo(len, yTick + 0.5);
      ctx.moveTo(W - len, yTick + 0.5);
      ctx.lineTo(W, yTick + 0.5);
      ctx.stroke();
    }
    for (let xTick = 32; xTick < W - 28; xTick += 24) {
      const major = xTick % 96 === 0;
      const len = major ? 7 : 3;
      ctx.beginPath();
      ctx.moveTo(xTick + 0.5, H - len);
      ctx.lineTo(xTick + 0.5, H);
      ctx.stroke();
    }

    // Subtle hairline horizon axis
    ctx.strokeStyle = 'rgba(235, 224, 204, 0.07)';
    ctx.beginPath();
    ctx.moveTo(22, Math.round(H * 0.5) + 0.5);
    ctx.lineTo(W - 22, Math.round(H * 0.5) + 0.5);
    ctx.moveTo(Math.round(W * 0.5) + 0.5, 20);
    ctx.lineTo(Math.round(W * 0.5) + 0.5, H - 20);
    ctx.stroke();

    const cx = W * 0.5 + px * 10;
    const cy = H * 0.5 + py * 6;
    const baseScale = Math.min(W * 0.26, H * 0.34);

    // =========================================================================
    // STAGE 01 · MODEL — Coupled 3D Institutional World Strata
    // =========================================================================
    if (wModel > 0.01) {
      ctx.save();
      ctx.globalAlpha = wModel;

      const yaw = t * 0.24 + px * 0.38;
      const pitch = 0.52 + py * 0.14;

      // Three elevation strata: World State (-0.72), Institutions (0), Rules (+0.72)
      const strata = [
        { y: -0.72, r: 1.24, dots: 72, amber: false, label: 'WORLD STATE' },
        { y: 0.0, r: 1.02, dots: 56, amber: false, label: 'INSTITUTIONS' },
        { y: 0.72, r: 0.76, dots: 44, amber: true, label: 'CONTRACTS & RULES' },
      ];

      // Draw dotted halftone orbital strata rings & radial lattice
      for (const st of strata) {
        ctx.beginPath();
        for (let s = 0; s <= 96; s++) {
          const a = (s / 96) * Math.PI * 2;
          const [sx, sy] = project3D(Math.cos(a) * st.r, st.y, Math.sin(a) * st.r, yaw, pitch, cx, cy, baseScale);
          if (s === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = st.amber ? 'rgba(243, 146, 0, 0.44)' : 'rgba(235, 224, 204, 0.16)';
        ctx.lineWidth = st.amber ? 1.25 : 1;
        ctx.stroke();

        // Precision halftone perimeter ticks along each stratum
        for (let d = 0; d < st.dots; d++) {
          const a = (d / st.dots) * Math.PI * 2 + (st.amber ? -t * 0.12 : t * 0.05);
          const [sx, sy, fz] = project3D(Math.cos(a) * st.r, st.y, Math.sin(a) * st.r, yaw, pitch, cx, cy, baseScale);
          const depth = Math.max(0.2, Math.min(1, (fz + 1.5) / 3));
          ctx.fillStyle = st.amber
            ? `rgba(243, 146, 0, ${(0.35 + depth * 0.55).toFixed(3)})`
            : `rgba(235, 224, 204, ${(0.18 + depth * 0.45).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(sx, sy, st.amber ? 1.55 : 1.25, 0, Math.PI * 2);
          ctx.fill();
        }

        // Right-margin stratum coordinate leader (desktop)
        if (!compact) {
          const [rx, ry] = project3D(st.r, st.y, 0, 0, pitch, cx, cy, baseScale);
          const lx = W - 28;
          ctx.strokeStyle = st.amber ? 'rgba(243, 146, 0, 0.32)' : 'rgba(235, 224, 204, 0.16)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(rx + 14, ry);
          ctx.lineTo(lx - 118, ry);
          ctx.stroke();

          ctx.font = '500 9.5px "IBM Plex Mono", ui-monospace, monospace';
          ctx.fillStyle = st.amber ? '#f39200' : 'rgba(235, 224, 204, 0.56)';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(st.label, lx, ry);
        }
      }

      // Compute projected 3D node positions across strata
      const pts = MODEL_NODES.map((n) => {
        const y = n.tier * 0.72;
        const r = n.tier === 1 ? 0.76 : n.tier === -1 ? 1.18 : n.radius;
        return project3D(Math.cos(n.angle) * r, y, Math.sin(n.angle) * r, yaw, pitch, cx, cy, baseScale);
      });

      // Vertical coupling plumb-lines between top & bottom strata
      ctx.strokeStyle = 'rgba(235, 224, 204, 0.09)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const [tx0, ty0] = project3D(Math.cos(a) * 0.76, 0.72, Math.sin(a) * 0.76, yaw, pitch, cx, cy, baseScale);
        const [bx0, by0] = project3D(Math.cos(a) * 1.24, -0.72, Math.sin(a) * 1.24, yaw, pitch, cx, cy, baseScale);
        ctx.beginPath();
        ctx.moveTo(tx0, ty0);
        ctx.lineTo(bx0, by0);
        ctx.stroke();
      }

      // Coupled dependency arcs + traveling signal packets
      for (let ei = 0; ei < MODEL_EDGES.length; ei++) {
        const [ia, ib, seed] = MODEL_EDGES[ei]!;
        const pa = pts[ia]!;
        const pb = pts[ib]!;
        const mx = (pa[0] + pb[0]) * 0.5;
        const my = (pa[1] + pb[1]) * 0.5 - 16;

        ctx.strokeStyle = ei % 5 === 0 ? 'rgba(243, 146, 0, 0.34)' : 'rgba(235, 224, 204, 0.16)';
        ctx.lineWidth = ei % 5 === 0 ? 1.2 : 0.9;
        ctx.beginPath();
        ctx.moveTo(pa[0], pa[1]);
        ctx.quadraticCurveTo(mx, my, pb[0], pb[1]);
        ctx.stroke();

        // Crisp moving packet along quadratic curve
        const u = (t * 0.28 + seed) % 1;
        const inv = 1 - u;
        const qx = inv * inv * pa[0] + 2 * inv * u * mx + u * u * pb[0];
        const qy = inv * inv * pa[1] + 2 * inv * u * my + u * u * pb[1];
        ctx.fillStyle = ei % 5 === 0 ? '#f39200' : 'rgba(244, 238, 226, 0.85)';
        ctx.beginPath();
        ctx.arc(qx, qy, ei % 5 === 0 ? 2.2 : 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Institutional nodes + precision center core
      for (let i = 0; i < pts.length; i++) {
        const [nx, ny, nz] = pts[i]!;
        const node = MODEL_NODES[i]!;
        const depth = Math.max(0.35, Math.min(1, (nz + 1.5) / 3));
        ctx.fillStyle = node.major ? '#f39200' : `rgba(244, 238, 226, ${depth.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(nx, ny, node.major ? 3.5 : 2.3, 0, Math.PI * 2);
        ctx.fill();
        if (node.major) {
          ctx.strokeStyle = 'rgba(243, 146, 0, 0.45)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(nx, ny, 7.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Central calibrated institution core
      const [coreX, coreY] = project3D(0, 0, 0, yaw, pitch, cx, cy, baseScale);
      ctx.strokeStyle = 'rgba(243, 146, 0, 0.65)';
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.arc(coreX, coreY, 13, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#f39200';
      ctx.beginPath();
      ctx.arc(coreX, coreY, 4.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // =========================================================================
    // STAGE 02 · SIMULATE & STAGE 03 · INTERVENE — The Navigator's Future Cone
    // =========================================================================
    const coneVis = Math.max(wSim, wInt);
    if (coneVis > 0.01) {
      ctx.save();
      ctx.globalAlpha = coneVis;

      const leftX = compact ? 34 : 68;
      const rightX = W - (compact ? 26 : 56);
      const spanW = rightX - leftX;
      const originY = H * 0.48 + py * 6;
      const threshY = H * 0.62;
      const deltaU = 0.36;
      const deltaX = leftX + spanW * deltaU;

      // 2a. Halftone optical stress topography field inside the cone
      const colsH = compact ? 26 : 44;
      const rowsH = compact ? 14 : 20;
      for (let ic = 0; ic <= colsH; ic++) {
        const u = ic / colsH;
        const x = leftX + u * spanW;
        const coneHalf = (0.04 + Math.pow(u, 0.85) * 0.39) * H;
        for (let ir = 0; ir <= rowsH; ir++) {
          const v = (ir / rowsH) * 2 - 1; // -1 .. +1
          const yBase = originY + v * coneHalf;
          // Stress distortion ripples under Simulate; smooths into harmonic waves under Intervene
          const storm = Math.sin(u * 14 - t * 2.2 + v * 4.5) * 10 * wSim;
          const calm = Math.sin(u * 8 - t * 1.1) * 2.5 * wInt;
          const y = yBase + storm + calm;
          const belowThresh = y > threshY;
          const edgeFade = 1 - Math.abs(v) * 0.72;
          const dotR = (0.9 + edgeFade * 1.15) * (0.45 + u * 0.55);

          if (belowThresh && wSim > 0.25) {
            ctx.fillStyle = `rgba(224, 88, 40, ${(0.24 * edgeFade * wSim).toFixed(3)})`;
          } else if (wInt > 0.4 && Math.abs(y - (originY - 0.12 * H * Math.sin(u * Math.PI))) < 28) {
            ctx.fillStyle = `rgba(243, 146, 0, ${(0.32 * edgeFade * wInt).toFixed(3)})`;
          } else {
            ctx.fillStyle = `rgba(235, 224, 204, ${(0.12 * edgeFade).toFixed(3)})`;
          }
          ctx.beginPath();
          ctx.arc(x, y, dotR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2b. Horizontal Failure / Viability Threshold Datum
      ctx.strokeStyle =
        wInt > 0.5 ? 'rgba(243, 146, 0, 0.42)' : 'rgba(224, 88, 40, 0.52)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(leftX, threshY + 0.5);
      ctx.lineTo(rightX, threshY + 0.5);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = '500 9px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillStyle = wInt > 0.5 ? 'rgba(243, 146, 0, 0.78)' : 'rgba(224, 88, 40, 0.85)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('VIABILITY THRESHOLD', rightX, threshY - 5);

      // 2c. Sweeping Adversarial Stress Front (Stage 02 · Simulate)
      const sweepU = 0.22 + ((t * 0.19) % 0.72);
      const sweepX = leftX + spanW * sweepU;
      if (wSim > 0.05) {
        ctx.save();
        ctx.globalAlpha = wSim;
        ctx.strokeStyle = 'rgba(224, 88, 40, 0.65)';
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(sweepX, H * 0.1);
        ctx.lineTo(sweepX, H * 0.86);
        ctx.stroke();

        ctx.font = '500 9px "IBM Plex Mono", ui-monospace, monospace';
        ctx.fillStyle = '#e05828';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('ADVERSARIAL SHOCK', sweepX + 8, H * 0.11);
        ctx.restore();
      }

      // 2d. 38 Branching Future Trajectories
      const stepsB = 48;
      for (const br of CONE_BRANCHES) {
        ctx.beginPath();
        let breakPt: [number, number] | null = null;
        for (let s = 0; s <= stepsB; s++) {
          const u = s / stepsB;
          const x = leftX + u * spanW;
          const fan = Math.pow(u, 0.88) * H * 0.36 * br.spread;
          const osc = Math.sin(u * Math.PI * br.waveFreq + br.phase + t * 0.55) * H * br.waveAmp * u;
          // Fragile paths plunge below threshold after breakU during Simulate
          const collapse =
            br.isBreak && u > br.breakU
              ? Math.pow((u - br.breakU) / (1 - br.breakU), 1.35) * H * 0.22
              : 0;
          const y = originY + fan + osc + collapse;
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);

          if (br.isBreak && !breakPt && y >= threshY && u > 0.25) {
            breakPt = [x, y];
          }
        }

        if (br.isBreak) {
          // Bold vermilion-amber fracture during Simulate; dim ghost during Intervene
          const alpha = wSim * (0.28 + br.weight * 0.5) + wInt * 0.08;
          ctx.strokeStyle = `rgba(224, 88, 40, ${alpha.toFixed(3)})`;
          ctx.lineWidth = wSim > 0.4 ? 1.35 : 0.85;
        } else {
          const alpha = wSim * (0.14 + br.weight * 0.22) + wInt * 0.11;
          ctx.strokeStyle = `rgba(235, 224, 204, ${alpha.toFixed(3)})`;
          ctx.lineWidth = 0.9;
        }
        ctx.stroke();

        // Crisp break-point crosshairs along threshold during Simulate
        if (breakPt && wSim > 0.25 && br.weight > 0.72) {
          ctx.fillStyle = `rgba(224, 88, 40, ${(0.88 * wSim).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(breakPt[0], breakPt[1], 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2e. Stage 03 · INTERVENE — The Sovereign Golden Trajectory & Resonance Rings
      if (wInt > 0.04) {
        ctx.save();
        ctx.globalAlpha = wInt;

        // Golden path geometry: departs T0, hits Delta inflection, rises cleanly above threshold
        const goldenY = (u: number): number => {
          if (u <= deltaU) {
            const k = u / deltaU;
            return originY + Math.sin(k * Math.PI * 0.8) * H * 0.075;
          }
          const k = (u - deltaU) / (1 - deltaU);
          const ease = 1 - Math.pow(1 - k, 2.4);
          return originY + H * 0.044 - ease * H * 0.21 + Math.sin(k * Math.PI * 2 + t * 0.8) * 3.5;
        };

        const deltaY = goldenY(deltaU);

        // Soft alternate intervention harmonics flanking the golden path
        for (const offset of [-18, -9, 9, 18]) {
          ctx.beginPath();
          for (let s = 0; s <= 56; s++) {
            const u = s / 56;
            const x = leftX + u * spanW;
            const post = Math.max(0, (u - deltaU) / (1 - deltaU));
            const y = goldenY(u) + offset * Math.sin(post * Math.PI);
            if (s === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = 'rgba(243, 146, 0, 0.22)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Primary sovereign golden trajectory (amber casing + crisp ivory filament)
        ctx.beginPath();
        for (let s = 0; s <= 64; s++) {
          const u = s / 64;
          const x = leftX + u * spanW;
          const y = goldenY(u);
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(243, 146, 0, 0.36)';
        ctx.lineWidth = 7;
        ctx.stroke();

        ctx.strokeStyle = '#f39200';
        ctx.lineWidth = 2.6;
        ctx.stroke();

        ctx.strokeStyle = '#fff5df';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Expanding calibrated resonance rings from Delta inflection node
        for (let r = 0; r < 3; r++) {
          const prog = (t * 0.42 + r / 3) % 1;
          const rad = 10 + prog * 74;
          ctx.strokeStyle = `rgba(243, 146, 0, ${(0.55 * (1 - prog)).toFixed(3)})`;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.arc(deltaX, deltaY, rad, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Crisp vertical Delta inflection crosshair
        ctx.strokeStyle = 'rgba(243, 146, 0, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(deltaX + 0.5, H * 0.14);
        ctx.lineTo(deltaX + 0.5, H * 0.84);
        ctx.stroke();

        // Delta jewel node
        ctx.fillStyle = '#110f0c';
        ctx.strokeStyle = '#f39200';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(deltaX, deltaY, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff5df';
        ctx.beginPath();
        ctx.arc(deltaX, deltaY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Clean optical annotations
        ctx.font = '500 9.5px "IBM Plex Mono", ui-monospace, monospace';
        ctx.fillStyle = '#f39200';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Δ INTERVENTION', deltaX + 10, H * 0.14);

        const endY = goldenY(1);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = '#fff5df';
        ctx.fillText('PLAN THAT HOLDS', rightX, endY - 12);

        // Traveling golden pulse on the solved path
        const pu = (t * 0.34) % 1;
        ctx.fillStyle = '#fff5df';
        ctx.beginPath();
        ctx.arc(leftX + pu * spanW, goldenY(pu), 3.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 2f. Present-moment Origin Reticle (T0) & Horizon Marker (T+N)
      ctx.fillStyle = '#f39200';
      ctx.beginPath();
      ctx.arc(leftX, originY, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(243, 146, 0, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(leftX, originY, 10, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = '500 9.5px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillStyle = 'rgba(235, 224, 204, 0.72)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('T₀  PRESENT', leftX, H - 28);
      ctx.textAlign = 'right';
      ctx.fillText('T+N  FUTURE HORIZON', rightX, H - 28);

      ctx.restore();
    }

    // =========================================================================
    // STAGE 04 · RECORD — Concentric Chronometric Pre-Outcome Seal
    // =========================================================================
    if (wRec > 0.01) {
      ctx.save();
      ctx.globalAlpha = wRec;

      const R = Math.min(W, H) * 0.34;
      const settle = 1 - wRec;

      // Concentric calibrated astrolabe vernier rings locking to zero
      const rings = [
        { r: R * 1.12, ticks: 120, rot: settle * 1.2 + t * 0.03, color: 'rgba(235, 224, 204, 0.24)', majorEvery: 10 },
        { r: R * 0.88, ticks: 72, rot: -settle * 1.6 - t * 0.02, color: 'rgba(243, 146, 0, 0.56)', majorEvery: 6 },
        { r: R * 0.62, ticks: 48, rot: settle * 0.9, color: 'rgba(235, 224, 204, 0.34)', majorEvery: 8 },
      ];

      for (const ring of rings) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ring.rot);

        ctx.strokeStyle = ring.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
        ctx.stroke();

        for (let k = 0; k < ring.ticks; k++) {
          const a = (k / ring.ticks) * Math.PI * 2;
          const major = k % ring.majorEvery === 0;
          const inner = ring.r - (major ? 10 : 4.5);
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
          ctx.lineTo(Math.cos(a) * ring.r, Math.sin(a) * ring.r);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Precision cardinal lock-index arcs (four amber locking quadrants)
      ctx.strokeStyle = '#f39200';
      ctx.lineWidth = 2.2;
      for (let q = 0; q < 4; q++) {
        const a0 = q * (Math.PI / 2) - 0.16;
        const a1 = q * (Math.PI / 2) + 0.16;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.98, a0, a1);
        ctx.stroke();
      }

      // Locked golden trajectory preserved inside the chronometric seal
      ctx.beginPath();
      for (let s = 0; s <= 40; s++) {
        const u = s / 40;
        const sx = cx - R * 0.52 + u * R * 1.04;
        const sy = cy + Math.sin(u * Math.PI) * -R * 0.14 + (0.5 - u) * R * 0.12;
        if (s === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.strokeStyle = '#f39200';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Deterministic optical commitment digest bar below center
      const barW = Math.min(R * 1.15, 224);
      const cellW = barW / SEAL_BITS.length;
      const barX = cx - barW * 0.5;
      const barY = cy + R * 0.24;
      for (let i = 0; i < SEAL_BITS.length; i++) {
        const v = SEAL_BITS[i]!;
        ctx.fillStyle =
          v === 2 ? '#f39200' : v === 1 ? 'rgba(235, 224, 204, 0.52)' : 'rgba(235, 224, 204, 0.12)';
        ctx.fillRect(barX + i * cellW, barY, Math.max(2, cellW - 2.5), v === 2 ? 10 : 6);
      }

      // Corner precision reticle & clean universal pre-outcome stamp
      ctx.font = '500 9.5px "IBM Plex Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#f39200';
      ctx.fillText('COMMITTED BEFORE OUTCOME', cx, cy + R * 1.2 + 8);

      ctx.fillStyle = 'rgba(235, 224, 204, 0.54)';
      ctx.textBaseline = 'bottom';
      ctx.fillText('00° 00′ · RECORD LOCKED', cx, cy - R * 1.2 - 6);

      ctx.restore();
    }
  };

  const loop = (now: number): void => {
    if (!visible || document.hidden) {
      raf = 0;
      return;
    }
    drawFrame(now);
    if (!reduced) raf = requestAnimationFrame(loop);
    else raf = 0;
  };

  const wake = (): void => {
    resize();
    lastNow = performance.now();
    drawFrame(lastNow);
    if (!reduced && !raf && visible && !document.hidden) {
      raf = requestAnimationFrame(loop);
    }
  };

  chs.forEach((b, i) =>
    b.addEventListener('click', () => {
      setStep(i, true);
      wake();
    }),
  );

  play?.addEventListener('click', () => {
    playing = !playing;
    stepStart = performance.now();
    syncDom();
    wake();
  });

  const stageHost = canvas.parentElement;
  stageHost?.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  stageHost?.addEventListener('pointerleave', () => {
    tx = 0;
    ty = 0;
  });

  new ResizeObserver(wake).observe(canvas);
  const io = new IntersectionObserver(
    (es) => {
      visible = es.some((e) => e.isIntersecting);
      if (visible) {
        stepStart = performance.now();
        wake();
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    { threshold: 0.08 },
  );
  io.observe(host);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && visible) wake();
  });

  syncDom();
  wake();
}
