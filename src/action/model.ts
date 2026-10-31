import type {
  Action,
  Cell,
  Dir,
  GameState,
  Mission,
  Mode,
  Person,
  Snapshot,
  Tile,
  Vehicle,
} from "./types";

const DIRS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
] as const;
const clone = <T>(v: T): T => structuredClone(v);
export const key = (x: number, z: number) => `${x},${z}`;
export const opposite = (d: number): Dir => ((d + 2) % 4) as Dir;
export function roadPorts(tile: Tile): Dir[] {
  const base: Record<Tile["kind"], number[]> = {
    straight: [1, 3],
    corner: [0, 1],
    tee: [0, 1, 3],
    bridge: [1, 3],
    ramp: [0, 2],
    rail: [1, 3],
    railCorner: [0, 1],
    clinic: [],
    wide: [1, 3],
    oneway: [1, 3],
  };
  return base[tile.kind].map((d) => ((d + tile.rotation + 4) % 4) as Dir);
}
export const cellAt = (s: GameState, id: string) =>
  s.mission.cells.find((c) => c.id === id);
export const tileAt = (s: GameState, id: string) =>
  s.tiles.find((t) => t.cell === id);
export function endpointHeight(m: Mission, t: Tile, d: Dir) {
  const c = m.cells.find((c) => c.id === t.cell);
  return (
    (c?.height ?? 0) +
    (t.kind === "ramp" && d === ((t.rotation % 4) + 4) % 4 ? 1 : 0)
  );
}
function usable(s: GameState, t: Tile, mode: Mode) {
  const station = cellAt(s, t.cell!)?.landmark?.kind === "station";
  return mode === "rail"
    ? station || ["rail", "railCorner", "bridge"].includes(t.kind)
    : !["rail", "railCorner", "clinic"].includes(t.kind) || station;
}
export function neighbors(s: GameState, id: string, mode: Mode): string[] {
  const c = cellAt(s, id),
    t = tileAt(s, id);
  if (!c || !t || !usable(s, t, mode)) return [];
  const out: string[] = [];
  for (const d of roadPorts(t)) {
    if (t.kind === "oneway" && d !== (1 + t.rotation) % 4) continue;
    const n = key(c.x + DIRS[d][0], c.z + DIRS[d][1]),
      other = tileAt(s, n);
    if (!other || s.closed.includes(n) || !usable(s, other, mode)) continue;
    if (!roadPorts(other).includes(opposite(d))) continue;
    if (other.kind === "oneway" && opposite(d) === (1 + other.rotation) % 4)
      continue;
    if (
      endpointHeight(s.mission, t, d) !==
      endpointHeight(s.mission, other, opposite(d))
    )
      continue;
    out.push(n);
  }
  return out;
}
export function path(
  s: GameState,
  from: string,
  to: string,
  mode: Mode,
): string[] | null {
  const q = [from],
    previous = new Map<string, string | null>([[from, null]]);
  for (let i = 0; i < q.length; i++) {
    const at = q[i];
    if (at === to) {
      const result: string[] = [];
      let c: string | null = at;
      while (c !== null) {
        result.unshift(c);
        c = previous.get(c) ?? null;
      }
      return result;
    }
    for (const n of neighbors(s, at, mode))
      if (!previous.has(n)) {
        previous.set(n, at);
        q.push(n);
      }
  }
  return null;
}
const snapshot = (s: GameState): Snapshot =>
  clone({
    tiles: s.tiles,
    people: s.people,
    vehicles: s.vehicles,
    time: s.time,
    moves: s.moves,
    placements: s.placements,
    closed: s.closed,
    inducedAt: s.inducedAt,
    inducedDone: s.inducedDone,
    mode: s.mode,
  });
const emit = (
  s: GameState,
  kind: NonNullable<GameState["event"]>["kind"],
  cell?: string,
) => {
  s.event = { kind, serial: (s.event?.serial ?? 0) + 1, cell };
};
const remember = (s: GameState) => {
  s.undo.push(s.held ? clone(s.held.snapshot) : snapshot(s));
  if (s.undo.length > 60) s.undo.shift();
};
const groupOf = (s: GameState, v: Vehicle) =>
  s.mission.groups.find((g) => g.id === v.group)!;
function endpoints(s: GameState, v: Vehicle) {
  const g = groupOf(s, v);
  return {
    home: v.leg === 0 ? g.origin : g.via!,
    goal:
      v.leg === 0
        ? (g.via ?? g.walkFrom ?? g.destination)
        : (g.walkFrom ?? g.destination),
  };
}
export function createState(m: Mission): GameState {
  let id = 1;
  const people: Person[] = m.groups.flatMap((g) =>
    Array.from({ length: g.count }, () => ({
      id: id++,
      group: g.id,
      cell: g.origin,
      vehicle: null,
      leg: 0,
      arrived: false,
      walking: 0,
      boardings: 0,
    })),
  );
  const vehicles: Vehicle[] = m.fleet.map((spec) => {
    const g = m.groups.find((g) => g.id === spec.group)!;
    return {
      ...spec,
      cell: spec.leg === 0 ? g.origin : g.via!,
      previous: null,
      next: null,
      progress: 0,
      returning: false,
      onboard: [],
      dwell: 0.45,
      heading: 1,
      status: "boarding",
      reason: "",
      trips: 0,
    };
  });
  return {
    mission: m,
    tiles: clone(m.tiles),
    people,
    vehicles,
    time: 0,
    moves: 0,
    placements: 0,
    closed: [],
    inducedAt: null,
    inducedDone: false,
    mode: "playing",
    revision: 1,
    message: m.instruction,
    undo: [],
    event: null,
  };
}
function busy(s: GameState, cell: string | null) {
  return (
    cell !== null &&
    s.vehicles.some(
      (v) => v.status !== "done" && (v.cell === cell || v.next === cell),
    )
  );
}
function placementReason(s: GameState, t: Tile, c: Cell): string | null {
  if (c.terrain === "built") return "כאן יש מבנה. השאירו מקום לבתים ולשירותים.";
  if (c.terrain === "rock") return "הסלע חוסם את הכביש. נסו מסביב.";
  if (c.terrain === "quiet") return "כאן גינה שקטה. השאירו את הכביש מחוץ לה.";
  if (t.kind === "clinic")
    return c.servicePlot ? null : "המרפאה צריכה מגרש עם סימן +.";
  if (c.servicePlot) return "המגרש הזה שמור למרפאה מקומית.";
  if (c.terrain === "water") {
    if (t.kind !== "bridge") return "מעל הנחל צריך גשר עם תמיכות.";
    if (c.bridgeAxis === undefined)
      return "כאן אין תמיכות לגשר. חפשו את הגדות המוכנות.";
    const axis = c.bridgeAxis;
    if (!roadPorts(t).every((d) => d % 2 === axis))
      return "סובבו את הגשר לכיוון התמיכות.";
  } else if (t.kind === "bridge") return "הגשר מתאים לתמיכות שבנחל.";
  return null;
}
function blocked(s: GameState, text: string, cell?: string) {
  s.message = text;
  emit(s, "blocked", cell);
  return false;
}
export function beginHold(s: GameState, id: string): boolean {
  const t = s.tiles.find((t) => t.id === id);
  if (!t || t.locked || s.mode !== "playing")
    return blocked(s, "בחרו חלק חופשי מהמגש או מהלוח.");
  if (busy(s, t.cell))
    return blocked(
      s,
      "האוטובוס על החלק. חכו רגע או בטלו את המהלך.",
      t.cell ?? undefined,
    );
  if (s.held) cancelHold(s);
  s.held = { tile: id, origin: t.cell, snapshot: snapshot(s) };
  t.cell = null;
  s.revision++;
  return true;
}
export function cancelHold(s: GameState): void {
  if (!s.held) return;
  const t = s.tiles.find((t) => t.id === s.held!.tile)!,
    before = s.held.snapshot.tiles.find((p) => p.id === t.id)!;
  t.cell = s.held.origin;
  t.rotation = before.rotation;
  s.moves = s.held.snapshot.moves;
  s.placements = s.held.snapshot.placements;
  s.held = undefined;
  s.revision++;
}
export function place(s: GameState, id: string, cellId: string): boolean {
  if (s.mode === "paused") return false;
  const t = s.tiles.find((t) => t.id === id),
    c = cellAt(s, cellId);
  if (!t || !c) return false;
  if (t.locked) return blocked(s, "החלק הזה קבוע. נסו חלק מהמגש.", cellId);
  if (t.cell === cellId) return false;
  const other = tileAt(s, cellId);
  const origin = s.held?.tile === id ? s.held.origin : t.cell;
  if (other?.locked) return blocked(s, "הכביש הזה קבוע.", cellId);
  if (busy(s, t.cell) || busy(s, cellId))
    return blocked(s, "האוטובוס על החלק. חכו רגע או בטלו את המהלך.", cellId);
  const reason = placementReason(s, t, c);
  if (reason) return blocked(s, reason, cellId);
  if (other && origin === null)
    return blocked(s, "המקום תפוס. הזיזו קודם את החלק.", cellId);
  if (other && origin) {
    const back = placementReason(s, other, cellAt(s, origin)!);
    if (back) return blocked(s, back, origin);
  }
  remember(s);
  if (other) other.cell = origin;
  t.cell = cellId;
  s.moves++;
  if (origin !== cellId) s.placements++;
  s.revision++;
  s.held = undefined;
  if (
    t.kind === "wide" &&
    s.mission.induced &&
    s.inducedAt === null &&
    !s.inducedDone
  )
    s.inducedAt = s.time + s.mission.induced.after;
  if (s.mode === "won") s.mode = "playing";
  s.message =
    t.kind === "clinic"
      ? "המרפאה נפתחה. בדקו למי יש גישה אליה."
      : "קליק! החיבור השתנה.";
  emit(s, "snap", cellId);
  return true;
}
export function rotate(s: GameState, id: string, turns = 1): boolean {
  if (s.mode === "paused") return false;
  const t = s.tiles.find((t) => t.id === id);
  if (!t || t.kind === "clinic") return false;
  if (t.locked) return blocked(s, "החלק הזה קבוע.", t.cell ?? undefined);
  if (busy(s, t.cell))
    return blocked(
      s,
      "האוטובוס על החלק. חכו רגע או בטלו את המהלך.",
      t.cell ?? undefined,
    );
  const next = { ...t, rotation: (t.rotation + turns + 400) % 4 };
  if (next.cell) {
    const reason = placementReason(s, next, cellAt(s, next.cell)!);
    if (reason) return blocked(s, reason, next.cell);
  }
  if (!s.held) remember(s);
  t.rotation = next.rotation;
  s.moves++;
  s.revision++;
  s.message = "רבע סיבוב. לאן הכביש ממשיך?";
  emit(s, "rotate", t.cell ?? undefined);
  return true;
}
export function returnToTray(s: GameState, id: string): boolean {
  const t = s.tiles.find((t) => t.id === id);
  if (!t || (!t.cell && !s.held) || t.locked || s.mode === "paused")
    return false;
  if (busy(s, t.cell))
    return blocked(
      s,
      "האוטובוס על החלק. חכו רגע או בטלו את המהלך.",
      t.cell ?? undefined,
    );
  remember(s);
  const cell = t.cell ?? s.held?.origin ?? undefined;
  t.cell = null;
  s.held = undefined;
  s.moves++;
  s.revision++;
  emit(s, "snap", cell);
  s.message = "החלק חזר למגש.";
  return true;
}
export function undo(s: GameState): boolean {
  if (s.held) {
    cancelHold(s);
    return true;
  }
  const previous = s.undo.pop();
  if (!previous) return false;
  Object.assign(s, previous);
  s.revision++;
  s.message = "חזרנו צעד אחד. אפשר לנסות אחרת.";
  emit(s, "undo");
  return true;
}
export function retry(s: GameState): void {
  const fresh = createState(s.mission);
  Object.assign(s, fresh, { revision: s.revision + 1, held: undefined });
}
export function applyAction(s: GameState, a: Action) {
  return a.type === "place"
    ? place(s, a.tile, a.cell)
    : rotate(s, a.tile, a.turns ?? 1);
}
function candidate(s: GameState, v: Vehicle, target: string): string | null {
  const route = path(s, v.cell, target, v.mode);
  if (route && route.length > 1) return route[1];
  // Advance along the already fixed approach, then brake before the editable puzzle.
  const here = cellAt(s, v.cell)!,
    goal = cellAt(s, target)!;
  const options = neighbors(s, v.cell, v.mode).filter(
    (id) => id !== v.previous && tileAt(s, id)?.locked,
  );
  options.sort((a, b) => {
    const ca = cellAt(s, a)!,
      cb = cellAt(s, b)!;
    return (
      Math.abs(ca.x - goal.x) +
      Math.abs(ca.z - goal.z) -
      Math.abs(cb.x - goal.x) -
      Math.abs(cb.z - goal.z)
    );
  });
  return options[0] ?? null;
}
function peopleRemaining(s: GameState, v: Vehicle) {
  return s.people.some(
    (p) =>
      p.group === v.group && !p.arrived && p.leg <= v.leg && p.walking === 0,
  );
}
function arrive(s: GameState, v: Vehicle) {
  const g = groupOf(s, v);
  let n = 0;
  for (const id of v.onboard) {
    const p = s.people.find((p) => p.id === id)!;
    p.vehicle = null;
    p.cell = v.cell;
    if (g.via && v.leg === 0) {
      p.leg = 1;
      p.readyAt = s.time + 0.4;
    } else if (g.walkFrom) p.walking = 0.001;
    else {
      p.arrived = true;
      n++;
    }
  }
  v.onboard = [];
  v.dwell = 0.45;
  v.returning = true;
  v.previous = null;
  if (n) {
    s.message = `${n} הגיעו ליעד!`;
    emit(s, "arrival", v.cell);
  }
}
function startLeg(s: GameState, v: Vehicle) {
  const waiting = s.people.filter(
    (p) =>
      p.group === v.group &&
      !p.arrived &&
      p.leg === v.leg &&
      p.cell === v.cell &&
      !p.vehicle &&
      !p.walking &&
      (p.readyAt ?? 0) <= s.time,
  );
  for (const p of waiting.slice(0, v.capacity)) {
    p.cell = null;
    p.vehicle = v.id;
    p.boardings++;
    v.onboard.push(p.id);
  }
  if (v.onboard.length) {
    v.dwell = 0.48;
    v.trips++;
    v.status = "boarding";
    v.returning = false;
    emit(s, "depart", v.cell);
  } else {
    v.status = peopleRemaining(s, v) ? "waiting" : "done";
    v.reason =
      v.leg === 1 ? "מחכים לנוסעים מהאוטובוס" : "כולם בדרך או כבר הגיעו";
  }
}
function heading(a: Cell, b: Cell): Dir {
  return b.x > a.x ? 1 : b.x < a.x ? 3 : b.z > a.z ? 2 : 0;
}
function worldHeight(s: GameState, id: string) {
  const t = tileAt(s, id),
    c = cellAt(s, id)!;
  return c.height + (t?.kind === "ramp" ? 0.5 : 0);
}
export function vehiclePosition(s: GameState, v: Vehicle) {
  const a = cellAt(s, v.cell)!,
    b = v.next ? cellAt(s, v.next)! : a;
  const dest = endpoints(s, v),
    target = v.returning ? dest.home : dest.goal;
  const nextAfter = v.next
    ? path(s, v.next, target, v.mode)?.[1]
    : path(s, v.cell, target, v.mode)?.[1];
  const exit = v.next
    ? heading(a, b)
    : nextAfter
      ? heading(a, cellAt(s, nextAfter)!)
      : v.heading;
  const currentTile = tileAt(s, a.id);
  const entry = v.previous
    ? heading(a, cellAt(s, v.previous)!)
    : currentTile
      ? (roadPorts(currentTile).find((d) => d !== exit) ?? opposite(exit))
      : opposite(exit);
  function sample(cell: Cell, enter: Dir, leave: Dir, u: number) {
    const tile = tileAt(s, cell.id);
    // A terminal's road corner belongs to its feeder. The train is aligned
    // with the rail approach, including while waiting and on its return.
    if (v.mode === "rail" && cell.landmark?.kind === "station") {
      const adjacent = neighbors(s, cell.id, "rail");
      if (adjacent.length === 1) {
        const axis = heading(cell, cellAt(s, adjacent[0])!);
        if (enter === axis) leave = opposite(axis);
        else {
          enter = opposite(axis);
          leave = axis;
        }
      }
    }
    const e = DIRS[enter],
      o = DIRS[leave];
    let x = 0,
      z = 0,
      angle = 0;
    if (enter !== leave && (enter + 2) % 4 !== leave) {
      const cx = (e[0] + o[0]) * 0.5,
        cz = (e[1] + o[1]) * 0.5;
      const start = Math.atan2(e[1] * 0.5 - cz, e[0] * 0.5 - cx),
        end = Math.atan2(o[1] * 0.5 - cz, o[0] * 0.5 - cx);
      let delta = end - start;
      while (delta > Math.PI) delta -= 2 * Math.PI;
      while (delta < -Math.PI) delta += 2 * Math.PI;
      const theta = start + delta * u;
      x = cx + Math.cos(theta) * 0.5;
      z = cz + Math.sin(theta) * 0.5;
      angle = Math.atan2(-Math.sin(theta) * delta, Math.cos(theta) * delta);
    } else {
      x = e[0] * 0.5 * (1 - u) + o[0] * 0.5 * u;
      z = e[1] * 0.5 * (1 - u) + o[1] * 0.5 * u;
      angle = Math.atan2(o[0] - e[0], o[1] - e[1]);
    }
    const low = tile ? endpointHeight(s.mission, tile, enter) : cell.height,
      high = tile ? endpointHeight(s.mission, tile, leave) : cell.height;
    return { x: cell.x + x, z: cell.z + z, y: low + (high - low) * u, angle };
  }
  if (!v.next || v.progress < 0.5)
    return sample(a, entry, exit, 0.5 + (v.next ? v.progress : 0));
  const nextTile = tileAt(s, b.id),
    enter = opposite(exit);
  const leave = nextAfter
    ? heading(b, cellAt(s, nextAfter)!)
    : nextTile
      ? (roadPorts(nextTile).find((d) => d !== enter) ?? opposite(enter))
      : opposite(enter);
  return sample(b, enter, leave, v.progress - 0.5);
}
function bridgeBusy(s: GameState, v: Vehicle, next: string) {
  if (
    tileAt(s, next)?.kind !== "bridge" &&
    tileAt(s, v.cell)?.kind !== "bridge"
  )
    return false;
  return s.vehicles.some(
    (o) =>
      o.id !== v.id &&
      o.status !== "done" &&
      ((tileAt(s, next)?.kind === "bridge" &&
        (o.cell === next || o.next === next)) ||
        (tileAt(s, v.cell)?.kind === "bridge" && o.next === v.cell)),
  );
}
function advanceVehicle(s: GameState, v: Vehicle, dt: number) {
  const ends = endpoints(s, v);
  if (v.status === "done") return;
  if (v.dwell > 0) {
    v.dwell = Math.max(0, v.dwell - dt);
    v.status = "boarding";
    return;
  }
  if (!v.next) {
    if (!v.returning && v.cell === ends.goal && v.onboard.length) arrive(s, v);
    if (v.returning && v.cell === ends.home) {
      v.returning = false;
      v.previous = null;
    }
    if (!v.returning && v.cell === ends.home && !v.onboard.length)
      startLeg(s, v);
    if (v.dwell > 0) return;
    if (!v.onboard.length && !v.returning) {
      v.status = "waiting";
      return;
    }
    if (v.returning && !peopleRemaining(s, v)) {
      v.status = "done";
      return;
    }
    const target = v.returning ? ends.home : ends.goal,
      next = candidate(s, v, target);
    if (!next) {
      v.status = "waiting";
      v.reason = s.closed.length
        ? "הדרך נסגרה. צריך חיבור אחר."
        : "יש פער בכביש. השלימו את החיבור.";
      return;
    }
    if (bridgeBusy(s, v, next)) {
      v.status = "waiting";
      v.reason = "מחכים שהגשר יתפנה";
      return;
    }
    v.next = next;
    v.progress = 0;
    v.heading = heading(cellAt(s, v.cell)!, cellAt(s, next)!);
  }
  const next = v.next!;
  const p = vehiclePosition(s, v);
  const front = s.vehicles.some((o) => {
    if (
      o.id === v.id ||
      o.mode !== v.mode ||
      o.status === "done" ||
      o.heading !== v.heading
    )
      return false;
    const q = vehiclePosition(s, o);
    const dx = q.x - p.x,
      dz = q.z - p.z;
    return (
      Math.hypot(dx, dz) < 0.68 &&
      dx * DIRS[v.heading][0] + dz * DIRS[v.heading][1] > 0
    );
  });
  if (front) {
    v.status = "waiting";
    v.reason = "נותנים לאוטובוס שלפנים מרווח";
    return;
  }
  v.status = "moving";
  v.reason = "";
  const a = cellAt(s, v.cell)!,
    b = cellAt(s, next)!;
  const uphill = Math.max(0, worldHeight(s, b.id) - worldHeight(s, a.id));
  v.progress += (dt * (v.mode === "rail" ? 1.8 : 1.12)) / (1 + uphill * 0.65);
  if (v.progress >= 1) {
    v.previous = v.cell;
    v.cell = next;
    v.next = null;
    v.progress = 0;
  }
}
export function tick(s: GameState, seconds: number) {
  if (s.mode !== "playing") return;
  let remaining = Math.max(0, Math.min(seconds, 600));
  while (remaining > 1e-7 && s.mode === "playing") {
    const dt = Math.min(1 / 60, remaining);
    remaining -= dt;
    s.time += dt;
    const closure = s.mission.closure;
    if (
      closure &&
      s.time >= closure.after &&
      !s.closed.includes(closure.cell)
    ) {
      s.closed.push(closure.cell);
      s.revision++;
      s.message = "המעבר נסגר. מצאו דרך חלופית.";
      emit(s, "blocked", closure.cell);
    }
    if (s.inducedAt !== null && !s.inducedDone && s.time >= s.inducedAt) {
      const event = s.mission.induced!,
        g = s.mission.groups.find((g) => g.id === event.group)!;
      let id = Math.max(0, ...s.people.map((p) => p.id)) + 1;
      for (let n = 0; n < event.count; n++)
        s.people.push({
          id: id++,
          group: g.id,
          cell: g.origin,
          vehicle: null,
          leg: 0,
          arrived: false,
          walking: 0,
          boardings: 0,
        });
      s.inducedDone = true;
      s.message = `הכביש הורחב. עוד ${event.count} נוסעים הצטרפו.`;
      s.revision++;
      emit(s, "blocked", g.origin);
      for (const v of s.vehicles)
        if (v.group === g.id && v.status === "done") {
          v.status = "waiting";
          v.returning = v.cell !== endpoints(s, v).home;
        }
    }
    for (const g of s.mission.groups)
      if (g.local && tileAt(s, g.destination)?.kind === "clinic") {
        for (const p of s.people)
          if (p.group === g.id && !p.arrived && !p.walking && !p.vehicle)
            p.walking = 0.001;
      }
    for (const p of s.people)
      if (p.walking > 0 && !p.arrived) {
        p.walking += dt;
        if (p.walking >= 1.8) {
          p.arrived = true;
          p.cell = s.mission.groups.find((g) => g.id === p.group)!.destination;
          p.walking = 0;
          emit(s, "arrival", p.cell!);
        }
      }
    for (const v of s.vehicles) advanceVehicle(s, v, dt);
    if (
      !s.held &&
      s.people.every((p) => p.arrived) &&
      (s.inducedAt === null || s.inducedDone)
    ) {
      s.mode = "won";
      s.message = "הדרך עובדת. כולם הגיעו!";
      emit(s, "win");
    }
  }
}
export function stats(s: GameState) {
  const arrived = s.people.filter((p) => p.arrived).length;
  // A verified replay target, not a claimed optimum. Rotations and rejected,
  // cancelled, same-origin or tray-return gestures never consume this budget.
  const placementTarget = s.mission.solution.filter((a) => a.type === "place").length;
  return {
    total: s.people.length,
    arrived,
    waiting: s.people.filter((p) => !p.arrived && !p.vehicle && !p.walking)
      .length,
    riding: s.people.filter((p) => p.vehicle).length,
    walking: s.people.filter((p) => p.walking && !p.arrived).length,
    moves: s.moves,
    time: s.time,
    placements: s.placements,
    placementTarget,
    stars: s.placements <= placementTarget ? 3 : s.placements <= placementTarget + 2 ? 2 : 1,
    groups: s.mission.groups.map((g) => ({
      id: g.id,
      label: g.label,
      total: s.people.filter((p) => p.group === g.id).length,
      arrived: s.people.filter((p) => p.group === g.id && p.arrived).length,
    })),
  };
}
