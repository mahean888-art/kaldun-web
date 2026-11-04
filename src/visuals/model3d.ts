/**
 * The hero's model, rendered: a white architectural massing model of one
 * connected system, lit like a studio model on a table: soft daylight,
 * contact shadows, hairline ink edges, the orange reference grid beneath.
 *
 * The scene is the same plate as the drawn version (model.ts, kept as the
 * fallback where WebGL is missing): a solar field and storage, a substation
 * and two masts, a factory, a warehouse, a crane and a ship at the quay, and
 * a lender's tower behind. Charcoal lines carry goods and power; dashed lines
 * carry money and obligations.
 *
 * One pass of about twelve seconds, then rest:
 *   Model     — the blocks rise and the lines draw in.
 *   Futures   — three outline copies fan out behind; in one the solar line
 *               goes slack. The conditions are named as they bind.
 *   Discovery — the copies fold back; the loan is redrawn in orange in two
 *               stages, and storage gains a line to the substation.
 * Words are set in HTML over the canvas at projected points, in clear slots,
 * so no word overlaps the model or another word. Under reduced motion the
 * rest state is drawn once.
 */

import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { prefersReducedMotion } from '../lib/prefers';

/** Plate coordinates: x along the plate, y toward the viewer, z up. */
type P3 = [number, number, number];
const v = ([x, y, z]: P3): THREE.Vector3 => new THREE.Vector3(x, z, y);

const INK = 0x171410;
const AMBER = 0xf39200;
const WHITE = 0xfbfaf6;

const ease = (t: number): number => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) ** 3);
const span = (t: number, a: number, b: number): number => Math.max(0, Math.min(1, (t - a) / (b - a)));

type Part = { id: string; group: THREE.Group; key: number };
type Stroke = { line: Line2; n: number; kind: 'flow' | 'money' | 'found'; loan?: boolean };

export function canRender3d(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function initModel3d(host: HTMLElement): void {
  const panel = host.closest('.hero')?.querySelector<HTMLElement>('.hero__panel') ?? null;
  const readout = host.closest('.hero')?.querySelector<HTMLElement>('[data-readout]') ?? null;
  const reduced = prefersReducedMotion();
  const narrowQ = window.matchMedia('(max-width: 759px)');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  host.innerHTML = '';
  host.classList.add('m3');
  host.append(renderer.domElement);
  const ov = document.createElement('div');
  ov.className = 'm3-ov';
  host.append(ov);

  const scene = new THREE.Scene();

  // Light: a broad sky, and one low sun from the front left for soft shadows.
  scene.add(new THREE.HemisphereLight(0xffffff, 0xe4ddcf, 2.1));
  const sun = new THREE.DirectionalLight(0xffffff, 2.3);
  sun.position.set(2, 26, 18);
  sun.target.position.set(15, 0, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -24;
  sun.shadow.camera.right = 24;
  sun.shadow.camera.top = 16;
  sun.shadow.camera.bottom = -16;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 80;
  sun.shadow.radius = 9;
  sun.shadow.blurSamples = 20;
  sun.shadow.bias = -0.0006;
  scene.add(sun, sun.target);

  const lines: LineMaterial[] = [];
  const lineMat = (color: number, width: number, opacity = 1, dashed = false): LineMaterial => {
    const m = new LineMaterial({ color, linewidth: width, transparent: opacity < 1, opacity, dashed, dashSize: 0.16, gapSize: 0.16, worldUnits: false });
    lines.push(m);
    return m;
  };
  const edgeMat = lineMat(INK, 0.8, 0.5);
  const fineMat = lineMat(INK, 0.6, 0.22);
  const steelMat = lineMat(INK, 1.0, 0.75);
  const copyMat = lineMat(INK, 0.7, 0);

  const white = new THREE.MeshStandardMaterial({ color: WHITE, roughness: 0.92, metalness: 0 });
  const side = new THREE.MeshStandardMaterial({ color: 0xf1eee7, roughness: 0.95 });
  const glass = new THREE.MeshStandardMaterial({ color: 0xd9d5cc, roughness: 0.6 });

  // Solar cells: a light panel with fine dividing lines.
  const cells = (() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 64;
    const g = c.getContext('2d')!;
    g.fillStyle = '#e6e3dc';
    g.fillRect(0, 0, 512, 64);
    g.strokeStyle = 'rgba(23,20,16,0.28)';
    g.lineWidth = 2;
    for (let x = 0; x <= 512; x += 512 / 12) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 64);
      g.stroke();
    }
    g.beginPath();
    g.moveTo(0, 32);
    g.lineTo(512, 32);
    g.stroke();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.55 });
  })();

  const parts: Part[] = [];
  const copySource: THREE.BufferGeometry[] = [];

  const edges = (mesh: THREE.Mesh, mat = edgeMat): LineSegments2 => {
    const eg = new THREE.EdgesGeometry(mesh.geometry, 25);
    const lg = new LineSegmentsGeometry().fromEdgesGeometry(eg);
    const ls = new LineSegments2(lg, mat);
    ls.position.copy(mesh.position);
    ls.rotation.copy(mesh.rotation);
    ls.scale.copy(mesh.scale);
    mesh.updateMatrix();
    const g = eg.clone();
    g.applyMatrix4(mesh.matrix);
    copySource.push(g);
    return ls;
  };

  /** A box from a ground corner: x, y on the plate, z its base, w × d × h. */
  const box = (g: THREE.Group, x: number, y: number, z: number, w: number, d: number, h: number, mat: THREE.Material = white): THREE.Mesh => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x + w / 2, z + h / 2, y + d / 2);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m, edges(m));
    return m;
  };

  const seg = (g: THREE.Group, pts: P3[], mat: LineMaterial): void => {
    const lg = new LineSegmentsGeometry();
    lg.setPositions(pts.flatMap((p) => v(p).toArray()));
    g.add(new LineSegments2(lg, mat));
  };

  const part = (id: string, base: P3, build: (g: THREE.Group) => void): void => {
    const g = new THREE.Group();
    build(g);
    // Rise from the ground: scale about the base.
    const pivot = new THREE.Group();
    pivot.position.set(base[0], 0, base[1]);
    g.position.set(-base[0], 0, -base[1]);
    pivot.add(g);
    scene.add(pivot);
    parts.push({ id, group: pivot, key: base[1] + base[0] * 0.18 });
  };

  // --- the plate --------------------------------------------------------------

  // The ground: paper that takes shadows, and the orange grid, fading out.
  {
    const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(120, 80), new THREE.ShadowMaterial({ color: 0x2a2014, opacity: 0.16 }));
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.set(15, 0, 5);
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);
    const pos: number[] = [];
    const col: number[] = [];
    const c = new THREE.Color(AMBER);
    const fade = (x: number, y: number): number => {
      const dx = (x - 14) / 22;
      const dy = (y - 6) / 11;
      return Math.max(0, 0.5 * (1 - Math.min(1, Math.sqrt(dx * dx + dy * dy)) ** 2));
    };
    const push = (a: P3, b: P3): void => {
      pos.push(...v(a).toArray(), ...v(b).toArray());
      col.push(c.r, c.g, c.b, fade(a[0], a[1]), c.r, c.g, c.b, fade(b[0], b[1]));
    };
    for (let x = -8; x <= 36; x++) for (let y = -4; y < 16; y++) push([x, y, 0.002], [x, y + 1, 0.002]);
    for (let y = -4; y <= 16; y++) for (let x = -8; x < 36; x++) push([x, y, 0.002], [x + 1, y, 0.002]);
    const gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    gg.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
    scene.add(new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false })));
  }

  // The quay edge and the water beyond it, drawn as lines only.
  {
    const g = new THREE.Group();
    seg(g, [[26.4, -1, 0.02], [26.4, 12, 0.02]], lineMat(INK, 0.8, 0.45));
    for (const x of [29.6, 31.0]) seg(g, [[x, 0.5, 0.02], [x, 10.5, 0.02]], fineMat);
    scene.add(g);
  }

  // Solar field: four rows of tilted panels on posts.
  for (let r = 0; r < 4; r++) {
    const y = 4.8 + r * 1.15;
    part('solar', [3.5, y + 0.4, 0], (g) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, 0.82), [side, side, cells, side, side, side]);
      m.position.set(3.5, 0.5, y + 0.38);
      m.rotation.x = 0.5;
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m, edges(m));
      for (let x = 0.8; x < 6.5; x += 1.9) seg(g, [[x, y + 0.62, 0], [x, y + 0.62, 0.34], [x, y + 0.14, 0], [x, y + 0.14, 0.64]], fineMat);
    });
  }

  // Storage: three containers beside the field.
  for (let i = 0; i < 3; i++) {
    const y = 5.0 + i * 1.2;
    part('storage', [8.2, y, 0], (g) => {
      box(g, 7.4, y, 0, 1.6, 0.85, 0.8);
      seg(g, [[7.4, y + 0.86, 0.62], [9.0, y + 0.86, 0.62]], fineMat);
    });
  }

  // The lender: a slim tower on a podium.
  part('lender', [10.6, 1.6, 0], (g) => {
    box(g, 9.4, 0.4, 0, 2.4, 2.4, 0.34);
    box(g, 9.8, 0.8, 0.34, 1.6, 1.6, 2.6);
    box(g, 10.05, 1.05, 2.94, 1.1, 1.1, 0.16);
    const f: P3[] = [];
    for (let k = 0.34 + 0.3; k < 2.9; k += 0.3) {
      const c: P3[] = [[9.8, 0.8, k], [11.4, 0.8, k], [11.4, 2.4, k], [9.8, 2.4, k]];
      for (let i = 0; i < 4; i++) f.push(c[i]!, c[(i + 1) % 4]!);
    }
    seg(g, f.map(([x, y, z]) => [x + (x > 10.6 ? 0.004 : -0.004), y + (y > 1.6 ? 0.004 : -0.004), z] as P3), fineMat);
  });

  // Substation: a pad, two transformers and a gantry.
  part('substation', [11.3, 6.7, 0], (g) => {
    box(g, 10, 5.4, 0, 2.6, 2.6, 0.08);
    box(g, 10.35, 5.8, 0.08, 0.8, 0.7, 0.72);
    box(g, 10.35, 6.9, 0.08, 0.8, 0.7, 0.72);
    box(g, 11.85, 5.7, 0.08, 0.14, 0.14, 1.55);
    box(g, 11.85, 7.6, 0.08, 0.14, 0.14, 1.55);
    box(g, 11.85, 5.7, 1.63, 0.14, 2.04, 0.1);
  });

  // Transmission: two lattice masts.
  const mast = (x: number, y: number): void =>
    part('mast', [x, y, 0], (g) => {
      const t: P3 = [x, y, 3.0];
      const legs: P3[] = [];
      for (const [a, b] of [[-0.3, -0.3], [0.3, -0.3], [0.3, 0.3], [-0.3, 0.3]] as const) legs.push([x + a, y + b, 0], t);
      legs.push([x, y - 0.85, 2.7], [x, y + 0.85, 2.7]);
      legs.push([x - 0.16, y + 0.16, 1.4], [x + 0.16, y + 0.16, 1.4], [x - 0.16, y - 0.16, 1.4], [x + 0.16, y - 0.16, 1.4]);
      seg(g, legs, steelMat);
    });
  mast(14.4, 6.7);
  mast(16.4, 6.7);

  // Factory: a hall with a north-light roof and a stack.
  part('factory', [19.6, 6.6, 0], (g) => {
    box(g, 17.6, 5, 0, 4, 3.2, 1.2);
    for (let i = 0; i < 4; i++) {
      const sh = new THREE.Shape();
      sh.moveTo(0, 0);
      sh.lineTo(1, 0);
      sh.lineTo(1, 0.5);
      sh.closePath();
      const geo = new THREE.ExtrudeGeometry(sh, { depth: 3.2, bevelEnabled: false });
      const m = new THREE.Mesh(geo, [white, glass]);
      m.position.set(17.6 + i, 1.2, 5);
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m, edges(m));
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.5), glass);
      gl.rotation.y = Math.PI / 2;
      gl.position.set(17.6 + i + 1 - 0.002, 1.45, 6.6);
      g.add(gl);
    }
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 3.0, 24), white);
    stack.position.set(18.3, 1.5, 5.5);
    stack.castShadow = true;
    g.add(stack, edges(stack));
  });

  // Warehouse: a flat-roofed shed with loading doors.
  part('warehouse', [24, 6.3, 0], (g) => {
    box(g, 22.4, 5, 0, 3.2, 2.6, 1.15);
    const d: P3[] = [];
    for (let i = 0; i < 4; i++) {
      const x0 = 22.75 + i * 0.75;
      const x1 = x0 + 0.45;
      const y = 7.605;
      d.push([x0, y, 0], [x0, y, 0.62], [x0, y, 0.62], [x1, y, 0.62], [x1, y, 0.62], [x1, y, 0]);
    }
    seg(g, d, lineMat(INK, 0.7, 0.45));
  });

  // The port: a container ship alongside and a gantry crane on the quay.
  part('ship', [28.3, 6.2, 0], (g) => {
    box(g, 27.5, 3.0, -0.04, 1.6, 6.4, 0.6);
    const tones = [0xfbfaf6, 0xeceae4, 0xf6f4ef, 0xe4e1da];
    for (let i = 0; i < 4; i++) box(g, 27.65, 4.3 + i * 1.15, 0.56, 1.3, 1.0, 0.42 + (i % 2) * 0.36, new THREE.MeshStandardMaterial({ color: tones[i], roughness: 0.9 }));
    box(g, 27.65, 3.15, 0.56, 1.3, 0.9, 1.15);
  });
  part('crane', [26.4, 6.8, 0], (g) => {
    for (const [x, y] of [[25.9, 5.4], [25.9, 6.7], [26.9, 5.4], [26.9, 6.7]] as const) box(g, x, y, 0, 0.14, 0.14, 2.9);
    box(g, 25.6, 5.4, 2.9, 4.4, 1.44, 0.18);
    box(g, 25.85, 5.6, 3.08, 0.9, 1.0, 0.36);
  });

  // --- the lines --------------------------------------------------------------

  const strokes: Stroke[] = [];
  const curve = (a: P3, b: P3, lift: number): THREE.Vector3[] => {
    const A = v(a);
    const B = v(b);
    const M = A.clone().lerp(B, 0.5);
    M.y = lift >= 0 ? Math.max(A.y, B.y) + lift : Math.min(A.y, B.y) + lift;
    return new THREE.QuadraticBezierCurve3(A, M, B).getPoints(48);
  };
  const stroke = (pts: THREE.Vector3[], mat: LineMaterial, kind: Stroke['kind'], loan = false): Line2 => {
    const lg = new LineGeometry();
    lg.setPositions(pts.flatMap((p) => p.toArray()));
    const l = new Line2(lg, mat);
    l.computeLineDistances();
    scene.add(l);
    strokes.push({ line: l, n: pts.length - 1, kind, loan });
    return l;
  };

  const flowMat = lineMat(INK, 1.25, 0.85);
  const moneyMat = lineMat(INK, 1.0, 0.6, true);
  const loanMat = lineMat(INK, 1.0, 0.6, true);
  const foundMat = lineMat(AMBER, 2.6);

  const SOL: P3 = [6.5, 7.3, 0.4];
  const SUB: P3 = [10.35, 7.25, 0.6];
  stroke(curve([6.5, 6.2, 0.4], [7.4, 6.2, 0.5], 0.3), flowMat, 'flow');
  stroke(curve(SOL, SUB, 0.7), flowMat, 'flow');
  stroke(curve([11.92, 6.7, 1.68], [14.4, 6.7, 2.7], 0.15), flowMat, 'flow');
  stroke(curve([14.4, 6.7, 2.7], [16.4, 6.7, 2.7], -0.35), flowMat, 'flow');
  stroke(curve([16.4, 6.7, 2.7], [17.6, 6.7, 1.5], -0.15), flowMat, 'flow');
  stroke(curve([21.6, 6.6, 0.6], [22.4, 6.4, 0.6], 0.4), flowMat, 'flow');
  stroke(curve([25.6, 6.2, 0.5], [27.5, 6.2, 0.7], 0.8), flowMat, 'flow');

  const O: P3 = [10.6, 2.8, 0.34];
  stroke(curve(O, [3.5, 6.4, 0.68], 1.9), loanMat, 'money', true);
  stroke(curve(O, [19.6, 6.5, 1.7], 2.2), moneyMat, 'money');
  stroke(curve(O, [24, 6.3, 1.15], 2.8), moneyMat, 'money');

  const ST: P3 = [8.2, 6.2, 0.8];
  stroke(curve(O, ST, 1.2), foundMat, 'found');
  stroke(curve(ST, [3.5, 6.4, 0.68], 1.0), foundMat, 'found');
  stroke(curve([9.0, 7.0, 0.5], [10.35, 7.0, 0.5], 0.45), foundMat, 'found');
  const node = new THREE.Mesh(new THREE.OctahedronGeometry(0.17), new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0 }));
  node.position.copy(v(ST));
  scene.add(node);

  // --- the futures: outline copies of the plate -----------------------------

  const copies: THREE.Group[] = [];
  {
    const all = new THREE.BufferGeometry();
    const arr: number[] = [];
    for (const g of copySource) arr.push(...(g.getAttribute('position').array as Float32Array));
    all.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    const lg = new LineSegmentsGeometry().fromEdgesGeometry(all as unknown as THREE.EdgesGeometry);
    for (let i = 0; i < 3; i++) {
      const g = new THREE.Group();
      // Copies are built in world space; parts are positioned in their pivots, so
      // the copy geometry is offset back into plate coordinates.
      g.add(new LineSegments2(lg, copyMat));
      if (i === 1) {
        const lgS = new LineGeometry();
        lgS.setPositions(curve(SOL, SUB, -0.45).flatMap((p) => p.toArray()));
        const sl = new Line2(lgS, lineMat(INK, 1.4, 0));
        sl.userData['slack'] = true;
        g.add(sl);
      }
      scene.add(g);
      copies.push(g);
    }
  }

  // --- camera ---------------------------------------------------------------

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  const T = new THREE.Vector3(14.6, 0.4, 5.8);
  const AZ = 0.1;
  const EL = 0.56;
  const dir = new THREE.Vector3(Math.sin(AZ) * Math.cos(EL), Math.sin(EL), Math.cos(AZ) * Math.cos(EL));
  const frame = (): { w: number; cx: number; cy: number } => (narrowQ.matches ? { w: 16, cx: 11.4, cy: 3.1 } : { w: 31.5, cx: 14.8, cy: 1.5 });
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();

  // --- the words: HTML over the canvas --------------------------------------

  const svgNS = 'http://www.w3.org/2000/svg';
  const leaders = document.createElementNS(svgNS, 'svg');
  leaders.setAttribute('class', 'm3-leaders');
  ov.append(leaders);
  type Note = { id: string; at: P3; side: 'l' | 'r'; head: string; rest: string; cls: string; el: HTMLElement; path: SVGPathElement; dot: SVGCircleElement };
  const notes: Note[] = (
    [
      ['condition', [10.75, 6.25, 0.8], 'l', 'Condition', 'Transformers 6 months late', ''],
      ['binding', [11.4, 2.4, 1.8], 'r', 'Binding', 'First debt payment', ''],
      ['found', ST, 'l', 'Found', 'Stage the loan with deliveries', 'is-found'],
    ] as const
  ).map(([id, at, side, head, rest, cls]) => {
    const el = document.createElement('p');
    el.className = `m3-note ${cls}`;
    el.innerHTML = `<b>${head} ·</b><span>${rest}</span>`;
    ov.append(el);
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('class', `m3-lead ${cls}`);
    const dot = document.createElementNS(svgNS, 'circle');
    dot.setAttribute('class', `m3-dot ${cls}`);
    dot.setAttribute('r', '2.5');
    leaders.append(path, dot);
    return { id, at: at as P3, side, head, rest, cls, el, path, dot };
  });
  const labels = (
    [
      ['Solar', [3.4, 9.4, 0]],
      ['Storage', [8.2, 8.6, 0]],
      ['Substation', [11.3, 8.6, 0]],
      ['Bank', [10.6, 3.4, 0]],
      ['Factory', [19.6, 8.8, 0]],
      ['Warehouse', [24, 8.2, 0]],
      ['Port', [26.4, 7.9, 0]],
    ] as const
  ).map(([t, at]) => {
    const el = document.createElement('span');
    el.className = 'm3-lab';
    el.textContent = t;
    ov.append(el);
    return { el, at: at as P3 };
  });

  let W = 1;
  let H = 1;
  const project = (p: P3): [number, number] => {
    const q = v(p).project(camera);
    return [((q.x + 1) / 2) * W, ((1 - q.y) / 2) * H];
  };

  const layout = (): void => {
    const r = host.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    renderer.setSize(W, H, false);
    for (const m of lines) m.resolution.set(W, H);
    const f = frame();
    const h = (f.w * H) / W;
    camera.left = -f.w / 2;
    camera.right = f.w / 2;
    camera.top = h / 2;
    camera.bottom = -h / 2;
    const target = new THREE.Vector3(f.cx, T.y, T.z);
    camera.position.copy(target).addScaledVector(dir, 60);
    camera.lookAt(target);
    // Shift the frame so the plate sits low, leaving the top band for the words.
    camera.updateMatrixWorld();
    right.setFromMatrixColumn(camera.matrixWorld, 0);
    up.setFromMatrixColumn(camera.matrixWorld, 1);
    camera.position.addScaledVector(up, f.cy);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    leaders.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const narrow = narrowQ.matches;
    const slotY = narrow ? 20 : 26;
    for (const n of notes) {
      const [x, y] = project(n.at);
      n.dot.setAttribute('cx', x.toFixed(1));
      n.dot.setAttribute('cy', y.toFixed(1));
      const w = n.el.offsetWidth;
      if (narrow) {
        n.el.style.left = `${(W / 2 - w / 2).toFixed(1)}px`;
        n.el.style.top = `${slotY - 12}px`;
        n.path.setAttribute('d', `M${x.toFixed(1)} ${y.toFixed(1)}V${(slotY + n.el.offsetHeight - 4).toFixed(1)}`);
      } else if (n.side === 'l') {
        const tx = W * 0.035;
        n.el.style.left = `${tx.toFixed(1)}px`;
        n.el.style.top = `${slotY - 12}px`;
        const ry = slotY + 14;
        n.path.setAttribute('d', `M${x.toFixed(1)} ${y.toFixed(1)}V${ry}M${Math.min(tx, x).toFixed(1)} ${ry}H${Math.max(tx + w, x).toFixed(1)}`);
      } else {
        const tx = W * 0.56;
        n.el.style.left = `${tx.toFixed(1)}px`;
        n.el.style.top = `${slotY - 12}px`;
        const ry = slotY + 14;
        n.path.setAttribute('d', `M${x.toFixed(1)} ${y.toFixed(1)}H${tx.toFixed(1)}V${ry}H${(tx + w).toFixed(1)}`);
      }
    }
    for (const l of labels) {
      const [x, y] = project(l.at);
      l.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, 0)`;
    }
    // The copies fan along the screen's own axes.
    fanR.copy(right);
    fanU.copy(up);
  };
  const fanR = new THREE.Vector3();
  const fanU = new THREE.Vector3();

  const phase = (p: string): void => {
    if (!panel) return;
    if (p) panel.dataset['phase'] = p;
    else delete panel.dataset['phase'];
  };

  const sorted = [...parts].sort((a, b) => a.key - b.key);
  const setNote = (id: string, o: number): void => {
    const n = notes.find((x) => x.id === id);
    if (!n) return;
    n.el.style.opacity = String(o);
    n.path.style.opacity = String(o);
    n.dot.style.opacity = String(o);
  };

  /**
   * The readout under the hero reports the pass as it plays: dots fill as each
   * stage completes; f filled, p tinted (in progress), o a ring (pending).
   */
  const cluster = (key: string): { dots: HTMLElement[]; lab: HTMLElement | null; el: HTMLElement | null } => {
    const el = readout?.querySelector<HTMLElement>(`[data-rc="${key}"]`) ?? null;
    return { el, dots: el ? Array.from(el.querySelectorAll<HTMLElement>('.rc__dots i')) : [], lab: el?.querySelector<HTMLElement>('.rc__lab b') ?? null };
  };
  const rcs = { model: cluster('model'), futures: cluster('futures'), discovery: cluster('discovery'), condition: cluster('condition'), found: cluster('found') };
  const fill = (dots: HTMLElement[], k: number): void => {
    dots.forEach((d, i) => {
      const x = k * dots.length - i;
      d.className = x >= 1 ? 'f' : x > 0 ? 'p' : 'o';
    });
  };
  const say = (c: { lab: HTMLElement | null }, text: string): void => {
    if (c.lab && c.lab.textContent !== text) c.lab.textContent = text;
  };
  const report = (t: number): void => {
    if (!readout) return;
    const m = span(t, 150, 3500);
    fill(rcs.model.dots, m);
    say(rcs.model, m >= 1 ? 'Built' : 'Building');
    const fu = span(t, 3900, 7400);
    fill(rcs.futures.dots, fu);
    say(rcs.futures, `${Math.min(4, Math.max(1, Math.ceil(fu * 4)))} of 4`);
    const d = span(t, 8200, 11200);
    fill(rcs.discovery.dots, d);
    say(rcs.discovery, d >= 1 ? 'Found' : t >= 8200 ? 'Searching' : 'Pending');
    rcs.condition.el?.classList.toggle('is-lit', t >= 5000);
    rcs.found.el?.classList.toggle('is-lit', t >= 10600);
  };

  /** The scene at a moment of the pass, t in milliseconds. */
  const at = (t: number): void => {
    sorted.forEach((p, i) => {
      const k = ease(span(t, 150 + i * 90, 950 + i * 90));
      p.group.scale.set(1, Math.max(0.0001, k), 1);
      p.group.visible = k > 0.001;
    });
    let fi = 0;
    let di = 0;
    for (const s of strokes) {
      const geo = s.line.geometry as LineGeometry;
      if (s.kind === 'found') {
        const k = ease(span(t, 8600 + fi * 900, 9600 + fi * 900));
        fi++;
        geo.instanceCount = Math.round(s.n * k);
        s.line.visible = k > 0;
      } else {
        const k = ease(span(t, 2500 + di * 90, 3500 + di * 90));
        di++;
        geo.instanceCount = Math.round(s.n * k);
        s.line.visible = k > 0;
      }
    }
    loanMat.opacity = 0.6 * (1 - 0.65 * ease(span(t, 8200, 8700)));
    const out = ease(span(t, 3900, 4900)) * (1 - ease(span(t, 7400, 8200)));
    const fan: Array<[number, number]> = [[-1.1, 0.55], [0, 1.05], [1.1, 0.55]];
    copies.forEach((c, i) => {
      const [dx, dy] = fan[i]!;
      c.position.copy(fanR).multiplyScalar(dx * out).addScaledVector(fanU, dy * out);
      c.visible = out > 0.001;
      for (const ch of c.children) if ((ch as Line2).userData['slack']) ((ch as Line2).material as LineMaterial).opacity = 0.9 * out;
    });
    copyMat.opacity = 0.2 * out;
    const narrow = narrowQ.matches;
    const show = (a: number, b: number): number => ease(span(t, a, a + 500)) * (1 - ease(span(t, b, b + 500)));
    setNote('condition', show(5000, narrow ? 5700 : 7400));
    setNote('binding', show(6200, 7400));
    setNote('found', ease(span(t, 10600, 11200)));
    (node.material as THREE.MeshBasicMaterial).opacity = ease(span(t, 9400, 9800));
    ov.style.setProperty('--lab', String(ease(span(t, 3200, 4000))));
    phase(t < 3800 ? 'model' : t < 8200 ? 'futures' : t < 12600 ? 'discovery' : '');
    report(t);
    renderer.render(scene, camera);
  };

  let last = 20000;
  // For review: draw any moment of the pass on request.
  let held = false;
  host.addEventListener('m3-at', (e) => {
    held = true;
    last = Number((e as CustomEvent).detail);
    at(last);
  });
  const ro = new ResizeObserver(() => {
    layout();
    at(last);
  });
  ro.observe(host);
  narrowQ.addEventListener('change', () => {
    layout();
    at(last);
  });
  layout();

  if (reduced) {
    at(20000);
    return;
  }
  last = 0;
  at(0);
  let start = 0;
  const run = (now: number): void => {
    if (held) return;
    if (!start) start = now;
    last = now - start;
    at(last);
    if (last < 12800) requestAnimationFrame(run);
    else last = 20000;
  };
  const io = new IntersectionObserver((e) => {
    if (!e.some((x) => x.isIntersecting)) return;
    io.disconnect();
    requestAnimationFrame(run);
  });
  io.observe(host);
}
