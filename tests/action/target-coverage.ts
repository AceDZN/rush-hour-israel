import { chromium, type Page } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
// Actual pointer holds plus the read-only visible hover/target hook. No scene or
// model functions, campaign solution, selection assignment or victory injection.
const out = path.resolve("tests/action/polish-evidence/target-coverage");
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.PLAYWRIGHT_EXECUTABLE_PATH || chromium.executablePath(),
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});
const errors: string[] = [],
  hmr: string[] = [],
  report: any = {
    method:
      "Every initial free-piece center grabbed normally. Every projected cell center scanned during an actual held piece, using read-only hover. Desktop uses pointer input; phone uses genuine CDP touch. Normal keyboard retry isolates probes.",
    profiles: [],
    failures: [],
    errors,
    hmr,
  };
const read = (p: Page) =>
  p.evaluate(() => JSON.parse(window.render_game_to_text()));
async function shot(p: Page, name: string) {
  await p.screenshot({ path: path.join(out, name + ".png") });
  await writeFile(
    path.join(out, name + ".json"),
    JSON.stringify(await read(p), null, 2),
  );
}
const activeTouches = new Set<any>();
async function reset(p: Page, touch: any) {
  if (touch) {
    if (activeTouches.has(touch)) {
      await touch.send("Input.dispatchTouchEvent", {
        type: "touchCancel",
        touchPoints: [],
      });
      activeTouches.delete(touch);
    }
    await p.keyboard.press("KeyR");
    await p.waitForTimeout(35);
    return;
  }
  if ((await read(p)).held) await p.keyboard.press("Escape");
  await p.mouse.up();
  await p.keyboard.press("KeyR");
  await p.waitForTimeout(35);
}
async function grab(p: Page, id: string, touch: any) {
  const s = await read(p),
    a = s.targets.tiles[id];
  assert.ok(a);
  if (touch) {
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: a.x, y: a.y }],
    });
    activeTouches.add(touch);
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: a.x + 14, y: a.y - 10 }],
    });
  } else {
    await p.mouse.move(a.x, a.y);
    await p.waitForTimeout(65);
    await p.mouse.down();
    await p.mouse.move(a.x + 14, a.y - 10, { steps: 3 });
  }
  await p.waitForTimeout(45);
  assert.equal((await read(p)).held, id);
}
try {
  for (const profile of [
    { name: "desktop", width: 1440, height: 900, mobile: false },
    { name: "phone", width: 390, height: 844, mobile: true },
  ]) {
    const context = await browser.newContext({
        viewport: { width: profile.width, height: profile.height },
        isMobile: profile.mobile,
        hasTouch: profile.mobile,
      }),
      page = await context.newPage();
    const touch = profile.mobile ? await context.newCDPSession(page) : null;
    const move = async (x: number, y: number) => {
      if (touch)
        await touch.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x, y }],
        });
      else await page.mouse.move(x, y);
    };
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
      if (/\[vite\].*(hot updated|page reload)/i.test(m.text()))
        hmr.push(m.text());
    });
    let sources = 0,
      cells = 0,
      builtRejections = 0;
    for (let id = 1; id <= 24; id++) {
      await page.goto(
        `${process.env.GAME_URL ?? "http://localhost:5303/action.html"}?level=${id}`,
      );
      await page.waitForFunction(
        () =>
          typeof window.render_game_to_text === "function" &&
          JSON.parse(window.render_game_to_text()).modelLoaded,
      );
      await page.waitForTimeout(70);
      const initial = await read(page);
      assert.equal(initial.version, 4);
      for (const t of initial.tiles.filter((t: any) => !t.locked)) {
        await reset(page, touch);
        try {
          await grab(page, t.id, touch);
          sources++;
        } catch (e) {
          report.failures.push({
            profile: profile.name,
            level: id,
            source: t.id,
            error: String(e),
          });
          await shot(page, `${profile.name}-${id}-source-${t.id}`);
        }
      }
      await reset(page, touch);
      const source = (await read(page)).tiles.find((t: any) => !t.locked);
      try {
        await grab(page, source.id, touch);
        await page.waitForTimeout(80);
        for (const cell of initial.cells) {
          const target = (await read(page)).targets.cells[cell.id];
          await move(target.x, target.y);
          await page.waitForTimeout(18);
          const s = await read(page);
          if (s.hover !== cell.id) {
            report.failures.push({
              profile: profile.name,
              level: id,
              target: cell.id,
              hover: s.hover,
            });
            await shot(page, `${profile.name}-${id}-target-${cell.id}`);
          } else cells++;
        }
        const built = initial.cells.find((c: any) => c.terrain === "built");
        if (built) {
          const target = (await read(page)).targets.cells[built.id],
            before = await read(page);
          await move(target.x, target.y);
          await page.waitForTimeout(35);
          assert.equal((await read(page)).hover, built.id);
          if (touch)
            await touch.send("Input.dispatchTouchEvent", {
              type: "touchEnd",
              touchPoints: [],
            });
          if (touch) activeTouches.delete(touch);
          else await page.mouse.up();
          await page.waitForTimeout(50);
          const after = await read(page);
          assert.match(after.message, /מבנה/);
          assert.equal(after.goal.moves, before.goal.moves);
          assert.deepEqual(after.tiles, initial.tiles);
          builtRejections++;
        }
      } catch (e) {
        report.failures.push({
          profile: profile.name,
          level: id,
          phase: "held-cell-scan-or-built-rejection",
          error: String(e),
        });
        await shot(page, `${profile.name}-${id}-scan-failed`);
      }
      await reset(page, touch);
      console.log(`${profile.name} ${id}: source/cell scan complete`);
      if (hmr.length) throw Error("source changed during target coverage");
    }
    report.profiles.push({
      name: profile.name,
      sources,
      cells,
      builtRejections,
    });
    if (touch) await touch.detach();
    await context.close();
  }
  await writeFile(
    path.join(out, "record.json"),
    JSON.stringify(report, null, 2),
  );
  assert.deepEqual(report.failures, []);
  assert.deepEqual(errors, []);
  assert.deepEqual(hmr, []);
} finally {
  await writeFile(
    path.join(out, "record.json"),
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
