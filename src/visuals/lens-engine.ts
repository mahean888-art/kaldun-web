/**
 * One WebGL canvas for every lens on the page. The canvas moves to whichever
 * lens is live (the hero, or a World card under the pointer), so the page never
 * holds more than one GL context. The scene is rendered to a target, then drawn
 * through a glass shader: slight barrel, edge darkening, a rim of light.
 */
import * as THREE from 'three';
import { buildWorld, ORDER, type WorldKey } from './lens-world';

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
const ss = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function createEngine(opts: { reduced: boolean; exporting?: boolean }): Engine {
  const canvas = document.createElement('canvas');
  canvas.className = 'lens__gl';
  canvas.setAttribute('aria-hidden', 'true');
  const small = Math.min(screen.width, screen.height) < 700;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: !!opts.exporting, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0, 0);

  const world = buildWorld(renderer, small ? 1024 : 2048);
  const camera = new THREE.PerspectiveCamera(27, 1, 0.5, 300);
  const RT = new THREE.WebGLRenderTarget(1024, 1024, { samples: 4, type: THREE.HalfFloatType });

  const lensScene = new THREE.Scene(), lensCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const lensMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { tScene: { value: RT.texture }, night: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform sampler2D tScene; uniform float night; varying vec2 vUv;
    void main(){
      vec2 p = vUv * 2.0 - 1.0; float r = length(p); float aa = fwidth(r) * 1.5;
      float alpha = 1.0 - smoothstep(1.0 - aa, 1.0, r);
      if (alpha <= 0.0) { gl_FragColor = vec4(0.0); return; }
      vec2 q = p * mix(0.86, 1.0, r * r);
      float ca = 0.006 * pow(r, 5.0);
      vec3 col = vec3(texture2D(tScene, q * (1.0 + ca) * 0.5 + 0.5).r, texture2D(tScene, q * 0.5 + 0.5).g, texture2D(tScene, q * (1.0 - ca) * 0.5 + 0.5).b);
      col *= 1.0 - 0.24 * smoothstep(0.78, 1.0, r);
      col += vec3(1.0, 0.97, 0.92) * (0.14 + 0.1 * night) * smoothstep(0.975, 0.998, r);
      vec2 hp = p - vec2(-0.45, 0.5); col += vec3(1.0, 0.98, 0.95) * (0.05 + 0.05 * night) * exp(-dot(hp, hp) * 5.0);
      float arc = smoothstep(0.009, 0.0, abs(r - 0.955)) * smoothstep(0.35, 0.95, dot(normalize(p + 1e-5), normalize(vec2(-1.0, 1.0))));
      col += vec3(1.0) * (0.12 + 0.12 * night) * arc;
      gl_FragColor = vec4(col, alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
  });
  lensScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), lensMat));

  const tgt = new THREE.Vector3(), cpos = new THREE.Vector3();
  const place = (mode: Mode, T: number): WorldKey => {
    let key: WorldKey, from, to, k: number;
    if (mode === 'all') {
      const c = T / DWELL, i = Math.floor(c) % 3;
      key = ORDER[i]!; from = world.views[ORDER[(i + 2) % 3]!]; to = world.views[key]; k = ss(0, 0.3, c - Math.floor(c));
    } else { key = mode; from = to = world.views[mode]; k = 1; }
    const lerp = (a: number, b: number) => a + (b - a) * k;
    tgt.copy(from.at).lerp(to.at, k);
    const yaw = lerp(from.yaw, to.yaw) + Math.sin(T * 0.07) * 0.06, dist = lerp(from.dist, to.dist), h = lerp(from.h, to.h);
    cpos.set(tgt.x + Math.sin(yaw) * dist, h, tgt.z + Math.cos(yaw) * dist);
    camera.position.copy(cpos); camera.lookAt(tgt.x, 1.4, tgt.z);
    world.sun.target.position.copy(tgt);
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
    camera.aspect = 1; camera.updateProjectionMatrix();
    lensMat.uniforms['night']!.value = night;
    renderer.setRenderTarget(RT); renderer.render(world.scene, camera);
    renderer.setRenderTarget(null); renderer.render(lensScene, lensCam);
    return { key, day };
  };

  // ---- host state
  let host: HTMLElement | null = null;
  let mode: Mode = 'all';
  const clocks = new WeakMap<HTMLElement, number>();
  let raf = 0, last = 0, scrub = 0;
  let shown = '';
  const dayLen = () => (mode === 'all' ? 30 : 36);

  const updateDial = (key: WorldKey, day: number, T: number) => {
    if (!host) return;
    const arc = host.querySelector<SVGCircleElement>('[data-arc]');
    const hand = host.querySelector<SVGRectElement>('[data-hand]');
    const clock = host.querySelector<SVGTextElement>('[data-clock]');
    const C = 2 * Math.PI * 83.6;
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
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const T = (clocks.get(host) ?? 2.5) + dt; clocks.set(host, T);
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
    shown = ''; scrub = 0;
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
    cancelAnimationFrame(raf); raf = 0;
    host?.classList.remove('is-live');
    host = null;
  };

  // drag across the lens to move time
  let drag = false, lx = 0;
  canvas.addEventListener('pointerdown', (e) => { drag = true; lx = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    scrub += (e.clientX - lx) * 0.05; lx = e.clientX;
    if (opts.reduced && host) { const T = clocks.get(host) ?? 2.5; const { key, day } = drawLens(mode, T + scrub, 0, dayLen()); updateDial(key, day, T + scrub); }
  });
  addEventListener('pointerup', () => (drag = false));

  const exportLens = (m: Mode, t: number, px: number): string => {
    resize(px); mode = m;
    world.step(t - 0.02, 0, m === 'all' ? 30 : 36);
    drawLens(m, t, 0.02, m === 'all' ? 30 : 36);
    return canvas.toDataURL('image/png');
  };
  const exportWide = (w: WorldKey, t: number, W: number, H: number, o: { yaw?: number; dist?: number; h?: number; fov?: number } = {}): string => {
    size = -1;
    renderer.setSize(W, H, false);
    world.step(t, 0.02, 36);
    place(w, t);
    const v = world.views[w];
    const yaw = v.yaw + (o.yaw ?? 0), dist = o.dist ?? v.dist, hh = o.h ?? v.h;
    camera.position.set(v.at.x + Math.sin(yaw) * dist, hh, v.at.z + Math.cos(yaw) * dist);
    camera.lookAt(v.at.x, 1.4, v.at.z);
    camera.fov = o.fov ?? 27; camera.aspect = W / H; camera.updateProjectionMatrix();
    renderer.setRenderTarget(null); renderer.render(world.scene, camera);
    camera.fov = 27;
    return canvas.toDataURL('image/png');
  };

  return { canvas, attach, detach, host: () => host, exportLens, exportWide };
}
