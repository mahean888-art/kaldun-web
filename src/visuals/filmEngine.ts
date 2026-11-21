/**
 * 02 · How it works — Three.js PBR Studio Sculpture ("The Foresight Instrument")
 *
 * Physical material language aligned with the Hero architectural maquette:
 * matte architectural porcelain, machined anodized dark-titanium, brushed spice-brass,
 * and translucent frosted optical acrylic planes in soft studio skylight with real shadows.
 *
 * Four choreographed physical states:
 *   1 · MODEL     — Articulated porcelain & obsidian institutional assembly with tensioned clearing filaments
 *   2 · SIMULATE  — Nine frosted optical acrylic temporal slices fan outward against a horizontal Par Plane under stress
 *   3 · INTERVENE — Solid spice-amber optical key prism engages the core, lifting breaking slices back above par
 *   4 · RECORD    — Solved state locks inside concentric machined titanium & brass cryptographic seal rings
 */
import * as THREE from 'three';
import { prefersReducedMotion } from '../lib/prefers';
import { createRenderer, createStudioEnv, damp } from './threeStudio';

const DURS = [5600, 6200, 6200, 5600] as const;

const META = [
  {
    plate: 'SEC-02 // STAGE 01 · MODEL',
    sk: 'STATE SPACE',
    sv: 'Capital, contracts, counterparties, rails, and rules',
    code: 'MANIFOLD // 25 BANKS · 140 PARTNERS',
  },
  {
    plate: 'SEC-02 // STAGE 02 · SIMULATE',
    sk: 'STRESS REGIMES',
    sv: 'Held-out crises and the smallest shock that breaks par',
    code: 'REGIMES // 312 BRANCHES · PAR 1.0000',
  },
  {
    plate: 'SEC-02 // STAGE 03 · INTERVENE',
    sk: 'INTERVENTION',
    sv: 'Second 24/7 rail + daily cap + morning sweep lifts every branch above par',
    code: 'SOLUTION // 3 TERMS · +$500M FREED',
  },
  {
    plate: 'SEC-02 // STAGE 04 · RECORD',
    sk: 'PRE-OUTCOME SEAL',
    sv: 'Cryptographic commitment hashed before the outcome is known',
    code: 'SHA-256 // 7C41·A9E0 · LOCKED',
  },
] as const;

const CAM_TARGETS: ReadonlyArray<{ pos: [number, number, number]; look: [number, number, number] }> = [
  { pos: [6.5, 4.5, 7.6], look: [0, 0.05, 0] },
  { pos: [7.5, 3.8, 6.4], look: [0.1, 0.25, 0] },
  { pos: [5.9, 4.2, 7.5], look: [0, 0.28, 0] },
  { pos: [5.2, 5.2, 6.8], look: [0, -0.05, 0] },
];

export function initFilmEngine(host: HTMLElement): void {
  const canvas = host.querySelector<HTMLCanvasElement>('[data-film-canvas]');
  const chs = Array.from(host.querySelectorAll<HTMLButtonElement>('[data-go]'));
  const play = host.querySelector<HTMLButtonElement>('[data-play]');
  const playT = host.querySelector<HTMLElement>('[data-play-t]');
  const plateEl = host.querySelector<HTMLElement>('[data-film-plate]');
  const skEl = host.querySelector<HTMLElement>('[data-film-sk]');
  const svEl = host.querySelector<HTMLElement>('[data-film-sv]');
  const codeEl = host.querySelector<HTMLElement>('[data-film-code]');
  if (!canvas || chs.length !== 4) return;

  const renderer = createRenderer(canvas, false);
  if (!renderer) return;

  const { pmrem, envTex } = createStudioEnv(renderer, 'paper');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf4f1ea);
  scene.fog = new THREE.Fog(0xf4f1ea, 15, 28);
  scene.environment = envTex;

  const camera = new THREE.PerspectiveCamera(34, 16 / 9.4, 0.1, 60);
  camera.position.set(...CAM_TARGETS[0]!.pos);

  // ---- Studio Lighting -----------------------------------------------------
  const hemi = new THREE.HemisphereLight(0xfffdf8, 0xded8cc, 0.9);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight(0xfff9f0, 2.1);
  keyLight.position.set(6, 11, 7);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 2;
  keyLight.shadow.camera.far = 26;
  const sBound = 6.5;
  keyLight.shadow.camera.left = -sBound;
  keyLight.shadow.camera.right = sBound;
  keyLight.shadow.camera.top = sBound;
  keyLight.shadow.camera.bottom = -sBound;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.radius = 4;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xffa428, 1.35);
  rimLight.position.set(-7, 4, -6);
  scene.add(rimLight);

  const fillLight = new THREE.DirectionalLight(0xebe7df, 0.75);
  fillLight.position.set(-6, 5, 6);
  scene.add(fillLight);

  // ---- Shared Physical Materials -------------------------------------------
  const porcelainMat = new THREE.MeshPhysicalMaterial({
    color: 0xf7f4ee,
    roughness: 0.42,
    metalness: 0.02,
    clearcoat: 0.22,
    clearcoatRoughness: 0.35,
  });

  const stoneMat = new THREE.MeshPhysicalMaterial({
    color: 0xe6e1d7,
    roughness: 0.58,
    metalness: 0.04,
  });

  const obsidianMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a1816,
    roughness: 0.24,
    metalness: 0.72,
    clearcoat: 0.4,
    clearcoatRoughness: 0.22,
  });

  const titaniumMat = new THREE.MeshStandardMaterial({
    color: 0x2c2925,
    roughness: 0.32,
    metalness: 0.86,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc98a2e,
    roughness: 0.28,
    metalness: 0.88,
  });

  const amberCrystalMat = new THREE.MeshPhysicalMaterial({
    color: 0xf39200,
    emissive: 0xd46d00,
    emissiveIntensity: 0.32,
    roughness: 0.14,
    metalness: 0.08,
    transmission: 0.35,
    thickness: 0.8,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
    transparent: true,
    opacity: 0.94,
  });

  // ---- Studio Shadow-Catcher Floor -----------------------------------------
  const floorGeo = new THREE.PlaneGeometry(32, 32);
  const floorMat = new THREE.ShadowMaterial({ opacity: 0.14, color: 0x221d16 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.25;
  floor.receiveShadow = true;
  scene.add(floor);

  const root = new THREE.Group();
  scene.add(root);

  // ---- 1. Machined Architectural Plinth & Precision Vernier Bezel ----------
  const plinth = new THREE.Group();
  plinth.position.y = -1.12;
  root.add(plinth);

  const baseDisc = new THREE.Mesh(new THREE.CylinderGeometry(3.25, 3.35, 0.22, 72), porcelainMat);
  baseDisc.castShadow = true;
  baseDisc.receiveShadow = true;
  plinth.add(baseDisc);

  const innerPad = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.55, 0.25, 64), stoneMat);
  innerPad.receiveShadow = true;
  plinth.add(innerPad);

  const outerBezel = new THREE.Mesh(new THREE.TorusGeometry(3.26, 0.035, 16, 96), titaniumMat);
  outerBezel.rotation.x = Math.PI / 2;
  outerBezel.position.y = 0.11;
  plinth.add(outerBezel);

  const innerBrassRing = new THREE.Mesh(new THREE.TorusGeometry(2.56, 0.016, 12, 96), brassMat);
  innerBrassRing.rotation.x = Math.PI / 2;
  innerBrassRing.position.y = 0.125;
  plinth.add(innerBrassRing);

  // 72 instanced precision vernier degree ticks around the plinth perimeter
  const tickGeo = new THREE.BoxGeometry(0.018, 0.016, 0.16);
  const ticks = new THREE.InstancedMesh(tickGeo, titaniumMat, 72);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const major = i % 6 === 0;
    const rad = major ? 2.96 : 3.0;
    dummy.position.set(Math.cos(a) * rad, 0.12, Math.sin(a) * rad);
    dummy.rotation.set(0, -a + Math.PI / 2, 0);
    dummy.scale.set(major ? 1.5 : 0.9, 1, major ? 1.45 : 0.72);
    dummy.updateMatrix();
    ticks.setMatrixAt(i, dummy.matrix);
  }
  ticks.instanceMatrix.needsUpdate = true;
  plinth.add(ticks);

  // ---- 2. Institutional Model Assembly (Stage 01 Core + Towers) ------------
  const modelGroup = new THREE.Group();
  root.add(modelGroup);

  // Central Obsidian & Brass Institution Core
  const corePedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.54, 1.05, 32), obsidianMat);
  corePedestal.position.y = -0.35;
  corePedestal.castShadow = true;
  corePedestal.receiveShadow = true;
  modelGroup.add(corePedestal);

  const coreCollar = new THREE.Mesh(new THREE.TorusGeometry(0.51, 0.025, 16, 48), brassMat);
  coreCollar.rotation.x = Math.PI / 2;
  coreCollar.position.y = 0.12;
  modelGroup.add(coreCollar);

  const coreCrown = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), amberCrystalMat);
  coreCrown.position.y = 0.56;
  coreCrown.castShadow = true;
  modelGroup.add(coreCrown);

  // Two precision orbital gimbal rings
  const gimbalA = new THREE.Mesh(new THREE.TorusGeometry(1.52, 0.016, 14, 96), titaniumMat);
  gimbalA.position.y = 0.45;
  modelGroup.add(gimbalA);

  const gimbalB = new THREE.Mesh(new THREE.TorusGeometry(1.88, 0.012, 12, 96), brassMat);
  gimbalB.position.y = 0.45;
  modelGroup.add(gimbalB);

  // 6 sculpted matte-porcelain institutional counterparty blocks + tension filaments
  interface NodePillar {
    group: THREE.Group;
    basePos: THREE.Vector3;
    pulse: THREE.Mesh;
    curve: THREE.QuadraticBezierCurve3;
    phase: number;
  }
  const pillars: NodePillar[] = [];
  const pillarSpecs = [
    { angle: 0.15, r: 2.05, w: 0.42, h: 0.92, d: 0.32 },
    { angle: 1.18, r: 1.95, w: 0.34, h: 1.18, d: 0.34 },
    { angle: 2.22, r: 2.1, w: 0.48, h: 0.78, d: 0.32 },
    { angle: 3.25, r: 1.98, w: 0.36, h: 1.04, d: 0.36 },
    { angle: 4.3, r: 2.08, w: 0.44, h: 0.86, d: 0.28 },
    { angle: 5.32, r: 1.92, w: 0.34, h: 1.12, d: 0.34 },
  ];

  const pulseMat = new THREE.MeshBasicMaterial({ color: 0xf39200 });
  const filamentMat = new THREE.MeshStandardMaterial({
    color: 0x3b362f,
    roughness: 0.35,
    metalness: 0.78,
  });

  for (let i = 0; i < pillarSpecs.length; i++) {
    const sp = pillarSpecs[i]!;
    const g = new THREE.Group();
    const x = Math.cos(sp.angle) * sp.r;
    const z = Math.sin(sp.angle) * sp.r;
    const baseY = -0.98 + sp.h * 0.5;
    g.position.set(x, baseY, z);
    g.rotation.y = -sp.angle + Math.PI / 4;

    const body = new THREE.Mesh(new THREE.BoxGeometry(sp.w, sp.h, sp.d), stoneMat);
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);

    const baseCollar = new THREE.Mesh(new THREE.BoxGeometry(sp.w * 1.06, 0.05, sp.d * 1.06), titaniumMat);
    baseCollar.position.y = -sp.h * 0.5 + 0.025;
    g.add(baseCollar);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(sp.w * 1.04, 0.04, sp.d * 1.04), i % 2 === 0 ? obsidianMat : brassMat);
    cap.position.y = sp.h * 0.5 + 0.02;
    g.add(cap);

    modelGroup.add(g);

    const start = new THREE.Vector3(x, -0.98 + sp.h + 0.05, z);
    const end = new THREE.Vector3(0, 0.42, 0);
    const mid = start.clone().lerp(end, 0.5);
    mid.y += 0.42;
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.01, 8, false), filamentMat);
    modelGroup.add(tube);

    const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 12), pulseMat);
    modelGroup.add(pulse);

    pillars.push({ group: g, basePos: new THREE.Vector3(x, baseY, z), pulse, curve, phase: i * 0.17 });
  }

  // ---- 3. Nine Frosted Optical Acrylic Temporal Slices (Stage 02 & 03) -----
  const slicesGroup = new THREE.Group();
  slicesGroup.position.y = 0.55;
  root.add(slicesGroup);

  interface TemporalSlice {
    pivot: THREE.Group;
    pane: THREE.Mesh;
    frame: THREE.LineSegments;
    mat: THREE.MeshPhysicalMaterial;
    edgeMat: THREE.LineBasicMaterial;
    index: number;
    breaksUnderStress: boolean;
  }
  const slices: TemporalSlice[] = [];
  const SLICE_COUNT = 9;
  const paneGeo = new THREE.BoxGeometry(2.8, 1.55, 0.032);
  const edgeGeo = new THREE.EdgesGeometry(paneGeo);

  for (let i = 0; i < SLICE_COUNT; i++) {
    const pivot = new THREE.Group();
    const isHeroSlice = i === 4;
    const mat = new THREE.MeshPhysicalMaterial({
      color: isHeroSlice ? 0xf7b249 : 0xfbf8f2,
      emissive: isHeroSlice ? 0xf39200 : 0x000000,
      emissiveIntensity: isHeroSlice ? 0.15 : 0,
      roughness: 0.22,
      metalness: 0.05,
      clearcoat: 0.7,
      clearcoatRoughness: 0.18,
      transparent: true,
      opacity: isHeroSlice ? 0.62 : 0.34,
      depthWrite: false,
    });
    const pane = new THREE.Mesh(paneGeo, mat);
    pane.castShadow = false;
    pivot.add(pane);

    const edgeMat = new THREE.LineBasicMaterial({
      color: isHeroSlice ? 0xf39200 : 0x5c564c,
      transparent: true,
      opacity: isHeroSlice ? 0.9 : 0.32,
    });
    const frame = new THREE.LineSegments(edgeGeo, edgeMat);
    pivot.add(frame);

    slicesGroup.add(pivot);
    slices.push({
      pivot,
      pane,
      frame,
      mat,
      edgeMat,
      index: i,
      breaksUnderStress: i !== 4 && i % 2 === 1,
    });
  }

  // Custom GLSL Par Datum Horizon Plane (appears in Simulate & Intervene)
  const parUniforms = {
    uTime: { value: 0 },
    uOpacity: { value: 0 },
    uSolved: { value: 0 },
  };
  const parMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: parUniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uOpacity;
      uniform float uSolved;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv - 0.5;
        float r = length(p) * 2.0;
        if (r > 1.0) discard;
        float ring = smoothstep(0.95, 0.985, r) * (1.0 - smoothstep(0.985, 1.0, r));
        float innerRing = smoothstep(0.64, 0.652, r) * (1.0 - smoothstep(0.652, 0.665, r)) * 0.45;
        float sweep = 0.5 + 0.5 * sin(r * 22.0 - uTime * 2.4);
        float fill = (1.0 - r) * 0.14 + sweep * 0.05 * (1.0 - r);
        vec3 stressCol = vec3(0.76, 0.25, 0.10);
        vec3 amberCol = vec3(0.95, 0.57, 0.0);
        vec3 col = mix(stressCol, amberCol, uSolved);
        float a = (ring * 0.85 + innerRing + fill) * uOpacity;
        gl_FragColor = vec4(col, a);
      }
    `,
  });
  const parPlane = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 5.6), parMat);
  parPlane.rotation.x = -Math.PI / 2;
  parPlane.position.y = 0.05;
  root.add(parPlane);

  // ---- 4. Intervention Optical Key Prism (Stage 03) ------------------------
  const keyGroup = new THREE.Group();
  keyGroup.position.y = 2.8;
  root.add(keyGroup);

  const keyCore = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.75, 0.42), amberCrystalMat);
  keyCore.castShadow = true;
  keyGroup.add(keyCore);

  const keyCage = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(0.46, 1.79, 0.46)),
    new THREE.LineBasicMaterial({ color: 0x141210, transparent: true, opacity: 0.7 }),
  );
  keyGroup.add(keyCage);

  // ---- 5. Cryptographic Pre-Outcome Seal Rings (Stage 04) ------------------
  const sealGroup = new THREE.Group();
  sealGroup.position.y = 0.12;
  root.add(sealGroup);

  const sealRings: THREE.Mesh[] = [];
  const sealRads = [1.05, 1.38, 1.72];
  for (let i = 0; i < sealRads.length; i++) {
    const r = sealRads[i]!;
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(r, i === 1 ? 0.042 : 0.028, 18, 80),
      i === 1 ? brassMat : obsidianMat,
    );
    mesh.rotation.x = Math.PI / 2;
    mesh.castShadow = true;
    sealGroup.add(mesh);
    sealRings.push(mesh);
  }

  // ---- Interactive State Machine -------------------------------------------
  const reduced = prefersReducedMotion();
  let step = 0;
  let playing = !reduced;
  let visible = false;
  let stepStart = performance.now();
  let lastNow = performance.now();
  let raf = 0;
  let px = 0;
  let py = 0;
  let tx = 0;
  let ty = 0;

  // Damped stage weights (w0..w3)
  const w = [1, 0, 0, 0];
  const camPos = new THREE.Vector3(...CAM_TARGETS[0]!.pos);
  const camLook = new THREE.Vector3(...CAM_TARGETS[0]!.look);

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
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  };

  const renderFrame = (now: number): void => {
    const dt = Math.min((now - lastNow) / 1000, 0.08);
    lastNow = now;
    const t = reduced ? 2.4 : now / 1000;

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

    // Damp pointer parallax & state weights
    px = damp(px, tx, 5, dt);
    py = damp(py, ty, 5, dt);
    for (let i = 0; i < 4; i++) {
      w[i] = damp(w[i]!, i === step ? 1 : 0, 4.5, dt);
    }

    const wModel = w[0]!;
    const wSim = w[1]!;
    const wInt = w[2]!;
    const wRec = w[3]!;

    // Smooth camera choreography
    const ct = CAM_TARGETS[step]!;
    camPos.x = damp(camPos.x, ct.pos[0] + px * 0.65, 3.6, dt);
    camPos.y = damp(camPos.y, ct.pos[1] - py * 0.35, 3.6, dt);
    camPos.z = damp(camPos.z, ct.pos[2], 3.6, dt);
    camLook.x = damp(camLook.x, ct.look[0], 4.2, dt);
    camLook.y = damp(camLook.y, ct.look[1], 4.2, dt);
    camLook.z = damp(camLook.z, ct.look[2], 4.2, dt);
    camera.position.copy(camPos);
    camera.lookAt(camLook);

    // Subtle slow orbital rotation of the whole instrument
    root.rotation.y = Math.sin(t * 0.22) * 0.16 + px * 0.18;

    // 1. Model Assembly (prominent in Stage 01, recedes cleanly in Simulate/Record)
    const modelScale = 0.72 + wModel * 0.28 + wRec * 0.12;
    modelGroup.scale.setScalar(modelScale);
    coreCrown.rotation.y = t * 0.85;
    coreCrown.rotation.x = Math.sin(t * 0.6) * 0.22;
    coreCrown.position.y = 0.56 + Math.sin(t * 1.6) * 0.045 - wRec * 0.28;

    gimbalA.rotation.x = Math.PI * 0.35 + t * 0.28 * (1 - wRec * 0.85);
    gimbalA.rotation.y = t * 0.22;
    gimbalB.rotation.z = Math.PI * 0.22 - t * 0.24 * (1 - wRec * 0.85);
    gimbalB.rotation.x = Math.PI * 0.48 + Math.sin(t * 0.4) * 0.15;

    for (const p of pillars) {
      const lift = Math.sin(t * 1.1 + p.phase * 6) * 0.025 * wModel;
      p.group.position.y = p.basePos.y + lift;
      const u = (t * 0.36 + p.phase) % 1;
      p.curve.getPoint(u, p.pulse.position);
      p.pulse.visible = wModel + wInt > 0.15;
    }

    // 2. Frosted Acrylic Temporal Slices (fan out in Simulate, snap into alignment in Intervene)
    const slicePresence = Math.max(wSim, wInt, wRec * 0.35);
    slicesGroup.visible = slicePresence > 0.02;
    for (const sl of slices) {
      const norm = (sl.index - (SLICE_COUNT - 1) / 2) / ((SLICE_COUNT - 1) / 2); // -1 .. +1
      const isHero = sl.index === 4;

      const spreadZ = norm * (1.85 * wSim + 1.25 * wInt + 0.18 * wRec);
      const fanRotY = norm * (0.34 * wSim + 0.12 * wInt);
      const stressDip = sl.breaksUnderStress
        ? -0.58 * wSim + Math.sin(t * 2.2 + sl.index) * 0.06 * wSim
        : 0.12 * wSim;
      const stressTilt = sl.breaksUnderStress ? -0.26 * wSim : 0.04 * wSim;

      sl.pivot.position.set(norm * 0.14 * wSim, stressDip + (isHero ? 0.14 * wInt : 0), spreadZ);
      sl.pivot.rotation.set(stressTilt, fanRotY, 0);
      const sc = 0.2 + slicePresence * 0.8;
      sl.pivot.scale.set(sc, sc * (isHero ? 1.05 : 0.92), 1);

      if (isHero) {
        sl.mat.opacity = (0.35 + 0.42 * wInt + 0.25 * wRec) * slicePresence;
        sl.mat.emissiveIntensity = 0.08 + 0.42 * wInt + 0.22 * wRec;
        sl.edgeMat.color.setHex(0xf39200);
        sl.edgeMat.opacity = 0.95 * slicePresence;
      } else if (sl.breaksUnderStress) {
        sl.mat.color.setHex(wSim > 0.5 ? 0xf2dcd4 : 0xfbf8f2);
        sl.mat.opacity = (0.32 * wSim + 0.22 * wInt + 0.08 * wRec) * slicePresence;
        sl.edgeMat.color.setHex(wSim > 0.45 ? 0xb83a14 : 0x6b6459);
        sl.edgeMat.opacity = (0.65 * wSim + 0.25 * wInt) * slicePresence;
      } else {
        sl.mat.opacity = (0.28 * wSim + 0.24 * wInt + 0.1 * wRec) * slicePresence;
        sl.edgeMat.opacity = 0.3 * slicePresence;
      }
    }

    // 3. Par Datum Shader Plane
    parUniforms.uTime.value = t;
    parUniforms.uOpacity.value = Math.min(1, wSim * 0.9 + wInt * 0.85);
    parUniforms.uSolved.value = wInt;
    parPlane.visible = parUniforms.uOpacity.value > 0.02;

    // 4. Intervention Optical Key Prism (descends in Stage 03, retracts cleanly out of frustum otherwise)
    keyGroup.visible = wInt > 0.08;
    keyGroup.position.y = 6.2 - wInt * 5.55 + Math.sin(t * 2.0) * 0.03;
    keyGroup.rotation.y = Math.PI / 4 + t * 0.5;
    keyGroup.scale.setScalar(Math.max(0.01, wInt));

    // 5. Cryptographic Seal Rings (close tightly in Stage 04)
    sealGroup.visible = wRec > 0.02;
    for (let i = 0; i < sealRings.length; i++) {
      const ring = sealRings[i]!;
      const drop = (1 - wRec) * (0.9 + i * 0.45);
      ring.position.y = drop + i * 0.08;
      ring.scale.setScalar(1.35 - wRec * 0.35);
      ring.rotation.z = t * (i % 2 === 0 ? 0.35 : -0.28) * (1 - wRec * 0.7);
    }

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

  // Controls
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

  window.addEventListener('beforeunload', () => {
    pmrem.dispose();
    envTex.dispose();
    renderer.dispose();
  });

  syncDom();
  wake();
}
