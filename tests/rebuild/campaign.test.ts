import test from "node:test";
import assert from "node:assert/strict";
import { missions } from "../../src/rebuild/campaign";
import {
  createGame,
  drawLine,
  addBus,
  openService,
  tick,
  stats,
} from "../../src/rebuild/model";

test("rebuilt campaign has 24 distinct authored spatial or operational decisions", () => {
  assert.equal(missions.length, 24);
  assert.deepEqual(
    missions.map((m) => m.id),
    Array.from({ length: 24 }, (_, i) => i + 1),
  );
  const signatures = missions.map((m) =>
    JSON.stringify({
      nodes: m.nodes.map((n) => [n.x, n.z, n.h, n.kind]),
      corridors: m.corridors,
      demand: m.demand,
      noise: m.noiseLimit,
      footprint: m.footprintLimit,
      initial: m.initialLines,
      services: m.serviceSites,
    }),
  );
  assert.equal(new Set(signatures).size, 24);
});
for (const mission of missions) {
  test(`rebuilt mission ${mission.id} oracle serves every individual without a deadline gate`, () => {
    const s = createGame(mission);
    for (const node of mission.solutionServices)
      assert.equal(openService(s, node), true, `local service ${node}`);
    for (let i = 0; i < mission.solution.length; i++) {
      const plan = mission.solution[i];
      let line = s.lines.find(
        (l) => l.mode === plan.mode && l.path.join(">") === plan.path.join(">"),
      );
      if (!line) {
        assert.equal(
          drawLine(s, plan.path, plan.mode),
          true,
          `draw ${plan.path.join(">")}: ${s.message}`,
        );
        line = s.lines.at(-1)!;
      }
      for (let n = 0; n < (mission.solutionExtras[i] ?? 0); n++)
        assert.equal(addBus(s, line.id), true, `extra fleet ${i}`);
    }
    const expected = mission.demand.reduce((n, d) => n + d.count, 0);
    for (let i = 0; i < 6000 && s.mode !== "won"; i++) {
      tick(s, 0.05);
      const st = stats(s);
      assert.equal(s.people.length, expected, "authored individual identities");
      assert.equal(
        st.pending + st.waiting + st.riding + st.walking + st.arrived,
        expected,
      );
      for (const v of s.vehicles) assert.ok(v.passengers.length <= v.capacity);
    }
    const st = stats(s);
    assert.equal(
      s.mode,
      "won",
      JSON.stringify({
        id: mission.id,
        message: s.message,
        clock: s.clock,
        budget: s.budget,
        stats: st,
        vehicles: s.vehicles,
      }),
    );
    assert.equal(st.arrived, expected);
    assert.ok(st.groups.every((g) => g.arrived === g.total));
  });
}

test("mission 23 also supports a distinct feeder/rail network", () => {
  const s = createGame(missions[22]);
  for (const [path, mode] of [
    [["A", "I"], "bus"],
    [["B", "P"], "bus"],
    [["I", "P"], "rail"],
    [["I", "S"], "bus"],
    [["P", "W"], "bus"],
  ] as const)
    assert.equal(drawLine(s, [...path], mode), true, s.message);
  for (let i = 0; i < 6000 && s.mode !== "won"; i++) tick(s, 0.05);
  assert.equal(s.mode, "won", JSON.stringify(stats(s)));
  assert.equal(stats(s).arrived, stats(s).total);
});

test("mission 18 demonstrates that farther can arrive sooner and a fast alternative reduces time", () => {
  const m = missions[17];
  function simulate(fast: boolean) {
    const s = createGame(m);
    if (!fast) assert.equal(drawLine(s, ["B", "J", "S"]), true);
    else
      for (let i = 0; i < m.solution.length; i++) {
        const plan = m.solution[i];
        let line = s.lines.find(
          (l) => l.path.join() === plan.path.join() && l.mode === plan.mode,
        );
        if (!line) {
          assert.equal(drawLine(s, plan.path, plan.mode), true);
          line = s.lines.at(-1)!;
        }
        for (let j = 0; j < (m.solutionExtras[i] ?? 0); j++) addBus(s, line.id);
      }
    for (let i = 0; i < 6000 && s.mode !== "won"; i++) tick(s, 0.05);
    assert.equal(s.mode, "won");
    return s;
  }
  const near = simulate(false),
    fast = simulate(true);
  assert.ok(fast.completedAt! < near.completedAt!);
  const a = m.nodes.find((n) => n.id === "A")!,
    b = m.nodes.find((n) => n.id === "B")!,
    dest = m.nodes.find((n) => n.id === "S")!;
  assert.ok(
    Math.hypot(b.x - dest.x, b.z - dest.z) >
      Math.hypot(a.x - dest.x, a.z - dest.z),
  );
  const mean = (id: string) => {
    const people = fast.people.filter((p) => p.origin === id);
    return (
      people.reduce((sum, p) => sum + p.arrivedAt! - p.release, 0) /
      people.length
    );
  };
  assert.ok(
    mean("B") < mean("A"),
    "farther group has faster actual door-to-service access",
  );
});
