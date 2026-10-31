import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { levels } from "../src/levels";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.PLAYWRIGHT_EXECUTABLE_PATH || chromium.executablePath(),
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 1,
});
const errors: string[] = [],
  records: any[] = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
const state = async () =>
  JSON.parse(await page.evaluate(() => window.render_game_to_text()));
const advance = async (ms: number) =>
  page.evaluate((ms) => window.advanceTime(ms), ms);
const tap = async (selector: string) => {
  await page.locator(selector).tap({ timeout: 5000 });
};
async function record(name: string) {
  const s = await state();
  records.push({ name, state: s });
  await page.screenshot({ path: `docs/playtest/${name}.png` });
  writeFileSync(
    "docs/playtest/mobile-record.json",
    JSON.stringify({ records, errors }, null, 2),
  );
  return s;
}
async function plan(id: number) {
  for (const a of levels[id - 1].baseline) {
    const s = await state();
    if (a.type === "stop" && s.nodes.find((n: any) => n.id === a.node)?.stop)
      continue;
    if (a.type === "link") {
      await tap(`[data-tool="${a.mode}"]`);
      await tap(`[data-node="${a.a}"]`);
      await tap(`[data-node="${a.b}"]`);
    } else if (
      a.type === "stop" ||
      a.type === "interchange" ||
      a.type === "service"
    ) {
      await tap(`[data-tool="${a.type}"]`);
      await tap(`[data-node="${a.node}"]`);
    } else if (a.type === "upgrade") {
      await tap('[data-tool="upgrade"]');
      await tap(`[data-node="${a.a}"]`);
      await tap(`[data-node="${a.b}"]`);
    }
  }
}
try {
  await page.goto("http://localhost:5303");
  await page.waitForFunction(
    () => typeof window.render_game_to_text === "function",
  );
  await tap("#welcome .primary");
  await advance(0);
  await record("mobile01-planning");
  await plan(1);
  await tap("#run");
  await advance(120000);
  assert.equal((await record("mobile01-win")).mode, "won");
  await tap("#result-map");
  await tap("#campaign-button");
  await tap('[data-level="24"]');
  await record("mobile24-planning");
  await plan(24);
  await tap("#run");
  await advance(120000);
  assert.equal((await record("mobile24-win")).mode, "won");
  console.log(JSON.stringify({ ok: true, errors }));
} finally {
  writeFileSync(
    "docs/playtest/mobile-record.json",
    JSON.stringify({ records, errors }, null, 2),
  );
  await browser.close();
}
