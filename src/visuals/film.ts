/**
 * The Foresight Instrument (02 · How it works): a live 60fps Retina Canvas
 * schematic showing the four phases of a Foresight Machine on warm drafting
 * paper:
 *   01 Model     — institutional topology & live contractual flows
 *   02 Simulate  — 44 forward trajectories branching across regimes; breaking
 *                  points ignite below the PAR FLOOR
 *   03 Intervene — surgical amber intervention engages; failing trajectories
 *                  lift and converge cleanly above par, freeing liquidity
 *   04 Record    — pre-outcome cryptographic attestation locks at T0 with
 *                  post-event scoring checkpoints (+30D, +60D, +90D)
 */
import { prefersReducedMotion } from '../lib/prefers';

type StepMeta = {
  duration: number;
  plate: string;
  specKey: string;
  specVal: string;
};

const STEPS: StepMeta[] = [
  {
    duration: 6500,
    plate: 'INSTRUMENT 01 / 04 · MODEL',
    specKey: 'State space',
    specVal: 'Capital, contracts, counterparties, rails, and rules',
  },
  {
    duration: 7000,
    plate: 'INSTRUMENT 02 / 04 · SIMULATE',
    specKey: 'Stress frontier',
    specVal: '44 forward regimes evaluated against par and cutoff constraints',
  },
  {
    duration: 7000,
    plate: 'INSTRUMENT 03 / 04 · INTERVENE',
    specKey: 'Intervention',
    specVal: 'Second 24/7 rail + merchant cap + morning fund sweep',
  },
  {
    duration: 6500,
    plate: 'INSTRUMENT 04 / 04 · RECORD',
    specKey: 'Attestation',
    specVal: 'Hash 7c41…a9e0 committed before outcome · scored at T+90D',
  },
];

type NodeDef = {
  id: string;
  label: string;
  sub: string;
  mx: number; // model-phase normalized x (0..1)
  my: number; // model-phase normalized y (0..1)
  cx: number; // compact-left normalized x when simulation chart is open
  cy: number; // compact-left normalized y
  core?: boolean;
};

const NODES: NodeDef[] = [
  { id: 'issuer', label: 'ISSUER', sub: '$41.6B RESERVE', mx: 0.50, my: 0.48, cx: 0.14, cy: 0.48, core: true },
  { id: 'tbill', label: 'T-BILLS & REPO', sub: 'T+1 LIQUIDITY', mx: 0.24, my: 0.24, cx: 0.08, cy: 0.24 },
  { id: 'fund', label: 'GOV FUND', sub: 'MORNING SWEEP', mx: 0.22, my: 0.72, cx: 0.08, cy: 0.72 },
  { id: 'bankA', label: 'SETTLEMENT A', sub: '24/7 RAIL', mx: 0.76, my: 0.26, cx: 0.24, cy: 0.30 },
  { id: 'bankB', label: 'SETTLEMENT B', sub: 'FAILOVER RAIL', mx: 0.78, my: 0.72, cx: 0.24, cy: 0.68 },
  { id: 'partners', label: '140 PARTNERS', sub: 'MERCHANT FLOW', mx: 0.50, my: 0.17, cx: 0.15, cy: 0.16 },
  { id: 'rules', label: 'RULES & PAR', sub: 'GENIUS ACT', mx: 0.50, my: 0.81, cx: 0.15, cy: 0.82 },
];

type EdgeDef = [number, number, boolean?]; // [fromIdx, toIdx, isInterventionEdge]
const EDGES: EdgeDef[] = [
  [1, 0],
  [2, 0],
  [0, 3],
  [0, 4, true], // second 24/7 payout rail — lights up in Intervene
  [5, 0],
  [5, 3],
  [6, 0],
  [2, 4, true], // morning sweep to failover bank
];

// Deterministic pseudo-random for crisp repeatable trajectories
function hash(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

type Traj = {
  seed: number;
  baseSlope: number;
  shockAt: number;
  shockDepth: number;
  waveFreq: number;
  waveAmp: number;
  breaks: boolean;
  label?: string | undefined;
};

const TRAJS: Traj[] = Array.from({ length: 42 }, (_, i) => {
  const r1 = hash(i, 1);
  const r2 = hash(i, 2);
  const r3 = hash(i, 3);
  const breaks = i < 11; // 11 tail regimes breach par before intervention
  const shockDepth = breaks ? 0.24 + r1 * 0.26 : (r1 - 0.35) * 0.11;
  return {
    seed: i,
    baseSlope: (r2 - 0.48) * 0.08,
    shockAt: 0.24 + r3 * 0.42,
    shockDepth,
    waveFreq: 5 + r2 * 7,
    waveAmp: 0.012 + r1 * 0.018,
    breaks,
    label:
      i === 1
        ? 'BANK OFFLINE 3.5H'
        : i === 4
          ? 'SURGE 2.3×'
          : i === 8
            ? 'WEEKEND -$310M'
            : undefined,
  };
});

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

export function initFilm(root: HTMLElement): void {
  const reduced = prefersReducedMotion();
  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-go]'));
  const canvas = root.querySelector<HTMLCanvasElement>('[data-film-canvas]');
  const plateLabel = root.querySelector<HTMLElement>('[data-film-plate]');
  const stateLabel = root.querySelector<HTMLElement>('[data-film-state] span');
  const specKey = root.querySelector<HTMLElement>('[data-film-sk]');
  const specVal = root.querySelector<HTMLElement>('[data-film-sv]');
  const play = root.querySelector<HTMLButtonElement>('[data-play]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let current = 1;
  let timer = 0;
  let raf = 0;
  let t0 = 0;
  let paused = reduced;
  let inView = false;

  // Smoothly animated visual weights (0..1)
  let simW = 0; // 0 = full topology (step 1), 1 = compact topology + trajectory field (steps 2..4)
  let intW = 0; // 0 = unmitigated breaking curves, 1 = intervened safe curves (steps 3..4)
  let recW = 0; // 0 = active simulation, 1 = cryptographic lock & checkpoints (step 4)
  let lastNow = performance.now();

  let W = 800;
  let H = 480;
  let dpr = 1;

  const resize = (): void => {
    const r = canvas.getBoundingClientRect();
    if (r.width < 20 || r.height < 20) return;
    W = Math.round(r.width);
    H = Math.round(r.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  };

  const syncPlayUI = (): void => {
    const pt = play?.querySelector<HTMLElement>('[data-play-t]');
    if (pt) pt.textContent = paused ? 'Play' : 'Pause';
    play?.setAttribute('aria-label', paused ? 'Play the sequence' : 'Pause the sequence');
    if (stateLabel) stateLabel.textContent = paused ? 'Paused' : 'Live';
    root.classList.toggle('is-paused', paused);
  };

  const setStep = (n: number, instant = false): void => {
    current = n;
    root.dataset['s'] = String(n);
    const meta = STEPS[n - 1]!;
    if (plateLabel) plateLabel.textContent = meta.plate;
    if (specKey) specKey.textContent = meta.specKey;
    if (specVal) specVal.textContent = meta.specVal;
    chips.forEach((btn, i) => {
      const idx = i + 1;
      btn.classList.toggle('is-on', idx === n);
      btn.classList.toggle('is-done', idx < n);
      btn.setAttribute('aria-current', idx === n ? 'step' : 'false');
      const bar = btn.querySelector<HTMLElement>('b');
      if (bar) bar.style.height = idx < n ? '100%' : idx === n && paused ? '100%' : '0%';
    });
    if (instant || reduced) {
      simW = n >= 2 ? 1 : 0;
      intW = n >= 3 ? 1 : 0;
      recW = n >= 4 ? 1 : 0;
      draw(performance.now());
    }
  };

  const draw = (now: number): void => {
    const dt = Math.min(0.05, (now - lastNow) / 1000);
    lastNow = now;
    const rate = reduced ? 1 : 1 - Math.exp(-5.5 * dt);
    const targetSim = current >= 2 ? 1 : 0;
    const targetInt = current >= 3 ? 1 : 0;
    const targetRec = current >= 4 ? 1 : 0;
    simW = lerp(simW, targetSim, rate);
    intW = lerp(intW, targetInt, rate);
    recW = lerp(recW, targetRec, rate);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const compact = W < 560;
    const mono = '10px "IBM Plex Mono", ui-monospace, monospace';
    const monoSm = '9.5px "IBM Plex Mono", ui-monospace, monospace';
    const monoMd = '11px "IBM Plex Mono", ui-monospace, monospace';

    // 1. Archival drafting grid
    const step = compact ? 32 : 40;
    ctx.strokeStyle = 'rgba(20, 18, 16, 0.045)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = step; x < W; x += step) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
    }
    for (let y = step; y < H; y += step) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(W, y + 0.5);
    }
    ctx.stroke();

    // Chart coordinate zone (opens as simW -> 1)
    const chartL = W * (compact ? 0.09 : 0.34);
    const chartR = W * 0.94;
    const chartT = H * 0.14;
    const chartB = H * 0.84;
    const chartW = chartR - chartL;
    const chartH = chartB - chartT;
    const parY = chartT + chartH * 0.64; // PAR FLOOR ($1.00)
    const startY = chartT + chartH * 0.36;

    // 2. Vertical separator between topology and trajectory field (desktop)
    if (!compact && simW > 0.02) {
      ctx.save();
      ctx.globalAlpha = simW;
      ctx.strokeStyle = 'rgba(20, 18, 16, 0.12)';
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(W * 0.305, H * 0.09);
      ctx.lineTo(W * 0.305, H * 0.91);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 3. Topology graph (full stage in step 1; compact left column on desktop in steps 2..4; cleanly hidden on narrow phones)
    const topoAlpha = compact ? clamp(1 - simW * 1.5, 0, 1) : 1;
    if (topoAlpha > 0.02) {
      ctx.save();
      ctx.globalAlpha = topoAlpha;
      const pts = NODES.map((n) => ({
        x: lerp(n.mx, n.cx, simW) * W,
        y: lerp(n.my, n.cy, simW) * H,
        n,
      }));

      // Edges
      for (let ei = 0; ei < EDGES.length; ei++) {
        const [a, b, isInt] = EDGES[ei]!;
        const pa = pts[a]!;
        const pb = pts[b]!;
        if (isInt && intW < 0.02) {
          // Subtle dashed prospective path before intervention
          ctx.strokeStyle = 'rgba(20, 18, 16, 0.12)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();
          ctx.setLineDash([]);
          continue;
        }
        ctx.strokeStyle = isInt
          ? `rgba(243, 146, 0, ${(0.25 + 0.75 * intW).toFixed(3)})`
          : 'rgba(20, 18, 16, 0.22)';
        ctx.lineWidth = isInt ? 1.8 : 1.1;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();

        // Live pulse packet along edge
        const speed = isInt ? 0.36 : 0.22;
        const u = ((now / 1000) * speed + ei * 0.29) % 1;
        const px = lerp(pa.x, pb.x, u);
        const py = lerp(pa.y, pb.y, u);
        ctx.fillStyle = isInt ? '#f39200' : 'rgba(20, 18, 16, 0.55)';
        ctx.beginPath();
        ctx.arc(px, py, isInt ? 2.6 : 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Nodes
      for (const { x, y, n } of pts) {
        const r = n.core ? (simW > 0.5 ? 7 : 10) : simW > 0.5 ? 4 : 5.5;
        // Outer halo for core node
        if (n.core) {
          ctx.strokeStyle = 'rgba(243, 146, 0, 0.45)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, r + 6, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = n.core ? '#141210' : '#fcfaf5';
        ctx.strokeStyle = n.core ? '#f39200' : '#141210';
        ctx.lineWidth = n.core ? 2 : 1.25;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Labels (show full sublabels in step 1, concise labels in compact column)
        ctx.textAlign = 'center';
        ctx.font = n.core ? monoMd : monoSm;
        ctx.fillStyle = '#141210';
        const ly = y + r + (n.core ? 16 : 13);
        ctx.fillText(n.label, x, ly);
        if (simW < 0.6) {
          ctx.save();
          ctx.globalAlpha = (1 - simW / 0.6) * topoAlpha;
          ctx.font = monoSm;
          ctx.fillStyle = '#7c756b';
          ctx.fillText(n.sub, x, ly + 12);
          ctx.restore();
        }
      }

      // Intervention badge on compact topology
      if (intW > 0.15 && !compact) {
        ctx.save();
        ctx.globalAlpha = intW;
        ctx.fillStyle = '#fff5e4';
        ctx.strokeStyle = 'rgba(243, 146, 0, 0.6)';
        ctx.lineWidth = 1;
        const bx = W * 0.04;
        const by = H * 0.90;
        const bw = W * 0.23;
        ctx.fillRect(bx, by - 16, bw, 22);
        ctx.strokeRect(bx, by - 16, bw, 22);
        ctx.font = monoSm;
        ctx.fillStyle = '#a85f00';
        ctx.textAlign = 'center';
        ctx.fillText('+ 3 TERMS ACTIVE', bx + bw / 2, by - 2);
        ctx.restore();
      }

      ctx.restore();
    }

    // 4. Forward Simulation Trajectory Field (steps 2, 3, 4)
    if (simW > 0.02) {
      ctx.save();
      ctx.globalAlpha = simW;

      // Axis frame
      ctx.strokeStyle = 'rgba(20, 18, 16, 0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(chartL, chartT);
      ctx.lineTo(chartL, chartB);
      ctx.lineTo(chartR, chartB);
      ctx.stroke();

      // Time axis ticks
      const ticks: Array<[number, string]> = [
        [0, 'T0'],
        [0.33, 'T+30D'],
        [0.66, 'T+60D'],
        [1, 'T+90D'],
      ];
      ctx.font = monoSm;
      ctx.fillStyle = '#7c756b';
      ctx.textAlign = 'center';
      for (const [u, lbl] of ticks) {
        const tx = chartL + chartW * u;
        ctx.strokeStyle = 'rgba(20, 18, 16, 0.14)';
        ctx.beginPath();
        ctx.moveTo(tx, chartB);
        ctx.lineTo(tx, chartB + 5);
        ctx.stroke();
        ctx.fillText(lbl, tx, chartB + 17);
      }

      // Safe liquidity envelope fill in Intervene/Record
      if (intW > 0.05) {
        const envGrad = ctx.createLinearGradient(0, chartT + chartH * 0.18, 0, parY);
        envGrad.addColorStop(0, `rgba(243, 146, 0, ${(0.12 * intW).toFixed(3)})`);
        envGrad.addColorStop(1, `rgba(243, 146, 0, ${(0.02 * intW).toFixed(3)})`);
        ctx.fillStyle = envGrad;
        ctx.fillRect(chartL + 1, chartT + chartH * 0.24, chartW - 1, parY - (chartT + chartH * 0.24));
      }

      // Danger zone subtle tint below PAR FLOOR (fades out once intervened)
      const dangerAlpha = (1 - intW * 0.78) * 0.06;
      if (dangerAlpha > 0.005) {
        ctx.fillStyle = `rgba(185, 58, 22, ${dangerAlpha.toFixed(3)})`;
        ctx.fillRect(chartL + 1, parY, chartW - 1, chartB - parY);
      }

      // PAR FLOOR line
      ctx.strokeStyle = intW > 0.5 ? 'rgba(20, 18, 16, 0.42)' : 'rgba(185, 58, 22, 0.65)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(chartL, parY);
      ctx.lineTo(chartR, parY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = monoSm;
      ctx.textAlign = 'right';
      ctx.fillStyle = intW > 0.5 ? '#5c564d' : '#a93818';
      ctx.fillText('PAR FLOOR ($1.00)', chartR - 4, parY - 6);

      // Draw all 42 simulated forward trajectories
      const phase = reduced ? 0 : now / 1000;
      const samples = 44;

      for (const tr of TRAJS) {
        ctx.beginPath();
        let minBreachX = 0;
        let minBreachY = parY;
        let breached = false;

        for (let s = 0; s <= samples; s++) {
          const u = s / samples;
          const x = chartL + chartW * u;
          const drift = tr.baseSlope * u * chartH;
          const ripple = Math.sin(u * tr.waveFreq + tr.seed + phase * 0.55) * tr.waveAmp * chartH * u;
          // Shock dip (peaks after tr.shockAt)
          const shockProgress = clamp((u - tr.shockAt) / 0.22, 0, 1);
          const shockCurve = shockProgress * shockProgress * (3 - 2 * shockProgress);
          const unmitigatedDip = tr.shockDepth * shockCurve * chartH;
          // Intervention lifts & stabilizes all trajectories safely above PAR
          const mitigatedDip = unmitigatedDip * (1 - intW * 0.78) - intW * 0.06 * chartH * u;
          const y = clamp(startY + drift + ripple + mitigatedDip, chartT + 8, chartB - 6);

          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);

          if (y > parY + 2 && !breached) {
            breached = true;
            minBreachX = x;
            minBreachY = y;
          }
        }

        if (tr.breaks) {
          const rCol = Math.round(lerp(188, 232, intW));
          const gCol = Math.round(lerp(56, 138, intW));
          const bCol = Math.round(lerp(22, 12, intW));
          const alpha = lerp(0.72, 0.45, intW) * (1 - recW * 0.45);
          ctx.strokeStyle = `rgba(${rCol}, ${gCol}, ${bCol}, ${alpha.toFixed(3)})`;
          ctx.lineWidth = lerp(1.5, 1.15, intW);
        } else {
          ctx.strokeStyle = `rgba(20, 18, 16, ${(0.16 * (1 - recW * 0.4)).toFixed(3)})`;
          ctx.lineWidth = 0.9;
        }
        ctx.stroke();

        // Breaking point markers & crisp labels during Simulate (fade as intervention lifts them)
        if (tr.breaks && tr.label && breached && intW < 0.72) {
          const ba = (1 - intW / 0.72) * simW;
          ctx.save();
          ctx.globalAlpha = ba;
          ctx.fillStyle = '#b93a16';
          ctx.beginPath();
          ctx.arc(minBreachX, minBreachY, 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(185, 58, 22, 0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(minBreachX, minBreachY, 7 + Math.sin(phase * 3 + tr.seed) * 1.5, 0, Math.PI * 2);
          ctx.stroke();

          if (!compact) {
            ctx.font = monoSm;
            ctx.fillStyle = '#9e3010';
            ctx.textAlign = minBreachX > chartL + chartW * 0.72 ? 'right' : 'left';
            const lx = minBreachX + (minBreachX > chartL + chartW * 0.72 ? -10 : 10);
            ctx.fillText(tr.label, lx, minBreachY + 3);
          }
          ctx.restore();
        }
      }

      // Highlighted optimal intervened trajectory (steps 3 & 4)
      if (intW > 0.1) {
        ctx.save();
        ctx.globalAlpha = intW;
        ctx.strokeStyle = '#f39200';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        for (let s = 0; s <= samples; s++) {
          const u = s / samples;
          const x = chartL + chartW * u;
          const y = startY - 0.04 * chartH * u + Math.sin(u * 6.5) * 0.015 * chartH;
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Status callout top-right of chart
        const badgeText = recW > 0.5 ? 'COMMITTED · 7C41…A9E0' : 'ALL 4 REGIMES HELD ABOVE PAR';
        ctx.font = mono;
        const tw = ctx.measureText(badgeText).width;
        const bx = chartR - tw - 22;
        const by = chartT + 6;
        ctx.fillStyle = recW > 0.5 ? '#141210' : '#fff7ea';
        ctx.strokeStyle = '#f39200';
        ctx.lineWidth = 1;
        ctx.fillRect(bx, by, tw + 20, 22);
        ctx.strokeRect(bx, by, tw + 20, 22);
        ctx.fillStyle = recW > 0.5 ? '#f5f1e8' : '#8f5000';
        ctx.textAlign = 'left';
        ctx.fillText(badgeText, bx + 10, by + 14.5);
        ctx.restore();
      }

      // 5. Cryptographic Pre-Outcome Lock Overlay (step 4)
      if (recW > 0.05) {
        ctx.save();
        ctx.globalAlpha = recW;

        // T0 vertical attestation beam
        ctx.strokeStyle = '#141210';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(chartL + 1, chartT - 6);
        ctx.lineTo(chartL + 1, chartB);
        ctx.stroke();

        // T0 anchor dot
        ctx.fillStyle = '#f39200';
        ctx.strokeStyle = '#141210';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(chartL + 1, startY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Scoring checkpoints along optimal path (+30D, +60D, +90D)
        for (const [u, tag] of [
          [0.33, '78/78 REPLAY'],
          [0.66, 'STRESS PASS'],
          [1.0, 'SCORED +90D'],
        ] as Array<[number, string]>) {
          const cx = chartL + chartW * u;
          const cy = startY - 0.04 * chartH * u + Math.sin(u * 6.5) * 0.015 * chartH;
          ctx.strokeStyle = 'rgba(20, 18, 16, 0.25)';
          ctx.setLineDash([2, 3]);
          ctx.beginPath();
          ctx.moveTo(cx, cy + 5);
          ctx.lineTo(cx, chartB);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#fcfaf5';
          ctx.strokeStyle = '#141210';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          if (!compact) {
            ctx.font = monoSm;
            ctx.fillStyle = '#141210';
            ctx.textAlign = u === 1 ? 'right' : 'center';
            ctx.fillText(tag, cx, cy - 11);
          }
        }

        // Clean dossier record card bottom-left of chart
        const cardW = compact ? chartW * 0.88 : 262;
        const cardH = 52;
        const cardX = chartL + 14;
        const cardY = chartB - cardH - 12;
        ctx.fillStyle = 'rgba(252, 250, 245, 0.96)';
        ctx.strokeStyle = '#141210';
        ctx.lineWidth = 1;
        ctx.fillRect(cardX, cardY, cardW, cardH);
        ctx.strokeRect(cardX, cardY, cardW, cardH);
        // Amber left bar
        ctx.fillStyle = '#f39200';
        ctx.fillRect(cardX, cardY, 3, cardH);

        ctx.textAlign = 'left';
        ctx.font = monoSm;
        ctx.fillStyle = '#a85f00';
        ctx.fillText('PRE-OUTCOME LEDGER · LOCKED', cardX + 12, cardY + 18);
        ctx.fillStyle = '#141210';
        ctx.font = mono;
        ctx.fillText('SHA-256  7c41f8…a9e0   ·   $500M FREED', cardX + 12, cardY + 37);

        ctx.restore();
      }

      ctx.restore();
    }
  };

  const stopClock = (): void => {
    window.clearTimeout(timer);
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const loop = (now: number): void => {
    if (!paused && inView) {
      const bar = chips[current - 1]?.querySelector<HTMLElement>('b');
      const dur = STEPS[current - 1]!.duration;
      if (bar) {
        const pct = Math.min(100, ((now - t0) / dur) * 100);
        bar.style.height = `${pct}%`;
      }
    }
    draw(now);
    if (inView && !document.hidden) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = 0;
    }
  };

  const startLoop = (): void => {
    if (!raf && inView && !document.hidden) {
      lastNow = performance.now();
      raf = requestAnimationFrame(loop);
    }
  };

  const schedule = (): void => {
    window.clearTimeout(timer);
    if (paused || !inView) return;
    t0 = performance.now();
    timer = window.setTimeout(() => {
      setStep(current === STEPS.length ? 1 : current + 1);
      schedule();
    }, STEPS[current - 1]!.duration);
    startLoop();
  };

  chips.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      setStep(i + 1);
      schedule();
      startLoop();
    });
  });

  play?.addEventListener('click', () => {
    paused = !paused;
    syncPlayUI();
    setStep(current);
    if (paused) window.clearTimeout(timer);
    else schedule();
    startLoop();
  });

  resize();
  new ResizeObserver(() => {
    resize();
    draw(performance.now());
  }).observe(canvas);

  setStep(1, true);
  syncPlayUI();
  root.classList.add('is-open', 'is-playing');

  if (reduced) {
    root.classList.add('is-still');
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      inView = entries.some((e) => e.isIntersecting);
      if (inView) {
        startLoop();
        schedule();
      } else {
        stopClock();
      }
    },
    { threshold: 0.15 },
  );
  io.observe(root);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopClock();
    else if (inView) {
      startLoop();
      schedule();
    }
  });
}
