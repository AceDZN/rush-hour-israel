import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const out = process.env.STATIC_EVIDENCE_DIR || "docs/compact-stars/actual/production";
mkdirSync(out, { recursive: true });
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
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
await page.goto(process.env.STATIC_URL || "http://localhost:4303/?level=1");
await page.waitForFunction(
  () =>
    window.render_game_to_text &&
    JSON.parse(window.render_game_to_text()).modelLoaded,
);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1300);
const loaded = JSON.parse(
  await page.evaluate(() => window.render_game_to_text()),
);
assert.equal(loaded.version, 4);
const resources = await page.evaluate(() =>
  performance
    .getEntriesByType("resource")
    .map((r) => ({
      name: r.name.split("/").pop(),
      decoded: r.decodedBodySize,
      transferred: r.transferSize,
    })),
);
await context.setOffline(true);
const a = loaded.targets.tiles["first-road"],
  b = loaded.targets.cells["2,1"];
await page.mouse.move(a.x, a.y);
await page.mouse.down();
await page.mouse.move(b.x, b.y, { steps: 16 });
await page.mouse.up();
await page.evaluate(() => window.advanceTime(8000));
await page.waitForTimeout(250);
const final = JSON.parse(
  await page.evaluate(() => window.render_game_to_text()),
);
assert.equal(final.mode, "won");
assert.equal(final.goal.arrived, 6);
assert.equal(final.goal.stars, 3);
assert.equal(final.goal.completed, true);
assert.equal(final.goal.compact, true);
assert.equal(final.goal.unaided, true);
assert.deepEqual(errors, []);
await page.screenshot({ path: out + "/static-offline-win.png" });
writeFileSync(
  out + "/static-check.json",
  JSON.stringify(
    {
      method:
        "Production static build, model/fonts loaded, network then disabled; actual pointer drag; elapsed-time hook only after action.",
      version: final.version,
      mode: final.mode,
      goal: final.goal,
      modelLoaded: final.modelLoaded,
      hostMeasuredFpsBeforeOffline: loaded.fps,
      resources,
      decodedResources: resources.reduce((a, r) => a + r.decoded, 0),
      errors,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    ok: true,
    version: final.version,
    arrived: 6,
    decoded: resources.reduce((a, r) => a + r.decoded, 0),
    errors,
  }),
);
await browser.close();
