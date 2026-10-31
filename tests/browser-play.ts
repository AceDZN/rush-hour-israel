import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import assert from "node:assert/strict";
import { levels } from "../src/levels";
import type { PlanAction } from "../src/types";
const out = "docs/playtest";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.PLAYWRIGHT_EXECUTABLE_PATH || chromium.executablePath(),
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors: string[] = [];
const records: any[] = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(String(e)));
const state = async () =>
  JSON.parse(await page.evaluate(() => window.render_game_to_text()));
const step = async (ms: number) => {
  await page.evaluate((ms) => window.advanceTime(ms), ms);
};
async function record(name: string, shot = true) {
  const s = await state();
  records.push({ name, state: s });
  if (shot) await page.screenshot({ path: `${out}/${name}.png` });
  writeFileSync(
    `${out}/browser-record.json`,
    JSON.stringify({ records, errors }, null, 2),
  );
  return s;
}
async function level(id: number) {
  if (await page.locator("#result").evaluate((d: any) => d.open))
    await page.click("#result-map");
  await page.click("#campaign-button");
  await page.click(`[data-level="${id}"]`);
  await step(0);
}
async function tool(name: string) {
  await page.click(`[data-tool="${name}"]`);
}
async function node(id: string) {
  await page.click(`[data-node="${id}"]`);
}
async function action(a: PlanAction) {
  const s = await state();
  if (a.type === "stop" && s.nodes.find((n: any) => n.id === a.node)?.stop)
    return;
  if (a.type === "link") {
    await tool(a.mode);
    await node(a.a);
    await node(a.b);
  } else if (
    a.type === "stop" ||
    a.type === "service" ||
    a.type === "interchange"
  ) {
    await tool(a.type);
    await node(a.node);
  } else if (a.type === "upgrade") {
    await tool("upgrade");
    await node(a.a);
    await node(a.b);
  } else if (a.type === "schedule")
    throw new Error("schedule action requires inspector UI coverage");
}
async function plan(id: number) {
  for (const a of levels[id - 1].baseline) await action(a);
}
async function run() {
  await page.click("#run");
}
async function complete(name: string) {
  await step(120000);
  const s = await record(name);
  assert.equal(s.mode, "won", `${name}: ${s.message}`);
  return s;
}
try {
  await page.goto("http://localhost:5303", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => typeof window.render_game_to_text === "function",
  );
  await page.waitForTimeout(1500);
  await page.locator("#welcome .primary").click();
  await step(0);
  assert.equal((await state()).modelLoaded, true);
  await record("level01-planning");
  await plan(1);
  await run();
  await step(5000);
  const moving = await record("level01-moving");
  assert.ok(moving.vehicles.length > 0);
  await complete("level01-win");
  // Retry and pause use physical keys and the public deterministic clock.
  await page.keyboard.press("KeyR");
  assert.equal((await state()).mode, "planning");
  await page.keyboard.press("Space");
  await step(1000);
  await page.keyboard.press("Escape");
  const paused = await state();
  await step(5000);
  assert.equal((await state()).time, paused.time);
  await page.keyboard.press("Space");
  await complete("level01-retry-win");
  // Bottleneck starts with finite traffic. Add actual bus routes while the same wave runs.
  await level(2);
  await run();
  await step(6000);
  const jam = await record("level02-overload");
  assert.ok(jam.metrics.waiting > 10);
  await plan(2);
  await complete("level02-recovered");
  // Wrong stop plan fails; retry preserves it, then useful coverage is added through controls.
  await level(3);
  for (const a of levels[2].nearMiss) await action(a);
  await run();
  await step(120000);
  const badStop = await record("level03-poor-stop");
  assert.equal(badStop.mode, "lost");
  assert.equal(badStop.metrics.arrived, 0);
  await page.click("#result-retry");
  await plan(3);
  await run();
  await complete("level03-retry-win");
  // A grade trap must reject the shortcut, with no charge, before the contour solution.
  await level(10);
  const before = await state();
  await tool("road");
  await node("A");
  await node("S");
  const rejected = await record("level10-grade-rejected");
  assert.equal(rejected.links.length, 0);
  assert.equal(rejected.budget, before.budget);
  assert.match(rejected.message, /שיפוע|תלול/);
  await plan(10);
  await run();
  await step(15000);
  await record("level10-relief-moving");
  await complete("level10-win");
  // Full feeder/trunk with no interchange/upgrades is a plausible timing miss, followed by repair.
  await level(14);
  for (const a of levels[13].baseline.filter(
    (a) => a.type === "link" || a.type === "stop",
  ))
    await action(a);
  await run();
  await step(120000);
  const transferMiss = await record("level14-transfer-miss");
  assert.equal(transferMiss.mode, "lost");
  await page.click("#result-retry");
  for (const a of levels[13].baseline.filter(
    (a) => a.type !== "link" && a.type !== "stop",
  ))
    await action(a);
  await run();
  await step(12000);
  const transferMove = await record("level14-transfer-moving");
  assert.ok(transferMove.links.some((l: any) => l.mode === "rail"));
  await complete("level14-win");
  await level(18);
  for (const a of levels[17].nearMiss) await action(a);
  await run();
  await step(120000);
  const near = await record("level18-near-slow");
  assert.equal(near.mode, "lost");
  await page.click("#result-retry");
  await plan(18);
  await run();
  await complete("level18-fast-alternative");
  await level(20);
  for (const a of levels[19].nearMiss) await action(a);
  await run();
  await step(120000);
  const equity = await record("level20-majority-only");
  assert.equal(equity.mode, "lost");
  assert.equal(
    equity.metrics.groups.find((g: any) => g.origin === "B").timely,
    0,
  );
  assert.ok(equity.metrics.timely / equity.metrics.expected > 0.8);
  await page.click("#result-retry");
  for (const a of levels[19].baseline.filter((a) => a.type !== "upgrade"))
    await action(a);
  await run();
  await complete("level20-equitable-win");
  await level(24);
  await plan(24);
  await run();
  await step(18000);
  await record("level24-moving");
  await complete("level24-final-win");
  // Persistence is checked after a real final victory, through a fresh navigation.
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => typeof window.render_game_to_text === "function",
  );
  await step(0);
  assert.equal((await state()).level, 24);
  await page.click("#campaign-button");
  assert.ok(
    (await page.locator('[data-level="24"] em').textContent())?.includes("★"),
  );
  await page.locator("#campaign .close").click();
  await record("campaign-persisted");
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        ok: true,
        cases: records.map((r) => ({
          name: r.name,
          mode: r.state.mode,
          level: r.state.level,
          timely: r.state.metrics.timely,
          expected: r.state.metrics.expected,
        })),
        errors,
      },
      null,
      2,
    ),
  );
} finally {
  writeFileSync(
    `${out}/browser-record.json`,
    JSON.stringify({ records, errors }, null, 2),
  );
  await browser.close();
}
