# Action-puzzle verification

This record concerns V3 **grab → rotate → snap → bus resumes** in `src/action/`. V1/V2 results are historical and do not count as evidence for this interaction. The new target images were generated and inspected before implementation; see `mockups/README.md`. The human chose the tactile interaction, but has not yet evaluated the finished V3 game for enjoyment.

## Independent model checks

Run from the repository root:

```sh
node --import tsx --test tests/action/*.test.ts
```

The current suite passes **55/55**: twenty initial independent rule fixtures written before reading campaign solutions, later built-land and bent-station berth regressions, twenty-four public-action campaign witnesses, eight counterexamples/alternate plans, and one all-campaign building-lot layout check. No old tests are included in this count.

The fixtures check reciprocal ports and four rotations; a persistent loaded bus braking and resuming; wrong-orientation recovery; continuous corner travel without reboarding; occupied/currently reserved locks; legal terrain, bridge axes and ramp heights; one-way return constraints; bridge queues and same-mode spacing; bus/station/rail identity, a visible station wait and final walking; local service without duplicating onboard people; minority-group inclusion; actual road removal while held; cancel/compound-gesture undo/retry/pause; conditional demand; and closure entry semantics. Accounting checks partition every original/conditional person, enforce seats and unique onboard membership, and retain piece inventory.

The campaign counterexamples establish that mission 13 really strands eight people after the first six until its one-way return loop is repaired; mission 18's nearer group has the longer actual path and later arrival; quiet land rejects roads in 8; a clinic on the other legal plot fails to serve the local group in 19; 21 has two solvable demand scenarios; 22 can recover even when repairs begin after closure; 23 accepts both corridors; and 24 cannot win with eighteen road users served while four clinic users remain unserved.

Independent testing found and the lead fixed a held/direct swap inconsistency: lifting a board piece previously made the same occupied-cell swap illegal. It also exposed same-tick rail boarding; the model now preserves a station wait of approximately 0.4 seconds. The suite observes at least 0.35 seconds in discrete steps, rather than merely assuming a transfer from the level's title.

## Normal-control browser checks

The reproducible runner is:

```sh
node --import tsx tests/action/browser.ts
```

Optional environment variables:

- `GAME_URL` selects the shipped action page; default is `http://localhost:5303/action.html`.
- `PLAYWRIGHT_EXECUTABLE_PATH` selects an already installed compatible Chromium. Otherwise the pinned Playwright dependency's executable is used.
- `REVIEW_ONLY=24` runs only the final portrait touch case. `REVIEW_ONLY=14` runs only the corrected rail-berth/transfer case and writes a separate result file.

The runner uses an isolated Playwright context, hardware Metal rendering on this Mac, real pointer drags, keyboard focus/Q/E and visible buttons. The portrait case uses actual CDP touch start/move/end events and touch taps at 390×844. Only `render_game_to_text()` reads and `advanceTime(ms)` elapsed-time acceleration are evaluated in the page. No runtime model/action functions, campaign state, solution path or victory flag are injected. Campaign witnesses inform the expert's actions; they do not establish first-time comprehension.

The frozen-source run completed **24/24 sequential missions** through the normal controls, with all required people arriving, the real GLB loaded, no hints used in the campaign, all twenty-four star records saved and mission 24 unlocked. The result is `tests/action/evidence/browser-results.json`: zero console/page errors, zero campaign page reloads, no Vite hot-update messages, and `hmr.interrupted=false`. The full expert sweep and extra cases took about 62 seconds of wall time with elapsed-time acceleration; this is not a novice completion-time claim.

| Additional normal-control case              | Observed result                                                                                                                                                                                                                                      |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2 wrong orientation / small hint / rotation | No arrivals through the broken corner. A hint stayed nonmodal, preserved all six person IDs/counts and kept play active. The visible rotate control repaired it and six arrived.                                                                     |
| 11 ordinary road over water                 | The drop rejected with a visible bridge/support reason; piece inventory and move count stayed unchanged. The real bridge repair completed the trip.                                                                                                  |
| 13 outbound success / missing return loop   | Six of fourteen arrived; eight visibly remained at home. A real return-corner repair let the same bus make three loads and serve all fourteen, with one boarding per person.                                                                         |
| 14 feeder / station / rail                  | People entered a waiting-at-station state, then boarded the actual train. All twelve arrived with two boardings each.                                                                                                                                |
| 22 delayed closure repair                   | The lower crossing was already closed before construction. Physical alternate-route repairs still served all twelve.                                                                                                                                 |
| 3 physical hold / cancel                    | A correctly installed useful road left the board while held; the bus waited. Escape restored its original cell/orientation and the journey completed.                                                                                                |
| Utilities                                   | Undo restored the gap; pause and settings stopped simulation; mute and reduced-motion choices persisted through reload; fullscreen/exit and resize worked; retry restored the initial board; a blur event paused and resumed into a successful trip. |
| 24 portrait touch                           | Genuine touch drag/rotate controls at 390×844 placed the bridge, ramp, corner and clinic. All twenty-two arrived; the reward banner bounds were x14/y604/width362/height118, inside the viewport.                                                    |

Screenshots/text states under `tests/action/evidence/` were actually opened and inspected, including river rejection, the six-arrived/eight-waiting return loop, bridge and rail movement, and final portrait movement/win. The bus, required roads, water gap and later ramp remain visible; the rotated portrait map's north arrow is consistent and the final banner is unobstructed. Programmatic target-centre success does not establish comfortable thumb input on every physical phone.

The final run followed a real scene correction found by QA. Mission 8's house lot had covered its required empty road cell, causing the normal drag to hit a locked home road. Campaign-authored building lots now exclude every road reservation, initial piece, solution parking position and service plot; built land rejects road placement with a clear reason. Independent all-campaign invariants and the fresh real-input 8 pass guard against recurrence. Stale interrupted-run captures are in ignored `work/`, not the final result set.

A bounded visual follow-up corrected mission 14's waiting train, which had inherited the station's bus-corner diagonal. The model now aligns a terminal train with its sole adjacent rail axis before boarding and after return; the additional independent fixture passes with conserved people. The scene applies the same platform-shoulder offset/taper to track and train. A fresh normal-control `REVIEW_ONLY=14` run reached twelve arrivals with station waiting and two boardings per person, zero errors and no HMR. Its ready, station-wait and arrival screenshots were opened and inspected: the train is aligned with the rail shoulder, with the bus feeder visibly separate. See `review-14-results.json` and `rail-14-*.png/json`. The full-campaign record is retained from before this limited pose/render correction; it was not presented as a second full sweep afterward.

## Opening replay and static-build check

The lead's final isolated opening replay used normal pointer/keyboard/touch controls with **no authored solution import, hints, progress/state injection or elapsed-time hook**. These are measured expert interaction timings, not unprompted-child discovery timings:

| Observation                                                                              | Actual wall time |
| ---------------------------------------------------------------------------------------- | ---------------- |
| Desktop first six-person win                                                             | 4.319 seconds    |
| Desktop first two mornings, including undo, retry/replay, then a wrong corner and repair | 14.461 seconds   |
| Portrait first two mornings                                                              | 9.092 seconds    |

The final `tests/action/evidence/first-minute/record.json` reports zero errors and `hotReload=false`; corresponding ready, lift, wrong-turn and win screenshots are in that directory. This evidence demonstrates a quick expert action/recovery loop. It does not establish that a novice knows what to grab without prompting.

The lead's fresh production static build also completed the first mission **6/6 after the network was disabled**, following the model/font load and an actual pointer drag. The elapsed-time hook was used only after that real action. `docs/action-puzzle/actual/static-check.json` records version 3, `modelLoaded=true`, `mode=won`, zero errors and **1,325,991 bytes** of decoded resource bodies (about 1.33 MB). This is an offline-after-load test, not an uncached offline-first-visit claim or compressed transfer-size measurement. Startup font loading resolved the late offline glyph requests. The final `static-offline-win.png` was opened and inspected: Hebrew text, stars, bus, road and six arrived people render correctly.

QA status: the model, campaign/control, targeted visual, touch and documentation checks described above are complete. Human first-time comprehension, enjoyment and learning remain separate, unvalidated outcomes.

## Limits and geographic accuracy

These checks establish specific rules and observed inputs. They do not prove that an unprompted student discovers the action, enjoys the loop or learns the geography. Expert replay, optional time acceleration, Chromium touch emulation and a model witness cannot replace first-time human play or physical-phone performance testing.

The current model's last walk is an authored 1.8-second abstraction; tee pieces use connectivity routing rather than a manually controlled switch; wide road triggers announced demand but does not increase simulated seats, speed or headway capacity. Terrain heights, bridge supports, quiet land and local service sites are schematic constraints. See `CURRICULUM.md` for every mission's exact source mapping and the fixed/mobile source discrepancy left unassessed.
