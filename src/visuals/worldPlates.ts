/**
 * World plates — the stratified architectural CAD plates for 04 · Worlds,
 * 03 · Mission, and the Step 04 pre-outcome commitment seal.
 *
 * Rendered via strata.ts in the visual grammar of Denis Villeneuve's Dune
 * production dossiers: dense hairline horizontal strata over patinated
 * mineral radial grounds, paired with crisp orthographic projections and
 * a single spice-ochre governing contour per object.
 */

import {
  type Section,
  type StrataSolid,
  type StrataStyle,
  callout,
  chamfer,
  circle,
  drawElevation,
  drawIso,
  drawPlan,
  fitCanvas,
  hull,
  project,
  rounded,
} from './strata';

const sec = (
  outer: Section['outer'],
  id: string,
  holes?: Section['holes'],
  accent?: boolean,
): Section => {
  const s: Section = { outer, id };
  if (holes && holes.length) (s as { holes?: Section['holes'] }).holes = holes;
  if (accent) (s as { accent?: boolean }).accent = true;
  return s;
};

// ---------------------------------------------------------------------------
// 01 · Money — The Clearing House (Caladan Parchment)
// Reserve drum with spice-ochre par contour, attestation tower, ledger block.
// ---------------------------------------------------------------------------
export const CLEARING: StrataSolid = {
  height: 118,
  slices: 64,
  at(t) {
    const out: Section[] = [];
    const n = 64;
    const i = Math.round(t * (n - 1));
    if (t <= 0.4) {
      const w = 250 - t * 16;
      const h = 156 - t * 12;
      const holes =
        t > 0.27
          ? [
              circle(78, 34, 15, 40),
              circle(78, -34, 15, 40),
              rounded(-12, 52, 82, 13, 6.5),
              circle(118, 0, 6, 24),
            ]
          : [];
      out.push(sec(chamfer(0, 0, w, h, 22 - t * 6), 'base', holes));
    }
    if (t > 0.4) {
      const lip = t < 0.45;
      const r = lip ? 49 : 42;
      const holes = t > 0.88 ? [circle(-38, -6, 28, 64)] : [];
      out.push(
        sec(
          circle(-38, -6, r, 72),
          'drum',
          holes,
          Math.abs(i - Math.round(0.68 * (n - 1))) <= 1,
        ),
      );
      if (t <= 0.74) out.push(sec(chamfer(72, -38, 30, 24, 5), 'tower'));
      if (t <= 0.52) {
        out.push(
          sec(
            chamfer(62, 34, 72, 30, 6),
            'ledger',
            t > 0.48 ? [rounded(62, 34, 52, 10, 5)] : [],
          ),
        );
      }
    }
    return out;
  },
};

// ---------------------------------------------------------------------------
// 02 · Power & Compute — The Substation (Emperor Warm Taupe)
// Five-tier terraced campus with twin bridge-power pylons & energized crest.
// ---------------------------------------------------------------------------
export const SUBSTATION: StrataSolid = {
  height: 120,
  slices: 66,
  at(t) {
    const terraces = 5;
    const k = Math.min(terraces - 1, Math.floor(t * terraces));
    const f = t * terraces - k;
    const w = 270 - k * 40 - f * 7;
    const h = 176 - k * 28 - f * 5;
    const holes = k >= 3 ? [rounded(0, 0, w * 0.62, 11, 5.5)] : [];
    const accent = k === terraces - 1 && f > 0.82;
    const out: Section[] = [sec(chamfer(0, 0, w, h, 12), 'tier', holes, accent)];
    if (t > 0.22 && t < 0.86) {
      out.push(sec(chamfer(-112, -58, 14, 14, 3), 'pyA'));
      out.push(sec(chamfer(112, 58, 14, 14, 3), 'pyB'));
    }
    return out;
  },
};

// ---------------------------------------------------------------------------
// 03 · Trade — The Hull (Harkonnen Patinated Bronze-Umber)
// Stratified maritime corridor hull with cargo holds, bridge & waterline.
// ---------------------------------------------------------------------------
export const HULL: StrataSolid = {
  height: 84,
  slices: 76,
  at(t) {
    const n = 76;
    const i = Math.round(t * (n - 1));
    const out: Section[] = [];
    if (t <= 0.7) {
      const u = t / 0.7;
      const len = 344 - u * 30;
      const wid = 120 * (1 - 0.3 * u ** 1.6);
      const holes =
        u > 0.72
          ? [-96, -30, 36].map((x) => rounded(x, 0, 44 - (u - 0.72) * 12, wid * 0.5, 4))
          : [];
      out.push(
        sec(
          hull(0, 0, len, wid, 0.24, 28),
          'hull',
          holes,
          Math.abs(i - Math.round(0.12 * (n - 1))) <= 1,
        ),
      );
    } else {
      const u = (t - 0.7) / 0.3;
      const w = 44 - Math.floor(u * 3) * 7;
      const h = 70 - Math.floor(u * 3) * 12;
      out.push(
        sec(
          chamfer(108, 0, w, h, 6),
          'bridge',
          u > 0.5 && u < 0.7 ? [rounded(108, 0, w * 0.6, h * 0.7, 3)] : [],
        ),
      );
    }
    return out;
  },
};

// ---------------------------------------------------------------------------
// Mission — The Foresight Instrument (Arrakeen Mist-Stone)
// Concentric terraced horizon bowl with central record spindle & ochre ring.
// ---------------------------------------------------------------------------
export const INSTRUMENT: StrataSolid = {
  height: 118,
  slices: 72,
  at(t) {
    const n = 72;
    const i = Math.round(t * (n - 1));
    const steps = 7;
    const k = Math.floor(t * steps);
    const R = 166 - t * 10;
    const rin = 30 + (k / steps) * 118;
    const out: Section[] = [
      sec(circle(0, 0, R, 96), 'bowl', [circle(0, 0, Math.min(rin, R - 8), 96)]),
    ];
    if (t < 0.97) {
      const ring = Math.abs(i - Math.round(0.9 * (n - 1))) <= 1;
      out.push(sec(circle(0, 0, t > 0.86 ? 19 : 13, 40), 'spindle', [], ring));
    }
    return out;
  },
};

// ---------------------------------------------------------------------------
// Patinated Dune Mineral Palettes
// ---------------------------------------------------------------------------
export const STYLES = {
  parchment: {
    line: '58, 46, 32',
    fill: '234, 227, 212',
    fillTop: '243, 238, 228',
    accent: '188, 108, 16',
    lineAlpha: 0.7,
  },
  taupe: {
    line: '250, 247, 240',
    fill: '176, 167, 151',
    fillTop: '190, 182, 166',
    accent: '244, 184, 86',
    lineAlpha: 0.74,
  },
  bronze: {
    line: '242, 236, 224',
    fill: '92, 83, 67',
    fillTop: '108, 98, 80',
    accent: '238, 166, 62',
    lineAlpha: 0.68,
  },
  mist: {
    line: '46, 43, 38',
    fill: '229, 228, 222',
    fillTop: '239, 238, 232',
    accent: '188, 108, 16',
    lineAlpha: 0.56,
  },
  obsidian: {
    line: '242, 236, 224',
    fill: '24, 21, 17',
    fillTop: '34, 30, 24',
    accent: '228, 144, 34',
    lineAlpha: 0.62,
  },
} satisfies Record<string, StrataStyle>;

type PlateKind = 'money' | 'power' | 'trade';

const PLATES: Record<
  PlateKind,
  {
    solid: StrataSolid;
    style: StrataStyle;
    rot: number;
    planRot: number;
    fit: number;
    cyFrac: number;
    orthoLabel: string;
    dividerRgb: string;
  }
> = {
  money: {
    solid: CLEARING,
    style: STYLES.parchment,
    rot: -0.52,
    planRot: 0,
    fit: 0.0026,
    cyFrac: 0.44,
    orthoLabel: 'TOP VIEW · PAR 1.00',
    dividerRgb: '58, 46, 32',
  },
  power: {
    solid: SUBSTATION,
    style: STYLES.taupe,
    rot: -0.58,
    planRot: 0,
    fit: 0.00245,
    cyFrac: 0.45,
    orthoLabel: 'PLAN VIEW · BRIDGE TIER',
    dividerRgb: '250, 247, 240',
  },
  trade: {
    solid: HULL,
    style: STYLES.bronze,
    rot: -0.4,
    planRot: 0,
    fit: 0.00225,
    cyFrac: 0.42,
    orthoLabel: 'ELEVATION · WATERLINE',
    dividerRgb: '242, 236, 224',
  },
};

const reduce = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function animateIn(draw: (p: number) => void, el: Element): void {
  if (reduce() || window.location.search.includes('still')) {
    draw(1);
    return;
  }
  const rect = el.getBoundingClientRect();
  const inViewNow = rect.top < window.innerHeight * 1.1 && rect.bottom > -40;
  if (inViewNow) {
    draw(1);
    return;
  }
  draw(1);
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const t0 = performance.now();
      const dur = 1100;
      const step = (now: number): void => {
        const u = Math.min(1, (now - t0) / dur);
        draw(1 - (1 - u) ** 3);
        if (u < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
    { threshold: 0.08 },
  );
  io.observe(el);
}

/** Draws a single cohesive World Dossier Plate: 3/4 stratified solid above, orthographic view below. */
export function mountWorldPlate(root: HTMLElement): void {
  const kind = root.dataset['plate'] as PlateKind | undefined;
  if (!kind || !PLATES[kind]) return;
  const cfg = PLATES[kind];
  const cv = root.querySelector<HTMLCanvasElement>('[data-plate-canvas]');
  if (!cv) return;
  let progress = 1;

  const draw = (p: number): void => {
    progress = p;
    const f = fitCanvas(cv);
    if (!f) return;
    const { ctx, w, h } = f;

    // Upper chamber: 3/4 isometric stratified solid
    const splitY = h * 0.655;
    const isoScale = Math.min(w, splitY * 1.48) * cfg.fit;
    drawIso(
      ctx,
      cfg.solid,
      {
        cx: w * 0.5,
        cy: splitY * 0.72,
        scale: isoScale,
        rot: cfg.rot,
        tilt: 0.5,
        lift: 0.92,
      },
      cfg.style,
      p,
    );

    // Fine Dune architectural projection divider inside the chamfered frame
    ctx.save();
    ctx.strokeStyle = `rgba(${cfg.dividerRgb}, 0.22)`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(w * 0.09, splitY);
    ctx.lineTo(w * 0.91, splitY);
    ctx.stroke();

    // Micro caption aligned right above the orthographic register
    ctx.font = '500 8.5px "IBM Plex Mono", monospace';
    ctx.fillStyle = `rgba(${cfg.dividerRgb}, 0.52)`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(cfg.orthoLabel, w * 0.905, splitY - 5);
    ctx.restore();

    // Lower chamber: orthographic top view or elevation
    const orthoH = h - splitY - 14;
    const orthoCy = splitY + orthoH * 0.52;
    const orthoScale = Math.min((w * 0.64) / 340, (orthoH * 0.76) / 170);

    if (kind === 'trade') {
      drawElevation(
        ctx,
        cfg.solid,
        w * 0.5,
        splitY + orthoH * 0.78,
        orthoScale * 1.05,
        0.95,
        cfg.style,
      );
    } else {
      drawPlan(
        ctx,
        cfg.solid,
        w * 0.5,
        orthoCy,
        orthoScale * 1.02,
        cfg.style,
        4,
        cfg.planRot,
      );
    }
  };

  animateIn(draw, root);
  let raf = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => draw(progress || 1));
  }).observe(root);
}

/** The Mission chamber stratified horizon instrument with quiet Fremen-style callouts. */
export function mountMissionInstrument(root: HTMLElement): void {
  const cv = root.querySelector<HTMLCanvasElement>('canvas');
  if (!cv) return;
  let progress = 1;

  const draw = (p: number): void => {
    progress = p;
    const f = fitCanvas(cv);
    if (!f) return;
    const { ctx, w, h } = f;
    const s = Math.min(w / 490, h / 355);
    const view = {
      cx: w * 0.5,
      cy: h * 0.69,
      scale: s,
      rot: -0.22,
      tilt: 0.42,
      lift: 0.84,
    };

    // Subtle orthographic compass axes underneath the instrument
    ctx.save();
    ctx.strokeStyle = 'rgba(46, 43, 38, 0.14)';
    ctx.lineWidth = 0.8;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(view.cx, h * 0.08);
    ctx.lineTo(view.cx, h * 0.94);
    ctx.moveTo(w * 0.06, view.cy);
    ctx.lineTo(w * 0.94, view.cy);
    ctx.stroke();
    ctx.restore();

    drawIso(ctx, INSTRUMENT, view, STYLES.mist, p);

    if (p > 0.75 && w > 240) {
      const ringPt = project(view, 18, 0, INSTRUMENT.height * 0.89);
      const topY = Math.max(22, ringPt[1] - 78);
      callout(
        ctx,
        ringPt,
        [ringPt[0] + 54, topY],
        [Math.min(w - 94, ringPt[0] + 108), topY],
        'Record ring',
        '143, 83, 6',
        'right',
      );
      const rimPt = project(view, -158, 36, INSTRUMENT.height * 0.42);
      const leftX = Math.max(82, rimPt[0] - 46);
      callout(
        ctx,
        rimPt,
        [rimPt[0] - 24, rimPt[1] + 34],
        [leftX, rimPt[1] + 34],
        'State strata',
        '58, 52, 44',
        'left',
      );
    }
  };

  animateIn(draw, root);
  let raf = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => draw(progress || 1));
  }).observe(root);
}

/** Step 04 · Pre-outcome commitment plate: crisp Dune Transcription-Device plan seal. */
export function mountSealPlate(root: HTMLElement): void {
  const cv = root.querySelector<HTMLCanvasElement>('canvas');
  if (!cv) return;

  const draw = (): void => {
    const f = fitCanvas(cv);
    if (!f) return;
    const { ctx, w, h } = f;
    const s = Math.min(w / 320, h / 210);
    drawPlan(ctx, CLEARING, w * 0.5, h * 0.5, s * 0.94, STYLES.obsidian, 4, 0);
  };

  draw();
  let raf = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(draw);
  }).observe(root);
}

export function initWorldPlates(scope: ParentNode = document): void {
  scope.querySelectorAll<HTMLElement>('[data-plate]').forEach(mountWorldPlate);
  scope
    .querySelectorAll<HTMLElement>('[data-mission-instrument]')
    .forEach(mountMissionInstrument);
  scope.querySelectorAll<HTMLElement>('[data-seal-plate]').forEach(mountSealPlate);
}
