# Challenge, visual and placement-star review

Status: independent model/content, informed pilot, target coverage, earned campaign, migration, hint/recovery and phone controls are complete. Runtime content remains version 4; the final placement-score namespace is version 5. Earlier scoring and browser records remain historical. Lead opening, production and focused scoring checks are recorded below.

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

Run `node --import tsx --test tests/action/*.test.ts` from the repository root. The current **81/81** comprises twenty-two standalone rule fixtures, twenty-four primary witnesses, ten campaign counterexample/layout/service checks, seventeen challenge checks and eight placement-star checks. Standalone conservation, persistent identity, occupied/held transactions, height/mode, finite bridge, station transfer and service rules remain strict.

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

`tests/action/browser.ts` is updated for hook version 4, the final v5 score namespace, negative quarter-turns using Q and the visible counterclockwise phone button. The full sweep still uses actual drags/focus/keys and the read-only text hook; it does not inject a path, model action or victory. Its witness-assisted campaign replay is functional evidence, distinct from the pilot method above.

Isolated profile fixtures verify the final migration: version 5 imports access/settings from version 4 first, otherwise version 3, leaves both old records untouched, and starts new placement scores empty. An on-screen preview does not create a score, and the practice sample awards nothing by itself. Existing legitimate v5 silver/bronze ratings remain unchanged on reload; there is no automatic completion-to-gold promotion. These fixtures are separate from the fresh earned-campaign profile.

The additional partial-hint check in 12 leaves the east corner unfinished while the correctly counterclockwise-oriented ramp is already in place. The hint should identify the unfinished corner and preserve people; it must not mistake `-1` for a different orientation from `3`.

The final earned-control run completed **24/24 sequential wins**, with every required person served, all 24 reference builds earning three stars within their placement targets, and unlock 24 persisted. `tests/action/polish-evidence/browser-results.json` records **zero blockers, zero errors, no Vite updates/reloads and `hmr.interrupted=false`**. It took about 134 seconds with later travel acceleration; that is an expert functional sweep, not a student challenge-time measurement. All three asset-ready flags were required before input.

All fourteen additional cases passed:

- Mistakes and repair: the wrong corner and nonmodal hint in 2, rejected ordinary road on water in 11, return-network repair after the first six arrivals in 13, and recovery after closure in 22.
- Transfer and guidance: a station wait and two actual boardings in 14, and a partial hint in 12 that preserves the already correct counterclockwise ramp and all people.
- Editing: real held-road removal/cancel in 3; selection ×, Escape and backdrop exit without charging or pausing.
- Utilities: undo, pause, menu, settings, mute, reduced motion, fullscreen, resize, retry and the blur handler, followed by successful play.
- Profiles: v4-first and v3-fallback migration into v5, untouched old records, fresh placement scores, no award from the practice preview, and preservation of existing v5 silver/bronze ratings.
- Phone: actual clockwise/counterclockwise/close controls and complete touch play of 24, including inventory cleanup and a held bridge.

At 390×844, genuine touch returned both legal spares to the tray, held the bridge during a live drag, then placed the bridge/ramp/corners/clinic and served 22/22. Inventory was conserved. The enlarged selected-actions bar fit; the reward bounds were (14, 582.5) with size 362×139.5. The final phone run used eight placements against a target of eight and earned three stars, despite nineteen legacy diagnostic input moves; rotations and returning spares were free. Held, moving and win captures were actually opened. This is emulated touch behaviour, not a physical-phone comfort/performance study.

The renderer readiness hook includes bus, school and all authored texture loads. A fallback cannot silently count as upgraded-art evidence.

## Final optional star policy

Stars measure a visible construction challenge, not time, rotation count or assistance:

- A successful commit into a different board cell counts as one placement; swapping two pieces counts once.
- Rotations, rejected drops, cancelled drags, returning to the original cell, returning to the tray, time and hints are free.
- Undo restores the placement count. Retry starts a fresh attempt.
- Three stars require placements at or below the shown reference target; two require at most target+2; one is awarded for any other completed rescue. Rescue itself has no hard placement limit.
- The current count, target and projected stars appear before completion. A score is saved only after all required passengers arrive. The reference target is verified achievable, not claimed optimal.

The eight independent cases in `tests/action/stars.test.ts` cover identical final first-level networks at target/target+1/target+2/target+3, forty free rotations and sixty-five seconds, rejected/cancel/same-origin/tray actions, direct/held swaps, undo/retry, compact 13 at four placements against six, all late reference/known alternate builds, and a gold preview that cannot bypass scheduled widening passengers. `model-results.txt` is the canonical 81-test output.

After the complete browser sweep closed, the lead fixed one additional UI guard: successful Undo now clears `savedWin` for both the button and Z, so an improved run updates its displayed and stored rating. The later six-case actual-control scoring check passed, including fresh bronze 1 → Undo with both controls → gold 3 without retry. Its inspected captures also cover identical final intro networks earning 3/2/1 at 1/2/4 placements, free exploration, hints/time/tray, replay reset and profile migration. This focused check is later than the full sweep; the entire campaign was not rerun after that small guard correction.

## Final opening and production records

The lead's isolated opening replay used no authored solution import, hint, progress injection or time hook. It recorded desktop first win 4.264 seconds, two desktop mornings including undo/retry 15.274 seconds, and two portrait mornings 9.440 seconds. Errors were empty and hot reload was false. These are expert interaction timings, not naive-student discovery or challenge measurements. Evidence: `tests/action/polish-evidence/opening/record.json`.

After the Undo guard fix, the lead's final build/static/stock checks passed. The production build served 6/6 offline after assets/fonts loaded, with a real pointer drag and later elapsed-time acceleration, no errors and **4,340,889 bytes** of decoded resource bodies (about 4.34 MB). This is offline after load, not an uncached offline first visit or compressed transfer-size claim. Evidence: `docs/polish/actual/production/static-check.json`; stock and focused scoring captures were inspected by the lead.

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
