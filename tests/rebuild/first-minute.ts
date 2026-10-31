/**
 * Normal-control replay of the visible first-minute inspection.
 * No campaign/solution import, plan injection, progress injection, or advanceTime.
 * This deterministic replay is not a naive-player comprehension study.
 */
import { chromium, type Page } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const url = process.env.GAME_URL || "http://localhost:5303/rebuild.html";
const dir = "tests/rebuild/evidence/final";
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.PLAYWRIGHT_EXECUTABLE_PATH || chromium.executablePath(),
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});
const errors: string[] = [],
  record: any[] = [];
const state = async (p: Page) =>
  JSON.parse(await p.evaluate(() => window.render_game_to_text()));
async function capture(p: Page, name: string) {
  await p.waitForTimeout(300);
  const s = await state(p);
  record.push({ name, state: s });
  await p.screenshot({ path: `${dir}/${name}.png` });
  return s;
}
async function win(p: Page) {
  await p.waitForFunction(
    () => JSON.parse(window.render_game_to_text()).mode === "won",
    {},
    { timeout: 60000 },
  );
  return state(p);
}
async function dragViaValley(p: Page) {
  const origin = p.getByRole("button", { name: "הבתים", exact: true }),
    school = p.getByRole("button", { name: "בית הספר", exact: true });
  const a = await origin.boundingBox(),
    b = await school.boundingBox();
  assert.ok(a && b);
  await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await p.mouse.down();
  const valleyHandle = p.getByRole("button", { name: "העמק", exact: true });
  await valleyHandle.waitFor({ state: "visible" });
  const valley = await valleyHandle.boundingBox();
  assert.ok(valley, "drawing reveals the valley bend affordance");
  await p.mouse.move(
    valley.x + valley.width / 2,
    valley.y + valley.height / 2,
    { steps: 20 },
  );
  await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 20 });
  await p.mouse.up();
}
async function instrument(p: Page) {
  p.on("pageerror", (e) => errors.push(String(e)));
  p.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
}
try {
  const desktop = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  await instrument(desktop);
  let navigations = 0;
  desktop.on("framenavigated", (f) => {
    if (f === desktop.mainFrame()) navigations++;
  });
  await desktop.goto(url);
  await desktop.getByRole("button", { name: "הבתים", exact: true }).waitFor();
  // First look and action use only rendered instructions/place labels.
  record.push({
    name: "first-visible-instruction",
    text: await desktop.locator("body").innerText(),
  });
  await desktop.screenshot({ path: `${dir}/desktop-ready.png` });
  const start = Date.now();
  await desktop
    .getByRole("button", { name: "הבתים", exact: true })
    .dragTo(desktop.getByRole("button", { name: "בית הספר", exact: true }));
  const first = await capture(desktop, "desktop-first-drag");
  assert.equal(first.mode, "running");
  assert.equal(first.lines.length, 1);
  const busID = first.vehicles[0].id;
  await desktop.waitForFunction(
    () => JSON.parse(window.render_game_to_text()).goal.arrived > 0,
    {},
    { timeout: 12000 },
  );
  record.push({ name: "first-arrival-wall-ms", value: Date.now() - start });
  await capture(desktop, "desktop-first-arrival");
  const firstWin = await win(desktop);
  record.push({ name: "first-win-wall-ms", value: Date.now() - start });
  assert.equal(firstWin.goal.arrived, 8);
  assert.equal(firstWin.vehicles[0].id, busID);
  assert.ok(firstWin.people.every((p: any) => p.boardings === 1));
  assert.ok(Date.now() - start < 60000);
  await capture(desktop, "desktop-first-win");
  await desktop.click("#next");
  await desktop
    .getByRole("button", { name: "הבתים", exact: true })
    .dragTo(desktop.getByRole("button", { name: "בית הספר", exact: true }));
  const mistake = await capture(desktop, "desktop-slope-mistake");
  assert.equal(mistake.lines.length, 0);
  assert.match(mistake.message, /תלולה|עלייה/);
  await dragViaValley(desktop);
  const repaired = await capture(desktop, "desktop-continuous-bend");
  assert.equal(
    repaired.lines[0].path.length,
    3,
    "the complete stroke includes its middle bend",
  );
  await win(desktop);
  await capture(desktop, "desktop-second-win");
  record.push({ name: "both-mornings-wall-ms", value: Date.now() - start });
  await desktop.click("#undo");
  const undone = await capture(desktop, "desktop-undo");
  assert.equal(undone.lines.length, 0);
  assert.equal(undone.goal.arrived, 0);
  assert.equal(undone.mode, "ready");
  assert.equal(
    navigations,
    1,
    "source reload invalidates the observation; rerun frozen",
  );
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  await instrument(mobile);
  await mobile.goto(url);
  await mobile.getByRole("button", { name: "הבתים", exact: true }).waitFor();
  await capture(mobile, "portrait-ready");
  await mobile.getByRole("button", { name: "הבתים", exact: true }).tap();
  await mobile.getByRole("button", { name: "בית הספר", exact: true }).tap();
  assert.equal((await state(mobile)).mode, "running");
  await win(mobile);
  await capture(mobile, "portrait-first-win");
  await mobile.click("#next");
  await mobile.getByRole("button", { name: "הבתים", exact: true }).tap();
  await mobile.getByRole("button", { name: "העמק", exact: true }).tap();
  await mobile.getByRole("button", { name: "בית הספר", exact: true }).tap();
  const touchBend = await capture(mobile, "portrait-tap-bend");
  assert.equal(touchBend.lines[0].path.length, 3);
  await win(mobile);
  await capture(mobile, "portrait-second-win");
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      { ok: true, wall: record.filter((r) => r.value !== undefined), errors },
      null,
      2,
    ),
  );
} finally {
  writeFileSync(
    `${dir}/first-minute-record.json`,
    JSON.stringify({ url, record, errors }, null, 2),
  );
  await browser.close();
}
