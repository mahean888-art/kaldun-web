/**
 * 05 · Worlds — Astromech × Spacing Guild Halftone Dot-Matrix Three.js WebGL Engines
 *
 * Inspired directly by Maven Creative's Astromech optical instruments:
 * volumetric 3D forms rendered as dense custom-GLSL halftone dot-matrix fields,
 * glowing amber phosphor crescents, Fresnel rim-weighted points, animated particle
 * trajectories, subtle horizontal scanlines, and deterministic micro-signal jitter.
 *
 * Three bespoke worlds:
 *   - money : Monetary Clearing Orrery (dot-matrix par sphere + nested orbital rings + cutoff arc)
 *   - power : Megawatt Topographic Wavefield (3,072-dot GLSL wave surface + monoliths + catenary streams)
 *   - trade : Spacing Guild Geodesic Globe (Fibonacci Fresnel-rim sphere + chokepoint + reroute arcs)
 */
import * as THREE from 'three';
import { prefersReducedMotion } from '../lib/prefers';
import { createRenderer, damp } from './threeStudio';

type WorldKind = 'money' | 'power' | 'trade';

interface SceneController {
  update: (t: number, dt: number, px: number, py: number) => void;
  dispose: () => void;
}

/**
 * Custom GLSL Halftone Optical Point-Cloud Shader.
 * Renders crisp circular halftone phosphor dots with subtle distance attenuation,
 * Fresnel-like luminance boost, traveling wave pulses, and rare deterministic micro-glitch.
 */
function createHalftonePointsMat(baseSize = 4.2): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      uBaseSize: { value: baseSize },
    },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute float aPhase;
      attribute vec3 aColor;
      uniform float uTime;
      uniform float uPixelRatio;
      uniform float uBaseSize;
      varying vec3 vColor;
      varying float vAlpha;
      varying float vGlitch;

      void main() {
        vec3 pos = position;
        // Subtle rare deterministic signal-line micro-glitch (Astromech optical CRT signature)
        float tick = floor(uTime * 7.5);
        float rnd = fract(sin(tick * 127.1 + floor(pos.y * 8.0) * 311.7) * 43758.5453);
        float glitchMask = step(0.986, rnd);
        pos.x += glitchMask * (fract(rnd * 19.3) - 0.5) * 0.14;
        vGlitch = glitchMask;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        float dist = max(1.2, -mvPosition.z);
        float pulse = 0.78 + 0.22 * sin(uTime * 2.2 + aPhase);
        gl_PointSize = clamp((aSize * uBaseSize * uPixelRatio * (5.2 / dist)) * (0.92 + 0.14 * pulse), 1.5, 22.0);
        gl_Position = projectionMatrix * mvPosition;

        vColor = aColor;
        // Depth-fade back hemisphere softly for strong 3D volumetric clarity
        vAlpha = smoothstep(13.5, 3.8, dist) * (0.58 + 0.42 * pulse);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vAlpha;
      varying float vGlitch;

      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c) * 2.0;
        if (d > 1.0) discard;
        // Crisp optical halftone disc with hot phosphor center
        float disc = smoothstep(1.0, 0.42, d);
        float core = smoothstep(0.55, 0.0, d);
        vec3 col = vColor * (0.95 + core * 0.65) + vec3(1.0, 0.94, 0.82) * pow(core, 2.5) * 0.55;
        col += vec3(0.4, 0.22, 0.05) * vGlitch;
        gl_FragColor = vec4(col, disc * vAlpha);
      }
    `,
  });
}

function buildPoints(
  positions: number[],
  colors: number[],
  sizes: number[],
  phases: number[],
  baseSize = 4.2,
): { points: THREE.Points; mat: THREE.ShaderMaterial; geo: THREE.BufferGeometry } {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('aColor', new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
  geo.setAttribute('aPhase', new THREE.Float32BufferAttribute(phases, 1));
  const mat = createHalftonePointsMat(baseSize);
  const points = new THREE.Points(geo, mat);
  return { points, mat, geo };
}

/** 05A · Money: Halftone Dot-Matrix Monetary Clearing Orrery */
function buildMoneyScene(scene: THREE.Scene, camera: THREE.PerspectiveCamera): SceneController {
  camera.fov = 34;
  camera.position.set(0, 1.4, 9.4);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  const root = new THREE.Group();
  scene.add(root);

  const pos: number[] = [];
  const col: number[] = [];
  const sz: number[] = [];
  const ph: number[] = [];

  const pushPt = (x: number, y: number, z: number, c: [number, number, number], s: number, p: number): void => {
    pos.push(x, y, z);
    col.push(c[0], c[1], c[2]);
    sz.push(s);
    ph.push(p);
  };

  const amber: [number, number, number] = [0.96, 0.58, 0.04];
  const goldHi: [number, number, number] = [1.0, 0.82, 0.42];
  const warmDim: [number, number, number] = [0.68, 0.44, 0.16];
  const crimson: [number, number, number] = [0.92, 0.24, 0.08];

  // 1. Dense luminous Par Core Sphere (Fibonacci halftone shell, Astromech glowing orb feel)
  const coreN = 760;
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < coreN; i++) {
    const y = 1 - (i / (coreN - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    const rad = 0.72 + (i % 7 === 0 ? 0.04 : 0);
    const x = Math.cos(theta) * r * rad;
    const z = Math.sin(theta) * r * rad;
    const eqBoost = 1.0 - Math.abs(y) * 0.45;
    pushPt(x, y * rad, z, i % 5 === 0 ? goldHi : amber, 0.95 + eqBoost * 0.7, theta);
  }

  // 2. Outer Calibrated Clearing Ring (thick halftone band + crimson weekend cutoff sector)
  const outerR = 2.38;
  for (let i = 0; i < 640; i++) {
    const a = (i / 640) * Math.PI * 2;
    const band = ((i % 4) - 1.5) * 0.042;
    const thickness = ((i % 3) - 1) * 0.025;
    const r = outerR + band;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    const z = thickness;
    const isCutoff = a > 0.35 && a < 1.25;
    pushPt(x, y, z, isCutoff ? crimson : warmDim, isCutoff ? 1.35 : 0.78, a * 3.0);
  }

  // 3. Tilted Mid Reserve Ring (bright amber halftone crescent + 5 reserve node clusters)
  const midMat4 = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(1.12, 0.38, 0.18));
  const v = new THREE.Vector3();
  for (let i = 0; i < 520; i++) {
    const a = (i / 520) * Math.PI * 2;
    const band = ((i % 3) - 1) * 0.032;
    v.set(Math.cos(a) * (1.82 + band), Math.sin(a) * (1.82 + band), 0).applyMatrix4(midMat4);
    const bright = Math.sin(a * 2.0) * 0.5 + 0.5;
    pushPt(v.x, v.y, v.z, bright > 0.72 ? goldHi : amber, 0.75 + bright * 0.65, a * 2.0);
  }

  // 4. Inner 24/7 Failover Ring (high-intensity amber-white dense filament)
  const innerMat4 = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-0.72, 0.56, 0.12));
  for (let i = 0; i < 420; i++) {
    const a = (i / 420) * Math.PI * 2;
    v.set(Math.cos(a) * 1.34, Math.sin(a) * 1.34, ((i % 3) - 1) * 0.02).applyMatrix4(innerMat4);
    pushPt(v.x, v.y, v.z, i % 4 === 0 ? goldHi : amber, 1.15, a * 4.0);
  }

  // 5. Subtle outer ambient spice dust
  for (let i = 0; i < 240; i++) {
    const r = 2.6 + (i % 19) * 0.08;
    const a = i * 2.39996;
    const y = (((i * 37) % 100) / 100 - 0.5) * 3.2;
    pushPt(Math.cos(a) * r, y, Math.sin(a) * r, warmDim, 0.45, a);
  }

  const cloud = buildPoints(pos, col, sz, ph, 4.3);
  root.add(cloud.points);

  // Ultra-fine precision architectural hairline reference rings
  const hairMat = new THREE.LineBasicMaterial({ color: 0xf39200, transparent: true, opacity: 0.22 });
  const makeCircleLine = (rad: number, rx: number, ry: number, rz: number): THREE.LineLoop => {
    const pts = Array.from({ length: 120 }, (_, i) => {
      const a = (i / 120) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * rad, Math.sin(a) * rad, 0);
    });
    const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), hairMat);
    line.rotation.set(rx, ry, rz);
    return line;
  };
  root.add(makeCircleLine(2.58, 0, 0, 0));
  root.add(makeCircleLine(1.82, 1.12, 0.38, 0.18));

  // Traveling high-energy settlement comets along the inner 24/7 failover orbit
  const cometPts = Array.from({ length: 24 }, () => new THREE.Vector3());
  const cometGeo = new THREE.BufferGeometry().setFromPoints(cometPts);
  const cometMat = new THREE.PointsMaterial({
    color: 0xffdfa0,
    size: 0.11,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const comets = new THREE.Points(cometGeo, cometMat);
  root.add(comets);

  return {
    update(t, _dt, px, py) {
      cloud.mat.uniforms['uTime']!.value = t;
      root.rotation.y = t * 0.16 + px * 0.42;
      root.rotation.x = 0.22 + py * 0.28;
      const arr = cometGeo.attributes['position'] as THREE.BufferAttribute;
      for (let i = 0; i < 24; i++) {
        const a = t * 1.45 - i * 0.065 + (i >= 12 ? Math.PI : 0);
        v.set(Math.cos(a) * 1.34, Math.sin(a) * 1.34, 0).applyMatrix4(innerMat4);
        arr.setXYZ(i, v.x, v.y, v.z);
      }
      arr.needsUpdate = true;
    },
    dispose() {
      cloud.geo.dispose();
      cloud.mat.dispose();
      hairMat.dispose();
      cometGeo.dispose();
      cometMat.dispose();
    },
  };
}

/** 05B · Power & Compute: 3,072-Dot GLSL Topographic Energy Wavefield + Compute Monoliths */
function buildPowerScene(scene: THREE.Scene, camera: THREE.PerspectiveCamera): SceneController {
  camera.fov = 35;
  camera.position.set(4.9, 3.8, 5.9);
  camera.lookAt(0, 0.1, 0);
  camera.updateProjectionMatrix();

  const root = new THREE.Group();
  root.position.y = -0.3;
  scene.add(root);

  // 1. Dense 64 x 48 Halftone Dot-Matrix Animated Topographic Wavefield (GPU vertex shader!)
  const cols = 64;
  const rows = 48;
  const count = cols * rows;
  const gridPos = new Float32Array(count * 3);
  const gridUv = new Float32Array(count * 2);
  let ptr = 0;
  let uptr = 0;
  for (let iz = 0; iz < rows; iz++) {
    for (let ix = 0; ix < cols; ix++) {
      const u = ix / (cols - 1);
      const v = iz / (rows - 1);
      gridPos[ptr++] = (u - 0.5) * 6.4;
      gridPos[ptr++] = 0;
      gridPos[ptr++] = (v - 0.5) * 4.8;
      gridUv[uptr++] = u;
      gridUv[uptr++] = v;
    }
  }
  const waveGeo = new THREE.BufferGeometry();
  waveGeo.setAttribute('position', new THREE.BufferAttribute(gridPos, 3));
  waveGeo.setAttribute('aUv', new THREE.BufferAttribute(gridUv, 2));

  const waveMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
    },
    vertexShader: /* glsl */ `
      attribute vec2 aUv;
      uniform float uTime;
      uniform float uPixelRatio;
      varying float vElev;
      varying float vEdge;
      varying float vLag;

      void main() {
        vec3 p = position;
        float w1 = sin(p.x * 0.95 + uTime * 0.85) * cos(p.z * 0.9 - uTime * 0.5) * 0.36;
        float w2 = sin((p.x - p.z) * 1.4 - uTime * 0.6) * 0.16;
        vec2 dip = p.xz - vec2(-1.45, 0.72);
        float lag = exp(-dot(dip, dip) * 1.1);
        float trough = -0.68 * lag;
        vec2 peak = p.xz - vec2(1.15, -0.35);
        float ridge = 0.52 * exp(-dot(peak, peak) * 0.6);

        float h = w1 + w2 + trough + ridge;
        p.y += h;
        vElev = h;
        vLag = lag;

        vec2 e = abs(aUv - 0.5) * 2.0;
        vEdge = smoothstep(1.0, 0.72, max(e.x, e.y));

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float dist = max(1.2, -mv.z);
        float contourBoost = smoothstep(0.65, 1.0, abs(sin(h * 11.0)));
        gl_PointSize = clamp((2.6 + contourBoost * 2.4 + lag * 1.8) * uPixelRatio * (5.4 / dist), 1.4, 14.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vElev;
      varying float vEdge;
      varying float vLag;

      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c) * 2.0;
        if (d > 1.0) discard;
        float disc = smoothstep(1.0, 0.35, d);
        vec3 dimBronze = vec3(0.42, 0.28, 0.12);
        vec3 amber = vec3(0.96, 0.58, 0.04);
        vec3 goldHi = vec3(1.0, 0.88, 0.58);
        vec3 crimson = vec3(0.94, 0.22, 0.08);
        vec3 col = mix(dimBronze, amber, smoothstep(-0.35, 0.35, vElev));
        col = mix(col, goldHi, smoothstep(0.32, 0.78, vElev));
        col = mix(col, crimson, clamp(vLag * 1.35, 0.0, 1.0));
        gl_FragColor = vec4(col, disc * vEdge * 0.85);
      }
    `,
  });
  root.add(new THREE.Points(waveGeo, waveMat));

  // 2. Crisp Wireframe Architectural Monoliths (Solar -> Storage -> Compute Campus)
  const monolithSpecs = [
    { x: 1.15, z: -0.35, w: 0.5, h: 1.95, d: 0.5, amber: true },
    { x: 1.72, z: -0.1, w: 0.36, h: 1.45, d: 0.36, amber: true },
    { x: 1.32, z: 0.28, w: 0.32, h: 1.15, d: 0.32, amber: false },
    { x: -0.25, z: 0.15, w: 0.44, h: 1.28, d: 0.44, amber: true },
    { x: -0.74, z: -0.22, w: 0.32, h: 0.92, d: 0.32, amber: false },
    { x: -1.85, z: -0.85, w: 0.38, h: 0.88, d: 0.38, amber: false },
  ];

  const solidMat = new THREE.MeshBasicMaterial({ color: 0x0d0c0a, transparent: true, opacity: 0.84 });
  const edgeAmber = new THREE.LineBasicMaterial({ color: 0xf39200, transparent: true, opacity: 0.85 });
  const edgeMuted = new THREE.LineBasicMaterial({ color: 0xd8c8ae, transparent: true, opacity: 0.45 });

  for (const m of monolithSpecs) {
    const g = new THREE.Group();
    g.position.set(m.x, m.h * 0.5 - 0.05, m.z);
    const box = new THREE.BoxGeometry(m.w, m.h, m.d);
    g.add(new THREE.Mesh(box, solidMat));
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(box), m.amber ? edgeAmber : edgeMuted));
    root.add(g);
  }

  // 3. Luminous Particle-Stream High-Voltage Catenary Bridges (Storage <-> Compute)
  const curves = [
    new THREE.QuadraticBezierCurve3(new THREE.Vector3(-1.85, 0.85, -0.85), new THREE.Vector3(-1.05, 1.62, -0.35), new THREE.Vector3(-0.25, 1.25, 0.15)),
    new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.25, 1.25, 0.15), new THREE.Vector3(0.45, 2.42, -0.1), new THREE.Vector3(1.15, 1.92, -0.35)),
    new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.74, 0.88, -0.22), new THREE.Vector3(0.45, 1.98, -0.18), new THREE.Vector3(1.72, 1.42, -0.1)),
  ];

  const streamCount = 96;
  const streamPos = new Float32Array(streamCount * 3);
  const streamGeo = new THREE.BufferGeometry();
  streamGeo.setAttribute('position', new THREE.BufferAttribute(streamPos, 3));
  const streamMat = new THREE.PointsMaterial({
    color: 0xffc666,
    size: 0.085,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const streamPoints = new THREE.Points(streamGeo, streamMat);
  root.add(streamPoints);

  const arcLineMat = new THREE.LineBasicMaterial({ color: 0xf39200, transparent: true, opacity: 0.35 });
  for (const c of curves) {
    root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(48)), arcLineMat));
  }

  const tmp = new THREE.Vector3();

  return {
    update(t, _dt, px, py) {
      waveMat.uniforms['uTime']!.value = t;
      root.rotation.y = Math.sin(t * 0.2) * 0.24 + px * 0.38;
      root.rotation.x = py * 0.18;

      const attr = streamGeo.attributes['position'] as THREE.BufferAttribute;
      for (let i = 0; i < streamCount; i++) {
        const ci = i % curves.length;
        const u = (t * 0.42 + i / streamCount) % 1;
        curves[ci]!.getPoint(u, tmp);
        attr.setXYZ(i, tmp.x, tmp.y, tmp.z);
      }
      attr.needsUpdate = true;
    },
    dispose() {
      waveGeo.dispose();
      waveMat.dispose();
      solidMat.dispose();
      edgeAmber.dispose();
      edgeMuted.dispose();
      streamGeo.dispose();
      streamMat.dispose();
      arcLineMat.dispose();
    },
  };
}

/** 05C · Trade: Spacing Guild Halftone Fresnel-Rim Geodesic Navigation Globe */
function buildTradeScene(scene: THREE.Scene, camera: THREE.PerspectiveCamera): SceneController {
  camera.fov = 34;
  camera.position.set(0, 0.95, 7.6);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  const root = new THREE.Group();
  scene.add(root);

  const R = 1.72;

  // Inner dark matte occlusion sphere so front hemisphere dots read crisply over back hemisphere
  const coreSphere = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.96, 40, 40),
    new THREE.MeshBasicMaterial({ color: 0x0b0a08 }),
  );
  root.add(coreSphere);

  // 1. 3,200-point Fibonacci Halftone Globe with Fresnel Grazing-Rim Glow (Astromech crescent aesthetic!)
  const N = 3200;
  const gPos = new Float32Array(N * 3);
  const gNorm = new Float32Array(N * 3);
  const gPhase = new Float32Array(N);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    const nx = Math.cos(theta) * r;
    const ny = y;
    const nz = Math.sin(theta) * r;
    gPos[i * 3] = nx * R;
    gPos[i * 3 + 1] = ny * R;
    gPos[i * 3 + 2] = nz * R;
    gNorm[i * 3] = nx;
    gNorm[i * 3 + 1] = ny;
    gNorm[i * 3 + 2] = nz;
    gPhase[i] = theta;
  }

  const globeGeo = new THREE.BufferGeometry();
  globeGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3));
  globeGeo.setAttribute('normal', new THREE.BufferAttribute(gNorm, 3));
  globeGeo.setAttribute('aPhase', new THREE.BufferAttribute(gPhase, 1));

  const globeMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
    },
    vertexShader: /* glsl */ `
      attribute float aPhase;
      uniform float uTime;
      uniform float uPixelRatio;
      varying float vFresnel;
      varying float vGrid;

      void main() {
        vec3 N = normalize(mat3(modelMatrix) * normal);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vec3 V = normalize(cameraPosition - wp.xyz);
        float ndv = max(dot(N, V), 0.0);
        vFresnel = pow(1.0 - ndv, 2.2);

        // Subtle latitude/longitude architectural bands
        float latBand = smoothstep(0.92, 1.0, abs(cos(asin(clamp(normal.y, -1.0, 1.0)) * 6.0)));
        vGrid = latBand;

        vec4 mv = viewMatrix * wp;
        float dist = max(1.5, -mv.z);
        float sz = (1.6 + vFresnel * 4.4 + latBand * 1.1) * uPixelRatio * (5.2 / dist);
        gl_PointSize = clamp(sz, 1.2, 16.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vFresnel;
      varying float vGrid;

      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c) * 2.0;
        if (d > 1.0) discard;
        float disc = smoothstep(1.0, 0.32, d);
        vec3 dim = vec3(0.44, 0.30, 0.14);
        vec3 amber = vec3(0.96, 0.58, 0.04);
        vec3 hot = vec3(1.0, 0.88, 0.62);
        vec3 col = mix(dim, amber, smoothstep(0.15, 0.72, vFresnel + vGrid * 0.25));
        col = mix(col, hot, smoothstep(0.68, 0.98, vFresnel));
        float a = disc * (0.28 + vFresnel * 0.72 + vGrid * 0.16);
        gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
      }
    `,
  });
  root.add(new THREE.Points(globeGeo, globeMat));

  // 2. Tilted Dotted Equatorial Azimuth Bezel
  const bezelPos: number[] = [];
  const bezelCol: number[] = [];
  const bezelSz: number[] = [];
  const bezelPh: number[] = [];
  const bezelMat4 = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.PI * 0.45, 0.12, -0.2));
  const v = new THREE.Vector3();
  for (let i = 0; i < 240; i++) {
    const a = (i / 240) * Math.PI * 2;
    const major = i % 10 === 0;
    v.set(Math.cos(a) * R * 1.32, Math.sin(a) * R * 1.32, 0).applyMatrix4(bezelMat4);
    bezelPos.push(v.x, v.y, v.z);
    bezelCol.push(major ? 1.0 : 0.78, major ? 0.76 : 0.5, major ? 0.32 : 0.16);
    bezelSz.push(major ? 1.45 : 0.68);
    bezelPh.push(a);
  }
  const bezel = buildPoints(bezelPos, bezelCol, bezelSz, bezelPh, 3.8);
  root.add(bezel.points);

  // 3. Front-hemisphere Great-Circle Chokepoint vs. Spice-Amber Reroute Arcs
  const sphVec = (lat: number, lon: number, rad = R): THREE.Vector3 => {
    const cl = Math.cos(lat);
    return new THREE.Vector3(cl * Math.sin(lon) * rad, Math.sin(lat) * rad, cl * Math.cos(lon) * rad);
  };

  const makeGreatCircle = (a: [number, number], b: [number, number], boost = 0.24): THREE.CatmullRomCurve3 => {
    const va = sphVec(a[0], a[1], 1).normalize();
    const vb = sphVec(b[0], b[1], 1).normalize();
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      const u = i / 40;
      const vec = va.clone().lerp(vb, u).normalize();
      pts.push(vec.multiplyScalar(R * (1.02 + boost * Math.sin(u * Math.PI))));
    }
    return new THREE.CatmullRomCurve3(pts);
  };

  const originPort: [number, number] = [-0.08, -0.78];
  const straitChoke: [number, number] = [0.22, 0.02];
  const destPort: [number, number] = [0.56, 0.72];
  const southernCape: [number, number] = [-0.62, 0.12];

  const chokeCurves = [
    makeGreatCircle(originPort, straitChoke, 0.06),
    makeGreatCircle(straitChoke, destPort, 0.06),
  ];
  const rerouteCurves = [
    makeGreatCircle(originPort, southernCape, 0.25),
    makeGreatCircle(southernCape, destPort, 0.25),
  ];

  // Blocked strait dashed crimson line + glowing chokepoint beacon
  const chokeMat = new THREE.LineDashedMaterial({ color: 0xe63e18, dashSize: 0.12, gapSize: 0.09, transparent: true, opacity: 0.9 });
  for (const c of chokeCurves) {
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(48)), chokeMat);
    l.computeLineDistances();
    root.add(l);
  }

  const rerouteLineMat = new THREE.LineBasicMaterial({ color: 0xf39200, transparent: true, opacity: 0.55 });
  for (const c of rerouteCurves) {
    root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(56)), rerouteLineMat));
  }

  // Animated bright amber cargo particle streams along reroute corridor
  const cargoN = 80;
  const cargoPos = new Float32Array(cargoN * 3);
  const cargoGeo = new THREE.BufferGeometry();
  cargoGeo.setAttribute('position', new THREE.BufferAttribute(cargoPos, 3));
  const cargoMat = new THREE.PointsMaterial({
    color: 0xffdfa0,
    size: 0.095,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  root.add(new THREE.Points(cargoGeo, cargoMat));

  // Chokepoint pulsing alert ring
  const chokePos = sphVec(straitChoke[0], straitChoke[1], R * 1.03);
  const chokeRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.17, 0.014, 10, 36),
    new THREE.MeshBasicMaterial({ color: 0xe63e18, transparent: true, opacity: 0.9 }),
  );
  chokeRing.position.copy(chokePos);
  chokeRing.lookAt(chokePos.clone().multiplyScalar(2));
  root.add(chokeRing);

  const tmp = new THREE.Vector3();

  return {
    update(t, _dt, px, py) {
      globeMat.uniforms['uTime']!.value = t;
      bezel.mat.uniforms['uTime']!.value = t;
      root.rotation.y = Math.sin(t * 0.24) * 0.24 + px * 0.42;
      root.rotation.x = 0.08 + py * 0.26;
      const pulse = 1 + Math.sin(t * 3.4) * 0.22;
      chokeRing.scale.set(pulse, pulse, 1);

      const attr = cargoGeo.attributes['position'] as THREE.BufferAttribute;
      for (let i = 0; i < cargoN; i++) {
        const ci = i % 2;
        const u = (t * 0.38 + i / cargoN) % 1;
        rerouteCurves[ci]!.getPoint(u, tmp);
        attr.setXYZ(i, tmp.x, tmp.y, tmp.z);
      }
      attr.needsUpdate = true;
    },
    dispose() {
      globeGeo.dispose();
      globeMat.dispose();
      bezel.geo.dispose();
      bezel.mat.dispose();
      chokeMat.dispose();
      rerouteLineMat.dispose();
      cargoGeo.dispose();
      cargoMat.dispose();
    },
  };
}

export function initWorldsThree(rootNode: ParentNode = document): void {
  const reduced = prefersReducedMotion();
  const canvases = Array.from(rootNode.querySelectorAll<HTMLCanvasElement>('[data-world-canvas]'));
  if (!canvases.length) return;

  for (const canvas of canvases) {
    const kind = (canvas.dataset['worldCanvas'] ?? 'money') as WorldKind;
    const renderer = createRenderer(canvas, false);
    if (!renderer) continue;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0a08);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
    const controller =
      kind === 'money'
        ? buildMoneyScene(scene, camera)
        : kind === 'power'
          ? buildPowerScene(scene, camera)
          : buildTradeScene(scene, camera);

    let visible = false;
    let raf = 0;
    let px = 0;
    let py = 0;
    let tx = 0;
    let ty = 0;
    let lastNow = performance.now();
    const t0 = performance.now();

    const resize = (): void => {
      const r = canvas.getBoundingClientRect();
      if (r.width < 20 || r.height < 20) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
    };

    const renderFrame = (now: number): void => {
      const dt = Math.min((now - lastNow) / 1000, 0.08);
      lastNow = now;
      px = damp(px, tx, 5, dt);
      py = damp(py, ty, 5, dt);
      const t = reduced ? 1.8 : (now - t0) / 1000;
      controller.update(t, dt, px, py);
      renderer.render(scene, camera);
    };

    const loop = (now: number): void => {
      if (!visible || document.hidden) {
        raf = 0;
        return;
      }
      renderFrame(now);
      if (!reduced) raf = requestAnimationFrame(loop);
      else raf = 0;
    };

    const wake = (): void => {
      resize();
      lastNow = performance.now();
      renderFrame(lastNow);
      if (!reduced && !raf && visible && !document.hidden) {
        raf = requestAnimationFrame(loop);
      }
    };

    const host = canvas.closest<HTMLElement>('.tk-card') ?? canvas.parentElement;
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

    window.addEventListener('beforeunload', () => {
      controller.dispose();
      renderer.dispose();
    });

    wake();
  }
}
