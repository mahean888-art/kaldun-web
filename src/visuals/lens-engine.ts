/**
 * One WebGL canvas for every lens on the page. The canvas moves to whichever
 * lens is live (the hero, or a World card under the pointer), so the page never
 * holds more than one GL context. The scene is rendered to a high-precision
 * target, then drawn through an optical sapphire glass lens shader.
 */
import * as THREE from 'three';
import { buildWorld, type WorldKey } from './lens-world';

export type Mode = WorldKey | 'all';
export type Engine = {
  canvas: HTMLCanvasElement;
  attach: (host: HTMLElement) => void;
  detach: () => void;
  host: () => HTMLElement | null;
  exportLens: (mode: Mode, t: number, px: number) => string;
  exportWide: (world: WorldKey, t: number, w: number, h: number, o?: { yaw?: number; dist?: number; h?: number; fov?: number }) => string;
};

const DWELL = 10;
const ss = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function createEngine(opts: { reduced: boolean; exporting?: boolean }): Engine {
  const canvas = document.createElement('canvas');
  canvas.className = 'lens__gl';
  canvas.setAttribute('aria-hidden', 'true');
  const small = Math.min(screen.width, screen.height) < 700;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: !!opts.exporting,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.14;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0, 0);

  const world = buildWorld(renderer, small ? 1024 : 2048);
  const camera = new THREE.PerspectiveCamera(26, 1, 0.5, 300);
  const RT = new THREE.WebGLRenderTarget(1024, 1024, { samples: 4, type: THREE.HalfFloatType });

  const lensScene = new THREE.Scene();
  const lensCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const lensMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { tScene: { value: RT.texture }, night: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform sampler2D tScene; uniform float night; varying vec2 vUv;
    void main(){
      vec2 p = vUv * 2.0 - 1.0;
      float r = length(p);
      float aa = fwidth(r) * 1.4;
      float alpha = 1.0 - smoothstep(1.0 - aa, 1.0, r);
      if (alpha <= 0.0) { gl_FragColor = vec4(0.0); return; }

      // Subtle precision optical barrel refraction
      vec2 q = p * mix(0.89, 1.0, r * r);
      float ca = 0.0045 * pow(r, 5.0);
      vec3 col = vec3(
        texture2D(tScene, q * (1.0 + ca) * 0.5 + 0.5).r,
        texture2D(tScene, q * 0.5 + 0.5).g,
        texture2D(tScene, q * (1.0 - ca) * 0.5 + 0.5).b
      );

      // Deep optical edge absorption & chamfer vignette
      col *= 1.0 - 0.34 * smoothstep(0.74, 1.0, r);

      // Machined sapphire bezel rim + subtle amber internal catchlight
      float rim = smoothstep(0.968, 0.996, r);
      vec2 np = normalize(p + 1e-5);
      float topSpec = smoothstep(0.15, 0.92, dot(np, normalize(vec2(-0.72, 0.78))));
      float botWarm = smoothstep(0.2, 0.95, dot(np, normalize(vec2(0.65, -0.76))));
      col += vec3(0.98, 0.94, 0.88) * (0.12 + 0.24 * topSpec) * rim;
      col += vec3(0.96, 0.58, 0.12) * (0.14 * botWarm) * rim;

      // Upper-left convex studio glass reflection crescent
      float arc = smoothstep(0.0075, 0.0, abs(r - 0.948)) * smoothstep(0.42, 0.96, dot(np, normalize(vec2(-0.75, 0.72))));
      col += vec3(1.0, 0.97, 0.92) * (0.2 + 0.08 * night) * arc;

      // Soft optical dome sheen
      vec2 hp = p - vec2(-0.42, 0.48);
      col += vec3(1.0, 0.96, 0.9) * 0.042 * exp(-dot(hp, hp) * 6.0);

      gl_FragColor = vec4(col, alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
  });
  lensScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), lensMat));

  const tgt = new THREE.Vector3();
  const cpos = new THREE.Vector3();
  const place = (mode: Mode, T: number): WorldKey => {
    let key: WorldKey;
    let from: { at: THREE.Vector3; dist: number; h: number; yaw: number };
    let to: { at: THREE.Vector3; dist: number; h: number; yaw: number };
    let k: number;
    if (mode === 'all') {
      const seq = [
        { k: 'money' as WorldKey, v: world.overview },
        { k: 'money' as WorldKey, v: world.views.money },
        { k: 'power' as WorldKey, v: world.views.power },
        { k: 'trade' as WorldKey, v: world.views.trade },
      ];
      const c = T / DWELL;
      const i = Math.floor(c) % seq.length;
      const prev = seq[(i + seq.length - 1) % seq.length]!;
      const cur = seq[i]!;
      key = cur.k;
      from = prev.v;
      to = cur.v;
      // On initial load (c < 1), hold the unified 3-world panorama directly without flying in
      k = c < 1 ? 1 : ss(0, 0.34, c - Math.floor(c));
    } else {
      key = mode;
      from = to = world.views[mode];
      k = 1;
    }
    const lerp = (a: number, b: number) => a + (b - a) * k;
    tgt.copy(from.at).lerp(to.at, k);
    const yaw = lerp(from.yaw, to.yaw) + Math.sin(T * 0.07) * 0.055;
    const dist = lerp(from.dist, to.dist);
    const h = lerp(from.h, to.h);
    cpos.set(tgt.x + Math.sin(yaw) * dist, h, tgt.z + Math.cos(yaw) * dist);
    camera.position.copy(cpos);
    camera.lookAt(tgt.x, 1.5, tgt.z);

    // Keep shadow frustum tightly centered on the viewed world (wider for overview)
    const span = dist > 50 ? 44 : 28;
    const sc = world.sun.shadow.camera;
    if (sc.right !== span) {
      sc.left = -span;
      sc.right = span;
      sc.top = span;
      sc.bottom = -span;
      sc.updateProjectionMatrix();
    }
    world.sun.target.position.copy(tgt);
    world.sun.position.x += tgt.x;
    world.sun.position.z += tgt.z;
    world.sun.target.updateMatrixWorld();
    return key;
  };

  let size = 0;
  const resize = (px: number) => {
    if (px === size) return;
    size = px;
    renderer.setSize(px, px, false);
    const r = Math.min(2048, Math.max(512, Math.round(px * renderer.getPixelRatio())));
    RT.setSize(r, r);
  };

  const drawLens = (mode: Mode, T: number, dt: number, dayLen: number) => {
    const { night, day } = world.step(T, dt, dayLen);
    const key = place(mode, T);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
    lensMat.uniforms['night']!.value = night;
    renderer.setRenderTarget(RT);
    renderer.render(world.scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(lensScene, lensCam);
    return { key, day };
  };

  // ---- host state
  let host: HTMLElement | null = null;
  let mode: Mode = 'all';
  const clocks = new WeakMap<HTMLElement, number>();
  let raf = 0;
  let last = 0;
  let scrub = 0;
  let shown = '';
  const dayLen = () => (mode === 'all' ? 30 : 36);

  const updateDial = (key: WorldKey, day: number, T: number) => {
    if (!host) return;
    const arc = host.querySelector<SVGCircleElement>('[data-arc]');
    const hand = host.querySelector<SVGRectElement>('[data-hand]');
    const clock = host.querySelector<SVGTextElement>('[data-clock]');
    const C = 2 * Math.PI * 84.5;
    arc?.setAttribute('stroke-dasharray', `${(day * C).toFixed(2)} ${C}`);
    hand?.setAttribute('transform', `rotate(${(day * 360).toFixed(2)})`);
    if (clock) clock.textContent = 'T + ' + String(Math.floor((T / dayLen()) * 24) % 1000).padStart(2, '0') + ' H';
    if (mode === 'all' && key !== shown) {
      shown = key;
      host.querySelectorAll<SVGTextElement>('[data-w]').forEach((t) => t.classList.toggle('on', t.dataset['w'] === key));
      host.dispatchEvent(new CustomEvent('lens:world', { detail: key, bubbles: true }));
    }
  };

  const tick = (now: number) => {
    raf = 0;
    if (!host) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const T = (clocks.get(host) ?? 2.5) + dt;
    clocks.set(host, T);
    const px = Math.round(canvas.clientWidth);
    if (px > 0) resize(px);
    const { key, day } = drawLens(mode, T + scrub, dt, dayLen());
    updateDial(key, day, T + scrub);
    if (!opts.reduced) raf = requestAnimationFrame(tick);
  };

  const attach = (h: HTMLElement) => {
    if (host === h) return;
    host?.classList.remove('is-live');
    host = h;
    mode = (h.dataset['lens'] as Mode) || 'all';
    shown = '';
    scrub = 0;
    h.querySelector('.lens__box')?.appendChild(canvas);
    if (!clocks.has(h)) clocks.set(h, Number(h.dataset['lensT'] ?? 2.5));
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame((n) => {
      tick(n);
      host?.classList.add('is-live');
    });
  };
  const detach = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    host?.classList.remove('is-live');
    host = null;
  };

  // Drag across the sapphire glass to scrub time forward/back
  let drag = false;
  let lx = 0;
  canvas.addEventListener('pointerdown', (e) => {
    drag = true;
    lx = e.clientX;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    scrub += (e.clientX - lx) * 0.05;
    lx = e.clientX;
    if (opts.reduced && host) {
      const T = clocks.get(host) ?? 2.5;
      const { key, day } = drawLens(mode, T + scrub, 0, dayLen());
      updateDial(key, day, T + scrub);
    }
  });
  addEventListener('pointerup', () => (drag = false));

  const exportLens = (m: Mode, t: number, px: number): string => {
    resize(px);
    mode = m;
    world.step(t - 0.02, 0, m === 'all' ? 30 : 36);
    drawLens(m, t, 0.02, m === 'all' ? 30 : 36);
    return canvas.toDataURL('image/png');
  };
  const exportWide = (
    w: WorldKey,
    t: number,
    W: number,
    H: number,
    o: { yaw?: number; dist?: number; h?: number; fov?: number } = {},
  ): string => {
    size = -1;
    renderer.setSize(W, H, false);
    world.step(t, 0.02, 36);
    place(w, t);
    const v = world.views[w];
    const yaw = v.yaw + (o.yaw ?? 0);
    const dist = o.dist ?? v.dist;
    const hh = o.h ?? v.h;
    camera.position.set(v.at.x + Math.sin(yaw) * dist, hh, v.at.z + Math.cos(yaw) * dist);
    camera.lookAt(v.at.x, 1.5, v.at.z);
    camera.fov = o.fov ?? 26;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setRenderTarget(null);
    renderer.render(world.scene, camera);
    camera.fov = 26;
    return canvas.toDataURL('image/png');
  };

  return { canvas, attach, detach, host: () => host, exportLens, exportWide };
}
