import { chromium, type Page } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
// Deliberately imports no campaign, model, authored solution or hint routine.
// Observe first, inspect captures, record an informed expert plan, then replay it.
const phase = process.env.PILOT_PHASE ?? "observe";
const output = path.resolve(
  "tests/action/polish-evidence/pilots",
  process.env.PILOT_RUN_NAME ?? "",
);
await mkdir(output, { recursive: true });
const ids = (process.env.PILOT_IDS ?? "4,8,13,24").split(",").map(Number);
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.PLAYWRIGHT_EXECUTABLE_PATH || chromium.executablePath(),
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});
const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  }),
  page = await context.newPage();
const errors: string[] = [],
  hmr: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
  if (/\[vite\].*(hot updated|page reload)/i.test(m.text())) hmr.push(m.text());
});
const read = (p: Page) =>
  p.evaluate(() => JSON.parse(window.render_game_to_text()));
async function capture(label: string) {
  await page.screenshot({ path: path.join(output, label + ".png") });
  await writeFile(
    path.join(output, label + ".json"),
    JSON.stringify(await read(page), null, 2),
  );
}
async function ready(id: number) {
  await page.goto(
    `${process.env.GAME_URL ?? "http://localhost:5303/action.html"}?level=${id}`,
  );
  await page.waitForFunction(
    () =>
      typeof window.render_game_to_text === "function" &&
      JSON.parse(window.render_game_to_text()).modelLoaded,
  );
  await page.waitForTimeout(200);
  const s = await read(page);
  assert.equal(s.version, 4);
  assert.equal(s.level, id);
  assert.equal(s.hints, 0);
}
async function arrange(tile: string, cell: string, orientation: number) {
  let s = await read(page),
    t = s.tiles.find((t: any) => t.id === tile);
  assert.ok(t);
  let delta = (orientation - t.rotation + 4) % 4;
  if (delta) {
    await page.locator(`[data-tile="${tile}"]`).focus();
    if (delta === 3) {
      await page.keyboard.press("KeyQ");
    } else for (let n = 0; n < delta; n++) await page.keyboard.press("KeyE");
    await page.waitForTimeout(100);
  }
  s = await read(page);
  t = s.tiles.find((t: any) => t.id === tile);
  if (t.cell !== cell) {
    const a = s.targets.tiles[tile],
      b = s.targets.cells[cell];
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(180);
  }
  s = await read(page);
  assert.equal(s.tiles.find((t: any) => t.id === tile).cell, cell, s.message);
  assert.equal(
    s.tiles.find((t: any) => t.id === tile).rotation,
    orientation,
    s.message,
  );
}
let report: any;
try {
  report = {
    method:
      "Informed expert review after observing initial rendered boards. QA proposed these layout families earlier; this is not naive or fully blind. No authored solution lists, campaign imports or hints. Planning is logged before input; later travel may be accelerated.",
    phase,
    records: [],
    errors,
    hmr,
  };
  const plans =
    phase === "play"
      ? JSON.parse(
          await readFile(
            process.env.PILOT_PLAN_FILE ?? "tests/action/pilot-plans.json",
            "utf8",
          ),
        )
      : null;
  for (const id of ids) {
    await ready(id);
    await capture(`initial-${id}`);
    if (phase === "observe") continue;
    const plan = plans.find((p: any) => p.id === id);
    assert.ok(plan, `log a plan for ${id} before play`);
    await writeFile(
      path.join(output, `logged-plan-${id}.json`),
      JSON.stringify(
        { loggedBeforeInput: new Date().toISOString(), ...plan },
        null,
        2,
      ),
    );
    console.log(`pilot ${id}: plan logged before input`);
    if (plan.waitArrived) {
      await page.waitForFunction(
        (n) => JSON.parse(window.render_game_to_text()).goal.arrived >= n,
        plan.waitArrived,
        { timeout: 20000 },
      );
      await capture(`initial-first-load-${id}`);
    }
    for (const a of plan.moves) await arrange(a.tile, a.cell, a.rotation);
    await page.evaluate(() => window.advanceTime(1200));
    await page.waitForTimeout(80);
    await capture(`first-plan-${id}-moving`);
    for (let n = 0; n < 100 && (await read(page)).mode !== "won"; n++) {
      await page.evaluate(() => window.advanceTime(1000));
      await page.waitForTimeout(25);
    }
    const s = await read(page);
    await capture(`first-plan-${id}-${s.mode === "won" ? "won" : "failed"}`);
    report.records.push({
      id,
      intent: plan.intent,
      mode: s.mode,
      goal: s.goal,
      hints: s.hints,
      people: s.people.map((p: any) => ({
        id: p.id,
        arrived: p.arrived,
        boardings: p.boardings,
      })),
    });
    await writeFile(
      path.join(output, `${phase}-record.json`),
      JSON.stringify(report, null, 2),
    );
    assert.equal(s.hints, 0);
    console.log(`pilot ${id}: ${s.mode} ${s.goal.arrived}/${s.goal.total}`);
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(hmr, []);
  await writeFile(
    path.join(output, `${phase}-record.json`),
    JSON.stringify(report, null, 2),
  );
} catch (e) {
  if (report) {
    report.failure = String(e);
    await writeFile(
      path.join(output, `${phase}-record.json`),
      JSON.stringify(report, null, 2),
    );
  }
  await capture(`failed-${phase}`);
  throw e;
} finally {
  await context.close();
  await browser.close();
}
