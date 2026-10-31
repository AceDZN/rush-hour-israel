/** Actual controls reproduce exploration that the old hidden move budget penalized. */
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium, type Page } from "playwright";

const out = "tests/action/polish-evidence/stars";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});
const errors: string[] = [];
const record: any = { method: "Real keyboard/pointer/touch controls, read-only state; time hook only for waiting. Isolated profiles, no live user-tab changes.", cases: [], errors };
const read = (p: Page) => p.evaluate(() => JSON.parse(window.render_game_to_text()));
async function ready(p: Page, level = 1) {
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await p.goto("http://localhost:5303/?level=" + level);
  await p.waitForFunction(() => window.render_game_to_text && JSON.parse(window.render_game_to_text()).modelLoaded);
  await p.waitForTimeout(250);
}
async function drag(p: Page, tile: string, cell: string) {
  await p.waitForTimeout(220);
  const s = await read(p), a = s.targets.tiles[tile], b = s.targets.cells[cell];
  await p.mouse.move(a.x, a.y);
  await p.mouse.down();
  await p.mouse.move(b.x, b.y, { steps: 12 });
  await p.mouse.up();
  await p.waitForTimeout(100);
  assert.equal((await read(p)).tiles.find((t: any) => t.id === tile).cell, cell);
}
async function finish(p: Page, expected = 3) {
  await p.evaluate(() => window.advanceTime(15000));
  await p.waitForTimeout(700); // Let visual snap/turn easing settle after accelerated travel.
  const s = await read(p);
  assert.equal(s.mode, "won");
  assert.equal(s.goal.stars, expected);
  assert.equal(await p.locator("#stars").textContent(), "★".repeat(expected) + "☆".repeat(3 - expected));
  assert.match(await p.locator("#rating-text").innerText(), /3 כוכבים עד 1/);
  return s;
}
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const p = await desktop.newPage();
await ready(p);
assert.equal((await read(p)).goal.placements, 0);
assert.match(await p.locator("#rescue-progress").innerText(), /0 הזזות · יעד 1/);
await p.locator('[data-tile="first-road"]').focus();
for (let i = 0; i < 9; i++) await p.keyboard.press("KeyE");
await p.evaluate(() => window.advanceTime(60000));
await drag(p, "first-road", "2,1");
await p.evaluate(() => window.advanceTime(3000));
assert.equal((await read(p)).goal.arrived, 0);
assert.equal((await read(p)).goal.placements, 1);
await p.click("#hint");
await p.click("#rotate-back");
const explored = await finish(p);
assert(explored.goal.moves > 5);
assert(explored.goal.time > 60);
assert.equal(explored.hints, 1);
await p.screenshot({ path: out + "/desktop-experimented-win.png" });
record.cases.push({ case: "Nine trial rotations, wrong orientation, long wait and hint still earn 3 on rescue", state: explored });
await p.click("#undo");
assert.equal((await read(p)).mode, "playing");
assert.equal((await read(p)).goal.placements, 1);
await p.keyboard.press("KeyR");
assert.equal((await read(p)).goal.placements, 0);
await drag(p, "first-road", "2,1");
const direct = await finish(p);
assert.equal(direct.goal.stars, explored.goal.stars);
record.cases.push({ case: "Undo/retry restore placement counter; direct and rotation-explored rescues score identically", moves: direct.goal.moves, stars: direct.goal.stars });
await p.click("#menu");
assert.match(await p.locator("#star-rules").innerText(), /סיבובים, החזרה למגש, רמזים וזמן חופשיים/);
await p.screenshot({ path: out + "/desktop-rules.png" });
await p.click(".close-dialog");
await p.keyboard.press("KeyR");
await p.locator('[data-tile="first-road"]').focus();
await p.keyboard.press("KeyE");
await drag(p, "first-road", "2,1");
await p.locator('[data-tile="first-road"]').focus();
await p.click("#to-tray");
assert.equal((await read(p)).goal.placements, 1);
await p.locator('[data-tile="first-road"]').focus();
await p.keyboard.press("KeyQ");
await drag(p, "first-road", "2,1");
const silver = await finish(p, 2);
assert.equal(silver.goal.placements, 2);
assert.equal(await p.locator("#replay").isVisible(), true);
await p.screenshot({ path: out + "/desktop-two-star-reason.png" });
await p.click("#replay");
assert.equal((await read(p)).goal.placements, 0);
await p.locator('[data-tile="first-road"]').focus();
await p.keyboard.press("KeyE");
for (let i = 0; i < 3; i++) {
  await drag(p, "first-road", "2,1");
  await p.locator('[data-tile="first-road"]').focus();
  await p.click("#to-tray");
}
await p.locator('[data-tile="first-road"]').focus();
await p.keyboard.press("KeyQ");
await drag(p, "first-road", "2,1");
const bronze = await finish(p, 1);
assert.equal(bronze.goal.placements, 4);
record.cases.push({ case: "Identical final rescued network earns 2 at two placements and 1 at four; free tray returns; visible reason and replay reset", silver: silver.goal, bronze: bronze.goal });
await desktop.close();

const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const q = await phone.newPage();
await ready(q);
const sampleBounds = await q.locator("#challenge-sample").boundingBox();
const progressBounds = await q.locator("#rescue-progress").boundingBox();
assert(sampleBounds && progressBounds);
assert(progressBounds.x + progressBounds.width < sampleBounds.x, "phone sample link and star rule do not overlap");
await q.screenshot({ path: out + "/phone-ready.png" });
let s = await read(q);
await q.touchscreen.tap(s.targets.tiles["first-road"].x, s.targets.tiles["first-road"].y);
for (let i = 0; i < 6; i++) await q.tap("#rotate");
s = await read(q);
await q.touchscreen.tap(s.targets.cells["2,1"].x, s.targets.cells["2,1"].y);
const touchWin = await finish(q);
const banner = await q.locator("#win").boundingBox();
assert(banner && banner.x >= 0 && banner.x + banner.width <= 390 && banner.y + banner.height <= 844);
await q.screenshot({ path: out + "/phone-experimented-win.png" });
record.cases.push({ case: "Genuine touch selection, six visible rotations, tap-to-place, 3-star win with in-bounds banner", moves: touchWin.goal.moves, stars: touchWin.goal.stars, banner });
await phone.close();

const rescore = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const u = await rescore.newPage();
await ready(u);
await u.locator('[data-tile="first-road"]').focus();
await u.keyboard.press("KeyE");
for (let i = 0; i < 3; i++) {
  await drag(u, "first-road", "2,1");
  await u.locator('[data-tile="first-road"]').focus();
  await u.click("#to-tray");
}
await u.locator('[data-tile="first-road"]').focus();
await u.keyboard.press("KeyQ");
await drag(u, "first-road", "2,1");
await finish(u, 1);
const savedRating = () => u.evaluate(() => JSON.parse(localStorage.getItem("rush-hour-road-puzzle-v5")!).stars[1]);
assert.equal(await savedRating(), 1);
let undoCount = 0;
while ((await read(u)).goal.placements > 0 && undoCount < 30) {
  if (undoCount % 2) await u.keyboard.press("KeyZ");
  else await u.click("#undo");
  undoCount++;
}
assert.equal((await read(u)).goal.placements, 0);
await u.locator('[data-tile="first-road"]').focus();
if ((await read(u)).tiles.find((t: any) => t.id === "first-road").rotation % 2)
  await u.keyboard.press("KeyQ");
await drag(u, "first-road", "2,1");
await finish(u, 3);
assert.equal(await savedRating(), 3);
await u.screenshot({ path: out + "/desktop-undo-upgraded-gold.png" });
record.cases.push({ case: "Earn bronze, rewind using both Undo button and Z, improve to gold without retry; displayed and saved best update", before: 1, after: 3, undoCount });
await rescore.close();

const profile = await browser.newContext();
await profile.addInitScript(() => localStorage.setItem("rush-hour-road-puzzle-v4", JSON.stringify({ unlocked: 9, stars: { 1: 1, 2: 2, 5: 1, 8: 3 }, muted: true, reduced: true })));
const r = await profile.newPage();
await ready(r);
const migrated = JSON.parse(await r.evaluate(() => localStorage.getItem("rush-hour-road-puzzle-v5")) as string);
assert.equal(migrated.unlocked, 9);
assert.equal(migrated.muted, true);
assert.equal(migrated.reduced, true);
assert.deepEqual(migrated.stars, {});
const previous = JSON.parse(await r.evaluate(() => localStorage.getItem("rush-hour-road-puzzle-v4")) as string);
assert.deepEqual(previous.stars, { 1: 1, 2: 2, 5: 1, 8: 3 });
assert.equal(migrated.stars[9], undefined);
assert.equal(migrated.scoring, "placements");
record.cases.push({ case: "Placement scores use a fresh profile; v4 scores untouched, unlocks/settings preserved, no unearned new score", migrated });
await profile.close();
assert.deepEqual(errors, []);
await browser.close();
writeFileSync(out + "/record.json", JSON.stringify(record, null, 2));
console.log(JSON.stringify({ ok: true, cases: record.cases.length, errors }));
