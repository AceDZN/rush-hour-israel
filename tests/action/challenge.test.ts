import test from "node:test";
import assert from "node:assert/strict";
import {
  getMission,
  ALTERNATE_4,
  ALTERNATE_8,
} from "../../src/action/campaign";
import {
  applyAction,
  beginHold,
  createState,
  path,
  place,
  returnToTray,
  rotate,
  stats,
  tick,
} from "../../src/action/model";
import type { GameState, Mission } from "../../src/action/types";

function conserved(s: GameState) {
  const st = stats(s),
    ids = s.vehicles.flatMap((v) => v.onboard);
  assert.equal(
    st.arrived + st.waiting + st.walking + st.riding,
    s.people.length,
  );
  assert.equal(new Set(s.people.map((p) => p.id)).size, s.people.length);
  assert.equal(new Set(ids).size, ids.length);
  for (const v of s.vehicles) {
    assert.ok(v.onboard.length <= v.capacity);
    for (const id of v.onboard) {
      const p = s.people.find((p) => p.id === id)!;
      assert.equal(p.vehicle, v.id);
      assert.equal(p.arrived, false);
      assert.equal(p.walking, 0);
    }
  }
  for (const p of s.people)
    assert.equal(ids.includes(p.id), p.vehicle !== null);
  const cells = s.tiles.flatMap((t) => (t.cell ? [t.cell] : []));
  assert.equal(new Set(cells).size, cells.length);
}
function run(s: GameState, limit = 300) {
  tick(s, limit);
  conserved(s);
  return s.mode === "won";
}
function arrange(s: GameState, id: string, cell: string, rotation: number) {
  const t = s.tiles.find((t) => t.id === id)!;
  assert.ok(t, `fixture uses real piece ${id}`);
  const turns = (rotation - t.rotation + 4) % 4;
  if (turns) assert.equal(rotate(s, id, turns), true);
  if (t.cell !== cell)
    assert.equal(place(s, id, cell), true, `${id} to ${cell}: ${s.message}`);
  conserved(s);
}
// Necessary static reachability filters avoid advancing hundreds of obviously
// disconnected boards. They never consult mission.solution; a surviving candidate
// is still simulated. Counts are conservative compound-gesture enumeration, not
// an optimal-move solver or a measurement of human challenge.
function potential(s: GameState) {
  for (const g of s.mission.groups) {
    if (g.local) {
      if (!s.tiles.some((t) => t.kind === "clinic" && t.cell === g.destination))
        return false;
      continue;
    }
    const busGoal = g.via ?? g.walkFrom ?? g.destination;
    if (!path(s, g.origin, busGoal, "bus")) return false;
    const busCapacity = s.vehicles
      .filter((v) => v.group === g.id && v.leg === 0)
      .reduce((n, v) => n + v.capacity, 0);
    if (g.count > busCapacity && !path(s, busGoal, g.origin, "bus"))
      return false;
    if (g.via) {
      const goal = g.walkFrom ?? g.destination;
      if (!path(s, g.via, goal, "rail")) return false;
    }
  }
  return true;
}
function oneGesture(m: Mission) {
  let legal = 0,
    simulated = 0;
  const wins: string[] = [];
  const evaluate = (s: GameState, label: string) => {
    legal++;
    conserved(s);
    if (potential(s)) {
      simulated++;
      if (run(s)) wins.push(label);
    }
  };
  for (const piece of m.tiles.filter((t) => !t.locked)) {
    for (const turns of [1, 2, 3]) {
      const s = createState(m);
      if (rotate(s, piece.id, turns))
        evaluate(s, `rotate ${piece.id} ${turns}`);
    }
    for (const turns of [0, 1, 2, 3]) {
      for (const cell of m.cells) {
        const s = createState(m);
        if (!beginHold(s, piece.id)) continue;
        if (turns && !rotate(s, piece.id, turns)) continue;
        if (place(s, piece.id, cell.id))
          evaluate(s, `hold/turn ${piece.id} ${turns} drop ${cell.id}`);
      }
      const tray = createState(m);
      if (
        beginHold(tray, piece.id) &&
        (!turns || rotate(tray, piece.id, turns)) &&
        returnToTray(tray, piece.id)
      )
        evaluate(tray, `return ${piece.id}`);
    }
  }
  return { legal, simulated, wins };
}

for (const [id, required] of [
  [4, 4],
  [8, 5],
  [13, 6],
  [24, 8],
]) {
  test(`${id}: retune changes required poses rather than merely unlocking correct roads`, () => {
    const m = getMission(id),
      s = createState(m),
      before = structuredClone(s.tiles);
    const inventory = s.tiles.filter((t) => !t.locked);
    assert.ok(inventory.length >= required);
    assert.ok(inventory.filter((t) => t.cell === null).length <= 4);
    for (const a of m.solution) assert.equal(applyAction(s, a), true);
    const changed = s.tiles.filter((t) => {
      const old = before.find((p) => p.id === t.id)!;
      return t.cell !== old.cell || t.rotation !== old.rotation;
    });
    assert.ok(
      changed.length >= required,
      `mission ${id}: only ${changed.length} poses actually changed`,
    );
    assert.equal(
      run(createState(m)),
      false,
      "the untouched network is incomplete",
    );
  });
  test(`${id}: no single legal rotate or compound hold/turn/drop wins from the initial board`, (t) => {
    const result = oneGesture(getMission(id));
    assert.ok(result.legal > 25, "search exercises genuine legal placements");
    assert.deepEqual(result.wins, []);
    t.diagnostic(JSON.stringify({ id, ...result }));
  });
}

test("24: one-gesture rejection also holds for road groups alone, independently of the clinic chore", (t) => {
  const m = structuredClone(getMission(24));
  m.groups = m.groups.filter((g) => !g.local);
  m.tiles = m.tiles.filter((t) => t.kind !== "clinic");
  const result = oneGesture(m);
  assert.deepEqual(result.wins, []);
  t.diagnostic(JSON.stringify(result));
});

for (const [id, plan] of [
  [4, ALTERNATE_4],
  [8, ALTERNATE_8],
] as const)
  test(`${id}: exported alternate wins with the same finite inventory`, () => {
    const s = createState(getMission(id)),
      ids = s.tiles.map((t) => t.id);
    for (const a of plan) assert.equal(applyAction(s, a), true);
    assert.ok(run(s));
    assert.deepEqual(
      s.tiles.map((t) => t.id),
      ids,
    );
  });

test("4: spending both corners before the goal row is a legal connected dead end, then repairable", () => {
  const s = createState(getMission(4));
  arrange(s, "road-2,3", "2,3", 3);
  arrange(s, "road-2,1", "2,2", 1);
  arrange(s, "road-2,2", "3,2", 0);
  assert.ok(path(s, "0,3", "3,2", "bus"));
  assert.equal(path(s, "0,3", "4,1", "bus"), null);
  assert.equal(run(s, 30), false);
  assert.equal(stats(s).arrived, 0);
  arrange(s, "road-2,1", "2,1", 1);
  arrange(s, "road-2,2", "2,2", 1);
  arrange(s, "road-3,1", "3,1", 0);
  assert.ok(run(s));
});

test("8: splitting corners across park bypasses is legal but globally incomplete", () => {
  const s = createState(getMission(8));
  arrange(s, "road-1,1", "1,1", 1);
  arrange(s, "road-5,1", "5,3", 3);
  for (const x of [2, 3, 4]) arrange(s, `road-${x},1`, `${x},1`, 0);
  assert.ok(path(s, "1,2", "4,1", "bus"));
  assert.equal(path(s, "1,2", "5,2", "bus"), null);
  assert.equal(run(s, 30), false);
  arrange(s, "road-5,1", "5,1", 2);
  assert.ok(run(s));
});

test("8: changing only quiet land to ordinary land makes the three-straight direct route useful", () => {
  const original = getMission(8),
    flat = structuredClone(original);
  for (const c of flat.cells) if (c.terrain === "quiet") c.terrain = "land";
  const protectedState = createState(original),
    flatState = createState(flat);
  for (const x of [2, 3, 4]) {
    const id = `road-${x},1`;
    for (const s of [protectedState, flatState]) {
      const t = s.tiles.find((t) => t.id === id)!;
      const turns = (4 - t.rotation) % 4;
      if (turns) assert.equal(rotate(s, id, turns), true);
    }
    const before = structuredClone(protectedState.tiles),
      moves = protectedState.moves;
    assert.equal(place(protectedState, id, `${x},2`), false);
    assert.deepEqual(protectedState.tiles, before);
    assert.equal(protectedState.moves, moves);
    assert.equal(place(flatState, id, `${x},2`), true);
  }
  assert.equal(run(protectedState, 30), false);
  assert.ok(run(flatState));
  assert.equal(stats(flatState).arrived, 6);
});

test("13: a connected-looking return with the wrong arrow cannot collect the remaining eight", () => {
  const s = createState(getMission(13));
  tick(s, 10);
  assert.equal(stats(s).arrived, 6);
  const ids = s.people.map((p) => p.id);
  arrange(s, "road-3,1", "3,1", 1);
  arrange(s, "return-corner", "3,0", 2);
  arrange(s, "road-2,0", "2,0", 0);
  arrange(s, "road-1,0", "1,0", 0);
  arrange(s, "road-0,0", "0,0", 1);
  arrange(s, "road-0,1", "0,1", 1);
  assert.ok(path(s, "0,2", "3,2", "bus"));
  assert.equal(path(s, "3,2", "0,2", "bus"), null);
  assert.equal(run(s, 30), false);
  assert.equal(stats(s).arrived, 6);
  assert.equal(stats(s).waiting, 8);
  assert.equal(rotate(s, "road-2,0", 2), true);
  assert.ok(run(s));
  assert.equal(stats(s).arrived, 14);
  assert.deepEqual(
    s.people.map((p) => p.id),
    ids,
  );
  assert.ok(s.people.every((p) => p.boardings === 1));
});

test("24: a legal upper bridge and east-high ramp can serve the coast yet strand the eastern group", () => {
  const s = createState(getMission(24)),
    ids = s.people.map((p) => p.id);
  arrange(s, "spare-24-0", "1,3", 3);
  arrange(s, "road-1,3", "1,2", 1);
  arrange(s, "road-3,3", "1,1", 1);
  arrange(s, "last-bridge", "2,1", 0);
  arrange(s, "last-ramp", "3,1", 1);
  arrange(s, "road-4,2", "4,1", 0);
  arrange(s, "last-clinic", "5,3", 0);
  assert.ok(path(s, "0,3", "5,1", "bus"));
  assert.equal(path(s, "5,4", "5,1", "bus"), null);
  assert.equal(run(s, 100), false);
  assert.equal(stats(s).groups.find((g) => g.id === "coast")!.arrived, 12);
  assert.equal(stats(s).groups.find((g) => g.id === "local")!.arrived, 4);
  assert.equal(stats(s).groups.find((g) => g.id === "hill")!.arrived, 0);
  assert.equal(returnToTray(s, "spare-24-0"), true);
  arrange(s, "road-1,3", "1,3", 0);
  arrange(s, "last-bridge", "2,3", 0);
  arrange(s, "road-3,3", "3,3", 2);
  arrange(s, "road-3,4", "3,4", 0);
  arrange(s, "last-ramp", "4,3", 0);
  arrange(s, "road-4,2", "4,2", 1);
  arrange(s, "last-turn", "4,1", 1);
  assert.ok(run(s));
  assert.equal(stats(s).arrived, 22);
  assert.deepEqual(
    s.people.map((p) => p.id),
    ids,
  );
});

test("13: the independently discovered compact four-piece return is a valid efficient alternate", () => {
  const s = createState(getMission(13));
  tick(s, 10);
  assert.equal(stats(s).arrived, 6);
  const ids = s.people.map((p) => p.id),
    unused = s.tiles
      .filter((t) => ["road-3,1", "road-0,1"].includes(t.id))
      .map((t) => structuredClone(t));
  arrange(s, "road-0,0", "0,1", 1);
  arrange(s, "return-corner", "3,1", 2);
  arrange(s, "road-2,0", "2,1", 2);
  arrange(s, "road-1,0", "1,1", 0);
  assert.ok(run(s));
  assert.equal(stats(s).arrived, 14);
  assert.equal(s.vehicles[0].trips, 3);
  assert.deepEqual(
    s.people.map((p) => p.id),
    ids,
  );
  assert.ok(s.people.every((p) => p.boardings === 1));
  assert.deepEqual(
    s.tiles.filter((t) => ["road-3,1", "road-0,1"].includes(t.id)),
    unused,
    "two reference-plan straights remain unused",
  );
});
