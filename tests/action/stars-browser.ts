/** Score the final working build; only real UI input and elapsed simulation. */
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium, type Page } from "playwright";
import { getMission } from "../../src/action/campaign";
const out = "tests/action/compact-evidence/focused";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const errors: string[] = [];
const record: any = { method: "Actual pointer/keyboard/touch controls; read-only hook and elapsed time only. Final24 uses witness actions through UI, never injected state.", cases: [], errors };
const read = (p: Page) => p.evaluate(() => JSON.parse(window.render_game_to_text()));
async function ready(p: Page, level = 1) {
  p.on("pageerror", e => errors.push(e.message));
  p.on("console", m => { if (m.type() === "error") errors.push(m.text()); if (/hot updated|page reload/.test(m.text())) errors.push("HMR invalidated observation"); });
  await p.goto("http://localhost:5303/?level=" + level);
  await p.waitForFunction(() => window.render_game_to_text && JSON.parse(window.render_game_to_text()).modelLoaded);
  await p.waitForTimeout(250);
}
async function drag(p: Page, id: string, cell: string) {
  await p.waitForTimeout(220);
  const s = await read(p), a = s.targets.tiles[id], b = s.targets.cells[cell];
  await p.mouse.move(a.x, a.y); await p.mouse.down();
  await p.mouse.move(b.x, b.y, { steps: 12 }); await p.mouse.up();
  await p.waitForTimeout(120);
  assert.equal((await read(p)).tiles.find((t: any) => t.id === id).cell, cell);
}
async function turn(p: Page, id: string, n: number) {
  await p.locator(`[data-tile="${id}"]`).focus();
  for (let i = 0; i < Math.abs(n); i++) await p.keyboard.press(n < 0 ? "KeyQ" : "KeyE");
}
async function tray(p: Page, id: string) {
  await p.locator(`[data-tile="${id}"]`).focus();
  await p.click("#to-tray");
  assert.equal((await read(p)).tiles.find((t: any) => t.id === id).cell, null);
}
async function finish(p: Page, stars: number) {
  for (let n = 0; n < 160 && (await read(p)).mode !== "won"; n++)
    await p.evaluate(() => window.advanceTime(1000));
  await p.waitForTimeout(500);
  const s = await read(p);
  assert.equal(s.mode, "won"); assert.equal(s.goal.stars, stars);
  assert.equal(await p.locator("#stars").textContent(), "★".repeat(stars) + "☆".repeat(3 - stars));
  return s;
}
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const p = await desktop.newPage(); await ready(p);
assert.equal((await read(p)).goal.stars, 0);
assert.match(await p.locator("#bonus-goals").innerText(), /בנייה קומפקטית/);
assert.match(await p.locator("#hint-note").innerText(), /מוותר על/);
await turn(p, "first-road", 9);
await p.evaluate(() => window.advanceTime(60000));
for (let i = 0; i < 3; i++) { await drag(p, "first-road", "2,1"); await tray(p, "first-road"); }
await turn(p, "first-road", -1);
await drag(p, "first-road", "2,1");
const explored = await finish(p, 3);
assert(explored.goal.placements >= 4); assert(explored.goal.time > 60);
assert.equal(explored.goal.buildPieces, 1); assert.equal(explored.goal.buildTarget, 1);
await p.screenshot({ path: out + "/desktop-explored-gold.png" });
record.cases.push({ case: "Trial placements, nine rotations and long wait do not penalize identical compact unassisted final build", goal: explored.goal });
await p.keyboard.press("KeyR");
await turn(p, "first-road", 1);
await p.click("#hint");
assert.equal((await read(p)).hints, 1);
await p.keyboard.press("KeyZ");
assert.equal((await read(p)).hints, 1, "Undo cannot erase solution help");
await drag(p, "first-road", "2,1");
const hinted = await finish(p, 2);
assert.equal(hinted.goal.compact, true); assert.equal(hinted.goal.unaided, false);
await p.screenshot({ path: out + "/desktop-hinted-silver.png" });
await p.click("#replay");
assert.equal((await read(p)).hints, 0);
await drag(p, "first-road", "2,1"); await finish(p, 3);
record.cases.push({ case: "Actual help forfeits only unaided bonus, survives Undo; explicit replay resets help and earns gold", goal: hinted.goal });
await p.click("#menu");
await p.screenshot({ path: out + "/desktop-rules.png" });
await desktop.close();

const final = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const f = await final.newPage(); await ready(f, 24);
await f.click("#hint");
for (const a of getMission(24).solution) {
  if (a.type === "rotate") await turn(f, a.tile, a.turns ?? 1);
  else await drag(f, a.tile, a.cell);
}
const bronze = await finish(f, 1);
assert.equal(bronze.goal.buildPieces, 10); assert.equal(bronze.goal.buildTarget, 8);
const frozen = { time: bronze.goal.time, people: bronze.people };
await f.screenshot({ path: out + "/24-bronze-before-tidy.png" });
await f.click("#tidy");
assert.equal((await read(f)).tidying, true);
await f.evaluate(() => window.advanceTime(60000)); await f.waitForTimeout(500);
assert.equal((await read(f)).goal.time, frozen.time);
assert.deepEqual((await read(f)).people, frozen.people);
for (const id of ["spare-24-0", "spare-24-1"]) await tray(f, id);
assert.equal((await read(f)).goal.compact, true);
await f.screenshot({ path: out + "/24-tidy-compact.png" });
const bridge = (await read(f)).tiles.find((t: any) => t.id === "last-bridge");
await tray(f, "last-bridge");
assert.equal((await read(f)).goal.networkReady, false);
assert.equal((await read(f)).goal.compact, false, "removing required road cannot earn compact bonus");
await f.click("#done-tidying"); await finish(f, 1);
assert.match(await f.locator("#rating-text").innerText(), /החיבור אינו שלם/);
await f.screenshot({ path: out + "/24-dismantled-no-bonus.png" });
await f.click("#tidy"); await drag(f, "last-bridge", bridge.cell);
await f.click("#done-tidying");
const silver = await finish(f, 2);
assert.equal(silver.hints, 1); assert.equal(silver.goal.buildPieces, 8);
assert.deepEqual(silver.people, frozen.people);
assert.equal(await f.evaluate(() => JSON.parse(localStorage.getItem("rush-hour-road-puzzle-v6")!).stars[24]), 2);
await f.screenshot({ path: out + "/24-cleaned-hinted-silver.png" });
record.cases.push({ case: "Rescue plus hinted bloated build earns1; frozen cleanup earns2; dismantling disqualifies compactness; repaired valid footprint restores2 and persists", before: bronze.goal, after: silver.goal });
await final.close();

const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const q = await phone.newPage(); await ready(q);
await q.screenshot({ path: out + "/phone-goals.png" });
let s = await read(q);
await q.touchscreen.tap(s.targets.tiles["first-road"].x, s.targets.tiles["first-road"].y);
for (let i = 0; i < 6; i++) await q.tap("#rotate");
s = await read(q); await q.touchscreen.tap(s.targets.cells["2,1"].x, s.targets.cells["2,1"].y);
await finish(q, 3);
const banner = await q.locator("#win").boundingBox();
assert(banner && banner.x >= 0 && banner.x + banner.width <= 390 && banner.y + banner.height <= 844);
await q.screenshot({ path: out + "/phone-gold.png" });
record.cases.push({ case: "Genuine touch freely rotates and finishes compact without help; goal strip and reward visible", banner });
await phone.close();

const profile = await browser.newContext();
const old = { unlocked: 9, stars: { 1: 1, 2: 2, 8: 3 }, muted: true, reduced: true };
await profile.addInitScript((old) => localStorage.setItem("rush-hour-road-puzzle-v5", JSON.stringify(old)), old);
const m = await profile.newPage(); await ready(m);
const saved = await m.evaluate(() => ({ current: JSON.parse(localStorage.getItem("rush-hour-road-puzzle-v6")!), old: JSON.parse(localStorage.getItem("rush-hour-road-puzzle-v5")!) }));
assert.deepEqual(saved.old, old); assert.deepEqual(saved.current.stars, {});
assert.equal(saved.current.unlocked, 9); assert.equal(saved.current.muted, true); assert.equal(saved.current.reduced, true);
assert.equal(saved.current.scoring, "compact-unaided");
record.cases.push({ case: "V6 bonus scores are fresh; v5 scores untouched and access/settings preserved", saved });
await profile.close();
assert.deepEqual(errors, []); await browser.close();
writeFileSync(out + "/record.json", JSON.stringify(record, null, 2));
console.log(JSON.stringify({ ok: true, cases: record.cases.length, errors }));
