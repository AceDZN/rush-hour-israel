import type { Corridor, MapNode, Point } from "../types";
import type {
  Bus,
  GameState,
  Line,
  Mission,
  Rider,
  Snapshot,
  TransitMode,
  Vec3,
} from "./types";
export const pair = (a: string, b: string) => [a, b].sort().join("~");
export const getNode = (s: GameState, id: string) =>
  s.mission.nodes.find((n) => n.id === id)!;
export const corridorPoints = (m: Mission, c: Corridor): Point[] => [
  m.nodes.find((n) => n.id === c.a)!,
  ...(c.via || []),
  m.nodes.find((n) => n.id === c.b)!,
];
export function corridorInfo(m: Mission, c: Corridor) {
  const points = corridorPoints(m, c);
  let length = 0,
    grade = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i],
      d = Math.hypot(a.x - b.x, a.z - b.z);
    length += d;
    grade = Math.max(grade, Math.abs(a.h - b.h) / Math.max(0.01, d));
  }
  return { length, grade };
}
const corridor = (s: GameState, a: string, b: string) =>
  s.mission.corridors.find((c) => pair(c.a, c.b) === pair(a, b));
const closed = (s: GameState, c: Corridor) =>
  c.closeAt !== undefined && s.clock >= c.closeAt;
export function edgeTime(
  s: GameState,
  a: string,
  b: string,
  mode: TransitMode,
) {
  const c = corridor(s, a, b);
  if (!c) return Infinity;
  const g = corridorInfo(s.mission, c);
  return Math.max(
    0.5,
    (g.length / (mode === "rail" ? 3.9 : 2.35)) *
      (1 + g.grade * (mode === "rail" ? 2 : 4)),
  );
}
function makePeople(m: Mission): Rider[] {
  let id = 0;
  return m.demand.flatMap((d) =>
    Array.from({ length: d.count }, () => ({
      id: id++,
      origin: d.origin,
      destination: d.destination,
      node: d.origin,
      status: d.at > 0 ? ("pending" as const) : ("waiting" as const),
      release: d.at,
      vehicle: null,
      readyAt: d.at,
      arrivedAt: null,
      boardings: 0,
      lastLine: null,
    })),
  );
}
export function createGame(mission: Mission): GameState {
  const s: GameState = {
    mission,
    mode: "ready",
    clock: 0,
    completedAt: null,
    lines: [],
    vehicles: [],
    people: makePeople(mission),
    roads: [...mission.initialRoads],
    services: [],
    budget: mission.budget,
    nextLine: 1,
    nextVehicle: 1,
    message: mission.cue,
    localFeedback: null,
    revision: 0,
    edits: 0,
    maxQueue: 0,
    history: [],
    widened: [],
    inducedTriggered: false,
  };
  for (const l of mission.initialLines) {
    drawLine(s, l.path, l.mode);
    s.history = [];
  }
  s.mode = mission.initialLines.length ? "running" : "ready";
  s.message = mission.cue;
  return s;
}
function save(s: GameState) {
  const { history, ...snapshot } = s;
  s.history.push(structuredClone(snapshot));
  if (s.history.length > 30) s.history.shift();
}
function goals(s: GameState, p: Rider) {
  const kind = getNode(s, p.destination).kind;
  const base =
    s.mission.serviceSites.includes(p.destination) &&
    !s.services.includes(p.destination)
      ? []
      : [p.destination];
  return [...base, ...s.services.filter((id) => getNode(s, id).kind === kind)];
}
function problem(s: GameState, text: string, node?: string) {
  s.message = text;
  s.localFeedback = { node: node ?? "", text, kind: "problem" };
  return false;
}
export function quoteRoute(
  s: GameState,
  path: string[],
  mode: TransitMode = "bus",
): {
  ok: boolean;
  reason: string;
  cost: number;
  seconds: number;
  badEdge: string | null;
} {
  let cost = 0,
    seconds = 0;
  if (path.length < 2)
    return {
      ok: false,
      reason: "המשיכו עד המקום שאליו רוצים להגיע",
      cost,
      seconds,
      badEdge: null,
    };
  if (new Set(path).size !== path.length)
    return {
      ok: false,
      reason: "הקו חוזר על עצמו. אפשר לגרור חזרה כדי לתקן",
      cost,
      seconds,
      badEdge: null,
    };
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1],
      b = path[i],
      c = corridor(s, a, b),
      key = pair(a, b);
    if (!c)
      return {
        ok: false,
        reason: "המשיכו לאורך הרחוב דרך העיגול הבא",
        cost,
        seconds,
        badEdge: key,
      };
    const g = corridorInfo(s.mission, c);
    if (c.forbidden)
      return {
        ok: false,
        reason: "כאן יש נחל. חצו באחד הגשרים",
        cost,
        seconds,
        badEdge: key,
      };
    if (c.modes && !c.modes.includes(mode === "bus" ? "bus" : "rail"))
      return {
        ok: false,
        reason:
          mode === "rail"
            ? "אין כאן תוואי מתאים למסילה"
            : "כאן עוברת מסילה. צריך קו מזין עד התחנה",
        cost,
        seconds,
        badEdge: key,
      };
    if (
      g.grade >
      (mode === "rail" ? (c.railLimit ?? 0.24) : (c.roadLimit ?? 0.42))
    )
      return {
        ok: false,
        reason: "העלייה כאן תלולה מדי. נסו את הרחוב המתון",
        cost,
        seconds,
        badEdge: key,
      };
    if (closed(s, c))
      return {
        ok: false,
        reason: "הגשר סגור. נסו את המעבר השני",
        cost,
        seconds,
        badEdge: key,
      };
    if (!s.roads.includes(key))
      cost += Math.ceil(
        g.length * (mode === "rail" ? 1.6 : 1) + (c.bridge ? 8 : 0),
      );
    seconds += edgeTime(s, a, b, mode);
  }
  if (cost > s.budget)
    return {
      ok: false,
      reason: "הדרך ארוכה מדי לתקציב הזה. נסו רחוב משותף או שירות קרוב",
      cost,
      seconds,
      badEdge: null,
    };
  return { ok: true, reason: "", cost, seconds, badEdge: null };
}
function capacityLeft(s: GameState, mode: TransitMode) {
  return (
    (mode === "rail" ? s.mission.trains : s.mission.fleet) -
    s.vehicles.filter((v) => v.mode === mode).length
  );
}
function makeVehicle(s: GameState, line: Line): Bus {
  const id = s.nextVehicle++;
  const v: Bus = {
    id,
    line: line.id,
    mode: line.mode,
    path: [...line.path],
    index: 0,
    direction: 1,
    from: line.path[0],
    to: line.path[1],
    progress: 0,
    duration: edgeTime(s, line.path[0], line.path[1], line.mode),
    dwell: 0.15,
    moving: false,
    passengers: [],
    capacity: line.mode === "rail" ? 14 : 6,
    blocked: false,
    trips: 0,
  };
  s.vehicles.push(v);
  return v;
}
export function drawLine(
  s: GameState,
  path: string[],
  mode: TransitMode = "bus",
) {
  const q = quoteRoute(s, path, mode);
  if (!q.ok) return problem(s, q.reason, path.at(-1));
  if (mode === "rail" && s.mission.trains === 0)
    return problem(s, "רכבת תיפתח בהמשך המסע", path[0]);
  if (capacityLeft(s, mode) <= 0)
    return problem(
      s,
      "כל כלי הרכב כבר ברשת. אפשר לשנות קו קיים או לבטל את האחרון",
      path[0],
    );
  if (
    s.lines.some((l) => l.mode === mode && l.path.join(">") === path.join(">"))
  )
    return problem(s, "הקו כבר כאן. לחצו עליו כדי להוסיף אוטובוס", path[0]);
  save(s);
  const l: Line = { id: s.nextLine++, mode, path: [...path], cost: q.cost };
  s.lines.push(l);
  for (let i = 1; i < path.length; i++) {
    const key = pair(path[i - 1], path[i]);
    if (!s.roads.includes(key)) s.roads.push(key);
  }
  s.budget -= q.cost;
  makeVehicle(s, l);
  if (s.mode === "ready") s.mode = "running";
  s.message = "הקו מוכן — עולים ונוסעים!";
  s.localFeedback = { node: path[0], text: "נוסעים!", kind: "good" };
  s.revision++;
  return true;
}
export function addBus(s: GameState, lineId: number) {
  const l = s.lines.find((l) => l.id === lineId);
  if (!l) return false;
  if (capacityLeft(s, l.mode) <= 0)
    return problem(
      s,
      "כל כלי הרכב כבר ברשת. נסו לשנות תוואי במקום להוסיף",
      l.path[0],
    );
  save(s);
  makeVehicle(s, l);
  s.message = "עוד יציאה בדרך. שימו לב לאנשים שכבר לא צריכים לחכות";
  s.localFeedback = { node: l.path[0], text: "עוד אוטובוס בדרך", kind: "good" };
  s.revision++;
  return true;
}
export function replaceLine(s: GameState, lineId: number, path: string[]) {
  const l = s.lines.find((l) => l.id === lineId);
  if (!l) return false;
  if (path[0] !== l.path[0])
    return problem(
      s,
      "התחילו מחדש מאותה שכונה כדי שהאוטובוס יוכל להמשיך אל הקו החדש",
      path[0],
    );
  const q = quoteRoute(s, path, l.mode);
  if (!q.ok) return problem(s, q.reason, path.at(-1));
  save(s);
  l.path = [...path];
  l.cost += q.cost;
  s.budget -= q.cost;
  for (let i = 1; i < path.length; i++) {
    const p = pair(path[i - 1], path[i]);
    if (!s.roads.includes(p)) s.roads.push(p);
  }
  s.edits++;
  s.revision++;
  s.message = "הקו שונה. האוטובוס שומר על הנוסעים ומתעדכן בנקודה המשותפת הבאה";
  s.localFeedback = { node: path[0], text: "קו חדש", kind: "good" };
  return true;
}
export function openService(s: GameState, id: string) {
  if (!s.mission.serviceSites.includes(id))
    return problem(s, "בחרו את המקום המסומן למרפאה מקומית", id);
  if (s.services.includes(id)) return false;
  if (s.budget < 22) return problem(s, "נשאר מעט מדי תקציב לשירות מקומי", id);
  save(s);
  s.services.push(id);
  s.budget -= 22;
  s.revision++;
  s.mode = s.mode === "ready" ? "running" : s.mode;
  s.message = "המרפאה נפתחה ליד הבית. אותם אנשים יכולים להגיע בהליכה";
  s.localFeedback = { node: id, text: "המרפאה פתוחה!", kind: "good" };
  return true;
}
export function widen(s: GameState, lineId: number) {
  const l = s.lines.find((l) => l.id === lineId);
  if (!l) return false;
  const pairs = l.path.slice(1).map((b, i) => pair(l.path[i], b));
  const id = pairs.find((id) => !s.widened.includes(id));
  if (!id) return problem(s, "הקו כבר הורחב");
  if (s.budget < 10) return problem(s, "אין מספיק תקציב להרחבה", l.path[0]);
  save(s);
  s.widened.push(id);
  s.budget -= 10;
  if (s.mission.induced && !s.inducedTriggered) {
    const d = s.mission.induced,
      base = s.people.length;
    const added = makePeople({
      ...s.mission,
      demand: [{ ...d, at: Math.max(d.at, s.clock + 5), car: false }],
    }).map((p, i) => ({ ...p, id: base + i }));
    s.people.push(...added);
    s.inducedTriggered = true;
    if (s.mode === "won") {
      s.mode = "running";
      s.completedAt = null;
    }
    s.message =
      "הכביש התרחב. בתרחיש הזה יצטרפו עוד " +
      d.count +
      " נוסעים — האם יש מספיק מושבים?";
    s.localFeedback = {
      node: d.origin,
      text: "עוד " + d.count + " נוסעים בדרך",
      kind: "problem",
    };
  } else {
    s.message = "יש יותר מקום לכלי רכב, אבל אותו מספר מושבים בכל אוטובוס";
  }
  s.revision++;
  return true;
}
export function undo(s: GameState) {
  const snapshot = s.history.pop();
  if (!snapshot) return false;
  const history = s.history;
  Object.assign(s, structuredClone(snapshot));
  s.history = history;
  s.revision++;
  s.message = "חזרנו רגע אחורה. אפשר לנסות דרך אחרת";
  s.localFeedback = null;
  return true;
}
export function retry(s: GameState) {
  const keptWidened = [...s.widened],
    keptInduced = s.inducedTriggered;
  const allocations = new Map(
    s.lines.map((l) => [
      l.id,
      s.vehicles.filter((v) => v.line === l.id).length,
    ]),
  );
  const lines = structuredClone(s.lines),
    roads = [...s.roads],
    services = [...s.services],
    budget = s.budget;
  const fresh = createGame({ ...s.mission, initialLines: [] });
  Object.assign(s, fresh, {
    lines,
    roads,
    services,
    budget,
    mode: lines.length || services.length ? "running" : "ready",
  });
  s.widened = keptWidened;
  s.inducedTriggered = keptInduced;
  if (keptInduced && s.mission.induced) {
    const d = s.mission.induced,
      base = s.people.length;
    s.people.push(
      ...makePeople({ ...s.mission, demand: [{ ...d, car: false }] }).map(
        (p, i) => ({ ...p, id: base + i }),
      ),
    );
  }
  s.nextLine = Math.max(0, ...lines.map((l) => l.id)) + 1;
  for (const l of lines) {
    for (let i = 0; i < (allocations.get(l.id) ?? 1); i++) makeVehicle(s, l);
  }
  s.message = "בוקר חדש, אותה רשת. אפשר לשנות אותה בכל רגע";
  s.revision++;
}
export function togglePause(s: GameState) {
  if (s.mode === "running") s.mode = "paused";
  else if (s.mode === "paused") s.mode = "running";
}
interface Step {
  a: string;
  b: string;
  line: number | null;
  mode: TransitMode | "walk";
  weight: number;
}
function graphSteps(s: GameState, p: Rider, from: string): Step[] {
  const result: Step[] = [];
  const seen = new Set<string>();
  for (const line of s.lines) {
    const paths = [
      line.path,
      ...s.vehicles.filter((v) => v.line === line.id).map((v) => v.path),
    ];
    for (const path of paths)
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1],
          b = path[i];
        if (a !== from && b !== from) continue;
        const to = a === from ? b : a,
          c = corridor(s, from, to);
        if (!c || closed(s, c)) continue;
        const key = `${line.id}:${from}>${to}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const fleet = s.vehicles.filter((v) => v.line === line.id).length;
        const time = edgeTime(s, from, to, line.mode);
        let loop = 0;
        for (let j = 1; j < line.path.length; j++)
          loop += edgeTime(s, line.path[j - 1], line.path[j], line.mode);
        const wait = Math.min(9, loop / Math.max(1, fleet));
        const queue = s.people.filter(
          (r) => r.node === from && r.status === "waiting",
        ).length;
        result.push({
          a: from,
          b: to,
          line: line.id,
          mode: line.mode,
          weight:
            time +
            (p.lastLine === line.id ? 0.15 : wait * 0.35) +
            (queue / (line.mode === "rail" ? 14 : 6)) * wait * 0.22,
        });
      }
  }
  const source = getNode(s, from),
    destinations = goals(s, p),
    stops = new Set(s.lines.flatMap((l) => l.path));
  for (const n of s.mission.nodes) {
    if (n.id === from) continue;
    const eligible =
      (from === p.origin && stops.has(n.id)) ||
      (stops.has(from) && destinations.includes(n.id)) ||
      (s.services.includes(n.id) && destinations.includes(n.id));
    if (!eligible) continue;
    const dist = Math.hypot(source.x - n.x, source.z - n.z);
    if (dist <= 2.6 && Math.abs(source.h - n.h) < 1)
      result.push({
        a: from,
        b: n.id,
        line: null,
        mode: "walk",
        weight: dist / 1.35 + 0.2,
      });
  }
  return result;
}
export function findJourney(s: GameState, p: Rider): Step[] {
  const targets = goals(s, p);
  if (targets.includes(p.node)) return [];
  const todo = [p.node],
    best = new Map([[p.node, 0]]),
    paths = new Map<string, Step[]>([[p.node, []]]);
  while (todo.length) {
    todo.sort((a, b) => best.get(a)! - best.get(b)!);
    const id = todo.shift()!;
    if (targets.includes(id)) return paths.get(id)!;
    for (const step of graphSteps(s, p, id)) {
      const score = best.get(id)! + step.weight;
      if (score < (best.get(step.b) ?? Infinity)) {
        best.set(step.b, score);
        paths.set(step.b, [...paths.get(id)!, step]);
        if (!todo.includes(step.b)) todo.push(step.b);
      }
    }
  }
  return [];
}
function atDestination(s: GameState, p: Rider) {
  return goals(s, p).includes(p.node);
}
function arrive(s: GameState, p: Rider, node: string) {
  p.node = node;
  p.vehicle = null;
  p.status = "arrived";
  p.arrivedAt = s.clock;
  s.localFeedback = { node, text: "הגיעו!", kind: "good" };
}
function routeFirst(s: GameState, p: Rider, cache: Map<string, Step[]>) {
  const k = [p.node, p.origin, p.destination, p.lastLine].join("|");
  if (!cache.has(k)) cache.set(k, findJourney(s, p));
  return cache.get(k)![0];
}
function lineAtNode(s: GameState, v: Bus) {
  const l = s.lines.find((l) => l.id === v.line)!;
  if (l.path.join() !== v.path.join() && l.path.includes(v.from)) {
    v.path = [...l.path];
    v.index = v.path.indexOf(v.from);
    v.direction = v.index === v.path.length - 1 ? -1 : 1;
  }
  if (v.index === v.path.length - 1) v.direction = -1;
  if (v.index === 0) v.direction = 1;
  v.to = v.path[v.index + v.direction];
  v.duration = edgeTime(s, v.from, v.to, v.mode);
}
function step(s: GameState, dt: number) {
  s.clock += dt;
  for (const p of s.people) {
    if (p.status === "pending" && p.release <= s.clock) p.status = "waiting";
    if (p.status === "walking" && p.walk) {
      p.walk.progress += dt / p.walk.duration;
      if (p.walk.progress >= 1) {
        p.node = p.walk.to;
        p.walk = undefined;
        if (atDestination(s, p)) arrive(s, p, p.node);
        else {
          p.status = "waiting";
          p.readyAt = s.clock;
        }
      }
    }
  }
  const cache = new Map<string, Step[]>();
  for (const v of s.vehicles) {
    if (v.moving) {
      v.progress = Math.min(1, v.progress + dt / v.duration);
      if (v.progress >= 1) {
        v.from = v.to;
        v.index = v.path.indexOf(v.from);
        v.moving = false;
        v.progress = 0;
        v.dwell = 0.12;
        v.blocked = false;
        lineAtNode(s, v);
        for (const id of [...v.passengers]) {
          const p = s.people[id];
          p.node = v.from;
          if (atDestination(s, p)) {
            arrive(s, p, v.from);
            v.passengers = v.passengers.filter((x) => x !== id);
            continue;
          }
          const next = routeFirst(s, p, cache);
          if (!next || next.line !== v.line || next.b !== v.to) {
            p.status = "waiting";
            p.vehicle = null;
            p.readyAt = s.clock + 0.7;
            p.lastLine = v.line;
            v.passengers = v.passengers.filter((x) => x !== id);
          }
        }
        if (v.index === 0) v.trips++;
      }
    }
  }
  for (const p of s.people) {
    if (p.status !== "waiting" || p.readyAt > s.clock) continue;
    if (atDestination(s, p)) {
      arrive(s, p, p.node);
      continue;
    }
    const first = routeFirst(s, p, cache);
    if (first?.mode === "walk") {
      p.status = "walking";
      p.walk = {
        from: p.node,
        to: first.b,
        progress: 0,
        duration: first.weight,
      };
    }
  }
  // Older vehicles get first access to a single-lane crossing; road space is shared in both directions.
  for (const v of s.vehicles) {
    if (v.moving) continue;
    v.dwell -= dt;
    if (v.dwell > 0) continue;
    lineAtNode(s, v);
    const c = corridor(s, v.from, v.to);
    if (!c) continue;
    if (closed(s, c)) {
      v.blocked = true;
      const line = s.lines.find((l) => l.id === v.line)!;
      const reverse = v.index - v.direction;
      if (reverse >= 0 && reverse < v.path.length) {
        v.direction = v.direction === 1 ? -1 : 1;
        v.to = v.path[reverse];
        v.duration = edgeTime(s, v.from, v.to, v.mode);
        const back = corridor(s, v.from, v.to);
        if (!back || closed(s, back)) continue;
      } else continue;
    }
    const road = corridor(s, v.from, v.to);
    if (!road) continue;
    const capacity = s.widened.includes(pair(v.from, v.to))
      ? 6
      : road.bridge
        ? 1
        : 3;
    const occupied = s.vehicles.filter(
      (other) =>
        other.id !== v.id &&
        other.moving &&
        pair(other.from, other.to) === pair(v.from, v.to),
    ).length;
    const span = corridorInfo(s.mission, road).length;
    const closeAhead = s.vehicles.some(
      (other) =>
        other.id !== v.id &&
        other.moving &&
        other.from === v.from &&
        other.to === v.to &&
        other.progress < Math.min(0.9, 1.9 / span),
    );
    const platformBusy = s.vehicles.some(
      (other) =>
        other.id !== v.id &&
        !other.moving &&
        other.from === v.from &&
        other.boarding,
    );
    if (occupied >= capacity || closeAhead || platformBusy) {
      v.blocked = true;
      continue;
    }
    v.blocked = false;
    const beforeBoarding = v.passengers.length;
    const waiting = s.people
      .filter(
        (p) =>
          p.status === "waiting" && p.node === v.from && p.readyAt <= s.clock,
      )
      .sort((a, b) => a.release - b.release || a.id - b.id);
    for (const p of waiting) {
      if (v.passengers.length >= v.capacity) break;
      const first = routeFirst(s, p, cache);
      if (first && first.line === v.line && first.b === v.to) {
        p.status = "riding";
        p.vehicle = v.id;
        p.boardings++;
        p.lastLine = v.line;
        v.passengers.push(p.id);
      }
    }
    if (v.passengers.length > beforeBoarding && !v.boarding) {
      v.boarding = true;
      v.dwell = 0.65;
      continue;
    }
    v.boarding = false;
    v.moving = true;
    v.progress = 0;
  }
  s.maxQueue = Math.max(
    s.maxQueue,
    s.people.filter((p) => p.status === "waiting").length,
  );
  if (s.mode !== "won" && s.people.every((p) => p.status === "arrived")) {
    const st = stats(s);
    if (
      st.noise <= (s.mission.noiseLimit ?? Infinity) &&
      st.length <= (s.mission.footprintLimit ?? Infinity)
    ) {
      s.mode = "won";
      s.completedAt = s.clock;
      s.message = "כולם הגיעו!";
      s.localFeedback = null;
    } else {
      s.message =
        st.noise > (s.mission.noiseLimit ?? Infinity)
          ? "כולם הגיעו, אבל הרחוב צריך להיות שקט יותר. שנו את הקו ונסו שוב"
          : "כולם הגיעו. נסו רשת קצרה יותר כדי לשמור על השטח הפתוח";
    }
  }
}
export function tick(s: GameState, seconds: number) {
  if (
    (s.mode !== "running" && s.mode !== "won") ||
    seconds <= 0 ||
    !Number.isFinite(seconds)
  )
    return;
  const count = Math.ceil(seconds / 0.05);
  for (let i = 0; i < count; i++) step(s, seconds / count);
}
export function stats(s: GameState) {
  const total = s.people.length,
    arrived = s.people.filter((p) => p.status === "arrived").length;
  const groups = [...new Set(s.people.map((p) => p.origin))].map((origin) => {
    const people = s.people.filter((p) => p.origin === origin);
    return {
      origin,
      label: getNode(s, origin).label,
      total: people.length,
      arrived: people.filter((p) => p.status === "arrived").length,
      waiting: people.filter((p) => p.status === "waiting").length,
    };
  });
  let length = 0,
    noise = 0;
  for (const id of new Set(
    s.lines.flatMap((l) => l.path.slice(1).map((b, i) => pair(l.path[i], b))),
  )) {
    const [a, b] = id.split("~"),
      c = corridor(s, a, b);
    if (c) {
      length += corridorInfo(s.mission, c).length;
      noise += c.nuisance ?? 0;
    }
  }
  const time = s.completedAt ?? s.clock;
  return {
    total,
    arrived,
    pending: s.people.filter((p) => p.status === "pending").length,
    waiting: s.people.filter((p) => p.status === "waiting").length,
    riding: s.people.filter((p) => p.status === "riding").length,
    walking: s.people.filter((p) => p.status === "walking").length,
    groups,
    length,
    noise,
    stars:
      s.mode === "won"
        ? 1 +
          Number(time <= s.mission.softTime) +
          Number(length <= s.mission.efficientLength)
        : 0,
    busesLeft: capacityLeft(s, "bus"),
    trainsLeft: capacityLeft(s, "rail"),
    time,
  };
}
function position(
  s: GameState,
  from: string,
  to: string,
  fraction: number,
): Vec3 {
  const c = corridor(s, from, to);
  let points: Point[] = c
    ? corridorPoints(s.mission, c)
    : [getNode(s, from), getNode(s, to)];
  if (c?.a !== from) points = [...points].reverse();
  const lengths = points
    .slice(1)
    .map((p, i) => Math.hypot(p.x - points[i].x, p.z - points[i].z));
  let remaining =
    Math.min(1, Math.max(0, fraction)) * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const a = points[i],
        b = points[i + 1],
        t = remaining / lengths[i];
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.h + (b.h - a.h) * t + 0.08,
        z: a.z + (b.z - a.z) * t,
        angle: Math.atan2(b.x - a.x, b.z - a.z),
      };
    }
    remaining -= lengths[i];
  }
  const n = getNode(s, from);
  return { x: n.x, y: n.h + 0.08, z: n.z, angle: 0 };
}
export const vehiclePosition = (s: GameState, v: Bus) => {
  const p = position(s, v.from, v.to, v.moving ? v.progress : 0);
  const c = corridor(s, v.from, v.to);
  if (v.mode === "bus" && !c?.bridge) {
    const lane = s.mission.id <= 2 ? 0.24 : 0.35;
    p.x += Math.cos(p.angle) * lane;
    p.z -= Math.sin(p.angle) * lane;
  }
  if (!v.moving && v.blocked && !v.boarding) {
    const queue =
      s.vehicles.filter(
        (other) => !other.moving && other.from === v.from && other.id < v.id,
      ).length + 1;
    p.x -= Math.sin(p.angle) * queue * 1.65;
    p.z -= Math.cos(p.angle) * queue * 1.65;
  }
  return p;
};
export function walkingPosition(s: GameState, p: Rider): Vec3 {
  if (!p.walk) {
    const n = getNode(s, p.node);
    return { x: n.x, y: n.h, z: n.z, angle: 0 };
  }
  const a = getNode(s, p.walk.from),
    b = getNode(s, p.walk.to),
    t = p.walk.progress;
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.h + (b.h - a.h) * t,
    z: a.z + (b.z - a.z) * t,
    angle: Math.atan2(b.x - a.x, b.z - a.z),
  };
}
