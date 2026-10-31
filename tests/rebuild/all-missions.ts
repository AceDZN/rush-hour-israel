import { chromium } from "playwright";
import { missions } from "../../src/rebuild/campaign";
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
await mkdir("docs/redesign/actual/campaign", { recursive: true });
const report = [];
async function tapNode(id: string) {
  await page.locator(`[data-node="${id}"]`).click();
}
async function selectLine(id: number) {
  let s = await state(),
    line = s.lines.find((l: any) => l.id === id),
    segments = line.path
      .slice(1)
      .map((b: string, i: number) => {
        const a = s.nodes.find((n: any) => n.id === line.path[i]),
          bb = s.nodes.find((n: any) => n.id === b);
        return {
          a,
          bb,
          d: Math.hypot(a.screen.x - bb.screen.x, a.screen.y - bb.screen.y),
        };
      })
      .sort((a: any, b: any) => b.d - a.d);
  let found = false;
  for (const seg of segments) {
    await page.mouse.click(
      (seg.a.screen.x + seg.bb.screen.x) / 2,
      (seg.a.screen.y + seg.bb.screen.y) / 2,
    );
    const after = await state();
    if (after.selectedLine === id) {
      found = true;
      break;
    }
    if (after.interaction === "drawing") {
      await page.keyboard.press("Escape");
      if ((await state()).mode === "paused")
        await page.locator("#pause").click();
    }
  }
  if (!found)
    throw new Error("Cannot select line " + id + " in mission " + s.level);
}
try {
  for (const mission of missions) {
    await page.goto(`http://localhost:5303/rebuild.html?level=${mission.id}`);
    await page.waitForFunction(
      () => typeof window.render_game_to_text === "function",
    );
    await page.evaluate(() => window.advanceTime(0));
    const trail = [];
    for (let i = 0; i < mission.solution.length; i++) {
      const route = mission.solution[i];
      let s = await state(),
        line = s.lines.find(
          (l: any) =>
            l.mode === route.mode && l.path.join() === route.path.join(),
        );
      if (!line) {
        if (mission.trains)
          await page.locator(`[data-mode="${route.mode}"]`).click();
        for (const id of route.path) await tapNode(id);
        if (
          mission.nodes.find((n) => n.id === route.path.at(-1))?.kind ===
          "station"
        )
          await page.locator("#finish-route").click();
        s = await state();
        line = s.lines.find(
          (l: any) =>
            l.mode === route.mode && l.path.join() === route.path.join(),
        );
        if (!line)
          throw new Error(
            "Failed route " +
              mission.id +
              " " +
              route.path.join() +
              " " +
              s.message,
          );
        trail.push({ type: "route", ...route });
      }
      for (let j = 0; j < (mission.solutionExtras[i] ?? 0); j++) {
        await selectLine(line.id);
        await page.locator("#extra-bus").click();
        trail.push({ type: "extra", line: line.id });
      }
      if (await page.locator("#route-context").isVisible())
        await page.locator("#close-context").click();
    }
    for (const id of mission.solutionServices) {
      await page.locator("#clinic-card").click();
      await tapNode(id);
      trail.push({ type: "service", node: id });
    }
    await page.evaluate(() => window.advanceTime(5000));
    if ([1, 3, 10, 14, 18, 22, 24].includes(mission.id))
      await page.screenshot({
        path: `docs/redesign/actual/campaign/${mission.id}-moving.png`,
      });
    await page.evaluate(() => window.advanceTime(240000));
    const after = await state();
    if (after.mode !== "won")
      throw new Error(
        "No win " +
          mission.id +
          ": " +
          after.message +
          " " +
          JSON.stringify(after.goal),
      );
    report.push({
      id: mission.id,
      completedAt: after.completedAt,
      goal: after.goal,
      trail,
    });
    console.log(
      mission.id,
      "won",
      after.goal.arrived + "/" + after.goal.total,
      "time",
      Math.round(after.completedAt),
    );
  }
  await writeFile(
    "docs/redesign/actual/campaign/results.json",
    JSON.stringify(
      {
        method:
          "Normal visible node/tool controls, supported time stepping only, no injected plan/win",
        report,
        errors,
      },
      null,
      2,
    ),
  );
  if (errors.length) throw new Error(JSON.stringify(errors));
} finally {
  await browser.close();
}
