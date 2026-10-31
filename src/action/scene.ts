import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type {
  Mission,
  GameState,
  SceneUI,
  Pick,
  Targets,
  Tile,
  Cell,
  Dir,
  Vehicle,
} from "./types";
import { roadPorts, endpointHeight, vehiclePosition } from "./model";
import { architecturalMaterials, surfaceUV } from "./materials";

const T = 2.6,
  H = 0.9,
  R = T / 2;
const PALETTE = {
  table: 0xd8d3c9,
  frame: 0xd3cbbc,
  frameLip: 0xc4bcab,
  cream: 0xe6decc,
  ivory: 0xf0eadd,
  road: 0x44494a,
  mark: 0xd6d1bb,
  sage: 0xafa58a,
  quiet: 0x76805c,
  water: 0x3b7374,
  teal: 0x33434b,
  gold: 0xd3a449,
};
const mat = (color: number, roughness = 0.78) =>
  new THREE.MeshStandardMaterial({ color, roughness });
const noise = (i: number) => {
  const x = Math.sin(i * 132.1 + 8.4) * 42737.33;
  return x - Math.floor(x);
};
interface TileView {
  group: THREE.Group;
  angle: number;
  vy: number;
  kind: string;
  rail?: THREE.Group;
}
interface Pose {
  x: number;
  y: number;
  z: number;
  angle: number;
}
interface RailPlatform {
  cell: Cell;
  dir: Dir;
  dx: number;
  dz: number;
}

/** Physical road pieces are rendered from the same orientation/height contract as the model. */
export class RoadScene {
  busLoaded = false;
  fps = 0;
  get assetStatus() {
    return {
      busLoaded: !!this.busTemplate,
      schoolLoaded: !!this.schoolTemplate,
      texturesLoaded: this.m.texturesLoaded,
    };
  }
  private renderer: THREE.WebGLRenderer;
  private camera = new THREE.OrthographicCamera(-10, 10, 7, -7, 0.1, 180);
  private scene = new THREE.Scene();
  private landmarkWorld = new THREE.Group();
  private staticWorld = new THREE.Group();
  private groundWorld = new THREE.Group();
  private tileWorld = new THREE.Group();
  private actors = new THREE.Group();
  private rack = new THREE.Group();
  private feedback = new THREE.Group();
  private mission: Mission | null = null;
  private state: GameState | null = null;
  private ui: SceneUI | null = null;
  private width = 1;
  private height = 1;
  private portrait = false;
  private rackSlots = new Map<string, THREE.Vector3>();
  private rackKey = "";
  private tiles = new Map<string, TileView>();
  private grounds = new Map<string, THREE.Group>();
  private inserts = new Map<
    string,
    { grass: THREE.Object3D; socket: THREE.Object3D; decor: THREE.Group }
  >();
  private landmarkLots = new Map<string, Cell>();
  private landmarkCourts = new Map<
    string,
    { x: number; y: number; z: number; angle: number }
  >();
  private railPlatforms: RailPlatform[] = [];
  private landmarkRoots: THREE.Group[] = [];
  private vehicles = new Map<string, THREE.Object3D>();
  private busTemplate: THREE.Group | null = null;
  private raycaster = new THREE.Raycaster();
  private pointerPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.65);
  private projectedPointer = new THREE.Vector3();
  private elapsed = 0;
  private eventSerial = -1;
  private eventTime = 0;
  private closureKey = "";
  private barriers = new THREE.Group();
  private lastFps = performance.now();
  private frameCount = 0;
  private peopleMeshes: THREE.InstancedMesh[] = [];
  private previousPeople = new Map<number, string>();
  private boarding: {
    id: number;
    cell: string;
    vehicle: string;
    start: number;
  }[] = [];
  private outline: THREE.Line;
  private turnArrow = new THREE.Group();
  private waitingCues = new Map<string, THREE.Sprite>();
  private gapMaterial: THREE.SpriteMaterial;
  private m = architecturalMaterials();
  private schoolTemplate: THREE.Group | null = null;
  private schoolInstances: THREE.Group[] = [];
  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    const pmrem = new THREE.PMREMGenerator(this.renderer),
      room = new RoomEnvironment();
    this.scene.environment = pmrem.fromScene(room, 0.04).texture;
    this.scene.environmentIntensity = 0.4;
    room.dispose();
    pmrem.dispose();
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.VSMShadowMap;
    this.scene.background = new THREE.Color(PALETTE.table);
    this.scene.add(new THREE.HemisphereLight(0xf5f3e8, 0x919997, 1.0));
    const sun = new THREE.DirectionalLight(0xffedda, 2.2);
    sun.position.set(-15, 25, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -22,
      right: 22,
      top: 22,
      bottom: -22,
      far: 70,
    });
    sun.shadow.normalBias = 0.025;
    sun.shadow.radius = 3.5;
    sun.shadow.blurSamples = 8;
    sun.shadow.bias = -0.00008;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0xdce8ed, 0.35);
    fill.position.set(15, 12, -18);
    this.scene.add(fill);
    this.scene.add(
      this.staticWorld,
      this.landmarkWorld,
      this.groundWorld,
      this.tileWorld,
      this.actors,
      this.rack,
      this.feedback,
      this.barriers,
    );
    const table = new THREE.Mesh(
      surfaceUV(new THREE.PlaneGeometry(180, 180)),
      this.m.paving,
    );
    table.rotation.x = -Math.PI / 2;
    table.position.y = -0.625;
    table.receiveShadow = true;
    this.scene.add(table);
    this.gapMaterial = this.makeGapMaterial();
    this.outline = new THREE.Line(
      this.outlineGeometry(2.48, 0.16),
      new THREE.LineBasicMaterial({
        color: PALETTE.gold,
        transparent: true,
        opacity: 0.95,
        depthTest: false,
      }),
    );
    this.feedback.add(this.outline);
    this.outline.visible = false;
    this.makeTurnArrow();
    this.createPeople();
    new GLTFLoader().load(
      `${import.meta.env.BASE_URL}models/bus-architectural.glb`,
      (g) => {
        this.busTemplate = g.scene;
        g.scene.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.castShadow = true;
            o.receiveShadow = true;
            for (const material of Array.isArray(o.material)
              ? o.material
              : [o.material])
              if (material instanceof THREE.MeshStandardMaterial) {
                material.normalScale.setScalar(0.4);
                material.roughness = Math.max(0.38, material.roughness);
              }
          }
        });
        this.busLoaded = true;
        for (const [id, o] of this.vehicles) {
          this.actors.remove(o);
          this.vehicles.delete(id);
        }
      },
      undefined,
      (e) => console.error("Original Tripo bus could not load", e),
    );
    new GLTFLoader().load(
      `${import.meta.env.BASE_URL}models/school-architectural.glb`,
      (g) => {
        this.schoolTemplate = g.scene;
        g.scene.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.castShadow = true;
            o.receiveShadow = true;
          }
        });
        if (this.mission) {
          const mission = this.mission;
          this.setMission(mission);
        }
      },
      undefined,
      (e) => console.error("Original architectural school could not load", e),
    );
    window.addEventListener("resize", () => this.resize());
    this.resize();
  }
  private roundedShape(w: number, d: number, r: number) {
    const x = -w / 2,
      z = -d / 2,
      s = new THREE.Shape();
    s.moveTo(x + r, z);
    s.lineTo(x + w - r, z);
    s.quadraticCurveTo(x + w, z, x + w, z + r);
    s.lineTo(x + w, z + d - r);
    s.quadraticCurveTo(x + w, z + d, x + w - r, z + d);
    s.lineTo(x + r, z + d);
    s.quadraticCurveTo(x, z + d, x, z + d - r);
    s.lineTo(x, z + r);
    s.quadraticCurveTo(x, z, x + r, z);
    return s;
  }
  private boxGeometry(w: number, h: number, d: number, r = 0.065) {
    r = Math.min(r, h * 0.32, w * 0.1, d * 0.1);
    const g = new THREE.ExtrudeGeometry(
      this.roundedShape(
        w - r * 2,
        d - r * 2,
        Math.min(0.035, w * 0.04, d * 0.04),
      ),
      {
        depth: Math.max(0.002, h - r * 2),
        bevelEnabled: true,
        bevelSize: r,
        bevelThickness: r,
        bevelSegments: 3,
        curveSegments: 5,
        steps: 1,
      },
    );
    g.rotateX(-Math.PI / 2);
    g.translate(0, r, 0);
    return surfaceUV(g);
  }
  private box(
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    m: THREE.Material,
    r = 0.055,
  ) {
    const mesh = new THREE.Mesh(this.boxGeometry(w, h, d, r), m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  private cylinder(
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    m: THREE.Material,
  ) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 10), m);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  private dispose(group: THREE.Group) {
    for (const c of [...group.children]) {
      group.remove(c);
      c.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Line)
          o.geometry.dispose();
      });
    }
  }
  private batch(group: THREE.Group) {
    group.updateMatrixWorld(true);
    const by = new Map<THREE.Material, THREE.Mesh[]>();
    group.traverse((o) => {
      if (o instanceof THREE.Mesh && !Array.isArray(o.material)) {
        const list = by.get(o.material) || [];
        list.push(o);
        by.set(o.material, list);
      }
    });
    for (const [m, ms] of by) {
      if (ms.length < 4) continue;
      const inverse = group.matrixWorld.clone().invert();
      const gs = ms.map((o) => {
        const g = o.geometry.index
          ? o.geometry.toNonIndexed()
          : o.geometry.clone();
        surfaceUV(g);
        if (
          (m as THREE.MeshStandardMaterial).vertexColors &&
          !g.getAttribute("color")
        ) {
          const colors = new Float32Array(g.getAttribute("position").count * 3);
          colors.fill(1);
          g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        }
        return g.applyMatrix4(inverse.clone().multiply(o.matrixWorld));
      });
      const g = mergeGeometries(gs);
      gs.forEach((g) => g.dispose());
      if (g) {
        ms.forEach((o) => o.removeFromParent());
        const mesh = new THREE.Mesh(g, m);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
      }
    }
  }
  setMission(m: Mission) {
    this.mission = m;
    this.state = null;
    this.ui = null;
    this.previousPeople.clear();
    this.boarding = [];
    this.eventSerial = -1;
    this.closureKey = "";
    this.dispose(this.staticWorld);
    this.dispose(this.landmarkWorld);
    this.dispose(this.groundWorld);
    this.dispose(this.rack);
    this.dispose(this.barriers);
    for (const v of this.tiles.values()) {
      this.tileWorld.remove(v.group);
      this.dispose(v.group);
    }
    this.tiles.clear();
    this.grounds.clear();
    this.inserts.clear();
    this.landmarkLots.clear();
    this.landmarkCourts.clear();
    this.railPlatforms = [];
    this.landmarkRoots = [];
    this.schoolInstances = [];
    for (const v of this.vehicles.values()) this.actors.remove(v);
    this.vehicles.clear();
    for (const cue of this.waitingCues.values()) this.feedback.remove(cue);
    this.waitingCues.clear();
    const w = m.cols * T + 0.12,
      d = m.rows * T + 0.12,
      cx = ((m.cols - 1) * T) / 2,
      cz = ((m.rows - 1) * T) / 2;
    this.box(this.staticWorld, cx, -0.62, cz, w, 0.24, d, this.m.frame, 0.035);
    for (const c of m.cells) {
      const lotId = c.landmark?.lot;
      if (lotId) {
        const lot = m.cells.find((n) => n.id === lotId);
        if (lot) this.landmarkLots.set(c.id, lot);
      }
    }
    for (const cell of m.cells.filter((c) => c.landmark?.kind === "station")) {
      const tile = m.tiles.find((t) => t.cell === cell.id);
      if (!tile || tile.kind === "rail" || tile.kind === "railCorner") continue;
      const neighbors = m.tiles
        .filter((t) => t.cell && (t.kind === "rail" || t.kind === "railCorner"))
        .map((t) => ({ tile: t, cell: m.cells.find((c) => c.id === t.cell)! }))
        .filter(
          (n) =>
            Math.abs(n.cell.x - cell.x) + Math.abs(n.cell.z - cell.z) === 1,
        );
      if (neighbors.length !== 1) continue;
      const n = neighbors[0].cell,
        dir = (
          n.x > cell.x ? 1 : n.x < cell.x ? 3 : n.z > cell.z ? 2 : 0
        ) as Dir,
        ports = roadPorts(tile),
        branch = ports.find((d) => d !== dir && d !== (dir + 2) % 4);
      let dx = 0,
        dz = 0;
      if (branch !== undefined) {
        dx = branch === 1 ? -0.82 : branch === 3 ? 0.82 : 0;
        dz = branch === 2 ? -0.82 : branch === 0 ? 0.82 : 0;
      } else {
        const lot = this.landmarkLots.get(cell.id);
        if (dir % 2) {
          dz = lot && lot.z > cell.z ? 0.82 : -0.82;
        } else {
          dx = lot && lot.x > cell.x ? 0.82 : -0.82;
        }
      }
      this.railPlatforms.push({ cell, dir, dx, dz });
    }
    for (const c of m.cells) this.buildCell(c);
    for (const c of m.cells) if (c.landmark) this.landmark(c);
    this.buildRack(m.tiles.filter((t) => t.cell === null));
    this.batch(this.staticWorld);
    this.fitCamera();
  }
  private buildCell(c: Cell) {
    const x = c.x * T,
      z = c.z * T,
      y = c.height * H,
      m = this.mission!;
    if (c.terrain === "water") {
      const water = new THREE.Mesh(
        new THREE.PlaneGeometry(T + 0.004, T + 0.004, 3, 3),
        this.m.water,
      );
      water.rotation.x = -Math.PI / 2;
      water.position.set(x, -0.28, z);
      water.receiveShadow = true;
      this.staticWorld.add(water);
      for (const side of [-1, 1]) {
        const neighbor = m.cells.find(
          (n) => n.x === c.x + side && n.z === c.z && n.terrain !== "water",
        );
        if (neighbor)
          for (let k = 0; k < 4; k++) {
            const before = this.staticWorld.children.length;
            this.naturalRock(
              this.staticWorld,
              x + side * 1.13,
              z + (k - 1.5) * 0.62,
              0.19 + noise(k + c.z * 4) * 0.08,
            );
            this.staticWorld.children[before].position.y = -0.16;
          }
      }
      if (c.bridgeAxis !== undefined)
        for (const side of [-1, 1])
          this.box(
            this.staticWorld,
            x + (c.bridgeAxis === 1 ? side * 1.16 : 0),
            -0.36,
            z + (c.bridgeAxis === 0 ? side * 1.16 : 0),
            c.bridgeAxis === 1 ? 0.2 : 1.5,
            0.38,
            c.bridgeAxis === 0 ? 0.2 : 1.5,
            this.m.cream,
            0.018,
          );
      return;
    }
    const base = new THREE.Mesh(
      surfaceUV(new THREE.BoxGeometry(T + 0.004, 0.24 + y, T + 0.004)),
      this.m.cream,
    );
    base.position.set(x, -0.38 + (0.24 + y) / 2, z);
    base.castShadow = true;
    base.receiveShadow = true;
    this.staticWorld.add(base);
    const ground = new THREE.Group();
    ground.position.set(x, y, z);
    this.groundWorld.add(ground);
    this.grounds.set(c.id, ground);
    const grass = this.box(
      ground,
      0,
      -0.14,
      0,
      T + 0.006,
      0.145,
      T + 0.006,
      c.terrain === "quiet"
        ? this.m.quiet
        : c.terrain === "built" || c.landmark || c.servicePlot
          ? this.m.paving
          : this.m.sage,
      0.004,
    );
    const socket = this.box(
      ground,
      0,
      -0.135,
      0,
      T - 0.035,
      0.03,
      T - 0.035,
      this.m.paving,
      0.015,
    );
    socket.visible = false;
    const decor = new THREE.Group();
    ground.add(decor);
    this.inserts.set(c.id, { grass, socket, decor });
    if (c.servicePlot) {
      for (const side of [-1, 1]) {
        this.box(
          ground,
          side * 1.04,
          0.017,
          0,
          0.018,
          0.012,
          2.1,
          this.m.gold,
          0.002,
        );
        this.box(
          ground,
          0,
          0.017,
          side * 1.04,
          2.1,
          0.012,
          0.018,
          this.m.gold,
          0.002,
        );
      }
      this.box(ground, 0, 0.018, 0, 0.08, 0.015, 0.48, this.m.gold, 0.002);
      this.box(ground, 0, 0.019, 0, 0.48, 0.015, 0.08, this.m.gold, 0.002);
    }
    if (c.terrain === "land" && !c.landmark && !c.servicePlot) {
      const corners = [
        new THREE.Vector3(-R, 0.012, -R),
        new THREE.Vector3(R, 0.012, -R),
        new THREE.Vector3(R, 0.012, R),
        new THREE.Vector3(-R, 0.012, R),
        new THREE.Vector3(-R, 0.012, -R),
      ];
      ground.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(corners),
          new THREE.LineBasicMaterial({
            color: 0x9c9484,
            transparent: true,
            opacity: 0.19,
          }),
        ),
      );
    }
    const reserved =
      m.roadCells?.includes(c.id) ||
      m.tiles.some((t) => t.cell === c.id) ||
      c.landmark ||
      c.servicePlot ||
      c.terrain === "built" ||
      m.solution.some((a) => a.type === "place" && a.cell === c.id);
    if (!reserved) {
      const seed = c.x * 39 + c.z * 73 + 15;
      if (c.terrain === "rock") {
        for (let i = 0; i < 4; i++)
          this.naturalRock(
            decor,
            (noise(seed + i) - 0.5) * 2,
            (noise(seed + i + 12) - 0.5) * 2,
            0.3 + noise(seed + i + 5) * 0.4,
          );
      } else {
        this.landscapePatch(decor, seed, c.terrain === "quiet");
        if ((c.x + c.z) % 3 === 0)
          this.tree(
            decor,
            (noise(seed + 1) - 0.5) * 1.0,
            (noise(seed + 2) - 0.5) * 1.0,
            0.85 + noise(seed) * 0.25,
          );
        if (c.terrain === "quiet") this.bench(decor, 0.45, 0.8);
      }
      if (c.x === 0) this.gardenWall(decor, -1.23, 0, 0.0, 0.17, T, 0);
      if (c.x === m.cols - 1) this.gardenWall(decor, 1.23, 0, 0, 0.17, T, 0);
      if (c.z === 0) this.gardenWall(decor, 0, 0, -1.23, 0.17, T, Math.PI / 2);
      if (c.z === m.rows - 1)
        this.gardenWall(decor, 0, 0, 1.23, 0.17, T, Math.PI / 2);
    }
    this.batch(decor);
  }

  private outlineGeometry(size: number, r: number) {
    const shape = this.roundedShape(size, size, r),
      pts = shape.getPoints(7).map((p) => new THREE.Vector3(p.x, 0.075, -p.y));
    return new THREE.BufferGeometry().setFromPoints(pts);
  }
  private roadPath(kind: Tile["kind"]) {
    if (kind === "corner" || kind === "railCorner") {
      const p: THREE.Vector3[] = [];
      for (let i = 0; i <= 28; i++) {
        const a = Math.PI - ((i / 28) * Math.PI) / 2;
        p.push(new THREE.Vector3(R + Math.cos(a) * R, 0, -R + Math.sin(a) * R));
      }
      return p;
    }
    if (kind === "ramp") {
      return Array.from(
        { length: 25 },
        (_, i) => new THREE.Vector3(0, (1 - i / 24) * H, -R + (i / 24) * T),
      );
    }
    return Array.from(
      { length: 25 },
      (_, i) => new THREE.Vector3(-R + (i / 24) * T, 0, 0),
    );
  }
  private ribbon(
    parent: THREE.Object3D,
    points: THREE.Vector3[],
    width: number,
    depth: number,
    m: THREE.Material,
    offset = 0,
  ) {
    const v: number[] = [],
      ind: number[] = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[Math.max(0, i - 1)],
        b = points[Math.min(points.length - 1, i + 1)],
        d = b.clone().sub(a).setY(0).normalize(),
        side = new THREE.Vector3(-d.z, 0, d.x);
      for (const dy of [0, -depth])
        for (const sign of [-1, 1]) {
          const p = points[i]
            .clone()
            .addScaledVector(side, offset + (sign * width) / 2);
          v.push(p.x, p.y + dy, p.z);
        }
      if (i) {
        const k = i * 4,
          j = k - 4;
        ind.push(
          j,
          j + 1,
          k,
          j + 1,
          k + 1,
          k,
          j + 2,
          k + 2,
          j + 3,
          j + 3,
          k + 2,
          k + 3,
          j,
          k,
          j + 2,
          j + 2,
          k,
          k + 2,
          j + 1,
          j + 3,
          k + 1,
          j + 3,
          k + 3,
          k + 1,
        );
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
    g.setIndex(ind);
    g.computeVertexNormals();
    surfaceUV(g);
    const mesh = new THREE.Mesh(g, m);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  private paint(parent: THREE.Object3D, path: THREE.Vector3[], arrows = false) {
    let walked = 0,
      next = 0.25;
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1],
        b = path[i],
        len = a.distanceTo(b);
      while (next <= walked + len) {
        const t = (next - walked) / len,
          p = a.clone().lerp(b, t),
          dir = b.clone().sub(a).normalize();
        const dash = this.box(
          parent,
          p.x,
          p.y + 0.058,
          p.z,
          0.035,
          0.006,
          0.19,
          this.m.mark,
          0.002,
        );
        dash.rotation.y = Math.atan2(dir.x, dir.z);
        if (Math.abs(dir.y) > 0.01) dash.rotation.x = -Math.asin(dir.y);
        next += 0.47;
      }
      walked += len;
    }
    if (arrows) {
      const shape = new THREE.Shape();
      shape.moveTo(-0.35, -0.1);
      shape.lineTo(0.05, -0.1);
      shape.lineTo(0.05, -0.25);
      shape.lineTo(0.42, 0);
      shape.lineTo(0.05, 0.25);
      shape.lineTo(0.05, 0.1);
      shape.lineTo(-0.35, 0.1);
      shape.closePath();
      const g = new THREE.ShapeGeometry(shape);
      g.rotateX(-Math.PI / 2);
      const arrow = new THREE.Mesh(g, this.m.mark);
      arrow.position.y = 0.075;
      parent.add(arrow);
    }
  }
  private tee(parent: THREE.Object3D) {
    const w = 0.635,
      pts = [
        [-R, -w],
        [-w, -w],
        [-w, -R],
        [w, -R],
        [w, -w],
        [R, -w],
        [R, w],
        [-R, w],
      ];
    const shape = new THREE.Shape(
      pts.map(([x, z]) => new THREE.Vector2(x, -z)),
    );
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: 0.035,
      bevelEnabled: false,
    });
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0.015, 0);
    const deck = new THREE.Mesh(g, this.m.road);
    deck.receiveShadow = true;
    parent.add(deck);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i],
        b = pts[(i + 1) % pts.length],
        port =
          (Math.abs(a[0]) === R && a[0] === b[0]) ||
          (a[1] === -R && a[1] === b[1]);
      if (port) continue;
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]),
        curb = this.box(
          parent,
          (a[0] + b[0]) / 2,
          0.035,
          (a[1] + b[1]) / 2,
          0.045,
          0.045,
          length + 0.02,
          this.m.ivory,
          0.012,
        );
      curb.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]);
    }
    this.paint(parent, this.roadPath("straight"));
    const north = [new THREE.Vector3(0, 0, -R), new THREE.Vector3(0, 0, -0.35)];
    this.paint(parent, north);
  }
  private railOffset(x: number, z: number) {
    const result = new THREE.Vector2();
    for (const p of this.railPlatforms) {
      const fx = p.dir === 1 ? 1 : p.dir === 3 ? -1 : 0,
        fz = p.dir === 2 ? 1 : p.dir === 0 ? -1 : 0,
        rx = x - p.cell.x * T,
        rz = z - p.cell.z * T,
        along = rx * fx + rz * fz,
        across = rx * fz - rz * fx;
      if (along < -R - 0.01 || along > T + 0.01 || Math.abs(across) > 0.2)
        continue;
      const weight = 1 - THREE.MathUtils.smoothstep(along, 0, T);
      result.set(p.dx * weight, p.dz * weight);
      break;
    }
    return result;
  }
  private railPath(tile: Tile, path: THREE.Vector3[]) {
    if (!tile.cell) return path;
    const cell = this.mission!.cells.find((c) => c.id === tile.cell)!,
      a = (-tile.rotation * Math.PI) / 2,
      cs = Math.cos(a),
      sn = Math.sin(a);
    return path.map((p) => {
      const o = this.railOffset(
        cell.x * T + p.x * cs + p.z * sn,
        cell.z * T - p.x * sn + p.z * cs,
      );
      return p
        .clone()
        .add(new THREE.Vector3(o.x * cs - o.y * sn, 0, o.x * sn + o.y * cs));
    });
  }
  private railDeck(parent: THREE.Object3D, path: THREE.Vector3[]) {
    this.ribbon(
      parent,
      path.map((p) => p.clone().add(new THREE.Vector3(0, 0.027, 0))),
      0.98,
      0.025,
      this.m.ballast,
    );
    for (let i = 0; i < path.length; i += 2) {
      const p = path[i],
        a = path[Math.min(i + 1, path.length - 1)]
          .clone()
          .sub(path[Math.max(0, i - 1)]),
        tie = this.box(
          parent,
          p.x,
          p.y + 0.045,
          p.z,
          0.99,
          0.045,
          0.11,
          this.m.trunk,
          0.012,
        );
      tie.rotation.y = Math.atan2(a.x, a.z);
    }
    for (const side of [-0.25, 0.25])
      this.ribbon(
        parent,
        path.map((p) => p.clone().add(new THREE.Vector3(0, 0.12, 0))),
        0.055,
        0.07,
        this.m.steel,
        side,
      );
  }
  private buildTile(tile: Tile) {
    const group = new THREE.Group();
    group.userData.tile = tile.id;
    const rail = new THREE.Group();
    if (tile.kind === "bridge") {
      this.box(group, 0, -0.14, 0, T - 0.035, 0.14, 1.65, this.m.cream, 0.065);
      for (const side of [-1, 1]) {
        this.box(
          group,
          side * 0.93,
          -0.36,
          0,
          0.2,
          0.22,
          1.35,
          this.m.cream,
          0.04,
        );
        this.box(
          group,
          0,
          0.12,
          side * 0.76,
          T - 0.07,
          0.085,
          0.07,
          this.m.ivory,
          0.025,
        );
      }
    } else if (tile.kind === "ramp") {
      const g = new THREE.BufferGeometry(),
        v = [
          -1.265,
          -0.22,
          -1.265,
          1.265,
          -0.22,
          -1.265,
          1.265,
          H,
          -1.265,
          -1.265,
          -0.22,
          -1.265,
          1.265,
          H,
          -1.265,
          -1.265,
          H,
          -1.265,
          -1.265,
          -0.22,
          1.265,
          1.265,
          0,
          1.265,
          1.265,
          -0.22,
          1.265,
          -1.265,
          -0.22,
          1.265,
          -1.265,
          0,
          1.265,
          1.265,
          0,
          1.265,
          -1.265,
          -0.22,
          -1.265,
          -1.265,
          H,
          -1.265,
          -1.265,
          0,
          1.265,
          -1.265,
          -0.22,
          -1.265,
          -1.265,
          0,
          1.265,
          -1.265,
          -0.22,
          1.265,
          1.265,
          -0.22,
          -1.265,
          1.265,
          -0.22,
          1.265,
          1.265,
          0,
          1.265,
          1.265,
          -0.22,
          -1.265,
          1.265,
          0,
          1.265,
          1.265,
          H,
          -1.265,
          -1.265,
          H,
          -1.265,
          1.265,
          H,
          -1.265,
          1.265,
          0,
          1.265,
          -1.265,
          H,
          -1.265,
          1.265,
          0,
          1.265,
          -1.265,
          0,
          1.265,
        ];
      g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
      g.computeVertexNormals();
      surfaceUV(g);
      const wedge = new THREE.Mesh(g, this.m.cream);
      wedge.castShadow = true;
      wedge.receiveShadow = true;
      group.add(wedge);
    } else
      this.box(
        group,
        0,
        -0.14,
        0,
        T - 0.025,
        0.14,
        T - 0.025,
        this.m.paving,
        0.018,
      );
    if (tile.kind === "clinic") {
      this.box(group, 0, 0.015, 0, 2.3, 0.03, 2.3, this.m.sage, 0.04);
      this.clinic(group, 0, 0, 0, 1.45);
    } else if (tile.kind === "tee") this.tee(group);
    else {
      const path = this.roadPath(tile.kind),
        isRail = tile.kind === "rail" || tile.kind === "railCorner";
      if (isRail) this.railDeck(group, this.railPath(tile, path));
      else {
        const width = tile.kind === "wide" ? 1.8 : 1.27;
        this.ribbon(
          group,
          path.map((p) => p.clone().add(new THREE.Vector3(0, 0.045, 0))),
          width,
          0.03,
          this.m.road,
        );
        for (const side of [-1, 1])
          this.ribbon(
            group,
            path.map((p) => p.clone().add(new THREE.Vector3(0, 0.077, 0))),
            0.045,
            0.045,
            this.m.ivory,
            side * (width / 2 + 0.0225),
          );
        if (tile.kind === "oneway") this.paint(group, path, true);
        else this.paint(group, path);
        if (tile.kind === "bridge") {
          this.railDeck(rail, this.railPath(tile, path));
          rail.visible = false;
          group.add(rail);
        }
      }
    }
    const platform = this.railPlatforms.find((p) => p.cell.id === tile.cell);
    if (platform) {
      const a = (-tile.rotation * Math.PI) / 2,
        cs = Math.cos(a),
        sn = Math.sin(a),
        fx = platform.dir === 1 ? 1 : platform.dir === 3 ? -1 : 0,
        fz = platform.dir === 2 ? 1 : platform.dir === 0 ? -1 : 0;
      const path = Array.from({ length: 29 }, (_, i) => {
        const d = -R + (i / 28) * T,
          wx = fx * d,
          wz = fz * d;
        return new THREE.Vector3(wx * cs - wz * sn, 0, wx * sn + wz * cs);
      });
      this.railDeck(group, this.railPath(tile, path));
    }
    if (!tile.locked) {
      const basePorts = roadPorts({ ...tile, rotation: 0 }),
        free = ([0, 1, 2, 3] as Dir[]).filter((d) => !basePorts.includes(d));
      for (const d of free.slice(0, 2)) {
        const grip = new THREE.Group(),
          bridge = tile.kind === "bridge";
        grip.position.set(
          d === 1 ? 1.11 : d === 3 ? -1.11 : 0,
          tile.kind === "ramp" ? H / 2 + 0.012 : bridge ? 0.17 : 0.008,
          d === 2
            ? bridge
              ? 0.76
              : 1.11
            : d === 0
              ? bridge
                ? -0.76
                : -1.11
              : 0,
        );
        grip.rotation.y = d % 2 ? Math.PI / 2 : 0;
        group.add(grip);
        this.box(grip, 0, 0, 0, 0.43, 0.007, 0.095, this.m.road, 0.012);
        for (const side of [-1, 1])
          this.box(
            grip,
            0,
            0.004,
            side * 0.06,
            0.48,
            0.024,
            0.025,
            this.m.paving,
            0.004,
          );
        for (const side of [-1, 1])
          this.box(
            grip,
            side * 0.23,
            0.004,
            0,
            0.025,
            0.024,
            0.095,
            this.m.paving,
            0.004,
          );
      }
    }
    if (tile.locked)
      for (const x of [-1.07, 1.07])
        this.cylinder(group, x, 0.012, -1.08, 0.037, 0.018, this.m.steel);
    this.tileWorld.add(group);
    return {
      group,
      angle: (-tile.rotation * Math.PI) / 2,
      vy: 0,
      kind: tile.kind,
      rail: tile.kind === "bridge" ? rail : undefined,
    };
  }
  private roof(
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
  ) {
    const g = new THREE.BufferGeometry(),
      a = w / 2,
      b = d / 2,
      h = 0.29,
      v = [
        -a,
        0,
        -b,
        a,
        0,
        -b,
        0,
        h,
        -b,
        -a,
        0,
        b,
        0,
        h,
        b,
        a,
        0,
        b,
        -a,
        0,
        -b,
        0,
        h,
        -b,
        0,
        h,
        b,
        -a,
        0,
        -b,
        0,
        h,
        b,
        -a,
        0,
        b,
        a,
        0,
        -b,
        a,
        0,
        b,
        0,
        h,
        b,
        a,
        0,
        -b,
        0,
        h,
        b,
        0,
        h,
        -b,
      ];
    g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
    g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, this.m.roof);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.material.side = THREE.DoubleSide;
    parent.add(mesh);
  }
  private windowFrame(
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
  ) {
    this.box(parent, x, y, z, w, h, 0.023, this.m.glass, 0.003);
    for (const side of [-1, 1]) {
      this.box(
        parent,
        x + side * (w / 2 + 0.025),
        y - 0.025,
        z + 0.035,
        0.045,
        h + 0.075,
        0.09,
        this.m.ivory,
        0.004,
      );
      this.box(
        parent,
        x,
        y + side * (h / 2 + 0.025),
        z + 0.035,
        w + 0.09,
        0.045,
        0.09,
        this.m.ivory,
        0.004,
      );
    }
    this.box(parent, x, y, z + 0.018, 0.013, h, 0.012, this.m.steel, 0.002);
    this.box(
      parent,
      x,
      y - h / 2 - 0.038,
      z + 0.07,
      w + 0.13,
      0.035,
      0.17,
      this.m.cream,
      0.004,
    );
  }
  private facade(parent: THREE.Object3D, w: number, h: number, d: number) {
    this.box(parent, 0, 0, 0, w, h, d, this.m.ivory, 0.018);
    const floors = h > 1.15 ? 2 : 1;
    for (let floor = 0; floor < floors; floor++) {
      const y = 0.38 + (floor * (h - 0.38)) / floors;
      for (const side of [-1, 1])
        this.windowFrame(
          parent,
          side * w * 0.27,
          y,
          d / 2 + 0.013,
          w * 0.23,
          0.31,
        );
    }
    this.box(
      parent,
      0,
      0.025,
      d / 2 + 0.016,
      0.23,
      0.49,
      0.035,
      this.m.glass,
      0.003,
    );
    this.box(
      parent,
      0,
      0.52,
      d / 2 + 0.09,
      0.37,
      0.045,
      0.25,
      this.m.cream,
      0.007,
    );
    this.box(parent, 0, 0, d / 2 + 0.18, 0.35, 0.06, 0.3, this.m.paving, 0.006);
  }
  private solarHeater(parent: THREE.Object3D, x: number, y: number, z: number) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    parent.add(g);
    const panel = this.box(
      g,
      0,
      0.1,
      0.08,
      0.35,
      0.024,
      0.39,
      this.m.glass,
      0.003,
    );
    panel.rotation.x = -0.48;
    for (const dx of [-0.13, -0.045, 0.045, 0.13]) {
      const line = this.box(
        g,
        dx,
        0.121,
        0.08,
        0.006,
        0.005,
        0.36,
        this.m.steel,
        0.001,
      );
      line.rotation.x = -0.48;
    }
    const tank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.077, 0.077, 0.35, 12),
      this.m.ivory,
    );
    tank.rotation.z = Math.PI / 2;
    tank.position.set(0, 0.29, -0.105);
    tank.castShadow = true;
    g.add(tank);
    for (const dx of [-0.13, 0.13])
      this.box(g, dx, 0, -0.105, 0.02, 0.23, 0.02, this.m.steel, 0.002);
  }
  private apartment(
    parent: THREE.Object3D,
    x: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    parent.add(g);
    this.facade(g, w, h, d);
    for (const side of [-1, 1]) {
      this.box(
        g,
        side * (w / 2 - 0.035),
        h,
        0,
        0.07,
        0.13,
        d,
        this.m.ivory,
        0.008,
      );
      this.box(
        g,
        0,
        h,
        side * (d / 2 - 0.035),
        w,
        0.13,
        0.07,
        this.m.ivory,
        0.008,
      );
    }
    this.box(g, 0, h - 0.014, 0, w - 0.1, 0.022, d - 0.1, this.m.roof, 0.003);
    this.solarHeater(g, 0, h + 0.025, -0.05);
    const balconyY = h * 0.54;
    this.box(
      g,
      0,
      balconyY,
      d / 2 + 0.16,
      w * 0.76,
      0.05,
      0.34,
      this.m.paving,
      0.007,
    );
    for (let i = 0; i < 7; i++)
      this.box(
        g,
        -w * 0.35 + (i * w * 0.7) / 6,
        balconyY + 0.05,
        d / 2 + 0.3,
        0.013,
        0.24,
        0.013,
        this.m.steel,
        0.002,
      );
    this.box(
      g,
      0,
      balconyY + 0.29,
      d / 2 + 0.3,
      w * 0.75,
      0.016,
      0.017,
      this.m.steel,
      0.002,
    );
    for (const side of [-1, 1])
      this.box(
        g,
        side * w * 0.36,
        balconyY + 0.27,
        d / 2 + 0.17,
        0.015,
        0.015,
        0.28,
        this.m.steel,
        0.002,
      );
    const side = new THREE.Group();
    side.position.set(-w / 2 - 0.014, 0, 0);
    side.rotation.y = -Math.PI / 2;
    g.add(side);
    this.windowFrame(side, 0, 0.43, 0, d * 0.35, 0.34);
    this.windowFrame(side, 0, h * 0.72, 0, d * 0.35, 0.32);
    this.box(
      g,
      w * 0.22,
      0.015,
      d / 2 + 0.33,
      0.23,
      0.22,
      0.2,
      this.m.paving,
      0.01,
    );
    this.bush(g, w * 0.22, d / 2 + 0.34, 0.17);
  }

  private school(parent: THREE.Object3D) {
    this.facade(parent, 1.95, 1.24, 0.49);
    this.box(parent, 0, 1.24, 0, 2.02, 0.1, 0.57, this.m.roof, 0.03);
    this.box(parent, 0, 1.34, -0.16, 1.4, 0.13, 0.16, this.m.ivory, 0.035);
    this.box(parent, 0, 1.35, -0.03, 0.54, 0.27, 0.15, this.m.ivory, 0.025);
    const clock = new THREE.Mesh(
      new THREE.CircleGeometry(0.1, 24),
      this.m.mark,
    );
    clock.position.set(0, 1.49, 0.054);
    parent.add(clock);
    this.box(parent, 0, 1.485, 0.065, 0.012, 0.085, 0.012, this.m.teal, 0.002);
    this.box(
      parent,
      0.018,
      1.477,
      0.07,
      0.045,
      0.012,
      0.012,
      this.m.teal,
      0.002,
    );
  }
  private clinic(
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    w = 1.6,
  ) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    parent.add(g);
    this.facade(g, w, 1.1, 0.55);
    this.box(g, 0, 1.1, 0, w + 0.08, 0.1, 0.63, this.m.cream, 0.035);
    this.box(g, 0, 0.74, 0.3, 0.11, 0.38, 0.045, this.m.roof, 0.018);
    this.box(g, 0, 0.88, 0.31, 0.38, 0.11, 0.045, this.m.roof, 0.018);
  }
  private landmark(c: Cell) {
    const root = new THREE.Group();
    root.position.set(c.x * T, c.height * H + 0.01, c.z * T);
    root.userData.cell = c.id;
    this.landmarkWorld.add(root);
    this.landmarkRoots.push(root);
    const tile = this.mission!.tiles.find((t) => t.cell === c.id),
      ports = tile ? roadPorts(tile) : [1, 3],
      free = ([0, 1, 2, 3] as Dir[]).find((d) => !ports.includes(d)) ?? 0,
      lot = this.landmarkLots.get(c.id),
      full = !!lot,
      kind = c.landmark!.kind;
    const group = new THREE.Group();
    root.add(group);
    let lotWidth = 2.26,
      lotDepth = 2.26;
    if (lot) {
      const lotIds = c.landmark!.lots?.length ? c.landmark!.lots : [lot.id],
        lots = lotIds
          .map((id) => this.mission!.cells.find((c) => c.id === id)!)
          .filter(Boolean);
      const minX = Math.min(...lots.map((c) => c.x)),
        maxX = Math.max(...lots.map((c) => c.x)),
        minZ = Math.min(...lots.map((c) => c.z)),
        maxZ = Math.max(...lots.map((c) => c.z)),
        cx = (minX + maxX) / 2,
        cz = (minZ + maxZ) / 2;
      group.userData.cell = lot.id;
      group.userData.lotCells = lotIds;
      group.position.set(
        (cx - c.x) * T,
        (lot.height - c.height) * H,
        (cz - c.z) * T,
      );
      if (lots.length > 1) {
        const eastWest = maxX - minX >= maxZ - minZ;
        group.rotation.y = eastWest
          ? c.z >= cz
            ? 0
            : Math.PI
          : c.x >= cx
            ? Math.PI / 2
            : -Math.PI / 2;
        lotWidth = (eastWest ? maxX - minX + 1 : maxZ - minZ + 1) * T - 0.34;
        lotDepth = (eastWest ? maxZ - minZ + 1 : maxX - minX + 1) * T - 0.34;
      } else group.rotation.y = Math.atan2(c.x - lot.x, c.z - lot.z);
      this.box(
        group,
        0,
        0.018,
        0,
        lotWidth,
        0.035,
        lotDepth,
        this.m.paving,
        0.01,
      );
      const a = group.rotation.y;
      this.landmarkCourts.set(c.id, {
        x: cx * T + Math.sin(a) * 0.82,
        z: cz * T + Math.cos(a) * 0.82,
        y: lot.height * H + 0.12,
        angle: a,
      });
    } else {
      group.rotation.y = (-free * Math.PI) / 2;
      group.position.set(
        -Math.sin((-free * Math.PI) / 2) * 0.96,
        0,
        -Math.cos((-free * Math.PI) / 2) * 0.96,
      );
    }
    if (kind === "home") {
      if (full) {
        this.apartment(group, -0.53, -0.12, 0.89, 1.38, 0.89);
        this.apartment(group, 0.52, 0.05, 0.87, 1.58, 0.87);
        this.gardenWall(group, 0, 0, -1.06, 0.12, 2.2, Math.PI / 2, 0.24);
        this.bicycle(group, -0.72, 0.83);
        this.pavingJoints(group, 2.2, 2.2, 0.062);
      } else {
        this.apartment(group, -0.47, 0, 0.73, 1.14, 0.43);
        this.apartment(group, 0.43, 0, 0.71, 1.28, 0.43);
      }
    } else if (kind === "school" && full) {
      const width = Math.min(3.95, lotWidth - 0.35),
        scaleDepth = Math.min(2.12, (lotDepth - 1.0) / 0.546);
      if (this.schoolTemplate) {
        const model = this.schoolTemplate.clone(true);
        model.scale.set(width, width > 2.4 ? 3.2 : 2.55, scaleDepth);
        model.position.set(0, 0.065, -0.4);
        group.add(model);
        this.schoolInstances.push(model);
        this.solarHeater(group, width * 0.25, width > 2.4 ? 1.34 : 1.08, -0.43);
      } else {
        const building = new THREE.Group();
        building.position.z = -0.34;
        group.add(building);
        this.facade(building, width, 1.18, 1.08);
        this.box(
          building,
          0,
          1.18,
          -0.34,
          width + 0.04,
          0.14,
          0.12,
          this.m.cream,
          0.01,
        );
        this.box(
          building,
          0,
          0.78,
          0.69,
          0.9,
          0.055,
          0.42,
          this.m.cream,
          0.008,
        );
      }
      this.box(
        group,
        0,
        0.07,
        0.76,
        lotWidth - 0.22,
        0.018,
        0.66,
        this.m.paving,
        0.007,
      );
      this.pavingJoints(group, lotWidth, lotDepth, 0.071);
      const courtWidth = Math.min(2.2, lotWidth - 0.4),
        line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-courtWidth / 2, 0.094, 0.51),
            new THREE.Vector3(courtWidth / 2, 0.094, 0.51),
            new THREE.Vector3(courtWidth / 2, 0.094, 1.03),
            new THREE.Vector3(-courtWidth / 2, 0.094, 1.03),
            new THREE.Vector3(-courtWidth / 2, 0.094, 0.51),
          ]),
          new THREE.LineBasicMaterial({ color: 0xe3dcc8 }),
        );
      group.add(line);
      for (const x of [-lotWidth / 2 + 0.09, lotWidth / 2 - 0.09]) {
        this.gardenWall(group, x, 0.04, 0.52, 0.11, 1.04, 0, 0.23);
        this.bush(group, x, 0.08, 0.17);
      }
      this.box(group, 0, 0.06, 1.18, 0.62, 0.04, 0.21, this.m.paving, 0.008);
      this.courtFence(group, lotWidth - 0.25, 1.1);
    } else if (kind === "school") this.school(group);
    else if (kind === "clinic")
      this.clinic(group, 0, 0, full ? -0.25 : 0, full ? 1.95 : 1.65);
    else if (kind === "jobs") {
      for (const x of [-0.52, 0.52]) {
        this.box(
          group,
          x,
          0,
          0,
          0.87,
          1.45 + Math.abs(x) * 0.4,
          full ? 1.1 : 0.5,
          this.m.ivory,
          0.04,
        );
        for (let y = 0.35; y < 1.4; y += 0.37)
          this.box(
            group,
            x,
            y,
            full ? 0.565 : 0.265,
            0.6,
            0.2,
            0.035,
            this.m.teal,
            0.006,
          );
      }
    } else {
      this.box(
        group,
        0,
        0,
        0,
        2.05,
        0.12,
        full ? 0.9 : 0.55,
        this.m.cream,
        0.035,
      );
      for (const x of [-0.85, 0.85])
        this.box(group, x, 0.12, 0, 0.045, 0.74, 0.045, this.m.teal, 0.01);
      this.box(
        group,
        0,
        0.86,
        0,
        2.17,
        0.09,
        full ? 1.03 : 0.65,
        this.m.roof,
        0.035,
      );
    }
    const pickup = new THREE.Group();
    pickup.rotation.y = (-free * Math.PI) / 2;
    root.add(pickup);
    this.box(pickup, 0, 0.025, 0.98, 2.0, 0.035, 0.47, this.m.paving, 0.008);
    if (kind === "home" || kind === "station") {
      this.shelter(pickup, 0, 1.04);
    }
    this.streetLamp(pickup, -0.84, 1.0);
    if (kind === "school" && !full)
      this.box(pickup, 0, 0.076, 0.99, 1.45, 0.015, 0.39, this.m.teal, 0.01);
    if (kind !== "school" || !this.schoolTemplate) this.batch(group);
  }
  private pavingJoints(
    parent: THREE.Object3D,
    w: number,
    d: number,
    y: number,
  ) {
    const vertices: number[] = [];
    for (let i = -w / 2; i <= w / 2; i += 0.44)
      vertices.push(i, y, -d / 2, i, y, d / 2);
    for (let z = -d / 2; z <= d / 2; z += 0.44)
      vertices.push(-w / 2, y, z, w / 2, y, z);
    const lines = new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3),
      ),
      new THREE.LineBasicMaterial({
        color: 0xaaa79b,
        transparent: true,
        opacity: 0.35,
      }),
    );
    parent.add(lines);
  }
  private gardenWall(
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    thick: number,
    length: number,
    angle: number,
    h = 0.28,
  ) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = angle;
    parent.add(g);
    for (let row = 0; row < 3; row++) {
      const count = Math.ceil(length / 0.3),
        w = length / count;
      for (let i = 0; i < count; i++)
        this.box(
          g,
          0,
          (row * h) / 3,
          -length / 2 + (i + 0.5) * w,
          thick,
          h / 3 - 0.006,
          w - 0.008,
          this.m.cream,
          0.007,
        );
    }
    this.box(
      g,
      0,
      h,
      0,
      thick + 0.035,
      0.035,
      length + 0.015,
      this.m.ivory,
      0.007,
    );
  }
  private naturalRock(parent: THREE.Object3D, x: number, z: number, r: number) {
    const geo = new THREE.IcosahedronGeometry(r, 1),
      pos = geo.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      const v = 1 + (noise(i + r * 137) - 0.5) * 0.28;
      pos.setXYZ(i, pos.getX(i) * v, pos.getY(i) * v, pos.getZ(i) * v);
    }
    geo.computeVertexNormals();
    surfaceUV(geo);
    const rock = new THREE.Mesh(geo, this.m.rock);
    rock.position.set(x, r * 0.22, z);
    rock.scale.y = 0.62;
    rock.rotation.y = noise(x * 41 + z) * 6;
    rock.castShadow = true;
    rock.receiveShadow = true;
    parent.add(rock);
  }
  private landscapePatch(parent: THREE.Object3D, seed: number, quiet: boolean) {
    const cx = (noise(seed + 3) - 0.5) * 0.65,
      cz = (noise(seed + 6) - 0.5) * 0.65;
    const bed = new THREE.Mesh(
      new THREE.CircleGeometry(0.76, 24),
      this.m.quiet,
    );
    bed.rotation.x = -Math.PI / 2;
    bed.scale.set(1, 0.57, 1);
    bed.position.set(cx, 0.011, cz);
    bed.receiveShadow = true;
    if (quiet) parent.add(bed);
    for (let i = 0; i < 5; i++) {
      const a = i * 2.399,
        r = 0.24 + noise(seed + i) * 0.36;
      this.bush(
        parent,
        cx + Math.cos(a) * r,
        cz + Math.sin(a) * r * 0.6,
        0.11 + noise(seed + i + 33) * 0.08,
      );
    }
    const v: number[] = [];
    for (let i = 0; i < 28; i++) {
      const a = noise(seed + i * 3) * Math.PI * 2,
        r = Math.sqrt(noise(seed + i * 3 + 1)) * 0.8,
        x = cx + Math.cos(a) * r,
        z = cz + Math.sin(a) * r * 0.58,
        h = 0.055 + noise(seed + i + 8) * 0.09;
      for (let j = 0; j < 3; j++) {
        const angle = (j * Math.PI) / 3,
          dx = Math.cos(angle) * 0.025,
          dz = Math.sin(angle) * 0.025;
        v.push(
          x - dx,
          0.012,
          z - dz,
          x + dx,
          0.012,
          z + dz,
          x + dx * 0.7,
          h,
          z + dz * 0.7,
        );
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
    geo.computeVertexNormals();
    const grass = new THREE.Mesh(geo, quiet ? this.m.leaf : this.m.leafLight);
    grass.material.side = THREE.DoubleSide;
    parent.add(grass);
  }

  private leafCluster(
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    r: number,
    seed: number,
    count: number,
  ) {
    const vertices: number[] = [],
      colors: number[] = [],
      c = new THREE.Color(),
      p = new THREE.Vector3(),
      rotation = new THREE.Euler();
    for (let i = 0; i < count; i++) {
      const a = noise(seed + i * 7) * Math.PI * 2,
        q = Math.cbrt(noise(seed + i * 7 + 1)) * r,
        cx = x + Math.cos(a) * q,
        cy = y + (noise(seed + i * 7 + 2) - 0.5) * r * 1.2,
        cz = z + Math.sin(a) * q;
      rotation.set(
        noise(seed + i * 7 + 3) * Math.PI,
        noise(seed + i * 7 + 4) * Math.PI,
        noise(seed + i * 7 + 5) * Math.PI,
      );
      const length = 0.025 + noise(seed + i * 7 + 6) * 0.013,
        width = length * 0.33,
        points: THREE.Vector3[] = [];
      for (let k = 0; k < 6; k++) {
        const t = (k * Math.PI) / 3;
        p.set(Math.cos(t) * length, 0, Math.sin(t) * width).applyEuler(
          rotation,
        );
        points.push(p.clone().add(new THREE.Vector3(cx, cy, cz)));
      }
      c.setHex([0x31442e, 0x465638, 0x6b7659, 0x566744][i % 4]);
      for (let k = 1; k < 5; k++)
        for (const v of [points[0], points[k], points[k + 1]]) {
          vertices.push(v.x, v.y, v.z);
          colors.push(c.r, c.g, c.b);
        }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    surfaceUV(g);
    const leaves = new THREE.Mesh(g, this.m.foliage);
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    parent.add(leaves);
  }
  private tree(parent: THREE.Object3D, x: number, z: number, size: number) {
    const trunk = this.cylinder(
      parent,
      x,
      0.01,
      z,
      0.043 * size,
      0.85 * size,
      this.m.trunk,
    );
    trunk.rotation.z = 0.055;
    for (let branch = 0; branch < 6; branch++) {
      const a = branch * 2.399,
        r = 0.28 * size,
        limb = this.cylinder(
          parent,
          x + Math.cos(a) * r,
          0.49 * size,
          z + Math.sin(a) * r,
          0.018 * size,
          0.5 * size,
          this.m.trunk,
        );
      limb.rotation.z = -Math.cos(a) * 0.64;
      limb.rotation.x = Math.sin(a) * 0.64;
      this.leafCluster(
        parent,
        x + Math.cos(a) * r,
        (0.95 + noise(branch + x) * 0.25) * size,
        z + Math.sin(a) * r,
        0.3 * size,
        branch * 81 + x * 39 + z * 31,
        95,
      );
    }
    this.leafCluster(
      parent,
      x,
      1.15 * size,
      z,
      0.32 * size,
      x * 61 + z * 41,
      120,
    );
  }
  private bush(parent: THREE.Object3D, x: number, z: number, r: number) {
    this.leafCluster(parent, x, r * 0.72, z, r, x * 83 + z * 67, 65);
  }

  private bench(parent: THREE.Object3D, x: number, z: number) {
    for (let i = 0; i < 4; i++)
      this.box(
        parent,
        x,
        0.15,
        z + (i - 1.5) * 0.052,
        0.62,
        0.025,
        0.042,
        this.m.trunk,
        0.004,
      );
    this.box(parent, x, 0.29, z - 0.1, 0.62, 0.11, 0.025, this.m.trunk, 0.005);
    for (const side of [-1, 1])
      this.box(
        parent,
        x + side * 0.23,
        0,
        z,
        0.025,
        0.15,
        0.18,
        this.m.steel,
        0.004,
      );
  }
  private shelter(parent: THREE.Object3D, x: number, z: number) {
    for (const side of [-1, 1])
      this.box(
        parent,
        x + side * 0.56,
        0.04,
        z,
        0.02,
        0.72,
        0.025,
        this.m.steel,
        0.003,
      );
    this.box(parent, x, 0.76, z, 1.24, 0.027, 0.46, this.m.steel, 0.005);
    this.box(
      parent,
      x,
      0.21,
      z + 0.17,
      1.11,
      0.47,
      0.012,
      this.m.shelterGlass,
      0.002,
    );
    this.bench(parent, x, z + 0.03);
  }

  private streetLamp(parent: THREE.Object3D, x: number, z: number) {
    this.cylinder(parent, x, 0.015, z, 0.018, 1.08, this.m.steel);
    const arm = this.cylinder(
      parent,
      x + 0.055,
      1.04,
      z,
      0.012,
      0.22,
      this.m.steel,
    );
    arm.rotation.z = -0.58;
    this.box(
      parent,
      x + 0.12,
      1.21,
      z,
      0.16,
      0.025,
      0.075,
      this.m.steel,
      0.004,
    );
    this.box(
      parent,
      x + 0.12,
      1.204,
      z,
      0.11,
      0.009,
      0.05,
      this.m.ivory,
      0.002,
    );
  }
  private courtFence(parent: THREE.Object3D, w: number, z: number) {
    for (const side of [-1, 1]) {
      const start = 0.35,
        end = w / 2;
      for (let x = start; x <= end; x += 0.14)
        this.box(
          parent,
          side * x,
          0.08,
          z,
          0.012,
          0.29,
          0.012,
          this.m.steel,
          0.002,
        );
      this.box(
        parent,
        (side * (start + end)) / 2,
        0.37,
        z,
        end - start,
        0.018,
        0.018,
        this.m.steel,
        0.002,
      );
    }
  }
  private bicycle(parent: THREE.Object3D, x: number, z: number) {
    const group = new THREE.Group();
    group.position.set(x, 0.02, z);
    parent.add(group);
    for (const side of [-1, 1]) {
      const wheel = new THREE.Mesh(
        new THREE.TorusGeometry(0.105, 0.013, 6, 18),
        this.m.road,
      );
      wheel.position.set(side * 0.16, 0.13, 0);
      group.add(wheel);
      const spokes: number[] = [];
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        spokes.push(
          side * 0.16,
          0.13,
          0,
          side * 0.16 + Math.cos(a) * 0.1,
          0.13 + Math.sin(a) * 0.1,
          0,
        );
      }
      group.add(
        new THREE.LineSegments(
          new THREE.BufferGeometry().setAttribute(
            "position",
            new THREE.Float32BufferAttribute(spokes, 3),
          ),
          new THREE.LineBasicMaterial({ color: 0x858b86 }),
        ),
      );
    }
    const points = [
      new THREE.Vector3(-0.16, 0.13, 0),
      new THREE.Vector3(-0.04, 0.29, 0),
      new THREE.Vector3(0.07, 0.13, 0),
      new THREE.Vector3(0.12, 0.3, 0),
      new THREE.Vector3(0.16, 0.13, 0),
    ];
    for (const [a, b] of [
      [0, 1],
      [1, 2],
      [2, 0],
      [1, 3],
      [2, 3],
      [3, 4],
    ]) {
      const d = points[b].clone().sub(points[a]),
        tube = new THREE.Mesh(
          new THREE.CylinderGeometry(0.009, 0.009, d.length(), 5),
          this.m.steel,
        );
      tube.position.copy(points[a]).addScaledVector(d, 0.5);
      tube.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        d.normalize(),
      );
      group.add(tube);
    }
    this.box(group, -0.04, 0.32, 0, 0.09, 0.016, 0.045, this.m.trunk, 0.002);
    this.box(group, 0.13, 0.35, 0, 0.018, 0.012, 0.11, this.m.steel, 0.002);
  }
  private buildRack(loose: Tile[]) {
    this.rackSlots.clear();
    this.rackKey = loose
      .map((t) => t.id)
      .sort()
      .join("|");
    const count = Math.max(1, loose.length),
      cols = Math.min(4, count),
      rows = Math.ceil(count / cols),
      w = cols * 2.75 + 0.42,
      d = rows * 2.75 + 0.42;
    this.rack.userData.width = w;
    this.rack.userData.depth = d;
    this.box(this.rack, 0, -0.28, 0, w, 0.12, d, this.m.frame, 0.025);
    this.box(
      this.rack,
      0,
      -0.16,
      0,
      w - 0.1,
      0.035,
      d - 0.1,
      this.m.paving,
      0.012,
    );
    for (let i = 0; i < count; i++) {
      const x = ((i % cols) - (cols - 1) / 2) * 2.75,
        z = (Math.floor(i / cols) - (rows - 1) / 2) * 2.75;
      this.box(
        this.rack,
        x,
        -0.125,
        z,
        2.58,
        0.015,
        2.58,
        this.m.paving,
        0.012,
      );
      if (loose[i])
        this.rackSlots.set(loose[i].id, new THREE.Vector3(x, 0.07, z));
    }
    this.positionRack();
  }
  private positionRack() {
    if (!this.mission) return;
    const m = this.mission,
      cx = ((m.cols - 1) * T) / 2,
      cz = ((m.rows - 1) * T) / 2,
      depth = Number(this.rack.userData.depth) || 2.7;
    if (this.portrait) {
      this.rack.rotation.y = Math.PI / 2;
      this.rack.position.set(-R - depth / 2 - 0.45, 0, cz);
    } else {
      this.rack.rotation.y = 0;
      this.rack.position.set(cx, 0, (m.rows - 0.5) * T + depth / 2 + 0.5);
    }
    this.rack.updateMatrixWorld(true);
  }
  private slotWorld(id: string) {
    const slot = this.rackSlots.get(id) ?? new THREE.Vector3();
    return this.rack.localToWorld(slot.clone());
  }
  private createPeople() {
    const body = new THREE.CapsuleGeometry(0.063, 0.22, 4, 7);
    body.translate(0, 0.29, 0);
    const head = new THREE.SphereGeometry(0.055, 8, 6);
    head.translate(0, 0.51, 0);
    const hair = new THREE.SphereGeometry(
      0.057,
      8,
      5,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.55,
    );
    hair.translate(0, 0.53, 0);
    const legs = mergeGeometries([
      new THREE.CylinderGeometry(0.025, 0.028, 0.16, 5).translate(
        -0.044,
        0.08,
        0,
      ),
      new THREE.CylinderGeometry(0.025, 0.028, 0.16, 5).translate(
        0.044,
        0.08,
        0,
      ),
    ])!;
    const pack = this.boxGeometry(0.13, 0.16, 0.08, 0.02);
    pack.translate(0, 0.23, -0.09);
    for (const [g, m] of [
      [body, mat(0xffffff)],
      [head, mat(0xffffff)],
      [hair, mat(0x50392e)],
      [legs, this.m.teal],
      [pack, this.m.gold],
    ] as const) {
      const mesh = new THREE.InstancedMesh(g, m, 500);
      mesh.count = 0;
      mesh.frustumCulled = false;
      mesh.castShadow = true;
      this.actors.add(mesh);
      this.peopleMeshes.push(mesh);
    }
  }
  private makeVehicle(v: Vehicle) {
    if (v.mode === "bus" && this.busTemplate)
      return this.busTemplate.clone(true);
    const g = new THREE.Group();
    if (v.mode === "bus") {
      this.box(g, 0, 0.13, 0, 0.47, 0.43, 1.0, this.m.ivory, 0.08);
      this.box(g, 0, 0.3, 0.07, 0.48, 0.21, 0.78, this.m.teal, 0.045);
      for (const x of [-0.24, 0.24])
        for (const z of [-0.32, 0.32]) {
          const tire = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.12, 0.07, 12),
            this.m.road,
          );
          tire.rotation.z = Math.PI / 2;
          tire.position.set(x, 0.12, z);
          g.add(tire);
        }
    } else {
      for (const z of [0.475, -0.475]) {
        this.box(g, 0, 0.08, z, 0.43, 0.3, 0.88, this.m.ivory, 0.09);
        this.box(g, 0, 0.2, z + 0.015, 0.44, 0.16, 0.7, this.m.teal, 0.04);
        this.box(g, 0, 0.08, z, 0.45, 0.035, 0.9, this.m.roof, 0.012);
      }
    }
    return g;
  }
  private pose(state: GameState, v: Vehicle): Pose {
    const p = vehiclePosition(state, v);
    let x = p.x * T,
      z = p.z * T,
      angle = p.angle;
    if (v.mode === "rail") {
      const o = this.railOffset(x, z),
        fx = Math.sin(angle),
        fz = Math.cos(angle),
        next = this.railOffset(x + fx * 0.025, z + fz * 0.025);
      x += o.x;
      z += o.y;
      angle = Math.atan2(fx * 0.025 + next.x - o.x, fz * 0.025 + next.y - o.y);
    }
    return { x, y: p.y * H + (v.mode === "bus" ? 0.051 : 0.09), z, angle };
  }
  private makeGapMaterial() {
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff0d1";
    ctx.beginPath();
    ctx.roundRect(14, 9, 132, 113, 24);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(61, 116);
    ctx.lineTo(80, 143);
    ctx.lineTo(91, 116);
    ctx.fill();
    ctx.lineWidth = 13;
    ctx.strokeStyle = "#24444d";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(38, 64);
    ctx.lineTo(62, 64);
    ctx.moveTo(98, 64);
    ctx.lineTo(122, 64);
    ctx.stroke();
    ctx.strokeStyle = "#cf7755";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(79, 40);
    ctx.lineTo(73, 58);
    ctx.lineTo(87, 70);
    ctx.lineTo(79, 88);
    ctx.stroke();
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return new THREE.SpriteMaterial({
      map,
      transparent: true,
      depthTest: false,
    });
  }
  private updateWaitingCues(s: GameState, reduced: boolean) {
    for (const v of s.vehicles) {
      let cue = this.waitingCues.get(v.id);
      const visible =
        v.status === "waiting" && /פער|חיבור|נסגר|gap/i.test(v.reason);
      if (visible && !cue) {
        cue = new THREE.Sprite(this.gapMaterial);
        cue.scale.set(0.77, 0.77, 1);
        cue.renderOrder = 10;
        this.feedback.add(cue);
        this.waitingCues.set(v.id, cue);
      }
      if (cue) {
        cue.visible = visible;
        if (visible) {
          const p = this.pose(s, v);
          cue.position.set(
            p.x,
            p.y + 1.68 + (reduced ? 0 : Math.sin(this.elapsed * 3) * 0.035),
            p.z,
          );
        }
      }
    }
    for (const [id, cue] of this.waitingCues)
      if (!s.vehicles.some((v) => v.id === id)) {
        this.feedback.remove(cue);
        this.waitingCues.delete(id);
      }
  }
  private makeTurnArrow() {
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(0.57, 0.028, 7, 28, Math.PI * 1.3),
      this.m.gold,
    );
    arc.rotation.x = -Math.PI / 2;
    this.turnArrow.add(arc);
    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.105, 0.25, 3),
      this.m.gold,
    );
    tip.position.set(
      Math.cos(Math.PI * 1.3) * 0.57,
      0,
      -Math.sin(Math.PI * 1.3) * 0.57,
    );
    tip.rotation.z = Math.PI / 2;
    this.turnArrow.add(tip);
    this.feedback.add(this.turnArrow);
    this.turnArrow.visible = false;
  }
  private standingPose(s: GameState, c: Cell, n: number) {
    const tile = s.tiles.find((t) => t.cell === c.id),
      ports = tile ? roadPorts(tile) : [1, 3],
      free = ([0, 1, 2, 3] as Dir[]).filter((d) => !ports.includes(d)),
      side = free.length > 1 ? free[1] : (free[0] ?? 2),
      angle = (-(side - 2) * Math.PI) / 2,
      lx = ((n % 6) - 2.5) * 0.19,
      lz = 0.99 + Math.floor(n / 6) * 0.22;
    return {
      x: c.x * T + lx * Math.cos(angle) + lz * Math.sin(angle),
      y: c.height * H + 0.09,
      z: c.z * T - lx * Math.sin(angle) + lz * Math.cos(angle),
      angle: Math.atan2(-Math.sin(angle), -Math.cos(angle)),
    };
  }
  private updatePeople(s: GameState, reduced: boolean) {
    if (reduced) this.boarding = [];
    const dummy = new THREE.Object3D();
    let count = 0;
    const put = (
      id: number,
      x: number,
      y: number,
      z: number,
      angle = 0,
      scale = 0.8,
    ) => {
      if (count >= 490) return;
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, angle, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      this.peopleMeshes.forEach((m) => m.setMatrixAt(count, dummy.matrix));
      this.peopleMeshes[0].setColorAt(
        count,
        new THREE.Color([0x2a8299, 0xd78147, 0x598a78, 0xab6c69][id % 4]),
      );
      this.peopleMeshes[1].setColorAt(
        count,
        new THREE.Color([0xd99e72, 0xc48a60, 0xa67252, 0xe4b08a][id % 4]),
      );
      count++;
    };
    const by = new Map<string, number>();
    for (const p of s.people) {
      const status = p.arrived
        ? "arrived"
        : p.vehicle
          ? "riding"
          : p.walking
            ? "walking"
            : "waiting";
      if (
        !reduced &&
        status === "riding" &&
        this.previousPeople.get(p.id) === "waiting" &&
        p.vehicle
      ) {
        const v = s.vehicles.find((v) => v.id === p.vehicle)!;
        this.boarding.push({
          id: p.id,
          cell: v.cell,
          vehicle: p.vehicle,
          start: this.elapsed,
        });
      }
      this.previousPeople.set(p.id, status);
      if (p.vehicle) continue;
      const group = s.mission.groups.find((g) => g.id === p.group)!,
        cell = s.mission.cells.find((c) => c.id === (p.cell ?? group.origin));
      if (!cell) continue;
      const k = cell.id + ":" + status,
        n = by.get(k) || 0;
      by.set(k, n + 1);
      const stand = this.standingPose(s, cell, n);
      let x = stand.x,
        z = stand.z,
        y = stand.y;
      const court = p.arrived ? this.landmarkCourts.get(cell.id) : null;
      if (court) {
        const angle = court.angle,
          lx = ((n % 8) - 3.5) * 0.17,
          lz = Math.floor(n / 8) * 0.17;
        x = court.x + lx * Math.cos(angle) + lz * Math.sin(angle);
        z = court.z - lx * Math.sin(angle) + lz * Math.cos(angle);
        y = court.y;
      }
      if (p.walking && !p.arrived) {
        const destination = s.mission.cells.find(
          (c) => c.id === group.destination,
        )!;
        const t = THREE.MathUtils.clamp(p.walking / 1.8, 0, 1);
        x = THREE.MathUtils.lerp(x, destination.x * T, t);
        z = THREE.MathUtils.lerp(z, destination.z * T + 0.99, t);
        y = THREE.MathUtils.lerp(y, destination.height * H + 0.09, t);
      }
      put(p.id, x, y, z, p.arrived ? 0 : stand.angle, p.arrived ? 0.78 : 0.8);
    }
    this.boarding = this.boarding.filter((g) => this.elapsed - g.start < 0.45);
    for (const g of this.boarding) {
      const c = s.mission.cells.find((c) => c.id === g.cell),
        v = s.vehicles.find((v) => v.id === g.vehicle);
      if (!c || !v) continue;
      const p = this.pose(s, v),
        t = THREE.MathUtils.smoothstep(this.elapsed - g.start, 0, 0.45);
      put(
        g.id,
        THREE.MathUtils.lerp(c.x * T - 0.3, p.x, t),
        THREE.MathUtils.lerp(c.height * H + 0.09, p.y + 0.2, t),
        THREE.MathUtils.lerp(c.z * T + 1.0, p.z, t),
        p.angle,
        0.8 * (1 - t * 0.65),
      );
    }
    for (const m of this.peopleMeshes) {
      m.count = count;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }
  render(s: GameState, ui: SceneUI, dt: number) {
    if (this.mission !== s.mission) this.setMission(s.mission);
    this.state = s;
    this.ui = ui;
    const step = Math.max(0.001, Math.min(0.05, dt || 1 / 60));
    if (!ui.reducedMotion) this.elapsed += step;
    if (s.event && s.event.serial !== this.eventSerial) {
      this.eventSerial = s.event.serial;
      this.eventTime = this.elapsed;
    }
    if (
      this.rackKey !==
        s.tiles
          .filter((t) => t.cell === null)
          .map((t) => t.id)
          .sort()
          .join("|") &&
      !ui.dragging
    ) {
      this.dispose(this.rack);
      this.buildRack(s.tiles.filter((t) => t.cell === null));
      this.fitCamera();
    }
    for (const c of s.mission.cells) {
      const g = this.grounds.get(c.id),
        insert = this.inserts.get(c.id);
      if (g) g.visible = !s.tiles.some((t) => t.cell === c.id);
      if (insert) {
        const socket =
          (s.mission.id <= 2 || ui.hover === c.id) &&
          c.terrain === "land" &&
          !c.servicePlot &&
          !this.landmarkLots.has(c.id) &&
          !Array.from(this.landmarkLots.values()).some((n) => n.id === c.id) &&
          (ui.hover === c.id ||
            s.tiles.some((t) => {
              if (!t.cell) return false;
              const n = s.mission.cells.find((c) => c.id === t.cell)!;
              const dx = c.x - n.x,
                dz = c.z - n.z;
              if (Math.abs(dx) + Math.abs(dz) !== 1) return false;
              const dir = (dx > 0 ? 1 : dx < 0 ? 3 : dz > 0 ? 2 : 0) as Dir;
              return roadPorts(t).includes(dir);
            }));
        insert.grass.visible = !socket;
        insert.socket.visible = socket;
        insert.decor.visible = !socket;
      }
    }
    for (const t of s.tiles) {
      let view = this.tiles.get(t.id);
      if (!view || view.kind !== t.kind) {
        if (view) {
          this.tileWorld.remove(view.group);
          this.dispose(view.group);
        }
        view = this.buildTile(t);
        this.tiles.set(t.id, view);
        const pos = t.cell ? this.cellPosition(t.cell) : this.slotWorld(t.id);
        view.group.position.copy(pos);
        view.angle = (-t.rotation * Math.PI) / 2;
        view.group.rotation.y = view.angle;
      }
      const desired = t.cell ? this.cellPosition(t.cell) : this.slotWorld(t.id);
      const dragging = ui.dragging === t.id,
        selected =
          ui.selected === t.id &&
          !t.locked &&
          !s.vehicles.some(
            (v) =>
              v.status !== "done" &&
              t.cell !== null &&
              (v.cell === t.cell || v.next === t.cell),
          );
      if (dragging && ui.pointer) {
        const rect = this.canvas.getBoundingClientRect(),
          px = ui.pointer.x - rect.left,
          py = ui.pointer.y - rect.top - (this.portrait ? 45 : 16);
        this.raycaster.setFromCamera(
          new THREE.Vector2(
            (px / rect.width) * 2 - 1,
            1 - (py / rect.height) * 2,
          ),
          this.camera,
        );
        const hover = ui.hover
          ? s.mission.cells.find((c) => c.id === ui.hover)
          : null;
        this.pointerPlane.constant = -(hover ? hover.height * H + 0.75 : 0.75);
        this.raycaster.ray.intersectPlane(
          this.pointerPlane,
          this.projectedPointer,
        );
        desired.copy(this.projectedPointer);
        if (hover) {
          desired.x = THREE.MathUtils.lerp(desired.x, hover.x * T, 0.18);
          desired.z = THREE.MathUtils.lerp(desired.z, hover.z * T, 0.18);
        }
        desired.y = Math.max(desired.y, 0.75);
      } else if (selected) desired.y += 0.13;
      const ease = ui.reducedMotion
        ? 1
        : Math.min(1, step * (dragging ? 28 : 21));
      view.group.position.x = THREE.MathUtils.lerp(
        view.group.position.x,
        desired.x,
        ease,
      );
      view.group.position.z = THREE.MathUtils.lerp(
        view.group.position.z,
        desired.z,
        ease,
      );
      if (ui.reducedMotion) view.group.position.y = desired.y;
      else {
        view.vy += (desired.y - view.group.position.y) * step * 290;
        view.vy *= Math.exp(-step * 22);
        view.group.position.y += view.vy * step;
      }
      const targetAngle = (-t.rotation * Math.PI) / 2;
      view.angle +=
        Math.atan2(
          Math.sin(targetAngle - view.angle),
          Math.cos(targetAngle - view.angle),
        ) * Math.min(1, step * 22);
      view.group.rotation.set(
        dragging && !ui.reducedMotion ? 0.07 : 0,
        view.angle,
        dragging && !ui.reducedMotion ? -0.035 : 0,
      );
      const pulse =
        s.event?.kind === "snap" && s.event.cell === t.cell
          ? Math.max(0, 1 - (this.elapsed - this.eventTime) / 0.26)
          : 0;
      view.group.scale.set(
        1,
        ui.reducedMotion ? 1 : 1 - Math.sin(pulse * Math.PI) * 0.035,
        1,
      );
      if (view.rail) {
        const cell = s.mission.cells.find((c) => c.id === t.cell);
        view.rail.visible =
          !!cell &&
          s.tiles.some((o) => {
            if (o.kind !== "rail" && o.kind !== "railCorner") return false;
            const n = s.mission.cells.find((c) => c.id === o.cell);
            return n && Math.abs(n.x - cell.x) + Math.abs(n.z - cell.z) === 1;
          });
      }
    }
    const alive = new Set(s.vehicles.map((v) => v.id));
    for (const [id, o] of this.vehicles)
      if (!alive.has(id)) {
        this.actors.remove(o);
        this.vehicles.delete(id);
      }
    for (const v of s.vehicles) {
      let mesh = this.vehicles.get(v.id);
      if (!mesh) {
        mesh = this.makeVehicle(v);
        mesh.userData.vehicle = v.id;
        mesh.scale.setScalar(v.mode === "bus" ? 2.12 : 1.35);
        this.vehicles.set(v.id, mesh);
        this.actors.add(mesh);
      }
      const p = this.pose(s, v);
      mesh.position.set(p.x, p.y, p.z);
      mesh.rotation.y = p.angle;
    }
    this.updatePeople(s, ui.reducedMotion);
    this.updateWaitingCues(s, ui.reducedMotion);
    let outlineCell =
      ui.hover ??
      (ui.hint && s.mission.cells.some((c) => c.id === ui.hint)
        ? ui.hint
        : null);
    if (!outlineCell && ui.selected) {
      const tile = s.tiles.find((t) => t.id === ui.selected);
      if (tile?.cell) outlineCell = tile.cell;
    }
    const recentBlocked =
      s.event?.kind === "blocked" && this.elapsed - this.eventTime < 0.8;
    if (recentBlocked && s.event?.cell) outlineCell = s.event.cell;
    this.outline.visible = !!outlineCell;
    if (outlineCell) {
      this.outline.position.copy(this.cellPosition(outlineCell));
      this.outline.position.y += 0.04;
      (this.outline.material as THREE.LineBasicMaterial).color.setHex(
        recentBlocked ? 0xd77a57 : PALETTE.gold,
      );
    }
    this.turnArrow.visible = !!ui.selected && !ui.dragging;
    const chosen = ui.selected ? this.tiles.get(ui.selected) : null;
    if (chosen) {
      this.turnArrow.position.copy(chosen.group.position);
      this.turnArrow.position.y += 0.65;
    }
    const closed = s.closed.join("|");
    if (closed !== this.closureKey) {
      this.closureKey = closed;
      this.dispose(this.barriers);
      for (const id of s.closed) {
        const p = this.cellPosition(id);
        this.box(
          this.barriers,
          p.x,
          p.y + 0.18,
          p.z,
          1.7,
          0.16,
          0.1,
          this.m.roof,
          0.02,
        );
        for (const x of [-0.65, 0.65])
          this.box(
            this.barriers,
            p.x + x,
            p.y,
            p.z,
            0.07,
            0.22,
            0.16,
            this.m.cream,
            0.01,
          );
      }
    }
    if (!ui.reducedMotion && this.m.water.bumpMap) {
      this.m.water.bumpMap.offset.x += step * 0.009;
      this.m.water.bumpMap.offset.y += step * 0.005;
    }
    this.renderer.render(this.scene, this.camera);
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFps >= 1000) {
      this.fps = (this.frameCount * 1000) / (now - this.lastFps);
      this.frameCount = 0;
      this.lastFps = now;
    }
  }
  private cellPosition(id: string) {
    const c = this.mission!.cells.find((c) => c.id === id);
    return c
      ? new THREE.Vector3(c.x * T, c.height * H, c.z * T)
      : new THREE.Vector3();
  }
  private project(p: THREE.Vector3) {
    const n = p.clone().project(this.camera);
    return {
      x: (n.x * 0.5 + 0.5) * this.width,
      y: (-0.5 * n.y + 0.5) * this.height,
    };
  }
  getTargets(): Targets {
    const result: Targets = { cells: {}, tiles: {}, vehicles: {} };
    for (const c of this.mission?.cells || [])
      result.cells[c.id] = this.project(
        this.cellPosition(c.id).add(new THREE.Vector3(0, 0.05, 0)),
      );
    for (const [id, t] of this.tiles)
      result.tiles[id] = this.project(
        t.group.position.clone().add(new THREE.Vector3(0, 0.1, 0)),
      );
    for (const [id, v] of this.vehicles)
      result.vehicles[id] = this.project(
        v.position.clone().add(new THREE.Vector3(0, 0.4, 0)),
      );
    return result;
  }
  pick(clientX: number, clientY: number): Pick {
    const rect = this.canvas.getBoundingClientRect();
    this.raycaster.setFromCamera(
      new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        1 - ((clientY - rect.top) / rect.height) * 2,
      ),
      this.camera,
    );
    const roots: THREE.Object3D[] = [...this.tiles.entries()]
      .filter(([id]) => id !== this.ui?.dragging)
      .map(([, t]) => t.group);
    for (const [id, g] of this.grounds)
      if (g.visible) {
        g.userData.cell = id;
        roots.push(g);
      }
    roots.push(...this.vehicles.values(), ...this.landmarkRoots);
    const hits = this.raycaster
      .intersectObjects(roots, true)
      .filter((hit) => hit.object instanceof THREE.Mesh);
    for (const hit of hits) {
      let o: THREE.Object3D | null = hit.object;
      let hitVisible = true;
      const pick: Pick = {};
      let lotCells: string[] | undefined;
      while (o) {
        if (!o.visible) hitVisible = false;
        if (!lotCells && o.userData.lotCells) lotCells = o.userData.lotCells;
        if (o.userData.tile) pick.tile = o.userData.tile;
        if (o.userData.cell && !pick.cell) pick.cell = o.userData.cell;
        if (o.userData.vehicle) pick.vehicle = o.userData.vehicle;
        o = o.parent;
      }
      if (!hitVisible) continue;
      if (lotCells?.length) {
        pick.cell = lotCells
          .map((id) => this.mission!.cells.find((c) => c.id === id)!)
          .filter(Boolean)
          .sort(
            (a, b) =>
              (a.x * T - hit.point.x) ** 2 +
              (a.z * T - hit.point.z) ** 2 -
              ((b.x * T - hit.point.x) ** 2 + (b.z * T - hit.point.z) ** 2),
          )[0]?.id;
      }
      if (pick.tile) {
        const t = this.state?.tiles.find((t) => t.id === pick.tile);
        if (t?.cell) pick.cell = t.cell;
      }
      if (pick.vehicle)
        pick.cell = this.state?.vehicles.find(
          (v) => v.id === pick.vehicle,
        )?.cell;
      if (pick.tile || pick.cell || pick.vehicle) return pick;
    }
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
      p = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(plane, p)) {
      const c = this.mission?.cells.find(
        (c) => Math.abs(c.x * T - p.x) <= R && Math.abs(c.z * T - p.z) <= R,
      );
      if (c) return { cell: c.id };
    }
    return {};
  }
  get northAngle() {
    const p = this.camera.getWorldDirection(new THREE.Vector3());
    const center = this.camera.position.clone().addScaledVector(p, 25),
      a = this.project(center),
      b = this.project(center.clone().add(new THREE.Vector3(0, 0, -1)));
    return Math.atan2(b.x - a.x, a.y - b.y);
  }
  private resize() {
    this.width = Math.max(1, this.canvas.clientWidth);
    this.height = Math.max(1, this.canvas.clientHeight);
    this.portrait = this.height > this.width * 1.1;
    this.renderer.setSize(this.width, this.height, false);
    this.positionRack();
    this.fitCamera();
  }
  private fitCamera() {
    if (!this.mission) return;
    const m = this.mission,
      cx = ((m.cols - 1) * T) / 2,
      cz = ((m.rows - 1) * T) / 2;
    const bounds = new THREE.Box3(
      new THREE.Vector3(-R - 0.35, -1.05, -R - 0.35),
      new THREE.Vector3(
        (m.cols - 0.5) * T + 0.35,
        Math.max(...m.cells.map((c) => c.height)) * H + 2.1,
        (m.rows - 0.5) * T + 0.35,
      ),
    );
    const rw = Number(this.rack.userData.width) || 2.7,
      rd = Number(this.rack.userData.depth) || 2.7;
    for (const x of [-rw / 2, rw / 2])
      for (const z of [-rd / 2, rd / 2])
        bounds.expandByPoint(
          this.rack.localToWorld(new THREE.Vector3(x, -0.4, z)),
        );
    const center = bounds.getCenter(new THREE.Vector3());
    this.camera.position
      .copy(center)
      .add(
        this.portrait
          ? m.cols <= 5 && m.rows <= 3
            ? new THREE.Vector3(-26, 27, 6)
            : new THREE.Vector3(-26, 30, 2)
          : new THREE.Vector3(-5, 24, 28),
      );
    this.camera.lookAt(center);
    this.camera.updateMatrixWorld();
    const box = new THREE.Box3();
    for (const x of [bounds.min.x, bounds.max.x])
      for (const y of [bounds.min.y, bounds.max.y])
        for (const z of [bounds.min.z, bounds.max.z])
          box.expandByPoint(
            new THREE.Vector3(x, y, z).applyMatrix4(
              this.camera.matrixWorldInverse,
            ),
          );
    const top = this.portrait ? 145 : 80,
      bottom = this.portrait ? 70 : 40,
      usableH = Math.max(180, this.height - top - bottom),
      usableW = this.width - (this.portrait ? 12 : 45),
      aspect = this.width / this.height;
    const half =
        ((Math.max(
          (box.max.y - box.min.y) / 2,
          (box.max.x - box.min.x) / ((2 * usableW) / usableH),
        ) /
          (this.portrait ? 1.01 : 1.1)) *
          this.height) /
        usableH,
      shift = ((top - bottom) / this.height) * half;
    this.camera.left = -half * aspect;
    this.camera.right = half * aspect;
    this.camera.top = half + shift;
    this.camera.bottom = -half + shift;
    this.camera.updateProjectionMatrix();
  }
}
