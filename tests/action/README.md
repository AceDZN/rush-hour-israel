# Hands-on road-puzzle checks

`npm test` runs the current rule fixtures, revised witnesses and independent challenge checks. The earlier easier V3, atlas and route results are historical; atlas/route suites run separately with `test:legacy`/`test:routes`.

- `npm run test:first-minute`: actual elapsed-time replay of expert-inspected first/second mouse and touch interactions, including a wrong corner, local repair, undo and retry. Imports no campaign solution, uses no hint or elapsed-time hook. This is a reproducible control regression, not an unprompted learner study.
- `npm run test:browser`: normal drag, focus/keyboard and genuine touch controls across24 authored boards plus negative/utility cases. It imports witness actions for campaign navigation and advances only elapsed simulation after controls. Never injects road, progress or victory state.
- `COLLECT_BLOCKERS=1 npm run test:browser` collects blocked levels via explicit practice navigation and fails overall if any exist. A clear run remains the normal earned sequence. The isolated old-profile migration fixture is separate from earned campaign evidence.
- `node --import tsx tests/action/target-coverage.ts`: actual pickup/hover checks for every initial free piece and projected cell on desktop and genuine phone touch, plus built-lot rejection. No direct scene/model calls or injected selection.
- `node --import tsx tests/action/stars-browser.ts`: actual controls verify final-build history invariance, hint bonus/reset, frozen endgame tidying, retained connectivity, distinct 1/2/3 outcomes, genuine touch and v5→v6 preservation. Current artifacts are under `compact-evidence/focused/`.
- `node tests/action/static.mjs`: against production preview4303, loads local model/fonts, disables network, drags the first road and verifies6/6 with no console error. Uses elapsed-time hook after the input.

`GAME_URL` changes the browser URL; the default is the development `action.html` alias. `STATIC_URL` overrides the static preview. Playwright uses its installed browser unless `PLAYWRIGHT_EXECUTABLE_PATH` is set. Metal launch flags reflect the macOS verification host; adapt launch flags for another platform. No browser profile, account or student data is stored.

Run against frozen source; hot reload invalidates stateful play evidence. Current captures/JSON are under `polish-evidence/`; opening replay writes `polish-evidence/opening/`, and static production evidence is `docs/polish/actual/production/`. Current interpretation and limits live in `docs/polish/PLAYTEST.md` and `CHALLENGE_REVIEW.md`. The older `evidence/` folder remains historical. Model witnesses establish solvability, not comprehension or fun.

The runtime hook remains version 4; compact/unaided scores use `rush-hour-road-puzzle-v6`. Old score keys stay intact; access/settings migrate from v5, otherwise v4/v3. Scores are earned on full rescue, with optional frozen final-build cleanup. Current score/control evidence is under `compact-evidence/`; older placement evidence in `polish-evidence/` remains historical except unchanged geometry/target checks. See `docs/compact-stars/README.md` for current scope and temporal limits.
