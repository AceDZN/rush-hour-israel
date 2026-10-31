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

- `src/action/scene.ts`: `b0731f4e926305cf8435f74f3f7d14d553545d69ea2b5f8493f8bc7b4bbfa5aa`.
- `src/action/materials.ts`: `106c1e350c7ee291bfdbbfb69e757d492f9eb44cb3baa54c80a84d800e81000d`.

## No-lot facade obstruction correction

Independent frozen-pilot QA found another real obstruction in mission24: a no-lot home on5,4 obscured the planned clinic cell5,3 from the fixed camera, causing a normal drop to hit the home. The coastal no-lot home also threatened the parked movable road on0,2. This was physical projection/geometry, not a reason to bypass picking.

Audited every no-lot landmark: eight cases across13/18/22/24. Fallbacks now rank unused roadside strips away from service plots, reserved roads and parked pieces, preferring outside/built neighbors. Their entire facade, including balcony, heater and steps, is a shallow low architectural relief within the pickup cell's unused strip. The full architecture on explicit building lots is unchanged. Pickup shelter and waiting figures use an unused curb side rather than occupying the fallback facade or a road port.

Verified through actual portrait CDP touch: clinic snapped to5,3, the coastal road was grabbed from0,2 (held screenshot) and placed on1,2. The ordinary desktop first drag still reached6/6 with all assets ready and no page errors. Opened and inspected13/18/22 fallback review captures and24 ready/placed/held captures under `actual/fallback-fix/`; `record.json` retains the input results. TypeScript passed, browser closed and scene frozen again. The low no-lot relief is a deliberate space/visibility compromise, not an invented adjacent building parcel. Independent QA retries the full pilot/campaign on this corrected checkpoint.

## General editing cutaway and ground-surface placement

The next independent campaign run won1–11, then exposed a full-lot projection obstruction in mission12: a legitimate tall home on1,3 obscured the ramp target on1,2. Shrinking only no-lot facades was insufficient. The final correction is a consistent user-facing editing view, rather than another per-mission carve-out or an invisible test-target bypass.

At rest, architecture retains its normal materials and depth. Roof-obscured movable pieces receive a neutral x-ray footprint outline so their presence and selection area remain discoverable. Pressing their visible projected footprint selects the real piece. While any piece is selected or held, landmark/planting materials visibly fade to approximately15% and their heavy shadows are removed. Placed clinic architecture follows this treatment, while the selected/carried clinic stays solid. Occupied built lots keep clear ground hatching. Material clones isolate the cutaway from road/terrain materials; clearing selection restores the original appearance. Reduced motion switches the same meanings immediately.

During manipulation, targeting intersects each authored cell's actual placement-height plane and footprint. Roofs and scenery no longer determine the drop cell. Built/occupied/terrain-invalid destinations still reach the authoritative model and reject normally. Piece geometry, ports, heights and route rules are unchanged. The lead supplied close-selection ×, Escape and backdrop exits so a rotated installed piece does not leave the observation view faded.

A comprehensive real-input diagnostic covered all24 boards: **128/128 initial movable center presses selected the correct ID**, and **123/123 required action-cell centers produced the correct actual hover cell while holding a real piece**. It used pointer presses/holds/moves, Escape/KeyR resets and the read-only text hook; authored action cells only enumerated coverage. There was no action/state/progress injection, no hint, and no time hook. All passed with zero errors/HMR. `actual/cutaway-diagnostic/record.json` and `12-cutaway-ramp-target.png` record this coverage. Hover/selection coverage does not by itself establish the full campaign's completed control plans.

Targeted actual-control proof then completed the repaired mission12 ramp plan at12/12 and the ordinary first drag at6/6. Portrait24 real CDP touch placed the clinic on5,3, grabbed the parked coastal piece, and exercised both turn directions0→1→0. The close control cleared selection without pausing and restored opaque architecture; a dragged road on a built lot correctly rejected with “כאן יש מבנה. השאירו מקום לבתים ולשירותים.” No page errors or HMR were observed. Screenshots of observation, held ramp/cutaway, won observation, phone controls, closed observation and rejected built target were opened and inspected under `actual/cutaway-proof/`, with its matching record.

The measured phone toolbar occupiedx96.9–293.1 in390px width, including both turn directions and close. All owned contexts were closed after proof. The scene is frozen at the updated checkpoint above; the later full campaign and placement-score verification are recorded in PLAYTEST.md and CHALLENGE_REVIEW.md. This general editing view supersedes the earlier per-facade correction as the mechanism that guarantees target access while retaining full architectural observation.
