import test from "node:test";
import assert from "node:assert/strict";
import {
  MISSIONS,
  getMission,
  ALTERNATE_21,
  ALTERNATE_23,
} from "../../src/action/campaign";
import {
  applyAction,
  createState,
  path,
  place,
  stats,
  tick,
  vehiclePosition,
} from "../../src/action/model";
import type { Action, GameState } from "../../src/action/types";

// Witnesses establish authored solvability only. They are never injected in browser play.
function accounting(s: GameState) {
  const st = stats(s),
    expected =
      s.mission.groups.reduce((n, g) => n + g.count, 0) +
      (s.inducedDone ? (s.mission.induced?.count ?? 0) : 0);
  assert.equal(st.total, expected);
  assert.equal(s.people.length, expected);
  assert.equal(st.arrived + st.waiting + st.riding + st.walking, expected);
  assert.equal(new Set(s.people.map((p) => p.id)).size, expected);
  const manifests = s.vehicles.flatMap((v) => v.onboard);
  assert.equal(new Set(manifests).size, manifests.length);
  for (const v of s.vehicles) {
    assert.ok(v.onboard.length <= v.capacity);
    const pos = vehiclePosition(s, v);
    assert.ok([pos.x, pos.y, pos.z, pos.angle].every(Number.isFinite));
    for (const id of v.onboard) {
      const p = s.people.find((p) => p.id === id)!;
      assert.ok(p);
      assert.equal(p.vehicle, v.id);
      assert.equal(p.group, v.group);
      assert.equal(p.arrived, false);
      assert.equal(p.walking, 0);
    }
  }
  for (const p of s.people)
    assert.equal(manifests.includes(p.id), p.vehicle !== null);
}
function actions(s: GameState, list: Action[] = s.mission.solution) {
  for (const a of list)
    assert.equal(
      applyAction(s, a),
      true,
      `mission ${s.mission.id}: ${JSON.stringify(a)}: ${s.message}`,
    );
}
function advance(
  s: GameState,
  goal: (s: GameState) => boolean = (s) => s.mode === "won",
  limit = 180,
) {
  for (let t = 0; t < limit * 10 && !goal(s); t++) {
    tick(s, 0.1);
    accounting(s);
  }
  return goal(s);
}

for (const mission of MISSIONS)
  test(`mission ${mission.id}: public-action witness serves every group`, () => {
    const s = createState(mission),
      vehicleIDs = s.vehicles.map((v) => v.id),
      source = JSON.stringify(mission);
    assert.equal(s.mode, "playing");
    assert.ok(s.people.length > 0);
    assert.ok(mission.solution.length > 0);
    assert.equal(
      new Set(mission.cells.map((c) => c.id)).size,
      mission.cells.length,
    );
    assert.equal(
      new Set(mission.tiles.map((t) => t.id)).size,
      mission.tiles.length,
    );
    actions(s);
    assert.ok(
      advance(s),
      `mission ${mission.id} stalls: ${JSON.stringify(s.vehicles)}`,
    );
    assert.equal(s.mode, "won");
    assert.equal(stats(s).arrived, stats(s).total);
    assert.ok(stats(s).groups.every((g) => g.arrived === g.total));
    assert.deepEqual(
      s.vehicles.map((v) => v.id),
      vehicleIDs,
    );
    assert.equal(
      JSON.stringify(mission),
      source,
      "authored mission remains immutable",
    );
  });

test("13: first six arrive but missing one-way return loop strands the remaining eight", () => {
  const s = createState(getMission(13));
  assert.ok(advance(s, (s) => stats(s).arrived === 6));
  tick(s, 25);
  accounting(s);
  assert.equal(stats(s).arrived, 6);
  assert.equal(stats(s).waiting, 8);
  assert.equal(s.mode, "playing");
  assert.equal(path(s, "3,2", "0,2", "bus"), null);
  actions(s);
  assert.ok(path(s, "3,2", "0,2", "bus"));
  assert.ok(advance(s));
  assert.equal(s.vehicles[0].trips, 3);
  assert.ok(s.people.every((p) => p.boardings === 1));
});

test("18: the near group has a longer real path and arrives later than the far group", () => {
  const s = createState(getMission(18));
  actions(s);
  const near = s.mission.groups.find((g) => g.id === "near")!,
    far = s.mission.groups.find((g) => g.id === "far")!;
  const cell = (id: string) => s.mission.cells.find((c) => c.id === id)!;
  const distance = (origin: string, destination: string) =>
    Math.hypot(
      cell(origin).x - cell(destination).x,
      cell(origin).z - cell(destination).z,
    );
  assert.ok(
    distance(near.origin, near.destination) <
      distance(far.origin, far.destination),
  );
  assert.ok(
    path(s, near.origin, near.destination, "bus")!.length >
      path(s, far.origin, far.destination, "bus")!.length,
  );
  const times: Record<string, number> = {};
  assert.ok(
    advance(s, (s) => {
      for (const g of stats(s).groups)
        if (g.arrived === g.total && times[g.id] === undefined)
          times[g.id] = s.time;
      return s.mode === "won";
    }),
  );
  assert.ok(times.near > times.far, JSON.stringify(times));
});

test("8: quiet land rejects a direct road, while the real bypass serves the children", () => {
  const s = createState(getMission(8)),
    before = structuredClone(s.tiles);
  assert.equal(place(s, "left", "2,2"), false);
  assert.deepEqual(s.tiles, before);
  assert.equal(s.moves, 0);
  actions(s);
  assert.ok(advance(s));
});

test("19: a clinic at the other valid plot does not erase the local group", () => {
  const s = createState(getMission(19));
  assert.equal(place(s, "clinic", "1,1"), true);
  tick(s, 30);
  accounting(s);
  assert.equal(stats(s).groups.find((g) => g.id === "local")!.arrived, 0);
  assert.equal(s.mode, "playing");
  const ids = s.people.map((p) => p.id);
  assert.equal(place(s, "clinic", "3,2"), true);
  tick(s, 0.1);
  assert.equal(stats(s).walking, 4);
  assert.ok(advance(s));
  assert.deepEqual(
    s.people.map((p) => p.id),
    ids,
  );
});

test("21: normal road and announced wider-road demand are two genuinely different solvable plans", () => {
  const slim = createState(getMission(21)),
    wide = createState(getMission(21));
  actions(slim, ALTERNATE_21);
  actions(wide);
  assert.ok(advance(slim));
  assert.equal(stats(slim).total, 6);
  assert.equal(slim.inducedDone, false);
  assert.ok(advance(wide));
  assert.equal(stats(wide).total, 18);
  assert.equal(wide.inducedDone, true);
  assert.ok(wide.time > slim.time);
  tick(wide, 30);
  assert.equal(stats(wide).total, 18);
});

test("22: waiting until after closure is recoverable by building the alternate crossing", () => {
  const s = createState(getMission(22));
  tick(s, 12);
  accounting(s);
  assert.ok(s.closed.includes("2,3"));
  assert.equal(s.mode, "playing");
  actions(s);
  assert.ok(advance(s));
  assert.equal(stats(s).arrived, 12);
});

test("23: independently authored lower corridor also wins with the same piece inventory", () => {
  const s = createState(getMission(23));
  actions(s, ALTERNATE_23);
  assert.ok(advance(s));
  assert.equal(stats(s).arrived, 12);
  assert.equal(s.tiles.filter((t) => !t.locked).length, 2);
});

test("24: the connected majority cannot win without opening the actual local clinic", () => {
  const s = createState(getMission(24));
  actions(
    s,
    s.mission.solution.filter((a) => a.tile !== "last-clinic"),
  );
  assert.ok(advance(s, (s) => stats(s).arrived === 18));
  tick(s, 20);
  accounting(s);
  assert.equal(s.mode, "playing");
  assert.equal(stats(s).groups.find((g) => g.id === "local")!.arrived, 0);
  const ids = s.people.map((p) => p.id);
  assert.equal(place(s, "last-clinic", "5,3"), true);
  assert.ok(advance(s));
  assert.equal(stats(s).arrived, 22);
  assert.deepEqual(
    s.people.map((p) => p.id),
    ids,
  );
});
