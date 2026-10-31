import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { MapNode, Point, Corridor } from "../types";
import type { Mission, GameState, SceneUI, Pick, Bus } from "./types";
import {
  vehiclePosition,
  walkingPosition,
  corridorPoints,
  pair,
} from "./model";

const C = {
  grass: 0x668e3d,
  grassLight: 0x7aa04a,
  cream: 0xfff4da,
  wall: 0xf2e3bd,
  roof: 0xc76e43,
  blue: 0x275c7b,
  navy: 0x173f5c,
  ochre: 0xf3ad3e,
  asphalt: 0x73808a,
  curb: 0xe8dfc6,
  sea: 0x3ca4bd,
  trunk: 0x876843,
};
const material = (color: number, roughness = 0.88) =>
  new THREE.MeshStandardMaterial({ color, roughness });
const vec = (p: Point, dy = 0) => new THREE.Vector3(p.x, p.h + dy, p.z);
const random = (seed: number) => {
  const n = Math.sin(seed * 91.37 + 17.8) * 47812.173;
  return n - Math.floor(n);
};
const distanceToSegment = (x: number, z: number, a: Point, b: Point) => {
  const dx = b.x - a.x,
    dz = b.z - a.z,
    t = THREE.MathUtils.clamp(
      ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1),
      0,
      1,
    );
  return { distance: Math.hypot(x - a.x - t * dx, z - a.z - t * dz), t };
};

/** The scene is a view of the authored transport model. Roads/vehicles use its exact paths. */
export class TownScene {
  renderer: THREE.WebGLRenderer;
  camera = new THREE.OrthographicCamera(-10, 10, 7, -7, 0.1, 160);
  scene = new THREE.Scene();
  busLoaded = false;
  fps = 0;
  private servicePlaces = new Map<
    string,
    { built: THREE.Group; pad: THREE.Group }
  >();
  private placesWorld = new THREE.Group();
  private staticWorld = new THREE.Group();
  private roadWorld = new THREE.Group();
  private lineWorld = new THREE.Group();
  private previewWorld = new THREE.Group();
  private moving = new THREE.Group();
  private mission: Mission | null = null;
  private currentState: GameState | null = null;
  private width = 1;
  private height = 1;
  private lineKey = "";
  private previewKey = "";
  private vehicleMeshes = new Map<number, THREE.Object3D>();
  private busTemplate: THREE.Group | null = null;
  private depot = new THREE.Group();
  private labels = new Map<string, HTMLButtonElement>();
  private bubble: HTMLDivElement;
  private lastFrame = performance.now();
  private fpsFrames = 0;
  private fpsStart = performance.now();
  private elapsed = 0;
  private mats = {
    cream: material(C.cream),
    wall: material(C.wall),
    roof: material(C.roof),
    blue: material(C.blue),
    navy: material(C.navy),
    ochre: material(C.ochre),
    grass: material(C.grass),
    leaf: material(0x477e42),
    leafLight: material(0x65984b),
    trunk: material(C.trunk),
    curb: material(C.curb),
    asphalt: material(C.asphalt),
    white: material(0xfff5df),
    metal: material(0x647b85, 0.5),
  };
  private previousPeople = new Map<number, string>();
  private boarding: {
    id: number;
    node: string;
    vehicle: number;
    start: number;
  }[] = [];
  private previewMaterial = new THREE.MeshBasicMaterial({
    color: C.ochre,
    transparent: true,
    opacity: 0.85,
    depthTest: false,
  });
  private personMeshes: THREE.InstancedMesh[] = [];
  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private target = new THREE.Vector3();
  private bounds = new THREE.Box3();
  constructor(
    private canvas: HTMLCanvasElement,
    private labelRoot: HTMLElement,
    private onNode: (id: string) => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene.background = new THREE.Color(0x9ed6d5);
    this.scene.fog = new THREE.Fog(0xb7dad0, 52, 100);
    this.scene.add(new THREE.HemisphereLight(0xfff7df, 0x7d9f74, 2.1));
    const sun = new THREE.DirectionalLight(0xfff0ce, 2.8);
    sun.position.set(-12, 24, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -25,
      right: 25,
      top: 23,
      bottom: -23,
      far: 70,
    });
    sun.shadow.normalBias = 0.035;
    sun.shadow.bias = -0.00012;
    this.scene.add(sun);
    this.mats.roof.side = THREE.DoubleSide;
    this.mats.leaf.flatShading = true;
    this.mats.leafLight.flatShading = true;
    this.scene.add(
      this.staticWorld,
      this.placesWorld,
      this.roadWorld,
      this.lineWorld,
      this.previewWorld,
      this.moving,
    );
    this.moving.add(this.depot);
    this.createPeople();
    this.labelRoot.style.pointerEvents = "none";
    this.bubble = document.createElement("div");
    Object.assign(this.bubble.style, {
      position: "absolute",
      left: "0",
      top: "0",
      padding: "7px 12px",
      borderRadius: "13px",
      font: "700 14px Heebo,sans-serif",
      color: "#163f58",
      background: "#fff7e5",
      boxShadow: "0 4px 16px #153b4926",
      whiteSpace: "nowrap",
      pointerEvents: "none",
      display: "none",
      zIndex: "4",
    });
    this.bubble.setAttribute("role", "status");
    this.labelRoot.append(this.bubble);
    new GLTFLoader().load(
      `${import.meta.env.BASE_URL}models/bus.glb`,
      (g) => {
        this.busTemplate = g.scene;
        g.scene.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.castShadow = true;
            o.receiveShadow = true;
          }
        });
        this.busLoaded = true;
        this.clearVehicleMeshes();
        this.makeDepot();
      },
      undefined,
      (e) => console.error("Original Tripo bus failed to load", e),
    );
    window.addEventListener("resize", () => this.resize());
    this.resize();
  }
  private clear(group: THREE.Group) {
    for (const child of [...group.children]) {
      group.remove(child);
      child.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Line)
          o.geometry.dispose();
      });
    }
  }
  private box(
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
  ) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y + h / 2, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  private cylinder(
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    mat: THREE.Material,
    segments = 8,
  ) {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, h, segments),
      mat,
    );
    m.position.set(x, y + h / 2, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  private canBuild(c: Corridor) {
    if (!this.mission || c.forbidden) return false;
    const ps = corridorPoints(this.mission, c);
    let max = 0;
    for (let i = 1; i < ps.length; i++)
      max = Math.max(
        max,
        Math.abs(ps[i].h - ps[i - 1].h) /
          (Math.hypot(ps[i].x - ps[i - 1].x, ps[i].z - ps[i - 1].z) || 1),
      );
    return max < 0.43;
  }
  private heightAt(x: number, z: number) {
    const m = this.mission!;
    if (m.id === 1) return 0.08;
    let weight = 0,
      sum = 0;
    for (const n of m.nodes) {
      const w = 1 / Math.pow(0.8 + Math.hypot(x - n.x, z - n.z), 2.5);
      weight += w;
      sum += n.h * w;
    }
    let h = sum / weight;
    for (const c of m.corridors) {
      for (const p of c.via || []) {
        h +=
          Math.max(0, p.h - h) *
          Math.exp(-Math.pow(Math.hypot(x - p.x, z - p.z) / 1.65, 2)) *
          0.8;
      }
    }
    for (const c of m.corridors) {
      if (c.forbidden || !this.canBuild(c) || c.bridge) continue;
      const ps = corridorPoints(m, c);
      for (let i = 1; i < ps.length; i++) {
        const a = ps[i - 1],
          b = ps[i],
          d = distanceToSegment(x, z, a, b);
        if (d.distance < 1.75) {
          const w =
            d.distance < 0.84
              ? 1
              : Math.pow(1 - (d.distance - 0.84) / 0.91, 1.5);
          h = THREE.MathUtils.lerp(h, a.h + (b.h - a.h) * d.t - 0.035, w);
        }
      }
    }
    return h;
  }
  private coastX(z: number) {
    const west = Math.min(...this.mission!.nodes.map((n) => n.x)) - 4.6;
    return west + Math.sin(z * 0.34) * 0.45 + Math.sin(z * 0.77) * 0.14;
  }
  private riverX(z: number) {
    const bridges = this.mission!.corridors.filter((c) => c.bridge);
    if (!bridges.length) return 100;
    const centers = bridges.map((c) => {
      const ps = corridorPoints(this.mission!, c);
      return {
        x: (ps[0].x + ps.at(-1)!.x) / 2,
        z: (ps[0].z + ps.at(-1)!.z) / 2,
      };
    });
    const nearest = centers.reduce((a, b) =>
      Math.abs(a.z - z) < Math.abs(b.z - z) ? a : b,
    );
    return nearest.x + Math.sin((z - nearest.z) * 0.33) * 0.23;
  }
  setLevel(m: Mission) {
    this.mission = m;
    this.currentState = null;
    this.previousPeople.clear();
    this.boarding = [];
    this.lineKey = "";
    this.previewKey = "";
    this.clear(this.staticWorld);
    this.clear(this.placesWorld);
    this.servicePlaces.clear();
    this.clear(this.roadWorld);
    this.clear(this.lineWorld);
    this.clear(this.previewWorld);
    this.clearVehicleMeshes();
    for (const el of this.labels.values()) el.remove();
    this.labels.clear();
    this.buildLandscape();
    this.buildStreets();
    for (const n of m.nodes) {
      this.buildPlace(n);
      this.addLandmark(n);
    }
    this.buildGroves();
    this.batch(this.staticWorld);
    this.batch(this.roadWorld);
    this.makeDepot();
    this.fitCamera();
  }
  private buildLandscape() {
    const m = this.mission!,
      seaMat = material(C.sea, 0.45);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(100, 90), seaMat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(-20, -0.2, 0);
    this.staticWorld.add(sea);
    const west = Math.min(...m.nodes.map((n) => n.x)) - 7,
      east = Math.max(...m.nodes.map((n) => n.x)) + 14,
      north = Math.min(...m.nodes.map((n) => n.z)) - 13,
      south = Math.max(...m.nodes.map((n) => n.z)) + 13;
    const g = new THREE.PlaneGeometry(east - west, south - north, 160, 130);
    g.rotateX(-Math.PI / 2);
    g.translate((west + east) / 2, 0, (south + north) / 2);
    const p = g.attributes.position,
      colors = new Float32Array(p.count * 3);
    const river = m.corridors.some((c) => c.bridge);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        z = p.getZ(i),
        coast = this.coastX(z),
        isRiver = river && Math.abs(x - this.riverX(z)) < 0.92;
      let h = this.heightAt(x, z);
      const coastBlend = THREE.MathUtils.smoothstep(
        x,
        coast - 0.35,
        coast + 0.7,
      );
      h = THREE.MathUtils.lerp(-0.31, h, coastBlend);
      if (isRiver) h = -0.3;
      else if (river) {
        const rd = Math.abs(x - this.riverX(z));
        if (rd < 1.4) h = THREE.MathUtils.lerp(-0.15, h, (rd - 0.92) / 0.48);
      }
      p.setY(i, h);
      const color = new THREE.Color(x < coast + 0.8 ? 0xe6d8ab : C.grass);
      color.lerp(new THREE.Color(C.grassLight), random(i) * 0.12);
      color.toArray(colors, i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    const terrain = new THREE.Mesh(
      g,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }),
    );
    terrain.receiveShadow = true;
    this.staticWorld.add(terrain);
    const whiteLine: number[] = [];
    for (let z = north; z < south; z += 0.5) {
      const x = this.coastX(z);
      whiteLine.push(x - 0.22, -0.17, z, x - 0.1, -0.17, z + 0.22);
    }
    const wg = new THREE.BufferGeometry();
    wg.setAttribute("position", new THREE.Float32BufferAttribute(whiteLine, 3));
    this.staticWorld.add(
      new THREE.LineSegments(
        wg,
        new THREE.LineBasicMaterial({
          color: 0xd4eeea,
          transparent: true,
          opacity: 0.65,
        }),
      ),
    );
    // Coherent shore boulders and a handful of distant palms replace the old rectangular sea slab.
    for (let i = 0; i < 24; i++) {
      const z = north + 3 + (south - north - 6) * random(i + 4),
        x = this.coastX(z) + 0.2;
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.18 + random(i + 8) * 0.2, 0),
        material(i % 2 ? 0xb3b39a : 0xcbd1bc),
      );
      rock.position.set(x, 0.03, z);
      rock.scale.y = 0.65;
      rock.rotation.y = i;
      rock.castShadow = true;
      this.staticWorld.add(rock);
    }
  }
  private ribbon(
    points: THREE.Vector3[],
    width: number,
    mat: THREE.Material,
    parent: THREE.Object3D,
    offset = 0,
  ) {
    const vertices: number[] = [],
      indices: number[] = [];
    for (let i = 0; i < points.length; i++) {
      const prev = points[Math.max(0, i - 1)],
        next = points[Math.min(points.length - 1, i + 1)],
        d = next.clone().sub(prev).setY(0).normalize(),
        side = new THREE.Vector3(-d.z, 0, d.x);
      for (const sign of [-1, 1]) {
        const p = points[i]
          .clone()
          .addScaledVector(side, offset + (sign * width) / 2);
        vertices.push(p.x, p.y, p.z);
      }
      if (i) {
        const k = i * 2;
        indices.push(k - 2, k - 1, k, k - 1, k + 1, k);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, mat);
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  private sample(ps: Point[], spacing = 0.15) {
    const out: THREE.Vector3[] = [];
    for (let i = 1; i < ps.length; i++) {
      const a = vec(ps[i - 1]),
        b = vec(ps[i]),
        count = Math.max(1, Math.ceil(a.distanceTo(b) / spacing));
      for (let j = 0; j < count; j++) out.push(a.clone().lerp(b, j / count));
    }
    out.push(vec(ps.at(-1)!));
    return out;
  }
  private buildStreets() {
    for (const c of this.mission!.corridors) {
      if (!this.canBuild(c)) continue;
      const raw = corridorPoints(this.mission!, c),
        ps = this.sample(raw).map((p) => p.add(new THREE.Vector3(0, 0.045, 0)));
      if (c.modes?.length === 1 && c.modes[0] === "rail") continue;
      this.ribbon(ps, 1.95, this.mats.curb, this.roadWorld);
      this.ribbon(
        ps.map((p) => p.clone().add(new THREE.Vector3(0, 0.009, 0))),
        1.52,
        this.mats.asphalt,
        this.roadWorld,
        0.0,
      );
      this.ribbon(
        ps.map((p) => p.clone().add(new THREE.Vector3(0, 0.019, 0))),
        0.035,
        this.mats.white,
        this.roadWorld,
        -0.69,
      );
      this.ribbon(
        ps.map((p) => p.clone().add(new THREE.Vector3(0, 0.019, 0))),
        0.035,
        this.mats.white,
        this.roadWorld,
        0.69,
      );
      for (let i = 3; i < ps.length - 2; i += 7) {
        const a = ps[i],
          b = ps[Math.min(ps.length - 1, i + 2)],
          dash = this.box(
            this.roadWorld,
            a.x,
            a.y + 0.026,
            a.z,
            0.035,
            0.009,
            0.25,
            this.mats.white,
          );
        dash.lookAt(b.x, dash.position.y, b.z);
      }
      if (c.bridge) {
        for (const side of [-1, 1]) {
          this.ribbon(
            ps.map((p) => p.clone().add(new THREE.Vector3(0, 0.22, 0))),
            0.065,
            this.mats.wall,
            this.roadWorld,
            side * 0.9,
          );
          for (let i = 0; i < ps.length; i += 4) {
            const p = ps[i],
              d = ps[Math.min(i + 1, ps.length - 1)]
                .clone()
                .sub(ps[Math.max(i - 1, 0)])
                .setY(0)
                .normalize(),
              s = new THREE.Vector3(-d.z, 0, d.x);
            this.box(
              this.roadWorld,
              p.x + s.x * 0.9 * side,
              p.y,
              p.z + s.z * 0.9 * side,
              0.065,
              0.24,
              0.065,
              this.mats.wall,
            );
          }
        }
        for (let i = 3; i < ps.length - 3; i += 7) {
          const p = ps[i];
          this.box(
            this.roadWorld,
            p.x,
            -0.27,
            p.z,
            0.24,
            p.y + 0.27,
            0.28,
            this.mats.wall,
          );
        }
      }
    }
    // Shared round caps make separately authored street ribbons form one coherent junction.
    for (const n of this.mission!.nodes) {
      const hasStreet = this.mission!.corridors.some(
        (c) =>
          (c.a === n.id || c.b === n.id) &&
          this.canBuild(c) &&
          !(c.modes?.length === 1 && c.modes[0] === "rail"),
      );
      if (!hasStreet) continue;
      for (const [radius, dy, mat] of [
        [0.975, 0.046, this.mats.curb],
        [0.76, 0.059, this.mats.asphalt],
      ] as const) {
        const cap = new THREE.Mesh(new THREE.CircleGeometry(radius, 32), mat);
        cap.rotation.x = -Math.PI / 2;
        cap.position.set(n.x, n.h + dy, n.z);
        cap.receiveShadow = true;
        this.roadWorld.add(cap);
      }
    }
  }
  private roof(
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
  ) {
    const shape = new THREE.BufferGeometry(),
      h = 0.32;
    const verts = [
      -w / 2,
      0,
      -d / 2,
      w / 2,
      0,
      -d / 2,
      0,
      h,
      -d / 2,
      -w / 2,
      0,
      d / 2,
      0,
      h,
      d / 2,
      w / 2,
      0,
      d / 2,
      -w / 2,
      0,
      -d / 2,
      0,
      h,
      -d / 2,
      0,
      h,
      d / 2,
      -w / 2,
      0,
      -d / 2,
      0,
      h,
      d / 2,
      -w / 2,
      0,
      d / 2,
      w / 2,
      0,
      -d / 2,
      w / 2,
      0,
      d / 2,
      0,
      h,
      d / 2,
      w / 2,
      0,
      -d / 2,
      0,
      h,
      d / 2,
      0,
      h,
      -d / 2,
    ];
    shape.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    shape.computeVertexNormals();
    const r = new THREE.Mesh(shape, this.mats.roof);
    r.position.set(x, y, z);
    r.castShadow = true;
    parent.add(r);
  }
  private home(
    parent: THREE.Object3D,
    x: number,
    z: number,
    w: number,
    h: number,
    d: number,
    seed: number,
  ) {
    this.box(parent, x, 0, z, w, h, d, this.mats.cream);
    this.roof(parent, x, h, z, w + 0.18, d + 0.18);
    for (const side of [-1, 1]) {
      this.box(
        parent,
        x + side * w * 0.27,
        h * 0.52,
        z + d / 2 + 0.015,
        0.22,
        0.34,
        0.025,
        this.mats.blue,
      );
      this.box(
        parent,
        x + side * w * 0.27,
        h * 0.52 - 0.025,
        z + d / 2 + 0.035,
        0.028,
        0.34,
        0.02,
        this.mats.white,
      );
    }
    this.box(
      parent,
      x,
      0,
      z + d / 2 + 0.035,
      0.25,
      0.53,
      0.025,
      this.mats.navy,
    );
    if (h > 1.4) {
      for (const side of [-1, 1])
        this.box(
          parent,
          x + side * w * 0.27,
          h * 0.78,
          z + d / 2 + 0.015,
          0.22,
          0.27,
          0.025,
          this.mats.blue,
        );
    }
    if (seed % 2 === 0)
      this.box(
        parent,
        x,
        0.54,
        z + d / 2 + 0.18,
        0.55,
        0.055,
        0.35,
        this.mats.ochre,
      );
  }
  private buildPlace(n: MapNode) {
    if (n.kind === "junction") return;
    const g = new THREE.Group();
    g.position.set(n.x, n.h, n.z);
    const nearest = Math.min(
      Infinity,
      ...this.mission!.nodes.filter(
        (p) => p.id !== n.id && p.kind !== "junction",
      ).map((p) => Math.hypot(p.x - n.x, p.z - n.z)),
    );
    const placeScale =
      this.mission!.id <= 2 ? 1 : THREE.MathUtils.clamp(nearest / 4.5, 0.6, 1);
    g.scale.setScalar(placeScale);
    const planned = this.mission!.serviceSites.includes(n.id);
    (planned ? this.placesWorld : this.staticWorld).add(g);
    const M = this.mats;
    if (n.kind === "home") {
      this.box(g, 0, -0.035, -1.55, 4.8, 0.055, 2.25, M.curb);
      this.home(g, -1.48, -1.7, 1.16, 1.35, 0.95, 0);
      this.home(g, 0, -2.1, 1.25, 1.8, 1.06, 1);
      this.home(g, 1.5, -1.65, 1.12, 1.18, 0.94, 2);
      for (let i = 0; i < 5; i++)
        this.box(g, -2.3 + i * 0.98, 0, -0.95, 0.08, 0.38, 0.08, M.wall);
      this.box(g, 0, 0.12, -0.95, 4.6, 0.13, 0.08, M.wall);
      this.tree(g, -2.45, -1.6, 0.9, 1);
      this.tree(g, 2.5, -1.8, 0.9, 2);
    } else if (n.kind === "school") {
      this.box(g, 0, -0.025, -1.7, 4.9, 0.055, 3.3, M.curb);
      this.box(g, -1.1, 0, -2.6, 2.25, 1.65, 1.25, M.cream);
      this.box(g, 1.2, 0, -2.15, 2.1, 1.35, 1.4, M.cream);
      this.box(g, -1.1, 1.65, -2.6, 2.34, 0.08, 1.34, M.wall);
      this.box(g, 1.2, 1.35, -2.15, 2.18, 0.08, 1.48, M.wall);
      for (let i = 0; i < 8; i++)
        this.box(g, -2.02 + i * 0.53, 0.65, -1.45, 0.25, 0.4, 0.028, M.blue);
      this.box(g, 0.45, 0, -1.42, 0.55, 0.78, 0.035, M.blue);
      const courtMat = material(0x6bafc0);
      this.box(g, -0.7, 0.035, -0.83, 2.1, 0.035, 1.0, courtMat);
      for (const side of [-1, 1])
        this.box(
          g,
          -0.7 + side * 0.98,
          0.076,
          -0.83,
          0.025,
          0.009,
          1.0,
          M.white,
        );
      this.box(g, -0.7, 0.077, -0.83, 2.0, 0.009, 0.025, M.white);
      const courtCircle = new THREE.Mesh(
        new THREE.RingGeometry(0.18, 0.195, 24),
        M.white,
      );
      courtCircle.rotation.x = -Math.PI / 2;
      courtCircle.position.set(-0.7, 0.079, -0.83);
      g.add(courtCircle);
      for (const side of [-1, 1]) {
        this.box(
          g,
          -0.7 + side * 0.81,
          0.079,
          -0.83,
          0.32,
          0.008,
          0.48,
          M.ochre,
        );
        this.box(
          g,
          -0.7 + side * 1.04,
          0.08,
          -0.83,
          0.025,
          0.38,
          0.025,
          M.metal,
        );
        this.box(g, -0.7 + side * 1.04, 0.4, -0.83, 0.04, 0.19, 0.28, M.white);
      }
      for (const side of [-1, 1]) {
        this.box(g, side * 2.35, 0, -1.2, 0.085, 0.4, 2.4, M.wall);
        this.box(g, side * 1.35, 0, -0.16, 1.65, 0.4, 0.1, M.wall);
      }
      for (let i = 0; i < 7; i++)
        this.box(g, -0.56 + i * 0.18, 0, -0.15, 0.035, 0.48, 0.04, M.blue);
      this.box(g, 0, 0.45, -0.15, 1.2, 0.04, 0.05, M.blue);
      this.tree(g, 2.8, -2.1, 1.0, 3);
      this.bench(g, 1.45, -0.75);
    } else if (n.kind === "clinic") {
      this.box(g, 0, -0.02, -1.35, 3.7, 0.05, 2.2, M.curb);
      this.box(g, 0, 0, -1.7, 2.7, 1.3, 1.4, M.cream);
      this.box(g, 0, 1.3, -1.7, 2.85, 0.08, 1.5, M.wall);
      this.box(g, 0, 0, -0.98, 0.5, 0.74, 0.03, M.blue);
      for (const x of [-0.88, 0.88])
        this.box(g, x, 0.58, -0.98, 0.4, 0.35, 0.03, M.blue);
      const cross = material(0xd06b54);
      this.box(g, 0, 0.88, -0.96, 0.1, 0.35, 0.04, cross);
      this.box(g, 0, 1, -0.95, 0.34, 0.1, 0.04, cross);
      this.tree(g, -1.8, -1.8, 0.9, 5);
    } else if (n.kind === "jobs") {
      this.box(g, 0, -0.02, -1.3, 3.5, 0.04, 2.2, M.curb);
      for (let i = 0; i < 3; i++) {
        const h = 1.5 + i * 0.3;
        this.box(g, (i - 1) * 1.0, 0, -1.65, 0.85, h, 1.25, M.cream);
        for (let y = 0.3; y < h - 0.2; y += 0.42)
          this.box(g, (i - 1) * 1.0, y, -1.01, 0.63, 0.23, 0.03, M.blue);
      }
    } else {
      this.box(g, 0, 0, -1.25, 3.1, 0.13, 0.85, M.curb);
      for (const x of [-1.2, 1.2])
        this.box(g, x, 0.13, -1.25, 0.055, 0.78, 0.055, M.blue);
      this.box(g, 0, 0.9, -1.25, 3.25, 0.1, 1.03, M.ochre);
      this.bench(g, 0, -1.3);
    }
    if (planned) {
      g.visible = false;
      const pad = new THREE.Group();
      pad.position.set(n.x, n.h, n.z);
      pad.scale.setScalar(placeScale);
      this.placesWorld.add(pad);
      this.box(pad, 0, 0, -1.4, 3.25, 0.035, 2.25, material(0xaeb49e));
      for (const side of [-1, 1]) {
        this.box(pad, side * 1.5, 0.04, -1.4, 0.045, 0.025, 2.1, M.white);
        this.box(pad, 0, 0.04, -1.4 + side * 1.0, 3.0, 0.025, 0.045, M.white);
        for (const z of [-0.45, -2.35])
          this.box(pad, side * 1.45, 0, z, 0.07, 0.32, 0.07, M.ochre);
      }
      for (let i = 0; i < 3; i++)
        this.box(pad, -0.45 + i * 0.13, 0.04, -1.75, 0.11, 0.08, 0.65, M.roof);
      this.box(pad, 0.7, 0, -0.55, 0.055, 0.8, 0.055, M.blue);
      this.box(pad, 0.7, 0.58, -0.55, 0.11, 0.4, 0.06, M.ochre);
      this.box(pad, 0.7, 0.72, -0.54, 0.4, 0.11, 0.07, M.ochre);
      this.servicePlaces.set(n.id, { built: g, pad });
    }
    // Each landmark gets a physical pickup curb, so route handles refer to an inhabited place.
    this.box(g, 0, 0.045, 0.83, 2.3, 0.04, 0.3, M.curb);
    for (const x of [-0.85, 0.85]) {
      this.box(g, x, 0.08, 0.97, 0.045, 0.65, 0.045, M.blue);
      this.box(g, x, 0.58, 0.97, 0.2, 0.18, 0.035, M.ochre);
    }
  }
  private bench(parent: THREE.Object3D, x: number, z: number) {
    this.box(parent, x, 0.16, z, 0.8, 0.055, 0.22, this.mats.roof);
    this.box(parent, x, 0.3, z - 0.1, 0.8, 0.13, 0.04, this.mats.roof);
    for (const side of [-1, 1])
      this.box(parent, x + side * 0.3, 0, z, 0.04, 0.18, 0.15, this.mats.metal);
  }
  private tree(
    parent: THREE.Object3D,
    x: number,
    z: number,
    size: number,
    seed: number,
  ) {
    const h = parent === this.staticWorld ? this.heightAt(x, z) : 0;
    this.cylinder(parent, x, h, z, 0.065 * size, 0.8 * size, this.mats.trunk);
    for (let i = 0; i < 3; i++) {
      const leaf = new THREE.Mesh(
        new THREE.IcosahedronGeometry((0.52 + i * 0.07) * size, 1),
        i % 2 ? this.mats.leaf : this.mats.leafLight,
      );
      leaf.position.set(
        x + (i - 1) * 0.3 * size,
        h + (1.02 + (i === 1 ? 0.3 : 0)) * size,
        z + (i === 1 ? -0.13 : 0.12) * size,
      );
      leaf.rotation.set(seed * 0.3, i * 0.7, seed * 0.2);
      leaf.castShadow = true;
      parent.add(leaf);
    }
  }
  private buildGroves() {
    const m = this.mission!,
      xmin = Math.min(...m.nodes.map((n) => n.x)) - 3,
      xmax = Math.max(...m.nodes.map((n) => n.x)) + 5,
      zmin = Math.min(...m.nodes.map((n) => n.z)) - 6,
      zmax = Math.max(...m.nodes.map((n) => n.z)) + 5;
    for (let i = 0; i < (m.id <= 2 ? 17 : 29); i++) {
      const x = xmin + random(i + 88) * (xmax - xmin),
        z = zmin + random(i + 144) * (zmax - zmin);
      if (
        x < this.coastX(z) + 1.2 ||
        m.nodes.some((n) => Math.hypot(n.x - x, n.z - z) < 3.2) ||
        m.corridors.some((c) => {
          const ps = corridorPoints(m, c);
          return ps
            .slice(1)
            .some((p, j) => distanceToSegment(x, z, ps[j], p).distance < 1.5);
        }) ||
        Math.abs(x - this.riverX(z)) < 1.4
      )
        continue;
      this.tree(this.staticWorld, x, z, 0.7 + random(i + 13) * 0.4, i);
      if (i % 7 === 0)
        this.tree(this.staticWorld, x + 0.8, z + 0.25, 0.65, i + 5);
    }
  }
  private batch(group: THREE.Group) {
    group.updateMatrixWorld(true);
    const batches = new Map<THREE.Material, THREE.Mesh[]>();
    group.traverse((o) => {
      if (o instanceof THREE.Mesh && !Array.isArray(o.material)) {
        const list = batches.get(o.material) || [];
        list.push(o);
        batches.set(o.material, list);
      }
    });
    for (const [mat, meshes] of batches) {
      if (meshes.length < 4) continue;
      const gs = meshes.map((o) => {
        const g = o.geometry.index
          ? o.geometry.toNonIndexed()
          : o.geometry.clone();
        g.deleteAttribute("uv");
        return g.applyMatrix4(o.matrixWorld);
      });
      const merged = mergeGeometries(gs, false);
      gs.forEach((g) => g.dispose());
      if (!merged) continue;
      const out = new THREE.Mesh(merged, mat);
      out.castShadow = true;
      out.receiveShadow = true;
      meshes.forEach((o) => o.removeFromParent());
      group.add(out);
    }
  }
  private addLandmark(n: MapNode) {
    const button = document.createElement("button");
    button.dataset.node = n.id;
    button.type = "button";
    button.draggable = false;
    button.setAttribute("aria-label", n.label);
    button.className = `town-node ${n.kind}`;
    Object.assign(button.style, {
      position: "absolute",
      top: "0",
      left: "0",
      minWidth: "44px",
      minHeight: "44px",
      border: "0",
      borderRadius: "18px",
      padding: "8px 10px",
      background: n.kind === "junction" ? "transparent" : "#fff7e8f2",
      color: "#164360",
      font: "800 13px Heebo,sans-serif",
      boxShadow: n.kind === "junction" ? "none" : "0 3px 10px #23422a25",
      pointerEvents: n.kind === "junction" ? "none" : "auto",
      cursor: "pointer",
      touchAction: "none",
      whiteSpace: "nowrap",
      zIndex: "1",
    });
    button.textContent =
      n.kind === "junction"
        ? ""
        : n.kind === "home"
          ? "הבתים"
          : n.kind === "school"
            ? "בית הספר"
            : n.kind === "clinic"
              ? "מרפאה"
              : n.kind === "jobs"
                ? "תעסוקה"
                : "תחנה";
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      this.onNode(n.id);
    });
    this.labelRoot.append(button);
    this.labels.set(n.id, button);
  }
  private createPeople() {
    const torso = new THREE.CapsuleGeometry(0.075, 0.19, 3, 6);
    torso.translate(0, 0.28, 0);
    const head = new THREE.SphereGeometry(0.078, 7, 5);
    head.translate(0, 0.49, 0);
    const hair = new THREE.SphereGeometry(
      0.08,
      7,
      4,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.56,
    );
    hair.translate(0, 0.508, 0);
    const legs = mergeGeometries([
      new THREE.CylinderGeometry(0.024, 0.028, 0.15, 5).translate(
        -0.041,
        0.08,
        0,
      ),
      new THREE.CylinderGeometry(0.024, 0.028, 0.15, 5).translate(
        0.041,
        0.08,
        0,
      ),
    ])!;
    const arms = mergeGeometries([
      new THREE.CapsuleGeometry(0.024, 0.12, 2, 4).translate(-0.1, 0.28, 0),
      new THREE.CapsuleGeometry(0.024, 0.12, 2, 4).translate(0.1, 0.28, 0),
    ])!;
    const pack = new THREE.BoxGeometry(0.12, 0.16, 0.08);
    pack.translate(0, 0.3, -0.09);
    const mats = [
      material(0x3f789a),
      material(0xd69b6b),
      material(0x513b30),
      material(0x2c4961),
      material(0xd69b6b),
      material(0xe2a23e),
    ];
    for (const [g, i] of [torso, head, hair, legs, arms, pack].map(
      (g, i) => [g, i] as const,
    )) {
      const mesh = new THREE.InstancedMesh(g, mats[i], 600);
      mesh.castShadow = true;
      mesh.frustumCulled = false;
      mesh.count = 0;
      this.personMeshes.push(mesh);
      this.moving.add(mesh);
    }
  }
  private clearVehicleMeshes() {
    for (const mesh of this.vehicleMeshes.values()) this.moving.remove(mesh);
    this.vehicleMeshes.clear();
  }
  private vehicle(bus?: Bus) {
    if ((!bus || bus.mode === "bus") && this.busTemplate)
      return this.busTemplate.clone(true);
    const g = new THREE.Group();
    this.box(g, 0, 0.08, 0, 0.43, 0.43, 1.65, this.mats.cream);
    this.box(g, 0, 0.27, 0.12, 0.44, 0.19, 1.2, this.mats.blue);
    if (bus?.mode === "rail") {
      this.box(g, 0, 0.08, -1.65, 0.43, 0.43, 1.5, this.mats.cream);
      this.box(g, 0, 0.27, -1.65, 0.44, 0.19, 1.2, this.mats.blue);
    } else
      for (const x of [-0.22, 0.22])
        for (const z of [-0.5, 0.5])
          this.cylinder(g, x, 0, z, 0.12, 0.08, this.mats.navy).rotation.z =
            Math.PI / 2;
    return g;
  }
  private vehicleScale() {
    return this.mission!.id <= 2 ? 2.05 : 1.45;
  }
  private makeDepot() {
    for (const o of [...this.depot.children]) this.depot.remove(o);
    if (!this.mission) return;
    const origin = this.mission.nodes.find((n) => n.kind === "home");
    if (!origin) return;
    const bus = this.vehicle();
    bus.scale.setScalar(this.vehicleScale());
    bus.position.set(origin.x, origin.h + 0.055, origin.z);
    const destination =
      this.mission.nodes.find((n) => n.kind === "school") ||
      this.mission.nodes.at(-1)!;
    bus.rotation.y = Math.atan2(
      destination.x - origin.x,
      destination.z - origin.z,
    );
    this.depot.add(bus);
  }
  private getPath(ids: string[]) {
    const ps: Point[] = [];
    for (let i = 1; i < ids.length; i++) {
      const c = this.mission!.corridors.find(
        (c) => pair(c.a, c.b) === pair(ids[i - 1], ids[i]),
      );
      if (!c) continue;
      let part = corridorPoints(this.mission!, c);
      if (c.a !== ids[i - 1]) part = [...part].reverse();
      ps.push(...(ps.length ? part.slice(1) : part));
    }
    return ps;
  }
  private previewPoints(ui: SceneUI) {
    const ids = [...ui.path];
    if (ui.hover && ids.at(-1) !== ui.hover) ids.push(ui.hover);
    const complete = this.getPath(ids),
      ps = complete.length ? this.sample(complete) : [];
    const pointer = (
      ui as SceneUI & { pointer?: { x: number; z: number } | null }
    ).pointer;
    if (!pointer || ui.hover || !ids.length) return ps;
    const last = ids.at(-1)!,
      candidates = this.mission!.corridors.filter(
        (c) =>
          (c.a === last || c.b === last) &&
          !ids.includes(c.a === last ? c.b : c.a),
      );
    let closest: { score: number; points: THREE.Vector3[] } | null = null;
    for (const c of candidates) {
      let raw = corridorPoints(this.mission!, c);
      if (c.a !== last) raw = [...raw].reverse();
      const road = this.sample(raw);
      for (let i = 1; i < road.length; i++) {
        const a = road[i - 1],
          b = road[i],
          dx = b.x - a.x,
          dz = b.z - a.z,
          t = THREE.MathUtils.clamp(
            ((pointer.x - a.x) * dx + (pointer.z - a.z) * dz) /
              (dx * dx + dz * dz || 1),
            0,
            1,
          ),
          end = a.clone().lerp(b, t),
          score = Math.hypot(pointer.x - end.x, pointer.z - end.z);
        if (!closest || score < closest.score)
          closest = { score, points: [...road.slice(0, i), end] };
      }
    }
    if (closest)
      return [...ps, ...(ps.length ? closest.points.slice(1) : closest.points)];
    return ps;
  }
  private drawLines(state: GameState, ui: SceneUI) {
    const key =
      state.revision +
      ":" +
      state.lines.map((l) => l.id + ":" + l.path.join(",")).join("|") +
      ":" +
      ui.selectedLine;
    if (key === this.lineKey) return;
    this.lineKey = key;
    this.clear(this.lineWorld);
    for (const line of state.lines) {
      const ps = this.sample(this.getPath(line.path)).map((p) =>
        p.add(new THREE.Vector3(0, 0.078, 0)),
      );
      if (ps.length < 2) continue;
      if (line.mode === "rail") {
        for (const side of [-0.17, 0.17])
          this.ribbon(ps, 0.045, this.mats.metal, this.lineWorld, side);
        for (let i = 0; i < ps.length; i += 2) {
          const p = ps[i],
            b = ps[Math.min(i + 1, ps.length - 1)],
            tie = this.box(
              this.lineWorld,
              p.x,
              p.y - 0.02,
              p.z,
              0.55,
              0.025,
              0.08,
              this.mats.trunk,
            );
          tie.lookAt(b.x, tie.position.y, b.z);
        }
      } else {
        this.ribbon(
          ps,
          ui.selectedLine === line.id ? 0.36 : 0.29,
          this.mats.navy,
          this.lineWorld,
        );
        this.ribbon(
          ps.map((p) => p.clone().add(new THREE.Vector3(0, 0.003, 0))),
          0.085,
          this.mats.ochre,
          this.lineWorld,
          0.045,
        );
      }
      for (const id of [line.path[0], line.path.at(-1)!]) {
        const n = this.mission!.nodes.find((n) => n.id === id)!;
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.29, 0.37, 32),
          this.mats.ochre,
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(n.x, n.h + 0.085, n.z);
        this.lineWorld.add(ring);
      }
    }
  }
  update(state: GameState, ui: SceneUI) {
    if (this.mission !== state.mission) this.setLevel(state.mission);
    this.currentState = state;
    if (ui.reducedMotion) this.boarding = [];
    for (const [id, site] of this.servicePlaces) {
      const open = state.services.includes(id);
      site.built.visible = open;
      site.pad.visible = !open;
    }
    const now = performance.now(),
      dt = Math.min(0.1, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    if (!ui.reducedMotion) this.elapsed += dt;
    this.drawLines(state, ui);
    this.depot.visible = state.vehicles.length === 0;
    const live = new Set(state.vehicles.map((v) => v.id));
    for (const [id, mesh] of this.vehicleMeshes)
      if (!live.has(id)) {
        this.moving.remove(mesh);
        this.vehicleMeshes.delete(id);
      }
    for (const bus of state.vehicles) {
      let mesh = this.vehicleMeshes.get(bus.id);
      if (!mesh) {
        mesh = this.vehicle(bus);
        mesh.scale.setScalar(this.vehicleScale());
        this.vehicleMeshes.set(bus.id, mesh);
        this.moving.add(mesh);
      }
      const p = vehiclePosition(state, bus);
      mesh.position.set(p.x, p.y - 0.025, p.z);
      mesh.rotation.y = p.angle;
    }
    const dummy = new THREE.Object3D();
    let count = 0;
    const placePerson = (
      id: number,
      x: number,
      y: number,
      z: number,
      angle: number,
      scale = 1,
    ) => {
      if (count >= 590) return;
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, angle, 0);
      dummy.scale.setScalar((state.mission.id <= 2 ? 1.2 : 1) * scale);
      dummy.updateMatrix();
      this.personMeshes.forEach((m) => m.setMatrixAt(count, dummy.matrix));
      this.personMeshes[0].setColorAt(
        count,
        new THREE.Color([0x3f789a, 0xd8984e, 0x64a1a5, 0xa66f7b][id % 4]),
      );
      this.personMeshes[1].setColorAt(
        count,
        new THREE.Color([0xd99e72, 0xc68a61, 0xa87350, 0xe4b08a][id % 4]),
      );
      count++;
    };
    for (const rider of state.people) {
      if (
        !ui.reducedMotion &&
        rider.status === "riding" &&
        this.previousPeople.get(rider.id) === "waiting" &&
        rider.vehicle !== null
      )
        this.boarding.push({
          id: rider.id,
          node: rider.node,
          vehicle: rider.vehicle,
          start: this.elapsed,
        });
      this.previousPeople.set(rider.id, rider.status);
    }
    for (const n of state.mission.nodes) {
      const waiting = state.people.filter(
        (p) => p.node === n.id && p.status === "waiting",
      );
      for (let i = 0; i < Math.min(32, waiting.length); i++)
        placePerson(
          waiting[i].id,
          n.x - 1.12 + (i % 8) * 0.235,
          n.h + 0.08,
          n.z + 1.05 + Math.floor(i / 8) * 0.32,
          -Math.PI / 2,
        );
      const arrived = state.people.filter(
        (p) => p.node === n.id && p.status === "arrived",
      );
      for (let i = 0; i < Math.min(40, arrived.length); i++)
        placePerson(
          arrived[i].id,
          n.x - 0.8 + (i % 6) * 0.26,
          n.h + 0.09,
          n.z - 0.65 - Math.floor(i / 6) * 0.29,
          0,
          0.9,
        );
    }
    for (const rider of state.people.filter((r) => r.status === "walking")) {
      const p = walkingPosition(state, rider);
      placePerson(rider.id, p.x, p.y + 0.08, p.z, p.angle);
    }
    this.boarding = this.boarding.filter((g) => this.elapsed - g.start < 0.65);
    for (const ghost of this.boarding) {
      const n = state.mission.nodes.find((n) => n.id === ghost.node),
        bus = state.vehicles.find((v) => v.id === ghost.vehicle);
      if (!n || !bus) continue;
      const p = vehiclePosition(state, bus),
        t = THREE.MathUtils.smoothstep(this.elapsed - ghost.start, 0, 0.65);
      placePerson(
        ghost.id,
        THREE.MathUtils.lerp(n.x - 0.8, p.x, t),
        THREE.MathUtils.lerp(n.h + 0.08, p.y + 0.2, t) +
          Math.sin(t * Math.PI) * 0.08,
        THREE.MathUtils.lerp(n.z + 1.05, p.z, t),
        p.angle,
        1 - t * 0.65,
      );
    }
    for (const mesh of this.personMeshes) {
      mesh.count = count;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    const pointer = (
      ui as SceneUI & { pointer?: { x: number; z: number } | null }
    ).pointer;
    const pk =
      ui.path.join(",") +
      "|" +
      ui.hover +
      "|" +
      ui.invalid +
      "|" +
      ui.mode +
      "|" +
      (pointer ? pointer.x.toFixed(2) + "," + pointer.z.toFixed(2) : "");
    if (pk !== this.previewKey) {
      this.previewKey = pk;
      this.clear(this.previewWorld);
      const points = this.previewPoints(ui);
      if (points.length > 1) {
        const ps = points.map((p) =>
          p.clone().add(new THREE.Vector3(0, 0.15, 0)),
        );
        this.previewMaterial.color.setHex(ui.invalid ? 0xda7656 : C.ochre);
        this.ribbon(ps, 0.36, this.previewMaterial, this.previewWorld);
        const end = ps.at(-1)!,
          ring = new THREE.Mesh(
            new THREE.RingGeometry(0.16, 0.24, 24),
            this.previewMaterial,
          );
        ring.rotation.x = -Math.PI / 2;
        ring.position.copy(end).add(new THREE.Vector3(0, 0.015, 0));
        this.previewWorld.add(ring);
      }
    }
    for (const n of state.mission.nodes) {
      const el = this.labels.get(n.id)!;
      if (this.servicePlaces.has(n.id))
        el.textContent = state.services.includes(n.id)
          ? "מרפאה"
          : "אתר מרפאה +";
      const p = this.project(n.id);
      const active = ui.path.includes(n.id) || ui.hover === n.id;
      el.style.transform = `translate(-50%,-100%) translate(${p.x}px,${p.y - (n.kind === "junction" ? 0 : 21)}px)`;
      el.style.display =
        n.kind === "junction" ? (ui.path.length ? "block" : "none") : "block";
      el.style.pointerEvents =
        n.kind === "junction" && ui.path.length
          ? "auto"
          : n.kind === "junction"
            ? "none"
            : "auto";
      el.style.background =
        n.kind === "junction"
          ? active
            ? "#f1ad3e"
            : "#ffffffc9"
          : active
            ? "#ffd18b"
            : "#fff7e8ed";
      el.style.boxShadow = active
        ? "0 0 0 3px #f2ad3e,0 3px 10px #23422a25"
        : n.kind === "junction"
          ? "none"
          : "0 3px 10px #23422a25";
      if (n.kind === "junction") {
        el.style.minWidth = "44px";
        el.style.minHeight = "44px";
        el.style.borderRadius = "50%";
        el.textContent = "·";
        el.style.fontSize = "24px";
      }
      if (ui.service && state.mission.serviceSites.includes(n.id))
        el.style.boxShadow = "0 0 0 4px #69a69a";
    }
    const feedback = ui.invalid
      ? {
          node: ui.hover || ui.path.at(-1) || state.mission.nodes[0].id,
          text: ui.invalid,
          kind: "problem",
        }
      : state.localFeedback;
    if (feedback) {
      const p = this.project(feedback.node);
      this.bubble.textContent = feedback.text;
      this.bubble.style.display = "block";
      this.bubble.style.background =
        feedback.kind === "problem" ? "#fff0d9" : "#e9f5dc";
      this.bubble.style.transform = `translate(-50%,-100%) translate(${p.x}px,${p.y - 77}px)`;
    } else this.bubble.style.display = "none";
    this.renderer.render(this.scene, this.camera);
    this.fpsFrames++;
    if (now - this.fpsStart > 1000) {
      this.fps = (this.fpsFrames * 1000) / (now - this.fpsStart);
      this.fpsFrames = 0;
      this.fpsStart = now;
    }
  }
  get northAngle() {
    const center = this.bounds.getCenter(new THREE.Vector3()),
      a = center.clone().project(this.camera),
      b = center
        .clone()
        .add(new THREE.Vector3(0, 0, -1))
        .project(this.camera);
    const dx = (b.x - a.x) * this.width,
      dy = -(b.y - a.y) * this.height;
    return Math.atan2(dx, -dy);
  }
  project(id: string) {
    const n = this.mission?.nodes.find((n) => n.id === id);
    if (!n) return { x: 0, y: 0 };
    const p = new THREE.Vector3(n.x, n.h + 0.08, n.z).project(this.camera);
    return {
      x: (p.x * 0.5 + 0.5) * this.width,
      y: (-0.5 * p.y + 0.5) * this.height,
    };
  }
  pick(clientX: number, clientY: number, includeJunctions = false): Pick {
    const rect = this.canvas.getBoundingClientRect(),
      x = clientX - rect.left,
      y = clientY - rect.top;
    let node: string | null = null,
      best = this.width < 700 ? 47 : 52;
    for (const n of this.mission?.nodes || []) {
      if (n.kind === "junction" && !includeJunctions) continue;
      const p = this.project(n.id),
        d = Math.hypot(p.x - x, p.y - y);
      if (d < best) {
        node = n.id;
        best = d;
      }
    }
    let line: number | null = null,
      min = 16;
    if (!node && this.currentState)
      for (const l of this.currentState.lines) {
        const ps = this.getPath(l.path);
        for (let i = 1; i < ps.length; i++) {
          const a = vec(ps[i - 1]).project(this.camera),
            b = vec(ps[i]).project(this.camera),
            ax = (a.x * 0.5 + 0.5) * this.width,
            ay = (-a.y * 0.5 + 0.5) * this.height,
            bx = (b.x * 0.5 + 0.5) * this.width,
            by = (-b.y * 0.5 + 0.5) * this.height,
            dx = bx - ax,
            dy = by - ay,
            t = THREE.MathUtils.clamp(
              ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1),
              0,
              1,
            ),
            d = Math.hypot(x - ax - t * dx, y - ay - t * dy);
          if (d < min) {
            line = l.id;
            min = d;
          }
        }
      }
    this.raycaster.setFromCamera(
      new THREE.Vector2((x / rect.width) * 2 - 1, 1 - (y / rect.height) * 2),
      this.camera,
    );
    this.raycaster.ray.intersectPlane(this.groundPlane, this.target);
    return { node, line, world: { x: this.target.x, z: this.target.z } };
  }
  resize() {
    this.width = Math.max(1, this.canvas.clientWidth);
    this.height = Math.max(1, this.canvas.clientHeight);
    this.renderer.setSize(this.width, this.height, false);
    this.fitCamera();
  }
  private fitCamera() {
    if (!this.mission) return;
    const portrait = this.height > this.width * 1.15;
    const ns = this.mission.nodes,
      xmin = Math.min(...ns.map((n) => n.x)) - (portrait ? 2.5 : 4.5),
      xmax = Math.max(...ns.map((n) => n.x)) + 2.8,
      zmin = Math.min(...ns.map((n) => n.z)) - (portrait ? 3.1 : 3.6),
      zmax = Math.max(...ns.map((n) => n.z)) + (portrait ? 1.4 : 1.7),
      hmax = Math.max(...ns.map((n) => n.h)) + 2.3;
    this.bounds.set(
      new THREE.Vector3(xmin, 0, zmin),
      new THREE.Vector3(xmax, hmax, zmax),
    );
    const center = this.bounds.getCenter(new THREE.Vector3());
    const offset = portrait
      ? new THREE.Vector3(-24, 30, 3)
      : new THREE.Vector3(0, 28, 25);
    this.camera.position.copy(center).add(offset);
    this.camera.lookAt(center);
    this.camera.updateMatrixWorld();
    const projected = new THREE.Box3();
    for (const x of [xmin, xmax])
      for (const y of [0, hmax])
        for (const z of [zmin, zmax])
          projected.expandByPoint(
            new THREE.Vector3(x, y, z).applyMatrix4(
              this.camera.matrixWorldInverse,
            ),
          );
    const top = portrait ? 140 : 85,
      bottom = portrait ? 105 : 65,
      usableH = Math.max(150, this.height - top - bottom),
      usableW = this.width - (portrait ? 20 : 80),
      aspect = this.width / this.height;
    const half =
      ((Math.max(
        (projected.max.y - projected.min.y) / 2,
        (projected.max.x - projected.min.x) / (2 * (usableW / usableH)),
      ) /
        0.97) *
        this.height) /
      usableH;
    const shift = ((top - bottom) / this.height) * half;
    this.camera.left = -half * aspect;
    this.camera.right = half * aspect;
    this.camera.top = half + shift;
    this.camera.bottom = -half + shift;
    this.camera.updateProjectionMatrix();
  }
}
