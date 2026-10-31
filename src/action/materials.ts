import * as THREE from "three";

// Original generated surface colour maps; deterministic fine bump/roughness is separate.
function grain(seed: number, base: number, range: number, scale = 1) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!,
    pixels = ctx.createImageData(256, 256);
  let n = seed;
  for (let i = 0; i < 256 * 256; i++) {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    const value = Math.max(
      0,
      Math.min(255, base + ((n >>> 16) / 65535 - 0.5) * range),
    );
    for (let c = 0; c < 3; c++) pixels.data[i * 4 + c] = value;
    pixels.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(scale, scale);
  texture.anisotropy = 4;
  return texture;
}
export function architecturalMaterials() {
  let loaded = 0;
  const loader = new THREE.TextureLoader(),
    load = (file: string, repeat = 1) => {
      const t = loader.load(
        `${import.meta.env.BASE_URL}textures/polish/${file}`,
        () => loaded++,
        undefined,
        (error) =>
          console.error(`Architectural texture failed: ${file}`, error),
      );
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeat, repeat);
      t.anisotropy = 8;
      return t;
    };
  const concrete = load("concrete.webp", 0.55),
    asphalt = load("asphalt.webp", 1.4),
    earthMap = load("earth.webp", 0.65),
    rough = grain(83, 210, 30, 2),
    fine = grain(374, 128, 45, 3),
    soil = grain(919, 140, 55, 0.7);
  const m = (color: number, roughness = 0.8) =>
    new THREE.MeshStandardMaterial({ color, roughness });
  const stone = new THREE.MeshStandardMaterial({
    color: 0xeee6d7,
    map: concrete,
    roughness: 0.91,
    bumpMap: fine,
    bumpScale: 0.012,
    roughnessMap: rough,
  });
  stone.envMapIntensity = 0.45;
  const paving = stone.clone();
  paving.color.setHex(0xc5bfb1);
  paving.bumpScale = 0.006;
  const road = new THREE.MeshStandardMaterial({
    color: 0xb2b4b2,
    map: asphalt,
    roughness: 0.94,
    bumpMap: fine,
    bumpScale: 0.008,
  });
  const earth = new THREE.MeshStandardMaterial({
    color: 0xdad0b8,
    map: earthMap,
    roughness: 0.97,
    bumpMap: fine,
    bumpScale: 0.023,
  });
  const foliage = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.94,
    vertexColors: true,
    side: THREE.DoubleSide,
  });
  const grass = new THREE.MeshStandardMaterial({
    color: 0x78805b,
    map: soil,
    roughness: 1,
    bumpMap: fine,
    bumpScale: 0.024,
  });
  return {
    get texturesLoaded() {
      return loaded === 3;
    },
    cream: stone,
    ivory: stone.clone(),
    frame: stone.clone(),
    lip: paving,
    road,
    mark: m(0xd6d1bb, 0.95),
    sage: earth,
    quiet: grass,
    water: new THREE.MeshPhysicalMaterial({
      color: 0x3b7374,
      roughness: 0.28,
      metalness: 0.08,
      clearcoat: 0.55,
      clearcoatRoughness: 0.28,
      bumpMap: fine.clone(),
      bumpScale: 0.017,
    }),
    teal: new THREE.MeshPhysicalMaterial({
      color: 0x33434b,
      roughness: 0.22,
      metalness: 0.35,
      clearcoat: 0.5,
    }),
    gold: m(0xcb9d42, 0.55),
    roof: paving.clone(),
    trunk: m(0x655d4c, 0.98),
    leaf: m(0x526349, 0.94),
    leafLight: m(0x748263, 0.94),
    rock: Object.assign(stone.clone(), { color: new THREE.Color(0xa69e8a) }),
    steel: m(0x6c7472, 0.32),
    ballast: earth.clone(),
    foliage,
    shelterGlass: new THREE.MeshPhysicalMaterial({
      color: 0x8da2a1,
      roughness: 0.12,
      metalness: 0.05,
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x263d44,
      roughness: 0.16,
      metalness: 0.4,
      clearcoat: 1,
    }),
    soil: earth.clone(),
    paving,
  };
}
export function surfaceUV(geometry: THREE.BufferGeometry) {
  const p = geometry.getAttribute("position"),
    normal = geometry.getAttribute("normal");
  if (!p) return geometry;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(normal?.getX(i) || 0),
      ny = normal ? Math.abs(normal.getY(i)) : 1,
      nz = Math.abs(normal?.getZ(i) || 0);
    if (ny >= nx && ny >= nz) {
      uv[i * 2] = p.getX(i);
      uv[i * 2 + 1] = p.getZ(i);
    } else if (nx > nz) {
      uv[i * 2] = p.getZ(i);
      uv[i * 2 + 1] = p.getY(i);
    } else {
      uv[i * 2] = p.getX(i);
      uv[i * 2 + 1] = p.getY(i);
    }
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geometry;
}
