import type {
  Action,
  Cell,
  Dir,
  Group,
  Mission,
  Tile,
  TileKind,
  VehicleSpec,
} from "./types";
import { key, roadPorts } from "./model";
type P = [number, number];
const K = (p: P) => key(...p);
export const ROAD =
  "https://geography.workbook.co.il/grade-9/chapter-5/transport-communication";
export const CITY =
  "https://geography.workbook.co.il/grade-7/chapter-5/city-structure";
export const RELIEF =
  "https://geography.workbook.co.il/grade-9/chapter-2/landform-belts";
export const CORE =
  "https://geography.workbook.co.il/grade-9/chapter-4/core-periphery-israel";
export const NOISE =
  "https://geography.workbook.co.il/grade-7/chapter-5/urban-nuisances";
const dir = (a: P, b: P): Dir =>
  b[0] > a[0] ? 1 : b[0] < a[0] ? 3 : b[1] > a[1] ? 2 : 0;
export const rotate = (tile: string, turns = 1): Action => ({
  type: "rotate",
  tile,
  turns,
});
export const put = (tile: string, cell: string): Action => ({
  type: "place",
  tile,
  cell,
});
export function board(
  id: number,
  title: string,
  instruction: string,
  cols: number,
  rows: number,
  paths: P[][],
  groups: Group[],
  source = ROAD,
): Mission {
  const cells: Cell[] = Array.from({ length: cols * rows }, (_, i) => ({
    id: key(i % cols, Math.floor(i / cols)),
    x: i % cols,
    z: Math.floor(i / cols),
    height: 0,
    terrain: "land",
  }));
  const ports = new Map<string, Set<Dir>>();
  for (const path of paths)
    for (let i = 0; i < path.length; i++) {
      const ds = ports.get(K(path[i])) ?? new Set<Dir>();
      if (i > 0) ds.add(dir(path[i], path[i - 1]));
      if (i < path.length - 1) ds.add(dir(path[i], path[i + 1]));
      ports.set(K(path[i]), ds);
    }
  const tiles: Tile[] = [];
  for (const [cell, ds] of ports) {
    const dirs = [...ds];
    let kind: TileKind =
      dirs.length >= 3
        ? "tee"
        : dirs.length === 2 && Math.abs(dirs[0] - dirs[1]) % 2 === 1
          ? "corner"
          : "straight";
    const tile: Tile = {
      id: "road-" + cell,
      kind,
      rotation: 0,
      cell,
      locked: true,
    };
    for (let r = 0; r < 4; r++) {
      tile.rotation = r;
      if (dirs.every((d) => roadPorts(tile).includes(d))) break;
    }
    tiles.push(tile);
  }
  for (const g of groups) {
    cells.find((c) => c.id === g.origin)!.landmark = {
      kind: "home",
      label: g.label,
    };
    const end = cells.find((c) => c.id === g.destination)!;
    if (!end.landmark)
      end.landmark = {
        kind: g.local ? "clinic" : "school",
        label: g.local ? "מרפאה" : "בית ספר",
      };
    if (g.via)
      cells.find((c) => c.id === g.via)!.landmark = {
        kind: "station",
        label: "תחנת רכבת",
      };
    if (g.walkFrom)
      cells.find((c) => c.id === g.walkFrom)!.landmark = {
        kind: "station",
        label: "תחנה",
      };
  }
  const fleet: VehicleSpec[] = groups
    .filter((g) => !g.local)
    .flatMap((g) => [
      { id: "bus-" + g.id, group: g.id, leg: 0, mode: "bus", capacity: 6 },
      ...(g.via
        ? [
            {
              id: "train-" + g.id,
              group: g.id,
              leg: 1,
              mode: "rail" as const,
              capacity: 14,
            },
          ]
        : []),
    ]);
  return {
    roadCells: [...ports.keys()],
    id,
    title,
    instruction,
    lesson: "חיבור שימושי הוא חיבור שמביא את האנשים ליעד.",
    source,
    cols,
    rows,
    cells,
    tiles,
    groups,
    fleet,
    par: 0,
    solution: [],
  };
}
export const group = (
  id: string,
  origin: P,
  destination: P,
  count = 6,
  label = "הבתים",
  extra: Partial<Group> = {},
): Group => ({
  id,
  origin: K(origin),
  destination: K(destination),
  count,
  label,
  ...extra,
});
export const c = (m: Mission, id: string) => m.cells.find((c) => c.id === id)!;
export const t = (m: Mission, id: string) =>
  m.tiles.find((t) => t.cell === id)!;
export function loose(
  m: Mission,
  cell: string,
  rotation?: number,
  id = "piece-" + cell,
) {
  const tile = t(m, cell);
  tile.locked = false;
  tile.id = id;
  if (rotation !== undefined) tile.rotation = rotation;
  return tile;
}
export function gap(
  m: Mission,
  cell: string,
  rotation?: number,
  id = "piece-" + cell,
) {
  const tile = loose(m, cell, rotation, id);
  tile.cell = null;
  return tile;
}
export function finish(m: Mission, actions: Action[], lesson: string) {
  for (const cell of m.cells) {
    if (cell.terrain === "built") cell.terrain = "land";
    if (cell.landmark) {
      delete cell.landmark.lot;
      delete cell.landmark.lots;
    }
  }
  m.solution = actions;
  m.par = actions.reduce(
    (n, a) => n + (a.type === "rotate" ? Math.abs(a.turns ?? 1) : 1),
    0,
  );
  m.lesson = lesson;
  // A missing road is still reserved road space. Buildings receive explicit
  // lots before rendering, so a larger facade can never cover a puzzle socket.
  const occupied = new Set([
    ...(m.roadCells ?? []),
    ...m.tiles.flatMap((t) => (t.cell ? [t.cell] : [])),
    ...actions.flatMap((a) => (a.type === "place" ? [a.cell] : [])),
    ...m.cells.filter((c) => c.landmark || c.servicePlot).map((c) => c.id),
  ]);
  for (const at of m.cells.filter((c) => c.landmark)) {
    const candidates = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ].map(([dx, dz]) =>
      m.cells.find((c) => c.x === at.x + dx && c.z === at.z + dz),
    );
    const lot = candidates.find(
      (c) =>
        c &&
        c.terrain === "land" &&
        c.height === at.height &&
        !occupied.has(c.id),
    );
    if (lot) {
      at.landmark!.lot = lot.id;
      at.landmark!.lots = [lot.id];
      lot.terrain = "built";
      occupied.add(lot.id);
    }
  }
  for (const at of m.cells.filter(
    (c) => c.landmark?.kind === "school" && c.landmark.lot,
  )) {
    const primary = m.cells.find((c) => c.id === at.landmark!.lot)!;
    const extra = m.cells.find(
      (c) =>
        c.height === primary.height &&
        c.terrain === "land" &&
        Math.abs(c.x - primary.x) + Math.abs(c.z - primary.z) === 1 &&
        !occupied.has(c.id),
    );
    if (extra) {
      at.landmark!.lots!.push(extra.id);
      extra.terrain = "built";
      occupied.add(extra.id);
    }
  }
  return m;
}
export function kind(
  m: Mission,
  cell: string,
  kind: TileKind,
  rotation?: number,
) {
  const tile = t(m, cell);
  tile.kind = kind;
  if (rotation !== undefined) tile.rotation = rotation;
  return tile;
}
export function river(m: Mission, x: number, bridges: string[]) {
  for (const cell of m.cells)
    if (cell.x === x) {
      cell.terrain = "water";
      if (bridges.includes(cell.id)) cell.bridgeAxis = 1;
    }
}
