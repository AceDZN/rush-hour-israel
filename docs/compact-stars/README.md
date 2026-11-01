# Compact final builds and unaided solving

On 1 November 2026 the human answered the pending preference question: **“Compact final build + solving without hints.”** This supersedes the interim placement-target rule. Runtime content remains version 4; the independent bonus-score profile is version 6.

## Visible goals

Each goal earns one star:

- Everyone reaches their destination. A partial rescue never saves a completion.
- The final working network uses at most the shown number of movable pieces on the board. Unused parked pieces count, tray pieces do not; fixed roads do not consume this budget. The target is a verified reference footprint, not a claimed optimum. All required service, bus/rail legs and necessary return trips must remain connected, respecting closures and clinic placement.
- No actual solution hint was used in the attempt. Help use survives Undo and cancelled drags; a new attempt resets it. General “connections ready, wait for the bus” feedback does not count as solution help.

Trial placements, rotations, rejected drops, Undo and time do not penalize construction. Identical final layouts have the same compactness regardless of action history or interchangeable part identity. A held piece from the board still counts toward inventory; carrying it cannot fake a smaller final build.

The three labeled goals appear below the instruction. Used/limit numbers are isolated left-to-right inside Hebrew. The hint button explicitly discloses the optional-star tradeoff. Results explain each earned/missed goal independently.

## Optional cleanup after rescue

A player may continue immediately with the earned rating or choose **“לסדר את הבנייה.”** Traffic, people, closure timing and demand stay frozen during review. New wide-road demand is not triggered by cleanup; already scheduled demand is never discarded and must finish before the first win. Only construction edits continue. Clearing all roads fails the working-network requirement, so it cannot earn compactness.

Review starts a fresh construction undo history while preserving the rescued people and hint use. **Done** returns to the result and saves an improved best; **Next** finalizes before moving on. Done/Next sit at the lower right outside the tray, hide while a piece is selected, and remain at least 44 px tall. Review instructions replace the mission instruction. Native text selection is disabled on the game surface to prevent blue selection during dragging.

V6 imports access/settings from v5 first, otherwise v4/v3, and leaves older records intact. New bonus scores start empty because older placement ratings cannot establish compactness or unaided performance. Existing legitimate v6 scores survive reload unchanged.

## Verification and evidence

`npm test`: **86/86**, including all 24 primary witnesses, accepted alternatives and 13 independent final-build/review cases. Meaningful counterexamples cover real 1/2/3 combinations, identical-layout history invariance, unused-spare cleanup, dismantled return/rail/clinic connections, held inventory, hint persistence, replay reset, demand waves and frozen review. The four-piece mission 13 alternative is accepted against the six-piece reference target.

The full real-control sweep completed **24/24 gold results plus 15 recovery/profile/phone cases**, with zero blockers/errors/HMR. Post-arrival cleanup is explicit when needed; the phone final preserves 22 people while reducing ten board pieces to the eight-piece target. `tests/action/compact-evidence/browser-results.json` records the sweep. This complete run preceded the final footer/RTL/native-selection correction; the final bounded desktop/phone24 UI check then passed with zero errors/HMR. Settled 48×48 tray target rectangles clear the footer; selection, × and Escape correctly hide/restore it, an actual returned-piece grab/drag works, native text selection is absent, and Done/Next persist gold without changing time/people. Its record is separate in `compact-evidence/tidy-final/review-TIDY-results.json`.

The final lead-focused run passes **five cases with zero errors** in `compact-evidence/focused/`: many trial placements/rotations and a long wait still earn gold; a real hint yields silver and survives Undo; retry resets it; final mission 24 goes from bloated hinted bronze to valid cleaned silver, loses compactness if a required bridge is removed, and regains it on repair; genuine touch wins the introduction; profile migration preserves old data. These final screenshots were opened and inspected, including the corrected numeric ratio and unobstructed cleanup footer.

The first-minute mouse/touch replay also passes with no errors or HMR. It uses real elapsed time and no plan import/hint/time hook. Its captures are under `compact-evidence/opening/`; it preceded the footer-only refinement. These are expert control regressions, not learner-discovery or performance benchmarks.

The final production build passes. An actual first drag wins 6/6 with all three goals offline after the local assets/fonts load, with no errors. `docs/compact-stars/actual/production/static-check.json` measures **4,343,136 decoded resource bytes** (about 4.34 MB). This is not compressed transfer size or an uncached offline-first claim.

The required develop-web-game stock client ran on final source with supported rotate/pause/resume/wait actions. Its inspected canvas and text state show loaded assets, an intentionally incomplete mission 8, an actual hint used and zero awarded stars. `actual/stock/` is basic control/state evidence; the full-HUD and tidy screenshots above cover the new score UI.

Geometry/assets are unchanged from the architectural pass. Earlier placement-score artifacts remain historical. No new model generation, account action or production deployment. Dev 5303 and preview 4303 remain running. Student enjoyment, unaided puzzle discovery, learning and physical-phone comfort/performance remain for human evaluation.
