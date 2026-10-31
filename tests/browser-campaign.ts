import { chromium } from "playwright";
import { levels } from "../src/levels";
import { writeFile, mkdir } from "node:fs/promises";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.PLAYWRIGHT_EXECUTABLE_PATH || chromium.executablePath(),
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
const state = async () =>
  JSON.parse(await page.evaluate(() => window.render_game_to_text()));
await page.goto("http://localhost:5303");
await page.locator("[data-close=welcome].primary").click();
await page.evaluate(() => window.advanceTime(0));
await mkdir("docs/playtest", { recursive: true });
const results = [];
for (const level of levels) {
  await page.locator("#campaign-button").click();
  await page.locator(`[data-level="${level.id}"]`).click();
  await page.evaluate(() => window.advanceTime(0));
  const trail: any[] = [];
  for (const a of level.baseline) {
    let before = await state();
    if (a.type === "link") {
      await page.locator(`[data-tool="${a.mode}"]`).click();
      await page.locator(`[data-node="${a.a}"]`).click();
      await page.locator(`[data-node="${a.b}"]`).click();
      const after = await state();
      if (
        !after.links.some(
          (l: any) =>
            l.mode === a.mode &&
            [l.a, l.b].sort().join() === [a.a, a.b].sort().join(),
        )
      )
        throw new Error(
          `missing level${level.id} ${JSON.stringify(a)}: ${after.message}`,
        );
    } else if (
      a.type === "stop" ||
      a.type === "service" ||
      a.type === "interchange"
    ) {
      if (
        a.type === "stop" &&
        before.nodes.find((n: any) => n.id === a.node).stop
      )
        continue;
      await page.locator(`[data-tool="${a.type}"]`).click();
      await page.locator(`[data-node="${a.node}"]`).click();
    } else if (a.type === "upgrade") {
      const parallels = before.links.filter(
        (l: any) => [l.a, l.b].sort().join() === [a.a, a.b].sort().join(),
      );
      if (parallels.length > 1) {
        const na = before.nodes.find((n: any) => n.id === a.a),
          nb = before.nodes.find((n: any) => n.id === a.b);
        await page.mouse.click(
          (na.screen.x + nb.screen.x) / 2,
          (na.screen.y + nb.screen.y) / 2,
        );
        await page.locator(`[data-edge-mode="${a.mode}"]`).click();
        await page.locator("#edge-upgrade").click();
      } else {
        await page.locator("[data-tool=upgrade]").click();
        await page.locator(`[data-node="${a.a}"]`).click();
        await page.locator(`[data-node="${a.b}"]`).click();
      }
      await page.locator(".inspector-close").click();
    }
    trail.push(a);
  }
  await page.locator("#run").click();
  await page.evaluate(() => window.advanceTime(10000));
  if ([1, 13, 16, 24].includes(level.id))
    await page.screenshot({
      path: `docs/playtest/campaign-${level.id}-moving.png`,
    });
  await page.evaluate(() => window.advanceTime(90000));
  const after = await state();
  results.push({
    level: level.id,
    mode: after.mode,
    metrics: after.metrics,
    budget: after.budget,
    trail,
  });
  console.log(
    level.id,
    after.mode,
    `${after.metrics.timely}/${after.metrics.expected}`,
    "worst",
    after.metrics.worst,
  );
  if (after.mode !== "won")
    throw new Error(`level${level.id} failed UI baseline ${after.message}`);
  await page.locator("#result-map").click();
}
await writeFile(
  "docs/playtest/all-24-browser.json",
  JSON.stringify(
    {
      method:
        "Real tool/node UI inputs; explicit time advancement only; no injected plan or win",
      viewport: { width: 1440, height: 900 },
      results,
      errors,
    },
    null,
    2,
  ),
);
await browser.close();
if (errors.length) throw new Error(JSON.stringify(errors));
