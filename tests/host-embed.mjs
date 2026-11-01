// The workbook bridge in a real embed: a localhost parent page with the game in an iframe at ?level=3
// (locked in a fresh save). Checks `ready` → `level-start 3` → one `level-complete` after the board is
// solved with real mouse drags and key presses and the bus is left to run in real time, and that a
// standalone page opens its deep link without errors. Needs the dev server on :5303 (or BASE).
// Usage: node --import tsx tests/host-embed.mjs
import { chromium } from "playwright";
import { createServer } from "node:http";
import { MISSIONS } from "../src/action/campaign.ts";

const GAME = process.env.BASE ?? "http://localhost:5303/";
const LEVEL = 3;
const browser = await chromium.launch({ args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(String(e)));
const parent = createServer((_, res) => {
  res.setHeader("content-type", "text/html");
  res.end(`<body style="margin:0"><script>window.msgs=[];addEventListener('message',e=>msgs.push({origin:e.origin,...e.data}))</script><iframe id="g" src="${GAME}?level=${LEVEL}" style="width:100vw;height:100vh;border:0"></iframe></body>`);
}).listen(4998);
await page.goto("http://localhost:4998/");
const frame = await (await page.waitForSelector("#g")).contentFrame();
const read = async () => JSON.parse(await frame.evaluate(() => window.render_game_to_text()));
await frame.waitForFunction(() => window.render_game_to_text && JSON.parse(window.render_game_to_text()).modelLoaded);
await page.waitForFunction(() => window.msgs.some((m) => m.type === "level-start"));
await page.waitForTimeout(400);
const opened = await read();

// Solve with the game's own controls: drag a piece onto a board cell, focus a piece and press E/Q to turn it.
for (const a of MISSIONS[LEVEL - 1].solution) {
  if (a.type === "rotate") {
    await frame.locator(`[data-tile="${a.tile}"]`).focus();
    for (let n = 0; n < Math.abs(a.turns ?? 1); n++) await page.keyboard.press((a.turns ?? 1) < 0 ? "KeyQ" : "KeyE");
  } else {
    const s = await read();
    const from = s.targets.tiles[a.tile], to = s.targets.cells[a.cell];
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 12 });
    await page.mouse.up();
  }
  await page.waitForTimeout(200);
}
await page.mouse.click(5, 5); // drop any selection so nothing is held while the bus drives
await frame.waitForFunction(() => JSON.parse(window.render_game_to_text()).mode === "won", null, { timeout: 120_000 });
await page.waitForTimeout(300);
const won = await read();
const msgs = await page.evaluate(() => window.msgs);
console.log("opened on level", opened.level, "| won level", won.level, "★" + won.goal.stars);
console.log(msgs.map((m) => `${m.type}${m.level ? " L" + m.level : ""}${m.stars ? " ★" + m.stars : ""}${m.durationMs ? " " + m.durationMs + "ms" : ""}`).join(", "));
const completes = msgs.filter((m) => m.type === "level-complete");
const ok =
  opened.level === LEVEL &&
  msgs.every((m) => m.source === "workbook-game" && m.slug === "rush-hour-israel" && m.version === 1 && m.origin.startsWith("http://localhost")) &&
  msgs[0]?.type === "ready" &&
  msgs[1]?.type === "level-start" && msgs[1].level === LEVEL &&
  completes.length === 1 && completes[0].level === LEVEL && completes[0].stars === won.goal.stars && completes[0].stars >= 1 && completes[0].durationMs > 0;
// standalone: no parent, the deep link still opens and nothing throws
const solo = await (await browser.newContext()).newPage();
solo.on("pageerror", (e) => errs.push(String(e)));
await solo.goto(GAME + "?level=2");
await solo.waitForFunction(() => window.render_game_to_text && JSON.parse(window.render_game_to_text()).modelLoaded);
const soloLevel = JSON.parse(await solo.evaluate(() => window.render_game_to_text())).level;
const pass = ok && soloLevel === 2 && !errs.length;
console.log(pass ? "bridge OK" : "bridge FAILED", errs);
await browser.close();
parent.close();
process.exit(pass ? 0 : 1);
