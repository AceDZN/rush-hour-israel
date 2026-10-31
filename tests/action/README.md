# Hands-on road-puzzle checks

`npm test` runs the independent V3 fixtures and authored witnesses. Prior atlas/route suites are historical and run separately with `test:legacy`/`test:routes`.

- `npm run test:first-minute`: actual elapsed-time replay of expert-inspected first/second mouse and touch interactions, including a wrong corner, local repair, undo and retry. Imports no campaign solution, uses no hint or elapsed-time hook. This is a reproducible control regression, not an unprompted learner study.
- `npm run test:browser`: normal drag, focus/keyboard and genuine touch controls across24 authored boards plus negative/utility cases. It imports witness actions for campaign navigation and advances only elapsed simulation after controls. Never injects road, progress or victory state.
- `node tests/action/static.mjs`: against production preview4303, loads local model/fonts, disables network, drags the first road and verifies6/6 with no console error. Uses elapsed-time hook after the input.

`GAME_URL` changes the browser URL; the default is the development `action.html` alias. `STATIC_URL` overrides the static preview. Playwright uses its installed browser unless `PLAYWRIGHT_EXECUTABLE_PATH` is set. Metal launch flags reflect the macOS verification host; adapt launch flags for another platform. No browser profile, account or student data is stored.

Run against frozen source; hot reload invalidates stateful play evidence. Final captures/JSON are under `evidence/`, and the current interpretation and limits live in `docs/action-puzzle/PLAYTEST.md`. Model witnesses establish solvability, not comprehension or fun.
