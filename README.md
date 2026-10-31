# שעת שיא — Rush Hour Israel

A playable, Hebrew-first 3D route-building geography strategy with **24 authored missions**. Draw roads, assign buses, build rail and stops, then repair the bottleneck revealed by a finite rush-hour wave. Individual passengers wait, board capacity-limited moving vehicles, transfer and arrive. Every community must meet its access target.

**Local game:** http://localhost:5303/ · [Public source](https://github.com/AceDZN/rush-hour-israel)

## Play

- Select a road, bus or rail tool, then click/tap two map nodes. Continue to the next node, or drag between nodes.
- Bus links include a road if needed. Add stops at both ends of each service segment. A household can walk only within the shown coverage radius.
- Select upgrade and two endpoints to improve a link. Its inspector lets you choose parallel road/bus/rail services, change a departure phase, upgrade or remove a link. Remove/refund is available during planning.
- **Space:** run/pause · **R:** deterministic retry with the same plan · **Esc:** pause · **F:** fullscreen · **1–8:** tools. Camera controls rotate/tilt/reset; mouse wheel zooms. Touch uses the same node controls, with compact markers and names on selection.
- The wave forecast, queue markers and per-community arrival bars expose the problem. Help and hints pause pressure. A win needs at least 85% timely arrivals in **each** origin group, plus any footprint/nuisance constraint. The shown journey deadline includes walking, waiting, travel and transfers.
- All 24 missions are available from the atlas menu. Best scores/stars stay only in this browser's local storage. Mute and reduced-motion controls are at the screen edge; focus loss pauses play.

## Run and build

Node 22.12+ (Node 24 used here):

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Vite uses strict assigned ports **5303** (dev) and **4303** (preview). Build output is static `dist/` with relative asset URLs, ready for a future deployment. No production deployment is included. No backend, API key, analytics, student account, remote fonts or runtime AI is required. After the initial assets load, the game does not request external services.

The production JS is about 655 KB uncompressed / 175 KB gzip, CSS about 14 KB, locally bundled Hebrew WOFF2 fonts about 15 KB, and the original optimized Tripo bus is 516,128 bytes. Three.js is the principal JS cost. The procedural train, terrain, buildings, routes and queues are code geometry. A measured hardware-accelerated desktop browser session at 1440×900 observed about 119 FPS; software rendering is substantially slower and no universal device performance claim is made.

## Verification and review

- [PLAYTEST.md](PLAYTEST.md): independent pure-rule checks, all 24 baseline wins, all 24 instructive near-miss losses, alternative plans, real-control browser outcomes, touch and utilities.
- [VISUAL_REVIEW.md](VISUAL_REVIEW.md): actual browser captures compared with the generated targets, including repaired road occlusion and readable rail/train geometry.
- [ASSETS.md](ASSETS.md): original Tripo bus provenance, normal Chrome UI generation/download, paid-account license basis, prompt, hashes, optimization and runtime path. One 30-credit generation; no purchase.
- [CURRICULUM.md](CURRICULUM.md): every mission mapped to exact supplied Workbook snapshots and URLs; source discrepancies recorded.
- [GAME_IDENTITY.md](GAME_IDENTITY.md): first-minute loop and art/interaction direction.

The pure deterministic model is in `src/model.ts`; authored scenarios and reference plans are in `src/levels.ts`; rendering is separate in `src/scene.ts`. `window.render_game_to_text()` exposes observable state and `window.advanceTime(ms)` advances only running simulation. Browser tests use actual UI inputs; the time hook does not inject a win or modify a plan. The first time it is called, it switches that browser session to explicit stepping for reproducible captures.

## Scope and limits

Maps, budgets, headways, grades and capacities are original schematic teaching scenarios, **not current Israeli infrastructure, exact GIS or engineering values**. Coast/west, inland highlands and eastern lowland relationships remain readable. Geography changes route validity, cost, time and access. The source's conflicting fixed/mobile infrastructure wording is not assessed. The induced-demand event is an explicit conditional scenario, not a claim that every road expansion fails.

This is a finite-wave strategy, with service segments and a simplified deterministic routing model. Settlement detail is deliberately sparse for route legibility. Design targets are generated images; they are separate from actual gameplay evidence. Curriculum review and software tests do not establish learning gains or classroom usability; student evaluation remains future work.
