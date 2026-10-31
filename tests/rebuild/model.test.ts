import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  drawLine,
  replaceLine,
  addBus,
  openService,
  widen,
  undo,
  retry,
  togglePause,
  tick,
  stats,
  quoteRoute,
  vehiclePosition,
  pair,
} from "../../src/rebuild/model";
import type { GameState, Mission } from "../../src/rebuild/types";
import type { MapNode } from "../../src/types";
const n = (
  id: string,
  x: number,
  z = 0,
  h = 0,
  kind: MapNode["kind"] = "junction",
): MapNode => ({ id, x, z, h, kind, label: id });
function mission(patch: Partial<Mission> = {}): Mission {
  return {
    id: 901,
    title: "Independent rebuilt QA",
    region: "schematic",
    objective: "Serve every individual",
    lesson: "QA",
    cue: "Draw a line",
    nodes: [n("H", 0, 0, 0, "home"), n("J", 4), n("S", 8, 0, 0, "school")],
    corridors: [
      { a: "H", b: "J" },
      { a: "J", b: "S" },
    ],
    demand: [{ origin: "H", destination: "S", count: 8, at: 0, car: false }],
    fleet: 2,
    trains: 1,
    budget: 1000,
    softTime: 1,
    efficientLength: 1,
    unlock: "rail",
    serviceSites: [],
    initialRoads: [],
    initialLines: [],
    solution: [],
    solutionServices: [],
    solutionExtras: [],
    ...patch,
  };
}
function conserved(
  s: GameState,
  total = s.mission.demand.reduce((sum, d) => sum + d.count, 0) +
    (s.inducedTriggered ? (s.mission.induced?.count ?? 0) : 0),
) {
  assert.equal(s.people.length, total);
  assert.equal(
    new Set(s.people.map((p) => p.id)).size,
    total,
    "unique individuals",
  );
  const st = stats(s);
  assert.equal(
    st.pending + st.waiting + st.riding + st.walking + st.arrived,
    total,
    "exhaustive disjoint states",
  );
  const aboard = s.vehicles.flatMap((v) => v.passengers);
  assert.equal(new Set(aboard).size, aboard.length, "one vehicle per rider");
  assert.equal(aboard.length, st.riding);
  for (const v of s.vehicles) {
    assert.ok(v.passengers.length <= v.capacity);
    assert.equal(v.capacity, v.mode === "rail" ? 14 : 6);
    for (const id of v.passengers) {
      const p = s.people.find((p) => p.id === id)!;
      assert.ok(p);
      assert.equal(p.status, "riding");
      assert.equal(p.vehicle, v.id);
    }
  }
  for (const p of s.people) {
    if (p.status === "riding") assert.ok(aboard.includes(p.id));
    else
      assert.equal(
        p.vehicle,
        null,
        "non-riders cannot remain assigned to a bus",
      );
    if (p.status === "walking") assert.ok(p.walk, "walking has a real journey");
  }
  assert.ok(s.budget >= 0, "non-negative resources");
}
function until(s: GameState, goal: (s: GameState) => boolean, limit = 240) {
  for (let i = 0; i < limit * 20 && !goal(s); i++) {
    tick(s, 0.05);
    conserved(s);
  }
  return goal(s);
}
function outcome(s: GameState, limit = 240) {
  return until(s, (s) => s.mode === "won", limit);
}
const ruleState = (s: GameState) => ({
  mode: s.mode,
  clock: s.clock,
  completedAt: s.completedAt,
  lines: s.lines,
  vehicles: s.vehicles,
  people: s.people,
  roads: s.roads,
  services: s.services,
  budget: s.budget,
  nextLine: s.nextLine,
  nextVehicle: s.nextVehicle,
  edits: s.edits,
});

test("one complete ordered line automatically creates working service", () => {
  const s = createGame(mission());
  assert.equal(s.mode, "ready");
  assert.equal(drawLine(s, ["H", "J", "S"], "bus"), true);
  assert.deepEqual(s.lines[0].path, ["H", "J", "S"]);
  assert.equal(s.mode, "running");
  assert.equal(s.vehicles.length, 1);
  assert.ok(outcome(s));
  assert.equal(stats(s).arrived, 8);
});

test("same bus and first riders survive a junction, return and a second trip", () => {
  const s = createGame(mission({ fleet: 1 }));
  drawLine(s, ["H", "J", "S"], "bus");
  const id = s.vehicles[0].id;
  let crossed = false,
    sawReturn = false;
  for (let i = 0; i < 2000; i++) {
    tick(s, 0.05);
    conserved(s);
    assert.equal(s.vehicles.length, 1);
    assert.equal(s.vehicles[0].id, id);
    const v = s.vehicles[0];
    if (v.from === "J" && v.to === "S" && v.moving && v.passengers.length) {
      crossed = true;
      for (const rid of v.passengers) {
        const p = s.people.find((p) => p.id === rid)!;
        assert.equal(p.vehicle, id);
        assert.equal(
          p.boardings,
          1,
          "ordinary intermediate point never reboards",
        );
      }
    }
    if (v.direction === -1 && v.moving) sawReturn = true;
    if (stats(s).arrived === 8 && v.trips >= 2) break;
  }
  assert.ok(crossed);
  assert.ok(sawReturn);
  assert.equal(stats(s).arrived, 8);
  assert.ok(s.vehicles[0].trips >= 2);
  assert.ok(s.people.every((p) => p.boardings === 1));
});

test("bus and rail seats are finite; excess people wait for an actual return", () => {
  for (const mode of ["bus", "rail"] as const) {
    const count = mode === "bus" ? 17 : 31,
      s = createGame(
        mission({
          demand: [{ origin: "H", destination: "S", count, at: 0, car: false }],
        }),
      );
    drawLine(s, ["H", "J", "S"], mode);
    let full = false,
      leftBehind = false;
    for (let i = 0; i < 3000 && s.mode !== "won"; i++) {
      tick(s, 0.05);
      conserved(s, count);
      full ||= s.vehicles.some((v) => v.passengers.length === v.capacity);
      leftBehind ||=
        stats(s).waiting > 0 &&
        s.vehicles.some((v) => v.moving && v.passengers.length === v.capacity);
    }
    assert.ok(full);
    assert.ok(leftBehind);
    assert.equal(s.mode, "won");
  }
});

test("untimed arrival goals ignore a legacy per-person deadline and medal clock", () => {
  const s = createGame(
    mission({
      softTime: 0.1,
      demand: [
        {
          origin: "H",
          destination: "S",
          count: 8,
          at: 0,
          car: false,
          deadline: 0.01,
        },
      ],
    }),
  );
  drawLine(s, ["H", "J", "S"]);
  assert.ok(outcome(s));
  assert.ok(s.completedAt! > 0.1);
  assert.equal(stats(s).arrived, 8);
  assert.ok(stats(s).stars >= 1);
});

test("a disconnected small group prevents victory despite serving the majority", () => {
  const s = createGame(
    mission({
      nodes: [
        n("H", 0, 0, 0, "home"),
        n("J", 4),
        n("S", 8, 0, 0, "school"),
        n("P", 0, 8, 0, "home"),
      ],
      demand: [
        { origin: "H", destination: "S", count: 18, at: 0, car: false },
        { origin: "P", destination: "S", count: 1, at: 0, car: false },
      ],
    }),
  );
  drawLine(s, ["H", "J", "S"]);
  until(s, (s) => stats(s).arrived === 18);
  tick(s, 60);
  conserved(s, 19);
  assert.equal(stats(s).arrived, 18);
  assert.notEqual(s.mode, "won");
  assert.equal(stats(s).groups.find((g) => g.origin === "P")!.arrived, 0);
});

test("invalid complete routes reject atomically with no resource or rider mutation", () => {
  for (const path of [
    [],
    ["H"],
    ["H", "J", "H"],
    ["H", "unknown"],
    ["H", "S"],
  ]) {
    const s = createGame(mission()),
      before = structuredClone(ruleState(s));
    assert.equal(drawLine(s, path), false);
    assert.deepEqual(ruleState(s), before);
    assert.equal(s.history.length, 0);
    assert.equal(s.localFeedback?.kind, "problem");
  }
});

test("grade, crossing and mode restrictions are real and uncharged on rejection", () => {
  for (const patch of [
    {
      nodes: [n("H", 0, 0, 0, "home"), n("S", 2, 0, 3, "school")],
      corridors: [{ a: "H", b: "S" }],
    },
    {
      nodes: [n("H", 0, 0, 0, "home"), n("S", 5, 0, 0, "school")],
      corridors: [{ a: "H", b: "S", forbidden: true }],
    },
    {
      nodes: [n("H", 0, 0, 0, "home"), n("S", 5, 0, 0, "school")],
      corridors: [{ a: "H", b: "S", modes: ["rail"] as const }],
    },
  ]) {
    const s = createGame(mission(patch as Partial<Mission>));
    const before = structuredClone(ruleState(s));
    assert.equal(quoteRoute(s, ["H", "S"], "bus").ok, false);
    assert.equal(drawLine(s, ["H", "S"], "bus"), false);
    assert.deepEqual(ruleState(s), before);
  }
});

test("opposite-direction bridge traffic shares one finite crossing", () => {
  const s = createGame(
    mission({
      nodes: [
        n("A", -8, 0, 0, "home"),
        n("X", -4),
        n("Y", 4),
        n("B", 8, 0, 0, "home"),
        n("D", 10, 4, 0, "school"),
        n("C", -10, 4, 0, "school"),
      ],
      corridors: [
        { a: "A", b: "X" },
        { a: "X", b: "Y", bridge: true },
        { a: "Y", b: "D" },
        { a: "B", b: "Y" },
        { a: "X", b: "C" },
      ],
      demand: [
        { origin: "A", destination: "D", count: 8, at: 0, car: false },
        { origin: "B", destination: "C", count: 8, at: 0, car: false },
      ],
      fleet: 2,
    }),
  );
  drawLine(s, ["A", "X", "Y", "D"]);
  drawLine(s, ["B", "Y", "X", "C"]);
  let sawBlocked = false,
    sawOccupied = false;
  for (let i = 0; i < 5000 && s.mode !== "won"; i++) {
    tick(s, 0.05);
    conserved(s);
    const occupancy = s.vehicles.filter(
      (v) => v.moving && pair(v.from, v.to) === pair("X", "Y"),
    ).length;
    assert.ok(occupancy <= 1);
    sawOccupied ||= occupancy === 1;
    sawBlocked ||= s.vehicles.some((v) => v.blocked);
  }
  assert.ok(sawOccupied);
  assert.ok(sawBlocked);
  assert.equal(s.mode, "won");
});

test("same-kind local service preserves demand and requires real walking arrival", () => {
  const s = createGame(
    mission({
      nodes: [
        n("H", 0, 0, 0, "home"),
        n("L", 2, 0, 0, "clinic"),
        n("S", 8, 0, 0, "clinic"),
      ],
      corridors: [],
      demand: [{ origin: "H", destination: "S", count: 3, at: 0, car: false }],
      serviceSites: ["L"],
      unlock: "service",
    }),
  );
  const identities = s.people.map((p) => ({
    id: p.id,
    destination: p.destination,
  }));
  openService(s, "L");
  assert.equal(stats(s).arrived, 0);
  tick(s, 0.1);
  conserved(s);
  assert.ok(stats(s).walking > 0);
  assert.ok(outcome(s));
  assert.deepEqual(
    s.people.map((p) => ({ id: p.id, destination: p.destination })),
    identities,
  );
  assert.ok(s.people.every((p) => p.node === "L"));
});

test("wrong service kind cannot satisfy original school demand", () => {
  const s = createGame(
    mission({
      nodes: [
        n("H", 0, 0, 0, "home"),
        n("L", 2, 0, 0, "clinic"),
        n("S", 8, 0, 0, "school"),
      ],
      corridors: [],
      serviceSites: ["L"],
      unlock: "service",
    }),
  );
  openService(s, "L");
  tick(s, 60);
  conserved(s);
  assert.equal(stats(s).arrived, 0);
  assert.notEqual(s.mode, "won");
});

test("undo restores the explicit pre-edit simulation snapshot", () => {
  const s = createGame(mission());
  drawLine(s, ["H", "J", "S"]);
  tick(s, 1);
  const before = structuredClone(ruleState(s));
  assert.equal(addBus(s, s.lines[0].id), true);
  tick(s, 2);
  assert.equal(undo(s), true);
  assert.deepEqual(ruleState(s), before);
  conserved(s);
});

test("pause freezes current vehicle position and passenger state", () => {
  const s = createGame(mission());
  drawLine(s, ["H", "J", "S"]);
  tick(s, 1);
  togglePause(s);
  const before = structuredClone(ruleState(s));
  tick(s, 30);
  assert.deepEqual(ruleState(s), before);
  togglePause(s);
  tick(s, 0.1);
  assert.ok(s.clock > before.clock);
});

test("retry preserves the selected fleet allocation and repeats its outcome", () => {
  const s = createGame(mission({ fleet: 2 }));
  drawLine(s, ["H", "J", "S"]);
  addBus(s, s.lines[0].id);
  const fleet = s.vehicles.map((v) => ({ line: v.line, mode: v.mode }));
  assert.ok(outcome(s));
  const first = s.people.map((p) => p.arrivedAt);
  retry(s);
  assert.deepEqual(
    s.vehicles.map((v) => ({ line: v.line, mode: v.mode })),
    fleet,
  );
  assert.equal(s.clock, 0);
  assert.ok(outcome(s));
  assert.deepEqual(
    s.people.map((p) => p.arrivedAt),
    first,
  );
});

test("prebuilt service starts automatically rather than waiting for unrelated setup", () => {
  const s = createGame(
    mission({ initialLines: [{ path: ["H", "J", "S"], mode: "bus" }] }),
  );
  assert.equal(s.mode, "running");
  assert.ok(outcome(s));
});

test("a disjoint replacement is rejected instead of stranding a bus on an invisible old path", () => {
  const s = createGame(
    mission({
      nodes: [
        n("H", 0, 0, 0, "home"),
        n("J", 4),
        n("S", 8, 0, 0, "school"),
        n("A", 0, 8, 0, "home"),
        n("B", 8, 8, 0, "school"),
      ],
      corridors: [
        { a: "H", b: "J" },
        { a: "J", b: "S" },
        { a: "A", b: "B" },
      ],
    }),
  );
  drawLine(s, ["H", "J", "S"]);
  tick(s, 0.5);
  const before = structuredClone(ruleState(s));
  assert.equal(replaceLine(s, s.lines[0].id, ["A", "B"]), false);
  assert.deepEqual(ruleState(s), before);
});

test("rerouting a moving bus preserves position and rider identities until a real shared node", () => {
  const s = createGame(
    mission({
      nodes: [
        n("H", 0, 0, 0, "home"),
        n("J", 4),
        n("N", 4, 4),
        n("S", 8, 0, 0, "school"),
      ],
      corridors: [
        { a: "H", b: "J" },
        { a: "J", b: "S" },
        { a: "H", b: "N" },
        { a: "N", b: "S" },
      ],
    }),
  );
  drawLine(s, ["H", "J", "S"]);
  tick(s, 0.5);
  const id = s.vehicles[0].id,
    position = vehiclePosition(s, s.vehicles[0]),
    riders = [...s.vehicles[0].passengers];
  assert.equal(replaceLine(s, s.lines[0].id, ["H", "N", "S"]), true);
  assert.equal(s.vehicles[0].id, id);
  assert.deepEqual(vehiclePosition(s, s.vehicles[0]), position);
  assert.deepEqual(s.vehicles[0].passengers, riders);
  assert.ok(outcome(s));
  assert.ok(
    s.people.every((p) => p.boardings === 1),
    "same complete line should not force an incidental transfer",
  );
});

test("announced closure prevents new entry while a valid alternate line serves later demand", () => {
  const s = createGame(
    mission({
      nodes: [
        n("H", 0, 0, 0, "home"),
        n("J", 4),
        n("N", 4, 4),
        n("S", 8, 0, 0, "school"),
      ],
      corridors: [
        { a: "H", b: "J" },
        { a: "J", b: "S", bridge: true, closeAt: 3 },
        { a: "H", b: "N" },
        { a: "N", b: "S" },
      ],
      demand: [{ origin: "H", destination: "S", count: 8, at: 5, car: false }],
    }),
  );
  drawLine(s, ["H", "J", "S"]);
  drawLine(s, ["H", "N", "S"]);
  for (let i = 0; i < 5000 && s.mode !== "won"; i++) {
    const pre = new Map(
      s.vehicles.map((v) => [
        v.id,
        { moving: v.moving, from: v.from, to: v.to },
      ]),
    );
    tick(s, 0.05);
    conserved(s);
    for (const v of s.vehicles) {
      const previous = pre.get(v.id)!;
      if (v.moving && !previous.moving && s.clock >= 3)
        assert.notEqual(
          pair(v.from, v.to),
          pair("J", "S"),
          "no new closed-edge entry",
        );
    }
  }
  assert.equal(s.mode, "won");
});

test("a genuine feeder→rail→walk journey conserves one person across actual vehicle availability", () => {
  const s = createGame(
    mission({
      nodes: [
        n("H", 0, 0, 0, "home"),
        n("I", 4, 0, 0, "station"),
        n("T", 10, 0, 0, "station"),
        n("S", 12.2, 0, 0, "clinic"),
      ],
      corridors: [
        { a: "H", b: "I" },
        { a: "I", b: "T", modes: ["rail"] },
      ],
      demand: [{ origin: "H", destination: "S", count: 8, at: 0, car: false }],
    }),
  );
  drawLine(s, ["H", "I"], "bus");
  drawLine(s, ["I", "T"], "rail");
  let sawTransferWait = false,
    sawLastWalk = false;
  for (let i = 0; i < 3000 && s.mode !== "won"; i++) {
    tick(s, 0.05);
    conserved(s);
    sawTransferWait ||= s.people.some(
      (p) => p.node === "I" && p.status === "waiting" && p.boardings === 1,
    );
    sawLastWalk ||= s.people.some(
      (p) =>
        p.status === "walking" && p.walk?.from === "T" && p.walk.to === "S",
    );
  }
  assert.ok(
    sawTransferWait,
    "actual feeder arrival waits for rail availability",
  );
  assert.ok(sawLastWalk, "last leg is real walking");
  assert.equal(s.mode, "won");
  assert.ok(s.people.every((p) => p.boardings === 2));
});

test("explicit nuisance constraint can defeat a fully served but intrusive network", () => {
  const s = createGame(
    mission({
      nodes: [n("H", 0, 0, 0, "home"), n("S", 8, 0, 0, "school")],
      corridors: [{ a: "H", b: "S", nuisance: 9 }],
      noiseLimit: 3,
      demand: [{ origin: "H", destination: "S", count: 4, at: 0, car: false }],
    }),
  );
  drawLine(s, ["H", "S"]);
  until(s, (s) => stats(s).arrived === 4);
  assert.equal(stats(s).arrived, 4);
  assert.equal(stats(s).noise, 9);
  assert.notEqual(s.mode, "won");
});

test("widening triggers only the authored conditional people and preserves seats/identity", () => {
  const s = createGame(
    mission({
      demand: [{ origin: "H", destination: "S", count: 6, at: 0, car: false }],
      induced: { at: 20, count: 8, origin: "H", destination: "S" },
    }),
  );
  drawLine(s, ["H", "J", "S"]);
  const base = s.people.map((p) => p.id);
  assert.equal(s.people.length, 6);
  assert.equal(widen(s, s.lines[0].id), true);
  assert.equal(s.people.length, 14);
  assert.deepEqual(
    s.people.slice(0, 6).map((p) => p.id),
    base,
  );
  assert.equal(s.vehicles[0].capacity, 6);
  conserved(s, 14);
  assert.equal(widen(s, s.lines[0].id), true);
  assert.equal(
    s.people.length,
    14,
    "second expansion cannot duplicate the conditional group",
  );
  assert.ok(outcome(s));
  retry(s);
  assert.equal(s.people.length, 14);
  assert.equal(s.widened.length, 2);
  assert.ok(outcome(s));
});

test("undo widening restores conditional demand and road resources together", () => {
  const s = createGame(
    mission({ induced: { at: 20, count: 8, origin: "H", destination: "S" } }),
  );
  drawLine(s, ["H", "J", "S"]);
  tick(s, 0.5);
  const before = structuredClone(ruleState(s));
  widen(s, s.lines[0].id);
  tick(s, 2);
  undo(s);
  assert.deepEqual(ruleState(s), before);
  assert.deepEqual(s.widened, []);
  assert.equal(s.inducedTriggered, false);
  conserved(s);
});

test("a conditional demand change after a win must reopen the arrival goal", () => {
  const s = createGame(
    mission({
      demand: [{ origin: "H", destination: "S", count: 3, at: 0, car: false }],
      induced: { at: 20, count: 8, origin: "H", destination: "S" },
    }),
  );
  drawLine(s, ["H", "J", "S"]);
  assert.ok(outcome(s));
  widen(s, s.lines[0].id);
  assert.notEqual(
    s.mode,
    "won",
    "new unserved people invalidate the completed goal",
  );
  assert.equal(s.completedAt, null);
  assert.ok(outcome(s));
  assert.equal(stats(s).arrived, 11);
});

test("a planned clinic destination cannot serve riders until it is actually opened", () => {
  const s = createGame(
    mission({
      nodes: [n("H", 0, 0, 0, "home"), n("L", 8, 0, 0, "clinic")],
      corridors: [{ a: "H", b: "L" }],
      demand: [{ origin: "H", destination: "L", count: 3, at: 0, car: false }],
      serviceSites: ["L"],
      unlock: "service",
    }),
  );
  drawLine(s, ["H", "L"]);
  tick(s, 30);
  conserved(s);
  assert.equal(
    stats(s).arrived,
    0,
    "drawing to an unopened site does not provide a clinic",
  );
  assert.notEqual(s.mode, "won");
  const ids = s.people.map((p) => p.id);
  assert.equal(openService(s, "L"), true);
  assert.equal(
    stats(s).arrived,
    0,
    "opening a distant clinic cannot teleport people",
  );
  assert.ok(outcome(s));
  assert.deepEqual(
    s.people.map((p) => p.id),
    ids,
  );
  assert.ok(s.people.every((p) => p.node === "L"));
});

test("coallocated buses use one boarding platform and meaningful same-direction spacing", () => {
  const s = createGame(
    mission({
      fleet: 3,
      demand: [{ origin: "H", destination: "S", count: 18, at: 0, car: false }],
    }),
  );
  drawLine(s, ["H", "J", "S"]);
  addBus(s, s.lines[0].id);
  addBus(s, s.lines[0].id);
  const starts = new Map<number, number>();
  for (let i = 0; i < 3000 && s.mode !== "won"; i++) {
    const pre = new Map(s.vehicles.map((v) => [v.id, v.moving]));
    tick(s, 0.05);
    conserved(s);
    assert.ok(
      s.vehicles.filter((v) => v.from === "H" && !v.moving && v.boarding)
        .length <= 1,
      "only one vehicle boards at the origin platform",
    );
    for (const v of s.vehicles)
      if (
        v.moving &&
        !pre.get(v.id) &&
        v.from === "H" &&
        v.to === "J" &&
        !starts.has(v.id)
      )
        starts.set(v.id, s.clock);
    const traffic = s.vehicles.filter(
      (v) => v.moving && v.from === "H" && v.to === "J",
    );
    for (let a = 0; a < traffic.length; a++)
      for (let b = a + 1; b < traffic.length; b++)
        assert.ok(
          Math.abs(traffic[a].progress - traffic[b].progress) * 4 >= 1.8,
          "vehicles keep physical separation along the four-unit road",
        );
  }
  assert.equal(starts.size, 3);
  const times = [...starts.values()].sort((a, b) => a - b);
  assert.ok(times[1] - times[0] > 0.5);
  assert.ok(times[2] - times[1] > 0.5);
  assert.equal(s.mode, "won");
});
