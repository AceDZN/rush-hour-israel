/** Replays an expert-inspected interaction. No campaign import, plan injection or time hook. */
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium, type Page, type CDPSession } from "playwright";
const output = resolve(
  process.env.EVIDENCE_DIR ?? "tests/action/evidence/first-minute",
);
mkdirSync(output, { recursive: true });
const url = process.env.GAME_URL ?? "http://localhost:5303/action.html";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.PLAYWRIGHT_EXECUTABLE_PATH || chromium.executablePath(),
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});
const errors: string[] = [];
let hotReload = false;
const read = async (p: Page) =>
  JSON.parse(await p.evaluate(() => window.render_game_to_text()));
function observe(p: Page) {
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
    if (/hot updated|page reload/.test(m.text())) hotReload = true;
  });
}
async function ready(p: Page) {
  await p.goto(url + (url.includes("?") ? "&" : "?") + "level=1");
  await p.waitForFunction(
    () =>
      window.render_game_to_text &&
      JSON.parse(window.render_game_to_text()).modelLoaded,
  );
  await p.waitForTimeout(300);
}
async function mouseDrag(p: Page, tile: string, cell: string) {
  const s = await read(p),
    a = s.targets.tiles[tile],
    b = s.targets.cells[cell];
  await p.mouse.move(a.x, a.y);
  await p.mouse.down();
  await p.mouse.move(b.x, b.y, { steps: 16 });
  await p.waitForTimeout(160);
  const held = await read(p);
  assert.equal(held.held, tile);
  assert.equal(held.tiles.find((t: any) => t.id === tile).cell, null);
  await p.screenshot({ path: output + "/desktop-lift.png" });
  await p.mouse.up();
  await p.waitForTimeout(190);
}
async function touchDrag(p: Page, cdp: CDPSession, tile: string, cell: string) {
  const s = await read(p),
    a = s.targets.tiles[tile],
    b = s.targets.cells[cell];
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: a.x, y: a.y, radiusX: 4, radiusY: 4, id: 1 }],
  });
  for (let i = 1; i <= 12; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: a.x + ((b.x - a.x) * i) / 12,
          y: a.y + ((b.y - a.y) * i) / 12,
          radiusX: 4,
          radiusY: 4,
          id: 1,
        },
      ],
    });
  await p.waitForTimeout(120);
  assert.equal((await read(p)).held, tile);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await p.waitForTimeout(200);
}
async function win(p: Page) {
  await p.waitForFunction(
    () => JSON.parse(window.render_game_to_text()).mode === "won",
    undefined,
    { timeout: 20000 },
  );
  await p.waitForTimeout(180);
  const s = await read(p);
  assert.equal(s.goal.arrived, s.goal.total);
  assert(s.people.every((x: any) => x.arrived));
  assert(s.people.every((x: any) => x.boardings === 1));
  return s;
}
const desktop = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const p = await desktop.newPage();
observe(p);
await ready(p);
const record: any = {
  method:
    "Expert-inspected control replay; no authored solution import, plan/progress injection, hints or advanceTime. Timings are actual elapsed expert interaction, not naive student discovery.",
  desktop: {},
  portrait: {},
};
await p.screenshot({ path: output + "/desktop-ready.png" });
const start = Date.now();
await mouseDrag(p, "first-road", "2,1");
record.desktop.first = await win(p);
record.desktop.firstMs = Date.now() - start;
await p.screenshot({ path: output + "/desktop-first-win.png" });
await p.click("#undo");
const rewound = await read(p);
assert.equal(rewound.mode, "playing");
assert.equal(rewound.tiles.find((t: any) => t.id === "first-road").cell, null);
assert.equal(rewound.goal.moves, 0);
await p.keyboard.press("KeyR");
await mouseDrag(p, "first-road", "2,1");
await win(p);
await p.click("#next");
await p.waitForTimeout(200);
await mouseDrag(p, "turn", "2,2");
await p.waitForTimeout(700);
let s = await read(p);
assert.equal(s.mode, "playing");
assert.equal(s.goal.arrived, 0);
await p.screenshot({ path: output + "/desktop-wrong-turn.png" });
const turn = s.targets.tiles.turn;
await p.mouse.click(turn.x, turn.y);
record.desktop.second = await win(p);
record.desktop.twoMorningsIncludingUndoMs = Date.now() - start;
await p.screenshot({ path: output + "/desktop-second-win.png" });
assert.equal(
  JSON.parse(
    await p.evaluate(() => localStorage.getItem("rush-hour-road-puzzle-v3")),
  ).unlocked,
  3,
);
await desktop.close();
const phone = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});
const q = await phone.newPage();
observe(q);
const cdp = await phone.newCDPSession(q);
await ready(q);
await q.screenshot({ path: output + "/portrait-ready.png" });
const phoneStart = Date.now();
await touchDrag(q, cdp, "first-road", "2,1");
record.portrait.first = await win(q);
await q.screenshot({ path: output + "/portrait-first-win.png" });
await q.tap("#next");
await q.waitForTimeout(230);
await touchDrag(q, cdp, "turn", "2,2");
await q.waitForTimeout(600);
s = await read(q);
assert.equal(s.goal.arrived, 0);
const pos = s.targets.tiles.turn;
await q.touchscreen.tap(pos.x, pos.y);
record.portrait.second = await win(q);
record.portrait.twoMorningsMs = Date.now() - phoneStart;
await q.screenshot({ path: output + "/portrait-second-win.png" });
await phone.close();
assert.deepEqual(errors, []);
assert.equal(
  hotReload,
  false,
  "Source changed during observation; rerun frozen source",
);
record.errors = errors;
record.hotReload = hotReload;
writeFileSync(output + "/record.json", JSON.stringify(record, null, 2));
await browser.close();
console.log(
  JSON.stringify({
    ok: true,
    desktopFirstMs: record.desktop.firstMs,
    desktopTwoWithUndoMs: record.desktop.twoMorningsIncludingUndoMs,
    portraitTwoMs: record.portrait.twoMorningsMs,
    errors,
  }),
);
