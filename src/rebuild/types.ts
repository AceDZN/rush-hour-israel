import type { Corridor, Demand, MapNode } from "../types";
export type TransitMode = "bus" | "rail";
export interface Mission {
  id: number;
  title: string;
  region: string;
  objective: string;
  lesson: string;
  cue: string;
  nodes: MapNode[];
  corridors: Corridor[];
  demand: Demand[];
  fleet: number;
  trains: number;
  budget: number;
  softTime: number;
  efficientLength: number;
  unlock: "route" | "fleet" | "rail" | "service";
  serviceSites: string[];
  initialRoads: string[];
  initialLines: { path: string[]; mode: TransitMode }[];
  solution: { path: string[]; mode: TransitMode }[];
  solutionServices: string[];
  solutionExtras: number[];
  induced?: { at: number; count: number; origin: string; destination: string };
  noiseLimit?: number;
  footprintLimit?: number;
}
export interface Rider {
  id: number;
  origin: string;
  destination: string;
  node: string;
  status: "pending" | "waiting" | "riding" | "walking" | "arrived";
  release: number;
  vehicle: number | null;
  readyAt: number;
  arrivedAt: number | null;
  boardings: number;
  lastLine: number | null;
  walk?: { from: string; to: string; progress: number; duration: number };
}
export interface Line {
  id: number;
  mode: TransitMode;
  path: string[];
  cost: number;
}
export interface Bus {
  id: number;
  line: number;
  mode: TransitMode;
  path: string[];
  index: number;
  direction: 1 | -1;
  from: string;
  to: string;
  progress: number;
  duration: number;
  dwell: number;
  moving: boolean;
  passengers: number[];
  capacity: number;
  blocked: boolean;
  trips: number;
  boarding?: boolean;
}
export interface GameState {
  mission: Mission;
  mode: "ready" | "running" | "paused" | "won";
  clock: number;
  completedAt: number | null;
  lines: Line[];
  vehicles: Bus[];
  people: Rider[];
  roads: string[];
  services: string[];
  budget: number;
  nextLine: number;
  nextVehicle: number;
  message: string;
  localFeedback: {
    node: string;
    text: string;
    kind: "good" | "problem";
  } | null;
  revision: number;
  edits: number;
  maxQueue: number;
  history: Snapshot[];
  widened: string[];
  inducedTriggered: boolean;
}
export type Snapshot = Omit<GameState, "history">;
export interface SceneUI {
  path: string[];
  hover: string | null;
  selectedLine: number | null;
  invalid: string | null;
  mode: TransitMode;
  service: boolean;
  reducedMotion: boolean;
  pointer?: { x: number; z: number } | null;
}
export interface Pick {
  node: string | null;
  line: number | null;
  world: { x: number; z: number };
}
export interface Vec3 {
  x: number;
  y: number;
  z: number;
  angle: number;
}
