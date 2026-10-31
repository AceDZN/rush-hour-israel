import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, type Page, type BrowserContext } from "playwright";
import { MISSIONS } from "../../src/action/campaign";
import type { Action } from "../../src/action/types";

// Inputs use the shipped pointer/keyboard/touch handlers. Only the read-only
// text hook and elapsed-time hook are evaluated; no state/action/win injection.
const out = path.resolve("tests/action/evidence");
await mkdir(out, { recursive: true });
const url = process.env.GAME_URL || "http://localhost:5303/action.html";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.PLAYWRIGHT_EXECUTABLE_PATH || chromium.executablePath(),
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});
let diagnosticPage: Page | undefined;
const errors: string[] = [];
let guardingCampaign = false;
const hmr = { pageReloads: 0, messages: [] as string[], interrupted: false };
const results: any = {
  url,
  started: new Date().toISOString(),
  campaign: [],
  cases: [],
  errors,
  hmr,
};
const instrument = (page: Page) => {
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("load", () => {
    if (guardingCampaign) hmr.pageReloads++;
  });
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
    if (/\[vite\].*(hot updated|page reload)/i.test(m.text()))
      hmr.messages.push(m.text());
  });
};
async function read(page: Page): Promise<any> {
  return page.evaluate(() => JSON.parse(window.render_game_to_text()));
}
async function ready(page: Page, id: number) {
  await page.goto(`${url}?level=${id}`);
  await page.waitForFunction(
    () =>
      typeof window.render_game_to_text === "function" &&
      JSON.parse(window.render_game_to_text()).modelLoaded,
  );
  await page.waitForTimeout(250);
  const s = await read(page);
  assert.equal(s.version, 3);
  assert.equal(s.level, id);
  assert.equal(s.hints, 0);
}
async function step(page: Page, ms: number) {
  await page.evaluate((ms) => window.advanceTime(ms), ms);
  await page.waitForTimeout(35);
}
async function win(page: Page) {
  for (let n = 0; n < 180; n++) {
    const s = await read(page);
    if (s.mode === "won") {
      assert.equal(s.goal.arrived, s.goal.total);
      assert.ok(s.goal.groups.every((g: any) => g.arrived === g.total));
      return s;
    }
    await step(page, 1000);
  }
  throw Error("stalled: " + JSON.stringify(await read(page)));
}
async function capture(page: Page, name: string) {
  await page.screenshot({ path: path.join(out, name + ".png") });
  await writeFile(
    path.join(out, name + ".json"),
    JSON.stringify(await read(page), null, 2),
  );
}
async function focusRotate(page: Page, id: string, turns: number) {
  await page.locator(`[data-tile="${id}"]`).focus();
  for (let n = 0; n < ((turns % 4) + 4) % 4; n++)
    await page.keyboard.press("KeyE");
  await page.waitForTimeout(120);
}
async function drag(page: Page, id: string, cell: string) {
  const s = await read(page),
    a = s.targets.tiles[id],
    b = s.targets.cells[cell];
  assert.ok(a && b, `${id}→${cell} target exists`);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(180);
  return read(page);
}
async function apply(page: Page, list: Action[]) {
  for (const a of list) {
    if (a.type === "rotate") await focusRotate(page, a.tile, a.turns ?? 1);
    else {
      const s = await drag(page, a.tile, a.cell);
      assert.ok(
        s.tiles.some((t: any) => t.id === a.tile),
        `expected tile ${a.tile} vanished during mission ${s.level}; possible HMR reset`,
      );
      assert.equal(
        s.tiles.find((t: any) => t.id === a.tile).cell,
        a.cell,
        `drag ${a.tile}→${a.cell}: ${s.message}`,
      );
    }
  }
}
async function touchDrag(
  page: Page,
  context: BrowserContext,
  id: string,
  cell: string,
) {
  const s = await read(page),
    a = s.targets.tiles[id],
    b = s.targets.cells[cell],
    cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: a.x, y: a.y }],
  });
  for (let n = 1; n <= 12; n++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: a.x + ((b.x - a.x) * n) / 12, y: a.y + ((b.y - a.y) * n) / 12 },
      ],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await cdp.detach();
  await page.waitForTimeout(200);
  const done = await read(page);
  assert.equal(
    done.tiles.find((t: any) => t.id === id).cell,
    cell,
    done.message,
  );
}
async function touchRotate(page: Page, id: string, turns: number) {
  await page.locator(`[data-tile="${id}"]`).focus();
  for (let n = 0; n < turns; n++) await page.locator("#rotate").tap();
  await page.waitForTimeout(100);
}

try {
  const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    }),
    page = await context.newPage();
  instrument(page);
  diagnosticPage = page;
  if (process.env.REVIEW_ONLY === "14") {
    await ready(page, 14);
    await capture(page, "rail-14-ready");
    await apply(page, MISSIONS[13].solution);
    let stationWait = false;
    for (let n = 0; n < 500 && (await read(page)).mode !== "won"; n++) {
      await step(page, 100);
      const s = await read(page);
      if (
        !stationWait &&
        s.people.some((p: any) => p.cell === "1,2" && p.leg === 1 && !p.vehicle)
      ) {
        stationWait = true;
        await capture(page, "rail-14-station-wait");
      }
    }
    const s = await read(page);
    assert.equal(s.mode, "won");
    assert.ok(stationWait);
    assert.ok(s.people.every((p: any) => p.boardings === 2));
    await capture(page, "rail-14-arrived");
    results.cases.push({
      case: "14 corrected berth / station wait / rail arrival",
      stationWait,
      arrived: s.goal.arrived,
      twoBoardings: true,
    });
  }
  if (!process.env.REVIEW_ONLY) {
    await ready(page, 1);
    guardingCampaign = true;
    for (const m of MISSIONS) {
      assert.equal((await read(page)).level, m.id);
      await apply(page, m.solution);
      if ([1, 11, 14, 18, 24].includes(m.id)) {
        await step(page, 900);
        await capture(page, `campaign-${String(m.id).padStart(2, "0")}-moving`);
      }
      const s = await win(page);
      results.campaign.push({
        id: m.id,
        arrived: s.goal.arrived,
        total: s.goal.total,
        time: s.goal.time,
        moves: s.goal.moves,
        hints: s.hints,
        modelLoaded: s.modelLoaded,
      });
      assert.equal(s.hints, 0);
      console.log(`campaign ${m.id}: ${s.goal.arrived}/${s.goal.total}`);
      if (m.id < 24) {
        await page.locator("#next").click();
        await page.waitForTimeout(150);
      }
    }
    guardingCampaign = false;
    assert.equal(
      hmr.pageReloads,
      0,
      "no page reload interrupts the earned campaign",
    );
    const progress = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("rush-hour-road-puzzle-v3")!),
    );
    assert.equal(progress.unlocked, 24);
    assert.equal(Object.keys(progress.stars).length, 24);
    results.persistence = progress;
    await ready(page, 2);
    await drag(page, "turn", "2,2");
    await step(page, 5000);
    let s = await read(page);
    assert.equal(s.goal.arrived, 0);
    assert.ok(s.vehicles.some((v: any) => v.status === "waiting"));
    await capture(page, "wrong-orientation-2");
    const waitingIDs = s.people.map((p: any) => p.id);
    await page.locator("#hint").click();
    s = await read(page);
    assert.equal(s.hints, 1);
    assert.equal(s.mode, "playing");
    assert.equal(
      await page
        .locator("#settings")
        .evaluate((d: HTMLDialogElement) => d.open),
      false,
    );
    assert.deepEqual(
      s.people.map((p: any) => p.id),
      waitingIDs,
    );
    assert.equal(s.goal.total, 6);
    await capture(page, "small-hint-2");
    await page.locator('[data-tile="turn"]').focus();
    await page.locator("#rotate").click();
    s = await win(page);
    results.cases.push({
      case: "2 wrong orientation / small nonmodal hint / rotate recovery",
      arrived: s.goal.arrived,
    });
    await ready(page, 11);
    const moves = (await read(page)).goal.moves;
    await drag(page, "ordinary-road", "2,2");
    s = await read(page);
    assert.equal(s.tiles.find((t: any) => t.id === "ordinary-road").cell, null);
    assert.equal(s.goal.moves, moves);
    assert.match(s.message, /גשר/);
    await capture(page, "water-rejected-11");
    await apply(page, MISSIONS[10].solution);
    await win(page);
    results.cases.push({
      case: "11 ordinary road rejected on river / bridge repair",
      movesUnchanged: true,
    });
    await ready(page, 13);
    for (let n = 0; n < 20 && (await read(page)).goal.arrived < 6; n++)
      await step(page, 1000);
    await step(page, 8000);
    s = await read(page);
    assert.equal(s.goal.arrived, 6);
    assert.equal(s.goal.waiting, 8);
    assert.equal(s.mode, "playing");
    await capture(page, "return-loop-13");
    await apply(page, MISSIONS[12].solution);
    s = await win(page);
    assert.ok(s.people.every((p: any) => p.boardings === 1));
    results.cases.push({
      case: "13 first6 / return-loop repair / all14",
      trips: s.vehicles[0].trips,
    });
    await ready(page, 14);
    await apply(page, MISSIONS[13].solution);
    let stationWait = false;
    for (let n = 0; n < 500 && (await read(page)).mode !== "won"; n++) {
      await step(page, 100);
      s = await read(page);
      if (
        s.people.some((p: any) => p.leg === 1 && p.cell === "1,2" && !p.vehicle)
      ) {
        stationWait = true;
        if (n < 100) await capture(page, "transfer-wait-14");
      }
    }
    s = await read(page);
    assert.equal(s.mode, "won");
    assert.ok(stationWait);
    assert.ok(s.people.every((p: any) => p.boardings === 2));
    results.cases.push({
      case: "14 real bus / station wait / rail",
      stationWait,
      twoBoardings: true,
    });
    await ready(page, 22);
    await page.mouse.move(10, 450);
    await page.mouse.click(10, 450);
    await step(page, 12000);
    s = await read(page);
    assert.ok(s.closed.includes("2,3"));
    await apply(page, MISSIONS[21].solution);
    s = await win(page);
    results.cases.push({
      case: "22 repair after closure",
      arrived: s.goal.arrived,
    });
    // A lifted installed road creates an actual gap. Escape restores it without a retry.
    await ready(page, 3);
    await apply(page, MISSIONS[2].solution);
    s = await read(page);
    const a = s.targets.tiles.straight;
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(a.x - 45, a.y - 45, { steps: 8 });
    s = await read(page);
    assert.equal(s.held, "straight");
    assert.equal(s.tiles.find((t: any) => t.id === "straight").cell, null);
    await step(page, 2000);
    assert.equal((await read(page)).goal.arrived, 0);
    assert.ok(
      (await read(page)).vehicles.some((v: any) => v.status === "waiting"),
    );
    await page.keyboard.press("Escape");
    await page.mouse.up();
    s = await read(page);
    assert.equal(s.held, null);
    assert.equal(s.tiles.find((t: any) => t.id === "straight").cell, "2,1");
    results.cases.push({
      case: "3 physical hold / missing road / cancel restores",
      time: s.goal.time,
    });
    await win(page);
    // Utility controls use their rendered controls and keyboard events.
    await ready(page, 1);
    await drag(page, "first-road", "2,1");
    await step(page, 1000);
    await page.locator("#undo").click();
    s = await read(page);
    assert.equal(s.tiles.find((t: any) => t.id === "first-road").cell, null);
    assert.equal(s.goal.moves, 0);
    await page.keyboard.press("Space");
    s = await read(page);
    assert.equal(s.mode, "paused");
    const pausedTime = s.goal.time;
    await step(page, 4000);
    assert.equal((await read(page)).goal.time, pausedTime);
    await page.locator("#resume").click();
    await page.locator("#menu").click();
    assert.equal((await read(page)).mode, "paused");
    await page.locator("#sound").uncheck();
    await page.locator("#motion").check();
    await page.locator(".close-dialog").click();
    await page.keyboard.press("KeyF");
    await page.waitForFunction(() => Boolean(document.fullscreenElement));
    await page.keyboard.press("KeyF");
    await page.waitForFunction(() => !document.fullscreenElement);
    await page.setViewportSize({ width: 900, height: 650 });
    await page.waitForTimeout(150);
    assert.ok(
      Object.values((await read(page)).targets.cells).every(
        (p: any) => Number.isFinite(p.x) && Number.isFinite(p.y),
      ),
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.reload();
    await page.waitForFunction(
      () => typeof window.render_game_to_text === "function",
    );
    const prefs = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("rush-hour-road-puzzle-v3")!),
    );
    assert.equal(prefs.muted, true);
    assert.equal(prefs.reduced, true);
    await page.keyboard.press("KeyR");
    s = await read(page);
    assert.equal(s.goal.moves, 0);
    assert.equal(s.tiles.find((t: any) => t.id === "first-road").cell, null);
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    assert.equal((await read(page)).mode, "paused");
    await page.locator("#resume").click();
    await drag(page, "first-road", "2,1");
    await win(page);
    results.cases.push({
      case: "undo / pause / menu / mute / motion / fullscreen / resize / retry / blur / recovered win",
      prefsPersist: true,
    });
  }
  await context.close();
  diagnosticPage = undefined;
  if (process.env.REVIEW_ONLY !== "14") {
    const phone = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      }),
      p = await phone.newPage();
    instrument(p);
    diagnosticPage = p;
    await ready(p, 24);
    // Genuine touch drag, and the visible rotation button for an oriented held/selected piece.
    for (const a of MISSIONS[23].solution) {
      if (a.type === "rotate") await touchRotate(p, a.tile, a.turns ?? 1);
      else await touchDrag(p, phone, a.tile, a.cell);
    }
    await step(p, 1200);
    await capture(p, "portrait-24-moving");
    const final = await win(p);
    await capture(p, "portrait-24-won");
    assert.equal(final.goal.arrived, 22);
    assert.equal(final.hints, 0);
    const banner = await p.locator("#win").boundingBox();
    assert.ok(
      banner &&
        banner.x >= 0 &&
        banner.y >= 0 &&
        banner.x + banner.width <= 391 &&
        banner.y + banner.height <= 845,
    );
    results.cases.push({
      case: "24 portrait390×844 genuine touch bridge/ramp/corner/clinic",
      arrived: final.goal.arrived,
      banner,
    });
    await phone.close();
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(hmr.messages, [], "no source hot updates during final play");
  results.completed = new Date().toISOString();
  await writeFile(
    path.join(
      out,
      process.env.REVIEW_ONLY
        ? `review-${process.env.REVIEW_ONLY}-results.json`
        : "browser-results.json",
    ),
    JSON.stringify(results, null, 2),
  );
  console.log(JSON.stringify(results, null, 2));
} catch (e) {
  results.failure = String(e);
  hmr.interrupted = hmr.pageReloads > 0 || hmr.messages.length > 0;
  if (diagnosticPage && !diagnosticPage.isClosed()) {
    try {
      await capture(diagnosticPage, "failed-run");
    } catch {}
  }
  await writeFile(
    path.join(
      out,
      process.env.REVIEW_ONLY
        ? `review-${process.env.REVIEW_ONLY}-results.json`
        : "browser-results.json",
    ),
    JSON.stringify(results, null, 2),
  );
  throw e;
} finally {
  await browser.close();
}
