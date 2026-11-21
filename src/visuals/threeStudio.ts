/**
 * Shared Three.js PBR studio lighting & procedural HDRI environment generator.
 * Produces softbox architectural reflections (matte porcelain, anodized titanium,
 * brushed spice-brass, frosted optical acrylic) with zero external HDRI downloads.
 */
import * as THREE from 'three';

export interface StudioRig {
  renderer: THREE.WebGLRenderer;
  pmrem: THREE.PMREMGenerator;
  envTex: THREE.Texture;
  dispose: () => void;
}

/**
 * Generates a high-contrast architectural studio softbox environment texture.
 * - `mode: 'paper'`  -> bright alabaster studio cyclorama with soft overhead key & warm amber edge strip
 * - `mode: 'vitrine'` -> smoked obsidian museum vitrine with razor-sharp white overhead softboxes & warm amber rim strips
 */
export function createStudioEnv(
  renderer: THREE.WebGLRenderer,
  mode: 'paper' | 'vitrine',
): { pmrem: THREE.PMREMGenerator; envTex: THREE.Texture } {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(mode === 'paper' ? 0xf2efe8 : 0x0c0b0a);

  const addPanel = (
    w: number,
    h: number,
    pos: [number, number, number],
    rot: [number, number, number],
    color: number,
    intensity: number,
  ): void => {
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(intensity),
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    envScene.add(mesh);
  };

  if (mode === 'paper') {
    // Overhead soft architectural skylight
    addPanel(26, 26, [0, 14, 0], [Math.PI / 2, 0, 0], 0xfffdf8, 2.2);
    // Warm architectural left key softbox
    addPanel(16, 12, [-14, 6, 8], [0, Math.PI / 3, 0], 0xfff8ee, 1.8);
    // Crisp neutral right fill
    addPanel(14, 10, [14, 4, 6], [0, -Math.PI / 2.6, 0], 0xece8df, 1.3);
    // Signature spice-amber accent strip for subtle metallic/acrylic edge bounce
    addPanel(10, 2.2, [6, 5, -12], [0, 0, 0], 0xff9a14, 3.2);
    // Subtle warm floor bounce
    addPanel(28, 28, [0, -12, 0], [-Math.PI / 2, 0, 0], 0xe7e2d7, 1.0);
  } else {
    // Museum vitrine: sharp architectural strip lights over obsidian void
    addPanel(20, 6, [0, 13, 2], [Math.PI / 2.1, 0, 0], 0xfffaf0, 3.4);
    addPanel(3.5, 16, [-13, 4, 7], [0, Math.PI / 3, 0], 0xf5efe4, 2.6);
    addPanel(2.4, 14, [13, 2, -6], [0, -Math.PI / 1.4, 0], 0xff9a14, 5.5);
    addPanel(14, 1.8, [0, -7, -11], [-Math.PI / 5, 0, 0], 0xf39200, 3.6);
    addPanel(10, 10, [8, 9, 10], [Math.PI / 4, -Math.PI / 4, 0], 0xffffff, 1.6);
  }

  const rt = pmrem.fromScene(envScene, 0.035);
  // Clean up temporary geometry/materials in envScene
  envScene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
      else obj.material.dispose();
    }
  });

  return { pmrem, envTex: rt.texture };
}

export function createRenderer(canvas: HTMLCanvasElement, alpha = false): THREE.WebGLRenderer | null {
  try {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha,
      powerPreference: 'high-performance',
    });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    return renderer;
  } catch {
    return null;
  }
}

export function damp(cur: number, target: number, lambda: number, dt: number): number {
  return THREE.MathUtils.lerp(cur, target, 1 - Math.exp(-lambda * Math.min(dt, 0.08)));
}
