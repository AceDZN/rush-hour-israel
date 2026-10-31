import test from "node:test";
import assert from "node:assert/strict";
import {
  createState,
  buildLink,
  placeStop,
  placeService,
  upgrade,
  schedule,
  startWave,
  retry,
  tick,
  metrics,
  removeLink,
  type State,
} from "../src/model";
import type { Level, MapNode } from "../src/types";

const n = (
  id: string,
  x: number,
  z = 0,
  h = 0,
  kind: MapNode["kind"] = "junction",
): MapNode => ({ id, x, z, h, kind, label: id });
function fixture(patch: Partial<Level> = {}): Level {
  return {
    id: 901,
    title: "Independent QA",
    region: "schematic",
    lesson: "QA fixture",
    hint: "",
    feedback: "",
    nodes: [n("H", 0, 0, 0, "home"), n("S", 6, 0, 0, "school")],
    corridors: [{ a: "H", b: "S" }],
    demand: [{ origin: "H", destination: "S", count: 20, at: 0, car: true }],
    budget: 1000,
    duration: 100,
    deadline: 80,
    target: 0.9,
    tools: [
      "road",
      "bus",
      "rail",
      "stop",
      "upgrade",
      "interchange",
      "service",
      "erase",
    ],
    initial: [],
    baseline: [],
    nearMiss: [],
    walkRadius: 1,
    ...patch,
  };
}
function conservation(s: State, total: number) {
  const m = metrics(s);
  assert.equal(s.people.length, total, "demand identities conserved");
  assert.equal(
    new Set(s.people.map((p) => p.id)).size,
    total,
    "IDs remain unique",
  );
  assert.equal(
    m.pending + m.waiting + m.riding + m.arrived,
    total,
    "all people in exactly one state",
  );
  const onboard = s.vehicles.flatMap((v) => v.passengers);
  assert.equal(
    new Set(onboard).size,
    onboard.length,
    "no passenger boards two vehicles",
  );
  assert.equal(
    onboard.length,
    m.riding,
    "all and only riding people are in vehicles",
  );
  for (const v of s.vehicles) {
    assert.ok(v.passengers.length <= v.capacity, "seat capacity");
    assert.ok(v.passengers.length > 0, "no phantom loaded vehicle");
    for (const id of v.passengers) {
      assert.equal(s.people[id].vehicleId, v.id);
      assert.equal(s.people[id].status, "riding");
    }
  }
  for (const p of s.people)
    if (p.status === "riding")
      assert.ok(onboard.includes(p.id), "rider belongs to a real vehicle");
  assert.ok(s.budget >= 0, "no overspending");
}
function run(s: State, total = s.people.length, seconds = s.level.duration) {
  for (
    let t = 0;
    t < Math.ceil(seconds * 10) + 2 && s.mode === "running";
    t++
  ) {
    tick(s, 0.1);
    conservation(s, total);
  }
  return metrics(s);
}

test("disconnected graph leaves demand waiting and cannot win", () => {
  const s = createState(fixture());
  startWave(s);
  const m = run(s);
  assert.equal(s.mode, "lost");
  assert.equal(m.arrived, 0);
  assert.equal(m.waiting, 20);
  assert.equal(m.worst, 0);
});

test("private roads cannot give a no-car household transit access", () => {
  const l = fixture({
    demand: [{ origin: "H", destination: "S", count: 8, at: 0, car: false }],
  });
  const s = createState(l);
  assert.equal(buildLink(s, "H", "S", "road"), true);
  startWave(s);
  run(s, 8);
  assert.equal(metrics(s).arrived, 0);
  assert.equal(s.mode, "lost");
});

test("bus seats, physical rider membership and waiting passengers are conserved", () => {
  const l = fixture({
    demand: [{ origin: "H", destination: "S", count: 26, at: 0, car: false }],
  });
  const s = createState(l);
  assert.equal(buildLink(s, "H", "S", "bus"), true);
  placeStop(s, "H");
  placeStop(s, "S");
  startWave(s);
  let sawFullBus = false,
    sawQueue = false;
  for (let t = 0; t < 1000 && s.mode === "running"; t++) {
    tick(s, 0.1);
    conservation(s, 26);
    sawFullBus ||= s.vehicles.some(
      (v) => v.mode === "bus" && v.passengers.length === 6,
    );
    sawQueue ||= metrics(s).waiting > 6;
  }
  assert.ok(sawFullBus, "a real full bus exists");
  assert.ok(sawQueue, "people beyond seats wait");
  assert.equal(s.mode, "won");
});

test("badly sited stops do not teleport no-car passengers onto a route", () => {
  const l = fixture({
    nodes: [n("H", 0, 0, 0, "home"), n("D", 4), n("S", 10, 0, 0, "school")],
    corridors: [{ a: "D", b: "S" }],
    demand: [{ origin: "H", destination: "S", count: 6, at: 0, car: false }],
    walkRadius: 1,
  });
  const s = createState(l);
  buildLink(s, "D", "S", "bus");
  placeStop(s, "D");
  placeStop(s, "S");
  startWave(s);
  run(s, 6);
  assert.equal(metrics(s).arrived, 0);
  assert.equal(s.mode, "lost");
});

test("grade and authored crossing constraints reject illegal construction without charging", () => {
  const l = fixture({
    nodes: [n("H", 0, 0, 0, "home"), n("S", 2, 0, 3, "school"), n("J", 3, 3)],
    corridors: [
      { a: "H", b: "S" },
      { a: "H", b: "J", forbidden: true },
    ],
  });
  const s = createState(l),
    budget = s.budget;
  assert.equal(buildLink(s, "H", "S", "road"), false);
  assert.equal(buildLink(s, "H", "J", "road"), false);
  assert.equal(buildLink(s, "J", "S", "road"), false);
  assert.equal(s.links.length, 0);
  assert.equal(s.budget, budget);
});

test("missed rail departure waits for next slot rather than waiting for its passenger", () => {
  const l = fixture({
    nodes: [
      n("H", 0, 0, 0, "home"),
      n("T", 4, 0, 0, "station"),
      n("S", 8, 0, 0, "school"),
    ],
    corridors: [
      { a: "H", b: "T" },
      { a: "T", b: "S" },
    ],
    demand: [{ origin: "H", destination: "S", count: 1, at: 0, car: false }],
    headway: { bus: 4.5, rail: 9 },
    transferPenalty: 2.5,
  });
  const s = createState(l);
  buildLink(s, "H", "T", "bus");
  buildLink(s, "T", "S", "rail");
  for (const id of ["H", "T", "S"]) placeStop(s, id);
  schedule(s, "T", "S", "rail", 4);
  startWave(s);
  run(s, 1);
  assert.equal(s.mode, "won");
  // Bus reaches the interchange after t=2, its transfer is ready after t=4.
  // The rail slot t=4 has departed empty; the next slot is t=13.
  const rail = s.links.find((e) => e.mode === "rail")!;
  assert.ok(
    s.people[0].arrivedAt! >= 13 + rail.time - 1e-6,
    `arrival ${s.people[0].arrivedAt} cannot precede the next t=13 rail departure`,
  );
});

test("initial infrastructure cannot be sold to create budget", () => {
  const l = fixture({
    initial: [{ type: "link", a: "H", b: "S", mode: "road" }],
  });
  const s = createState(l),
    before = s.budget;
  removeLink(s, s.links[0].id);
  assert.ok(
    s.budget <= before,
    "free initial road cannot be refunded for profit",
  );
  assert.ok(s.spent >= 0, "spent accounting cannot become negative");
});

test("wrong service kind does not satisfy an existing demand", () => {
  const l = fixture({
    nodes: [
      n("H", 0, 0, 0, "home"),
      n("C", 0.6, 0, 0, "clinic"),
      n("S", 6, 0, 0, "school"),
    ],
    serviceSites: ["C"],
    demand: [{ origin: "H", destination: "S", count: 2, at: 0, car: false }],
    walkRadius: 1,
  });
  const s = createState(l);
  placeService(s, "C");
  startWave(s);
  run(s, 2);
  assert.equal(metrics(s).arrived, 0, "a clinic cannot meet school demand");
});

test("worst-origin threshold defeats high aggregate throughput", () => {
  const l = fixture({
    nodes: [
      n("H", 0, 0, 0, "home"),
      n("P", 0, 8, 0, "home"),
      n("S", 6, 0, 0, "school"),
    ],
    corridors: [{ a: "H", b: "S" }],
    demand: [
      { origin: "H", destination: "S", count: 18, at: 0, car: true },
      { origin: "P", destination: "S", count: 1, at: 0, car: false },
    ],
    target: 0.8,
  });
  const s = createState(l);
  buildLink(s, "H", "S", "road");
  upgrade(s, "H", "S", "road");
  startWave(s);
  run(s, 19);
  const m = metrics(s);
  assert.ok(m.timely / 19 > 0.8, "central majority arrives");
  assert.equal(m.worst, 0);
  assert.equal(s.mode, "lost");
});

test("conditional induced passengers remain accounted for, including retry", () => {
  const l = fixture({
    demand: [{ origin: "H", destination: "S", count: 3, at: 0, car: true }],
    induced: { at: 25, count: 9, origin: "H", destination: "S" },
  });
  const a = createState(l);
  buildLink(a, "H", "S", "road");
  assert.equal(a.people.length, 3);
  upgrade(a, "H", "S", "road");
  assert.equal(a.people.length, 12);
  assert.equal(metrics(a).induced, 9);
  startWave(a);
  run(a, 12);
  retry(a);
  conservation(a, 12);
  assert.equal(a.time, 0);
  assert.equal(a.mode, "planning");
});

test("pause freezes passenger and vehicle state; deterministic retries repeat outcomes", () => {
  const l = fixture();
  const s = createState(l);
  buildLink(s, "H", "S", "road");
  startWave(s);
  tick(s, 3);
  startWave(s);
  const paused = JSON.stringify(s);
  tick(s, 50);
  assert.equal(JSON.stringify(s), paused);
  startWave(s);
  run(s);
  const first = s.people.map((p) => ({
    arrivedAt: p.arrivedAt,
    status: p.status,
    boardings: p.boardings,
  }));
  retry(s);
  startWave(s);
  run(s);
  assert.deepEqual(
    s.people.map((p) => ({
      arrivedAt: p.arrivedAt,
      status: p.status,
      boardings: p.boardings,
    })),
    first,
  );
});

test("local same-kind service preserves and serves the original people", () => {
  const l = fixture({
    nodes: [
      n("H", 0, 0, 0, "home"),
      n("C", 0.6, 0, 0, "clinic"),
      n("S", 6, 0, 0, "clinic"),
    ],
    serviceSites: ["C"],
    demand: [{ origin: "H", destination: "S", count: 4, at: 0, car: false }],
    walkRadius: 1,
  });
  const s = createState(l);
  const identity = s.people.map((p) => [p.id, p.destination]);
  placeService(s, "C");
  startWave(s);
  run(s, 4);
  assert.equal(s.mode, "won");
  assert.deepEqual(
    s.people.map((p) => [p.id, p.destination]),
    identity,
  );
  assert.ok(
    s.people.every((p) => p.node === "C"),
    "same-kind local service is actually reached",
  );
});

test("announced closure blocks later departures and a genuine alternate route survives", () => {
  const l = fixture({
    nodes: [n("H", 0, 0, 0, "home"), n("N", 3, 4), n("S", 6, 0, 0, "school")],
    corridors: [
      { a: "H", b: "S", closeAt: 5 },
      { a: "H", b: "N" },
      { a: "N", b: "S" },
    ],
    demand: [{ origin: "H", destination: "S", count: 6, at: 7, car: false }],
  });
  const stranded = createState(l);
  buildLink(stranded, "H", "S", "bus");
  placeStop(stranded, "H");
  placeStop(stranded, "S");
  startWave(stranded);
  run(stranded, 6);
  assert.equal(metrics(stranded).arrived, 0);
  const connected = createState(l);
  for (const [a, b] of [
    ["H", "S"],
    ["H", "N"],
    ["N", "S"],
  ])
    buildLink(connected, a, b, "bus");
  for (const id of ["H", "N", "S"]) placeStop(connected, id);
  startWave(connected);
  for (let i = 0; i < 1002 && connected.mode === "running"; i++) {
    tick(connected, 0.1);
    conservation(connected, 6);
    assert.ok(
      connected.vehicles.every(
        (v) => !(v.linkId === "H~S:bus" && v.start >= 5),
      ),
      "no departure after closure",
    );
  }
  assert.equal(connected.mode, "won");
});

test("changing a scheduled transfer phase changes arrival through actual waiting", () => {
  const l = fixture({
    nodes: [
      n("H", 0, 0, 0, "home"),
      n("T", 4, 0, 0, "station"),
      n("S", 8, 0, 0, "school"),
    ],
    corridors: [
      { a: "H", b: "T" },
      { a: "T", b: "S" },
    ],
    demand: [{ origin: "H", destination: "S", count: 1, at: 0, car: false }],
    headway: { bus: 4.5, rail: 9 },
    transferPenalty: 2.5,
  });
  const arrival = (phase: number) => {
    const s = createState(l);
    buildLink(s, "H", "T", "bus");
    buildLink(s, "T", "S", "rail");
    for (const id of ["H", "T", "S"]) placeStop(s, id);
    schedule(s, "T", "S", "rail", phase);
    startWave(s);
    run(s, 1);
    return s.people[0].arrivedAt!;
  };
  assert.ok(
    arrival(6) < arrival(4),
    "a coordinated t=6 slot beats missed t=4 then t=13",
  );
});

test("scenario construction tools remain constrained during planning", () => {
  const s = createState(fixture({ tools: ["road", "erase"] }));
  assert.equal(buildLink(s, "H", "S", "rail"), false);
  assert.equal(s.links.length, 0);
});

test("external footprint and nuisance thresholds can defeat otherwise timely throughput", () => {
  const l = fixture({
    corridors: [{ a: "H", b: "S", nuisance: 9 }],
    noiseLimit: 3,
    demand: [{ origin: "H", destination: "S", count: 2, at: 0, car: true }],
  });
  const s = createState(l);
  buildLink(s, "H", "S", "road");
  startWave(s);
  const m = run(s, 2);
  assert.equal(m.timely, 2);
  assert.equal(s.mode, "lost");
  assert.equal(m.noise, 9);
});

test("surface traffic respects shared finite occupancy even at extreme requested frequency", () => {
  const s = createState(
    fixture({
      headway: { road: 0.05 },
      demand: [{ origin: "H", destination: "S", count: 30, at: 0, car: true }],
    }),
  );
  buildLink(s, "H", "S", "road");
  startWave(s);
  let peak = 0;
  for (let i = 0; i < 1002 && s.mode === "running"; i++) {
    tick(s, 0.1);
    conservation(s, 30);
    const occupied = s.vehicles.filter(
      (v) => v.mode === "road" || v.mode === "bus",
    ).length;
    peak = Math.max(peak, occupied);
    assert.ok(occupied <= 2, "base road has two simultaneous surface slots");
  }
  assert.equal(peak, 2);
  assert.ok(s.maxQueue > 10);
  assert.equal(s.mode, "won");
});

test("rail moves people in finite 14-seat batches", () => {
  const s = createState(
    fixture({
      demand: [{ origin: "H", destination: "S", count: 31, at: 0, car: false }],
    }),
  );
  buildLink(s, "H", "S", "rail");
  placeStop(s, "H");
  placeStop(s, "S");
  startWave(s);
  let full = false;
  for (let i = 0; i < 1002 && s.mode === "running"; i++) {
    tick(s, 0.1);
    conservation(s, 31);
    full ||= s.vehicles.some(
      (v) => v.mode === "rail" && v.passengers.length === 14,
    );
  }
  assert.ok(full);
  assert.equal(s.mode, "won");
});
