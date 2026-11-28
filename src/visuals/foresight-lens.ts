/**
 * Hero Optical Instrument: a dark-anodized foresight astrolabe rendered in
 * Three.js + custom GLSL shaders. Replaces low-poly voxel geometry with a
 * sculpted dark-graphite phase-space manifold, precision elevation contours,
 * branching hairline futures, and one calibrated amber foresight trajectory
 * threading through the bifurcation. Dragging across the glass scrubs time.
 */
import * as THREE from 'three';
import { prefersReducedMotion } from '../lib/prefers';

function buildDial(host: HTMLElement): void {
  const svg = host.querySelector<SVGSVGElement>('.lens__dial');
  if (!svg) return;
  let s = '';
  // Outer faint instrument bezel ring
  s += '<circle r="94" class="lens__outer"/>';
  s += '<circle r="86.5" class="lens__ring"/>';
  // 144 fine vernier ticks around the optical aperture
  for (let i = 0; i < 144; i++) {
    const a = (i / 144) * Math.PI * 2;
    const major = i % 12 === 0;
    const cardinal = i % 36 === 0;
    const r0 = 86.5;
    const len = cardinal ? 4.8 : major ? 3.0 : 1.3;
    const cls = cardinal ? 'lens__tk lens__tk--c' : major ? 'lens__tk lens__tk--m' : 'lens__tk';
    s += `<line class="${cls}" x1="${(Math.cos(a) * r0).toFixed(2)}" y1="${(Math.sin(a) * r0).toFixed(2)}" x2="${(Math.cos(a) * (r0 + len)).toFixed(2)}" y2="${(Math.sin(a) * (r0 + len)).toFixed(2)}"/>`;
  }
  // Subtle optical crosshair ticks at 4 cardinals (no literal world-name text!)
  for (const deg of [0, 90, 180, 270]) {
    const a = (deg * Math.PI) / 180;
    s += `<line class="lens__ret" x1="${(Math.cos(a) * 78.5).toFixed(2)}" y1="${(Math.sin(a) * 78.5).toFixed(2)}" x2="${(Math.cos(a) * 82).toFixed(2)}" y2="${(Math.sin(a) * 82).toFixed(2)}"/>`;
  }
  const day = Number(host.dataset['lensDay'] ?? 0.32);
  const C = 2 * Math.PI * 83.4;
  s += `<circle r="83.4" class="lens__track"/>`;
  s += `<circle data-arc r="83.4" class="lens__arc" transform="rotate(-90)" stroke-dasharray="${(day * C).toFixed(2)} ${C.toFixed(2)}"/>`;
  s += `<rect data-hand x="-1.25" y="-92.2" width="2.5" height="2.5" class="lens__hand" transform="rotate(${(day * 360).toFixed(1)})"/>`;
  // Quiet technical horizon readout at 6 o'clock & 12 o'clock
  s += '<text class="lens__coord" x="0" y="-96.5" text-anchor="middle">HORIZON · T₀ → T+N</text>';
  s += '<text data-clock class="lens__clock" x="0" y="99.5" text-anchor="middle">T + 00 H</text>';
  svg.innerHTML = s;
}

function sizeType(host: HTMLElement): void {
  const box = host.querySelector<HTMLElement>('.lens__box');
  if (!box) return;
  const w = box.clientWidth || 400;
  host.style.setProperty('--lens-fs', `${((10.5 * 200) / w).toFixed(2)}px`);
}

export function initForesightLens(root: ParentNode): void {
  const host = root.querySelector<HTMLElement>('[data-foresight-lens]');
  if (!host) return;
  buildDial(host);
  sizeType(host);
  window.addEventListener('resize', () => sizeType(host));

  const box = host.querySelector<HTMLElement>('.lens__box');
  if (!box) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'lens__gl';
  canvas.setAttribute('aria-hidden', 'true');
  box.appendChild(canvas);

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch {
    // Graceful fallback if WebGL unavailable
    host.classList.add('is-fallback');
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 7.6, 11.4);
  camera.lookAt(0, -0.25, 0);

  // Offscreen RT for optical sapphire glass post-pass (vignette, Fresnel rim, micro-refraction)
  const rt = new THREE.WebGLRenderTarget(1024, 1024, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    samples: 4,
  });

  // ---- 1. Sculpted Dark Phase-Space Terrain Manifold (Custom GLSL Shader)
  const fieldGeo = new THREE.PlaneGeometry(16, 16, 128, 128);
  fieldGeo.rotateX(-Math.PI / 2);

  const fieldMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uSweep: { value: 0.35 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vPos;
      varying float vElev;
      varying float vDist;

      float wave(vec2 p, float t) {
        float r = length(p);
        float a = sin(p.x * 0.55 + t * 0.35) * cos(p.y * 0.48 - t * 0.25) * 0.62;
        float b = sin(r * 1.15 - t * 0.6) * 0.28 * exp(-r * 0.14);
        float c = cos((p.x - p.y) * 0.85 + t * 0.2) * 0.22;
        // Raised central bifurcation ridge
        float ridge = exp(-pow(p.y * 0.55 - sin(p.x * 0.42) * 0.55, 2.0)) * 0.48 * smoothstep(-5.5, 4.5, p.x);
        return (a + b + c + ridge) * smoothstep(7.8, 2.2, r);
      }

      void main() {
        vec3 p = position;
        float h = wave(p.xz, uTime);
        p.y += h;
        vPos = p;
        vElev = h;
        vDist = length(p.xz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uSweep;
      varying vec3 vPos;
      varying float vElev;
      varying float vDist;

      void main() {
        // Radial aperture fade
        float mask = smoothstep(7.2, 3.6, vDist);
        if (mask <= 0.001) discard;

        // Compute fine topographic contour lines from continuous elevation
        float freq = 11.0;
        float g = abs(fract(vElev * freq - 0.5) - 0.5) / fwidth(vElev * freq);
        float contour = 1.0 - smoothstep(0.65, 1.65, g);

        // Subtle machined orthogonal coordinate grid
        vec2 gridUv = vPos.xz * 1.15;
        vec2 gr = abs(fract(gridUv - 0.5) - 0.5) / fwidth(gridUv);
        float gridLine = 1.0 - min(min(gr.x, gr.y), 1.0);
        gridLine = smoothstep(0.35, 1.0, gridLine) * 0.22;

        // Grazing metallic obsidian surface tone
        vec3 dx = dFdx(vPos);
        vec3 dy = dFdy(vPos);
        vec3 N = normalize(cross(dx, dy));
        vec3 L = normalize(vec3(0.55, 0.72, 0.42));
        float diff = max(dot(N, L), 0.0);

        vec3 baseCol = mix(vec3(0.068, 0.060, 0.052), vec3(0.145, 0.132, 0.115), diff);

        // Sweeping amber scan horizon moving along X
        float scanX = mix(-5.2, 5.2, fract(uSweep));
        float scanBand = exp(-pow((vPos.x - scanX) * 1.15, 2.0));

        // Combine surface + warm ivory contours + subtle amber scan highlight
        vec3 ivory = vec3(0.92, 0.88, 0.81);
        vec3 amber = vec3(0.953, 0.573, 0.0);

        vec3 col = baseCol;
        col = mix(col, ivory, contour * (0.28 + 0.18 * smoothstep(-0.3, 0.9, vElev)));
        col += ivory * gridLine * 0.25;
        col += amber * contour * scanBand * 0.65;
        col += amber * scanBand * 0.075;

        gl_FragColor = vec4(col, mask * 0.96);
      }
    `,
  });

  const manifold = new THREE.Mesh(fieldGeo, fieldMat);
  manifold.position.y = -0.65;
  scene.add(manifold);

  // ---- 2. Precision Orbital Meridian Rings (Machined Tungsten Wireframes)
  const ringsGroup = new THREE.Group();
  const ringMatOuter = new THREE.LineBasicMaterial({ color: 0x8e867a, transparent: true, opacity: 0.24 });
  const ringMatInner = new THREE.LineBasicMaterial({ color: 0xf39200, transparent: true, opacity: 0.34 });

  const makeRing = (radius: number, segs: number, mat: THREE.LineBasicMaterial) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
  };

  const r1 = makeRing(5.1, 128, ringMatOuter);
  r1.position.y = -0.58;
  ringsGroup.add(r1);

  const r2 = makeRing(3.35, 96, ringMatOuter);
  r2.position.y = -0.52;
  ringsGroup.add(r2);

  const r3 = makeRing(4.2, 96, ringMatInner);
  r3.rotation.x = 0.22;
  r3.rotation.z = -0.14;
  r3.position.y = 0.35;
  ringsGroup.add(r3);
  scene.add(ringsGroup);

  // ---- 3. Branching Futures Trajectory Bundle (Hairline Ivory + One Calibrated Amber Intervention Path)
  const trajGroup = new THREE.Group();
  scene.add(trajGroup);

  const STEPS = 64;
  const BRANCHES = 18;
  const branchLines: Array<{
    line: THREE.Line;
    curve: THREE.CatmullRomCurve3;
    amber: boolean;
    failAt: number;
  }> = [];

  // Deterministic pseudo-random helper
  let seed = 42;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  for (let b = 0; b < BRANCHES; b++) {
    const isAmber = b === 0;
    const spread = isAmber ? 0 : ((b / (BRANCHES - 1)) - 0.5) * 2;
    const pts: THREE.Vector3[] = [];
    const failAt = isAmber ? 1.0 : 0.48 + rnd() * 0.44;
    const zDrift = isAmber ? 0.12 : spread * 3.1 + (rnd() - 0.5) * 0.5;
    const yPeak = isAmber ? 1.55 : 0.55 + rnd() * 0.95;

    for (let i = 0; i <= 10; i++) {
      const u = i / 10;
      const x = -4.2 + u * 8.4;
      // Shared trunk until T0 (u ~ 0.26), then bifurcates forward
      const fork = Math.max(0, (u - 0.24) / 0.76);
      const forkEase = fork * fork * (3 - 2 * fork);
      const z = isAmber
        ? Math.sin(u * Math.PI * 1.4) * 0.35
        : zDrift * forkEase + Math.sin(u * 5.0 + b) * 0.14 * fork;
      // Baseline failure paths drop sharply near failAt; amber intervention lifts and holds
      let y = -0.15 + Math.sin(u * Math.PI) * yPeak * (0.4 + 0.6 * forkEase);
      if (!isAmber && u > failAt) {
        y -= (u - failAt) * 2.6;
      }
      if (isAmber) {
        y = 0.05 + Math.sin(u * Math.PI * 0.85) * 1.45 + 0.18 * forkEase;
      }
      pts.push(new THREE.Vector3(x, y, z));
    }

    const curve = new THREE.CatmullRomCurve3(pts);
    const sampled = curve.getPoints(STEPS);
    const geo = new THREE.BufferGeometry().setFromPoints(sampled);

    const mat = isAmber
      ? new THREE.LineBasicMaterial({ color: 0xf39200, transparent: true, opacity: 0.98 })
      : new THREE.LineBasicMaterial({
          color: 0xe9e2d6,
          transparent: true,
          opacity: 0.16 + (1 - Math.abs(spread)) * 0.16,
        });

    const line = new THREE.Line(geo, mat);
    trajGroup.add(line);
    branchLines.push({ line, curve, amber: isAmber, failAt });

    // Subtle glowing amber ribbon companion for visual thickness on WebGL lines
    if (isAmber) {
      const tubeGeo = new THREE.TubeGeometry(curve, 72, 0.042, 10, false);
      const tubeMat = new THREE.MeshBasicMaterial({ color: 0xf5a020, transparent: true, opacity: 0.95 });
      trajGroup.add(new THREE.Mesh(tubeGeo, tubeMat));

      const haloGeo = new THREE.TubeGeometry(curve, 72, 0.11, 10, false);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xf39200,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      });
      trajGroup.add(new THREE.Mesh(haloGeo, haloMat));
    }
  }

  // ---- 4. Present Node (T0) & Traveling Foresight Signal Pulses
  const presentPos = branchLines[0]!.curve.getPoint(0.24);
  const t0Core = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0xf5f0e6 }),
  );
  t0Core.position.copy(presentPos);
  trajGroup.add(t0Core);

  const t0Ring = makeRing(0.32, 48, new THREE.LineBasicMaterial({ color: 0xf39200, transparent: true, opacity: 0.7 }));
  t0Ring.position.copy(presentPos);
  trajGroup.add(t0Ring);

  // Moving optical pulse nodes along the amber intervention curve
  const pulses = Array.from({ length: 4 }, (_, idx) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffd28a, transparent: true, opacity: 0.95 }),
    );
    m.userData = { phase: idx / 4 };
    trajGroup.add(m);
    return m;
  });

  // Subtle breaking-point micro-nodes on 5 failed trajectories
  const failMat = new THREE.MeshBasicMaterial({ color: 0xc9522a, transparent: true, opacity: 0.65 });
  for (let i = 2; i < branchLines.length; i += 3) {
    const b = branchLines[i]!;
    const p = b.curve.getPoint(Math.min(0.95, b.failAt));
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 12), failMat);
    dot.position.copy(p);
    trajGroup.add(dot);
  }

  // ---- 5. Sapphire Optical Lens Post-Processing Quad
  const postScene = new THREE.Scene();
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      tScene: { value: rt.texture },
      uTime: { value: 0 },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tScene;
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float r = length(p);
        float aa = fwidth(r) * 1.4;
        float alpha = 1.0 - smoothstep(1.0 - aa, 1.0, r);
        if (alpha <= 0.001) discard;

        // Subtle optical barrel distortion + delicate chromatic dispersion at glass edge
        vec2 q = p * mix(0.91, 1.02, r * r);
        float ca = 0.0075 * pow(r, 4.0);
        vec3 sR = texture2D(tScene, q * (1.0 + ca) * 0.5 + 0.5).rgb;
        vec3 sG = texture2D(tScene, q * 0.5 + 0.5).rgb;
        vec3 sB = texture2D(tScene, q * (1.0 - ca) * 0.5 + 0.5).rgb;
        vec3 sceneCol = vec3(sR.r, sG.g, sB.b);

        // Deep smoked obsidian optical chamber backing
        vec3 chamber = mix(vec3(0.095, 0.084, 0.072), vec3(0.042, 0.037, 0.032), smoothstep(0.0, 1.0, r));
        vec3 col = chamber + sceneCol * (1.0 - 0.28 * smoothstep(0.72, 1.0, r));

        // Sapphire glass upper-left specular reflection arc
        float rimArc = smoothstep(0.014, 0.0, abs(r - 0.962))
          * smoothstep(0.25, 0.95, dot(normalize(p + 1e-5), normalize(vec2(-0.85, 0.9))));
        col += vec3(0.98, 0.94, 0.88) * 0.24 * rimArc;

        // Subtle warm-amber lower-right optical caustics rim
        float warmRim = smoothstep(0.018, 0.0, abs(r - 0.97))
          * smoothstep(0.3, 0.95, dot(normalize(p + 1e-5), normalize(vec2(0.85, -0.85))));
        col += vec3(0.953, 0.573, 0.0) * 0.28 * warmRim;

        // Precision crisp inner glass bevel ring
        col += vec3(0.95, 0.91, 0.84) * 0.14 * smoothstep(0.978, 0.996, r);

        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));

  // ---- Sizing, Animation, & Scrub Interaction
  let curSize = 0;
  const resize = () => {
    const px = Math.max(240, Math.round(canvas.clientWidth || box.clientWidth || 420));
    if (px === curSize) return;
    curSize = px;
    renderer.setSize(px, px, false);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rtSize = Math.min(1600, Math.max(512, Math.round(px * dpr)));
    rt.setSize(rtSize, rtSize);
  };

  const arcEl = host.querySelector<SVGCircleElement>('[data-arc]');
  const handEl = host.querySelector<SVGRectElement>('[data-hand]');
  const clockEl = host.querySelector<SVGTextElement>('[data-clock]');
  const C = 2 * Math.PI * 83.4;

  const reduced = prefersReducedMotion();
  let T = 3.2;
  let scrub = 0;
  let targetScrub = 0;
  let drag = false;
  let lastX = 0;
  let raf = 0;
  let lastNow = performance.now();
  let inView = true;

  canvas.addEventListener('pointerdown', (e) => {
    drag = true;
    lastX = e.clientX;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    targetScrub += (e.clientX - lastX) * 0.025;
    lastX = e.clientX;
  });
  const endDrag = () => {
    drag = false;
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  let lastLampPhase = -1;
  const renderFrame = (now: number) => {
    raf = 0;
    if (!inView || document.hidden) return;
    const dt = Math.min(0.05, (now - lastNow) / 1000);
    lastNow = now;
    if (!reduced) T += dt;
    scrub += (targetScrub - scrub) * 0.12;
    const t = T + scrub;

    resize();
    fieldMat.uniforms['uTime']!.value = t * 0.72;
    fieldMat.uniforms['uSweep']!.value = (t * 0.055) % 1;
    postMat.uniforms['uTime']!.value = t;

    // Gentle orbital camera breathing + scrub yaw
    const yaw = Math.sin(t * 0.14) * 0.28 + scrub * 0.35;
    const dist = 12.2;
    camera.position.set(Math.sin(yaw) * dist, 7.1 + Math.cos(t * 0.18) * 0.35, Math.cos(yaw) * dist);
    camera.lookAt(0, -0.15, 0);

    ringsGroup.rotation.y = t * 0.06;
    t0Ring.rotation.y = -t * 0.5;

    // Advance optical pulses along the calibrated amber foresight curve
    const amberCurve = branchLines[0]!.curve;
    pulses.forEach((m) => {
      const ph = (m.userData as { phase: number }).phase;
      const u = (t * 0.16 + ph) % 1;
      m.position.copy(amberCurve.getPoint(u));
      const fade = Math.sin(u * Math.PI);
      m.scale.setScalar(0.65 + fade * 0.55);
    });

    // Render scene to offscreen target, then through sapphire glass shader
    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCam);

    // Update calibrated vernier dial & clock
    const dayPhase = ((t * 0.032) % 1 + 1) % 1;
    arcEl?.setAttribute('stroke-dasharray', `${(dayPhase * C).toFixed(2)} ${C.toFixed(2)}`);
    handEl?.setAttribute('transform', `rotate(${(dayPhase * 360).toFixed(2)})`);
    if (clockEl) {
      const hrs = Math.floor(dayPhase * 96);
      clockEl.textContent = `T + ${String(hrs).padStart(2, '0')} H`;
    }

    // Gently cycle hero console lamps across 3 phases to keep machine alive
    const lampPhase = (Math.floor(dayPhase * 3) % 3) + 1;
    if (lampPhase !== lastLampPhase) {
      lastLampPhase = lampPhase;
      const lamps = host.closest('.fh')?.querySelector<HTMLElement>('[data-fh-lamps]');
      if (lamps) lamps.className = `fh__lamps hero__clusters b${lampPhase}`;
    }

    if (!reduced) raf = requestAnimationFrame(renderFrame);
  };

  const start = () => {
    if (raf) return;
    lastNow = performance.now();
    raf = requestAnimationFrame(renderFrame);
  };
  const stop = () => {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  new IntersectionObserver(
    (entries) => {
      inView = entries.some((e) => e.isIntersecting);
      if (inView) start();
      else stop();
    },
    { threshold: 0.05 },
  ).observe(host);

  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  host.classList.add('is-live');
  renderFrame(performance.now());
  if (!reduced) start();
}
