import test from "node:test";
import assert from "node:assert/strict";
import {
  createState,
  place,
  rotate,
  undo,
  retry,
  tick,
  stats,
  roadPorts,
  endpointHeight,
  neighbors,
  path,
  vehiclePosition,
  returnToTray,
  beginHold,
  cancelHold,
} from "../../src/action/model";
import type { Cell, GameState, Mission, Tile } from "../../src/action/types";
const cell = (x: number, z = 0, patch: Partial<Cell> = {}): Cell => ({
  id: `${x},${z}`,
  x,
  z,
  height: 0,
  terrain: "land",
  ...patch,
});
const tile = (
  id: string,
  at: string | null,
  kind: Tile["kind"] = "straight",
  rotation = 0,
  locked = false,
): Tile => ({ id, cell: at, kind, rotation, locked });
function mission(patch: Partial<Mission> = {}): Mission {
  return {
    id: 901,
    title: "Independent tactile QA",
    instruction: "Repair the physical gap",
    lesson: "QA",
    source: "supplied Workbook snapshots",
    cols: 5,
    rows: 1,
    cells: Array.from({ length: 5 }, (_, x) => cell(x)),
    tiles: [
      tile("home", "0,0", "straight", 0, true),
      tile("approach", "1,0", "straight", 0, true),
      tile("loose", null),
      tile("east", "3,0", "straight", 0, true),
      tile("school", "4,0", "straight", 0, true),
    ],
    groups: [
      { id: "g", origin: "0,0", destination: "4,0", count: 8, label: "homes" },
    ],
    fleet: [{ id: "bus", group: "g", leg: 0, mode: "bus", capacity: 6 }],
    par: 1,
    solution: [],
    ...patch,
  };
}
function conserved(
  s: GameState,
  expected = s.mission.groups.reduce((n, g) => n + g.count, 0) +
    (s.inducedDone ? (s.mission.induced?.count ?? 0) : 0),
) {
  assert.equal(s.people.length, expected);
  assert.equal(new Set(s.people.map((p) => p.id)).size, expected);
  const st = stats(s);
  assert.equal(
    st.arrived + st.waiting + st.riding + st.walking,
    expected,
    "each person has exactly one travel state",
  );
  const ids = s.vehicles.flatMap((v) => v.onboard);
  assert.equal(new Set(ids).size, ids.length, "no double boarding");
  assert.equal(ids.length, st.riding);
  for (const v of s.vehicles) {
    assert.ok(v.onboard.length <= v.capacity);
    for (const id of v.onboard) {
      const p = s.people.find((p) => p.id === id)!;
      assert.ok(p);
      assert.equal(p.vehicle, v.id);
      assert.equal(p.group, v.group);
      assert.equal(p.arrived, false);
      assert.equal(p.walking, 0);
    }
  }
  for (const p of s.people) {
    if (p.vehicle) assert.ok(ids.includes(p.id));
    if (p.arrived) {
      assert.equal(p.vehicle, null);
      assert.equal(p.walking, 0);
    }
    if (p.walking) assert.equal(p.vehicle, null);
  }
  assert.equal(s.tiles.length, s.mission.tiles.length);
  assert.equal(new Set(s.tiles.map((t) => t.id)).size, s.tiles.length);
  const positions = s.tiles.filter((t) => t.cell !== null).map((t) => t.cell);
  assert.equal(new Set(positions).size, positions.length, "one piece per cell");
}
function run(
  s: GameState,
  goal: (s: GameState) => boolean = (s) => s.mode === "won",
  limit = 180,
) {
  for (let n = 0; n < limit * 60 && !goal(s); n++) {
    tick(s, 1 / 60);
    conserved(s);
  }
  return goal(s);
}
const core = (s: GameState) =>
  structuredClone({
    tiles: s.tiles,
    people: s.people,
    vehicles: s.vehicles,
    time: s.time,
    moves: s.moves,
    closed: s.closed,
    inducedAt: s.inducedAt,
    inducedDone: s.inducedDone,
    mode: s.mode,
  });

test("quarter-turns rotate real ports and four turns restore every piece kind", () => {
  for (const kind of [
    "straight",
    "corner",
    "tee",
    "bridge",
    "ramp",
    "rail",
    "railCorner",
    "wide",
    "oneway",
  ] as const) {
    const s = createState(
      mission({ tiles: [tile("piece", null, kind)], fleet: [] }),
    );
    const before = roadPorts(s.tiles[0]);
    rotate(s, "piece");
    assert.deepEqual(
      roadPorts(s.tiles[0]),
      before.map((d) => (d + 1) % 4),
    );
    for (let i = 0; i < 3; i++) rotate(s, "piece");
    assert.equal(s.tiles[0].rotation, 0);
    assert.deepEqual(roadPorts(s.tiles[0]), before);
  }
});

test("loaded bus reaches the locked approach, brakes at a gap, and same bus resumes after snap", () => {
  const s = createState(mission());
  tick(s, 6);
  conserved(s);
  const v = s.vehicles[0],
    id = v.id;
  assert.equal(v.cell, "1,0");
  assert.equal(v.next, null);
  assert.equal(v.status, "waiting");
  assert.equal(v.onboard.length, 6);
  const waitingIDs = s.people.filter((p) => !p.vehicle).map((p) => p.id);
  assert.equal(waitingIDs.length, 2);
  assert.equal(place(s, "loose", "2,0"), true);
  let returned = false;
  for (let i = 0; i < 6000 && s.mode !== "won"; i++) {
    tick(s, 1 / 60);
    conserved(s);
    assert.equal(s.vehicles[0].id, id);
    returned ||= s.vehicles[0].returning;
  }
  assert.ok(returned);
  assert.equal(s.mode, "won");
  assert.ok(s.people.every((p) => p.boardings === 1));
  assert.equal(s.vehicles[0].trips, 2);
});

test("a wrong flat orientation stays visible and correct rotation resumes without retry", () => {
  const s = createState(
    mission({
      tiles: mission().tiles.map((t) =>
        t.id === "loose" ? { ...t, rotation: 1 } : t,
      ),
    }),
  );
  assert.equal(place(s, "loose", "2,0"), true);
  assert.equal(path(s, "0,0", "4,0", "bus"), null);
  tick(s, 5);
  assert.equal(stats(s).arrived, 0);
  assert.equal(rotate(s, "loose"), true);
  assert.ok(path(s, "0,0", "4,0", "bus"));
  assert.ok(run(s));
  assert.equal(stats(s).arrived, 8);
});

test("corner ports describe a real bent trip and riders do not reboard at the bend", () => {
  const m = mission({
    cols: 3,
    rows: 2,
    cells: [cell(0, 1), cell(1, 1), cell(1, 0), cell(2, 0)],
    tiles: [
      tile("h", "0,1", "straight", 0, true),
      tile("corner", "1,1", "corner", 3),
      tile("bend2", "1,0", "corner", 1, true),
      tile("s", "2,0", "straight", 0, true),
    ],
    groups: [
      { id: "g", origin: "0,1", destination: "2,0", count: 4, label: "homes" },
    ],
  });
  const s = createState(m);
  assert.deepEqual(path(s, "0,1", "2,0", "bus"), ["0,1", "1,1", "1,0", "2,0"]);
  assert.ok(run(s));
  assert.ok(s.people.every((p) => p.boardings === 1));
  assert.equal(s.vehicles[0].id, "bus");
});

test("occupied and reserved next pieces cannot be rotated, lifted, moved or returned to tray", () => {
  const m = mission({
    tiles: [
      tile("h", "0,0"),
      tile("p", "1,0"),
      tile("g", "2,0"),
      tile("e", "3,0"),
      tile("s", "4,0"),
      tile("spare", null),
    ],
  });
  const s = createState(m);
  tick(s, 1.1);
  assert.equal(s.vehicles[0].next, "1,0");
  const before = core(s),
    history = s.undo.length;
  assert.equal(rotate(s, "h"), false);
  assert.equal(beginHold(s, "p"), false);
  assert.equal(place(s, "spare", "1,0"), false);
  assert.equal(returnToTray(s, "p"), false);
  assert.deepEqual(core(s), before);
  assert.equal(s.undo.length, history);
});

test("illegal terrain and bridge support orientation reject atomically", () => {
  for (const terrain of ["rock", "quiet", "water"] as const) {
    const s = createState(
      mission({
        cells: mission().cells.map((c) =>
          c.id === "2,0" ? { ...c, terrain, bridgeAxis: 1 } : c,
        ),
      }),
    );
    const before = core(s);
    assert.equal(place(s, "loose", "2,0"), false);
    assert.deepEqual(core(s), before);
  }
  const s = createState(
    mission({
      cells: mission().cells.map((c) =>
        c.id === "2,0" ? { ...c, terrain: "water", bridgeAxis: 1 } : c,
      ),
      tiles: mission().tiles.map((t) =>
        t.id === "loose" ? { ...t, kind: "bridge", rotation: 1 } : t,
      ),
    }),
  );
  assert.equal(place(s, "loose", "2,0"), false);
  rotate(s, "loose");
  assert.equal(place(s, "loose", "2,0"), true);
  assert.ok(run(s));
});

test("height continuity distinguishes ramp direction despite identical plan-view ports", () => {
  const s = createState(
    mission({
      cols: 3,
      cells: [cell(0), cell(1), cell(2, 0, { height: 1 })],
      tiles: [
        tile("h", "0,0", "straight", 0, true),
        tile("ramp", "1,0", "ramp", 3),
        tile("s", "2,0", "straight", 0, true),
      ],
      groups: [
        {
          id: "g",
          origin: "0,0",
          destination: "2,0",
          count: 3,
          label: "homes",
        },
      ],
    }),
  );
  assert.equal(path(s, "0,0", "2,0", "bus"), null);
  assert.equal(endpointHeight(s.mission, s.tiles[1], 3), 1);
  assert.equal(endpointHeight(s.mission, s.tiles[1], 1), 0);
  tick(s, 3);
  assert.equal(stats(s).arrived, 0);
  rotate(s, "ramp", 2);
  assert.equal(endpointHeight(s.mission, s.tiles[1], 3), 0);
  assert.equal(endpointHeight(s.mission, s.tiles[1], 1), 1);
  assert.ok(path(s, "0,0", "2,0", "bus"));
  assert.ok(run(s));
});

test("one-way arrow constrains entry/exit and the same road is not a reverse return route", () => {
  const s = createState(
    mission({
      cols: 3,
      cells: [cell(0), cell(1), cell(2)],
      tiles: [
        tile("h", "0,0", "straight", 0, true),
        tile("arrow", "1,0", "oneway"),
        tile("s", "2,0", "straight", 0, true),
      ],
      groups: [
        {
          id: "g",
          origin: "0,0",
          destination: "2,0",
          count: 3,
          label: "homes",
        },
      ],
    }),
  );
  assert.ok(path(s, "0,0", "2,0", "bus"));
  assert.equal(path(s, "2,0", "0,0", "bus"), null);
  rotate(s, "arrow", 2);
  assert.equal(path(s, "0,0", "2,0", "bus"), null);
  assert.ok(path(s, "2,0", "0,0", "bus"));
});

test("opposite-direction buses share finite bridge occupancy without losing people", () => {
  const s = createState(
    mission({
      cells: mission().cells.map((c) =>
        c.id === "2,0" ? { ...c, terrain: "water", bridgeAxis: 1 } : c,
      ),
      tiles: mission()
        .tiles.filter((t) => t.id !== "loose")
        .concat(tile("bridge", "2,0", "bridge")),
      groups: [
        { id: "a", origin: "0,0", destination: "4,0", count: 6, label: "west" },
        { id: "b", origin: "4,0", destination: "0,0", count: 6, label: "east" },
      ],
      fleet: [
        { id: "a-bus", group: "a", leg: 0, mode: "bus", capacity: 6 },
        { id: "b-bus", group: "b", leg: 0, mode: "bus", capacity: 6 },
      ],
    }),
  );
  let queued = false;
  for (let i = 0; i < 6000 && s.mode !== "won"; i++) {
    tick(s, 1 / 60);
    conserved(s);
    assert.ok(
      s.vehicles.filter(
        (v) => v.status !== "done" && (v.cell === "2,0" || v.next === "2,0"),
      ).length <= 1,
    );
    queued ||= s.vehicles.some((v) => v.reason.includes("הגשר"));
  }
  assert.ok(queued);
  assert.equal(s.mode, "won", JSON.stringify(s.vehicles));
});

test("same-direction buses preserve seats and spacing while sharing a group", () => {
  const s = createState(
    mission({
      tiles: mission()
        .tiles.filter((t) => t.id !== "loose")
        .concat(tile("road", "2,0")),
      groups: [
        {
          id: "g",
          origin: "0,0",
          destination: "4,0",
          count: 12,
          label: "homes",
        },
      ],
      fleet: [
        { id: "bus1", group: "g", leg: 0, mode: "bus", capacity: 6 },
        { id: "bus2", group: "g", leg: 0, mode: "bus", capacity: 6 },
      ],
    }),
  );
  let separated = false;
  for (let i = 0; i < 6000 && s.mode !== "won"; i++) {
    tick(s, 1 / 60);
    conserved(s);
    const [a, b] = s.vehicles;
    if (
      a.status === "moving" &&
      b.status === "moving" &&
      a.heading === b.heading
    ) {
      const p = vehiclePosition(s, a),
        q = vehiclePosition(s, b);
      assert.ok(Math.hypot(p.x - q.x, p.z - q.z) > 0.6);
      separated = true;
    }
  }
  assert.ok(separated);
  assert.equal(s.mode, "won");
});

test("a transfer preserves identity across bus, real rail vehicle and final walk", () => {
  const cells = Array.from({ length: 6 }, (_, x) =>
    cell(x, x === 2 ? 0 : 0, {
      landmark:
        x === 2
          ? { kind: "station", label: "transfer" }
          : x === 4
            ? { kind: "station", label: "final stop" }
            : undefined,
    }),
  );
  const s = createState(
    mission({
      cols: 6,
      cells,
      tiles: [
        tile("h", "0,0", "straight", 0, true),
        tile("p", "1,0", "straight", 0, true),
        tile("station", "2,0", "straight", 0, true),
        tile("rail", "3,0", "rail", 0, true),
        tile("last", "4,0", "rail", 0, true),
      ],
      groups: [
        {
          id: "g",
          origin: "0,0",
          via: "2,0",
          walkFrom: "4,0",
          destination: "5,0",
          count: 8,
          label: "homes",
        },
      ],
      fleet: [
        { id: "bus", group: "g", leg: 0, mode: "bus", capacity: 6 },
        { id: "train", group: "g", leg: 1, mode: "rail", capacity: 14 },
      ],
    }),
  );
  assert.equal(path(s, "0,0", "4,0", "bus"), null);
  let sawWalk = false,
    sawTransfer = false;
  const stationSeen = new Map<number, number>();
  for (let i = 0; i < 9000 && s.mode !== "won"; i++) {
    tick(s, 1 / 60);
    conserved(s);
    sawWalk ||= stats(s).walking > 0;
    sawTransfer ||= s.people.some(
      (p) => p.cell === "2,0" && p.leg === 1 && !p.vehicle,
    );
    for (const p of s.people) {
      if (
        p.cell === "2,0" &&
        p.leg === 1 &&
        !p.vehicle &&
        !stationSeen.has(p.id)
      )
        stationSeen.set(p.id, s.time);
      if (p.vehicle === "train") {
        assert.equal(p.boardings, 2);
        assert.ok(
          s.time - stationSeen.get(p.id)! > 0.35,
          "transfer includes a visible station wait",
        );
      }
    }
  }
  assert.ok(sawWalk);
  assert.ok(sawTransfer);
  assert.equal(s.mode, "won");
  assert.ok(s.people.every((p) => p.boardings === 2));
});

test("clinic fits only an authored service plot and creates actual local walking", () => {
  const s = createState(
    mission({
      cols: 2,
      cells: [cell(0), cell(1, 0, { servicePlot: true })],
      tiles: [tile("clinic", null, "clinic")],
      groups: [
        {
          id: "g",
          origin: "0,0",
          destination: "1,0",
          count: 4,
          label: "patients",
          local: true,
        },
      ],
      fleet: [],
    }),
  );
  assert.equal(place(s, "clinic", "0,0"), false);
  assert.equal(place(s, "clinic", "1,0"), true);
  assert.equal(stats(s).arrived, 0);
  tick(s, 0.1);
  conserved(s);
  assert.equal(stats(s).walking, 4);
  assert.ok(run(s));
  assert.equal(stats(s).arrived, 4);
});

test("opening a clinic cannot turn onboard people into walking/arrived duplicates", () => {
  const s = createState(
    mission({
      cols: 3,
      cells: [cell(0), cell(1), cell(2, 0, { servicePlot: true })],
      tiles: [
        tile("h", "0,0", "straight", 0, true),
        tile("p", "1,0", "straight", 0, true),
        tile("clinic", null, "clinic"),
      ],
      groups: [
        {
          id: "g",
          origin: "0,0",
          destination: "2,0",
          count: 4,
          label: "patients",
          local: true,
        },
      ],
    }),
  );
  tick(s, 2);
  assert.equal(stats(s).riding, 4);
  place(s, "clinic", "2,0");
  tick(s, 2);
  conserved(s);
  assert.ok(
    s.people
      .filter((p) => p.vehicle)
      .every((p) => !p.arrived && p.walking === 0),
  );
});

test("a small unconnected group prevents a majority-only victory", () => {
  const m = mission({
    cells: [...mission().cells, cell(0, 2), cell(4, 2)],
    tiles: mission()
      .tiles.filter((t) => t.id !== "loose")
      .concat(tile("road", "2,0")),
    groups: [
      { id: "g", origin: "0,0", destination: "4,0", count: 6, label: "centre" },
      {
        id: "edge",
        origin: "0,2",
        destination: "4,2",
        count: 1,
        label: "edge",
      },
    ],
  });
  const s = createState(m);
  run(s, (s) => stats(s).arrived === 6);
  tick(s, 30);
  conserved(s);
  assert.equal(stats(s).arrived, 6);
  assert.equal(stats(s).groups.find((g) => g.id === "edge")!.arrived, 0);
  assert.equal(s.mode, "playing");
});

test("holding removes real connectivity, cancel restores orientation without rewinding elapsed traffic", () => {
  const s = createState(
    mission({
      tiles: mission()
        .tiles.filter((t) => t.id !== "loose")
        .concat(tile("road", "2,0")),
    }),
  );
  assert.equal(beginHold(s, "road"), true);
  assert.equal(s.tiles.find((t) => t.id === "road")!.cell, null);
  assert.equal(path(s, "0,0", "4,0", "bus"), null);
  rotate(s, "road");
  tick(s, 3);
  const time = s.time;
  cancelHold(s);
  assert.equal(s.time, time);
  assert.equal(s.tiles.find((t) => t.id === "road")!.rotation, 0);
  assert.equal(s.tiles.find((t) => t.id === "road")!.cell, "2,0");
  assert.ok(run(s));
});

test("a held compound move undoes to the complete pre-lift simulation snapshot", () => {
  const s = createState(
    mission({
      cells: [...mission().cells, cell(2, 1)],
      tiles: mission()
        .tiles.filter((t) => t.id !== "loose")
        .concat(tile("road", "2,1")),
    }),
  );
  tick(s, 1);
  const before = core(s);
  beginHold(s, "road");
  rotate(s, "road", 2);
  tick(s, 1);
  assert.equal(place(s, "road", "2,0"), true);
  tick(s, 2);
  assert.equal(undo(s), true);
  assert.deepEqual(core(s), before);
  conserved(s);
});

test("held and direct moves have consistent occupied-cell swap semantics", () => {
  const m = mission({
    fleet: [],
    tiles: [tile("a", "1,0", "corner"), tile("b", "2,0")],
  });
  const direct = createState(m),
    held = createState(m);
  const result = place(direct, "a", "2,0");
  beginHold(held, "a");
  assert.equal(
    place(held, "a", "2,0"),
    result,
    "grabbing must not change whether a board-to-board move is legal",
  );
  assert.deepEqual(held.tiles, direct.tiles);
});

test("pause freezes time and rejects board mutation; retry repeats the authored initial state", () => {
  const s = createState(mission());
  place(s, "loose", "2,0");
  tick(s, 1);
  s.mode = "paused";
  const before = core(s);
  tick(s, 20);
  assert.equal(rotate(s, "loose"), false);
  assert.deepEqual(core(s), before);
  s.mode = "playing";
  assert.ok(run(s));
  retry(s);
  assert.equal(s.time, 0);
  assert.equal(s.moves, 0);
  assert.equal(s.tiles.find((t) => t.id === "loose")!.cell, null);
  assert.ok(s.people.every((p) => !p.arrived && p.boardings === 0));
  assert.equal(s.vehicles[0].id, "bus");
});

test("wide placement schedules the conditional group once and undo rewinds it coherently", () => {
  const s = createState(
    mission({
      tiles: mission().tiles.map((t) =>
        t.id === "loose" ? { ...t, kind: "wide" } : t,
      ),
      groups: [
        {
          id: "g",
          origin: "0,0",
          destination: "4,0",
          count: 2,
          label: "homes",
        },
      ],
      induced: { after: 2, count: 5, group: "g" },
    }),
  );
  const before = core(s);
  place(s, "loose", "2,0");
  tick(s, 1);
  assert.equal(s.people.length, 2);
  tick(s, 2);
  conserved(s, 7);
  assert.equal(s.people.length, 7);
  assert.equal(new Set(s.people.map((p) => p.id)).size, 7);
  assert.ok(run(s));
  assert.equal(undo(s), true);
  assert.deepEqual(core(s), before);
});

test("closure blocks new entry but a vehicle already entering finishes without passenger loss", () => {
  const s = createState(
    mission({
      tiles: mission()
        .tiles.filter((t) => t.id !== "loose")
        .concat(tile("road", "2,0")),
      groups: [
        {
          id: "g",
          origin: "0,0",
          destination: "4,0",
          count: 4,
          label: "homes",
        },
      ],
      closure: { after: 2.1, cell: "2,0" },
    }),
  );
  let enteredBefore = false;
  for (let i = 0; i < 6000 && s.mode !== "won"; i++) {
    const previous = s.vehicles[0].next;
    tick(s, 1 / 60);
    conserved(s);
    const v = s.vehicles[0];
    if (v.next === "2,0" && previous !== "2,0") {
      assert.ok(s.time < 2.1);
      enteredBefore = true;
    }
  }
  assert.ok(enteredBefore);
  assert.equal(s.mode, "won");
  assert.equal(stats(s).arrived, 4);
});

test('built land rejects new infrastructure atomically with a building reason',()=>{
 for(const kind of ['straight','clinic'] as const){
  const s=createState(mission({cells:mission().cells.map(c=>c.id==='2,0'?{...c,terrain:'built',servicePlot:kind==='clinic'}:c),tiles:mission().tiles.map(t=>t.id==='loose'?{...t,kind}:t)}));
  const before=core(s),history=s.undo.length;
  assert.equal(place(s,'loose','2,0'),false);assert.match(s.message,/מבנה/);assert.deepEqual(core(s),before);assert.equal(s.undo.length,history);conserved(s);
 }
});
