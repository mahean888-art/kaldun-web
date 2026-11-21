/**
 * 05 · Worlds — Three Bespoke Optical Lithography World Plates
 *
 * Shared calibrated obsidian optical system (#110f0c) matching 02 · How it works:
 *   01 · Money           — 3D Sovereign Clearing Orrery, 24/7 meridians, parabolic liquidity arcs & Par datum
 *   02 · Power & compute — 3D AC Grid Phase-Wave heightfield coupling into axonometric compute strata
 *   03 · Trade           — 3D Real-Geography Halftone Globe with great-circle shipping lanes & chokepoint reroute
 */
import { prefersReducedMotion } from '../lib/prefers';

type WorldKind = 'money' | 'power' | 'trade';

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
  const persp = 4.8 / (4.8 - fz * 0.52);
  return [cx + rx * scale * persp, cy - ry * scale * persp, fz];
};

function drawOpticalFrame(ctx: CanvasRenderingContext2D, W: number, H: number, active: boolean): void {
  ctx.fillStyle = '#110f0c';
  ctx.fillRect(0, 0, W, H);

  // Micro optical dot matrix
  ctx.fillStyle = active ? 'rgba(235, 224, 204, 0.055)' : 'rgba(235, 224, 204, 0.038)';
  for (let y = 14; y < H - 8; y += 14) {
    for (let x = 14; x < W - 8; x += 14) {
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // Calibrated edge ticks
  ctx.strokeStyle = active ? 'rgba(243, 146, 0, 0.34)' : 'rgba(235, 224, 204, 0.14)';
  ctx.lineWidth = 1;
  for (let y = 20; y < H - 16; y += 16) {
    const len = y % 64 === 0 ? 7 : 3;
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(len, y + 0.5);
    ctx.moveTo(W - len, y + 0.5);
    ctx.lineTo(W, y + 0.5);
    ctx.stroke();
  }
}

// ============================================================================
// 01 · MONEY — Sovereign Clearing Orrery & Par Horizon
// ============================================================================
function drawMoney(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, active: boolean): void {
  drawOpticalFrame(ctx, W, H, active);
  const cx = W * 0.5;
  const cy = H * 0.5;
  const S = Math.min(W, H) * 0.36;
  const yaw = t * 0.22;
  const pitch = 0.54;
  const lum = active ? 1 : 0.78;

  // Horizontal Par Equilibrium Datum across the center plane
  ctx.strokeStyle = `rgba(243, 146, 0, ${(0.28 * lum).toFixed(3)})`;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(18, Math.round(cy) + 0.5);
  ctx.lineTo(W - 18, Math.round(cy) + 0.5);
  ctx.stroke();
  ctx.setLineDash([]);

  // Three concentric tilted clearing rings (outer settlement, middle credit, inner reserve)
  const rings = [
    { r: 1.18, y: 0, dots: 72, speed: 0.08, amber: false },
    { r: 0.84, y: 0.06, dots: 56, speed: -0.11, amber: true },
    { r: 0.48, y: 0.12, dots: 36, speed: 0.14, amber: false },
  ];

  for (const ring of rings) {
    ctx.beginPath();
    for (let s = 0; s <= 90; s++) {
      const a = (s / 90) * Math.PI * 2;
      const [sx, sy] = project3D(Math.cos(a) * ring.r, ring.y, Math.sin(a) * ring.r, yaw, pitch, cx, cy, S);
      if (s === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.strokeStyle = ring.amber
      ? `rgba(243, 146, 0, ${(0.48 * lum).toFixed(3)})`
      : `rgba(235, 224, 204, ${(0.18 * lum).toFixed(3)})`;
    ctx.lineWidth = ring.amber ? 1.3 : 0.9;
    ctx.stroke();

    for (let d = 0; d < ring.dots; d++) {
      const a = (d / ring.dots) * Math.PI * 2 + t * ring.speed;
      const [sx, sy, fz] = project3D(Math.cos(a) * ring.r, ring.y, Math.sin(a) * ring.r, yaw, pitch, cx, cy, S);
      const depth = Math.max(0.25, Math.min(1, (fz + 1.4) / 2.8));
      ctx.fillStyle = ring.amber
        ? `rgba(243, 146, 0, ${(depth * 0.85 * lum).toFixed(3)})`
        : `rgba(235, 224, 204, ${(depth * 0.55 * lum).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, ring.amber ? 1.5 : 1.15, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Vertical balance-sheet meridian ring
  ctx.beginPath();
  for (let s = 0; s <= 72; s++) {
    const a = (s / 72) * Math.PI * 2;
    const [sx, sy] = project3D(Math.cos(a) * 0.84, Math.sin(a) * 0.84, 0, yaw * 0.6, pitch, cx, cy, S);
    if (s === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.strokeStyle = `rgba(235, 224, 204, ${(0.14 * lum).toFixed(3)})`;
  ctx.lineWidth = 0.9;
  ctx.stroke();

  // 6 Major Clearing Hub Nodes + High-contrast Parabolic Amber Liquidity Arcs
  const hubs = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2;
    return [Math.cos(a) * 1.18, 0, Math.sin(a) * 1.18] as [number, number, number];
  });

  const pairs: Array<[number, number]> = [
    [0, 2],
    [1, 4],
    [2, 5],
    [3, 0],
    [4, 1],
  ];

  for (let pi = 0; pi < pairs.length; pi++) {
    const [ia, ib] = pairs[pi]!;
    const a = hubs[ia]!;
    const b = hubs[ib]!;
    const arcH = 0.55 + (pi % 3) * 0.16;

    ctx.beginPath();
    for (let s = 0; s <= 32; s++) {
      const u = s / 32;
      const x = a[0] + (b[0] - a[0]) * u;
      const z = a[2] + (b[2] - a[2]) * u;
      const y = Math.sin(u * Math.PI) * arcH;
      const [sx, sy] = project3D(x, y, z, yaw, pitch, cx, cy, S);
      if (s === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.strokeStyle =
      pi < 2
        ? `rgba(243, 146, 0, ${(0.78 * lum).toFixed(3)})`
        : `rgba(235, 224, 204, ${(0.24 * lum).toFixed(3)})`;
    ctx.lineWidth = pi < 2 ? 1.55 : 0.9;
    ctx.stroke();

    // Moving settlement packet
    const u = (t * 0.34 + pi * 0.21) % 1;
    const px3 = a[0] + (b[0] - a[0]) * u;
    const pz3 = a[2] + (b[2] - a[2]) * u;
    const py3 = Math.sin(u * Math.PI) * arcH;
    const [qx, qy] = project3D(px3, py3, pz3, yaw, pitch, cx, cy, S);
    ctx.fillStyle = pi < 2 ? '#fff4dc' : '#f39200';
    ctx.beginPath();
    ctx.arc(qx, qy, pi < 2 ? 2.6 : 1.9, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < hubs.length; i++) {
    const h = hubs[i]!;
    const [hx, hy] = project3D(h[0], h[1], h[2], yaw, pitch, cx, cy, S);
    ctx.fillStyle = i % 2 === 0 ? '#f39200' : '#ece4d4';
    ctx.beginPath();
    ctx.arc(hx, hy, i % 2 === 0 ? 3.2 : 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Central Reserve Core
  const [kx, ky] = project3D(0, 0.12, 0, yaw, pitch, cx, cy, S);
  ctx.strokeStyle = `rgba(243, 146, 0, ${(0.75 * lum).toFixed(3)})`;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(kx, ky, 11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#f39200';
  ctx.beginPath();
  ctx.arc(kx, ky, 3.8, 0, Math.PI * 2);
  ctx.fill();

  // Micro optical coordinate legend
  ctx.font = '500 8.5px "IBM Plex Mono", ui-monospace, monospace';
  ctx.fillStyle = `rgba(235, 224, 204, ${(0.5 * lum).toFixed(3)})`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('24/7 CLEARING ORRERY', 14, H - 10);
  ctx.fillStyle = `rgba(243, 146, 0, ${(0.82 * lum).toFixed(3)})`;
  ctx.textAlign = 'right';
  ctx.fillText('PAR 1.00', W - 14, H - 10);
}

// ============================================================================
// 02 · POWER & COMPUTE — 3D AC Grid Phase-Wave & Compute Tensor Strata
// ============================================================================
function drawPower(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, active: boolean): void {
  drawOpticalFrame(ctx, W, H, active);
  const cx = W * 0.5;
  const cy = H * 0.54;
  const S = Math.min(W, H) * 0.34;
  const yaw = -0.58 + Math.sin(t * 0.25) * 0.14;
  const pitch = 0.56;
  const lum = active ? 1 : 0.78;

  // 1. Living 3D AC Grid Phase-Wave Halftone Heightfield (left-to-center generation field)
  const nx = 22;
  const nz = 14;
  for (let iz = 0; iz < nz; iz++) {
    const vz = (iz / (nz - 1) - 0.5) * 1.9;
    ctx.beginPath();
    for (let ix = 0; ix < nx; ix++) {
      const u = ix / (nx - 1);
      const vx = -1.35 + u * 2.7;
      // Harmonic AC grid wave stronger on generation left, focused into corridor
      const env = Math.exp(-Math.pow(vz * 0.85, 2));
      const wave = Math.sin(vx * 3.6 - t * 2.1 + vz * 1.2) * 0.24 * env;
      const y = -0.35 + wave;
      const [sx, sy] = project3D(vx, y, vz, yaw, pitch, cx, cy, S);
      if (ix === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    const isCorridor = Math.abs(vz) < 0.24;
    ctx.strokeStyle = isCorridor
      ? `rgba(243, 146, 0, ${(0.56 * lum).toFixed(3)})`
      : `rgba(235, 224, 204, ${(0.14 * lum).toFixed(3)})`;
    ctx.lineWidth = isCorridor ? 1.35 : 0.75;
    ctx.stroke();

    // Halftone wave crest dots
    for (let ix = 0; ix < nx; ix += 2) {
      const u = ix / (nx - 1);
      const vx = -1.35 + u * 2.7;
      const env = Math.exp(-Math.pow(vz * 0.85, 2));
      const wave = Math.sin(vx * 3.6 - t * 2.1 + vz * 1.2) * 0.24 * env;
      const y = -0.35 + wave;
      const [sx, sy] = project3D(vx, y, vz, yaw, pitch, cx, cy, S);
      const crest = Math.max(0, (wave + 0.16) / 0.4);
      ctx.fillStyle = isCorridor
        ? `rgba(243, 146, 0, ${((0.35 + crest * 0.55) * lum).toFixed(3)})`
        : `rgba(235, 224, 204, ${((0.12 + crest * 0.35) * lum).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, isCorridor ? 1.55 : 1.05, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. Stepped Axonometric Compute Tensor Strata (right-center gigawatt compute stack)
  const layers = 5;
  for (let l = 0; l < layers; l++) {
    const ly = -0.14 + l * 0.22;
    const hw = 0.56 - l * 0.04;
    const hd = 0.48 - l * 0.03;
    const ox = 0.36;
    const corners: Array<[number, number, number]> = [
      [ox - hw, ly, -hd],
      [ox + hw, ly, -hd],
      [ox + hw, ly, hd],
      [ox - hw, ly, hd],
    ];
    const proj = corners.map((c) => project3D(c[0], c[1], c[2], yaw, pitch, cx, cy, S));

    // Translucent dark slate lamina fill for crisp depth occlusion
    ctx.beginPath();
    proj.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
    ctx.closePath();
    ctx.fillStyle = l === layers - 1 ? 'rgba(243, 146, 0, 0.11)' : 'rgba(17, 15, 12, 0.72)';
    ctx.fill();
    ctx.strokeStyle =
      l === layers - 1
        ? `rgba(243, 146, 0, ${(0.88 * lum).toFixed(3)})`
        : `rgba(235, 224, 204, ${((0.26 + l * 0.1) * lum).toFixed(3)})`;
    ctx.lineWidth = l === layers - 1 ? 1.5 : 1;
    ctx.stroke();

    // Precision compute rack grid dots on top lamina
    if (l === layers - 1) {
      for (let gx = -2; gx <= 2; gx++) {
        for (let gz = -2; gz <= 2; gz++) {
          const [dx, dy] = project3D(ox + gx * 0.14, ly, gz * 0.12, yaw, pitch, cx, cy, S);
          const hot = (gx + gz + Math.floor(t * 2)) % 5 === 0;
          ctx.fillStyle = hot ? '#fff4dc' : `rgba(243, 146, 0, ${(0.75 * lum).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(dx, dy, hot ? 2.0 : 1.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // 3. High-Voltage Amber Interconnection Bus feeding the compute stack
  ctx.beginPath();
  for (let s = 0; s <= 32; s++) {
    const u = s / 32;
    const vx = -1.25 + u * 1.61;
    const vy = -0.35 + Math.pow(u, 1.8) * 1.1 + Math.sin(u * Math.PI) * 0.18;
    const [sx, sy] = project3D(vx, vy, 0, yaw, pitch, cx, cy, S);
    if (s === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.strokeStyle = `rgba(243, 146, 0, ${(0.92 * lum).toFixed(3)})`;
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // Traveling megawatt pulse packets along the interconnection bus
  for (let k = 0; k < 2; k++) {
    const u = (t * 0.45 + k * 0.5) % 1;
    const vx = -1.25 + u * 1.61;
    const vy = -0.35 + Math.pow(u, 1.8) * 1.1 + Math.sin(u * Math.PI) * 0.18;
    const [sx, sy] = project3D(vx, vy, 0, yaw, pitch, cx, cy, S);
    ctx.fillStyle = '#fff5df';
    ctx.beginPath();
    ctx.arc(sx, sy, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.font = '500 8.5px "IBM Plex Mono", ui-monospace, monospace';
  ctx.fillStyle = `rgba(235, 224, 204, ${(0.5 * lum).toFixed(3)})`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('GRID-COMPUTE LATTICE', 14, H - 10);
  ctx.fillStyle = `rgba(243, 146, 0, ${(0.82 * lum).toFixed(3)})`;
  ctx.textAlign = 'right';
  ctx.fillText('MW · INTERCONNECT', W - 14, H - 10);
}

// ============================================================================
// 03 · TRADE — 3D Real-Geography Halftone Globe & Great-Circle Shipping Lanes
// ============================================================================
// Simplified real continental landmass polygons [lat, lon] in degrees
const CONTINENTS: ReadonlyArray<ReadonlyArray<[number, number]>> = [
  // Europe + Eurasia + Middle East + India + East Asia
  [
    [36, -9], [43, -9], [50, -5], [58, 5], [70, 26], [68, 60], [72, 105], [66, 142],
    [55, 138], [42, 130], [32, 122], [22, 114], [10, 106], [1, 104], [14, 98],
    [22, 88], [8, 77], [24, 67], [26, 56], [13, 44], [30, 32], [36, 28], [40, 18], [44, 8],
  ],
  // Africa
  [
    [35, -6], [37, 10], [31, 32], [12, 44], [2, 41], [-14, 40], [-34, 20],
    [-22, 14], [4, 9], [6, -10], [16, -17], [28, -13],
  ],
  // North America
  [
    [68, -162], [70, -130], [60, -94], [52, -56], [42, -70], [25, -80], [18, -94],
    [9, -80], [18, -104], [32, -117], [48, -124], [60, -148],
  ],
  // South America
  [
    [10, -75], [8, -60], [-5, -35], [-23, -43], [-54, -68], [-42, -74], [-18, -71], [-2, -80],
  ],
  // Australia
  [
    [-12, 131], [-18, 146], [-37, 150], [-35, 117], [-22, 114],
  ],
];

function pointInPoly(lat: number, lon: number, poly: ReadonlyArray<[number, number]>): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const yi = poly[i]![0];
    const xi = poly[i]![1];
    const yj = poly[j]![0];
    const xj = poly[j]![1];
    const intersect = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Precompute ~540 halftone land dots on the unit sphere (Fibonacci spiral filtered by real continents)
const LAND_DOTS: Array<[number, number, number]> = [];
const N_SPHERE = 2600;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
for (let i = 0; i < N_SPHERE; i++) {
  const y = 1 - (i / (N_SPHERE - 1)) * 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = GOLDEN * i;
  const x = Math.cos(theta) * r;
  const z = Math.sin(theta) * r;
  const lat = (Math.asin(y) * 180) / Math.PI;
  const lon = (Math.atan2(z, x) * 180) / Math.PI;
  if (CONTINENTS.some((p) => pointInPoly(lat, lon, p))) {
    LAND_DOTS.push([x, y, z]);
  }
}

function latLonToVec(latDeg: number, lonDeg: number, r = 1): [number, number, number] {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  return [Math.cos(lat) * Math.cos(lon) * r, Math.sin(lat) * r, Math.cos(lat) * Math.sin(lon) * r];
}

// Key maritime shipping corridors: Rotterdam -> Suez -> Singapore (chokepoint) & Cape reroute
const ROUTE_CAPE: ReadonlyArray<[number, number]> = [
  [51, 4], [40, -10], [22, -19], [4, -14], [-14, 0], [-28, 10], [-37, 20], [-33, 36], [-21, 56], [-7, 78], [1, 104], [18, 113], [31, 122],
];
const ROUTE_SUEZ: ReadonlyArray<[number, number]> = [
  [51, 4], [36, -6], [35, 16], [30, 32], [13, 44], [12, 62], [6, 80], [1, 104],
];
const ROUTE_ATLANTIC: ReadonlyArray<[number, number]> = [
  [40, -74], [38, -48], [44, -22], [51, 4],
];
const CHOKEPOINT_SUEZ: [number, number] = [27, 34];

function drawTrade(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, active: boolean): void {
  drawOpticalFrame(ctx, W, H, active);
  const cx = W * 0.5;
  const cy = H * 0.5;
  const R = Math.min(W, H) * 0.39;
  // Centered naturally on Europe / Africa / Middle East / Indian Ocean / Asia trade corridor
  const rotLon = -0.92 + Math.sin(t * 0.22) * 0.32;
  const tilt = 0.22;
  const lum = active ? 1 : 0.78;

  const projGlobe = (x: number, y: number, z: number): [number, number, number] => {
    const c1 = Math.cos(rotLon);
    const s1 = Math.sin(rotLon);
    const rx = x * c1 + z * s1;
    const rz = -x * s1 + z * c1;
    const c2 = Math.cos(tilt);
    const s2 = Math.sin(tilt);
    const ry = y * c2 - rz * s2;
    const fz = y * s2 + rz * c2;
    return [cx + rx * R, cy - ry * R, fz];
  };

  // Outer calibrated globe horizon ring
  ctx.strokeStyle = `rgba(235, 224, 204, ${(0.22 * lum).toFixed(3)})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();

  // Subtle dashed outer orbital measurement ring
  ctx.strokeStyle = `rgba(243, 146, 0, ${(0.18 * lum).toFixed(3)})`;
  ctx.setLineDash([2, 6]);
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Fine latitude / longitude graticule on front hemisphere
  ctx.strokeStyle = `rgba(235, 224, 204, ${(0.08 * lum).toFixed(3)})`;
  ctx.lineWidth = 0.8;
  for (let lat = -60; lat <= 60; lat += 30) {
    ctx.beginPath();
    let drawing = false;
    for (let lon = -180; lon <= 180; lon += 6) {
      const v = latLonToVec(lat, lon);
      const [sx, sy, fz] = projGlobe(v[0], v[1], v[2]);
      if (fz > 0) {
        if (!drawing) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
        drawing = true;
      } else {
        drawing = false;
      }
    }
    ctx.stroke();
  }
  for (let lon = -150; lon <= 180; lon += 30) {
    ctx.beginPath();
    let drawing = false;
    for (let lat = -84; lat <= 84; lat += 6) {
      const v = latLonToVec(lat, lon);
      const [sx, sy, fz] = projGlobe(v[0], v[1], v[2]);
      if (fz > 0) {
        if (!drawing) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
        drawing = true;
      } else {
        drawing = false;
      }
    }
    ctx.stroke();
  }

  // Real continental halftone dot cloud (front hemisphere crisp ivory; back faint ghost)
  for (let i = 0; i < LAND_DOTS.length; i++) {
    const d = LAND_DOTS[i]!;
    const [sx, sy, fz] = projGlobe(d[0], d[1], d[2]);
    if (fz > -0.02) {
      const shade = 0.28 + Math.max(0, fz) * 0.68;
      ctx.fillStyle = `rgba(235, 224, 204, ${(shade * 0.82 * lum).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.0 + Math.max(0, fz) * 0.85, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = `rgba(235, 224, 204, ${(0.06 * lum).toFixed(3)})`;
      ctx.fillRect(sx, sy, 1, 1);
    }
  }

  // Helper to draw elevated great-circle maritime routes
  const drawRoute = (
    pts: ReadonlyArray<[number, number]>,
    color: string,
    width: number,
    dashed: boolean,
    pulseSpeed: number,
  ): void => {
    const projPts: Array<[number, number, number]> = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [la1, lo1] = pts[i]!;
      const [la2, lo2] = pts[i + 1]!;
      const steps = 10;
      for (let s = 0; s < steps; s++) {
        const u = s / steps;
        const lat = la1 + (la2 - la1) * u;
        const lon = lo1 + (lo2 - lo1) * u;
        const v = latLonToVec(lat, lon, 1.025);
        projPts.push(projGlobe(v[0], v[1], v[2]));
      }
    }
    const last = pts[pts.length - 1]!;
    const vl = latLonToVec(last[0], last[1], 1.025);
    projPts.push(projGlobe(vl[0], vl[1], vl[2]));

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    if (dashed) ctx.setLineDash([3, 3]);
    ctx.beginPath();
    let drawing = false;
    for (const [sx, sy, fz] of projPts) {
      if (fz > -0.04) {
        if (!drawing) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
        drawing = true;
      } else {
        drawing = false;
      }
    }
    ctx.stroke();
    ctx.restore();

    if (pulseSpeed > 0 && projPts.length > 2) {
      const idx = Math.floor(((t * pulseSpeed) % 1) * (projPts.length - 1));
      const p = projPts[idx]!;
      if (p[2] > 0) {
        ctx.fillStyle = '#fff5df';
        ctx.beginPath();
        ctx.arc(p[0], p[1], 2.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // Disrupted strait corridor (dashed vermilion-rust)
  drawRoute(ROUTE_SUEZ, `rgba(224, 88, 40, ${(0.56 * lum).toFixed(3)})`, 1.15, true, 0);
  // Atlantic secondary corridor
  drawRoute(ROUTE_ATLANTIC, `rgba(235, 224, 204, ${(0.34 * lum).toFixed(3)})`, 1.0, false, 0.14);
  // Active Sovereign Amber Reroute around Cape of Good Hope -> Malacca -> East Asia
  drawRoute(ROUTE_CAPE, `rgba(243, 146, 0, ${(0.95 * lum).toFixed(3)})`, 2.0, false, 0.24);

  // Chokepoint Reticle at Suez / Red Sea
  const cv = latLonToVec(CHOKEPOINT_SUEZ[0], CHOKEPOINT_SUEZ[1], 1.03);
  const [chX, chY, chZ] = projGlobe(cv[0], cv[1], cv[2]);
  if (chZ > 0) {
    const pulse = (t * 0.7) % 1;
    ctx.strokeStyle = `rgba(224, 88, 40, ${(0.7 * (1 - pulse) * lum).toFixed(3)})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(chX, chY, 5 + pulse * 13, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#e05828';
    ctx.beginPath();
    ctx.arc(chX, chY, 3.0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Major port hubs (Rotterdam, Singapore, Shanghai)
  for (const [la, lo] of [
    [51, 4],
    [1, 104],
    [31, 122],
  ] as Array<[number, number]>) {
    const pv = latLonToVec(la, lo, 1.025);
    const [px, py, pz] = projGlobe(pv[0], pv[1], pv[2]);
    if (pz > 0) {
      ctx.fillStyle = '#f39200';
      ctx.beginPath();
      ctx.arc(px, py, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.font = '500 8.5px "IBM Plex Mono", ui-monospace, monospace';
  ctx.fillStyle = `rgba(235, 224, 204, ${(0.5 * lum).toFixed(3)})`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('MARITIME CORRIDORS', 14, H - 10);
  ctx.fillStyle = `rgba(243, 146, 0, ${(0.82 * lum).toFixed(3)})`;
  ctx.textAlign = 'right';
  ctx.fillText('STRAIT REROUTE', W - 14, H - 10);
}

export function initWorldsOptics(root: ParentNode = document): void {
  const canvases = Array.from(root.querySelectorAll<HTMLCanvasElement>('[data-world-optic]'));
  if (!canvases.length) return;

  const reduced = prefersReducedMotion();
  const section = canvases[0]!.closest('section') ?? canvases[0]!.parentElement!;

  const items = canvases
    .map((canvas) => {
      const ctx = canvas.getContext('2d');
      const kind = (canvas.dataset['worldOptic'] as WorldKind) || 'money';
      const card = canvas.closest<HTMLElement>('[data-tk-card]');
      if (!ctx) return null;
      return { canvas, ctx, kind, card, W: 360, H: 288, dpr: 1 };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  if (!items.length) return;

  let visible = false;
  let raf = 0;
  const t0 = performance.now();

  const resizeAll = (): void => {
    for (const it of items) {
      const stage = it.canvas.parentElement;
      if (!stage) continue;
      const r = stage.getBoundingClientRect();
      if (r.width < 20 || r.height < 20) continue;
      it.W = Math.round(r.width);
      it.H = Math.round(r.height);
      it.dpr = Math.min(window.devicePixelRatio || 1, 2);
      it.canvas.width = Math.round(it.W * it.dpr);
      it.canvas.height = Math.round(it.H * it.dpr);
    }
  };

  const renderAll = (now: number): void => {
    const t = reduced ? 1.4 : (now - t0) / 1000;
    for (const it of items) {
      const active = it.card ? it.card.classList.contains('is-active') : true;
      it.ctx.setTransform(it.dpr, 0, 0, it.dpr, 0, 0);
      if (it.kind === 'money') drawMoney(it.ctx, it.W, it.H, t, active);
      else if (it.kind === 'power') drawPower(it.ctx, it.W, it.H, t, active);
      else drawTrade(it.ctx, it.W, it.H, t, active);
    }
  };

  const loop = (now: number): void => {
    if (!visible || document.hidden) {
      raf = 0;
      return;
    }
    renderAll(now);
    if (!reduced) raf = requestAnimationFrame(loop);
    else raf = 0;
  };

  const wake = (): void => {
    resizeAll();
    renderAll(performance.now());
    if (!reduced && !raf && visible && !document.hidden) {
      raf = requestAnimationFrame(loop);
    }
  };

  const ro = new ResizeObserver(wake);
  for (const it of items) ro.observe(it.canvas);

  const io = new IntersectionObserver(
    (es) => {
      visible = es.some((e) => e.isIntersecting);
      if (visible) wake();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    { threshold: 0.05 },
  );
  io.observe(section);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && visible) wake();
  });

  wake();
}
