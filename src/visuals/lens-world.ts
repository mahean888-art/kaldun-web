/**
 * The world under the lens: one continuous white model of a financial
 * district, a power and compute campus and a port, with traffic, steam,
 * cranes and a ship under way. Time runs through day and night; amber is kept
 * for what moves. Ported from the deck's lens component so the site and the
 * deck show the same world.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type WorldKey = 'money' | 'power' | 'trade';
export type View = { at: THREE.Vector3; dist: number; h: number; yaw: number };

export const ORDER: WorldKey[] = ['money', 'power', 'trade'];

export type World = {
  scene: THREE.Scene;
  sun: THREE.DirectionalLight;
  views: Record<WorldKey, View>;
  /** Advance the model to time T (seconds of model time). Returns night 0..1 and day phase 0..1. */
  step: (T: number, dt: number, dayLen: number) => { night: number; day: number };
};

export function buildWorld(renderer: THREE.WebGLRenderer, shadowSize = 2048): World {
  const scene = new THREE.Scene();
  const C_DAY = new THREE.Color('#ECE6DB'), C_DUSK = new THREE.Color('#D4A475'), C_NIGHT = new THREE.Color('#0D0B09');
  scene.background = C_DAY.clone();
  scene.fog = new THREE.Fog(C_DAY.clone(), 60, 125);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  pm.dispose();

  const sun = new THREE.DirectionalLight(0xfff2df, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 34, bottom: -34, near: 1, far: 170 });
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.035;
  sun.shadow.radius = 3;
  const hemi = new THREE.HemisphereLight(0xfbf5ea, 0x9c8c74, 0.6);
  scene.add(sun, sun.target, hemi);

  // ---- materials
  let seed = 11;
  const rnd = (): number => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const facade = (cols: number, rows: number, lit: number) => {
    const W = cols * 8, H = rows * 8;
    const d = document.createElement('canvas'); d.width = W; d.height = H;
    const x = d.getContext('2d')!;
    x.fillStyle = '#f4efe7'; x.fillRect(0, 0, W, H);
    for (let j = 0; j < rows; j++) { x.fillStyle = '#ddd5c8'; x.fillRect(0, j * 8 + 2, W, 4); }
    x.fillStyle = '#efe9df'; for (let i = 0; i < cols; i++) x.fillRect(i * 8, 0, 1, H);
    const n = document.createElement('canvas'); n.width = W; n.height = H;
    const y = n.getContext('2d')!;
    y.fillStyle = '#000'; y.fillRect(0, 0, W, H);
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) if (rnd() < lit) {
      const v = 150 + rnd() * 105; y.fillStyle = `rgb(${v},${(v * 0.64) | 0},${(v * 0.28) | 0})`; y.fillRect(i * 8 + 1, j * 8 + 2, 7, 4);
    }
    const a = new THREE.CanvasTexture(d), b = new THREE.CanvasTexture(n);
    for (const t of [a, b]) { t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; }
    return { map: a, emissiveMap: b };
  };
  const emissiveMats: THREE.MeshStandardMaterial[] = [];
  const emissiveLamps: THREE.MeshStandardMaterial[] = [];
  const facadeMat = (cols: number, rows: number, lit: number): THREE.MeshStandardMaterial => {
    const f = facade(cols, rows, lit);
    const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, map: f.map, emissive: 0xffffff, emissiveMap: f.emissiveMap, emissiveIntensity: 0 });
    emissiveMats.push(m); return m;
  };
  const CLAY = new THREE.MeshStandardMaterial({ color: 0xf3eee6, roughness: 0.9 });
  const CLAY2 = new THREE.MeshStandardMaterial({ color: 0xe4ddd0, roughness: 0.94 });
  const GROUND = new THREE.MeshStandardMaterial({ color: 0xe9e2d6, roughness: 1 });
  const ROAD = new THREE.MeshStandardMaterial({ color: 0xd8d0c2, roughness: 1 });
  const LINE = new THREE.LineBasicMaterial({ color: 0xbfb5a6 });
  const AMBER = new THREE.MeshStandardMaterial({ color: 0xd98a3d, roughness: 0.7, emissive: 0xe2892b, emissiveIntensity: 0 });
  const CAR = new THREE.MeshStandardMaterial({ color: 0xf4f0e9, roughness: 0.6, emissive: 0xf3a24a, emissiveIntensity: 0 });

  const nC = document.createElement('canvas'); nC.width = nC.height = 256;
  {
    const x = nC.getContext('2d')!, img = x.createImageData(256, 256);
    for (let i = 0; i < 256; i++) for (let j = 0; j < 256; j++) {
      const v = Math.sin(i * 0.19 + Math.sin(j * 0.07) * 2) * 0.5 + Math.sin(j * 0.23 + i * 0.05) * 0.5;
      const w = Math.cos(i * 0.21 - j * 0.11) * 0.5 + Math.cos(j * 0.17) * 0.5; const p = (j * 256 + i) * 4;
      img.data[p] = 128 + v * 40; img.data[p + 1] = 128 + w * 40; img.data[p + 2] = 255; img.data[p + 3] = 255;
    }
    x.putImageData(img, 0, 0);
  }
  const waterN = new THREE.CanvasTexture(nC); waterN.wrapS = waterN.wrapT = THREE.RepeatWrapping; waterN.repeat.set(18, 36);
  const WATER = new THREE.MeshPhysicalMaterial({ color: 0xb7bfbd, roughness: 0.22, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.1, normalMap: waterN, normalScale: new THREE.Vector2(0.25, 0.25) });

  const add = <T extends THREE.Object3D>(o: T, cast = true, rec = true): T => { o.castShadow = cast; o.receiveShadow = rec; scene.add(o); return o; };
  const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y + h / 2, z); return add(o);
  };
  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(1, 1, 1), tmpP = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);

  // ---- the land
  const ground = add(new THREE.Mesh(new THREE.PlaneGeometry(260, 260), GROUND), false, true); ground.rotation.x = -Math.PI / 2;
  const sea = add(new THREE.Mesh(new THREE.PlaneGeometry(120, 260), WATER), false, true); sea.rotation.x = -Math.PI / 2; sea.position.set(-85, 0.03, 0);
  box(0.7, 0.55, 130, CLAY2, -24.6, -0.05, 0);
  const ROADS_X = [-12, -4, 4, 12];
  const ROADS_Z = [-6, 2, 10];
  for (const z of ROADS_X) { const r = add(new THREE.Mesh(new THREE.PlaneGeometry(52, 1.3), ROAD), false, true); r.rotation.x = -Math.PI / 2; r.position.set(2, 0.012, z); }
  for (const x of ROADS_Z) { const r = add(new THREE.Mesh(new THREE.PlaneGeometry(1.3, 30), ROAD), false, true); r.rotation.x = -Math.PI / 2; r.position.set(x, 0.013, 0); }

  // ---- 01 money: the financial district
  const CITY = new THREE.Vector3(2, 0, 0);
  const facades = [facadeMat(6, 40, 0.42), facadeMat(8, 40, 0.3), facadeMat(5, 40, 0.5)];
  const tower = (x: number, z: number, w: number, d: number, h: number) => {
    const src = facades[(rnd() * 3) | 0]!;
    const m = src.clone(); m.map = src.map!.clone(); m.emissiveMap = src.emissiveMap!.clone();
    for (const t of [m.map, m.emissiveMap]) { t.repeat.set(Math.max(1, w / 1.4), h / 12); t.needsUpdate = true; }
    emissiveMats.push(m);
    const tiers = h > 6 ? 3 : 1; let y = 0, ww = w, dd = d;
    for (let k = 0; k < tiers; k++) { const hh = tiers === 1 ? h : h * [0.62, 0.26, 0.12][k]!; box(ww, hh, dd, m, x, y, z); y += hh; ww *= 0.78; dd *= 0.78; }
    box(ww * 0.5, 0.35, dd * 0.4, CLAY2, x - ww * 0.1, y, z + dd * 0.1);
    if (h > 9) { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 1.6, 6), CLAY); a.position.set(x, y + 0.8, z); add(a); }
  };
  for (let i = -3; i <= 3; i++) for (let j = -2; j <= 2; j++) {
    const bx = CITY.x + i * 2.66 + (i >= 0 ? 0.9 : -0.9), bz = CITY.z + j * 3.9;
    if (Math.abs(bz - 8) < 1.5 && Math.abs(bx - 2) < 4) continue;
    const dist = Math.hypot(i * 0.9, j); const h = Math.max(1.4, (11 - dist * 2.6) * (0.7 + rnd() * 0.6));
    tower(bx + (rnd() - 0.5) * 0.3, bz + (rnd() - 0.5) * 0.3, 1.5 + rnd() * 0.6, 1.5 + rnd() * 0.6, h);
  }
  {
    const ex = new THREE.Vector3(2, 0, 7.6);
    box(6.2, 0.4, 3.2, CLAY2, ex.x, 0, ex.z); box(5.8, 0.55, 2.8, CLAY, ex.x, 2.45, ex.z);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 1.7, 5.8, 3), CLAY); ped.rotation.set(0, 0, Math.PI / 2); ped.scale.set(1, 1, 0.42); ped.position.set(ex.x, 3.45, ex.z + 1.2); add(ped);
    for (let k = 0; k < 10; k++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 2.05, 16), CLAY); c.position.set(ex.x - 2.6 + k * 0.58, 1.42, ex.z + 1.15); add(c); }
  }
  {
    const t = new THREE.InstancedMesh(new THREE.SphereGeometry(0.32, 10, 8), CLAY, 520); t.castShadow = t.receiveShadow = true; let n = 0;
    for (const z of ROADS_X) for (let x = -20; x < 26; x += 1.15) for (const s of [-0.95, 0.95]) if (n < 520 && rnd() > 0.25 && !(x > 14 && x < 25)) { tmpM.makeScale(1, 1.15, 1).setPosition(x + rnd() * 0.3, 0.42, z + s); t.setMatrixAt(n++, tmpM); }
    t.count = n; scene.add(t);
  }

  // ---- traffic
  type Lane = { ax: 'x' | 'z'; c: number; a: number; b: number; dir: number };
  const lanes: Lane[] = [];
  for (const z of ROADS_X) { lanes.push({ ax: 'x', c: z - 0.3, a: -22, b: 26, dir: 1 }); lanes.push({ ax: 'x', c: z + 0.3, a: -22, b: 26, dir: -1 }); }
  for (const x of ROADS_Z) { lanes.push({ ax: 'z', c: x - 0.3, a: -15, b: 15, dir: 1 }); lanes.push({ ax: 'z', c: x + 0.3, a: -15, b: 15, dir: -1 }); }
  const NCARS = 260;
  const cars = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 0.2, 0.2), CAR, NCARS); cars.castShadow = true; scene.add(cars);
  const carState = Array.from({ length: NCARS }, (_, i) => ({ lane: lanes[i % lanes.length]!, u: rnd(), v: 0.018 + rnd() * 0.02 }));
  const moveCars = (dt: number) => {
    carState.forEach((c, i) => {
      c.u = (c.u + c.v * dt * c.lane.dir + 1) % 1;
      const L = c.lane, s = L.a + (L.b - L.a) * c.u;
      if (L.ax === 'x') { tmpP.set(s, 0.14, L.c); tmpQ.setFromAxisAngle(Y, 0); } else { tmpP.set(L.c, 0.14, s); tmpQ.setFromAxisAngle(Y, Math.PI / 2); }
      tmpM.compose(tmpP, tmpQ, tmpS); cars.setMatrixAt(i, tmpM);
    });
    cars.instanceMatrix.needsUpdate = true;
  };

  // ---- 02 power and compute
  const POWER = new THREE.Vector3(20, 0, 2);
  const hallMat = facadeMat(30, 3, 0.7);
  for (let k = 0; k < 4; k++) {
    const z = POWER.z - 6.5 + k * 3.6; const m = hallMat.clone(); m.map = hallMat.map!.clone(); m.map.repeat.set(3, 0.5); emissiveMats.push(m);
    box(9.6, 1.5, 2.5, m, POWER.x, 0, z);
    const ch = new THREE.InstancedMesh(new THREE.BoxGeometry(0.62, 0.36, 0.62), CLAY2, 26); ch.castShadow = true; let n = 0;
    for (let c = 0; c < 13; c++) for (const s of [-0.5, 0.5]) { tmpM.makeTranslation(POWER.x - 4.3 + c * 0.72, 1.68, z + s * 0.9); ch.setMatrixAt(n++, tmpM); }
    scene.add(ch);
    for (let g = 0; g < 5; g++) box(0.7, 0.55, 0.9, CLAY, POWER.x - 4 + g * 1.9, 0, z + 1.75);
  }
  const towersAt: THREE.Vector3[] = [];
  {
    const prof: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) { const y = (i / 24) * 6.2; const r = 1.55 - 0.55 * Math.sin(Math.PI * Math.min(1, y / 5.2)) + (y > 5.2 ? (y - 5.2) * 0.18 : 0); prof.push(new THREE.Vector2(r, y)); }
    const ctm = CLAY.clone(); ctm.side = THREE.DoubleSide;
    for (const dx of [0, 3.6]) { const ct = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), ctm); ct.position.set(POWER.x + 1 + dx, 0, POWER.z + 10.5); add(ct); towersAt.push(new THREE.Vector3(POWER.x + 1 + dx, 6.3, POWER.z + 10.5)); }
    box(3.4, 2.4, 2.6, CLAY2, POWER.x - 3.6, 0, POWER.z + 10.4);
    for (const dx of [-4.6, -3.7]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 6.8, 20), CLAY); st.position.set(POWER.x + dx, 3.4, POWER.z + 9.3); add(st); towersAt.push(new THREE.Vector3(POWER.x + dx, 6.9, POWER.z + 9.3)); }
  }
  const steamTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d')!;
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
  })();
  const puffs: THREE.Sprite[] = [];
  towersAt.forEach((p, ti) => {
    const n = ti < 2 ? 16 : 7;
    for (let i = 0; i < n; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, color: 0xffffff, transparent: true, depthWrite: false, opacity: 0 }));
      s.userData = { o: p, ph: i / n, big: ti < 2 }; scene.add(s); puffs.push(s);
    }
  });
  const moveSteam = (T: number, night: number) => {
    puffs.forEach((s) => {
      const d = s.userData as { o: THREE.Vector3; ph: number; big: boolean };
      const u = (T * (d.big ? 0.07 : 0.1) + d.ph) % 1; const big = d.big ? 1 : 0.45;
      s.position.set(d.o.x + u * 1.4 * big, d.o.y + u * 5.5 * big, d.o.z + u * 0.8 * big);
      const sc = (1.0 + u * 2.8) * big; s.scale.set(sc, sc, 1);
      s.material.opacity = Math.sin(u * Math.PI) * (d.big ? 0.26 : 0.18) * (1 - night * 0.6);
      s.material.color.setScalar(1 - night * 0.7);
    });
  };
  {
    const sx = POWER.x - 7.5, sz = POWER.z - 10;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) box(0.7, 0.9, 0.7, CLAY2, sx + i * 1.4, 0, sz + j * 1.6);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 5; i++) pts.push(new THREE.Vector3(sx - 0.8 + i * 0.95, 1.6, sz - 0.6), new THREE.Vector3(sx - 0.8 + i * 0.95, 1.6, sz + 2.2));
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), LINE));
  }
  const pyl: THREE.Vector3[][] = [];
  const lattice = (x: number, z: number, rot: number): THREE.Vector3[] => {
    const g = new THREE.Group(); const H = 5.2, B = 0.55, T = 0.16; const v: number[] = [];
    const corners = (y: number, s: number) => [[-s, y, -s], [s, y, -s], [s, y, s], [-s, y, s]];
    const lv = [0, 1.4, 2.8, 4.0, H].map((y) => corners(y, B + (T - B) * (y / H)));
    for (let k = 0; k < lv.length - 1; k++) for (let c = 0; c < 4; c++) {
      const a = lv[k]![c]!, b = lv[k + 1]![c]!, a2 = lv[k]![(c + 1) % 4]!, b2 = lv[k + 1]![(c + 1) % 4]!;
      v.push(...a, ...b, ...a, ...b2, ...a2, ...b, ...a2, ...a);
    }
    for (const [y, w] of [[4.0, 1.25], [4.9, 0.95], [3.2, 1.1]] as const) v.push(-w, y, 0, w, y, 0, -w, y, 0, -0.2, y + 0.3, 0, w, y, 0, 0.2, y + 0.3, 0);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    g.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x9c907e })));
    g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
    return [-1.25, -0.95, 1.25, 0.95].map((w, i) => new THREE.Vector3(x + w * Math.cos(rot), [4.0, 4.9, 4.0, 4.9][i]! - 0.05, z - w * Math.sin(rot)));
  };
  for (let i = 0; i < 6; i++) pyl.push(lattice(POWER.x - 7 - i * 3.2, POWER.z - 12.5 + i * 0.25, 0.08));
  const wireMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { time: { value: 0 }, glow: { value: 0 } },
    vertexShader: 'attribute float u; varying float vU; void main(){ vU = u; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform float time, glow; varying float vU; void main(){ float f = fract(vU * 2.0 - time * 0.35); float p = smoothstep(0.0,0.05,f) * smoothstep(0.22,0.05,f); vec3 c = vec3(0.94,0.6,0.23); float a = (0.25 + p * 1.6) * glow; gl_FragColor = vec4(c * a, a); }',
  });
  const wireBase = new THREE.LineBasicMaterial({ color: 0xa89c8a, transparent: true, opacity: 0.8 });
  for (let w = 0; w < 4; w++) {
    const pts: THREE.Vector3[] = [], us: number[] = [];
    for (let i = 0; i < pyl.length - 1; i++) {
      const a = pyl[i]![w]!, b = pyl[i + 1]![w]!;
      for (let k = 0; k <= 16; k++) { const t = k / 16; const p = a.clone().lerp(b, t); p.y -= Math.sin(Math.PI * t) * 0.55; pts.push(p); us.push((i + t) / (pyl.length - 1)); }
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts); g.setAttribute('u', new THREE.Float32BufferAttribute(us, 1));
    scene.add(new THREE.Line(g, wireBase)); scene.add(new THREE.Line(g, wireMat));
  }

  // ---- 03 trade: the port
  const PORT = new THREE.Vector3(-16, 0, 2);
  const cgeo = new THREE.BoxGeometry(1.22, 0.5, 0.49);
  const contMats = [0xf3eee6, 0xe6dfd3, 0xede7dd, 0xdcd4c6].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 }));
  const stacks = contMats.map((m) => { const im = new THREE.InstancedMesh(cgeo, m, 260); im.count = 0; im.castShadow = im.receiveShadow = true; scene.add(im); return im; });
  const amberStack = new THREE.InstancedMesh(cgeo, AMBER, 40); amberStack.count = 0; amberStack.castShadow = true; scene.add(amberStack);
  for (let bx = 0; bx < 5; bx++) for (let i = 0; i < 7; i++) for (let j = 0; j < 4; j++) {
    const h = 1 + ((rnd() * 4) | 0);
    for (let k = 0; k < h; k++) {
      tmpM.makeTranslation(PORT.x - 4 + bx * 1.52, 0.25 + k * 0.5, PORT.z - 9 + i * 2.35 + j * 0.51);
      const tgt = rnd() > 0.95 && amberStack.count < 40 ? amberStack : stacks[(rnd() * 4) | 0]!;
      if (tgt.count < (tgt === amberStack ? 40 : 260)) tgt.setMatrixAt(tgt.count++, tmpM);
    }
  }
  const trolleys: { m: THREE.Mesh; ph: number }[] = [];
  const stsCrane = (z: number) => {
    const g = new THREE.Group(), qx = -24.6;
    const leg = (x: number, zz: number) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.18, 4.4, 0.18), CLAY); l.position.set(x, 2.2, zz); g.add(l); };
    for (const x of [qx + 0.8, qx + 2.6]) for (const dz of [-0.75, 0.75]) leg(x, z + dz);
    const portal = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 1.7), CLAY); portal.position.set(qx + 1.7, 4.45, z); g.add(portal);
    const boom = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.24, 0.5), CLAY); boom.position.set(qx - 1.4, 5.0, z); g.add(boom);
    const apex = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.1, 0.16), CLAY); apex.position.set(qx + 1.9, 6.05, z); g.add(apex);
    const ties = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(qx + 1.9, 7.1, z), new THREE.Vector3(qx - 6.0, 5.1, z), new THREE.Vector3(qx + 1.9, 7.1, z), new THREE.Vector3(qx + 3.2, 5.1, z)]);
    g.add(new THREE.LineSegments(ties, new THREE.LineBasicMaterial({ color: 0xb2a796 })));
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.38, 0.5), CLAY2); cab.position.set(qx - 2, 4.7, z); g.add(cab); trolleys.push({ m: cab, ph: rnd() * 6 });
    g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } }); scene.add(g);
  };
  [-7, -2.6, 1.8, 6.2].forEach(stsCrane);
  const makeShip = (len: number, tiers: number): THREE.Group => {
    const s = new THREE.Group(); const sh = new THREE.Shape();
    sh.moveTo(-len / 2, -0.85); sh.lineTo(len / 2 - 1.2, -0.85); sh.quadraticCurveTo(len / 2 + 0.6, 0, len / 2 - 1.2, 0.85); sh.lineTo(-len / 2, 0.85); sh.closePath();
    const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.9, bevelEnabled: false }), CLAY2); hull.rotation.x = -Math.PI / 2; hull.position.y = -0.2; s.add(hull);
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, 0.3, 0.26), CLAY, 220); let n = 0;
    for (let i = 0; i < Math.floor((len - 3) / 0.64); i++) for (let j = 0; j < 5; j++) for (let k = 0; k < tiers; k++) if (rnd() > 0.15 && n < 220) { tmpM.makeTranslation(-len / 2 + 2.2 + i * 0.64, 0.85 + k * 0.3, -0.56 + j * 0.28); im.setMatrixAt(n++, tmpM); }
    im.count = n; s.add(im);
    const br = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 1.5), facades[0]); br.position.set(-len / 2 + 1.1, 1.5, 0); s.add(br);
    s.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } }); scene.add(s); return s;
  };
  const LAMP = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffd49a, emissiveIntensity: 0 });
  {
    const lamps = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.12, 0.22), LAMP, 80); let n = 0; const poles: THREE.Vector3[] = [];
    const put = (x: number, z: number, h: number) => { tmpM.makeTranslation(x, h, z); lamps.setMatrixAt(n++, tmpM); poles.push(new THREE.Vector3(x, 0, z), new THREE.Vector3(x, h, z)); };
    for (let z = -13; z <= 13; z += 2.6) put(-23.9, z, 2.6);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) put(PORT.x - 4.8 + i * 2.6, PORT.z - 9.6 + j * 5.2, 3.2);
    lamps.count = n; scene.add(lamps); scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(poles), LINE));
    emissiveLamps.push(LAMP);
  }
  const berthed = makeShip(15, 4); berthed.rotation.y = Math.PI / 2; berthed.position.set(-26.5, 0, -0.4);
  const sailing = makeShip(11, 2);
  const route = new THREE.CatmullRomCurve3(([[-28, 0.06, 11], [-34, 0.06, 14], [-46, 0.06, 12], [-62, 0.06, 2], [-90, 0.06, -18]] as const).map((p) => new THREE.Vector3(...p)));
  const routeMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { time: { value: 0 }, glow: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform float time, glow; varying vec2 vUv; void main(){ float d = step(0.5, fract(vUv.x * 60.0)); float a = d * glow * 0.75 * smoothstep(0.0, 0.05, vUv.x); gl_FragColor = vec4(vec3(0.94,0.6,0.23) * a, a); }',
  });
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(route, 300, 0.05, 4, false), routeMat));

  const views: Record<WorldKey, View> = {
    money: { at: CITY.clone().add(new THREE.Vector3(0, 0, 1)), dist: 38, h: 30, yaw: 0.62 },
    power: { at: POWER.clone().add(new THREE.Vector3(-1, 0, 1.5)), dist: 38, h: 30, yaw: 0.55 },
    trade: { at: PORT.clone().add(new THREE.Vector3(-5.5, 0, 0)), dist: 38, h: 29, yaw: 0.92 },
  };

  const ss = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const bg = new THREE.Color();
  moveCars(0);

  const step = (T: number, dt: number, dayLen: number) => {
    const day = (T / dayLen + 0.34) % 1, elev = Math.sin((day - 0.25) * Math.PI * 2), az = day * Math.PI * 2;
    sun.position.set(Math.cos(az) * 70, Math.max(5, elev * 60 + 8), Math.sin(az) * 30 + 35);
    const night = ss(0.06, -0.22, elev), dusk = (1 - night) * ss(0.5, 0.04, elev);
    sun.intensity = 3.4 * ss(-0.1, 0.22, elev); sun.color.setRGB(1, 0.93 - dusk * 0.2, 0.84 - dusk * 0.36);
    hemi.intensity = 0.07 + 0.55 * (1 - night); scene.environmentIntensity = 0.03 + 0.3 * (1 - night);
    bg.copy(C_DAY).lerp(C_DUSK, dusk * 0.8).lerp(C_NIGHT, night);
    (scene.background as THREE.Color).copy(bg); (scene.fog as THREE.Fog).color.copy(bg);
    emissiveMats.forEach((m) => (m.emissiveIntensity = 0.02 + 1.7 * night + 0.35 * dusk));
    AMBER.emissiveIntensity = 0.1 + 0.7 * night; CAR.emissiveIntensity = 2.2 * night + 0.5 * dusk;
    emissiveLamps.forEach((m) => (m.emissiveIntensity = 3.2 * night + 0.6 * dusk));
    wireMat.uniforms['time']!.value = T; wireMat.uniforms['glow']!.value = 0.15 + 0.9 * dusk + 1.4 * night;
    routeMat.uniforms['glow']!.value = 0.25 + 0.6 * dusk + 1.0 * night;
    waterN.offset.set(T * 0.004, T * 0.007);
    moveCars(dt); moveSteam(T, night);
    trolleys.forEach((c) => { const u = 0.5 + 0.5 * Math.sin(T * 0.45 + c.ph); c.m.position.x = -24.6 - 0.4 - u * 4.6; });
    const su = (T * 0.011) % 1, sp = route.getPointAt(su), sp2 = route.getPointAt(Math.min(1, su + 0.003));
    sailing.position.set(sp.x, 0, sp.z); sailing.rotation.y = Math.atan2(-(sp2.z - sp.z), sp2.x - sp.x);
    return { night, day };
  };

  return { scene, sun, views, step };
}
