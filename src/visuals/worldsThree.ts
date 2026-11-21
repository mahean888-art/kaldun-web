/**
 * 05 · Worlds — Three.js Matte-Ceramic Architectural Scale Models
 *
 * Designed in the exact material language of the Hero architectural maquette:
 * matte porcelain & warm architectural plaster on a beveled daylight studio plate,
 * soft gallery skylight, real PCFSoftShadowMap contact shadows, frosted acrylic
 * planes, and warm amber (#f0900a) flows marking the engineered intervention.
 *
 *   - money : Financial district — clearing pavilion, settlement banks, 24/7 rails
 *   - power : Energy & compute campus — wind turbines, solar field, storage yard, data halls
 *   - trade : Maritime port — gantry cranes, container stacks, silos, vessel & shipping lane
 */
import * as THREE from 'three';
import { prefersReducedMotion } from '../lib/prefers';
import { createRenderer, createStudioEnv, damp } from './threeStudio';

type WorldKind = 'money' | 'power' | 'trade';

interface MaquetteMats {
  porcelain: THREE.MeshPhysicalMaterial;
  plaster: THREE.MeshPhysicalMaterial;
  stone: THREE.MeshStandardMaterial;
  slate: THREE.MeshStandardMaterial;
  amber: THREE.MeshPhysicalMaterial;
  amberLine: THREE.MeshBasicMaterial;
  mutedLine: THREE.MeshBasicMaterial;
  terracotta: THREE.MeshStandardMaterial;
  frosted: THREE.MeshPhysicalMaterial;
  frostedAmber: THREE.MeshPhysicalMaterial;
}

function createMaquetteMats(): MaquetteMats {
  return {
    porcelain: new THREE.MeshPhysicalMaterial({
      color: 0xf4f0e7,
      roughness: 0.62,
      metalness: 0.02,
      clearcoat: 0.08,
      clearcoatRoughness: 0.5,
    }),
    plaster: new THREE.MeshPhysicalMaterial({
      color: 0xe4ded2,
      roughness: 0.74,
      metalness: 0.02,
    }),
    stone: new THREE.MeshStandardMaterial({
      color: 0xd0c9bc,
      roughness: 0.78,
      metalness: 0.04,
    }),
    slate: new THREE.MeshStandardMaterial({
      color: 0x5c574f,
      roughness: 0.52,
      metalness: 0.35,
    }),
    amber: new THREE.MeshPhysicalMaterial({
      color: 0xf0900a,
      emissive: 0xd97400,
      emissiveIntensity: 0.24,
      roughness: 0.26,
      metalness: 0.05,
      clearcoat: 0.5,
    }),
    amberLine: new THREE.MeshBasicMaterial({ color: 0xf0900a }),
    mutedLine: new THREE.MeshBasicMaterial({ color: 0xb2aaa0 }),
    terracotta: new THREE.MeshStandardMaterial({
      color: 0xc44820,
      roughness: 0.45,
      metalness: 0.08,
    }),
    frosted: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    }),
    frostedAmber: new THREE.MeshPhysicalMaterial({
      color: 0xf7a836,
      emissive: 0xf0900a,
      emissiveIntensity: 0.16,
      roughness: 0.22,
      metalness: 0,
      transparent: true,
      opacity: 0.54,
      depthWrite: false,
    }),
  };
}

function setupStudioLight(scene: THREE.Scene): void {
  scene.add(new THREE.HemisphereLight(0xfffdf8, 0xb5ac9c, 0.58));

  const key = new THREE.DirectionalLight(0xfffaf0, 2.25);
  key.position.set(7.5, 9.2, 4.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 2;
  key.shadow.camera.far = 26;
  const b = 4.6;
  key.shadow.camera.left = -b;
  key.shadow.camera.right = b;
  key.shadow.camera.top = b;
  key.shadow.camera.bottom = -b;
  key.shadow.bias = -0.0006;
  key.shadow.radius = 3.5;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xe2dcd0, 0.42);
  fill.position.set(-7, 4, 5);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffb44d, 0.48);
  rim.position.set(-4, 5, -7);
  scene.add(rim);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 24),
    new THREE.ShadowMaterial({ opacity: 0.24, color: 0x221b12 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.22;
  floor.receiveShadow = true;
  scene.add(floor);
}

function addBasePlate(parent: THREE.Group, w: number, d: number, mats: MaquetteMats): THREE.Mesh {
  const plate = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), mats.plaster);
  plate.position.y = -0.1;
  plate.castShadow = true;
  plate.receiveShadow = true;
  parent.add(plate);

  // Subtle architectural plinth trim
  const trim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, 0.04, d + 0.08), mats.stone);
  trim.position.y = -0.19;
  trim.receiveShadow = true;
  parent.add(trim);
  return plate;
}

function addBox(
  parent: THREE.Group,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y + h * 0.5, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

interface PulseTrack {
  curve: THREE.Curve<THREE.Vector3>;
  beads: THREE.Mesh[];
  speed: number;
}

function addRoute(
  parent: THREE.Group,
  points: Array<[number, number, number]>,
  mats: MaquetteMats,
  isAmber: boolean,
  beadCount = 3,
  speed = 0.28,
): PulseTrack | null {
  const vecs = points.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const curve = new THREE.CatmullRomCurve3(vecs, false, 'catmullrom', 0.12);
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 48, isAmber ? 0.022 : 0.015, 8, false),
    isAmber ? mats.amberLine : mats.mutedLine,
  );
  parent.add(tube);
  if (!isAmber) return null;

  const beads: THREE.Mesh[] = [];
  const bGeo = new THREE.SphereGeometry(0.045, 12, 12);
  const bMat = new THREE.MeshBasicMaterial({ color: 0xffb84d });
  for (let i = 0; i < beadCount; i++) {
    const b = new THREE.Mesh(bGeo, bMat);
    parent.add(b);
    beads.push(b);
  }
  return { curve, beads, speed };
}

/** 01 · Money, payments, and credit — Architectural Financial District Maquette */
function buildMoneyMaquette(root: THREE.Group, mats: MaquetteMats): (t: number) => void {
  addBasePlate(root, 4.9, 3.3, mats);

  // Subtle plaza paving divisions
  addBox(root, 1.9, 0.025, 2.7, -1.25, 0, 0, mats.stone);
  addBox(root, 2.3, 0.025, 2.7, 1.05, 0, 0, mats.porcelain);

  // Central Reserve Clearing Pavilion (left-center monument)
  addBox(root, 1.15, 0.16, 1.05, -1.2, 0.025, -0.1, mats.stone);
  addBox(root, 0.96, 0.56, 0.86, -1.2, 0.185, -0.1, mats.porcelain);
  addBox(root, 1.02, 0.055, 0.92, -1.2, 0.745, -0.1, mats.amber);
  addBox(root, 0.68, 0.14, 0.6, -1.2, 0.8, -0.1, mats.porcelain);

  // Four Settlement Bank Towers (clustered architectural skyline)
  const banks: Array<[number, number, number, number, number, boolean]> = [
    [0.52, 1.55, 0.46, 0.35, -0.78, true],
    [0.44, 1.92, 0.44, 0.92, -0.62, false],
    [0.48, 1.24, 0.44, 1.52, -0.72, false],
    [0.42, 1.48, 0.42, 1.65, 0.25, true],
  ];
  for (const [w, h, d, x, z, hasAmberCrown] of banks) {
    addBox(root, w, h, d, x, 0.025, z, mats.porcelain);
    addBox(root, w * 0.76, 0.12, d * 0.76, x, 0.025 + h, z, mats.plaster);
    if (hasAmberCrown) {
      addBox(root, w * 0.8, 0.03, d * 0.8, x, 0.025 + h + 0.12, z, mats.amber);
    }
  }

  // Lower-rise Exchange & Merchant District blocks
  const blocks: Array<[number, number, number, number, number]> = [
    [0.62, 0.48, 0.46, 0.48, 0.72],
    [0.44, 0.68, 0.42, 1.08, 0.78],
    [0.52, 0.38, 0.38, -0.58, 0.92],
    [0.42, 0.54, 0.36, -1.58, 0.88],
    [0.38, 0.62, 0.36, -1.82, -0.95],
  ];
  for (const [w, h, d, x, z] of blocks) {
    addBox(root, w, h, d, x, 0.025, z, mats.plaster);
  }

  // Three frosted temporal acrylic planes rising subtly behind the skyline (echoing the Hero!)
  const sliceGeo = new THREE.BoxGeometry(2.6, 1.55, 0.024);
  const edgeGeo = new THREE.EdgesGeometry(sliceGeo);
  const slices: THREE.Group[] = [];
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Group();
    const isLit = i === 1;
    g.position.set(0.15 + (i - 1) * 0.14, 0.95, -1.32 - i * 0.16);
    g.rotation.y = (i - 1) * 0.08;
    g.add(new THREE.Mesh(sliceGeo, isLit ? mats.frostedAmber : mats.frosted));
    g.add(
      new THREE.LineSegments(
        edgeGeo,
        new THREE.LineBasicMaterial({ color: isLit ? 0xf0900a : 0xcfc8bc, transparent: true, opacity: isLit ? 0.8 : 0.45 }),
      ),
    );
    root.add(g);
    slices.push(g);
  }

  // Standard T+1 rail (muted stone) + Active 24/7 Amber Failover Clearing Rails
  addRoute(root, [[-0.65, 0.04, -0.1], [0.1, 0.04, -0.1], [0.92, 0.04, -0.62]], mats, false);
  const tracks: PulseTrack[] = [];
  const t1 = addRoute(
    root,
    [[-0.65, 0.045, 0.08], [-0.15, 0.045, 0.18], [0.35, 0.045, -0.35], [0.35, 0.045, -0.78]],
    mats,
    true,
    3,
    0.32,
  );
  const t2 = addRoute(
    root,
    [[-0.65, 0.045, 0.18], [0.05, 0.045, 0.35], [0.95, 0.045, 0.35], [1.65, 0.045, 0.25]],
    mats,
    true,
    4,
    0.26,
  );
  const t3 = addRoute(
    root,
    [[-1.2, 0.045, 0.45], [-0.58, 0.045, 0.65], [0.48, 0.045, 0.72]],
    mats,
    true,
    2,
    0.29,
  );
  if (t1) tracks.push(t1);
  if (t2) tracks.push(t2);
  if (t3) tracks.push(t3);

  const tmp = new THREE.Vector3();
  return (t: number) => {
    for (const tr of tracks) {
      for (let i = 0; i < tr.beads.length; i++) {
        const u = (t * tr.speed + i / tr.beads.length) % 1;
        tr.curve.getPoint(u, tmp);
        tr.beads[i]!.position.copy(tmp);
      }
    }
    slices.forEach((s, i) => {
      s.position.y = 0.95 + Math.sin(t * 0.9 + i * 1.1) * 0.025;
    });
  };
}

/** 02 · Power, compute, and megainfrastructure — Architectural Energy & Compute Campus */
function buildPowerMaquette(root: THREE.Group, mats: MaquetteMats): (t: number) => void {
  addBasePlate(root, 4.9, 3.3, mats);

  // Subtle stepped terrain terrace on the left (wind ridge)
  addBox(root, 1.5, 0.18, 2.8, -1.55, 0, -0.05, mats.stone);
  addBox(root, 1.1, 0.16, 1.9, -1.68, 0.18, -0.35, mats.plaster);

  // Three Sculptural Matte-Ceramic Wind Turbines
  const rotors: THREE.Group[] = [];
  const turbineCoords: Array<[number, number, number]> = [
    [-1.82, 0.34, -0.82],
    [-1.48, 0.34, -0.22],
    [-1.78, 0.34, 0.38],
  ];
  for (const [tx, ty, tz] of turbineCoords) {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.036, 1.15, 12), mats.porcelain);
    mast.position.set(tx, ty + 0.575, tz);
    mast.castShadow = true;
    root.add(mast);

    const hub = new THREE.Group();
    hub.position.set(tx + 0.04, ty + 1.12, tz);
    for (let b = 0; b < 3; b++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.42, 0.038), mats.porcelain);
      blade.position.y = 0.21;
      blade.castShadow = true;
      const arm = new THREE.Group();
      arm.rotation.x = (b / 3) * Math.PI * 2;
      arm.add(blade);
      hub.add(arm);
    }
    root.add(hub);
    rotors.push(hub);
  }

  // Solar Field (3x4 tilted ceramic collector panels)
  const panelGeo = new THREE.BoxGeometry(0.28, 0.024, 0.18);
  const panels = new THREE.InstancedMesh(panelGeo, mats.porcelain, 12);
  panels.castShadow = true;
  panels.receiveShadow = true;
  const dummy = new THREE.Object3D();
  let idx = 0;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      dummy.position.set(-0.62 + c * 0.34, 0.1, 0.48 + r * 0.3);
      dummy.rotation.set(-0.34, 0, 0);
      dummy.updateMatrix();
      panels.setMatrixAt(idx++, dummy.matrix);
    }
  }
  panels.instanceMatrix.needsUpdate = true;
  root.add(panels);

  // Grid-Scale Battery Storage Yard (central amber-accented bridge!)
  addBox(root, 0.96, 0.04, 0.82, -0.15, 0, -0.58, mats.stone);
  for (let i = 0; i < 4; i++) {
    const z = -0.84 + i * 0.175;
    addBox(root, 0.72, 0.22, 0.12, -0.15, 0.04, z, mats.porcelain);
    addBox(root, 0.72, 0.032, 0.12, -0.15, 0.26, z, mats.amber);
  }

  // Hyperscale Compute Campus (two monumental louvered ceramic data halls)
  addBox(root, 1.32, 0.68, 0.98, 1.35, 0, -0.45, mats.porcelain);
  addBox(root, 1.15, 0.56, 0.84, 1.35, 0, 0.68, mats.plaster);
  // Precision cooling roof louver units
  for (let i = 0; i < 5; i++) {
    addBox(root, 0.14, 0.12, 0.72, 0.92 + i * 0.21, 0.68, -0.45, mats.stone);
  }
  for (let i = 0; i < 4; i++) {
    addBox(root, 0.14, 0.1, 0.58, 1.02 + i * 0.22, 0.56, 0.68, mats.stone);
  }

  // Transmission Pylons & Glowing Amber Storage Bridge Bus
  const tracks: PulseTrack[] = [];
  const t1 = addRoute(
    root,
    [[-1.48, 0.36, -0.22], [-0.88, 0.42, -0.42], [-0.15, 0.3, -0.58]],
    mats,
    true,
    3,
    0.3,
  );
  const t2 = addRoute(
    root,
    [[-0.12, 0.14, 0.48], [-0.15, 0.28, -0.12], [-0.15, 0.3, -0.58]],
    mats,
    true,
    2,
    0.26,
  );
  const t3 = addRoute(
    root,
    [[0.22, 0.3, -0.58], [0.55, 0.62, -0.52], [0.85, 0.58, -0.45]],
    mats,
    true,
    3,
    0.34,
  );
  const t4 = addRoute(
    root,
    [[0.22, 0.26, -0.42], [0.62, 0.46, 0.2], [0.88, 0.48, 0.68]],
    mats,
    true,
    3,
    0.29,
  );
  if (t1) tracks.push(t1);
  if (t2) tracks.push(t2);
  if (t3) tracks.push(t3);
  if (t4) tracks.push(t4);

  const tmp = new THREE.Vector3();
  return (t: number) => {
    rotors.forEach((r, i) => {
      r.rotation.x = t * (1.25 + i * 0.14) + i * 1.4;
    });
    for (const tr of tracks) {
      for (let i = 0; i < tr.beads.length; i++) {
        const u = (t * tr.speed + i / tr.beads.length) % 1;
        tr.curve.getPoint(u, tmp);
        tr.beads[i]!.position.copy(tmp);
      }
    }
  };
}

/** 03 · Trade and critical supply chains — Architectural Maritime Port & Corridor Maquette */
function buildTradeMaquette(root: THREE.Group, mats: MaquetteMats): (t: number) => void {
  addBasePlate(root, 4.9, 3.3, mats);

  // Recessed smooth pale-stone water basin (right half) vs raised ceramic quay (left half)
  addBox(root, 2.55, 0.14, 3.1, -1.12, 0, 0, mats.porcelain);
  addBox(root, 2.2, 0.03, 3.1, 1.28, 0, 0, mats.stone);

  // Bulk Mineral / Commodity Silos & Tank Farm (back-left)
  for (let i = 0; i < 4; i++) {
    const silo = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.92, 20), mats.porcelain);
    silo.position.set(-1.92 + i * 0.36, 0.14 + 0.46, -0.92);
    silo.castShadow = true;
    silo.receiveShadow = true;
    root.add(silo);
  }
  for (let i = 0; i < 3; i++) {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.38, 24), mats.plaster);
    tank.position.set(-1.82 + i * 0.54, 0.14 + 0.19, 0.92);
    tank.castShadow = true;
    tank.receiveShadow = true;
    root.add(tank);
  }

  // Modular Stacked Shipping Containers on the Quay (porcelain + warm stone + 3 amber priority stacks)
  const contGeo = new THREE.BoxGeometry(0.36, 0.13, 0.14);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      const tiers = (row + col) % 3 === 0 ? 3 : 2;
      for (let tier = 0; tier < tiers; tier++) {
        const isAmber = tier === tiers - 1 && ((row === 1 && col === 1) || (row === 2 && col === 2));
        const m = new THREE.Mesh(
          contGeo,
          isAmber ? mats.amber : (row + tier) % 2 === 0 ? mats.porcelain : mats.plaster,
        );
        m.position.set(-1.42 + col * 0.42, 0.14 + 0.065 + tier * 0.135, -0.3 + row * 0.24);
        m.castShadow = true;
        m.receiveShadow = true;
        root.add(m);
      }
    }
  }

  // Two Sculptural Articulated Gantry Cranes straddling the quay edge
  for (const cz of [-0.45, 0.38]) {
    const legH = 1.05;
    addBox(root, 0.055, legH, 0.055, -0.02, 0.14, cz - 0.18, mats.porcelain);
    addBox(root, 0.055, legH, 0.055, -0.02, 0.14, cz + 0.18, mats.porcelain);
    addBox(root, 0.055, legH, 0.055, -0.34, 0.14, cz - 0.18, mats.porcelain);
    addBox(root, 0.055, legH, 0.055, -0.34, 0.14, cz + 0.18, mats.porcelain);
    // Horizontal gantry boom extending over the container ship
    addBox(root, 1.58, 0.06, 0.42, 0.22, 0.14 + legH - 0.18, cz, mats.porcelain);
    addBox(root, 0.14, 0.06, 0.16, 0.56, 0.14 + legH - 0.24, cz, mats.amber);
  }

  // Sleek Matte-Ceramic Container Ship moored & gliding in the basin
  const ship = new THREE.Group();
  ship.position.set(0.82, 0.04, 0.05);
  addBox(ship, 0.46, 0.2, 1.68, 0, 0, 0, mats.porcelain);
  // Bridge tower aft
  addBox(ship, 0.38, 0.44, 0.24, 0, 0.2, -0.58, mats.plaster);
  // Deck container stacks on ship
  for (let i = 0; i < 4; i++) {
    addBox(ship, 0.34, 0.16, 0.22, 0, 0.2, -0.22 + i * 0.26, i === 2 ? mats.amber : mats.plaster);
  }
  root.add(ship);

  // Blocked direct strait lane (muted) vs. Glowing Amber Reroute Shipping Corridor
  addRoute(root, [[0.82, 0.05, 0.92], [1.45, 0.05, 0.32], [2.15, 0.05, -0.85]], mats, false);
  // Strait chokepoint marker buoy
  const buoy = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.14, 16), mats.terracotta);
  buoy.position.set(1.52, 0.1, 0.24);
  root.add(buoy);

  const tracks: PulseTrack[] = [];
  const lane = addRoute(
    root,
    [[0.82, 0.055, 0.98], [1.35, 0.055, 1.25], [1.96, 0.055, 0.55], [2.12, 0.055, -1.15]],
    mats,
    true,
    4,
    0.24,
  );
  const rail = addRoute(
    root,
    [[-2.25, 0.155, 0.45], [-0.45, 0.155, 0.45], [-0.18, 0.155, 0.38]],
    mats,
    true,
    2,
    0.28,
  );
  if (lane) tracks.push(lane);
  if (rail) tracks.push(rail);

  const tmp = new THREE.Vector3();
  return (t: number) => {
    ship.position.y = 0.04 + Math.sin(t * 1.4) * 0.012;
    ship.rotation.z = Math.sin(t * 1.1) * 0.015;
    for (const tr of tracks) {
      for (let i = 0; i < tr.beads.length; i++) {
        const u = (t * tr.speed + i / tr.beads.length) % 1;
        tr.curve.getPoint(u, tmp);
        tr.beads[i]!.position.copy(tmp);
      }
    }
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

    const { pmrem, envTex } = createStudioEnv(renderer, 'paper');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf6f3ec);
    scene.environment = envTex;
    setupStudioLight(scene);

    const camera = new THREE.PerspectiveCamera(31, 4 / 3, 0.1, 50);
    camera.position.set(5.4, 4.4, 5.8);
    camera.lookAt(0, 0.32, 0);

    const root = new THREE.Group();
    scene.add(root);
    const mats = createMaquetteMats();
    const tickScene =
      kind === 'money'
        ? buildMoneyMaquette(root, mats)
        : kind === 'power'
          ? buildPowerMaquette(root, mats)
          : buildTradeMaquette(root, mats);

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
      const t = reduced ? 1.4 : (now - t0) / 1000;
      root.rotation.y = -0.18 + Math.sin(t * 0.22) * 0.09 + px * 0.24;
      root.rotation.x = py * 0.08;
      tickScene(t);
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
      pmrem.dispose();
      envTex.dispose();
      renderer.dispose();
    });

    wake();
  }
}
