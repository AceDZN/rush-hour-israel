# שעת שיא — הדרך בידיים שלכם

A real 3D **hands-on road rescue puzzle** for Hebrew-speaking students. Grab a road module, rotate it, snap it into the town, and the same waiting bus resumes. Two short introductions teach the gesture; the other twenty-two boards require assembling and revising a finite network. The current visual direction is a realistic architectural model with restrained stone, asphalt, glazing and landscape.

[Try a challenge](http://localhost:5303/?level=4) · [Learn the controls](http://localhost:5303/?level=1) · [Public source](https://github.com/AceDZN/rush-hour-israel) · [Architectural mockups](docs/polish/mockups/README.md)

The human accepted the grab/rotate/snap loop, then found the layouts too easy and the graphics poor. They selected **“Realistic architectural model — restrained materials.”** Two fresh architectural imagegen targets preceded this art pass. New original Tripo bus/school assets, fine material maps, articulated facades and thin road modules replace the earlier toy-board treatment. Actual ports, heights, reserved building lots and vehicle curves remain authoritative.

After the introduction, current reference plans manipulate four to eight pieces, with up to ten movable pieces including alternatives. Several are misplaced on the board rather than crowding the four-slot tray. Boards 4, 8 and 23 accept different complete networks using the same inventory; independent play also found a four-piece return in 13 that leaves two reference pieces unused. Return arrows, bridge/ramp allocation, protected land and all-group access create legal but incomplete plans. These counts are authoring observations, not minimum requirements or measured student difficulty. Morning 23 is an open-solution replay before the final combined challenge.

## Play

- **Drag** a loose road from the physical tray or board into a cell. **Tap an installed free piece** to turn it a quarter turn. Tiles snap to position, retaining your chosen orientation.
- Touch alternative: select a tray piece, use the large **סיבוב** control if needed, then tap the board. Grabbing a road leaves a real gap; buses brake instead of driving through its ghost. An occupied/reserved piece stays safely locked.
- **Q / E** or the two visible turn controls rotate in either direction. **Z / ↶** undo the complete board-and-simulation change. **R** starts the same morning again. **Space / P** pause. **F** fullscreen. **Escape** cancels a held piece or clears selection; with no selection it pauses.
- Tall architecture cuts away while editing so ground and pieces stay visible. **×**, Escape or a backdrop tap leaves selection and restores the full model. Building lots remain occupied and reject roads; the cutaway does not change any rule.
- **↓ למגש** or dragging back to the tray returns a piece. Board-to-board drags can exchange two free pieces when both supports are legal. Keyboard focus + Enter selects/places the same objects.
- The bus starts and stops automatically. It keeps its passengers through bends and returns when its six seats cannot hold everyone. Later one-way roads need a repaired return loop, bridges have finite occupancy, ramps must match height, and rail requires an actual transfer.
- Stars have three independent goals: everyone arrives; the final working build stays within the shown movable-piece target; and no solution hints are used. Trial placements, rotations and time do not affect the score. Unused board pieces count, tray pieces do not. After rescue, optional frozen cleanup lets you remove leftovers while retaining usable connections. Hint use survives Undo/cancel until a new attempt. V6 scores keep old records intact and migrate access/settings. The menu contains sound, reduced motion, retry and all 24 mornings.

Progress/settings stay in local browser storage under `rush-hour-road-puzzle-v4`. Previously unlocked mornings and preferences migrate from v3; old scores for easier layouts remain in the old record rather than becoming new-layout scores. Sequential wins unlock the next morning. `?level=1..24` and the introductory sample-challenge link open practice without fabricating earlier progress. No student data or analytics leave the browser.

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

Strict dev **5303**, static preview **4303**. Relative asset URLs, locally bundled fonts/models/maps, no backend, key, runtime AI or external asset call. This polish uses two new original private Tripo generations through the user's Chrome, 60 new credits and 90 cumulative; provenance is in `ASSETS.md`. No production deployment is included.

The current model/maps total about 3.50 MB; the measured final production load is 4,343,136 decoded resource bytes (about 4.34 MB), including application/fonts. Initial simulation waits for the actual bus, school and all three material maps; it does not consume boarding time while those assets load. Production load and offline checks are recorded with the current evidence.

## Evidence and source

[Current bonus-star rules and verification](docs/compact-stars/README.md), [architectural plan](docs/polish/PLAN.md), [challenge review](docs/polish/CHALLENGE_REVIEW.md), [visual comparison](docs/polish/VISUAL_REVIEW.md), [playtest record](docs/polish/PLAYTEST.md), [all 24 curriculum mappings](docs/action-puzzle/CURRICULUM.md).

`src/action/model.ts` owns reciprocal ports, directional rules, heights, finite inventory, passengers and vehicles. `campaign.ts`, `authoring.ts` and `challenges.ts` author the revised boards; `scene.ts`/`materials.ts` render them; `main.ts` handles actual input. `window.render_game_to_text()` exposes visible state, actual asset readiness and screen targets; `window.advanceTime(ms)` advances elapsed simulation after assets load. The opening replay uses real time and imports no solution. Other sweeps use authored witnesses through actual controls, never injected road plans or wins.

V1 and route-drawing V2 remain historical in Git, `docs/archive/`, `src/main.ts` and `src/rebuild/`. Their test counts do not carry forward. `test:legacy` and `test:routes` run those suites separately.

Maps are original schematic teaching boards, not exact GIS, engineering values or current Israeli infrastructure. The optional north cue follows camera orientation. Quiet land, terrain support and service location change useful moves. Walking and induced demand are explicitly simplified authored scenarios; wider tiles do not demonstrate extra traffic capacity. Student enjoyment, discovery and learning require human evaluation.
