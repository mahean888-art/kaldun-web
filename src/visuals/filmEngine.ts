/**
 * 02 · How it works — Architectural Maquette & Temporal Slice Engine
 *
 * Uses the actual studio-rendered Blender Cycles world plate and eight frosted
 * optical slices (/deck-world-wide.webp, /deck-slice0..7-wide.webp, /deck-slice3p-wide.webp)
 * registered to the exact camera-projected paths in src/data/deck.json.
 *
 * Four choreographed architectural states:
 *   01 · Model     — Isolated world maquette, hairline structural callouts, live clearing flows
 *   02 · Simulate  — Eight frosted future slices fan outward; stress trajectories test par ($1.00)
 *   03 · Intervene — Amber solution slice illuminates; changed rail activates; curves lift above par
 *   04 · Record    — Slices register into a sealed archive stack; pre-outcome commitment stamps
 */
import deck from '../data/deck.json';
import { prefersReducedMotion } from '../lib/prefers';

type P = [number, number, number];
type DeckView = { w: number; h: number; paths: Record<string, P[][]> };
const WIDE = (deck as unknown as Record<'wide' | 'narrow', DeckView>).wide;

const DURS = [5600, 6200, 6200, 5600] as const;

const META = [
  {
    plate: '01 · Model',
    sk: 'State space',
    sv: 'Capital, contracts, counterparties, rails, and rules',
    code: '25 banks · 140 partners · 12 chains',
  },
  {
    plate: '02 · Simulate',
    sk: 'Stress tests',
    sv: 'Held-out crises and the smallest shock that breaks par',
    code: '312 branches tested · par $1.00',
  },
  {
    plate: '03 · Intervene',
    sk: 'Changed terms',
    sv: 'Second 24/7 rail, daily merchant cap, and morning sweep',
    code: 'Three terms · $500M freed',
  },
  {
    plate: '04 · Record',
    sk: 'Pre-outcome record',
    sv: 'Written down and hashed before the outcome is known',
    code: 'Hash 7c41…a9e0 · committed',
  },
] as const;

type Track = { pts: P[]; acc: number[]; len: number };
function buildTrack(raw: P[]): Track {
  const acc = [0];
  for (let i = 1; i < raw.length; i++) {
    acc.push(acc[i - 1]! + Math.hypot(raw[i]![0] - raw[i - 1]![0], raw[i]![1] - raw[i - 1]![1]));
  }
  return { pts: raw, acc, len: acc[acc.length - 1] || 1 };
}

function sampleTrack(t: Track, u: number): [number, number] {
  const d = Math.max(0, Math.min(1, u)) * t.len;
  let lo = 0;
  let hi = t.acc.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (t.acc[mid]! < d) lo = mid;
    else hi = mid;
  }
  const a = t.pts[lo]!;
  const b = t.pts[hi]!;
  const span = t.acc[hi]! - t.acc[lo]! || 1;
  const k = (d - t.acc[lo]!) / span;
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
}

const damp = (curr: number, target: number, lambda: number, dt: number): number =>
  curr + (target - curr) * (1 - Math.exp(-lambda * dt));

const TRACKS_BASE: Track[] = [
  ...(WIDE.paths['road'] ?? []),
  ...(WIDE.paths['rail'] ?? []),
  ...(WIDE.paths['link'] ?? []),
].map(buildTrack);
const TRACKS_FOUND: Track[] = (WIDE.paths['found'] ?? []).map(buildTrack);

// Architectural callout pins anchored to actual elements of deck-world-wide.webp (2400x980)
const PINS: ReadonlyArray<{
  nx: number;
  ny: number;
  lx: number;
  ly: number;
  label: string;
  align: 'left' | 'right';
}> = [
  { nx: 0.305, ny: 0.61, lx: 0.145, ly: 0.28, label: 'POWER & STORAGE', align: 'left' },
  { nx: 0.448, ny: 0.39, lx: 0.295, ly: 0.14, label: 'RESERVE · $41.6B', align: 'left' },
  { nx: 0.545, ny: 0.56, lx: 0.725, ly: 0.15, label: '25 BANKS · 24/7 RAILS', align: 'right' },
  { nx: 0.655, ny: 0.62, lx: 0.855, ly: 0.31, label: '140 PARTNERS · TRADE', align: 'right' },
];

// Deterministic stress trajectories for Simulate (02) and Intervene (03)
const BRANCHES = Array.from({ length: 14 }, (_, i) => {
  const seed = (i + 1) * 1.6180339;
  const isBreak = i === 2 || i === 7 || i === 11;
  const depth = isBreak ? 0.68 + (i % 3) * 0.13 : 0.12 + ((Math.sin(seed * 7.3) + 1) * 0.5) * 0.32;
  const freq = 1.4 + (i % 5) * 0.38;
  const phase = seed * 2.1;
  return { isBreak, depth, freq, phase };
});

function loadImg(src: string): HTMLImageElement {
  const im = new Image();
  im.decoding = 'async';
  im.src = src;
  return im;
}

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

  // Load real Blender Cycles studio layers
  const worldImg = loadImg('/deck-world-wide.webp');
  const sliceImgs = Array.from({ length: 8 }, (_, k) =>
    loadImg(k === 3 ? '/deck-slice3p-wide.webp' : `/deck-slice${k}-wide.webp`),
  );
  const litSliceImg = loadImg('/deck-slice3-wide.webp');

  const reduced = prefersReducedMotion();
  let step = 0;
  let playing = !reduced;
  let visible = false;
  let stepStart = performance.now();
  let lastNow = performance.now();
  let raf = 0;
  let W = 900;
  let H = 540;
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

  const drawFrame = (now: number): void => {
    const dt = Math.min((now - lastNow) / 1000, 0.08);
    lastNow = now;
    const t = reduced ? 1.8 : now / 1000;

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

    px = damp(px, tx, 5, dt);
    py = damp(py, ty, 5, dt);
    for (let i = 0; i < 4; i++) {
      w[i] = damp(w[i]!, i === step ? 1 : 0, 5.2, dt);
    }

    const wModel = w[0]!;
    const wSim = w[1]!;
    const wInt = w[2]!;
    const wRec = w[3]!;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. Studio warm stone ground (#f3f0e8)
    ctx.fillStyle = '#f3f0e8';
    ctx.fillRect(0, 0, W, H);

    // Subtle architectural 6-column vertical drafting hairlines
    const compact = W < 560;
    const bandH = compact ? Math.round(H * 0.34) : Math.round(H * 0.27);
    const stageH = H - bandH;

    ctx.strokeStyle = 'rgba(20, 18, 16, 0.055)';
    ctx.lineWidth = 1;
    const cols = 6;
    for (let c = 1; c < cols; c++) {
      const gx = Math.round((W / cols) * c) + 0.5;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, stageH);
      ctx.stroke();
    }
    // Delicate edge millimeter ticks along left & right walls
    ctx.strokeStyle = 'rgba(20, 18, 16, 0.14)';
    for (let tyTick = 18; tyTick < stageH - 12; tyTick += 18) {
      const major = tyTick % 72 === 0;
      const len = major ? 7 : 3.5;
      ctx.beginPath();
      ctx.moveTo(0, tyTick + 0.5);
      ctx.lineTo(len, tyTick + 0.5);
      ctx.moveTo(W - len, tyTick + 0.5);
      ctx.lineTo(W, tyTick + 0.5);
      ctx.stroke();
    }

    // 2. Compute registered 2400x980 maquette viewport inside upper stage
    const imgAspect = 2400 / 980;
    let drawW = W * (compact ? 1.18 : 1.06);
    let drawH = drawW / imgAspect;
    const maxDrawH = stageH * 0.94;
    if (drawH > maxDrawH) {
      drawH = maxDrawH;
      drawW = drawH * imgAspect;
    }
    const baseX = (W - drawW) * 0.5 + px * 8;
    const baseY = (stageH - drawH) * 0.56 + py * 4;

    const toStage = (nx: number, ny: number): [number, number] => [
      baseX + nx * drawW,
      baseY + ny * drawH,
    ];

    // 3. Frosted Acrylic Future Slices (behind the porcelain world)
    const sliceVis = Math.max(wSim, wInt, wRec * 0.85);
    if (sliceVis > 0.01) {
      for (let k = 7; k >= 0; k--) {
        const im = sliceImgs[k];
        if (!im || !im.complete || !im.naturalWidth) continue;
        const norm = (k - 3.5) / 3.5; // -1 .. +1
        const isLit = k === 3;

        // Fan open in Simulate, focus slice 3 in Intervene, register tight in Record
        const fanShiftX = norm * drawW * (0.048 * wSim + 0.022 * wInt - 0.012 * wRec);
        const fanShiftY =
          (1 - sliceVis) * 28 +
          Math.abs(norm) * drawH * (0.035 * wSim) -
          (isLit ? 7 * wInt : 0) +
          wRec * (k - 3.5) * -1.4;
        const paraX = px * (4 + (7 - k) * 1.4);

        let alpha = 0;
        if (isLit) {
          alpha = (0.78 * wSim + 0.25 * wInt + 0.35 * wRec) * sliceVis;
        } else {
          alpha = (0.88 * wSim + 0.34 * wInt + 0.56 * wRec) * sliceVis;
        }

        if (alpha > 0.01) {
          ctx.save();
          ctx.globalAlpha = Math.min(1, alpha);
          ctx.drawImage(im, baseX + fanShiftX + paraX, baseY + fanShiftY, drawW, drawH);
          ctx.restore();
        }

        // Illuminated warm amber intervention slice (deck-slice3-wide.webp)
        if (isLit && litSliceImg.complete && litSliceImg.naturalWidth) {
          const litAlpha = Math.min(1, wInt * 1.0 + wRec * 0.92 + wSim * 0.14);
          if (litAlpha > 0.01) {
            ctx.save();
            ctx.globalAlpha = litAlpha;
            ctx.drawImage(
              litSliceImg,
              baseX + fanShiftX + paraX,
              baseY + fanShiftY,
              drawW,
              drawH,
            );
            ctx.restore();
          }
        }
      }
    }

    // 4. Foreground Photoreal Blender Cycles White World Maquette
    if (worldImg.complete && worldImg.naturalWidth) {
      ctx.save();
      ctx.drawImage(worldImg, baseX, baseY, drawW, drawH);
      ctx.restore();
    }

    // 5. Real 3D Camera-Projected Flow Lines on the World Maquette (deck.json)
    const flowAlpha = Math.max(wModel * 0.9, wSim * 0.5, wInt * 0.95, wRec * 0.55);
    if (flowAlpha > 0.04) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Base infrastructure paths (roads, rails, bank links)
      for (let ti = 0; ti < TRACKS_BASE.length; ti++) {
        const tr = TRACKS_BASE[ti]!;
        ctx.beginPath();
        for (let j = 0; j < tr.pts.length; j++) {
          const [sx, sy] = toStage(tr.pts[j]![0], tr.pts[j]![1]);
          if (j === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle =
          wSim > 0.45
            ? `rgba(184, 64, 28, ${(0.22 * wSim).toFixed(3)})`
            : `rgba(240, 144, 10, ${(0.26 * flowAlpha).toFixed(3)})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Crisp traveling light packet along each path
        const u = (t * 0.24 + ti * 0.19) % 1;
        const [pxPt, pyPt] = sampleTrack(tr, u);
        const [sx, sy] = toStage(pxPt, pyPt);
        ctx.fillStyle =
          wSim > 0.45
            ? `rgba(184, 64, 28, ${(0.82 * wSim).toFixed(3)})`
            : `rgba(240, 144, 10, ${(0.88 * flowAlpha).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Highlighted changed connection (found path) during Intervene & Record
      const foundVis = Math.max(wInt, wRec * 0.85);
      if (foundVis > 0.04) {
        for (const tr of TRACKS_FOUND) {
          ctx.beginPath();
          for (let j = 0; j < tr.pts.length; j++) {
            const [sx, sy] = toStage(tr.pts[j]![0], tr.pts[j]![1]);
            if (j === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.strokeStyle = `rgba(240, 144, 10, ${(0.95 * foundVis).toFixed(3)})`;
          ctx.lineWidth = 2.6;
          ctx.stroke();

          for (let k = 0; k < 2; k++) {
            const u = (t * 0.42 + k * 0.5) % 1;
            const [fx, fy] = sampleTrack(tr, u);
            const [sx, sy] = toStage(fx, fy);
            ctx.fillStyle = '#fff9ee';
            ctx.strokeStyle = '#d97700';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(sx, sy, 3.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }

    // 6. Stage 01 · Model — Crisp Architectural Callout Leaders
    if (wModel > 0.05 && !compact) {
      ctx.save();
      ctx.globalAlpha = wModel;
      ctx.font = '500 9.5px "IBM Plex Mono", ui-monospace, monospace';
      for (const pin of PINS) {
        const [ax, ay] = toStage(pin.nx, pin.ny);
        const lx = pin.lx * W;
        const ly = pin.ly * stageH;
        const elbowX = pin.align === 'left' ? lx + 12 : lx - 12;

        ctx.strokeStyle = 'rgba(20, 18, 16, 0.28)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(elbowX, ly);
        ctx.lineTo(lx, ly);
        ctx.stroke();

        // Anchor crosshair dot on maquette
        ctx.fillStyle = '#f0900a';
        ctx.beginPath();
        ctx.arc(ax, ay, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(20, 18, 16, 0.45)';
        ctx.beginPath();
        ctx.arc(ax, ay, 5.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#2d2a25';
        ctx.textAlign = pin.align === 'left' ? 'left' : 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(pin.label, lx, ly - 5);
      }
      ctx.restore();
    }

    // 7. Stage 04 · Record — Architectural Registration Reticle around Solved World
    if (wRec > 0.05) {
      ctx.save();
      ctx.globalAlpha = wRec;
      const rx = Math.round(W * 0.14);
      const ry = Math.round(stageH * 0.10);
      const rw = Math.round(W * 0.72);
      const rh = Math.round(stageH * 0.80);
      const br = 12;

      ctx.strokeStyle = 'rgba(20, 18, 16, 0.22)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.strokeRect(rx + 0.5, ry + 0.5, rw, rh);
      ctx.setLineDash([]);

      // Amber precision corner brackets
      ctx.strokeStyle = '#e08200';
      ctx.lineWidth = 1.6;
      const corners: Array<[number, number, number, number]> = [
        [rx, ry, 1, 1],
        [rx + rw, ry, -1, 1],
        [rx, ry + rh, 1, -1],
        [rx + rw, ry + rh, -1, -1],
      ];
      for (const [cx, cy, sx, sy] of corners) {
        ctx.beginPath();
        ctx.moveTo(cx + sx * br, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + sy * br);
        ctx.stroke();
      }

      // Small archival stamp top-right inside reticle
      ctx.font = '600 9.5px "IBM Plex Mono", ui-monospace, monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#a85f00';
      ctx.fillText('RECORD LOCKED · 7c41…a9e0', rx + rw - 10, ry + 9);
      ctx.restore();
    }

    // 8. Lower Architectural Telemetry Band (razor-sharp Swiss readout per stage)
    ctx.fillStyle = '#faf8f3';
    ctx.fillRect(0, stageH, W, bandH);
    ctx.strokeStyle = 'rgba(20, 18, 16, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, stageH + 0.5);
    ctx.lineTo(W, stageH + 0.5);
    ctx.stroke();

    const padX = compact ? 14 : 22;
    const innerW = W - padX * 2;
    const innerTop = stageH + 12;
    const innerH = bandH - 22;

    // 8a. Model Telemetry — Structured 4-column Institutional State Matrix
    if (wModel > 0.05) {
      ctx.save();
      ctx.globalAlpha = wModel;
      const items = [
        { k: 'RESERVE', v: '$41.6B', s: 'T-bills · repo · 4 banks' },
        { k: 'COUNTERPARTIES', v: '140', s: '25 banks · 12 chains' },
        { k: 'REPLAY ACCURACY', v: '±1.8%', s: '78 held-out weeks' },
        { k: 'CONSTRAINTS', v: 'PAR $1.00', s: '15-min · 24/7 rails' },
      ];
      const count = compact ? 2 : 4;
      const colW = innerW / count;
      for (let i = 0; i < count; i++) {
        const it = items[i]!;
        const cx = padX + i * colW;
        if (i > 0) {
          ctx.strokeStyle = 'rgba(20, 18, 16, 0.1)';
          ctx.beginPath();
          ctx.moveTo(cx - 8 + 0.5, innerTop);
          ctx.lineTo(cx - 8 + 0.5, innerTop + innerH);
          ctx.stroke();
        }
        ctx.font = '500 9.5px "IBM Plex Mono", ui-monospace, monospace';
        ctx.fillStyle = '#7c756b';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(it.k, cx, innerTop + 2);

        ctx.font = '500 18px "Geist", -apple-system, sans-serif';
        ctx.fillStyle = '#141210';
        ctx.fillText(it.v, cx, innerTop + 21);

        ctx.font = '400 11px "Geist", -apple-system, sans-serif';
        ctx.fillStyle = '#6b655c';
        ctx.fillText(it.s, cx, innerTop + 47);
      }
      ctx.restore();
    }

    // 8b. Simulate & Intervene Telemetry — Razor-sharp Swiss Par-Datum Stress Graph
    const graphAlpha = Math.max(wSim, wInt);
    if (graphAlpha > 0.05) {
      ctx.save();
      ctx.globalAlpha = graphAlpha;
      const labelCol = compact ? 0 : 196;
      const gx = padX;
      const gw = innerW - labelCol;
      const gy = innerTop + 14;
      const gh = Math.max(36, innerH - 22);
      const parY = gy + gh * 0.36;

      // Graph header label
      ctx.font = '500 9.5px "IBM Plex Mono", ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = wInt > 0.5 ? '#a85f00' : '#7c756b';
      ctx.fillText(
        wInt > 0.5
          ? 'STRESS HORIZON · WITH THREE INTERVENTIONS'
          : 'STRESS HORIZON · 312 BRANCHES AGAINST PAR ($1.00)',
        gx,
        innerTop - 2,
      );

      // Horizontal Par Datum line
      ctx.strokeStyle = 'rgba(20, 18, 16, 0.34)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(gx, parY + 0.5);
      ctx.lineTo(gx + gw - 58, parY + 0.5);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw stress branch curves
      const samples = 44;
      for (const br of BRANCHES) {
        ctx.beginPath();
        for (let s = 0; s <= samples; s++) {
          const u = s / samples;
          const x = gx + u * (gw - 62);
          // Baseline shock dips below par; intervention lifts smoothly above par
          const envelope = Math.sin(u * Math.PI);
          const wave = Math.sin(u * Math.PI * br.freq + br.phase + t * 0.4) * 0.08 * envelope;
          const rawDip = br.depth * Math.pow(Math.sin(Math.min(1, u * 1.12) * Math.PI), 1.35);
          const liftedDip = rawDip * (1 - wInt * 0.88) - wInt * 0.16 * envelope;
          const y = parY - gh * 0.16 + (liftedDip + wave) * gh * 0.72;
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        if (br.isBreak) {
          ctx.strokeStyle =
            wInt > 0.5
              ? `rgba(232, 134, 0, ${(0.88 * wInt + 0.25).toFixed(3)})`
              : `rgba(184, 64, 28, ${(0.86 * wSim + 0.2).toFixed(3)})`;
          ctx.lineWidth = 1.75;
        } else {
          ctx.strokeStyle = 'rgba(20, 18, 16, 0.13)';
          ctx.lineWidth = 1;
        }
        ctx.stroke();
      }

      // Clean non-overlapping PAR $1.00 datum label on right end of dashed rule
      ctx.font = '500 9px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillStyle = '#4d4840';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('PAR $1.00', gx + gw, parY + 0.5);

      // Right-hand crisp summary column (desktop)
      if (!compact) {
        const rx = gx + gw + 18;
        ctx.strokeStyle = 'rgba(20, 18, 16, 0.1)';
        ctx.beginPath();
        ctx.moveTo(rx - 9 + 0.5, innerTop);
        ctx.lineTo(rx - 9 + 0.5, innerTop + innerH);
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = '500 9.5px "IBM Plex Mono", ui-monospace, monospace';
        ctx.fillStyle = wInt > 0.5 ? '#a85f00' : '#b8401c';
        ctx.fillText(wInt > 0.5 ? 'PAR HELD' : 'BREAKS FIRST', rx, innerTop + 2);

        ctx.font = '500 17px "Geist", -apple-system, sans-serif';
        ctx.fillStyle = '#141210';
        ctx.fillText(wInt > 0.5 ? '$1.9B run held' : 'Short $310M', rx, innerTop + 20);

        ctx.font = '400 11px "Geist", -apple-system, sans-serif';
        ctx.fillStyle = '#575249';
        ctx.fillText(
          wInt > 0.5 ? '3 terms · $500M freed' : 'Bank offline: 3.5 h',
          rx,
          innerTop + 46,
        );
      }
      ctx.restore();
    }

    // 8c. Record Telemetry — Clean Pre-Outcome Archival Ledger Strip
    if (wRec > 0.05) {
      ctx.save();
      ctx.globalAlpha = wRec;
      const colsRec = [
        { k: 'STATUS', v: 'Committed', s: 'Before the outcome' },
        { k: 'RECORD HASH', v: '7c41…a9e0', s: 'Immutable digest' },
        { k: 'HELD-OUT REPLAY', v: '78 / 78 wks', s: 'All four regimes raised' },
        { k: 'SCORING WINDOW', v: '90 days', s: 'Corrected by outcome' },
      ];
      const count = compact ? 2 : 4;
      const colW = innerW / count;
      for (let i = 0; i < count; i++) {
        const it = colsRec[i]!;
        const cx = padX + i * colW;
        if (i > 0) {
          ctx.strokeStyle = 'rgba(20, 18, 16, 0.1)';
          ctx.beginPath();
          ctx.moveTo(cx - 8 + 0.5, innerTop);
          ctx.lineTo(cx - 8 + 0.5, innerTop + innerH);
          ctx.stroke();
        }
        ctx.font = '500 9.5px "IBM Plex Mono", ui-monospace, monospace';
        ctx.fillStyle = i === 0 ? '#a85f00' : '#7c756b';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(it.k, cx, innerTop + 2);

        ctx.font =
          i === 1
            ? '500 16px "IBM Plex Mono", ui-monospace, monospace'
            : '500 18px "Geist", -apple-system, sans-serif';
        ctx.fillStyle = '#141210';
        ctx.fillText(it.v, cx, innerTop + 21);

        ctx.font = '400 11px "Geist", -apple-system, sans-serif';
        ctx.fillStyle = '#6b655c';
        ctx.fillText(it.s, cx, innerTop + 47);
      }
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

  // Repaint as soon as studio renders decode
  for (const im of [worldImg, litSliceImg, ...sliceImgs]) {
    im.addEventListener('load', () => wake(), { once: true });
  }

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
