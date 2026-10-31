# Living-town scene review

31 October 2026. This review concerns the redesign under `src/rebuild/`, after the human rejected the earlier implementation. It does not carry forward the old visual approval or claim that student comprehension/fun has been established.

## Target and actual implementation

The selected beginner target is `mockups/03-first-minute-target.png`, generated and inspected before this scene was implemented. Targets 01/02 explored the direction; 03 removes the slope trap and second route from the first mission. Exact built-in prompts and limitations are preserved in `mockups/PROMPTS.md`.

The new scene uses original procedural houses, school courtyard/gate, clinic, station, streets, broadleaf trees, shore and rigid backpack figures. It reuses the existing original Tripo bus. No new Tripo generation, processing credits, external character models or purchases were used. The figures move as rigid markers; no deforming character or facial animation is represented.

Implemented changes against the old scene:

- Active places and the bus are much closer. The first desktop bus is roughly 180 px long in a 1600×900 capture; the eight backpack figures form a readable group around 45 px high. This supersedes the audit's too-small 28–40 px bus suggestion.
- A continuous street joins one inhabited home cluster and one recognizable school in mission 1. Three house silhouettes, a school gate, painted play court, benches and actual waiting/arrived figures convey place use.
- Blue coast, deeper herbal green ground, terracotta roofs and grouped faceted broadleaf trees replace the beige slab and repeated pine cones. First-map grove candidates were reduced to keep buildings/people dominant.
- Drawing gets a continuous local ghost following the authored street under the pointer, then a navy/ochre service ribbon. Streets, line geometry and vehicle positions all use the authored corridor points, including via points and reversal.
- The same bus model waits before the first line and remains visible through the modeled trips. Short visual boarding transitions lead into the bus; arrived figures stand in the school court. Reduced motion clears boarding transitions immediately.
- Portrait framing turns the trip vertically and trims unnecessary foreground sea. The camera projects a public `northAngle` so regional missions can show a correct north cue after the camera rotates.
- Planned service sites are construction pads with a plus sign and “אתר מרפאה +”; the actual clinic appears only when the model opens it.

## Actual evidence inspected

The files named `actual-scene-draft-*` are explicitly scene-only harness captures and do not prove gameplay. The following images use the live rebuilt UI and actual controls:

| Evidence | What was exercised |
| --- | --- |
| `mockups/actual-first-frame-desktop.png` | Fresh mission 1, eight waiting children, substantial bus and simple goal; no welcome dialog or editor toolbar. |
| `mockups/actual-first-gesture-desktop.png` | Real pointer down/drag in progress, continuous route ghost before reaching the school. |
| `mockups/actual-first-arrivals-desktop.png` | Real route drag, then the public deterministic time hook to t=6; six children in the courtyard, two still waiting, same bus returning. |
| `mockups/actual-first-frame-portrait.png` | Fresh 390×844 portrait layout, vertical trip, readable endpoint labels and bus/people; no desktop board shrunk into a minimap. |
| `mockups/actual-first-arrivals-portrait.png` | Actual two-tap route construction, then t=6; same 6/8 result. |
| `mockups/actual-service-site-before.png` / `actual-service-site-open.png` | Actual mission 19 UI: construction pad before opening, clinic card + site tap changes the model and reveals the clinic. |
| `mockups/skill-first-minute/shot-0.png` and `state-0.json` | Required develop-web-game action client, real UI taps and deterministic advance; state and canvas show 6 arrived, 2 waiting, same vehicle ID returning. |

`mockups/actual-first-control-state.json` preserves the corresponding observable desktop model state. `mockups/actual-first-console.json` is empty. TypeScript checking passed after the final scene changes. The stock client's SwiftShader FPS is not a hardware performance benchmark.

The lead separately captured real-clock first play and a nonmodal 8/8 win in `actual/01-ready.png`, `02-moving.png`, `03-first-win.png`. Independent geography/gameplay QA is responsible for its own broader input and campaign checks.

## Differences and limits

The generated image includes photographic roofs/foliage, detailed children and extra decorative props. The implementation deliberately uses simpler authored geometry and flat materials. The actual scene keeps the target's action hierarchy, recognizable places, blue/green/terracotta direction and close bus/people scale. It is not a claim of pixel-level reproduction.

Portrait buildings are viewed more from the side because the trip is turned vertically; endpoint labels and the court remain visible. Later crowded landmarks shrink with neighbor spacing to avoid building intersections. These choices need a fresh player's assessment rather than an internal claim that the experience is now intuitive.

A minor acute-corner grass wedge was observed where independent street ribbons meet in mission 19. Shared curb/asphalt intersection caps were added in one final rendering batch before the verification freeze, so the branch forms one continuous street. This does not change routing, terrain costs or capacity.

Final intersection-cap verification: ran the unmodified develop-web-game action client with a Metal ANGLE launch adapter against mission 19 after the last source edit. Inspected `mockups/skill-street-junction/shot-0.png`; the acute junction is now a continuous rounded road, with no grass wedge, and the unopened clinic remains a construction pad. Matching state is saved beside it; no client error file was produced. Source was then left frozen for independent first-minute and 24-mission verification.
