/**
 * 05 · Worlds — Three Bespoke Three.js PBR + Custom GLSL Sculptural Specimens
 *
 * Each world lives inside a deep smoked-obsidian architectural vitrine (#0f0e0c)
 * with procedural studio softbox reflections, ACES Filmic tone mapping, custom
 * GLSL shaders, and subtle pointer-tracked orbital inspection:
 *   - money : The Monetary Clearing Orrery (nested titanium/brass gimbals + amber par core)
 *   - power : The Megawatt Monolith (GLSL topographic isoline wavefield + compute monoliths + catenary arcs)
 *   - trade : The Spacing Guild Navigator Globe (obsidian geodesic sphere + Fresnel rim + great-circle reroutes)
 */
import * as THREE from 'three';
import { prefersReducedMotion } from '../lib/prefers';
import { createRenderer, createStudioEnv, damp } from './threeStudio';

type WorldKind = 'money' | 'power' | 'trade';

interface SceneController {
  update: (t: number, dt: number, px: number, py: number) => void;
  dispose: () => void;
}

/** Shared animated pulse Tube shader for glowing spice-amber optical filaments */
function createPulseTubeMat(colorHex: number, speed = 0.65, dashed = false): THREE.ShaderMaterial {
  const c = new THREE.Color(colorHex);
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: c },
      uSpeed: { value: speed },
      uDashed: { value: dashed ? 1.0 : 0.0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uSpeed;
      uniform float uDashed;
      varying vec2 vUv;
      void main() {
        float base = 0.34;
        if (uDashed > 0.5) {
          float dash = step(0.45, fract(vUv.x * 22.0 - uTime * 0.4));
          float pulse = 0.65 + 0.35 * sin(uTime * 3.5);
          gl_FragColor = vec4(uColor * (1.2 * pulse), dash * 0.85);
          return;
        }
        float p1 = fract(vUv.x - uTime * uSpeed);
        float p2 = fract(vUv.x - uTime * uSpeed + 0.5);
        float head1 = smoothstep(0.16, 0.0, p1);
        float head2 = smoothstep(0.16, 0.0, p2);
        float glow = max(head1, head2);
        vec3 col = uColor * (0.85 + glow * 2.4) + vec3(1.0, 0.92, 0.72) * pow(glow, 3.0) * 0.9;
        gl_FragColor = vec4(col, clamp(base + glow * 0.66, 0.0, 1.0));
      }
    `,
  });
}

/** Shared subtle spice-gold ambient dust field */
function createDustField(count: number, radius: number): THREE.Points {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = radius * (0.55 + Math.random() * 0.65);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.cos(phi) * 0.75;
    pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xf3a83b,
    size: 0.032,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geo, mat);
}

/** 05A · Money: The Monetary Clearing Orrery */
function buildMoneyScene(scene: THREE.Scene, camera: THREE.PerspectiveCamera): SceneController {
  camera.fov = 34;
  camera.position.set(0, 1.9, 9.4);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  const key = new THREE.DirectionalLight(0xfff6e8, 2.4);
  key.position.set(5, 8, 6);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xff9b14, 3.2);
  rim.position.set(-6, -3, -5);
  scene.add(rim);

  const coreLight = new THREE.PointLight(0xff9810, 4.5, 10, 1.6);
  scene.add(coreLight);

  const root = new THREE.Group();
  scene.add(root);

  const obsidian = new THREE.MeshPhysicalMaterial({
    color: 0x181614,
    roughness: 0.22,
    metalness: 0.88,
    clearcoat: 0.55,
    clearcoatRoughness: 0.18,
  });

  const brass = new THREE.MeshStandardMaterial({
    color: 0xd4963a,
    roughness: 0.24,
    metalness: 0.92,
  });

  const ceramic = new THREE.MeshPhysicalMaterial({
    color: 0xece7dc,
    roughness: 0.36,
    metalness: 0.08,
    clearcoat: 0.3,
  });

  const amberCoreMat = new THREE.MeshPhysicalMaterial({
    color: 0xffa014,
    emissive: 0xe67700,
    emissiveIntensity: 0.65,
    roughness: 0.12,
    metalness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
  });

  // Central faceted Par Crystal Core + Fresnel optical halo
  const coreGroup = new THREE.Group();
  root.add(coreGroup);

  const coreMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.56, 1), amberCoreMat);
  coreGroup.add(coreMesh);

  const coreCage = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.72, 1),
    new THREE.MeshBasicMaterial({ color: 0xf39200, wireframe: true, transparent: true, opacity: 0.28 }),
  );
  coreGroup.add(coreCage);

  // Outer calibrated obsidian azimuth ring + 72 instanced brass vernier notches
  const outerRingGroup = new THREE.Group();
  outerRingGroup.rotation.set(0.32, 0, -0.18);
  root.add(outerRingGroup);

  outerRingGroup.add(new THREE.Mesh(new THREE.TorusGeometry(2.58, 0.068, 22, 128), obsidian));
  outerRingGroup.add(new THREE.Mesh(new THREE.TorusGeometry(2.47, 0.015, 12, 128), brass));

  const tickGeo = new THREE.BoxGeometry(0.022, 0.025, 0.16);
  const ticks = new THREE.InstancedMesh(tickGeo, brass, 72);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const major = i % 6 === 0;
    dummy.position.set(Math.cos(a) * 2.58, Math.sin(a) * 2.58, 0.065);
    dummy.rotation.set(0, 0, a + Math.PI / 2);
    dummy.scale.set(major ? 1.5 : 0.85, major ? 1.4 : 0.8, 1);
    dummy.updateMatrix();
    ticks.setMatrixAt(i, dummy.matrix);
  }
  ticks.instanceMatrix.needsUpdate = true;
  outerRingGroup.add(ticks);

  // Weekend cutoff crimson-copper mechanical brake arc on outer gimbal
  const barrierCurve = new THREE.CatmullRomCurve3(
    Array.from({ length: 24 }, (_, i) => {
      const a = 0.25 + (i / 23) * 0.92;
      return new THREE.Vector3(Math.cos(a) * 2.66, Math.sin(a) * 2.66, 0.09);
    }),
  );
  const barrierMat = createPulseTubeMat(0xd44018, 0.3, true);
  outerRingGroup.add(new THREE.Mesh(new THREE.TubeGeometry(barrierCurve, 32, 0.036, 10, false), barrierMat));

  // Middle tilted brushed-brass clearing gimbal with 5 orbiting institutional nodes
  const midRingGroup = new THREE.Group();
  midRingGroup.rotation.set(1.18, 0.42, 0.22);
  root.add(midRingGroup);

  midRingGroup.add(new THREE.Mesh(new THREE.TorusGeometry(2.02, 0.034, 18, 120), brass));
  const midNodes: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 20), i % 2 === 0 ? ceramic : obsidian);
    node.position.set(Math.cos(a) * 2.02, Math.sin(a) * 2.02, 0);
    midRingGroup.add(node);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.014, 10, 32), brass);
    node.add(collar);
    midNodes.push(node);
  }

  // Inner 24/7 continuous spice-amber failover rail (animated GLSL pulse tube)
  const innerRingGroup = new THREE.Group();
  innerRingGroup.rotation.set(-0.68, 0.55, 0.14);
  root.add(innerRingGroup);

  const railPts = Array.from({ length: 96 }, (_, i) => {
    const a = (i / 96) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * 1.46, Math.sin(a) * 1.46, 0);
  });
  const railCurve = new THREE.CatmullRomCurve3(railPts, true);
  const railPulseMat = createPulseTubeMat(0xf39200, 0.52, false);
  innerRingGroup.add(new THREE.Mesh(new THREE.TubeGeometry(railCurve, 128, 0.034, 12, true), railPulseMat));
  innerRingGroup.add(new THREE.Mesh(new THREE.TorusGeometry(1.46, 0.014, 12, 96), obsidian));

  const dust = createDustField(140, 3.8);
  root.add(dust);

  return {
    update(t, _dt, px, py) {
      root.rotation.y = t * 0.12 + px * 0.42;
      root.rotation.x = py * 0.28;
      coreGroup.rotation.y = -t * 0.45;
      coreGroup.rotation.x = Math.sin(t * 0.7) * 0.25;
      outerRingGroup.rotation.z = -0.18 + Math.sin(t * 0.24) * 0.12;
      midRingGroup.rotation.z = t * 0.22;
      innerRingGroup.rotation.z = -t * 0.34;
      railPulseMat.uniforms['uTime']!.value = t;
      barrierMat.uniforms['uTime']!.value = t;
      dust.rotation.y = -t * 0.04;
    },
    dispose() {
      railPulseMat.dispose();
      barrierMat.dispose();
    },
  };
}

/** 05B · Power & Compute: The Megawatt Monolith & GLSL Isoline Wavefield */
function buildPowerScene(scene: THREE.Scene, camera: THREE.PerspectiveCamera): SceneController {
  camera.fov = 34;
  camera.position.set(5.3, 4.3, 6.5);
  camera.lookAt(0, 0.15, 0);
  camera.updateProjectionMatrix();

  const key = new THREE.DirectionalLight(0xfff6e8, 2.2);
  key.position.set(5, 9, 5);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xff9a14, 3.0);
  rim.position.set(-6, 3, -5);
  scene.add(rim);

  const root = new THREE.Group();
  root.position.y = -0.35;
  scene.add(root);

  // Custom GLSL Topographic Energy Wavefield with screen-space anti-aliased amber isolines
  const fieldUniforms = {
    uTime: { value: 0 },
  };
  const fieldMat = new THREE.ShaderMaterial({
    uniforms: fieldUniforms,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying float vElev;
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vPosW;

      float heightAt(vec2 p, float t) {
        float w1 = sin(p.x * 0.95 + t * 0.75) * cos(p.y * 0.85 - t * 0.45) * 0.34;
        float w2 = sin((p.x - p.y) * 1.45 - t * 0.55) * 0.16;
        // Localized interconnection-slip depression
        vec2 dip = p - vec2(-1.45, 0.72);
        float trough = -0.62 * exp(-dot(dip, dip) * 1.15);
        // Compute campus crest
        vec2 peak = p - vec2(1.15, -0.35);
        float ridge = 0.48 * exp(-dot(peak, peak) * 0.65);
        return w1 + w2 + trough + ridge;
      }

      void main() {
        vUv = uv;
        vec3 pos = position;
        float h = heightAt(pos.xz, uTime);
        pos.y += h;
        vElev = h;

        float eps = 0.04;
        float hx = heightAt(pos.xz + vec2(eps, 0.0), uTime) - h;
        float hz = heightAt(pos.xz + vec2(0.0, eps), uTime) - h;
        vec3 n = normalize(vec3(-hx, eps, -hz));
        vNormalW = normalize(mat3(modelMatrix) * n);
        vec4 wp = modelMatrix * vec4(pos, 1.0);
        vPosW = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying float vElev;
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vPosW;

      void main() {
        vec3 N = normalize(vNormalW);
        vec3 L1 = normalize(vec3(0.55, 0.8, 0.45));
        vec3 L2 = normalize(vec3(-0.7, 0.35, -0.5));
        vec3 V = normalize(cameraPosition - vPosW);

        float diff = max(dot(N, L1), 0.0);
        float spec = pow(max(dot(N, normalize(L1 + V)), 0.0), 42.0);
        float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0) * max(dot(N, L2), 0.0);

        vec3 baseCol = vec3(0.085, 0.078, 0.070) + vec3(0.08, 0.075, 0.068) * diff;
        baseCol += vec3(0.95, 0.90, 0.82) * spec * 0.25;
        baseCol += vec3(0.95, 0.57, 0.04) * rim * 0.65;

        // Sharp anti-aliased topographic contour isolines
        float contourVal = vElev * 8.5;
        float line = abs(fract(contourVal - 0.5) - 0.5) / max(fwidth(contourVal), 0.001);
        float iso = 1.0 - min(line, 1.0);

        // Subtle architectural coordinate ticks
        vec2 gridUv = vUv * vec2(18.0, 14.0);
        vec2 g = abs(fract(gridUv - 0.5) - 0.5) / max(fwidth(gridUv), 0.001);
        float gridLine = (1.0 - min(min(g.x, g.y), 1.0)) * 0.14;

        vec3 amber = vec3(0.95, 0.57, 0.02);
        vec3 crimson = vec3(0.82, 0.22, 0.08);
        vec3 isoCol = mix(crimson, amber, smoothstep(-0.45, 0.2, vElev));

        vec3 col = baseCol + isoCol * iso * 0.62 + vec3(0.85, 0.80, 0.72) * gridLine;

        // Edge vignette fade into obsidian vitrine
        vec2 edge = abs(vUv - 0.5) * 2.0;
        float fade = smoothstep(1.0, 0.76, max(edge.x, edge.y));
        col = mix(vec3(0.058, 0.055, 0.047), col, fade);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const planeGeo = new THREE.PlaneGeometry(6.8, 5.2, 96, 72);
  planeGeo.rotateX(-Math.PI / 2);
  const fieldMesh = new THREE.Mesh(planeGeo, fieldMat);
  root.add(fieldMesh);

  // Architectural Compute Campus & Storage Monoliths rising from the field
  const ceramic = new THREE.MeshPhysicalMaterial({
    color: 0xf0ece2,
    roughness: 0.34,
    metalness: 0.06,
    clearcoat: 0.3,
  });
  const obsidian = new THREE.MeshPhysicalMaterial({
    color: 0x1c1a17,
    roughness: 0.25,
    metalness: 0.85,
    clearcoat: 0.45,
  });
  const brass = new THREE.MeshStandardMaterial({
    color: 0xd99938,
    roughness: 0.24,
    metalness: 0.92,
  });

  const monolithSpecs: Array<{ x: number; z: number; w: number; h: number; d: number; kind: 'campus' | 'storage' | 'solar' }> = [
    // Compute Campus cluster
    { x: 1.15, z: -0.35, w: 0.46, h: 1.85, d: 0.46, kind: 'campus' },
    { x: 1.68, z: -0.15, w: 0.34, h: 1.42, d: 0.34, kind: 'campus' },
    { x: 1.32, z: 0.24, w: 0.3, h: 1.18, d: 0.3, kind: 'campus' },
    // Storage Bridge cluster
    { x: -0.25, z: 0.15, w: 0.42, h: 1.26, d: 0.42, kind: 'storage' },
    { x: -0.72, z: -0.22, w: 0.32, h: 0.94, d: 0.32, kind: 'storage' },
    // Generation cluster
    { x: -1.85, z: -0.85, w: 0.36, h: 0.88, d: 0.36, kind: 'solar' },
    { x: -1.42, z: -1.12, w: 0.26, h: 0.68, d: 0.26, kind: 'solar' },
  ];

  const beaconCaps: THREE.Mesh[] = [];
  for (const m of monolithSpecs) {
    const g = new THREE.Group();
    g.position.set(m.x, m.h * 0.5 - 0.12, m.z);
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(m.w, m.h, m.d),
      m.kind === 'campus' ? ceramic : obsidian,
    );
    g.add(body);

    const collar = new THREE.Mesh(
      new THREE.BoxGeometry(m.w * 1.06, 0.055, m.d * 1.06),
      m.kind === 'solar' ? obsidian : brass,
    );
    collar.position.y = m.h * 0.5 + 0.025;
    g.add(collar);
    if (m.kind !== 'solar') beaconCaps.push(collar);
    root.add(g);
  }

  // Luminous spice-amber catenary energy arcs bridging Generation -> Storage -> Campus
  const arcA = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-1.85, 0.78, -0.85),
    new THREE.Vector3(-1.05, 1.55, -0.35),
    new THREE.Vector3(-0.25, 1.16, 0.15),
  );
  const arcB = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.25, 1.16, 0.15),
    new THREE.Vector3(0.45, 2.28, -0.1),
    new THREE.Vector3(1.15, 1.75, -0.35),
  );
  const arcC = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.72, 0.84, -0.22),
    new THREE.Vector3(0.42, 1.88, -0.25),
    new THREE.Vector3(1.68, 1.32, -0.15),
  );

  const pulseMatA = createPulseTubeMat(0xf39200, 0.58, false);
  const pulseMatB = createPulseTubeMat(0xffa424, 0.72, false);
  root.add(new THREE.Mesh(new THREE.TubeGeometry(arcA, 48, 0.022, 10, false), pulseMatA));
  root.add(new THREE.Mesh(new THREE.TubeGeometry(arcB, 56, 0.032, 12, false), pulseMatB));
  root.add(new THREE.Mesh(new THREE.TubeGeometry(arcC, 48, 0.018, 10, false), pulseMatA));

  // Pulsing crimson-ember stress ring inside the interconnection-slip trough
  const troughRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.016, 12, 48),
    new THREE.MeshBasicMaterial({ color: 0xd44018, transparent: true, opacity: 0.85 }),
  );
  troughRing.rotation.x = Math.PI / 2;
  troughRing.position.set(-1.45, -0.25, 0.72);
  root.add(troughRing);

  const dust = createDustField(120, 4.2);
  root.add(dust);

  return {
    update(t, _dt, px, py) {
      fieldUniforms.uTime.value = t;
      pulseMatA.uniforms['uTime']!.value = t;
      pulseMatB.uniforms['uTime']!.value = t;
      root.rotation.y = Math.sin(t * 0.18) * 0.22 + px * 0.36;
      root.rotation.x = py * 0.16;
      const s = 1 + Math.sin(t * 2.8) * 0.14;
      troughRing.scale.set(s, s, 1);
      dust.rotation.y = t * 0.035;
    },
    dispose() {
      fieldMat.dispose();
      pulseMatA.dispose();
      pulseMatB.dispose();
    },
  };
}

/** 05C · Trade: The Spacing Guild Navigator Geodesic Sphere */
function buildTradeScene(scene: THREE.Scene, camera: THREE.PerspectiveCamera): SceneController {
  camera.fov = 34;
  camera.position.set(0, 1.15, 8.4);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  const key = new THREE.DirectionalLight(0xfff6e8, 2.3);
  key.position.set(5, 7, 6);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xff9b14, 3.4);
  rim.position.set(-6, -2, -5);
  scene.add(rim);

  const root = new THREE.Group();
  scene.add(root);

  const R = 1.66;

  // Brushed dark-obsidian globe core
  const globeMat = new THREE.MeshPhysicalMaterial({
    color: 0x131210,
    roughness: 0.3,
    metalness: 0.84,
    clearcoat: 0.45,
    clearcoatRoughness: 0.22,
  });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 64), globeMat);
  root.add(globe);

  // Subtle metallic geodesic icosahedral mesh hugging the sphere
  const geoCage = new THREE.Mesh(
    new THREE.IcosahedronGeometry(R * 1.006, 3),
    new THREE.MeshBasicMaterial({
      color: 0xb88438,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    }),
  );
  root.add(geoCage);

  // Custom GLSL Fresnel Atmospheric Horizon Rim (crisp Dune Guild golden edge)
  const fresnelMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vPosW = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        vec3 N = normalize(vNormalW);
        vec3 V = normalize(cameraPosition - vPosW);
        float fres = pow(1.0 - max(dot(N, V), 0.0), 3.6);
        vec3 col = mix(vec3(0.95, 0.57, 0.04), vec3(1.0, 0.90, 0.68), fres);
        gl_FragColor = vec4(col, fres * 0.68);
      }
    `,
  });
  root.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.03, 48, 48), fresnelMat));

  // Tilted Machined Equatorial Azimuth Gimbal Ring + 72 brass degree ticks
  const bezelGroup = new THREE.Group();
  bezelGroup.rotation.set(Math.PI * 0.46, 0.12, -0.22);
  root.add(bezelGroup);

  const brass = new THREE.MeshStandardMaterial({
    color: 0xd99938,
    roughness: 0.24,
    metalness: 0.92,
  });
  const titanium = new THREE.MeshStandardMaterial({
    color: 0x2c2924,
    roughness: 0.3,
    metalness: 0.88,
  });
  bezelGroup.add(new THREE.Mesh(new THREE.TorusGeometry(R * 1.34, 0.036, 16, 120), titanium));
  bezelGroup.add(new THREE.Mesh(new THREE.TorusGeometry(R * 1.28, 0.012, 12, 120), brass));

  const tickGeo = new THREE.BoxGeometry(0.018, 0.02, 0.12);
  const ticks = new THREE.InstancedMesh(tickGeo, brass, 72);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const major = i % 6 === 0;
    dummy.position.set(Math.cos(a) * R * 1.34, Math.sin(a) * R * 1.34, 0.036);
    dummy.rotation.set(0, 0, a + Math.PI / 2);
    dummy.scale.set(major ? 1.5 : 0.8, major ? 1.4 : 0.8, 1);
    dummy.updateMatrix();
    ticks.setMatrixAt(i, dummy.matrix);
  }
  ticks.instanceMatrix.needsUpdate = true;
  bezelGroup.add(ticks);

  // Front-hemisphere great-circle maritime routes & beacons
  const sphVec = (lat: number, lon: number, rad = R): THREE.Vector3 => {
    const cl = Math.cos(lat);
    return new THREE.Vector3(cl * Math.sin(lon) * rad, Math.sin(lat) * rad, cl * Math.cos(lon) * rad);
  };

  const makeGreatCircle = (a: [number, number], b: [number, number], peakBoost = 0.24): THREE.CatmullRomCurve3 => {
    const va = sphVec(a[0], a[1], 1).normalize();
    const vb = sphVec(b[0], b[1], 1).normalize();
    const pts: THREE.Vector3[] = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const v = va.clone().lerp(vb, u).normalize();
      const boost = R * (1.015 + peakBoost * Math.sin(u * Math.PI));
      pts.push(v.multiplyScalar(boost));
    }
    return new THREE.CatmullRomCurve3(pts);
  };

  // Front-facing hubs (centered cleanly around lon = 0 facing camera +Z)
  const originPort: [number, number] = [-0.08, -0.78];
  const straitChoke: [number, number] = [0.22, 0.02];
  const destPort: [number, number] = [0.56, 0.72];
  const southernCape: [number, number] = [-0.64, 0.12];

  // Blocked strait corridor (pulsing dashed crimson-copper)
  const blockedMat = createPulseTubeMat(0xe0461a, 0.35, true);
  root.add(new THREE.Mesh(new THREE.TubeGeometry(makeGreatCircle(originPort, straitChoke, 0.08), 40, 0.022, 10, false), blockedMat));
  root.add(new THREE.Mesh(new THREE.TubeGeometry(makeGreatCircle(straitChoke, destPort, 0.08), 40, 0.022, 10, false), blockedMat));

  // Spice-amber Guild Navigator elevated great-circle reroute corridor
  const rerouteMat = createPulseTubeMat(0xf39200, 0.52, false);
  root.add(new THREE.Mesh(new THREE.TubeGeometry(makeGreatCircle(originPort, southernCape, 0.24), 56, 0.032, 12, false), rerouteMat));
  root.add(new THREE.Mesh(new THREE.TubeGeometry(makeGreatCircle(southernCape, destPort, 0.24), 56, 0.032, 12, false), rerouteMat));

  // Precision metallic beacon pins at each hub
  const addBeacon = (coord: [number, number], col: number, scale = 1): THREE.Mesh => {
    const pos = sphVec(coord[0], coord[1], R * 1.02);
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.068 * scale, 16, 16),
      new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 0.65,
        roughness: 0.2,
        metalness: 0.6,
      }),
    );
    m.position.copy(pos);
    root.add(m);
    return m;
  };

  addBeacon(originPort, 0xf0ece2, 1.0);
  addBeacon(destPort, 0xf0ece2, 1.0);
  addBeacon(southernCape, 0xf39200, 1.05);
  const chokeBeacon = addBeacon(straitChoke, 0xe0461a, 1.15);

  const chokeRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.015, 10, 32),
    new THREE.MeshBasicMaterial({ color: 0xe0461a, transparent: true, opacity: 0.85 }),
  );
  chokeRing.position.copy(chokeBeacon.position);
  chokeRing.lookAt(chokeBeacon.position.clone().multiplyScalar(2));
  root.add(chokeRing);

  const dust = createDustField(140, 3.8);
  root.add(dust);

  return {
    update(t, _dt, px, py) {
      // Gentle Guild orbital precession keeping routes squarely front-facing
      root.rotation.y = Math.sin(t * 0.24) * 0.26 + px * 0.42;
      root.rotation.x = 0.08 + py * 0.26;
      bezelGroup.rotation.z = -0.22 + t * 0.08;
      blockedMat.uniforms['uTime']!.value = t;
      rerouteMat.uniforms['uTime']!.value = t;
      const pulse = 1 + Math.sin(t * 3.2) * 0.2;
      chokeRing.scale.set(pulse, pulse, 1);
      dust.rotation.y = -t * 0.03;
    },
    dispose() {
      fresnelMat.dispose();
      blockedMat.dispose();
      rerouteMat.dispose();
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

    const { pmrem, envTex } = createStudioEnv(renderer, 'vitrine');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0e0c);
    scene.environment = envTex;

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
      const panel = canvas.closest<HTMLElement>('[role="tabpanel"]');
      if (!visible || document.hidden || panel?.hidden) {
        raf = 0;
        return;
      }
      renderFrame(now);
      if (!reduced) raf = requestAnimationFrame(loop);
      else raf = 0;
    };

    const wake = (): void => {
      const panel = canvas.closest<HTMLElement>('[role="tabpanel"]');
      if (panel?.hidden) return;
      resize();
      lastNow = performance.now();
      renderFrame(lastNow);
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
        if (!panel.hidden) {
          // Allow layout paint before measuring bounding rect
          requestAnimationFrame(wake);
        }
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

    window.addEventListener('beforeunload', () => {
      controller.dispose();
      pmrem.dispose();
      envTex.dispose();
      renderer.dispose();
    });

    wake();
  }
}
