import test from "node:test";
import assert from "node:assert/strict";
import {
  getMission,
  ALTERNATE_4,
  ALTERNATE_8,
  ALTERNATE_21,
  ALTERNATE_23,
} from "../../src/action/campaign";
import {
  applyAction,
  beginHold,
  cancelHold,
  createState,
  place,
  retry,
  returnToTray,
  rotate,
  stats,
  tick,
  undo,
} from "../../src/action/model";
import type { GameState, Mission } from "../../src/action/types";

function finish(s: GameState) {
  tick(s, 300);
  assert.equal(s.mode, "won");
  assert.equal(stats(s).arrived, stats(s).total);
  return stats(s);
}
function arrange(s: GameState, id: string, cell: string, orientation: number) {
  const t = s.tiles.find((t) => t.id === id)!;
  const turns = (orientation - t.rotation + 4) % 4;
  if (turns) assert.equal(rotate(s, id, turns), true);
  if (t.cell !== cell) assert.equal(place(s, id, cell), true);
}
function park(id = 1) {
  const m = getMission(id);
  return m.cells
    .filter(
      (c) =>
        c.terrain === "land" &&
        !c.landmark &&
        !c.servicePlot &&
        !m.tiles.some((t) => t.cell === c.id),
    )
    .map((c) => c.id);
}

test("intro: many rotations and long planning time do not reduce the same one-placement rescue", () => {
  const direct = createState(getMission(1));
  assert.equal(place(direct, "first-road", "2,1"), true);
  const clean = finish(direct);
  const explored = createState(getMission(1));
  for (let n = 0; n < 40; n++)
    assert.equal(rotate(explored, "first-road"), true);
  tick(explored, 65);
  assert.equal(stats(explored).arrived, 0);
  assert.equal(stats(explored).placements, 0);
  assert.equal(place(explored, "first-road", "2,1"), true);
  const result = finish(explored);
  assert.equal(result.placementTarget, 1);
  assert.equal(result.placements, 1);
  assert.equal(result.stars, 3);
  assert.equal(clean.stars, 3);
  assert.ok(result.time > clean.time + 60);
});

test("exact preview and win boundaries count extra committed placements, with the same final road", () => {
  const [a, b] = park();
  assert.ok(a && b);
  const outcomes = [];
  for (const extras of [0, 1, 2, 3]) {
    const s = createState(getMission(1));
    for (let n = 0; n < extras; n++)
      assert.equal(place(s, "first-road", n % 2 === 0 ? a : b), true);
    assert.equal(place(s, "first-road", "2,1"), true);
    const expected = extras === 0 ? 3 : extras <= 2 ? 2 : 1;
    assert.equal(stats(s).placements, extras + 1);
    assert.equal(stats(s).placementTarget, 1);
    assert.equal(stats(s).stars, expected);
    const end = finish(s);
    assert.equal(end.stars, expected);
    outcomes.push(s.tiles);
  }
  for (const network of outcomes.slice(1))
    assert.deepEqual(network, outcomes[0]);
});

test("rejected, cancelled, rotated-in-place, same-origin and tray actions are free", () => {
  const s = createState(getMission(1)),
    [a] = park();
  const built = s.mission.cells.find((c) => c.terrain === "built")!;
  assert.equal(place(s, "first-road", built.id), false);
  assert.equal(stats(s).placements, 0);
  assert.equal(beginHold(s, "first-road"), true);
  rotate(s, "first-road");
  cancelHold(s);
  assert.equal(stats(s).placements, 0);
  assert.equal(place(s, "first-road", a), true);
  assert.equal(stats(s).placements, 1);
  assert.equal(beginHold(s, "first-road"), true);
  assert.equal(rotate(s, "first-road"), true);
  assert.equal(place(s, "first-road", a), true);
  assert.equal(
    stats(s).placements,
    1,
    "returning to the original cell is a rotation, not a placement",
  );
  assert.equal(returnToTray(s, "first-road"), true);
  assert.equal(stats(s).placements, 1);
  rotate(s, "first-road", 3);
  assert.equal(stats(s).placements, 1);
  assert.equal(beginHold(s, "first-road"), true);
  assert.equal(returnToTray(s, "first-road"), true);
  assert.equal(stats(s).placements, 1);
});

test("a direct or held board swap commits one placement for two affected pieces", () => {
  for (const held of [false, true]) {
    const s = createState(getMission(24)),
      a = s.tiles.find((t) => t.id === "road-1,3")!,
      b = s.tiles.find((t) => t.id === "road-3,3")!,
      origin = a.cell!,
      destination = b.cell!;
    if (held) assert.equal(beginHold(s, a.id), true);
    assert.equal(place(s, a.id, destination), true);
    assert.equal(stats(s).placements, 1);
    assert.equal(a.cell, destination);
    assert.equal(b.cell, origin);
    assert.equal(undo(s), true);
    assert.equal(stats(s).placements, 0);
  }
});

test("undo restores construction count and retry starts a fresh preview without history penalties", () => {
  const s = createState(getMission(1)),
    [a, b] = park();
  place(s, "first-road", a);
  place(s, "first-road", b);
  assert.equal(stats(s).placements, 2);
  assert.equal(undo(s), true);
  assert.equal(stats(s).placements, 1);
  assert.equal(undo(s), true);
  assert.equal(stats(s).placements, 0);
  assert.equal(s.tiles.find((t) => t.id === "first-road")!.cell, null);
  place(s, "first-road", "2,1");
  assert.equal(finish(s).stars, 3);
  retry(s);
  assert.equal(stats(s).placements, 0);
  assert.equal(stats(s).placementTarget, 1);
  assert.equal(
    stats(s).stars,
    3,
    "stars are an explicitly labelled preview before rescue",
  );
  assert.equal(s.mode, "playing");
  assert.equal(stats(s).arrived, 0);
});

test("the discovered four-piece return in13 earns gold below its verified six-placement target", () => {
  const s = createState(getMission(13));
  tick(s, 10);
  assert.equal(stats(s).arrived, 6);
  arrange(s, "road-0,0", "0,1", 1);
  arrange(s, "return-corner", "3,1", 2);
  arrange(s, "road-2,0", "2,1", 2);
  arrange(s, "road-1,0", "1,1", 0);
  const result = finish(s);
  assert.equal(result.placements, 4);
  assert.equal(result.placementTarget, 6);
  assert.equal(result.stars, 3);
});

test("late reference builds and known alternatives keep gold despite free exploration and waiting", () => {
  const cases = [
    ...Array.from({ length: 12 }, (_, n) => ({
      id: n + 13,
      actions: getMission(n + 13).solution,
    })),
    { id: 4, actions: ALTERNATE_4 },
    { id: 8, actions: ALTERNATE_8 },
    { id: 21, actions: ALTERNATE_21 },
    { id: 23, actions: ALTERNATE_23 },
  ];
  for (const item of cases) {
    const s = createState(getMission(item.id)),
      free = s.tiles.find(
        (t) => !t.locked && !["clinic", "bridge"].includes(t.kind),
      )!;
    for (let n = 0; n < 12; n++) assert.equal(rotate(s, free.id), true);
    tick(s, 65);
    for (const a of item.actions)
      assert.equal(applyAction(s, a), true, `mission ${item.id}: ${s.message}`);
    const result = finish(s);
    assert.ok(result.placements <= result.placementTarget);
    assert.equal(result.stars, 3, `mission ${item.id}`);
  }
});

test("a three-star construction preview cannot skip passengers scheduled after widening", () => {
  const m: Mission = {
    id: 999,
    title: "Scheduled rescue",
    instruction: "QA",
    lesson: "QA",
    source: "independent fixture",
    cols: 3,
    rows: 1,
    cells: [0, 1, 2].map((x) => ({
      id: `${x},0`,
      x,
      z: 0,
      height: 0,
      terrain: "land",
    })),
    tiles: [
      { id: "home", kind: "straight", rotation: 0, cell: "0,0", locked: true },
      { id: "wide", kind: "wide", rotation: 0, cell: null },
      { id: "goal", kind: "straight", rotation: 0, cell: "2,0", locked: true },
    ],
    groups: [
      { id: "g", origin: "0,0", destination: "2,0", count: 2, label: "homes" },
    ],
    fleet: [{ id: "bus", group: "g", leg: 0, mode: "bus", capacity: 6 }],
    par: 1,
    solution: [{ type: "place", tile: "wide", cell: "1,0" }],
    induced: { after: 20, count: 6, group: "g" },
  };
  const s = createState(m);
  place(s, "wide", "1,0");
  tick(s, 5);
  assert.equal(stats(s).arrived, 2);
  assert.equal(s.people.length, 2);
  assert.equal(stats(s).stars, 3);
  assert.equal(s.mode, "playing", "preview is not an awarded rescue");
  assert.equal(s.inducedDone, false);
  assert.equal(finish(s).total, 8);
  assert.equal(stats(s).stars, 3);
  assert.equal(s.inducedDone, true);
});
