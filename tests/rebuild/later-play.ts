/** Later mission rule/control regressions. Reference plans navigate non-test missions.
 * Every route/fleet/service action uses real UI input. Only elapsed time uses advanceTime.
 * This is not first-minute discovery or student-learning evidence. */
import { chromium, type Page } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { missions } from "../../src/rebuild/campaign";
const reviewOnly = process.env.REVIEW_ONLY === "24";
const url = process.env.GAME_URL || "http://localhost:5303/rebuild.html",
  dir = reviewOnly
    ? "tests/rebuild/evidence/portrait24"
    : "tests/rebuild/evidence/later";
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.PLAYWRIGHT_EXECUTABLE_PATH || chromium.executablePath(),
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    hasTouch: true,
  }),
  errors: string[] = [],
  records: any[] = [],
  inputs: any[] = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(String(e)));
let navigations = 0;
page.on("framenavigated", (f) => {
  if (f === page.mainFrame()) navigations++;
});
const state = async () =>
  JSON.parse(await page.evaluate(() => window.render_game_to_text()));
async function advance(ms: number) {
  await page.evaluate((ms) => window.advanceTime(ms), ms);
}
async function capture(name: string) {
  await page.waitForTimeout(300);
  records.push({ name, state: await state() });
  await page.screenshot({ path: `${dir}/${name}.png` });
}
async function finish() {
  for (let i = 0; i < 6 && (await state()).mode !== "won"; i++)
    await advance(60000);
  const s = await state();
  assert.equal(s.mode, "won", `${s.level}: ${s.message}`);
  assert.equal(s.goal.arrived, s.goal.total);
  return s;
}
async function line(path: string[], mode: "bus" | "rail" = "bus") {
  const before = await state();
  if (
    before.lines.some(
      (l: any) => l.mode === mode && l.path.join(">") === path.join(">"),
    )
  )
    return;
  if (before.modeTool !== mode) await page.click(`[data-mode="${mode}"]`);
  const nodes = (await state()).nodes;
  const first = nodes.find((n: any) => n.id === path[0]);
  await page.mouse.move(first.screen.x, first.screen.y);
  await page.mouse.down();
  for (const id of path.slice(1)) {
    const n = nodes.find((n: any) => n.id === id);
    await page.mouse.move(n.screen.x, n.screen.y, { steps: 8 });
  }
  await page.mouse.up();
  inputs.push({ level: before.level, type: "drag-line", path, mode });
  const after = await state();
  assert.ok(
    after.lines.some(
      (l: any) => l.mode === mode && l.path.join(">") === path.join(">"),
    ),
    `${before.level} line ${path}: ${after.message}`,
  );
}
async function select(lineId: number) {
  const s = await state(),
    target = s.lines.find((l: any) => l.id === lineId);
  const candidates = target.path
    .slice(1)
    .map((b: string, i: number) => ({ a: target.path[i], b }));
  candidates.sort((x: any, y: any) => {
    const overlap = (edge: any) =>
      s.lines.filter((l: any) =>
        l.path
          .slice(1)
          .some(
            (b: string, i: number) =>
              [l.path[i], b].sort().join() === [edge.a, edge.b].sort().join(),
          ),
      ).length;
    return overlap(x) - overlap(y);
  });
  for (const edge of candidates) {
    const a = s.nodes.find((n: any) => n.id === edge.a),
      b = s.nodes.find((n: any) => n.id === edge.b);
    await page.mouse.click(
      (a.screen.x + b.screen.x) / 2,
      (a.screen.y + b.screen.y) / 2,
    );
    if ((await state()).selectedLine === lineId) return;
  }
  throw new Error(
    `Could not select line ${lineId} through its actual geometry`,
  );
}
async function extra(lineId: number) {
  await select(lineId);
  await page.click("#extra-bus");
  inputs.push({ level: (await state()).level, type: "extra-bus", lineId });
}
let touchNow = false;
async function tapLine(path: string[]) {
  for (const id of path) await page.locator(`[data-node="${id}"]`).tap();
  inputs.push({
    level: (await state()).level,
    type: "portrait-tap-line",
    path,
  });
  assert.ok(
    (await state()).lines.some((l: any) => l.path.join(">") === path.join(">")),
  );
}
async function service(node: string) {
  if (touchNow) {
    await page.locator("#clinic-card").tap();
    await page.locator(`[data-node="${node}"]`).tap();
  } else {
    await page.click("#clinic-card");
    await page.locator(`[data-node="${node}"]`).click();
  }
  inputs.push({ level: (await state()).level, type: "open-service", node });
  assert.ok((await state()).services.includes(node));
}
async function utilities() {
  await page.keyboard.press("KeyP");
  let s = await state();
  assert.equal(s.mode, "paused");
  const clock = s.time;
  await advance(5000);
  assert.equal((await state()).time, clock);
  await page.keyboard.press("Space");
  assert.equal((await state()).mode, "running");
  await page.click("#settings");
  assert.equal((await state()).mode, "paused");
  await page.click("#motion");
  assert.ok(
    await page
      .locator("body")
      .evaluate((el) => el.classList.contains("reduced")),
  );
  await page.click("#motion");
  const sound = await page.locator("#sound").innerText();
  await page.click("#sound");
  assert.notEqual(await page.locator("#sound").innerText(), sound);
  await page.click("#sound");
  await page.click("#fullscreen");
  await page.waitForTimeout(200);
  assert.equal(
    await page.evaluate(() => document.fullscreenElement?.id),
    "app",
  );
  await page.click("#fullscreen");
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => document.fullscreenElement), null);
  await page.click("#resume");
  assert.equal((await state()).mode, "running");
  inputs.push({
    type: "utilities",
    controls: [
      "physicalP/Space",
      "pause time freeze",
      "settings pause",
      "motion",
      "sound",
      "fullscreen enter/exit",
    ],
  });
}
async function reference(id: number, services = true) {
  const m = missions[id - 1];
  for (const p of m.solution) await line(p.path, p.mode);
  for (let i = 0; i < m.solution.length; i++) {
    const plan = m.solution[i],
      l = (await state()).lines.find(
        (l: any) =>
          l.mode === plan.mode && l.path.join(">") === plan.path.join(">"),
      );
    for (let n = 0; n < (m.solutionExtras[i] ?? 0); n++) await extra(l.id);
  }
  if (services) for (const id of m.solutionServices) await service(id);
}
try {
  await page.goto(url);
  await page.locator("[data-node]").first().waitFor();
  await advance(0);
  for (let id = 1; id <= 24; id++) {
    assert.equal((await state()).level, id);
    if (reviewOnly && id < 24) {
      await reference(id);
      await finish();
    } else if (id === 8) {
      await line(["A", "S"]);
      await advance(120000);
      const noisy = await state();
      assert.equal(noisy.goal.arrived, noisy.goal.total);
      assert.notEqual(noisy.mode, "won");
      assert.ok(noisy.goal.noise > 3);
      await page.waitForTimeout(1400);
      assert.match(
        await page.locator("body").innerText(),
        /הרחוב צריך להיות שקט יותר/,
      );
      await capture("08-intrusive-street-blocks-win");
      await select(noisy.lines[0].id);
      await page.click("#redraw");
      inputs.push({ level: id, type: "redraw-quiet-route" });
      await line(["A", "J", "S"]);
      await finish();
      assert.ok((await state()).goal.noise <= 3);
      await capture("08-quiet-route-recovery");
    } else if (id === 13) {
      await advance(4000);
      await utilities();
      assert.ok((await state()).goal.waiting > 0);
      await capture("13-full-buses");
      const old = (await state()).vehicles.length;
      await reference(id);
      assert.ok((await state()).vehicles.length > old);
      await finish();
      await capture("13-extra-departures-win");
      const kept = (await state()).vehicles.length;
      await page.click("#settings");
      await page.click("#restart");
      assert.equal((await state()).time, 0);
      assert.equal((await state()).vehicles.length, kept);
      assert.equal((await state()).goal.arrived, 0);
      await finish();
      inputs.push({ level: id, type: "retained-fleet-ui-retry" });
    } else if (id === 14) {
      await page.locator('[data-node="A"]').tap();
      await page.locator('[data-node="I"]').tap();
      assert.equal((await state()).interaction, "drawing");
      assert.equal((await state()).lines.length, 0);
      await page.locator("#finish-route").tap();
      assert.ok(
        (await state()).lines.some((l: any) => l.path.join(">") === "A>I"),
      );
      inputs.push({ level: id, type: "tap-feeder-finish-at-station" });
      await reference(id);
      await advance(5000);
      assert.ok((await state()).vehicles.some((v: any) => v.mode === "rail"));
      await capture("14-real-transfer");
      const s = await finish();
      assert.ok(s.people.every((p: any) => p.boardings === 2));
      await capture("14-complete-journey-win");
    } else if (id === 20) {
      await advance(60000);
      let s = await state();
      assert.equal(s.goal.arrived, 32);
      assert.equal(s.goal.total, 36);
      assert.notEqual(s.mode, "won");
      await capture("20-small-group-still-waits");
      await service("L");
      s = await finish();
      assert.equal(s.goal.arrived, 36);
      await capture("20-local-access-win");
    } else if (id === 21) {
      let s = await state();
      assert.equal(s.goal.total, 36);
      await select(s.lines[0].id);
      await page.click("#widen");
      inputs.push({ level: id, type: "widen" });
      s = await state();
      assert.equal(s.goal.total, 60);
      assert.ok(s.induced);
      await capture("21-announced-additional-demand");
      await reference(id);
      await finish();
      await capture("21-conditional-group-served");
      await page.click("#settings");
      await page.click("#fresh");
      await page.waitForTimeout(100);
      await reference(id);
      s = await finish();
      assert.equal(s.goal.total, 36);
      assert.equal(s.induced, false);
      await capture("21-transit-alternative");
    } else if (id === 22) {
      await advance(20000);
      const s = await state();
      assert.notEqual(s.mode, "won");
      assert.ok(s.goal.waiting + s.goal.riding > 0);
      await capture("22-closed-crossing");
      await reference(id);
      await finish();
      await capture("22-alternate-access-win");
    } else if (id === 23) {
      for (const path of [
        ["A", "I", "P", "W"],
        ["B", "P", "I", "S"],
      ]) {
        const before = (await state()).lines.length;
        for (let i = 0; i < path.length; i++) {
          await page.locator(`[data-node="${path[i]}"]`).click();
          if (i > 0 && i < path.length - 1) {
            const during = await state();
            assert.equal(
              during.lines.length,
              before,
              "station tap must continue the same line",
            );
            assert.equal(during.interaction, "drawing");
          }
        }
        const after = await state();
        assert.ok(
          after.lines.some((l: any) => l.path.join(">") === path.join(">")),
        );
        inputs.push({ level: id, type: "tap-through-stations", path });
      }
      await capture("23-tap-stations-continuous");
      await finish();
      await capture("23-tap-line-win");
    } else if (id === 24) {
      touchNow = true;
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(200);
      await capture("24-portrait-ready");
      for (const plan of missions[23].solution) await tapLine(plan.path);
      await advance(120000);
      const s = await state();
      assert.equal(s.goal.arrived, 36);
      assert.equal(s.goal.total, 42);
      assert.notEqual(s.mode, "won");
      assert.doesNotMatch(
        await page.locator("body").innerText(),
        /האוטובוס.*ממשיך.*לאסוף/,
        "uncovered community must not be told to wait for a bus",
      );
      await capture("24-unopened-clinic-gap");
      await service("L");
      await finish();
      await capture("24-all-communities-win");
      const banner = await page.locator("#success").boundingBox();
      assert.ok(banner);
      for (const id of ["fleet-card", "clinic-card", "modes"])
        if (await page.locator(`#${id}`).isVisible()) {
          const box = await page.locator(`#${id}`).boundingBox();
          if (box) {
            const overlap =
              Math.max(
                0,
                Math.min(banner.x + banner.width, box.x + box.width) -
                  Math.max(banner.x, box.x),
              ) *
              Math.max(
                0,
                Math.min(banner.y + banner.height, box.y + box.height) -
                  Math.max(banner.y, box.y),
              );
            assert.equal(overlap, 0, `win reward must not overlap ${id}`);
          }
        }
    } else {
      await reference(id);
      await finish();
    }
    inputs.push({ type: "mission-won", level: id });
    if (id < 24) {
      await page.click("#next");
      await page.waitForTimeout(120);
    }
  }
  assert.equal(navigations, 1, "hot reload invalidates this control run");
  await page.reload();
  await page.locator("[data-node]").first().waitFor();
  assert.equal((await state()).level, 24);
  await page.click("#journey");
  assert.match(await page.locator('[data-level="24"]').innerText(), /✦/);
  inputs.push({ type: "earned-progress-persists-after-reload" });
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        ok: true,
        won: inputs.filter((a) => a.type === "mission-won").map((a) => a.level),
        cases: records.map((r) => r.name),
        errors,
      },
      null,
      2,
    ),
  );
} finally {
  writeFileSync(
    `${dir}/later-record.json`,
    JSON.stringify({ reviewOnly, records, inputs, errors }, null, 2),
  );
  await browser.close();
}
