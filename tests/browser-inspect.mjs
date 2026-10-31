import { chromium } from "playwright";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.PLAYWRIGHT_EXECUTABLE_PATH || chromium.executablePath(),
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("console", (msg) =>
  console.log("console", msg.type(), msg.text(), msg.location()),
);
page.on("pageerror", (err) => console.log("PAGEERROR", String(err)));
await page.goto("http://localhost:5303", {
  waitUntil: "domcontentloaded",
  timeout: 30000,
});
await page.waitForTimeout(3000);
console.log(
  await page.evaluate(() => ({
    ready: document.readyState,
    dialogs: [...document.querySelectorAll("dialog")].map((d) => ({
      id: d.id,
      open: d.open,
      rect: d.getBoundingClientRect().toJSON(),
    })),
    state:
      typeof window.render_game_to_text === "function"
        ? window.render_game_to_text()
        : null,
    body: document.body.innerText.slice(-1000),
  })),
);
await page.screenshot({ path: "docs/playtest/inspection.png" });
await browser.close();
