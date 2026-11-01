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
  useHint,
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
function fixture(patch: Partial<Mission> = {}): Mission {
  return {
    id: 990,
    title: "Final build QA",
    instruction: "Repair then review",
    lesson: "QA",
    source: "independent fixture",
    cols: 3,
    rows: 2,
    cells: [0, 1].flatMap((z) => [0, 1, 2].map((x) => cell(x, z))),
    tiles: [
      tile("home", "0,0", "straight", 0, true),
      tile("road", null),
      tile("goal", "2,0", "straight", 0, true),
    ],
    groups: [
      { id: "g", origin: "0,0", destination: "2,0", count: 2, label: "homes" },
    ],
    fleet: [{ id: "bus", group: "g", leg: 0, mode: "bus", capacity: 6 }],
    par: 1,
    solution: [{ type: "place", tile: "road", cell: "1,0" }],
    ...patch,
  };
}
function finish(s: GameState) {
  tick(s, 300);
  assert.equal(s.mode, "won");
  assert.equal(stats(s).arrived, stats(s).total);
  assert.equal(stats(s).completed, true);
  return stats(s);
}
function arrange(s: GameState, id: string, at: string, orientation: number) {
  const t = s.tiles.find((t) => t.id === id)!;
  const turns = (orientation - t.rotation + 4) % 4;
  if (turns) assert.equal(rotate(s, id, turns), true);
  if (t.cell !== at) assert.equal(place(s, id, at), true);
}
function cleanReferenceSpares(s: GameState, actions = s.mission.solution) {
  const useful = new Set(actions.map((a) => a.tile));
  for (const t of s.tiles)
    if (!t.locked && t.cell && !useful.has(t.id))
      assert.equal(returnToTray(s, t.id), true, t.id);
}

test("identical final networks score equally after trial placements, rotations, cancellation and long waits", () => {
  const direct = createState(fixture()),
    explored = createState(fixture());
  place(direct, "road", "1,0");
  const clean = finish(direct);
  for (let n = 0; n < 40; n++) rotate(explored, "road");
  for (const at of ["0,1", "1,1", "2,1", "0,1"])
    assert.equal(place(explored, "road", at), true);
  assert.equal(beginHold(explored, "road"), true);
  rotate(explored, "road");
  cancelHold(explored);
  assert.equal(returnToTray(explored, "road"), true);
  tick(explored, 65);
  assert.equal(
    stats(explored).stars,
    0,
    "no awarded or forecast stars before rescue",
  );
  place(explored, "road", "1,0");
  const result = finish(explored);
  assert.deepEqual(explored.tiles, direct.tiles);
  assert.equal(result.buildPieces, 1);
  assert.equal(result.buildTarget, 1);
  assert.equal(result.stars, 3);
  assert.equal(clean.stars, 3);
  assert.ok(result.time > clean.time + 60);
});

test("compact build and unaided solution are independent optional stars, with real 1/2/3 outcomes", () => {
  for (const hinted of [false, true])
    for (const clutter of [false, true]) {
      const m = fixture();
      m.tiles.push(tile("spare", clutter ? "1,1" : null));
      const s = createState(m);
      if (hinted) useHint(s);
      place(s, "road", "1,0");
      const st = finish(s);
      assert.equal(st.buildPieces, clutter ? 2 : 1);
      assert.equal(st.networkReady, true);
      assert.equal(st.compact, !clutter);
      assert.equal(st.unaided, !hinted);
      assert.equal(st.stars, 1 + Number(!clutter) + Number(!hinted));
    }
});

test("post-arrival spare cleanup improves compactness without changing any rescued person", () => {
  const m = fixture();
  m.tiles.push(tile("spare", "1,1"));
  const s = createState(m);
  place(s, "road", "1,0");
  assert.equal(finish(s).stars, 2);
  const arrived = structuredClone(s.people);
  assert.equal(returnToTray(s, "spare"), true);
  assert.deepEqual(s.people, arrived);
  assert.equal(stats(s).compact, true);
  assert.equal(stats(s).stars, 3);
  assert.equal(returnToTray(s, "road"), true);
  assert.deepEqual(s.people, arrived);
  assert.equal(stats(s).completed, true);
  assert.equal(
    stats(s).networkReady,
    false,
    "clearing essential roads cannot cheat the compact bonus",
  );
  assert.equal(stats(s).stars, 2);
});

test("held board inventory stays counted, tray inventory is excluded, and a held gesture cannot earn compact", () => {
  const s = createState(fixture());
  assert.equal(beginHold(s, "road"), true);
  assert.equal(stats(s).buildPieces, 0);
  assert.equal(stats(s).compact, false);
  cancelHold(s);
  place(s, "road", "1,0");
  assert.equal(stats(s).buildPieces, 1);
  assert.equal(beginHold(s, "road"), true);
  assert.equal(
    stats(s).buildPieces,
    1,
    "lifting from the board is not cleanup",
  );
  assert.equal(stats(s).compact, false);
  cancelHold(s);
  assert.equal(stats(s).buildPieces, 1);
  assert.equal(stats(s).networkReady, true);
  assert.equal(returnToTray(s, "road"), true);
  assert.equal(stats(s).buildPieces, 0);
});

test("solution help survives Undo and held cancellation; retry alone starts a new unaided attempt", () => {
  const s = createState(fixture());
  place(s, "road", "0,1");
  useHint(s);
  assert.equal(stats(s).unaided, false);
  assert.equal(undo(s), true);
  assert.equal(stats(s).unaided, false);
  beginHold(s, "road");
  useHint(s);
  cancelHold(s);
  assert.equal(stats(s).unaided, false);
  place(s, "road", "1,0");
  assert.equal(finish(s).stars, 2);
  retry(s);
  assert.equal(stats(s).unaided, true);
  assert.equal(stats(s).completed, false);
  assert.equal(stats(s).stars, 0);
  place(s, "road", "1,0");
  assert.equal(finish(s).stars, 3);
});

test("build target counts unique useful pieces rather than gesture history; fallback counts unlocked inventory", () => {
  const m = fixture();
  m.solution.push(
    { type: "rotate", tile: "road", turns: 4 },
    { type: "place", tile: "road", cell: "1,0" },
  );
  const s = createState(m);
  assert.equal(stats(s).buildTarget, 1);
  const fallback = fixture({ solution: [] });
  fallback.tiles.push(tile("spare", null));
  assert.equal(stats(createState(fallback)).buildTarget, 2);
});

test("return connectivity is required exactly when group demand exceeds aggregate capacity for that leg", () => {
  for (const [count, buses, ready] of [
    [6, 1, true],
    [7, 1, false],
    [12, 2, true],
    [13, 2, false],
  ] as const) {
    const m = fixture({
      groups: [
        {
          id: "g",
          origin: "0,0",
          destination: "2,0",
          count,
          label: "one-way homes",
        },
      ],
      fleet: Array.from({ length: buses }, (_, n) => ({
        id: `bus${n}`,
        group: "g",
        leg: 0,
        mode: "bus",
        capacity: 6,
      })),
    });
    m.tiles[0].kind = "oneway";
    m.tiles[2].kind = "oneway";
    const s = createState(m);
    place(s, "road", "1,0");
    assert.equal(
      stats(s).networkReady,
      ready,
      `${count} people / ${buses} buses`,
    );
  }
});

test("rail transfer readiness requires both physical legs and the correct mode", () => {
  const m = fixture({
    cols: 4,
    rows: 1,
    cells: [0, 1, 2, 3].map((x) =>
      cell(
        x,
        0,
        x === 1 || x === 3
          ? { landmark: { kind: "station", label: "station" } }
          : {},
      ),
    ),
    tiles: [
      tile("home", "0,0", "straight", 0, true),
      tile("station", "1,0", "straight", 0, true),
      tile("track", null, "rail"),
      tile("road", null),
      tile("terminal", "3,0", "straight", 0, true),
    ],
    groups: [
      {
        id: "g",
        origin: "0,0",
        via: "1,0",
        destination: "3,0",
        count: 2,
        label: "transfer",
      },
    ],
    fleet: [
      { id: "bus", group: "g", leg: 0, mode: "bus", capacity: 6 },
      { id: "train", group: "g", leg: 1, mode: "rail", capacity: 14 },
    ],
    solution: [{ type: "place", tile: "track", cell: "2,0" }],
  });
  const s = createState(m);
  place(s, "road", "2,0");
  assert.equal(stats(s).networkReady, false);
  returnToTray(s, "road");
  place(s, "track", "2,0");
  assert.equal(stats(s).networkReady, true);
  assert.equal(finish(s).stars, 3);
  assert.ok(s.people.every((p) => p.boardings === 2));
  returnToTray(s, "track");
  assert.equal(stats(s).networkReady, false);
});

test("local clinic must remain on its designated plot after rescue", () => {
  const m = fixture({
    cells: [cell(0), cell(1, 0, { servicePlot: true }), cell(2)],
    tiles: [tile("clinic", null, "clinic")],
    groups: [
      {
        id: "g",
        origin: "0,0",
        destination: "1,0",
        count: 2,
        label: "local",
        local: true,
      },
    ],
    fleet: [],
    solution: [{ type: "place", tile: "clinic", cell: "1,0" }],
  });
  const s = createState(m);
  assert.equal(stats(s).networkReady, false);
  place(s, "clinic", "1,0");
  assert.equal(finish(s).stars, 3);
  returnToTray(s, "clinic");
  assert.equal(stats(s).completed, true);
  assert.equal(stats(s).networkReady, false);
  assert.equal(stats(s).compact, false);
});

test("a triggered scheduled group prevents completion and later remains in replay capacity demand", () => {
  const m = fixture({ induced: { after: 20, count: 6, group: "g" } });
  m.tiles[1].kind = "wide";
  const s = createState(m);
  place(s, "road", "1,0");
  tick(s, 5);
  assert.equal(stats(s).arrived, 2);
  assert.equal(stats(s).completed, false);
  assert.equal(stats(s).stars, 0);
  assert.equal(stats(s).networkReady, true);
  assert.equal(finish(s).total, 8);
  assert.equal(stats(s).stars, 3);
  assert.equal(s.inducedDone, true);
  assert.equal(returnToTray(s, "road"), true);
  assert.equal(stats(s).networkReady, false);
  assert.equal(stats(s).completed, true);
});

test("the independent four-piece return in13 stays compact below the six-piece reference target", () => {
  const s = createState(getMission(13));
  tick(s, 10);
  assert.equal(stats(s).arrived, 6);
  arrange(s, "road-0,0", "0,1", 1);
  arrange(s, "return-corner", "3,1", 2);
  arrange(s, "road-2,0", "2,1", 2);
  arrange(s, "road-1,0", "1,1", 0);
  finish(s);
  assert.equal(returnToTray(s, "road-0,1"), true);
  assert.equal(stats(s).buildPieces, 4);
  assert.equal(stats(s).buildTarget, 6);
  assert.equal(stats(s).networkReady, true);
  assert.equal(stats(s).stars, 3);
});

test("every reference and known alternative remains three-star eligible after explicit spare cleanup", () => {
  const cases = [
    ...Array.from({ length: 24 }, (_, n) => ({
      id: n + 1,
      actions: getMission(n + 1).solution,
    })),
    { id: 4, actions: ALTERNATE_4 },
    { id: 8, actions: ALTERNATE_8 },
    { id: 21, actions: ALTERNATE_21 },
    { id: 23, actions: ALTERNATE_23 },
  ];
  for (const item of cases) {
    const s = createState(getMission(item.id));
    for (const a of item.actions)
      assert.equal(applyAction(s, a), true, `mission ${item.id}: ${s.message}`);
    finish(s);
    cleanReferenceSpares(s, item.actions);
    const st = stats(s);
    assert.equal(st.networkReady, true, `mission ${item.id}`);
    assert.ok(
      st.buildPieces <= st.buildTarget,
      `mission ${item.id}: ${st.buildPieces}/${st.buildTarget}`,
    );
    assert.equal(st.stars, 3, `mission ${item.id}`);
    if (item.id === 22) {
      assert.ok(s.closed.length > 0);
      assert.equal(
        st.networkReady,
        true,
        "the closure-safe final route remains available",
      );
    }
  }
});

test("review freezes passengers and clocks, suppresses new wide demand, and preserves a previously scheduled wave", () => {
  const m = fixture({ induced: { after: 20, count: 6, group: "g" } });
  m.tiles.push(tile("wide", null, "wide"));
  const s = createState(m);
  useHint(s);
  place(s, "road", "1,0");
  finish(s);
  s.reviewing = true;
  s.mode = "playing";
  s.undo = [];
  const before = structuredClone({
    people: s.people,
    vehicles: s.vehicles,
    time: s.time,
    hints: s.hints,
  });
  tick(s, 60);
  assert.deepEqual(
    { people: s.people, vehicles: s.vehicles, time: s.time, hints: s.hints },
    before,
  );
  assert.equal(place(s, "wide", "1,1"), true);
  assert.equal(
    s.inducedAt,
    null,
    "cleanup does not create a new rescue scenario",
  );
  assert.equal(useHint(s), false);
  assert.equal(s.hints, before.hints);
  assert.equal(undo(s), true);
  assert.equal(
    s.reviewing,
    true,
    "undo does not leave the frozen review phase",
  );
  assert.deepEqual(s.people, before.people);
  assert.equal(stats(s).completed, true);
  const pendingMission = fixture({
    induced: { after: 20, count: 6, group: "g" },
  });
  pendingMission.tiles[1].kind = "wide";
  const pending = createState(pendingMission);
  place(pending, "road", "1,0");
  tick(pending, 5);
  const deadline = pending.inducedAt;
  assert.ok(deadline !== null);
  pending.reviewing = true;
  tick(pending, 60);
  assert.equal(pending.inducedAt, deadline);
  assert.equal(pending.inducedDone, false);
  assert.equal(pending.people.length, 2);
  assert.equal(stats(pending).completed, false);
  pending.reviewing = false;
  assert.equal(finish(pending).total, 8);
});
