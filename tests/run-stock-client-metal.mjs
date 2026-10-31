// Launch-only adaptation of the user's installed develop-web-game action client.
// No copy of that skill is bundled or redistributed by this repository.
import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from "node:fs";
import { homedir } from "node:os";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import { chromium } from "playwright";
const client =
  process.env.WEB_GAME_CLIENT ||
  join(
    homedir(),
    ".codex/skills/develop-web-game/scripts/web_game_playwright_client.js",
  );
const executable =
  process.env.PLAYWRIGHT_EXECUTABLE_PATH || chromium.executablePath();
const original = readFileSync(client, "utf8");
const config = 'args: ["--use-gl=angle", "--use-angle=swiftshader"],';
if (!original.includes(config))
  throw new Error(
    "Installed client launch configuration changed; review before adapting.",
  );
const adapted = original.replace(
  config,
  `executablePath: ${JSON.stringify(executable)},\n    args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],`,
);
mkdirSync("work", { recursive: true });
const temporary = resolve("work/stock-client-metal.mjs");
writeFileSync(temporary, adapted);
try {
  const result = spawnSync(
    process.execPath,
    [temporary, ...process.argv.slice(2)],
    { stdio: "inherit" },
  );
  process.exitCode = result.status ?? 1;
} finally {
  unlinkSync(temporary);
}
