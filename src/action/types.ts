export type Dir = 0 | 1 | 2 | 3; // north, east, south, west; x east, z south
export type TileKind =
  | "straight"
  | "corner"
  | "tee"
  | "bridge"
  | "ramp"
  | "rail"
  | "railCorner"
  | "clinic"
  | "wide"
  | "oneway";
export type Mode = "bus" | "rail";
export type LandmarkKind = "home" | "school" | "jobs" | "clinic" | "station";
export interface Cell {
  id: string;
  x: number;
  z: number;
  height: number;
  terrain: "land" | "water" | "rock" | "quiet";
  bridgeAxis?: 0 | 1;
  servicePlot?: boolean;
  landmark?: { kind: LandmarkKind; label: string };
}
export interface Tile {
  id: string;
  kind: TileKind;
  rotation: number;
  cell: string | null;
  locked?: boolean;
}
export interface Group {
  id: string;
  origin: string;
  destination: string;
  count: number;
  label: string;
  via?: string;
  walkFrom?: string;
  local?: boolean;
}
export interface VehicleSpec {
  id: string;
  group: string;
  leg: number;
  mode: Mode;
  capacity: number;
}
export type Action =
  | { type: "place"; tile: string; cell: string }
  | { type: "rotate"; tile: string; turns?: number };
export interface Mission {
  id: number;
  title: string;
  instruction: string;
  lesson: string;
  source: string;
  cols: number;
  rows: number;
  cells: Cell[];
  tiles: Tile[];
  groups: Group[];
  fleet: VehicleSpec[];
  par: number;
  solution: Action[];
  closure?: { after: number; cell: string };
  induced?: { after: number; count: number; group: string };
}
export interface Person {
  id: number;
  group: string;
  cell: string | null;
  vehicle: string | null;
  leg: number;
  arrived: boolean;
  walking: number;
  boardings: number;
  readyAt?: number;
}
export interface Vehicle extends VehicleSpec {
  cell: string;
  previous: string | null;
  next: string | null;
  progress: number;
  returning: boolean;
  onboard: number[];
  dwell: number;
  heading: Dir;
  status: "boarding" | "moving" | "waiting" | "done";
  reason: string;
  trips: number;
}
export interface Snapshot {
  tiles: Tile[];
  people: Person[];
  vehicles: Vehicle[];
  time: number;
  moves: number;
  closed: string[];
  inducedAt: number | null;
  inducedDone: boolean;
  mode: "playing" | "paused" | "won";
}
export interface GameState extends Snapshot {
  mission: Mission;
  revision: number;
  message: string;
  undo: Snapshot[];
  event: {
    kind: "snap" | "rotate" | "blocked" | "arrival" | "win" | "undo" | "depart";
    serial: number;
    cell?: string;
  } | null;
  held?: { tile: string; origin: string | null; snapshot: Snapshot };
}
export interface SceneUI {
  selected: string | null;
  dragging: string | null;
  hover: string | null;
  pointer: { x: number; y: number } | null;
  reducedMotion: boolean;
  hint: string | null;
}
export interface Pick {
  tile?: string;
  cell?: string;
  vehicle?: string;
}
export interface ScreenPoint {
  x: number;
  y: number;
}
export interface Targets {
  cells: Record<string, ScreenPoint>;
  tiles: Record<string, ScreenPoint>;
  vehicles: Record<string, ScreenPoint>;
}
