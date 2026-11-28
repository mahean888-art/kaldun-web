/**
 * The living 3-world architectural maquette under the sapphire lens:
 *   01 Digital money — financial district, classical exchange, stepped towers, liquidity arcs
 *   02 Power & compute — hyperscale data halls, hyperbolic cooling towers, HV substation & grid pulses
 *   03 Global trade — deep-water quay, articulated STS gantry cranes, container yards & vessels
 *
 * Calibrated as a twilight-to-obsidian architectural studio model where matte stone, brushed
 * titanium and dark glass catch crisp studio light, and luminous Foresight amber (#F39200) is
 * reserved strictly for what moves, flows and settles.
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
  overview: View;
  /** Advance the model to time T (seconds of model time). Returns night 0..1 and day phase 0..1. */
  step: (T: number, dt: number, dayLen: number) => { night: number; day: number };
};

export function buildWorld(renderer: THREE.WebGLRenderer, shadowSize = 2048): World {
  const scene = new THREE.Scene();

  // Warm museum studio daylight -> golden dusk -> deep architectural night
  const C_DAY = new THREE.Color('#EFEAE1');
  const C_DUSK = new THREE.Color('#D5A87A');
  const C_NIGHT = new THREE.Color('#14110E');
  scene.background = C_DAY.clone();
  scene.fog = new THREE.Fog(C_DAY.clone(), 64, 140);

  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;
  pm.dispose();

  // Crisp studio daylight sun + cool sky bounce + soft warm rim
  const sun = new THREE.DirectionalLight(0xfff4e4, 2.85);
  sun.castShadow = true;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(sun.shadow.camera, { left: -28, right: 28, top: 28, bottom: -28, near: 4, far: 145 });
  sun.shadow.bias = -0.00025;
  sun.shadow.normalBias = 0.028;
  sun.shadow.radius = 2.4;

  const rim = new THREE.DirectionalLight(0xd9e4f0, 0.55);
  rim.position.set(-48, 34, -42);

  const hemi = new THREE.HemisphereLight(0xfdf8f0, 0xb0a390, 0.72);
  scene.add(sun, sun.target, rim, hemi);

  // Deterministic PRNG so the world is identical across static posters and live WebGL
  let seed = 17;
  const rnd = (): number => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // ---- High-resolution procedural architectural alabaster/limestone facade PBR textures
  const emissiveMats: THREE.MeshStandardMaterial[] = [];
  const emissiveLamps: THREE.MeshStandardMaterial[] = [];

  const facade = (cols: number, rows: number, lit: number, darkTone = false) => {
    const cw = 20;
    const ch = 16;
    const W = cols * cw;
    const H = rows * ch;

    const cMap = document.createElement('canvas');
    cMap.width = W;
    cMap.height = H;
    const x = cMap.getContext('2d')!;

    const cRough = document.createElement('canvas');
    cRough.width = W;
    cRough.height = H;
    const r = cRough.getContext('2d')!;

    const cEm = document.createElement('canvas');
    cEm.width = W;
    cEm.height = H;
    const e = cEm.getContext('2d')!;

    // Architectural alabaster & warm travertine stone cladding
    x.fillStyle = darkTone ? '#dfd7ca' : '#f4efe7';
    x.fillRect(0, 0, W, H);
    r.fillStyle = '#dcdcdc';
    r.fillRect(0, 0, W, H);
    e.fillStyle = '#000000';
    e.fillRect(0, 0, W, H);

    for (let j = 0; j < rows; j++) {
      const y0 = j * ch;
      const isMech = j > 2 && j % 11 === 0;
      if (isMech) {
        x.fillStyle = darkTone ? '#c4baa9' : '#dbd2c4';
        x.fillRect(0, y0 + 2, W, ch - 4);
        for (let l = 0; l < W; l += 4) {
          x.fillStyle = 'rgba(20,18,16,0.12)';
          x.fillRect(l, y0 + 3, 2, ch - 6);
        }
        continue;
      }

      // Recessed architectural glazing ribbon (cool mineral slate glass)
      x.fillStyle = darkTone ? '#8f8a82' : '#aba49a';
      x.fillRect(0, y0 + 3, W, ch - 6);

      // Subtle architectural lintel shadow
      x.fillStyle = 'rgba(20,18,16,0.16)';
      x.fillRect(0, y0 + 3, W, 2);

      // Reflective glass roughness
      r.fillStyle = '#404040';
      r.fillRect(0, y0 + 3, W, ch - 6);

      for (let i = 0; i < cols; i++) {
        const x0 = i * cw;
        x.fillStyle = darkTone ? '#e4ddd1' : '#f6f2eb';
        x.fillRect(x0, y0, 3, ch);
        r.fillStyle = '#d4d4d4';
        r.fillRect(x0, y0, 3, ch);

        if (rnd() < lit) {
          const warm = rnd();
          const v = 175 + rnd() * 80;
          const R = Math.min(255, Math.round(v));
          const G = Math.round(v * (warm > 0.35 ? 0.65 : 0.78));
          const B = Math.round(v * (warm > 0.35 ? 0.22 : 0.48));
          e.fillStyle = `rgb(${R},${G},${B})`;
          e.fillRect(x0 + 4, y0 + 4, cw - 6, ch - 8);
        }
      }
    }

    const map = new THREE.CanvasTexture(cMap);
    const roughnessMap = new THREE.CanvasTexture(cRough);
    const emissiveMap = new THREE.CanvasTexture(cEm);
    map.colorSpace = THREE.SRGBColorSpace;
    emissiveMap.colorSpace = THREE.SRGBColorSpace;
    for (const t of [map, roughnessMap, emissiveMap]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 8;
    }
    return { map, roughnessMap, emissiveMap };
  };

  const facadeMat = (cols: number, rows: number, lit: number, darkTone = false): THREE.MeshStandardMaterial => {
    const f = facade(cols, rows, lit, darkTone);
    const m = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.84,
      metalness: darkTone ? 0.12 : 0.06,
      map: f.map,
      roughnessMap: f.roughnessMap,
      emissive: 0xffffff,
      emissiveMap: f.emissiveMap,
      emissiveIntensity: 0,
    });
    emissiveMats.push(m);
    return m;
  };

  // Warm museum alabaster drafting base with subtle engraved engineering grid
  const groundTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const x = c.getContext('2d')!;
    x.fillStyle = '#eae3d6';
    x.fillRect(0, 0, 512, 512);
    x.strokeStyle = 'rgba(20, 18, 16, 0.05)';
    x.lineWidth = 1;
    for (let i = 0; i <= 512; i += 32) {
      x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 512); x.stroke();
      x.beginPath(); x.moveTo(0, i); x.lineTo(512, i); x.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(22, 22);
    t.anisotropy = 8;
    return t;
  })();

  // Museum architectural alabaster, travertine & brushed satin material library
  const STONE_HI = new THREE.MeshStandardMaterial({ color: 0xf6f1e8, roughness: 0.84, metalness: 0.02 });
  const STONE_MID = new THREE.MeshStandardMaterial({ color: 0xe6dfd3, roughness: 0.88, metalness: 0.03 });
  const STONE_DARK = new THREE.MeshStandardMaterial({ color: 0xcbc2b4, roughness: 0.86, metalness: 0.05 });
  const TITANIUM = new THREE.MeshStandardMaterial({ color: 0xc2b9aa, roughness: 0.44, metalness: 0.25 });
  const DARK_STEEL = new THREE.MeshStandardMaterial({ color: 0x999084, roughness: 0.56, metalness: 0.22 });
  const GROUND = new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.96, metalness: 0.01 });
  const ROAD = new THREE.MeshStandardMaterial({ color: 0xd9d1c4, roughness: 0.94 });
  const SIDEWALK = new THREE.MeshStandardMaterial({ color: 0xe7e0d4, roughness: 0.9 });
  const LINE = new THREE.LineBasicMaterial({ color: 0xafa494, transparent: true, opacity: 0.72 });
  const AMBER = new THREE.MeshStandardMaterial({
    color: 0xe5871c,
    roughness: 0.48,
    metalness: 0.08,
    emissive: 0xf39200,
    emissiveIntensity: 0.14,
  });
  const AMBER_CROWN = new THREE.MeshStandardMaterial({
    color: 0xe89024,
    roughness: 0.4,
    emissive: 0xf39200,
    emissiveIntensity: 0.28,
  });
  const CAR = new THREE.MeshStandardMaterial({
    color: 0xe5871c,
    roughness: 0.45,
    emissive: 0xf39200,
    emissiveIntensity: 0.25,
  });
  const FOLIAGE = new THREE.MeshStandardMaterial({ color: 0xc8c1b4, roughness: 0.92 });

  // Silky architectural celadon-slate harbor water
  const nC = document.createElement('canvas');
  nC.width = nC.height = 256;
  {
    const x = nC.getContext('2d')!;
    const img = x.createImageData(256, 256);
    for (let i = 0; i < 256; i++) {
      for (let j = 0; j < 256; j++) {
        const v = Math.sin(i * 0.15 + Math.sin(j * 0.07) * 1.4) * 0.5 + Math.sin(j * 0.19 + i * 0.05) * 0.5;
        const w = Math.cos(i * 0.17 - j * 0.1) * 0.5 + Math.cos(j * 0.14) * 0.5;
        const p = (j * 256 + i) * 4;
        img.data[p] = 128 + v * 22;
        img.data[p + 1] = 128 + w * 22;
        img.data[p + 2] = 255;
        img.data[p + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
  }
  const waterN = new THREE.CanvasTexture(nC);
  waterN.wrapS = waterN.wrapT = THREE.RepeatWrapping;
  waterN.repeat.set(12, 22);
  const WATER = new THREE.MeshPhysicalMaterial({
    color: 0xb1bcbc,
    roughness: 0.28,
    metalness: 0.05,
    clearcoat: 0.75,
    clearcoatRoughness: 0.26,
    normalMap: waterN,
    normalScale: new THREE.Vector2(0.08, 0.08),
  });

  const add = <T extends THREE.Object3D>(o: T, cast = true, rec = true): T => {
    o.castShadow = cast;
    o.receiveShadow = rec;
    scene.add(o);
    return o;
  };
  const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    o.position.set(x, y + h / 2, z);
    return add(o);
  };
  const tmpM = new THREE.Matrix4();
  const tmpQ = new THREE.Quaternion();
  const tmpS = new THREE.Vector3(1, 1, 1);
  const tmpP = new THREE.Vector3();
  const Y = new THREE.Vector3(0, 1, 0);

  // ---- Continuous architectural terrain, harbor & street network
  const ground = add(new THREE.Mesh(new THREE.PlaneGeometry(260, 260), GROUND), false, true);
  ground.rotation.x = -Math.PI / 2;

  const sea = add(new THREE.Mesh(new THREE.PlaneGeometry(130, 260), WATER), false, true);
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(-89.8, 0.04, 0);

  // Quay wall, coping edge & fender blocks
  box(1.1, 0.68, 136, STONE_DARK, -24.5, -0.04, 0);
  box(0.26, 0.74, 136, STONE_MID, -25.02, -0.02, 0);

  const ROADS_X = [-12, -4, 4, 12];
  const ROADS_Z = [-6, 2, 10];
  for (const z of ROADS_X) {
    const sw = add(new THREE.Mesh(new THREE.PlaneGeometry(54, 2.0), SIDEWALK), false, true);
    sw.rotation.x = -Math.PI / 2;
    sw.position.set(2, 0.01, z);
    const r = add(new THREE.Mesh(new THREE.PlaneGeometry(54, 1.32), ROAD), false, true);
    r.rotation.x = -Math.PI / 2;
    r.position.set(2, 0.018, z);
  }
  for (const x of ROADS_Z) {
    const sw = add(new THREE.Mesh(new THREE.PlaneGeometry(2.0, 32), SIDEWALK), false, true);
    sw.rotation.x = -Math.PI / 2;
    sw.position.set(x, 0.011, 0);
    const r = add(new THREE.Mesh(new THREE.PlaneGeometry(1.32, 32), ROAD), false, true);
    r.rotation.x = -Math.PI / 2;
    r.position.set(x, 0.019, 0);
  }

  // ---- 01 DIGITAL MONEY: Financial District
  const CITY = new THREE.Vector3(2, 0, 0);
  const facades = [
    facadeMat(6, 32, 0.44, false),
    facadeMat(8, 32, 0.36, true),
    facadeMat(5, 32, 0.52, false),
    facadeMat(7, 32, 0.4, true),
  ];

  const keyTowers: THREE.Vector3[] = [];
  const tower = (x: number, z: number, w: number, d: number, h: number) => {
    const src = facades[(rnd() * facades.length) | 0]!;
    const m = src.clone();
    m.map = src.map!.clone();
    m.roughnessMap = src.roughnessMap!.clone();
    m.emissiveMap = src.emissiveMap!.clone();
    for (const t of [m.map, m.roughnessMap, m.emissiveMap]) {
      t.repeat.set(Math.max(1, w / 1.45), Math.max(0.5, h / 9.5));
      t.needsUpdate = true;
    }
    emissiveMats.push(m);

    // Architectural podium base
    const podH = Math.min(0.65, h * 0.14);
    box(w * 1.07, podH, d * 1.07, STONE_DARK, x, 0, z);

    const tiers = h > 6.5 ? 3 : h > 3.8 ? 2 : 1;
    let y = podH;
    let ww = w;
    let dd = d;
    const remH = h - podH;
    const splits = tiers === 3 ? [0.58, 0.27, 0.15] : tiers === 2 ? [0.7, 0.3] : [1];
    for (let k = 0; k < tiers; k++) {
      const hh = remH * splits[k]!;
      box(ww, hh, dd, m, x, y, z);
      // Crisp stone parapet trim at each setback
      box(ww + 0.06, 0.08, dd + 0.06, STONE_MID, x, y + hh - 0.04, z);
      y += hh;
      ww *= 0.78;
      dd *= 0.78;
    }

    // Illuminated amber crown accent on landmark towers
    if (h > 7.6) {
      box(ww * 0.92, 0.09, dd * 0.92, AMBER_CROWN, x, y + 0.04, z);
      box(ww * 0.56, 0.36, dd * 0.46, TITANIUM, x, y + 0.13, z);
      keyTowers.push(new THREE.Vector3(x, y + 0.55, z));
    } else {
      box(ww * 0.54, 0.28, dd * 0.44, STONE_DARK, x - ww * 0.08, y, z + dd * 0.06);
    }

    if (h > 8.6) {
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.048, 2.0, 8), TITANIUM);
      spire.position.set(x, y + 1.35, z);
      add(spire);
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), AMBER_CROWN);
      beacon.position.set(x, y + 2.38, z);
      add(beacon, false, false);
    }
  };

  for (let i = -3; i <= 3; i++) {
    for (let j = -2; j <= 2; j++) {
      const bx = CITY.x + i * 2.66 + (i >= 0 ? 0.9 : -0.9);
      const bz = CITY.z + j * 3.9;
      if (Math.abs(bz - 8) < 1.8 && Math.abs(bx - 2) < 4.4) continue;
      const dist = Math.hypot(i * 0.88, j);
      const h = Math.max(1.6, (11.6 - dist * 2.55) * (0.72 + rnd() * 0.54));
      tower(bx + (rnd() - 0.5) * 0.24, bz + (rnd() - 0.5) * 0.24, 1.52 + rnd() * 0.56, 1.52 + rnd() * 0.56, h);
    }
  }

  // Perfected Classical Exchange Building (proper extruded triangular pediment + glowing portico)
  const EX = new THREE.Vector3(2, 0, 7.6);
  {
    // Three-stepped monumental stone plinth
    box(6.8, 0.16, 3.8, STONE_DARK, EX.x, 0, EX.z);
    box(6.4, 0.16, 3.45, STONE_MID, EX.x, 0.16, EX.z);
    box(6.0, 0.18, 3.1, STONE_HI, EX.x, 0.32, EX.z);

    // Main cella body + recessed warm glowing portico facade
    box(5.4, 2.15, 2.1, STONE_MID, EX.x, 0.5, EX.z - 0.25);
    const porticoGlow = new THREE.MeshStandardMaterial({
      color: 0xffe2b0,
      emissive: 0xf39200,
      emissiveIntensity: 1.05,
      roughness: 0.4,
    });
    emissiveLamps.push(porticoGlow);
    box(4.6, 1.55, 0.12, porticoGlow, EX.x, 0.72, EX.z + 0.82);

    // 10 fluted classical columns along front colonnade
    for (let k = 0; k < 10; k++) {
      const cx = EX.x - 2.48 + k * 0.55;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.12, 2.1, 14), STONE_HI);
      col.position.set(cx, 1.55, EX.z + 1.18);
      add(col);
      // Column capital
      box(0.28, 0.08, 0.28, STONE_HI, cx, 2.58, EX.z + 1.18);
    }

    // Crisp entablature & cornice
    box(6.0, 0.36, 3.05, STONE_HI, EX.x, 2.66, EX.z + 0.05);
    box(6.2, 0.1, 3.2, STONE_MID, EX.x, 3.02, EX.z + 0.05);

    // Properly extruded triangular classical pediment (clean architectural geometry!)
    const pedShape = new THREE.Shape();
    pedShape.moveTo(-2.95, 0);
    pedShape.lineTo(2.95, 0);
    pedShape.lineTo(0, 1.05);
    pedShape.closePath();
    const pedGeo = new THREE.ExtrudeGeometry(pedShape, { depth: 2.85, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 });
    const ped = new THREE.Mesh(pedGeo, STONE_HI);
    ped.position.set(EX.x, 3.12, EX.z - 1.38);
    add(ped);

    // Subtle recessed tympanum amber emblem bar
    box(1.5, 0.09, 0.08, AMBER_CROWN, EX.x, 3.38, EX.z + 1.5);
  }

  // Refined architectural boulevard streetlamps + low architectural courtyard hedges (NO lollipop sphere trees!)
  const STREET_LAMP = new THREE.MeshStandardMaterial({
    color: 0xffe4b8,
    emissive: 0xf39200,
    emissiveIntensity: 2.2,
  });
  emissiveLamps.push(STREET_LAMP);
  {
    const lampHeads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.11, 0.06, 0.11), STREET_LAMP, 180);
    const hedges = new THREE.InstancedMesh(new THREE.BoxGeometry(0.75, 0.18, 0.28), FOLIAGE, 180);
    hedges.castShadow = hedges.receiveShadow = true;
    const polePts: THREE.Vector3[] = [];
    let nl = 0;
    let nh = 0;
    for (const z of ROADS_X) {
      for (let x = -18; x <= 24; x += 3.2) {
        if (x > 13.5 && x < 24.5) continue;
        for (const s of [-0.88, 0.88]) {
          if (nl < 180) {
            tmpM.makeTranslation(x, 0.72, z + s);
            lampHeads.setMatrixAt(nl++, tmpM);
            polePts.push(new THREE.Vector3(x, 0, z + s), new THREE.Vector3(x, 0.72, z + s));
          }
          if (nh < 180 && rnd() > 0.35) {
            tmpM.makeTranslation(x + 1.5, 0.1, z + s * 1.06);
            hedges.setMatrixAt(nh++, tmpM);
          }
        }
      }
    }
    lampHeads.count = nl;
    hedges.count = nh;
    scene.add(lampHeads, hedges, new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(polePts), LINE));
  }

  // Subtle luminous liquidity/telemetry arcs linking the Exchange to landmark towers
  const flowMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { time: { value: 0 }, glow: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float time, glow; varying vec2 vUv;
      void main(){
        float p1 = smoothstep(0.0, 0.08, fract(vUv.x - time * 0.22)) * smoothstep(0.28, 0.08, fract(vUv.x - time * 0.22));
        float base = 0.14;
        float a = (base + p1 * 0.95) * glow * smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
        gl_FragColor = vec4(vec3(0.96, 0.62, 0.18) * a, a);
      }`,
  });
  const exTop = new THREE.Vector3(EX.x, 4.15, EX.z);
  keyTowers.slice(0, 5).forEach((tp, idx) => {
    const mid = exTop.clone().lerp(tp, 0.5);
    mid.y += 2.2 + (idx % 3) * 0.9;
    const curve = new THREE.QuadraticBezierCurve3(exTop, mid, tp);
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.026, 5, false), flowMat));
  });

  // ---- Traffic streams across the avenues
  type Lane = { ax: 'x' | 'z'; c: number; a: number; b: number; dir: number };
  const lanes: Lane[] = [];
  for (const z of ROADS_X) {
    lanes.push({ ax: 'x', c: z - 0.3, a: -22, b: 26, dir: 1 });
    lanes.push({ ax: 'x', c: z + 0.3, a: -22, b: 26, dir: -1 });
  }
  for (const x of ROADS_Z) {
    lanes.push({ ax: 'z', c: x - 0.3, a: -15, b: 15, dir: 1 });
    lanes.push({ ax: 'z', c: x + 0.3, a: -15, b: 15, dir: -1 });
  }
  const NCARS = 220;
  const cars = new THREE.InstancedMesh(new THREE.BoxGeometry(0.36, 0.11, 0.14), CAR, NCARS);
  cars.castShadow = false;
  scene.add(cars);
  const carState = Array.from({ length: NCARS }, (_, i) => ({
    lane: lanes[i % lanes.length]!,
    u: rnd(),
    v: 0.017 + rnd() * 0.022,
  }));
  const moveCars = (dt: number) => {
    carState.forEach((c, i) => {
      c.u = (c.u + c.v * dt * c.lane.dir + 1) % 1;
      const L = c.lane;
      const s = L.a + (L.b - L.a) * c.u;
      if (L.ax === 'x') {
        tmpP.set(s, 0.12, L.c);
        tmpQ.setFromAxisAngle(Y, 0);
      } else {
        tmpP.set(L.c, 0.12, s);
        tmpQ.setFromAxisAngle(Y, Math.PI / 2);
      }
      tmpM.compose(tmpP, tmpQ, tmpS);
      cars.setMatrixAt(i, tmpM);
    });
    cars.instanceMatrix.needsUpdate = true;
  };

  // ---- 02 POWER, COMPUTE & MEGAINFRASTRUCTURE
  const POWER = new THREE.Vector3(20, 0, 2);
  const hallMat = facadeMat(28, 3, 0.65, true);
  for (let k = 0; k < 4; k++) {
    const z = POWER.z - 6.5 + k * 3.6;
    const m = hallMat.clone();
    m.map = hallMat.map!.clone();
    m.roughnessMap = hallMat.roughnessMap!.clone();
    m.emissiveMap = hallMat.emissiveMap!.clone();
    for (const t of [m.map, m.roughnessMap, m.emissiveMap]) {
      t.repeat.set(2.5, 0.55);
      t.needsUpdate = true;
    }
    emissiveMats.push(m);

    // Main hyperscale compute hall + crisp roof trim + amber clerestory telemetry line
    box(9.8, 1.65, 2.55, m, POWER.x, 0, z);
    box(10.0, 0.1, 2.7, TITANIUM, POWER.x, 1.65, z);
    box(9.84, 0.06, 2.58, AMBER_CROWN, POWER.x, 1.38, z);

    // Precision rooftop liquid-chiller array
    const ch = new THREE.InstancedMesh(new THREE.BoxGeometry(0.56, 0.34, 0.56), TITANIUM, 26);
    ch.castShadow = true;
    ch.receiveShadow = true;
    let n = 0;
    for (let c = 0; c < 13; c++) {
      for (const s of [-0.52, 0.52]) {
        tmpM.makeTranslation(POWER.x - 4.3 + c * 0.72, 1.92, z + s * 0.9);
        ch.setMatrixAt(n++, tmpM);
      }
    }
    scene.add(ch);

    // Backup generator / cooling manifold modules
    for (let g = 0; g < 5; g++) {
      box(0.72, 0.58, 0.86, STONE_DARK, POWER.x - 4.0 + g * 1.9, 0, z + 1.78);
      box(0.52, 0.08, 0.62, TITANIUM, POWER.x - 4.0 + g * 1.9, 0.58, z + 1.78);
    }
  }

  // Hyperbolic cooling towers with base struts, stiffening rings & twin turbine stacks
  const towersAt: THREE.Vector3[] = [];
  {
    const prof: THREE.Vector2[] = [];
    for (let i = 0; i <= 28; i++) {
      const y = 0.45 + (i / 28) * 5.95;
      const t = (y - 0.45) / 5.95;
      const r = 1.62 - 0.58 * Math.sin(Math.PI * Math.min(1, t * 1.15)) + (t > 0.82 ? (t - 0.82) * 0.65 : 0);
      prof.push(new THREE.Vector2(r, y));
    }
    const ctMat = STONE_HI.clone();
    ctMat.side = THREE.DoubleSide;
    const throatMat = new THREE.MeshStandardMaterial({ color: 0x8f877c, roughness: 0.96 });
    const topR = prof[prof.length - 1]!.x;
    for (const dx of [0, 3.85]) {
      const cx = POWER.x + 1.0 + dx;
      const cz = POWER.z + 10.6;
      const ct = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), ctMat);
      ct.position.set(cx, 0, cz);
      add(ct);
      // Dark cooling basin + hollowed dark interior throat + exact rim stiffening ring
      const basin = new THREE.Mesh(new THREE.CylinderGeometry(1.72, 1.76, 0.35, 48), DARK_STEEL);
      basin.position.set(cx, 0.17, cz);
      add(basin);
      const throat = new THREE.Mesh(new THREE.CylinderGeometry(topR * 0.92, topR * 0.62, 1.4, 48), throatMat);
      throat.position.set(cx, 5.58, cz);
      add(throat, false, true);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(topR, 0.055, 10, 64), TITANIUM);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(cx, 6.4, cz);
      add(ring);
      towersAt.push(new THREE.Vector3(cx, 6.5, cz));
    }

    // Turbine hall + twin exhaust stacks with aviation beacons
    box(3.8, 2.5, 2.8, STONE_DARK, POWER.x - 3.6, 0, POWER.z + 10.4);
    box(3.9, 0.1, 2.9, TITANIUM, POWER.x - 3.6, 2.5, POWER.z + 10.4);
    for (const dx of [-4.6, -3.65]) {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.28, 7.0, 20), STONE_MID);
      st.position.set(POWER.x + dx, 3.5, POWER.z + 9.2);
      add(st);
      const topBeacon = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.14, 16), AMBER_CROWN);
      topBeacon.position.set(POWER.x + dx, 6.85, POWER.z + 9.2);
      add(topBeacon, false, false);
      towersAt.push(new THREE.Vector3(POWER.x + dx, 7.1, POWER.z + 9.2));
    }
  }

  // Refined translucent twilight steam plumes
  const steamTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 96;
    const x = c.getContext('2d')!;
    const g = x.createRadialGradient(48, 48, 4, 48, 48, 48);
    g.addColorStop(0, 'rgba(240,228,212,0.85)');
    g.addColorStop(0.45, 'rgba(220,204,186,0.35)');
    g.addColorStop(1, 'rgba(210,192,174,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 96, 96);
    return new THREE.CanvasTexture(c);
  })();
  const puffs: THREE.Sprite[] = [];
  towersAt.forEach((p, ti) => {
    const n = ti < 2 ? 14 : 6;
    for (let i = 0; i < n; i++) {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: steamTex, color: 0xded4c6, transparent: true, depthWrite: false, opacity: 0 }),
      );
      s.userData = { o: p, ph: i / n, big: ti < 2 };
      scene.add(s);
      puffs.push(s);
    }
  });
  const moveSteam = (T: number, night: number) => {
    puffs.forEach((s) => {
      const d = s.userData as { o: THREE.Vector3; ph: number; big: boolean };
      const u = (T * (d.big ? 0.065 : 0.095) + d.ph) % 1;
      const big = d.big ? 1 : 0.42;
      s.position.set(d.o.x + u * 1.6 * big, d.o.y + u * 5.2 * big, d.o.z + u * 0.9 * big);
      const sc = (1.1 + u * 2.9) * big;
      s.scale.set(sc, sc, 1);
      s.material.opacity = Math.sin(u * Math.PI) * (d.big ? 0.2 : 0.14) * (1 - night * 0.35);
    });
  };

  // High-voltage substation + transformer bays + lattice transmission line with amber energy pulses
  {
    const sx = POWER.x - 7.5;
    const sz = POWER.z - 10;
    box(4.6, 0.14, 3.6, STONE_DARK, sx + 1.4, 0, sz + 0.8);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        box(0.76, 0.95, 0.72, TITANIUM, sx + i * 1.4, 0.14, sz + j * 1.6);
        const bush = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.45, 8), STONE_HI);
        bush.position.set(sx + i * 1.4, 1.32, sz + j * 1.6);
        add(bush);
      }
    }
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 5; i++) {
      pts.push(new THREE.Vector3(sx - 0.8 + i * 0.95, 1.75, sz - 0.6), new THREE.Vector3(sx - 0.8 + i * 0.95, 1.75, sz + 2.2));
    }
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), LINE));
  }

  const pyl: THREE.Vector3[][] = [];
  const lattice = (x: number, z: number, rot: number): THREE.Vector3[] => {
    const g = new THREE.Group();
    const H = 5.4;
    const B = 0.58;
    const T = 0.16;
    const v: number[] = [];
    const corners = (y: number, s: number) => [
      [-s, y, -s],
      [s, y, -s],
      [s, y, s],
      [-s, y, s],
    ];
    const lv = [0, 1.45, 2.9, 4.15, H].map((y) => corners(y, B + (T - B) * (y / H)));
    for (let k = 0; k < lv.length - 1; k++) {
      for (let c = 0; c < 4; c++) {
        const a = lv[k]![c]!;
        const b = lv[k + 1]![c]!;
        const a2 = lv[k]![(c + 1) % 4]!;
        const b2 = lv[k + 1]![(c + 1) % 4]!;
        v.push(...a, ...b, ...a, ...b2, ...a2, ...b, ...a2, ...a);
      }
    }
    for (const [y, w] of [
      [4.15, 1.32],
      [5.05, 0.98],
      [3.25, 1.15],
    ] as const) {
      v.push(-w, y, 0, w, y, 0, -w, y, 0, -0.2, y + 0.32, 0, w, y, 0, 0.2, y + 0.32, 0);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    g.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xb2a695, transparent: true, opacity: 0.78 })));
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    scene.add(g);
    return [-1.32, -0.98, 1.32, 0.98].map(
      (w, i) => new THREE.Vector3(x + w * Math.cos(rot), [4.15, 5.05, 4.15, 5.05][i]! - 0.05, z - w * Math.sin(rot)),
    );
  };
  for (let i = 0; i < 6; i++) pyl.push(lattice(POWER.x - 7 - i * 3.2, POWER.z - 12.5 + i * 0.25, 0.08));

  const wireMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { time: { value: 0 }, glow: { value: 1.2 } },
    vertexShader: 'attribute float u; varying float vU; void main(){ vU = u; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader:
      'uniform float time, glow; varying float vU; void main(){ float f = fract(vU * 2.2 - time * 0.38); float p = smoothstep(0.0, 0.05, f) * smoothstep(0.24, 0.05, f); vec3 c = vec3(0.98, 0.62, 0.16); float a = (0.3 + p * 1.7) * glow; gl_FragColor = vec4(c * a, a); }',
  });
  const wireBase = new THREE.LineBasicMaterial({ color: 0x7c7266, transparent: true, opacity: 0.65 });
  for (let w = 0; w < 4; w++) {
    const pts: THREE.Vector3[] = [];
    const us: number[] = [];
    for (let i = 0; i < pyl.length - 1; i++) {
      const a = pyl[i]![w]!;
      const b = pyl[i + 1]![w]!;
      for (let k = 0; k <= 16; k++) {
        const t = k / 16;
        const p = a.clone().lerp(b, t);
        p.y -= Math.sin(Math.PI * t) * 0.56;
        pts.push(p);
        us.push((i + t) / (pyl.length - 1));
      }
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    g.setAttribute('u', new THREE.Float32BufferAttribute(us, 1));
    scene.add(new THREE.Line(g, wireBase));
    scene.add(new THREE.Line(g, wireMat));
  }

  // ---- 03 GLOBAL TRADE: Deep-Water Port & Chokepoint Corridor
  const PORT = new THREE.Vector3(-16, 0, 2);
  const cgeo = new THREE.BoxGeometry(1.22, 0.5, 0.49);
  const contMats = [0xf5f0e7, 0xe7e0d4, 0xd9d0c2, 0xc7bdb0].map(
    (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.78, metalness: 0.05 }),
  );
  const stacks = contMats.map((m) => {
    const im = new THREE.InstancedMesh(cgeo, m, 260);
    im.count = 0;
    im.castShadow = im.receiveShadow = true;
    scene.add(im);
    return im;
  });
  const amberStack = new THREE.InstancedMesh(cgeo, AMBER, 44);
  amberStack.count = 0;
  amberStack.castShadow = true;
  scene.add(amberStack);

  for (let bx = 0; bx < 5; bx++) {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 4; j++) {
        const h = 1 + ((rnd() * 4) | 0);
        for (let k = 0; k < h; k++) {
          tmpM.makeTranslation(PORT.x - 4 + bx * 1.52, 0.25 + k * 0.5, PORT.z - 9 + i * 2.35 + j * 0.51);
          const tgt = rnd() > 0.92 && amberStack.count < 44 ? amberStack : stacks[(rnd() * stacks.length) | 0]!;
          if (tgt.count < (tgt === amberStack ? 44 : 260)) tgt.setMatrixAt(tgt.count++, tmpM);
        }
      }
    }
  }

  // Articulated Ship-to-Shore (STS) gantry cranes with machinery house, stays & moving spreader
  const trolleys: { m: THREE.Mesh; ph: number }[] = [];
  const stsCrane = (z: number) => {
    const g = new THREE.Group();
    const qx = -24.6;
    const leg = (x: number, zz: number) => {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.18, 4.5, 0.18), STONE_HI);
      l.position.set(x, 2.25, zz);
      g.add(l);
    };
    for (const x of [qx + 0.8, qx + 2.6]) {
      for (const dz of [-0.75, 0.75]) leg(x, z + dz);
    }
    for (const x of [qx + 0.8, qx + 2.6]) {
      const tie = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 1.56), TITANIUM);
      tie.position.set(x, 2.55, z);
      g.add(tie);
    }
    for (const dz of [-0.75, 0.75]) {
      const tieX = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.14, 0.14), TITANIUM);
      tieX.position.set(qx + 1.7, 2.55, z + dz);
      g.add(tieX);
    }

    const portal = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.34, 1.75), STONE_HI);
    portal.position.set(qx + 1.7, 4.52, z);
    g.add(portal);

    const machHouse = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.58, 1.1), TITANIUM);
    machHouse.position.set(qx + 1.9, 5.45, z);
    g.add(machHouse);

    const boom = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.24, 0.52), STONE_HI);
    boom.position.set(qx - 1.4, 5.05, z);
    g.add(boom);

    const apex = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.2, 0.16), STONE_HI);
    apex.position.set(qx + 1.9, 6.2, z);
    g.add(apex);

    const apexLight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), AMBER_CROWN);
    apexLight.position.set(qx + 1.9, 7.35, z);
    g.add(apexLight);

    const ties = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(qx + 1.9, 7.3, z),
      new THREE.Vector3(qx - 6.1, 5.15, z),
      new THREE.Vector3(qx + 1.9, 7.3, z),
      new THREE.Vector3(qx + 3.4, 5.15, z),
    ]);
    g.add(new THREE.LineSegments(ties, new THREE.LineBasicMaterial({ color: 0xb2a796 })));

    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.38, 0.52), AMBER);
    cab.position.set(qx - 2, 4.72, z);
    g.add(cab);
    trolleys.push({ m: cab, ph: rnd() * 6 });

    g.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    scene.add(g);
  };
  [-7, -2.6, 1.8, 6.2].forEach(stsCrane);

  // Detailed Container Vessels
  const makeShip = (len: number, tiers: number): THREE.Group => {
    const s = new THREE.Group();
    const sh = new THREE.Shape();
    sh.moveTo(-len / 2, -0.9);
    sh.lineTo(len / 2 - 1.4, -0.9);
    sh.quadraticCurveTo(len / 2 + 0.65, 0, len / 2 - 1.4, 0.9);
    sh.lineTo(-len / 2, 0.9);
    sh.closePath();

    const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.92, bevelEnabled: false }), DARK_STEEL);
    hull.rotation.x = -Math.PI / 2;
    hull.position.y = -0.18;
    s.add(hull);

    // Crisp light deck coaming
    const deck = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: false }), STONE_MID);
    deck.rotation.x = -Math.PI / 2;
    deck.position.y = 0.72;
    s.add(deck);

    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, 0.3, 0.26), STONE_HI, 220);
    const imAmber = new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, 0.3, 0.26), AMBER, 28);
    let n = 0;
    let na = 0;
    for (let i = 0; i < Math.floor((len - 3) / 0.64); i++) {
      for (let j = 0; j < 5; j++) {
        for (let k = 0; k < tiers; k++) {
          if (rnd() > 0.14) {
            tmpM.makeTranslation(-len / 2 + 2.2 + i * 0.64, 0.94 + k * 0.3, -0.56 + j * 0.28);
            if (rnd() > 0.9 && na < 28) imAmber.setMatrixAt(na++, tmpM);
            else if (n < 220) im.setMatrixAt(n++, tmpM);
          }
        }
      }
    }
    im.count = n;
    imAmber.count = na;
    s.add(im, imAmber);

    // Bridge superstructure + radar mast + glowing nav wing
    const br = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.75, 1.55), facades[0]);
    br.position.set(-len / 2 + 1.1, 1.62, 0);
    s.add(br);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 2.05), STONE_HI);
    wing.position.set(-len / 2 + 1.15, 2.38, 0);
    s.add(wing);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.9, 6), TITANIUM);
    mast.position.set(-len / 2 + 1.1, 2.9, 0);
    s.add(mast);

    s.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    scene.add(s);
    return s;
  };

  const LAMP = new THREE.MeshStandardMaterial({ color: 0xfff0d4, emissive: 0xffb85c, emissiveIntensity: 2.8 });
  {
    const lamps = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.12, 0.22), LAMP, 80);
    let n = 0;
    const poles: THREE.Vector3[] = [];
    const put = (x: number, z: number, h: number) => {
      tmpM.makeTranslation(x, h, z);
      lamps.setMatrixAt(n++, tmpM);
      poles.push(new THREE.Vector3(x, 0, z), new THREE.Vector3(x, h, z));
    };
    for (let z = -13; z <= 13; z += 2.6) put(-23.8, z, 2.8);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) put(PORT.x - 4.8 + i * 2.6, PORT.z - 9.6 + j * 5.2, 3.4);
    }
    lamps.count = n;
    scene.add(lamps);
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(poles), LINE));
    emissiveLamps.push(LAMP);
  }

  const berthed = makeShip(15, 4);
  berthed.rotation.y = Math.PI / 2;
  berthed.position.set(-26.6, 0, -0.4);
  const sailing = makeShip(11, 2);

  const route = new THREE.CatmullRomCurve3(
    (
      [
        [-28, 0.09, 11],
        [-34, 0.09, 14],
        [-46, 0.09, 12],
        [-62, 0.09, 2],
        [-90, 0.09, -18],
      ] as const
    ).map((p) => new THREE.Vector3(...p)),
  );
  const routeMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { time: { value: 0 }, glow: { value: 1.0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader:
      'uniform float time, glow; varying vec2 vUv; void main(){ float d = step(0.45, fract(vUv.x * 54.0 - time * 0.45)); float a = (0.14 + d * 0.78) * glow * smoothstep(0.0, 0.05, vUv.x); gl_FragColor = vec4(vec3(0.96, 0.62, 0.18) * a, a); }',
  });
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(route, 280, 0.055, 5, false), routeMat));

  const views: Record<WorldKey, View> = {
    money: { at: CITY.clone().add(new THREE.Vector3(0.4, 0.8, 0.8)), dist: 34, h: 26, yaw: 0.62 },
    power: { at: POWER.clone().add(new THREE.Vector3(-0.8, 0.8, 1.4)), dist: 35, h: 27, yaw: 0.56 },
    trade: { at: PORT.clone().add(new THREE.Vector3(-5.2, 0.6, 0.2)), dist: 36, h: 27, yaw: 0.92 },
  };
  const overview: View = { at: new THREE.Vector3(-0.5, 0.4, 2.2), dist: 64, h: 42, yaw: 0.18 };

  const ss = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const bg = new THREE.Color();
  moveCars(0);

  const step = (T: number, dt: number, dayLen: number) => {
    const day = (T / dayLen + 0.34) % 1;
    const elev = Math.sin((day - 0.25) * Math.PI * 2);
    const az = day * Math.PI * 2;
    sun.position.set(Math.cos(az) * 62, Math.max(10, elev * 52 + 16), Math.sin(az) * 28 + 34);

    // Crisp museum studio daylight -> golden dusk -> glowing architectural night
    const night = ss(0.06, -0.24, elev);
    const dusk = (1 - night) * ss(0.46, 0.04, elev);

    sun.intensity = 3.1 * ss(-0.1, 0.22, elev);
    sun.color.setRGB(1.0, 0.94 - dusk * 0.18, 0.86 - dusk * 0.34);
    rim.intensity = 0.52 * (1 - night * 0.45);
    hemi.intensity = 0.12 + 0.62 * (1 - night);
    scene.environmentIntensity = 0.06 + 0.32 * (1 - night);

    bg.copy(C_DAY).lerp(C_DUSK, dusk * 0.78).lerp(C_NIGHT, night);
    (scene.background as THREE.Color).copy(bg);
    (scene.fog as THREE.Fog).color.copy(bg);

    emissiveMats.forEach((m) => (m.emissiveIntensity = 0.02 + 1.65 * night + 0.38 * dusk));
    AMBER.emissiveIntensity = 0.14 + 0.85 * night + 0.2 * dusk;
    AMBER_CROWN.emissiveIntensity = 0.26 + 1.3 * night + 0.35 * dusk;
    CAR.emissiveIntensity = 0.28 + 1.9 * night + 0.45 * dusk;
    emissiveLamps.forEach((m) => (m.emissiveIntensity = 0.18 + 2.8 * night + 0.55 * dusk));

    wireMat.uniforms['time']!.value = T;
    wireMat.uniforms['glow']!.value = 0.32 + 0.8 * dusk + 1.35 * night;
    flowMat.uniforms['time']!.value = T;
    flowMat.uniforms['glow']!.value = 0.35 + 0.65 * dusk + 1.15 * night;
    routeMat.uniforms['time']!.value = T;
    routeMat.uniforms['glow']!.value = 0.45 + 0.6 * dusk + 1.0 * night;

    waterN.offset.set(T * 0.004, T * 0.007);
    moveCars(dt);
    moveSteam(T, night);
    trolleys.forEach((c) => {
      const u = 0.5 + 0.5 * Math.sin(T * 0.45 + c.ph);
      c.m.position.x = -24.6 - 0.4 - u * 4.6;
    });
    const su = (T * 0.011) % 1;
    const sp = route.getPointAt(su);
    const sp2 = route.getPointAt(Math.min(1, su + 0.003));
    sailing.position.set(sp.x, 0, sp.z);
    sailing.rotation.y = Math.atan2(-(sp2.z - sp.z), sp2.x - sp.x);

    return { night, day };
  };

  return { scene, sun, views, overview, step };
}
