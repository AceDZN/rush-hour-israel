import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { levels } from "../src/levels";
import type { PlanAction } from "../src/types";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.PLAYWRIGHT_EXECUTABLE_PATH || chromium.executablePath(),
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
const errors: string[] = [],
  checks: any[] = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("response", (r) => {
  if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`);
});
const state = async () =>
  JSON.parse(await page.evaluate(() => window.render_game_to_text()));
const advance = async (ms: number) =>
  page.evaluate((ms) => window.advanceTime(ms), ms);
const click = async (s: string) => page.click(s, { timeout: 7000 });
const check = (name: string, value: any) => checks.push({ name, value });
async function level(id: number) {
  if (await page.locator("#result").evaluate((d: any) => d.open))
    await click("#result-map");
  await click("#campaign-button");
  await click(`[data-level="${id}"]`);
  await advance(0);
}
async function action(a: PlanAction) {
  const s = await state();
  if (a.type === "stop" && s.nodes.find((n: any) => n.id === a.node)?.stop)
    return;
  if (a.type === "link") {
    await click(`[data-tool="${a.mode}"]`);
    await click(`[data-node="${a.a}"]`);
    await click(`[data-node="${a.b}"]`);
  } else if (
    a.type === "stop" ||
    a.type === "interchange" ||
    a.type === "service"
  ) {
    await click(`[data-tool="${a.type}"]`);
    await click(`[data-node="${a.node}"]`);
  } else if (a.type === "upgrade") {
    const matches = s.links.filter(
      (l: any) => (l.a === a.a && l.b === a.b) || (l.b === a.a && l.a === a.b),
    );
    if (matches.length > 1 && a.mode === "rail") {
      const na = s.nodes.find((n: any) => n.id === a.a),
        nb = s.nodes.find((n: any) => n.id === a.b);
      await page.mouse.click(
        (na.screen.x + nb.screen.x) / 2,
        (na.screen.y + nb.screen.y) / 2,
      );
      await click(`[data-edge-mode="${a.mode}"]`);
      await click("#edge-upgrade");
    } else {
      await click('[data-tool="upgrade"]');
      await click(`[data-node="${a.a}"]`);
      await click(`[data-node="${a.b}"]`);
    }
  }
}
try {
  await page.goto("http://localhost:5303");
  await page.waitForFunction(
    () => typeof window.render_game_to_text === "function",
  );
  await click("#welcome .primary");
  await advance(0);
  const before = await state();
  await click("#rotate-right");
  await page.waitForTimeout(60);
  const rotated = await state();
  assert.notEqual(rotated.nodes[0].screen.x, before.nodes[0].screen.x);
  await click("#view-reset");
  await page.waitForTimeout(60);
  assert.equal((await state()).nodes[0].screen.x, before.nodes[0].screen.x);
  check("camera rotate/reset", true);
  await click("#mute");
  assert.ok(
    await page.locator("#mute").evaluate((e) => e.classList.contains("on")),
  );
  await click("#mute");
  check("mute toggle", true);
  await click("#motion");
  assert.ok(
    await page.locator("body").evaluate((e) => e.classList.contains("reduced")),
  );
  await click("#motion");
  check("reduced motion", true);
  await click("#hint");
  assert.equal((await state()).hintUsed, true);
  check("hint is marked", true);
  await click("#help");
  assert.ok(await page.locator("#help-dialog").evaluate((d: any) => d.open));
  await click('[data-close="help-dialog"]');
  check("help open/close", true);
  await page.keyboard.press("KeyF");
  await page.waitForTimeout(200);
  assert.equal(
    await page.evaluate(() => document.fullscreenElement?.id),
    "app",
  );
  await page.keyboard.press("KeyF");
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => document.fullscreenElement), null);
  check("fullscreen F enter/exit", true);
  for (const a of levels[0].baseline) await action(a);
  await page.keyboard.press("Space");
  await advance(1000);
  await click("#hint");
  assert.equal((await state()).mode, "paused");
  check("hint pauses active pressure", true);
  await click("#run");
  await click("#help");
  assert.equal((await state()).mode, "paused");
  const paused = (await state()).time;
  await advance(3000);
  assert.equal((await state()).time, paused);
  await click('[data-close="help-dialog"]');
  await click("#run");
  check("dialog pauses pressure", true);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  assert.equal((await state()).mode, "paused");
  check(
    "blur event listener pauses (native headed focus checked separately)",
    true,
  );
  await page.keyboard.press("KeyR");
  const reset = await state();
  assert.equal(reset.time, 0);
  assert.equal(reset.metrics.pending, reset.metrics.expected);
  assert.equal(reset.vehicles.length, 0);
  check("keyboard retry resets demand", true);
  await level(1);
  await page.locator('[data-node="A"]').dragTo(page.locator('[data-node="J"]'));
  assert.ok(
    (await state()).links.some(
      (l: any) => (l.a === "A" && l.b === "J") || (l.a === "J" && l.b === "A"),
    ),
  );
  check("label pointer drag builds a route", true);
  await level(14);
  for (const a of levels[13].baseline) await action(a);
  await click('[data-tool="upgrade"]');
  await click('[data-node="I"]');
  await click('[data-node="T"]');
  const first = (await state()).links.find(
    (l: any) => l.mode === "rail",
  ).nextDeparture;
  await click("#edge-phase");
  const next = (await state()).links.find(
    (l: any) => l.mode === "rail",
  ).nextDeparture;
  assert.notEqual(first, next);
  check("phase inspector changes departure", { first, next });
  await level(16);
  for (const a of levels[15].baseline) await action(a);
  const mixed = (await state()).links.filter(
    (l: any) => (l.a === "I" && l.b === "S") || (l.a === "S" && l.b === "I"),
  );
  assert.equal(mixed.find((l: any) => l.mode === "rail").level, 2);
  assert.equal(mixed.find((l: any) => l.mode === "bus").level, 1);
  check("parallel mode inspector permits explicit rail selection", mixed);
  const finalState = await state(),
    ni = finalState.nodes.find((n: any) => n.id === "I"),
    ns = finalState.nodes.find((n: any) => n.id === "S");
  await page.mouse.click(
    (ni.screen.x + ns.screen.x) / 2,
    (ni.screen.y + ns.screen.y) / 2,
  );
  await click('[data-edge-mode="rail"]');
  await page.screenshot({ path: "docs/playtest/utility-inspector.png" });
  await page.setViewportSize({ width: 1024, height: 640 });
  await page.waitForTimeout(150);
  await page.screenshot({ path: "docs/playtest/resize-1024.png" });
  assert.equal((await state()).level, 16);
  check("resize retains state", true);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ ok: true, checks, errors }, null, 2));
} finally {
  writeFileSync(
    "docs/playtest/utilities-record.json",
    JSON.stringify({ checks, errors }, null, 2),
  );
  await browser.close();
}
