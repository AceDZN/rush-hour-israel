# שעת שיא — Rush Hour Israel

A rebuilt 3D transport puzzle for Hebrew-speaking students: **draw a route, watch people board a bus, and bring them to school or services**. The first morning has eight visible students, one school, one route gesture, and no failure clock or setup toolbar.

[Play locally](http://localhost:5303/) · [Rebuild preview](http://localhost:5303/rebuild.html) · [Public source](https://github.com/AceDZN/rush-hour-israel)

## What changed after human feedback

The human rejected the first version as ugly, unclear, boring and too difficult to operate. The new version was replanned using other Workbook games as read-only references. Three fresh built-in imagegen gameplay mockups were generated and inspected before implementation. They are saved with exact prompts in [docs/redesign/mockups/PROMPTS.md](docs/redesign/mockups/PROMPTS.md).

- A close, inhabited town replaces the remote beige atlas: recognizable homes, school courtyard, clinic, large buses and backpack figures.
- Drawing a complete line automatically supplies stops and starts service. Continuous strokes keep intermediate bends.
- The same bus continues through junctions, returns and collects remaining passengers. It does not disappear and create a new boarding at every segment.
- Introductory goals use exact people counts. There is no mandatory time limit; time and route efficiency award optional stars. Explicit quiet-street and footprint constraints remain in relevant missions.
- Mistakes have local feedback and an Undo action. A small success banner leaves the town moving and visible.
- Fleet, rail and local-service actions appear gradually across 24 authored missions. The campaign unlocks sequentially; completed mornings can be replayed.

## Controls

**Drag from a place to its destination along the streets.** Bends and crossing choices follow the gesture. Release at the destination to start service.

Tap alternative: tap the origin, intermediate points and destination. At a station, continue tapping to extend the same line or press **סיימו כאן ✓** to finish it. Ordinary school/job/clinic destinations finish directly. Keyboard focus + Enter uses these same buttons.

- Select a line to add a bus or redraw it. When only one line exists, the bus card can add directly; it can also be dragged onto a line.
- Rail becomes available later. A clinic card opens a marked construction site; an unopened site cannot satisfy health demand.
- **↶ / Z:** rewind the last change, including the modeled moment. **P / Space:** pause. **R:** retry the same network and fleet. **F:** fullscreen.
- Help/settings pause play. Sound, reduced motion, restart and fullscreen are in the menu. Leaving the page pauses active play.
- Progress and settings stay only in local browser storage. `?level=1..24` deliberately opens a particular mission for practice without inventing earlier completions.

## Run

Node 22.12+ (Node 24 used here):

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Strict dev port **5303** and preview **4303**. Static build uses relative URLs. No backend, runtime AI, key, student account, remote fonts, analytics or external asset service is needed. The existing original Tripo bus and Heebo fonts are bundled locally. No new Tripo credits were spent on this rebuild. No production deployment is included. The measured production first-load resource bodies total about **1.22 MB**, including the bus; the JS bundle is about 677 KB uncompressed / 181 KB gzip.

## Verification and evidence

[Rebuilt playtest record](docs/redesign/PLAYTEST.md) distinguishes new tests and real input observations from the rejected version's historical checks. [Scene review](docs/redesign/SCENE_REVIEW.md) compares actual desktop/portrait play to the new generated targets and records remaining fidelity differences. [Curriculum mapping](docs/redesign/CURRICULUM.md) maps all 24 missions to the exact supplied Workbook source snapshots.

`src/rebuild/model.ts` is the new deterministic persistent-vehicle model. `campaign.ts` defines the missions, `scene.ts` renders the town, and `main.ts` handles gestures and progressive UI. `window.render_game_to_text()` exposes visible state; `window.advanceTime(ms)` supports deterministic verification. Browser tests use normal controls and never inject a plan or win. The first-minute checks use actual elapsed time, without a solution oracle or time acceleration.

The prior source and reports are retained as historical material in Git and `docs/archive/v1/`. Their 69-test result is not evidence for the rebuilt game. `npm run test:legacy` runs those historical checks separately.

## Scope

Maps, grades, budgets, capacities and compressed time are original schematic teaching scenarios, not present-day Israeli infrastructure, exact GIS or engineering values. Relief, crossings, carrying capacity, service reach and the small peripheral community change the useful plan. A north cue appears on regional maps, including portrait orientation. The transport snapshot's conflicting fixed/mobile wording remains unassessed.

The town uses simpler authored geometry than the generated concepts. Rigid passenger figures and a procedural railcar accompany the original Tripo bus. The original quiet Web Audio groove and cues are locally generated. Automated checks and an experienced-agent inspection cannot establish that a new learner finds this fun or intuitive; the human's next playtest remains the relevant feedback.
