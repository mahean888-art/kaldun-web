/**
 * Three real-time 3D computer-generated Guild Navigator instruments for 05 · Worlds:
 *   01 money — 3D Monetary Clearing Astrolabe (orbital reserve & rail gimbals)
 *   02 power — 3D Grid & Compute Elevation Wavefield (harmonic load mesh + bridge)
 *   03 trade — 3D Geodesic Maritime Navigation Sphere (great-circle rerouting)
 *
 * Pure mathematical 3D projection on Retina HTML5 Canvas. Zero raster AI imagery.
 */
import { prefersReducedMotion } from '../lib/prefers';

type Vec3 = [number, number, number];
type EngineKind = 'money' | 'power' | 'trade';

function rotX([x, y, z]: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x, y * c - z * s, y * s + z * c];
}
function rotY([x, y, z]: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x * c + z * s, y, -x * s + z * c];
}
function rotZ([x, y, z]: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x * c - y * s, x * s + y * c, z];
}

function proj(p: Vec3, W: number, H: number, scale: number, fov = 4.2): [number, number, number] {
  const z = p[2] + fov;
  const k = (fov / Math.max(0.6, z)) * scale;
  return [W * 0.5 + p[0] * k, H * 0.52 - p[1] * k, p[2]];
}

function drawDraftGrid(ctx: CanvasRenderingContext2D, W: number, H: number): void {
  const step = 32;
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

  // Subtle architectural center crosshairs
  const cx = W * 0.5;
  const cy = H * 0.52;
  ctx.strokeStyle = 'rgba(20, 18, 16, 0.08)';
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy);
  ctx.lineTo(cx + 14, cy);
  ctx.moveTo(cx, cy - 14);
  ctx.lineTo(cx, cy + 14);
  ctx.stroke();
}

/** 01 · Money: 3D Spacing-Guild Monetary Clearing Astrolabe */
function drawMoney(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, mx: number, my: number): void {
  const S = Math.min(W, H) * 0.36;
  const tiltX = 0.52 + my * 0.16;
  const tiltY = t * 0.16 + mx * 0.24;

  // Outer calibrated flat astrolabe reference circle + degree ticks
  const cx = W * 0.5;
  const cy = H * 0.52;
  const outerR = S * 1.12;
  ctx.strokeStyle = 'rgba(20, 18, 16, 0.14)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.stroke();

  for (let d = 0; d < 72; d++) {
    const a = (d / 72) * Math.PI * 2;
    const major = d % 6 === 0;
    const r0 = outerR - (major ? 7 : 3.5);
    const r1 = outerR;
    ctx.strokeStyle = major ? 'rgba(20, 18, 16, 0.34)' : 'rgba(20, 18, 16, 0.14)';
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.stroke();
  }

  // Three nested 3D orbital clearing gimbals
  const rings: Array<{ r: number; rx: number; rz: number; speed: number; amber?: boolean; dashed?: boolean }> = [
    { r: 0.96, rx: 0.35, rz: 0.12, speed: 0.18 },
    { r: 0.74, rx: -0.68, rz: 0.42, speed: -0.26, amber: true },
    { r: 0.52, rx: 0.92, rz: -0.35, speed: 0.34, dashed: true },
  ];

  const allNodes: Array<{ sx: number; sy: number; z: number; amber: boolean; label?: string | undefined }> = [];

  for (let ri = 0; ri < rings.length; ri++) {
    const ring = rings[ri]!;
    const segs = 96;
    ctx.beginPath();
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      let p: Vec3 = [Math.cos(a) * ring.r, Math.sin(a) * ring.r, 0];
      p = rotX(p, ring.rx + t * ring.speed * 0.35);
      p = rotZ(p, ring.rz);
      p = rotY(p, tiltY);
      p = rotX(p, tiltX);
      const [sx, sy] = proj(p, W, H, S);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.strokeStyle = ring.amber ? 'rgba(243, 146, 0, 0.85)' : 'rgba(20, 18, 16, 0.28)';
    ctx.lineWidth = ring.amber ? 1.7 : 1.05;
    if (ring.dashed) ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Institutional clearing nodes riding the ring
    const nodeCount = ri === 0 ? 6 : ri === 1 ? 5 : 4;
    for (let k = 0; k < nodeCount; k++) {
      const a = (k / nodeCount) * Math.PI * 2 + t * ring.speed;
      let p: Vec3 = [Math.cos(a) * ring.r, Math.sin(a) * ring.r, 0];
      p = rotX(p, ring.rx + t * ring.speed * 0.35);
      p = rotZ(p, ring.rz);
      p = rotY(p, tiltY);
      p = rotX(p, tiltX);
      const [sx, sy, z] = proj(p, W, H, S);
      allNodes.push({
        sx,
        sy,
        z,
        amber: !!ring.amber,
        label: ri === 0 && k === 0 ? 'BANK A' : ri === 1 && k === 1 ? '24/7 RAIL' : ri === 0 && k === 3 ? 'T-BILLS' : undefined,
      });
    }
  }

  // Weekend cutoff barrier arc (vermilion) on ring 0
  ctx.beginPath();
  for (let i = 0; i <= 20; i++) {
    const a = 0.65 + (i / 20) * 0.72;
    let p: Vec3 = [Math.cos(a) * 0.96, Math.sin(a) * 0.96, 0];
    p = rotX(p, 0.35 + t * 0.18 * 0.35);
    p = rotZ(p, 0.12);
    p = rotY(p, tiltY);
    p = rotX(p, tiltX);
    const [sx, sy] = proj(p, W, H, S);
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.strokeStyle = 'rgba(184, 58, 20, 0.8)';
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // Spokes & clearing pulses from central PAR core to active nodes
  const [coreX, coreY] = proj([0, 0, 0], W, H, S);
  allNodes.sort((a, b) => a.z - b.z);

  for (let i = 0; i < allNodes.length; i++) {
    const nd = allNodes[i]!;
    if (i % 2 === 0 || nd.amber) {
      ctx.strokeStyle = nd.amber ? 'rgba(243, 146, 0, 0.34)' : 'rgba(20, 18, 16, 0.1)';
      ctx.lineWidth = nd.amber ? 1.2 : 0.8;
      ctx.beginPath();
      ctx.moveTo(coreX, coreY);
      ctx.lineTo(nd.sx, nd.sy);
      ctx.stroke();

      if (nd.amber) {
        const u = (t * 0.55 + i * 0.23) % 1;
        const px = coreX + (nd.sx - coreX) * u;
        const py = coreY + (nd.sy - coreY) * u;
        ctx.fillStyle = '#f39200';
        ctx.beginPath();
        ctx.arc(px, py, 2.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const r = nd.amber ? 4.2 : 3.1;
    ctx.fillStyle = nd.amber ? '#f39200' : '#fcfaf5';
    ctx.strokeStyle = nd.amber ? '#141210' : 'rgba(20, 18, 16, 0.72)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(nd.sx, nd.sy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (nd.label) {
      ctx.font = '9.5px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillStyle = nd.amber ? '#9c5800' : '#4a453d';
      ctx.textAlign = 'left';
      ctx.fillText(nd.label, nd.sx + 8, nd.sy + 3);
    }
  }

  // Central $1.00 PAR gimbal core
  ctx.strokeStyle = 'rgba(243, 146, 0, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(coreX, coreY, 17, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#141210';
  ctx.strokeStyle = '#f39200';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(coreX, coreY, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.font = '9.5px "IBM Plex Mono", ui-monospace, monospace';
  ctx.fillStyle = '#141210';
  ctx.textAlign = 'center';
  ctx.fillText('PAR $1.00', coreX, coreY + 30);
}

/** 02 · Power: 3D Harmonic Grid & Compute Elevation Wavefield */
function drawPower(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, mx: number, my: number): void {
  const S = Math.min(W, H) * 0.4;
  const cols = 18;
  const rows = 12;
  const yaw = -0.58 + mx * 0.22 + Math.sin(t * 0.18) * 0.06;
  const pitch = 0.62 + my * 0.14;

  const heightAt = (ix: number, iz: number): number => {
    const u = (ix / (cols - 1)) * 2 - 1;
    const v = (iz / (rows - 1)) * 2 - 1;
    // Left sector: volatile intermittent generation + dip; Right sector: stabilized compute campus
    const stability = Math.max(0, Math.min(1, (u + 0.25) * 1.1));
    const wave =
      (Math.sin(u * 3.6 + t * 0.9) * 0.14 + Math.cos(v * 3.2 - t * 0.7) * 0.1) * (1 - stability * 0.62);
    const dip = -0.22 * Math.exp(-((u + 0.52) ** 2 * 6 + (v - 0.15) ** 2 * 6));
    const ridge = 0.12 * Math.exp(-((u - 0.55) ** 2 * 5 + (v + 0.1) ** 2 * 5));
    return wave + dip + ridge;
  };

  const pt = (ix: number, iz: number, extraY = 0): [number, number, number] => {
    const x = ((ix / (cols - 1)) * 2 - 1) * 1.25;
    const z = ((iz / (rows - 1)) * 2 - 1) * 0.95;
    const y = heightAt(ix, iz) + extraY;
    let p: Vec3 = [x, y, z];
    p = rotY(p, yaw);
    p = rotX(p, pitch);
    return proj(p, W, H, S, 4.4);
  };

  // Wireframe mesh lines along rows & cols
  for (let iz = 0; iz < rows; iz++) {
    ctx.beginPath();
    for (let ix = 0; ix < cols; ix++) {
      const [sx, sy] = pt(ix, iz);
      if (ix === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.strokeStyle = iz === 6 ? 'rgba(243, 146, 0, 0.55)' : 'rgba(20, 18, 16, 0.16)';
    ctx.lineWidth = iz === 6 ? 1.5 : 0.85;
    ctx.stroke();
  }
  for (let ix = 0; ix < cols; ix++) {
    ctx.beginPath();
    for (let iz = 0; iz < rows; iz++) {
      const [sx, sy] = pt(ix, iz);
      if (iz === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.strokeStyle = 'rgba(20, 18, 16, 0.12)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // Vermilion interconnection-slip trough indicator
  const [dipX, dipY] = pt(4, 7);
  ctx.strokeStyle = 'rgba(184, 58, 20, 0.65)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(dipX, dipY, 8 + Math.sin(t * 2.8) * 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#b83a14';
  ctx.beginPath();
  ctx.arc(dipX, dipY, 3, 0, Math.PI * 2);
  ctx.fill();

  // Architectural vertical power/compute pylons rising from vertices
  const towers: Array<[number, number, number, string, boolean?]> = [
    [3, 4, 0.28, 'SOLAR'],
    [8, 6, 0.34, 'STORAGE', true],
    [13, 5, 0.44, 'CAMPUS MW', true],
    [14, 8, 0.3, 'LOAD'],
  ];

  const tops: Array<[number, number]> = [];
  for (const [ix, iz, h, lbl, isAmber] of towers) {
    const [bx, by] = pt(ix, iz, 0);
    const [tx, ty] = pt(ix, iz, h);
    tops.push([tx, ty]);

    ctx.strokeStyle = isAmber ? '#f39200' : '#141210';
    ctx.lineWidth = isAmber ? 2 : 1.4;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    // Base datum diamond
    ctx.fillStyle = isAmber ? '#f39200' : '#141210';
    ctx.beginPath();
    ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Crown ring
    ctx.fillStyle = isAmber ? '#f39200' : '#fcfaf5';
    ctx.strokeStyle = '#141210';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(tx, ty, isAmber ? 4.4 : 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = '9.5px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillStyle = isAmber ? '#9c5800' : '#3d3932';
    ctx.textAlign = 'center';
    ctx.fillText(lbl, tx, ty - 10);
  }

  // Luminous spice-amber interconnect bridge arc between Storage (idx 1) and Compute Campus (idx 2)
  const [ax, ay] = tops[1]!;
  const [bx, by] = tops[2]!;
  const midX = (ax + bx) * 0.5;
  const midY = Math.min(ay, by) - 26;
  ctx.strokeStyle = '#f39200';
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.quadraticCurveTo(midX, midY, bx, by);
  ctx.stroke();

  // Traveling megawatt pulse along the bridge
  const u = (t * 0.55) % 1;
  const omt = 1 - u;
  const px = omt * omt * ax + 2 * omt * u * midX + u * u * bx;
  const py = omt * omt * ay + 2 * omt * u * midY + u * u * by;
  ctx.fillStyle = '#141210';
  ctx.strokeStyle = '#f39200';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px, py, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

/** 03 · Trade: 3D Geodesic Maritime Navigation Sphere */
function drawTrade(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, mx: number, my: number): void {
  const R = Math.min(W, H) * 0.35;
  const cx = W * 0.5;
  const cy = H * 0.52;
  // Keep the Indian Ocean / Strait / Cape / Europe corridor facing front with calm Guild orbital precession
  const spin = -0.82 + Math.sin(t * 0.24) * 0.28 + mx * 0.32;
  const tilt = 0.22 + my * 0.16;

  const sph = (lat: number, lon: number, rad = 1): [number, number, number] => {
    const cl = Math.cos(lat);
    let p: Vec3 = [cl * Math.cos(lon) * rad, Math.sin(lat) * rad, cl * Math.sin(lon) * rad];
    p = rotY(p, spin);
    p = rotX(p, tilt);
    return [cx + p[0] * R, cy - p[1] * R, p[2]];
  };

  // Outer Guild navigation bezel & degree ticks
  const bezel = R * 1.13;
  ctx.strokeStyle = 'rgba(20, 18, 16, 0.16)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, bezel, 0, Math.PI * 2);
  ctx.stroke();
  for (let d = 0; d < 48; d++) {
    const a = (d / 48) * Math.PI * 2;
    const major = d % 4 === 0;
    ctx.strokeStyle = major ? 'rgba(20, 18, 16, 0.35)' : 'rgba(20, 18, 16, 0.13)';
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (bezel - (major ? 6 : 3)), cy + Math.sin(a) * (bezel - (major ? 6 : 3)));
    ctx.lineTo(cx + Math.cos(a) * bezel, cy + Math.sin(a) * bezel);
    ctx.stroke();
  }

  // Sphere limb silhouette
  ctx.fillStyle = 'rgba(252, 250, 245, 0.72)';
  ctx.strokeStyle = 'rgba(20, 18, 16, 0.32)';
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Latitude parallels
  for (let latDeg = -60; latDeg <= 60; latDeg += 30) {
    const lat = (latDeg * Math.PI) / 180;
    for (let i = 0; i < 64; i++) {
      const lon0 = (i / 64) * Math.PI * 2;
      const lon1 = ((i + 1) / 64) * Math.PI * 2;
      const [x0, y0, z0] = sph(lat, lon0);
      const [x1, y1, z1] = sph(lat, lon1);
      const front = (z0 + z1) * 0.5 >= 0;
      ctx.strokeStyle = front
        ? latDeg === 0
          ? 'rgba(20, 18, 16, 0.26)'
          : 'rgba(20, 18, 16, 0.13)'
        : 'rgba(20, 18, 16, 0.035)';
      ctx.lineWidth = latDeg === 0 && front ? 1.1 : 0.8;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  }

  // Longitude meridians
  for (let lonDeg = 0; lonDeg < 180; lonDeg += 30) {
    const lon = (lonDeg * Math.PI) / 180;
    for (let i = 0; i < 64; i++) {
      const lat0 = (i / 64) * Math.PI * 2;
      const lat1 = ((i + 1) / 64) * Math.PI * 2;
      const [x0, y0, z0] = sph(lat0, lon);
      const [x1, y1, z1] = sph(lat1, lon);
      const front = (z0 + z1) * 0.5 >= 0;
      ctx.strokeStyle = front ? 'rgba(20, 18, 16, 0.13)' : 'rgba(20, 18, 16, 0.035)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  }

  // Great-circle arc helper between two (lat, lon) hubs
  const drawArc = (
    a: [number, number],
    b: [number, number],
    color: string,
    width: number,
    elev = 1.04,
    pulse = false,
  ): void => {
    const steps = 40;
    const toVec = ([lat, lon]: [number, number]): Vec3 => [
      Math.cos(lat) * Math.cos(lon),
      Math.sin(lat),
      Math.cos(lat) * Math.sin(lon),
    ];
    const va = toVec(a);
    const vb = toVec(b);
    const pts: Array<[number, number, number]> = [];
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const vx = va[0] + (vb[0] - va[0]) * u;
      const vy = va[1] + (vb[1] - va[1]) * u;
      const vz = va[2] + (vb[2] - va[2]) * u;
      const len = Math.hypot(vx, vy, vz) || 1;
      const arcBoost = 1 + (elev - 1) * Math.sin(u * Math.PI);
      let p: Vec3 = [(vx / len) * arcBoost, (vy / len) * arcBoost, (vz / len) * arcBoost];
      p = rotY(p, spin);
      p = rotX(p, tilt);
      pts.push([cx + p[0] * R, cy - p[1] * R, p[2]]);
    }
    for (let i = 0; i < steps; i++) {
      const p0 = pts[i]!;
      const p1 = pts[i + 1]!;
      const front = (p0[2] + p1[2]) * 0.5 > -0.2;
      ctx.strokeStyle = color;
      ctx.globalAlpha = front ? 1 : 0.2;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(p0[0], p0[1]);
      ctx.lineTo(p1[0], p1[1]);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (pulse) {
      const idx = Math.floor(((t * 0.42) % 1) * steps);
      const pp = pts[idx]!;
      if (pp[2] > -0.1) {
        ctx.fillStyle = '#141210';
        ctx.strokeStyle = '#f39200';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pp[0], pp[1], 3.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  };

  // Front-hemisphere maritime hubs: Origin -> Blocked Strait -> Destination, plus Spice-Amber Southern Reroute
  const portEast: [number, number] = [0.16, 1.48];
  const strait: [number, number] = [0.42, 0.78];
  const portWest: [number, number] = [0.76, 0.08];
  const capeWay: [number, number] = [-0.52, 0.48];

  // Blocked direct strait corridor (vermilion dashed)
  ctx.setLineDash([4, 4]);
  drawArc(portEast, strait, 'rgba(184, 58, 20, 0.82)', 1.5, 1.03);
  drawArc(strait, portWest, 'rgba(184, 58, 20, 0.82)', 1.5, 1.03);
  ctx.setLineDash([]);

  // Spice-amber Guild Navigator geodesic reroute (Origin -> Cape -> Destination)
  drawArc(portEast, capeWay, '#f39200', 2.2, 1.09, true);
  drawArc(capeWay, portWest, '#f39200', 2.2, 1.09, true);

  // Draw hubs with clean inward-aware labels
  const hubs: Array<{ coord: [number, number]; label: string; kind: 'hub' | 'block' | 'alt' }> = [
    { coord: portEast, label: 'ORIGIN PORT', kind: 'hub' },
    { coord: strait, label: 'STRAIT CLOSED', kind: 'block' },
    { coord: capeWay, label: 'REROUTE ARC', kind: 'alt' },
    { coord: portWest, label: 'DESTINATION', kind: 'hub' },
  ];

  for (const h of hubs) {
    const [sx, sy, z] = sph(h.coord[0], h.coord[1], 1.01);
    if (z < -0.18) continue;
    if (h.kind === 'block') {
      ctx.strokeStyle = 'rgba(184, 58, 20, 0.58)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sx, sy, 8 + Math.sin(t * 3) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = h.kind === 'block' ? '#b83a14' : h.kind === 'alt' ? '#f39200' : '#141210';
    ctx.strokeStyle = '#fcfaf5';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(sx, sy, h.kind === 'hub' ? 4.2 : 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = '9.5px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillStyle = h.kind === 'block' ? '#a23210' : h.kind === 'alt' ? '#9c5800' : '#141210';
    const onRight = sx > cx + R * 0.45;
    ctx.textAlign = onRight ? 'right' : 'left';
    ctx.fillText(h.label, sx + (onRight ? -9 : 9), sy + 3);
  }
}

export function initWorldEngines(root: ParentNode = document): void {
  const reduced = prefersReducedMotion();
  const canvases = Array.from(root.querySelectorAll<HTMLCanvasElement>('[data-world-canvas]'));
  if (!canvases.length) return;

  for (const canvas of canvases) {
    const kind = (canvas.dataset['worldCanvas'] ?? 'money') as EngineKind;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    let W = 400;
    let H = 500;
    let dpr = 1;
    let raf = 0;
    let visible = false;
    let mx = 0;
    let my = 0;
    let tx = 0;
    let ty = 0;
    const t0 = performance.now();

    const resize = (): void => {
      const r = canvas.getBoundingClientRect();
      if (r.width < 20 || r.height < 20) return;
      W = Math.round(r.width);
      H = Math.round(r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    };

    const render = (now: number): void => {
      mx += (tx - mx) * 0.08;
      my += (ty - my) * 0.08;
      const t = reduced ? 1.8 : (now - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      drawDraftGrid(ctx, W, H);
      if (kind === 'money') drawMoney(ctx, W, H, t, mx, my);
      else if (kind === 'power') drawPower(ctx, W, H, t, mx, my);
      else drawTrade(ctx, W, H, t, mx, my);
    };

    const loop = (now: number): void => {
      const panel = canvas.closest<HTMLElement>('[role="tabpanel"]');
      if (!visible || document.hidden || panel?.hidden) {
        raf = 0;
        return;
      }
      render(now);
      if (!reduced) raf = requestAnimationFrame(loop);
      else raf = 0;
    };

    const wake = (): void => {
      resize();
      render(performance.now());
      if (!reduced && !raf && visible && !document.hidden) {
        raf = requestAnimationFrame(loop);
      }
    };

    const host = canvas.parentElement;
    host?.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    host?.addEventListener('pointerleave', () => {
      tx = 0;
      ty = 0;
    });

    new ResizeObserver(wake).observe(canvas);
    const panel = canvas.closest<HTMLElement>('[role="tabpanel"]');
    if (panel) {
      new MutationObserver(() => {
        if (!panel.hidden) wake();
      }).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
    }

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
    io.observe(canvas);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && visible) wake();
    });

    wake();
  }
}
