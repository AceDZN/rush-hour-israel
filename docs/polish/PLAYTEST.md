# Architectural/challenge verification — historical scoring checkpoint

The placement-target scoring below records commit `1b6119b`. The later explicit human preference supersedes it; see [current final-build/unaided rules and checks](../compact-stars/README.md). Architectural input/geometry evidence remains relevant.

Current runtime: version 4, `src/action/`, 24 authored grab/rotate/snap boards. The first two are short introductions; later boards require finite-piece planning, including supported bridges, height-matched ramps, return routes, transfers and local access. Reference plans are witnesses, not optimality claims. See `CHALLENGE_REVIEW.md` for alternatives, counterexamples and the informed pilot method.

## Human-reported star confusion

The old rule compared placements plus individual quarter-turns to an invisible reference action count. In morning 1, any extra rotation could lose a star even though the final road was equally good. The human correctly identified a missed piece in morning 5 themselves; that connection was not a solvability defect.

Stars now form an optional placement challenge, with the current count and three-star target shown before input. Three stars require at most the target; two allow two extra placements; any other completed rescue earns one. Rotations, rejected/cancelled/same-origin drops, tray returns, hints and time are free. A swap is one placement; Undo restores the counter. Every score still requires everyone to arrive. The targets are verified reference placement counts, not optimality claims. Route-length bonuses were rejected because the known alternative layouts mostly have equal lengths; completion-only stars were also rejected as redundant by the human.

Placement scores use `rush-hour-road-puzzle-v5`. V4 (or V3 if absent) unlocks/settings migrate, while old score records remain untouched and new-rule scores start empty. Previously completed mornings remain accessible. The game does not fabricate new three-star performances from completion alone.

`tests/action/stars-browser.ts` uses actual keyboard/pointer/touch controls in isolated profiles. Nine trial rotations, an incorrect orientation, more than a minute of simulated waiting and a hint still earn three when only one placement is committed. The same final rescue earns two after two placements and one after four. Tray returns are free; Undo/retry and the visible replay restore the count. Genuine 390×844 touch uses six visible rotations and tap-to-place, then earns three. The phone banner fits; the sample link and placement target do not overlap. An isolated old profile verifies preserved scores/access/settings and no unearned new score. `polish-evidence/stars/record.json` records six passed cases with zero errors; its desktop/phone/rules/reward captures were opened and inspected.

## Physical editing and complete campaign

Earlier independent testing caught decorative seam raycasts stealing drops, no-lot facades hiding pieces/clinic ground, and a full-height house covering a ramp target. The renderer now ignores decorative lines, keeps fallback facade footprints out of playable strips, and visibly fades architecture during selection/holding. Ground-height placement remains subject to normal built/terrain/occupied rules. Selection ×, Escape and backdrop restore observation. These are general editing corrections, not per-level test bypasses.

The frozen geometric preflight used real pointer holds and genuine CDP touch across all boards: 128/128 movable centers selected correctly, 552/552 held cell-center hovers matched per profile, and 23 built-lot drops rejected per profile. Errors and HMR were empty. `polish-evidence/target-coverage/record.json` is coverage evidence, distinct from completed journeys.

The full normal-control campaign is recorded in `polish-evidence/browser-results.json`: sequential wins, all-person/group conservation, persistent progress and additional recovery, hint, migration, utilities and phone cases. It uses authored plans through real controls plus elapsed-time acceleration, never injected actions, routes or wins. The final placement-policy sweep passed 24/24 sequential three-star wins plus 14 recovery/profile/phone cases, with zero blockers/errors/HMR. It additionally asserts three stars for every reference win. The independent model suite passes 81/81. Independent model fixtures include exact star thresholds, free rotations/cancel/tray gestures, undo/retry and alternative-route scoring cases. Their current results are in `polish-evidence/model-results.txt` and the challenge review.

After that full sweep closed, review found the UI’s one-win save guard was not cleared by Undo. Both button and Z now reset it after a successful rewind. A later focused real-control case earns bronze in a fresh profile, rewinds with both inputs, then earns and persists gold without retry. The displayed and saved score change from one to three. The six-case focused run, rebuilt offline preview and required stock client passed after this guard correction; the full sweep is not claimed to have rerun after it.

## Opening, production and required skill client

The lead's real-time opening replay imports no solution, hints, progress or elapsed-time hook: first desktop rescue 4.264 seconds; first two with undo/retry/replay and wrong-turn recovery 15.274 seconds; portrait two 9.440 seconds. `polish-evidence/opening/record.json` has zero errors and no hot reload. This final opening replay uses the placement rule and v5 persistence; both introductions earn three with one placement and free orientation changes. Desktop/portrait win captures were opened and inspected. Timings do not measure learner discovery.

The final production build passes. `actual/production/static-check.json` verifies loaded models/fonts/maps, network disabled, an actual pointer drag, six arrivals and three stars with zero errors. Initial decoded resource bodies total **4,340,889 bytes** (about 4.34 MB), including approximately 3.50 MB of models/material maps. This is decoded resource size, not a promised download speed or physical-phone performance result.

The required develop-web-game stock client ran after the final star UI change using its supported right/space actions, hint selection, rotation, pause/resume and waiting. `actual/stock-final/shot-0.png` and `state-0.json` were opened: actual assets ready, selection cleared, full architecture restored and an intentionally incomplete morning 8 at zero arrivals with a three-star forecast within the placement target. No reward is saved until full completion. The stock client captures the canvas only; full-HUD reward proof is in the focused star captures. It is not a campaign-win or fun test.

## Visual and evaluation limits

Fresh built-in generated gameplay targets and original material sources preceded implementation. Two original Tripo generations add the architectural bus and school, with 60 new credits / 90 cumulative; all three authorized generations have been used. `ASSETS.md` records provenance and optimization. Actual materials, facade depth and shadows are more developed, but sparse planting/homes and open beige land remain visibly simpler than the targets. `VISUAL_REVIEW.md` records the comparisons and corrections without claiming human visual acceptance.

No production deployment. Dev 5303 and static preview 4303 remain available. These checks establish observed functional behavior on the host; student enjoyment, learning, unaided puzzle discovery and physical-phone comfort/performance require human evaluation.
