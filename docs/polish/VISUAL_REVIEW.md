# Architectural polish — target comparison and frozen scene

31 October 2026. The human accepted grab/rotate/snap but requested harder puzzles and a serious graphics upgrade, selecting **realistic architectural model — restrained materials**. The lead generated and inspected both fresh built-in imagegen targets before this art implementation. Campaign difficulty is independently owned by lead/QA; this review does not claim student enjoyment or learning gains.

## What changed materially

The dark teal void, thick terracotta tray and repeated cream/sage checkerboard were replaced by a light stone surround, thin stone plinth, continuous earth/gravel terrain and quiet precision seams. Road modules retain actual thickness, asphalt, fine curbs, quarter-turn markings, physical lift/turn/snap and finite rack. Every movable module now has a contrasting recessed finger-pull treatment on free edges; anchored pieces retain studs. Amber remains local hover/selection feedback. After mission 2, empty legal ground is uniform and no automatic dark correct-answer sockets appear.

Three original generated colour maps supply asphalt, limestone/concrete and earth. Deterministic fine roughness/bump maps, world-scaled UVs, studio reflection environment, sky fill and a soft 2048 shadow map separate surfaces. The table no longer displays a magnified texture image. Architecture gained recessed window frames/sills, glazing, balconies, parapets, roof solar heaters, entrance steps, courtyard fencing, pavement joints, glazed pickup shelters, lamps and a small bicycle. Olive trees/shrubs now use branched geometry and individual small leaves rather than stacked solid blobs; planting is grouped rather than scattered white pebbles.

Two original private Tripo assets were acquired through the user's Chrome after target inspection: replacement realistic city bus and a single Mediterranean school. They total1,243,624 runtime bytes. Colour maps total2,252,738 bytes, so new requested model/map payload is3,496,362 bytes before engine/font overhead. Exact prompts, rights basis, normal UI costs/downloads, optimization and hashes are in `ASSETS.md` and `assets/TRIPO_PROMPTS.md`. New spend60 credits; crew cumulative90/600, three original generations total. No further generation, purchase, rig or animation processing occurred.

The hero school uses the campaign's explicitly reserved one- or two-cell `landmark.lots` union, oriented within its real safe bounds. The opening school is now about twice the bus length. No adjacent lot is chosen by the renderer. Building hits map to the actual built cell beneath the clicked wing. The existing authoritative ports, endpoint heights, rail terminal shoulder/taper, persistent vehicles and model-owned passenger states remain intact.

## Actual evidence inspected

All final captures waited for `assets.busLoaded`, `schoolLoaded` and `texturesLoaded` before observation. They are actual browser screenshots, separate from the generated targets.

| Capture | What it establishes |
| --- | --- |
| `actual/final-desktop1-ready.png` | Complete loaded architectural opening, substantial bus, larger school/court, neutral material hierarchy. |
| `actual/final-desktop1-held.png` | Real mouse pickup/drag, lifted physical module and matching local target. |
| `actual/final-desktop1-win.png` | Same bus arrived and all6 actual passengers visible in the school court after one placed road. |
| `actual/final-desktop8-ready.png`, `final-desktop8-held.png` | Retuned larger puzzle, four-piece rack plus parked modules, uniform neutral potential ground and quiet seams; no automatic answer route. The held screenshot is an interaction observation, not a solved mission8. |
| `actual/final-portrait24-ready.png`, `final-portrait24-selected.png` | Whole late board and rack at390×844, actual touch selection and counter-clockwise control; the selected corner rotated0→3. |
| `actual/final-art-record.json` | Read-only text states, actual input result, three readiness flags, zero page errors/HMR. First drag correctly placed `first-road` at `2,1`, then6/6. |
| `actual/skill-final/shot-0.png`, `state-0.json` | Required stock develop-web-game action client, actual canvas-only level8 capture, all three asset flags true, inspected after completion. |

Portrait24's minimum distance between adjacent projected cell centers was approximately49.5px. Its selected controls measuredx121.6,width146.8 in a390px viewport; the reverse button remained visible and worked through an actual touch tap. Full late drag/transfer/negative cases and the retuned all24 campaign remain independent QA's coverage, not claims established by these art frames.

A real regression was found during this pass: decorative seam `THREE.Line` objects have a default one-world-unit ray threshold and intercepted drags from a neighboring cell. Picking now accepts visible Mesh hits and ignores hidden ancestors. The failed first drag was replayed through the same normal controls and correctly snapped to `2,1`; no input/state/win injection was used. The final passing screenshots overwrite the failed candidate frames; the correction is recorded here rather than concealed as an immediate first success.

## Performance and deliberate limits

Measured one isolated Metal browser at a time, DPR1 desktop and phone. Initial snapshots briefly reported single-digit FPS during shader/asset setup. A separate after-load observation recorded desktop8 at66.8 then120.0/120.0/120.0 FPS, portrait24 around119.9–120.8 across four samples. The stock client reported117.7 FPS. These are local host observations, not a phone-device guarantee. `actual/fps-after-load.json` retains the samples. TypeScript passed. All owned graphics browsers were closed before lead/QA checks.

The current scene is visibly more architectural and materially detailed than the previous toy board, but the generated references remain more photorealistic and densely dressed. The runtime has lighter procedural planting, rigid simple figures and some generative roof/panel imperfections. Neutral potential routing ground stays deliberately open to preserve placement and the harder spatial puzzle; it is not filled with scenery that hides the solution space. The target's high-density gardens, stonework and perfect CAD-like detailing are not claimed as fully reproduced.

The fresh first-minute recording after the lead's asset-ready tick gate, independent harder-puzzle review and final all24 actual-control sweep are separate verification. No new art source changes will be made autonomously during those runs.

Frozen art source checkpoints:

- `src/action/scene.ts`: `2b3a271936c58a4be1205ab41104e0b2042da92173e375943a1c99492114d55b`.
- `src/action/materials.ts`: `106c1e350c7ee291bfdbbfb69e757d492f9eb44cb3baa54c80a84d800e81000d`.
