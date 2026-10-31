# Rebuild checks

These checks apply to the rebuilt continuous-line game. V1 test results are historical.

Pure rules and all authored witnesses:

```sh
node --import tsx --test tests/rebuild/*.test.ts
```

The campaign test deliberately imports reference paths for solvability. It is not usability evidence. Custom fixtures independently check persistent identity, genuine transfers, finite seats/crossings, all-person access, illegal actions, snapshot undo, retained-fleet retry, closure and service semantics.

First-minute input regression against a running rebuilt preview:

```sh
GAME_URL=http://localhost:5303/rebuild.html node --import tsx tests/rebuild/first-minute.ts
```

This replay imports no campaign/reference solution, injects no progress/plan/win state, and uses no time-step hook. It follows the home/school labels and the intermediate affordance established in the prior visible-UI inspection. It checks real-time boarding/arrival, continuous drag, a grade mistake, recovery, undo, and portrait tap input. Because it automates an already inspected interaction, it is not a naive-player comprehension study. Run against a frozen source: hot reload invalidates the observation.

The browser launcher uses the installed Playwright browser unless `PLAYWRIGHT_EXECUTABLE_PATH` overrides it. The Metal launch flags reflect the macOS verification host; use suitable launch configuration on a different platform. No browser state or student data is saved. Output is under `tests/rebuild/evidence/`; `latest-results.txt` records pure-rule output.

Later full-campaign and targeted control checks:

```sh
GAME_URL=http://localhost:5303/rebuild.html node --import tsx tests/rebuild/later-play.ts
```

`tests/rebuild/all-missions.ts` is a separate normal-control campaign sweep. It uses authored reference routes for navigation and the elapsed-time hook after inputs; its saved results and selected captures are under `docs/redesign/actual/campaign/`.

This run earns progress through all 24 normal UI wins. Its selected cases exercise quiet-street repair, extra fleet/retry, station finishing and continuation, rail transfer, last-community access, conditional widening, closure recovery and final portrait touch routes/service. Non-test missions use reference paths, and only elapsed time is advanced by the supported hook. It is operational evidence, not blind discovery or fun validation.

For a render-only final-mission review after an art correction, `REVIEW_ONLY=24` skips the selected negative cases but still earns 1–23 through normal UI wins, then exercises portrait-24 routes and clinic with touch. It writes separate `evidence/portrait24/` captures rather than replacing the complete later-regression record.
