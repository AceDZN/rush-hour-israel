import type {
  Corridor,
  Demand,
  Level,
  MapNode,
  Mode,
  PlanAction,
  Point,
} from "./types";
export type PassengerStatus = "pending" | "waiting" | "riding" | "arrived";
export interface Passenger {
  id: number;
  origin: string;
  destination: string;
  node: string;
  release: number;
  deadline: number;
  car: boolean;
  status: PassengerStatus;
  readyAt: number;
  lastMode: Mode | "walk" | null;
  arrivedAt?: number;
  vehicleId?: number;
  waitTime: number;
  travelTime: number;
  walkTime: number;
  boardings: number;
}
export interface Link {
  id: string;
  a: string;
  b: string;
  mode: Mode;
  cost: number;
  level: number;
  phase: number;
  nextDepart: number;
  length: number;
  grade: number;
  time: number;
  corridor: Corridor;
}
export interface Vehicle {
  id: number;
  linkId: string;
  mode: Mode | "walk";
  a: string;
  b: string;
  start: number;
  end: number;
  passengers: number[];
  capacity: number;
}
export interface State {
  level: Level;
  mode: "planning" | "running" | "paused" | "won" | "lost";
  time: number;
  budget: number;
  spent: number;
  links: Link[];
  stops: Set<string>;
  interchanges: Set<string>;
  services: Set<string>;
  people: Passenger[];
  vehicles: Vehicle[];
  nextId: number;
  message: string;
  maxQueue: number;
  inducedTriggered: boolean;
  revision: number;
}
export interface RouteStep {
  a: string;
  b: string;
  mode: Mode | "walk";
  linkId: string;
  time: number;
  weight: number;
}
export const pair = (a: string, b: string) => [a, b].sort().join("~");
export const linkId = (a: string, b: string, m: Mode) => `${pair(a, b)}:${m}`;
export const node = (s: State, id: string) =>
  s.level.nodes.find((n) => n.id === id)!;
export function corridorPoints(level: Level, c: Corridor): Point[] {
  return [
    level.nodes.find((n) => n.id === c.a)!,
    ...(c.via || []),
    level.nodes.find((n) => n.id === c.b)!,
  ];
}
export function geometry(level: Level, c: Corridor) {
  const points = corridorPoints(level, c);
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
function makePeople(demand: Demand[], level: Level, startId = 0): Passenger[] {
  let id = startId;
  return demand.flatMap((d) =>
    Array.from({ length: d.count }, (_, i) => ({
      id: id++,
      origin: d.origin,
      destination: d.destination,
      node: d.origin,
      release: d.at + i * 0.12,
      deadline: d.deadline ?? level.deadline,
      car: d.car,
      status: "pending" as const,
      readyAt: 0,
      lastMode: null,
      waitTime: 0,
      travelTime: 0,
      walkTime: 0,
      boardings: 0,
    })),
  );
}
export function createState(level: Level): State {
  const s: State = {
    level,
    mode: "planning",
    time: 0,
    budget: Infinity,
    spent: 0,
    links: [],
    stops: new Set(),
    interchanges: new Set(),
    services: new Set(),
    people: makePeople(level.demand, level),
    vehicles: [],
    nextId: 0,
    message: "בחרו כלי וחברו שתי נקודות במפה",
    maxQueue: 0,
    inducedTriggered: false,
    revision: 0,
  };
  for (const a of level.initial) applyAction(s, a);
  for (const l of s.links) l.cost = 0;
  s.budget = level.budget;
  s.spent = 0;
  s.message = "מתכננים את הבוקר. אפשר לערוך גם בזמן הגל.";
  return s;
}
export function quoteLink(
  s: State,
  a: string,
  b: string,
  mode: Mode,
): {
  ok: boolean;
  reason: string;
  cost: number;
  length: number;
  grade: number;
  time: number;
  corridor?: Corridor;
} {
  const c = s.level.corridors.find((c) => pair(c.a, c.b) === pair(a, b));
  if (!c || a === b)
    return {
      ok: false,
      reason: "אין כאן תוואי מאושר. בחרו נקודת ביניים לאורך הקרקע.",
      cost: 0,
      length: 0,
      grade: 0,
      time: 0,
    };
  const { length, grade } = geometry(s.level, c);
  const time = Math.max(
    1.2,
    length * (mode === "rail" ? 0.29 : 0.62) * (mode === "bus" ? 0.96 : 1) +
      grade * (mode === "rail" ? 7 : 12),
  );
  let cost = Math.ceil(
    length * (mode === "rail" ? 2.2 : 1.35) +
      grade * 12 +
      (c.bridge ? 12 : 0) +
      (mode === "bus" ? 7 : mode === "rail" ? 10 : 0),
  );
  if (mode === "bus") {
    const road = s.links.find((e) => e.id === linkId(a, b, "road"));
    cost =
      7 +
      (road ? 0 : Math.ceil(length * 1.35 + grade * 12 + (c.bridge ? 12 : 0)));
  }
  let reason = "";
  if (c.forbidden) reason = "העמק ניתן לחצייה רק באתר הגשר המסומן";
  else if (c.modes && !c.modes.includes(mode))
    reason = "התוואי אינו מתאים לכלי הזה";
  else if (
    grade > (mode === "rail" ? (c.railLimit ?? 0.24) : (c.roadLimit ?? 0.42))
  )
    reason = `שיפוע ${Math.round(grade * 100)}% — תלול מדי. חפשו תוואי מתון לאורך קו הגובה.`;
  else if (s.links.some((e) => e.id === linkId(a, b, mode)))
    reason = "החיבור כבר קיים";
  else if (s.budget < cost)
    reason = "אין מספיק תקציב. אפשר למחוק חיבור בתכנון ולקבל החזר.";
  return { ok: !reason, reason, cost, length, grade, time, corridor: c };
}
export function buildLink(s: State, a: string, b: string, mode: Mode): boolean {
  const q = quoteLink(s, a, b, mode);
  if (!q.ok) {
    s.message = q.reason;
    return false;
  }
  if (!s.level.tools.includes(mode)) {
    s.message = "הכלי אינו זמין בשלב הזה";
    return false;
  }
  if (mode === "bus" && !s.links.some((l) => l.id === linkId(a, b, "road"))) {
    const road = quoteLink({ ...s, budget: Infinity }, a, b, "road");
    if (!road.ok) {
      s.message = road.reason;
      return false;
    }
    s.links.push({
      id: linkId(a, b, "road"),
      a,
      b,
      mode: "road",
      cost: road.cost,
      level: 1,
      phase: 0,
      nextDepart: 0,
      length: road.length,
      grade: road.grade,
      time: road.time,
      corridor: q.corridor!,
    });
  }
  s.links.push({
    id: linkId(a, b, mode),
    a,
    b,
    mode,
    cost: mode === "bus" ? 7 : q.cost,
    level: 1,
    phase: 0,
    nextDepart: 0,
    length: q.length,
    grade: q.grade,
    time: q.time,
    corridor: q.corridor!,
  });
  s.budget -= q.cost;
  s.spent += q.cost;
  s.revision++;
  s.message =
    mode === "bus"
      ? "קו אוטובוס נבנה. הוסיפו תחנות ליד המוצא והיעד."
      : "החיבור מוכן. חברו את הנקודה הבאה או הפעילו את הגל.";
  return true;
}
function spend(s: State, cost: number) {
  if (s.budget < cost) {
    s.message = "אין מספיק תקציב";
    return false;
  }
  s.budget -= cost;
  s.spent += cost;
  s.revision++;
  return true;
}
export function placeStop(s: State, id: string): boolean {
  if (!node(s, id) || s.stops.has(id)) {
    s.message = "כבר יש כאן תחנה";
    return false;
  }
  if (!spend(s, 3)) return false;
  s.stops.add(id);
  s.message = "תחנה נגישה ברדיוס הליכה מסומן. קו פעיל צריך תחנה בשני קצותיו.";
  return true;
}
export function placeInterchange(s: State, id: string): boolean {
  if (!node(s, id) || s.interchanges.has(id)) return false;
  if (!spend(s, 6)) return false;
  s.interchanges.add(id);
  s.message =
    "מחלף: זמן החלפה ירד ל־0.5 שניות מודל. בדקו גם את שעת היציאה הבאה.";
  return true;
}
export function placeService(s: State, id: string): boolean {
  if (!s.level.serviceSites?.includes(id)) {
    s.message = "שירות מקומי ניתן להקים רק באתר המסומן +";
    return false;
  }
  if (s.services.has(id) || !spend(s, 22)) return false;
  s.services.add(id);
  s.message =
    "שירות מקומי נפתח. אותו ביקוש יכול כעת להגיע לשירות קרוב מאותו סוג.";
  return true;
}
export function headway(s: State, l: Link) {
  return (
    (s.level.headway?.[l.mode] ?? { road: 0.8, bus: 4.5, rail: 9 }[l.mode]) /
    (l.level === 2 ? 2 : 1)
  );
}
export function upgrade(
  s: State,
  a: string,
  b?: string,
  mode: Mode = "road",
): boolean {
  const l = b
    ? s.links.find((l) => l.id === linkId(a, b, mode))
    : s.links.find((l) => l.id === a);
  if (!l) {
    s.message = "בחרו חיבור קיים לשדרוג";
    return false;
  }
  if (l.level >= 2) {
    s.message = "החיבור כבר משודרג";
    return false;
  }
  if (!spend(s, mode === "road" ? 10 : 8)) return false;
  l.level = 2;
  l.nextDepart = Math.min(l.nextDepart, s.time + headway(s, l));
  if (l.mode === "road" && s.level.induced && !s.inducedTriggered) {
    s.inducedTriggered = true;
    const d = s.level.induced;
    s.people.push(
      ...makePeople(
        [
          {
            origin: d.origin,
            destination: d.destination,
            count: d.count,
            at: Math.max(d.at, s.time + 0.1),
            car: true,
          },
        ],
        s.level,
        s.people.length,
      ),
    );
    s.message = `תרחיש ביקוש מושרה: ${d.count} נוסעים נוספים יצטרפו בגל המאוחר.`;
  } else
    s.message =
      l.mode === "road"
        ? "קיבולת הכביש הוכפלה. בדקו אם הקטע הבא יכול לקלוט את התנועה."
        : "התדירות הוכפלה. יותר יציאות, פחות המתנה.";
  return true;
}
export function schedule(
  s: State,
  a: string,
  b: string,
  mode: Mode,
  phase: number,
) {
  const l = s.links.find((l) => l.id === linkId(a, b, mode));
  if (!l) return false;
  l.phase = Math.max(0, phase) % headway(s, l);
  l.nextDepart =
    Math.ceil((s.time - l.phase) / headway(s, l)) * headway(s, l) + l.phase;
  s.message = "לוח היציאות עודכן. ההמתנה במחלף נכללת בזמן ההגעה.";
  s.revision++;
  return true;
}
export function removeLink(s: State, id: string) {
  if (s.mode !== "planning") {
    s.message = "מחיקה והחזר זמינים בתכנון. אפשר להוסיף ולשדרג בזמן הגל.";
    return false;
  }
  const l = s.links.find((l) => l.id === id);
  if (!l) return false;
  const removals = s.links.filter(
    (e) =>
      e.id === id ||
      (l.mode === "road" &&
        pair(e.a, e.b) === pair(l.a, l.b) &&
        e.mode === "bus"),
  );
  const refund = removals.reduce(
    (a, e) => a + e.cost + (e.level === 2 ? (e.mode === "road" ? 10 : 8) : 0),
    0,
  );
  s.links = s.links.filter((e) => !removals.includes(e));
  s.budget += refund;
  s.spent -= refund;
  s.revision++;
  s.message = "התוואי הוסר והתקציב הוחזר";
  return true;
}
export function applyAction(s: State, a: PlanAction) {
  if (a.type === "link") return buildLink(s, a.a, a.b, a.mode);
  if (a.type === "stop") return s.stops.has(a.node) || placeStop(s, a.node);
  if (a.type === "service") return placeService(s, a.node);
  if (a.type === "interchange") return placeInterchange(s, a.node);
  if (a.type === "upgrade") return upgrade(s, a.a, a.b, a.mode);
  if (a.type === "schedule") return schedule(s, a.a, a.b, a.mode, a.phase);
  return false;
}
function active(s: State, l: Link) {
  return (
    !(l.corridor.closeAt !== undefined && s.time >= l.corridor.closeAt) &&
    (!(l.mode === "bus" || l.mode === "rail") ||
      (s.stops.has(l.a) && s.stops.has(l.b)))
  );
}
function serviceGoals(s: State, p: Passenger) {
  const dest = node(s, p.destination);
  return new Set([
    p.destination,
    ...[...s.services].filter(
      (id) =>
        s.level.serviceSites?.includes(id) && node(s, id).kind === dest.kind,
    ),
  ]);
}
function walkTime(a: MapNode, b: MapNode) {
  return Math.hypot(a.x - b.x, a.z - b.z) * 1.8 + Math.abs(a.h - b.h) * 2;
}
function options(s: State, p: Passenger, from: string): RouteStep[] {
  const steps: RouteStep[] = [];
  for (const l of s.links) {
    if (
      !active(s, l) ||
      (l.mode === "road" && !p.car) ||
      (l.a !== from && l.b !== from)
    )
      continue;
    const to = l.a === from ? l.b : l.a;
    const capacity = l.mode === "road" ? 1 : l.mode === "bus" ? 6 : 14;
    const waiting = s.people.filter(
      (q) => q.status === "waiting" && q.node === from,
    ).length;
    const wait = l.mode === "road" ? 0.3 : headway(s, l) / 2;
    const congestion = s.vehicles.filter(
      (v) => pair(v.a, v.b) === pair(l.a, l.b) && v.mode !== "walk",
    ).length;
    steps.push({
      a: from,
      b: to,
      mode: l.mode,
      linkId: l.id,
      time: l.time,
      weight:
        l.time +
        wait +
        (waiting / capacity) *
          (l.mode === "road"
            ? Math.max(headway(s, l), l.time / (2 * l.level))
            : headway(s, l)) *
          0.8 +
        congestion * 0.4,
    });
  }
  const source = node(s, from),
    goals = serviceGoals(s, p);
  for (const other of s.level.nodes) {
    if (other.id === from) continue;
    const isAccess =
      (from === p.origin && s.stops.has(other.id)) ||
      (s.stops.has(from) && goals.has(other.id)) ||
      (goals.has(other.id) && s.services.has(other.id));
    if (!isAccess) continue;
    const distance = Math.hypot(source.x - other.x, source.z - other.z);
    if (
      distance <= (s.level.walkRadius ?? 2.6) &&
      Math.abs(source.h - other.h) < 1
    ) {
      const time = walkTime(source, other);
      steps.push({
        a: from,
        b: other.id,
        mode: "walk",
        linkId: `walk:${pair(from, other.id)}`,
        time,
        weight: time,
      });
    }
  }
  return steps;
}
export function findRoute(s: State, p: Passenger): RouteStep[] {
  const goals = serviceGoals(s, p);
  if (goals.has(p.node)) return [];
  const best = new Map<string, number>([[p.node, 0]]),
    path = new Map<string, RouteStep[]>(),
    todo = [p.node];
  path.set(p.node, []);
  while (todo.length) {
    todo.sort((a, b) => best.get(a)! - best.get(b)!);
    const cur = todo.shift()!;
    if (goals.has(cur)) return path.get(cur)!;
    for (const step of options(s, p, cur)) {
      let penalty = 0;
      if (
        cur === p.node &&
        p.lastMode &&
        p.lastMode !== step.mode &&
        step.mode !== "walk"
      )
        penalty = s.interchanges.has(cur)
          ? 0.5
          : (s.level.transferPenalty ?? 2.5);
      const score = best.get(cur)! + step.weight + penalty;
      if (score < (best.get(step.b) ?? Infinity)) {
        best.set(step.b, score);
        path.set(step.b, [...path.get(cur)!, step]);
        if (!todo.includes(step.b)) todo.push(step.b);
      }
    }
  }
  return [];
}
export function startWave(s: State) {
  if (s.mode === "planning" || s.mode === "paused") {
    s.mode = "running";
    s.message = "שעת שיא! אפשר לתקן את הרשת תוך כדי תנועה.";
  } else if (s.mode === "running") {
    s.mode = "paused";
    s.message = "מושהה — הרשת והנוסעים מחכים.";
  }
}
export function retry(s: State) {
  s.mode = "planning";
  s.time = 0;
  s.people = makePeople(s.level.demand, s.level);
  s.vehicles = [];
  s.nextId = 0;
  s.maxQueue = 0;
  for (const l of s.links) l.nextDepart = l.phase;
  if (s.inducedTriggered && s.level.induced) {
    const d = s.level.induced;
    s.people.push(
      ...makePeople([{ ...d, car: true }], s.level, s.people.length),
    );
  }
  s.message = "אותו גל, ניסיון חדש. התכנון נשמר; אפשר לערוך או להפעיל.";
  s.revision++;
}
function transferReady(s: State, p: Passenger, mode: Mode | "walk") {
  if (p.lastMode && p.lastMode !== mode && mode !== "walk")
    return (
      p.readyAt +
      (s.interchanges.has(p.node) ? 0.5 : (s.level.transferPenalty ?? 2.5))
    );
  return p.readyAt;
}
export function tick(s: State, dt: number) {
  if (s.mode !== "running" || !Number.isFinite(dt) || dt <= 0) return;
  const steps = Math.ceil(dt / 0.1);
  for (let t = 0; t < steps; t++) {
    if (s.mode !== "running") break;
    step(s, dt / steps);
  }
}
function step(s: State, dt: number) {
  s.time = Math.min(s.level.duration, s.time + dt);
  for (const p of s.people) {
    if (p.status === "pending" && p.release <= s.time) {
      p.status = "waiting";
      p.readyAt = p.release;
    }
    if (p.status === "waiting") p.waitTime += dt;
  }
  for (const v of [...s.vehicles]) {
    if (v.end <= s.time) {
      for (const id of v.passengers) {
        const p = s.people[id];
        p.node = v.b;
        p.vehicleId = undefined;
        p.lastMode = v.mode;
        p.readyAt = v.end;
        if (v.mode === "walk") p.walkTime += v.end - v.start;
        else p.travelTime += v.end - v.start;
        if (serviceGoals(s, p).has(v.b)) {
          p.status = "arrived";
          p.arrivedAt = v.end;
        } else p.status = "waiting";
      }
      s.vehicles = s.vehicles.filter((x) => x.id !== v.id);
    }
  }
  const due = new Set<string>();
  for (const l of s.links) {
    if (l.nextDepart <= s.time + 1e-7) {
      due.add(l.id);
      const h = headway(s, l);
      while (l.nextDepart <= s.time + 1e-7) l.nextDepart += h;
    }
  }
  const dispatched = new Set<string>();
  const routeCache = new Map<string, RouteStep[]>();
  const assignments = new Map<
    string,
    { step: RouteStep; people: Passenger[] }
  >();
  for (const p of s.people) {
    if (p.status !== "waiting") continue;
    if (serviceGoals(s, p).has(p.node)) {
      p.status = "arrived";
      p.arrivedAt = s.time;
      continue;
    }
    const cacheKey = [p.origin, p.destination, p.node, p.car, p.lastMode].join(
      "|",
    );
    let route = routeCache.get(cacheKey);
    if (!route) {
      route = findRoute(s, p);
      routeCache.set(cacheKey, route);
    }
    const first = route[0];
    if (!first || transferReady(s, p, first.mode) > s.time) continue;
    const key = `${first.linkId}:${first.a}>${first.b}`;
    const group = assignments.get(key) || { step: first, people: [] };
    group.people.push(p);
    assignments.set(key, group);
  }
  // Transit dispatch precedes private cars on the same finite road space.
  const groups = [...assignments.values()].sort(
    (a, b) =>
      (a.step.mode === "road" ? 1 : 0) - (b.step.mode === "road" ? 1 : 0),
  );
  for (const { step: route, people } of groups) {
    const l = s.links.find((e) => e.id === route.linkId);
    if (
      route.mode !== "walk" &&
      (!l || !active(s, l) || !due.has(l.id) || dispatched.has(l.id))
    )
      continue;
    if (l && l.mode !== "rail") {
      const road = s.links.find((e) => e.id === linkId(l.a, l.b, "road"));
      const occupancy = s.vehicles.filter(
        (v) =>
          v.mode !== "walk" &&
          v.mode !== "rail" &&
          pair(v.a, v.b) === pair(l.a, l.b),
      ).length;
      if (occupancy >= 2 * (road?.level ?? 1)) continue;
    } else if (
      l &&
      s.vehicles.filter((v) => v.linkId === l.id).length >= l.level
    )
      continue;
    const capacity =
      route.mode === "walk"
        ? 1
        : route.mode === "road"
          ? 1
          : route.mode === "bus"
            ? 6
            : 14;
    const boarding = people
      .sort((a, b) => a.release - b.release || a.id - b.id)
      .slice(0, capacity);
    if (!boarding.length) continue;
    const id = s.nextId++;
    const v: Vehicle = {
      id,
      linkId: route.linkId,
      mode: route.mode,
      a: route.a,
      b: route.b,
      start: s.time,
      end: s.time + route.time,
      passengers: boarding.map((p) => p.id),
      capacity,
    };
    s.vehicles.push(v);
    for (const p of boarding) {
      p.status = "riding";
      p.vehicleId = id;
      if (route.mode !== "walk") p.boardings++;
    }
    if (l) dispatched.add(l.id);
  }
  s.maxQueue = Math.max(
    s.maxQueue,
    s.people.filter((p) => p.status === "waiting").length,
  );
  const m = metrics(s);
  if (
    s.time >= s.level.duration ||
    (s.people.every((p) => p.status === "arrived") &&
      s.time > Math.max(...s.people.map((p) => p.release)))
  ) {
    s.mode = m.success ? "won" : "lost";
    s.message = m.success ? s.level.feedback : failureReason(s);
  }
}
export function metrics(s: State) {
  const expected = s.people.length,
    arrived = s.people.filter((p) => p.status === "arrived"),
    timely = arrived.filter(
      (p) => p.arrivedAt! - p.release <= p.deadline + 1e-6,
    );
  const origins = [...new Set(s.people.map((p) => p.origin))];
  const groups = origins.map((origin) => {
    const all = s.people.filter((p) => p.origin === origin),
      served = all.filter((p) => p.status === "arrived"),
      onTime = served.filter(
        (p) => p.arrivedAt! - p.release <= p.deadline + 1e-6,
      );
    return {
      origin,
      label: node(s, origin).label,
      total: all.length,
      arrived: served.length,
      timely: onTime.length,
      access: onTime.length / all.length,
      meanTime: served.length
        ? served.reduce((a, p) => a + p.arrivedAt! - p.release, 0) /
          served.length
        : 0,
      waiting: all.filter((p) => p.status === "waiting").length,
    };
  });
  const worst = Math.min(...groups.map((g) => g.access));
  const footprint = s.links
    .filter((l) => l.mode !== "bus")
    .reduce(
      (a, l) =>
        a +
        l.length * (l.mode === "rail" ? 0.7 : 1) * (l.level === 2 ? 1.5 : 1),
      0,
    );
  const noise = s.links
    .filter((l) => l.mode === "road")
    .reduce(
      (a, l) => a + (l.corridor.nuisance ?? 0) * (l.level === 2 ? 2 : 1),
      0,
    );
  const success =
    worst >= s.level.target &&
    timely.length / expected >= s.level.target &&
    noise <= (s.level.noiseLimit ?? Infinity) &&
    footprint <= (s.level.footprintLimit ?? Infinity);
  return {
    expected,
    created: expected - s.people.filter((p) => p.status === "pending").length,
    pending: s.people.filter((p) => p.status === "pending").length,
    waiting: s.people.filter((p) => p.status === "waiting").length,
    riding: s.people.filter((p) => p.status === "riding").length,
    arrived: arrived.length,
    timely: timely.length,
    worst,
    groups,
    footprint,
    noise,
    success,
    meanTime: arrived.length
      ? arrived.reduce((a, p) => a + p.arrivedAt! - p.release, 0) /
        arrived.length
      : 0,
    induced: s.inducedTriggered ? (s.level.induced?.count ?? 0) : 0,
    score: Math.max(
      0,
      Math.round(
        (timely.length / expected) * 600 +
          worst * 300 -
          footprint * 2 -
          s.spent * 0.4,
      ),
    ),
  };
}
export function failureReason(s: State) {
  const m = metrics(s);
  if (m.noise > (s.level.noiseLimit ?? Infinity))
    return "הנסיעות הושלמו, אבל מטרד הרחוב עבר את הסף. נסו תוואי עוקף ותחנת הליכה.";
  if (m.footprint > (s.level.footprintLimit ?? Infinity))
    return "הרשת תופסת יותר מדי קרקע. נסו שירות בעל קיבולת גבוהה יותר.";
  const g = [...m.groups].sort((a, b) => a.access - b.access)[0];
  return `${g.label}: רק ${g.timely}/${g.total} הגיעו בזמן. בדקו רצף חיבורים, תחנות, המתנה וקיבולת.`;
}
