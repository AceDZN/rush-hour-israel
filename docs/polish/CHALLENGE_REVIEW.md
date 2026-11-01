# Challenge, visual and final-build star review

Status: independent model/content checks pass **86/86** and the earned final-build campaign passes **24/24** with 15 additional control/profile cases. Runtime content remains version 4; the final score namespace is version 6. The human explicitly selected compact final build plus solving without hints, superseding the placement fallback. The later cleanup-footer correction passes five bounded desktop/touch cases, recorded separately below.

The human found the tactile game much better and requested stronger challenge and graphics. This pass preserves grab/rotate/snap, safe visible bus waits, untimed goals and quick recovery. The first two mornings are explicitly short introductions; the sample challenge opens 4 in practice without awarding progress.

## What actually changed

The read-only census compares authored layouts, not optimal solutions or student difficulty:

| Proxy                                                       | Before   | Retuned                                           |
| ----------------------------------------------------------- | -------- | ------------------------------------------------- |
| Fixed / movable pieces across 24                            | 149 / 43 | 76 / 128                                          |
| Witnesses touching at most two distinct pieces              | 22       | 2, the introductions                              |
| Minimum distinct pieces edited by a primary witness after 2 | 1        | 4                                                 |
| Largest distinct-piece witness                              | 4        | 8                                                 |
| Initially loose pieces in tray                              | Up to 4  | At most 4; other reusable pieces are on the board |

The necessary pieces now have changed initial positions/orientations, rather than simply receiving an unlocked flag on an otherwise correct road. Alternate solutions are accepted in 4, 8 and 23. These are useful improvements in planning opportunity; they are not measured enjoyment, a solver-certified minimum depth or proof that every later board is hard.

## Independent checks

Run `node --import tsx --test tests/action/*.test.ts` from the repository root. The current **86/86** comprises twenty-two standalone rule fixtures, twenty-four primary witnesses, ten campaign counterexample/layout/service checks, seventeen challenge checks and thirteen final-build/unaided star checks. Standalone conservation, persistent identity, occupied/held transactions, height/mode, finite bridge, station transfer and service rules remain strict.

The secondary school footprint is explicit in `landmark.lots[]`. Every primary/extra lot stays at compatible height, avoids the union of roads/alternatives/initial parking/solution placement/service cells, and is unique. Extra lots are confined to schools and adjacent to the primary lot. Actual road placements on both primary and extra lots reject atomically with a building reason.

The pilot enumeration checks every legal rotation and every one-piece compound grab/turn/drop, including swaps and return-to-tray. No witness list is consulted in that enumeration. Necessary journey/return reachability filters discard disconnected boards; any surviving candidate would be simulated. All accepted one-gesture configurations failed those necessary filters:

| Initial board         | Legal one-gesture configurations examined | Winning configurations |
| --------------------- | ----------------------------------------- | ---------------------- |
| 4                     | 240                                       | 0                      |
| 8                     | 559                                       | 0                      |
| 13                    | 274                                       | 0                      |
| 24, all groups        | 597                                       | 0                      |
| 24, road groups alone | 595                                       | 0                      |

The road-only 24 check prevents a separate clinic chore from trivially supplying the depth result. This is a one-gesture shortcut search, not an exhaustive optimal-move solver. No exact minimum or number of human decisions is inferred from `par` or these counts.

Meaningful legal mistakes also run through actual model time and repair:

- In 4, spending both corners before reaching the school row creates a connected dead end. Reallocating the corner/straight repairs it.
- In 8, splitting the two corners between north and south bypasses leaves both incomplete. Moving the far corner completes the chosen corridor.
- Changing only 8's quiet land to ordinary land makes the three-straight direct route work. The unchanged protected version rejects those same placements without charging or losing pieces.
- In 13, a visually continuous return with the arrow pointing east still leaves six arrived and eight waiting. Correcting the arrow enables the original bus's remaining loads.
- In 24, an upper bridge and east-high ramp legally serve all twelve coastal and four clinic users while all six eastern road users remain stranded. Relocating the crossing, approaches and shared north-high ramp then serves all twenty-two without changing person identities.

These checks establish real spatial/operational consequences, rather than rejected decoy drops alone.

## Informed expert pilot method

The reviewer proposed the bend-column, park-bypass and shared-ramp layout families in `DIFFICULTY_AUDIT.md`. The later pilot review therefore cannot be called naive, fully blind or representative of a student. Before input, inspect each initial rendered board and log a first plan/reason from that visible configuration. Do not open `mission.solution`, exported alternate pose lists or hints to choose the plan. Record any genuine failed plan and revision; do not manufacture a mistake for a challenge claim.

`tests/action/pilot-review.ts` deliberately imports no campaign/model/solution. Its observe phase saves fresh initial screenshots/text under `tests/action/polish-evidence/pilots/`. Only after those are inspected is a separate expert plan logged for normal pointer/keyboard replay. Travel acceleration, if used after real input, is labelled separately from planning. Scripted replay times are not discovery or thinking times.

Fresh initial images for 4/8/13/24 have now been opened after the final source/art freeze. The first plans are logged in `tests/action/pilot-plans.json` before input: use the right bend column in 4; use the southern park bypass in 8; try a compact row-1 return with four pieces and a westbound arrow in 13, leaving two straights unused; and use the lower crossing/shared north-high ascent in 24, substituting a spare corner into the useful route. The last plan is strongly informed by the earlier blueprint. Actual first-plan replay reached 6/6 in 4 and 8 and 14/14 in 13 without hints or authored-pose lookup. The compact row-1 return in 13 used four pieces and left two reference-plan straights untouched; it is now independently regression-tested as an accepted efficient alternate, not blocked to enforce the six-piece reference. Reference counts are therefore explicitly not necessities or minima.

Pilot 24 hit a real control/visual defect on its first action: the planned clinic plot `5,3` was occluded by the no-lot home roof, so the ray selected fixed home `5,4` and rejected the drop. The clinic remained in the tray with zero moves. This was a failed physical input, not a failed geographic plan. The unchanged logged plan was retried after the physical fallback correction and reached 22/22, including a spare-corner substitution; no authored answer was opened to revise it. Evidence is in `pilots/post-fix-24/`.

Initial visual assessment: the actual world has more developed asphalt/stone surfaces, detailed school/bus models, shelters, courts and physical pulls. It remains visibly simpler and sparser than the fresh architectural targets: broad open beige cells, sparse foliage and simplified homes/people remain. Loaded assets do not establish parity with the reference images or answer whether the human likes this treatment.

## Full control and profile checks

`tests/action/browser.ts` uses hook version 4 and the final v6 score namespace, negative quarter-turns using Q and the visible counterclockwise phone button. The full sweep uses actual drags/focus/keys and the read-only text hook; it does not inject a path, model action or victory. Its witness-assisted campaign replay is functional evidence, distinct from the pilot method above.

Isolated profiles verify that version 6 imports access/settings from version 5 first, otherwise 4, otherwise 3; every old record remains untouched and new compact/unaided scores start empty. Criteria shown before rescue create no saved score, and the practice sample awards nothing by itself. Existing legitimate v6 silver/bronze ratings remain unchanged on reload. These fixtures are separate from the fresh earned-campaign profile.

The partial-hint check in 12 leaves the east corner unfinished while the correctly counterclockwise-oriented ramp is already in place. The hint identifies the unfinished corner and preserves people; it must not mistake `-1` for a different orientation from `3`. A hinted completion now correctly earns two stars even after a compact solution.

The earned-control run completed **24/24 sequential wins**, with every required person served, all 24 reference builds earning three stars after any necessary final-layout cleanup, and unlock 24 persisted. `tests/action/compact-evidence/browser-results.json` records **zero blockers, zero errors, no Vite updates/reloads and `hmr.interrupted=false`**. It ran from 07:50:16.911Z to 07:53:07.981Z on 2026-11-01 (171.07 seconds) with travel acceleration. This is an expert functional sweep, not a student challenge-time measurement. All three asset-ready flags were required before input. This complete run precedes the later cleanup-footer placement/text-selection correction; the bounded check below covers that correction without repeating all 24.

All fifteen additional cases passed:

- Mistakes and repair: wrong corner plus nonmodal hint in 2, rejected ordinary road on water in 11, return-network repair after the first six arrivals in 13, and recovery after closure in 22.
- Transfer and guidance: station wait and two actual boardings in 14, and partial hint in 12 that preserves the already correct counterclockwise ramp and people.
- Editing: real held-road removal/cancel in 3; selection ×, Escape and backdrop exit without charging or pausing.
- Utilities: undo, pause, menu, settings, mute, reduced motion, fullscreen, resize, retry and blur handler, followed by successful play.
- Profiles: v5-first, v4-fallback and v3-fallback migration into v6; untouched old records, empty new score records, no award from practice preview, and preservation of existing v6 ratings.
- Phone: actual clockwise/counterclockwise/close controls and complete touch play of 24, including a held bridge and genuine post-arrival cleanup through Done.

At 390×844, genuine touch placed the bridge/ramp/corners/clinic and served 22/22 while both parked spares remained. The actual review controls then returned them to the tray, preserving inventory and every passenger, and reduced the footprint from 10 to 8 against target 8. Time remained frozen during review. Done saved three stars. The selected-actions bar fit and reward bounds were (14,582.5), size 362×139.5. These are emulated touch checks, not a physical-phone comfort/performance study.

The renderer readiness hook includes bus, school and all authored texture loads. A fallback cannot silently count as upgraded-art evidence.

## Bounded final cleanup-footer check

After the full campaign had closed, the cleanup controls moved to the bottom-right, now hide during selection, and use 44px buttons. Review instructions moved into the task heading; native game text selection is disabled. The general model and mission topology did not change.

`EVIDENCE_DIR=tests/action/compact-evidence/tidy-final REVIEW_ONLY=TIDY npm run test:browser` runs normal desktop 24 controls and genuine CDP-touch 24 controls. The final record is separate from the completed full sweep: `tests/action/compact-evidence/tidy-final/review-TIDY-results.json`.

All five bounded cases pass with no errors or hot reloads. Both profiles serve 22/22, remove both parked spares only after arrival, and retain 8/8 plus every required journey. Actual returned tray-target rectangles are 48×48 and do not overlap the visible footer. The desktop footer is at (1294.31,829), size 117.69×44; phone footer at (254.31,773), size 117.69×44. All controls fit their viewport. Selection hides the bar; × and Escape restore it. A real tray grab/drag and return remain accessible without native text selection, with time and rescued people unchanged. Desktop Next and phone Done both save the improved three-star result.

The desktop/portrait review and phone win captures were opened. The toolbar no longer crosses tray targets, and the phone reward banner remains unobstructed. These bounded cases cover the later UI correction; the complete 24-mission sweep was not repeated afterward.

## Final optional star policy

The human selected **compact final build + solving without hints**. Placement history no longer determines the rating. Three separate earned criteria are visible upfront:

- One star for rescuing every required passenger, including triggered scheduled demand.
- One optional star for leaving at most the shown useful-piece target on the board, with a functional network. Every unlocked board piece counts, including unused parked spares; tray pieces do not. A lifted board piece remains counted, and a held gesture cannot earn compactness.
- One optional star for solving without solution hints. Hint use is latched for the attempt outside Undo snapshots. Retry starts a new attempt; ordinary instructions/settings are not solution hints.

The compact network must preserve each group's bus/rail outbound legs, necessary return routes when demand exceeds aggregate fleet capacity, designated local clinic, height/mode matching and current closures. Removing all roads after arrival cannot earn this bonus. The target counts unique useful reference-piece IDs, with unlocked-inventory fallback for unauthored fixtures; it is achievable, not claimed minimal. The independently discovered mission 13 return remains accepted at four pieces against a six-piece reference.

All trial placements, rotations, waiting and Undo are free of history penalties. The same final layout with the same hint status receives the same rating. Hinted+cluttered, hinted+compact, unaided+cluttered and unaided+compact builds yield 1/2/2/3 respectively. No total star award is forecast before rescue.

After arrival the player can enter untimed cleanup, return spares to the tray and choose Done. An authoritative review flag freezes people/vehicles/time, prevents new wide-road demand or hint use, and survives Undo. Entering review clears pre-rescue Undo snapshots. Existing induced demand is preserved; already rescued people stay immutable. The compact flag can be improved by cleanup or lost by dismantling an essential route.

The thirteen independent cases in `tests/action/stars.test.ts` cover identical-layout history invariance, all four optional-criterion combinations, cleanup versus dismantling, held inventory, persistent hints/Undo/retry, unique targets, aggregate capacity and returns, rail transfer, designated clinic, pending induced demand, compact13, all 24 references/four known alternatives after explicit spare cleanup, and frozen-review guards. The canonical 86-test output is `tests/action/compact-evidence/model-results.txt`.

## Final opening and production records

The lead's current compact-policy opening replay used no authored solution import, hint, progress injection or time hook. It recorded desktop first win 11.123seconds, two desktop mornings including undo/retry 23.965 seconds, and two portrait mornings 10.804 seconds. Errors were empty and hot reload was false. These are expert interaction timings on this host, not naive-student discovery or challenge measurements. Evidence: `tests/action/compact-evidence/opening/record.json`. The opening predates the bounded cleanup-footer correction, which does not change the introductory flow.

The lead owns the final production/offline/stock/focused score checks and their current records under `docs/compact-stars/`. Earlier placement-policy timing and resource measurements remain historical under `polish-evidence/` and must not be presented as the current score policy.

## Projected editing targets and cutaway correction

The first full sweep reached 1–11 and stopped at 12 because a full-height home roof projected over the west ramp target. This was broader than the no-lot case in 24 fallback defect: safe ground footprints alone did not guarantee visible editing access. That interrupted run is preserved under `polish-evidence/blockers/12-before-fix/`, not presented as complete coverage.

The general correction fades foreground architecture/planting during selection/holding, hatches occupied lots, and resolves drops on authored ground heights. Grips remain discoverable; selection ×, Escape, backdrop and cancel restore the opaque architecture. Built land is still protected by the model.

The independent `tests/action/target-coverage.ts` preflight used actual holds and the read-only visible hover hook, with no scene/model calls or injected selection. Results in `polish-evidence/target-coverage/record.json`:

| Profile                   | Initial movable centers grabbed correctly | Held cell-center hovers matched | Actual built-lot drops rejected |
| ------------------------- | ----------------------------------------- | ------------------------------- | ------------------------------- |
| Desktop 1440×900          | 128/128                                   | 552/552                         | 23                              |
| Genuine CDP touch 390×844 | 128/128                                   | 552/552                         | 23                              |

There were no failures, console errors or hot updates. Keyboard retry only isolated probes. This geometric/input coverage is separate from the later earned wins. Final partial hint in 12, phone held-piece view in 24, phone win in 24 and deselected introduction in 1 images were opened: the covered ramp is revealed while editing, the bridge remains held, the win banner is unobstructed, and full architecture restores at rest.

## Limits to carry forward

Mission 23 still resembles the two-bypass pattern taught in 8. It can function as a breather or alternate-solution replay; it should not be described as the peak of the challenge ramp. More untimed riders on a bidirectional complete road alone add waiting rather than a new topology decision.

A tee remains a connectivity junction chosen by the router. The clinic uses a designated site and abstract local walk. Wide road still triggers announced demand without adding simulated speed, seats or headway capacity. See the current curriculum mapping for exact source URLs and the fixed/mobile terminology left unassessed.

Targeted actual captures must be compared with the new architectural mockups under `docs/polish/mockups/`. Loaded assets and a clean console cannot establish attractive art. Check physical roads/ports, landmark occlusion, terrain/height coherence, held previews, new bus/school identity and late-board phone readability. Human first-time comprehension, enjoyment and student learning remain unevaluated by automated checks.
