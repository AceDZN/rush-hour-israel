# שעת שיא — הדרך בידיים שלכם

A real 3D **hands-on road rescue puzzle** for Hebrew-speaking students. Grab a chunky road piece, rotate it, snap it into the town, and the same waiting bus resumes. Six children and one missing road make the first action clear. Twenty-four authored boards add new physical problems gradually.

[Play locally](http://localhost:5303/?level=1) · [Public source](https://github.com/AceDZN/rush-hour-israel) · [Fresh gameplay mockups](docs/action-puzzle/mockups/README.md)

The human explicitly chose **“Grab and rotate roads; rescue the bus”** after rejecting the earlier graphics and route-drawing flow. Two fresh built-in imagegen mockups were generated and inspected **before** the action runtime. They establish a close teal/ivory/terracotta tabletop direction. An impossible corner connection in the first generated image was rejected; actual ports, heights and vehicle curves share one model.

## Play

- **Drag** a loose road from the physical tray or board into a cell. **Tap an installed free piece** to turn it a quarter turn. Tiles snap to position, retaining your chosen orientation.
- Touch alternative: select a tray piece, use the large **סיבוב** control if needed, then tap the board. Grabbing a road leaves a real gap; buses brake instead of driving through its ghost. An occupied/reserved piece stays safely locked.
- **Q / E** turn the selected piece. **Z / ↶** undo the complete board-and-simulation change. **R** starts the same morning again. **Space / P** pause. **F** fullscreen. **Escape** cancels a held piece or pauses.
- **↓ למגש** or dragging back to the tray returns a piece. Board-to-board drags can exchange two free pieces when both supports are legal. Keyboard focus + Enter selects/places the same objects.
- The bus starts and stops automatically. It keeps its passengers through bends and returns when its six seats cannot hold everyone. Later one-way roads need a repaired return loop, bridges have finite occupancy, ramps must match height, and rail requires an actual transfer.
- Completion is untimed. Move-efficiency stars support replay. The menu contains sound, reduced motion, retry and the 24-morning selector. A small optional hint highlights one useful piece.

Progress/settings stay in local browser storage under `rush-hour-road-puzzle-v3`. Sequential wins unlock the next morning. `?level=1..24` opens a deliberate practice board without fabricating earlier progress. No student data or analytics leave the browser.

## Run

Node 22.12+; Node 24 used here.

```sh
npm ci
npm run dev
npm test
npm run test:first-minute
npm run test:browser
npm run build
npm run preview
```

Strict dev **5303**, static preview **4303**. Relative asset URLs, locally bundled font/GLB, no backend, key, runtime AI or external asset call. The original permitted Tripo bus is reused; no new generation or credits. No production deployment is included.

## Evidence and source

[Design](docs/action-puzzle/DESIGN.md), [art direction and target critique](docs/action-puzzle/ART_DIRECTION.md), [playtest record](docs/action-puzzle/PLAYTEST.md), [all 24 curriculum mappings](docs/action-puzzle/CURRICULUM.md).

`src/action/model.ts` owns reciprocal ports, directional rules, heights, finite inventory, passengers and vehicles. `campaign.ts` contains authored boards; `scene.ts` renders physical pieces from that contract; `main.ts` handles actual input. `window.render_game_to_text()` exposes visible state and screen targets; `window.advanceTime(ms)` advances elapsed simulation for rule/browser verification. The first-minute replay uses real time and imports no campaign solution. Other campaign sweeps use authored witnesses through actual controls, never injected road plans or wins.

V1 and route-drawing V2 remain historical in Git, `docs/archive/`, `src/main.ts` and `src/rebuild/`. Their test counts do not carry forward. `test:legacy` and `test:routes` run those suites separately.

Maps are original schematic teaching boards, not exact GIS, engineering values or current Israeli infrastructure. The optional north cue follows camera orientation. Quiet land, terrain support and service location change useful moves. Walking and induced demand are explicitly simplified authored scenarios; wider tiles do not demonstrate extra traffic capacity. Student enjoyment, discovery and learning require human evaluation.
