# Independent geography and gameplay verification

Independent QA owner: geography/gameplay helper. Scope: pure-rule invariants, all 24 baseline scenarios, curriculum misconception traps, and actual controls. This is a test record, not evidence of measured learning gains.

## Verification plan

- Conservation at every tick: expected demand = not yet spawned + waiting + onboard/in transit + arrived + explicitly expired/failed. Passenger IDs remain unique. Transfers move an existing passenger; they do not spawn another.
- Capacity: onboard passengers never exceed seats; link occupancy/service entry obeys finite capacity; an overloaded crossing produces a queue and delays arrivals.
- Time: walking, departure wait, edge travel and transfer wait are included in door-to-service time. A fast link cannot bypass a missing stop or final connection.
- Constraints: disconnected networks strand passengers; grade and crossing restrictions reject illegal construction; resources cannot become negative or be refunded twice.
- Outcome: no win while one required group misses its minimum access threshold; total/mean measures cannot hide a stranded low-demand settlement.
- Determinism: identical input sequence and elapsed time produce identical passenger outcomes; retry restores the authored wave; pause freezes simulation and resuming does not duplicate arrivals.
- Campaign: 24 different authored decisions/topologies, each with an independently checked workable baseline and an instructive near miss. Last four remove answer overlays while retaining ordinary map instruments.

## Required browser cases

| Level | Actual-control case | Result / evidence |
|---|---|---|
| 1 | Connect a complete route, start the wave, observe real arrivals and win; retry | Pass: visible moving vehicles, 12/12 timely, keyboard retry + pause/resume, repeat win. `level01-moving.png`, `level01-win.png` |
| 2 | Create the shared-crossing overload, revise it and recover conserved passengers | Pass: actual road wave queues >10, add bus/stop/upgrade controls during same wave, recover to win. `level02-overload.png`, `level02-recovered.png` |
| 3 | Place a poorly sited stop, observe unmet access, retry with a useful stop | Pass: remote-stop plan yields zero arrivals and loss; useful coverage on retry wins. `level03-poor-stop.png`, `level03-retry-win.png` |
| 10 | Attempt the steep shortcut; choose a feasible contour route | Pass: shortcut rejected with grade message and no charge; contour bus plan reaches win. `level10-grade-rejected.png`, `level10-relief-moving.png`, `level10-win.png` |
| 14 | Miss a trunk departure; coordinate feeder and rail transfer | Pass: complete but uncoordinated feeder/trunk yields 1/36 timely and loss; interchange/frequency repair yields 36/36 and win. Actual phase-specific wait is also independently checked by the model fixtures. `level14-transfer-miss.png`, `level14-win.png` |
| 18 | Compare near congested with distant fast service by actual time | Pass: near shared crossing plan loses; feeder/rail alternative wins. `level18-near-slow.png`, `level18-fast-alternative.png` |
| 20 | Serve central majority but strand small group; verify failure, then equitable win | Pass: central 32/36 timely still loses with edge group 0/4; local service yields 36/36 win. `level20-majority-only.png`, `level20-equitable-win.png` |
| 24 | Complete unfamiliar integrated final map through actual controls | Pass: full 42/42 timely final win, then fresh navigation retains selected level and victory star. `level24-moving.png`, `level24-final-win.png`, `campaign-persisted.png` |

Also verify keyboard/pointer, usable touch, pause/resume, restart, mute, reduced motion, resize, focus-loss pause, hints versus unaided score, local progress, visible Tripo loading and console errors. Use the develop-web-game action client and inspect captures. A generated design target is not browser evidence; a screenshot without an input/outcome trail is not a completed playtest.

## Current results

The exact six curriculum snapshots and 24-level brief have been reviewed. Source discrepancy is recorded in `CURRICULUM.md`.

31 October 2026, independent pure-rule run: `npm test` passes **69/69** tests. This includes 24 buildable baseline wins, 24 authored near-miss losses, two distinct alternate-plan wins (levels 6 and 23), campaign structure, and 18 custom fixtures. The fixtures check disconnected/no-car/poor-stop access, per-tick passenger identity and seat conservation, grade/bridge rejection, actual missed departure and phase-sensitive transfer wait, free-infrastructure refund accounting, same-kind versus wrong-kind service, worst-group equity, conditional induced demand/retry, pause/determinism, announced closure/alternate route, planning tool restrictions nuisance thresholds, shared surface occupancy and 14-seat rail batches. See `tests/model.test.ts`, `tests/campaign.test.ts` and `tests/latest-results.txt`.

This review caught and the lead fixed three substantive rule bugs: an empty rail departure waiting for a late passenger instead of leaving on schedule; sale of free initial infrastructure creating budget; and a local service of the wrong kind satisfying demand. It also caught incomplete or too-slow authored baseline plans, including the missing last-mile access for the second group in level 15. All declared baselines now pass the independent thresholds.

Browser cases above pass using normal desktop controls in an isolated Metal Chromium context at 1440×900. `tests/browser-play.ts` replays the actual node/tool clicks and physical keys; it reads `render_game_to_text` and advances the supported deterministic clock, and never injects network or win state. Matching inputs/outcomes are in `docs/playtest/browser-run.txt` and `browser-record.json`; captures are in `docs/playtest/`. No console/page errors were observed. The generated design images are not used as implementation evidence.

The stock develop-web-game client was invoked; its default SwiftShader renderer stalled on this machine. A launch-only Metal adaptation now runs successfully using `tests/run-stock-client-metal.mjs`, which reads the installed skill client and creates an ephemeral ignored work copy rather than redistributing it. The stock action payload `tests/skill-actions.json` draws level 1 through real pointer actions, then runs 12 seconds: the matching hook records 2 arrived, 4 riding and 6 waiting. The capture `docs/playtest/skill-metal-final/shot-0.png` was visually inspected. The client captures the WebGL canvas; the independent desktop captures include the DOM HUD. A source hot reload interrupted an early plan, so the completed desktop run used a frozen source interval.

The first 390×844 final-map touch attempt exposed overlapping interchange/job labels. The lead fixed these with compact accessible mobile markers; `tests/browser-mobile.ts` now uses normal touchscreen taps to win levels 1 and 24, with 42/42 timely final arrivals and no errors. `mobile24-win.png` was inspected. Final utility checks pass for camera rotate/reset, mute, reduced motion, hint marking and active-wave pause, help, F fullscreen enter/exit, dialog pause, retry, label pointer drag construction, phase changes, explicit parallel rail selection without an unintended bus upgrade, and resize to 1024×640. `utilities-record.json`, `utilities-run.txt` and `utility-inspector.png` contain the evidence. Final mobile results are in `mobile-record.json` and `mobile-run.txt`. A synthetic blur event verifies the pause listener; native OS focus switching is not verified because headless tab activation did not emit the event. Full Chromium exposed a missing favicon404; the lead added an embedded local SVG favicon. The final desktop, mobile and utility reruns have no console/page errors. The initial rail occlusion in level 14 is also fixed: the final `level14-transfer-moving.png` was inspected and shows a readable rail corridor.

The lead independently completed an all-24 actual-control sweep with the reproducible `tests/browser-campaign.ts`; results are recorded in `docs/playtest/all-24-browser.json`. The lead also verified a production-preview success after going offline following initial load, with the local Tripo model and bundled font; see `production-smoke.json` and `production-offline-win.png`. These checks establish model behaviour and actual-control cases; they do not establish measured student learning or enjoyable difficulty for a class.

The final stock-client canvas exposed a remaining level 1 road occlusion after initial review. The lead widened the existing authored terrain corridor terraces without changing route rules; final `skill-metal-final/shot-0.png` was inspected and shows the complete A→J→S road, school, moving cars and queues. The final all-24 UI sweep was rerun after this render change; all 24 win with zero errors, using explicit parallel-mode selection and the authored baseline budgets.

To replay desktop checks on a machine with Playwright Chromium installed, run `node --import tsx tests/browser-play.ts`, `node --import tsx tests/browser-campaign.ts`, `node --import tsx tests/browser-mobile.ts`, and `node --import tsx tests/browser-utilities.ts` while the dev server is running. The provided Metal launch options match this macOS machine; set `PLAYWRIGHT_EXECUTABLE_PATH` if selecting another local browser. The stock client wrapper accepts its normal `--url`, `--actions-file`, and screenshot options and reads `WEB_GAME_CLIENT` when supplied.
