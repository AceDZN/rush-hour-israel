# Tactile road-piece action puzzle — art direction

31 October 2026. Read-only audit after the human chose hands-on action puzzles and rejected the current version's appearance and behavior. Reviewed the current V2 opening captures, `src/rebuild/scene.ts`, and its HUD styles. This is a new proposal; it does not defend V2 or treat earlier internal checks as user approval. No images, code, assets or Tripo spending were produced for this task.

## The three biggest causes of the current poor appearance

1. **It looks like an unfinished environment, not a composed game.** A flat, near-uniform green plane fills most of the frame. Scattered repeated tree blobs supply filler instead of an intentional landscape. The houses and school are sharp primitive boxes with broad blank roofs and little material hierarchy. The bright grass and soft cream buildings flatten together under the lighting. There is no strong silhouette or crafted surface that makes the world desirable to touch.
2. **The important action has little physical presence.** The world offers a gray road already in place and then paints a service stripe onto it. Most objects remain static. The player sees neither a substantial object in hand nor a mechanically understandable transformation. The scene does not visibly promise the hands-on puzzle the user wants.
3. **The screen speaks through pasted-on UI rather than objects.** Pill labels sit over the bus and gate. Additional rounded text blocks float above the landscape. Road gaps, endpoints and operating state are not intrinsic to the geometry. The camera spends space on blank ground while the same generic props repeat around the real action. Enlarging the bus alone cannot resolve this visual language.

## Proposed visual thesis

A compact architectural road puzzle with chunky, beautifully fitted pieces: dark teal roads, warm cream terrain, terracotta landmarks, and a large cream/navy bus. The pleasure is picking up a solid road piece, turning it, feeling it seat in a socket, and seeing the bus and people respond immediately.

Think of a carefully made physical puzzle brought to life, with restrained contemporary materials. Avoid preschool proportions, glossy plastic everywhere, construction-editor chrome and photographic scenery. The game should look authored even with a small geometry budget.

## Opening composition

- One compact continuous diorama, approximately five columns by three or four rows for the opening composition. The grid is expressed through fitted pieces and shallow sockets, not a spreadsheet of outlined cells. The exact playable grid is the lead's mechanics decision.
- Home cluster and waiting bus at the near-left edge; school at the far-right edge. A short fixed road stub exits each place. The central missing connection is the dominant negative shape in the scene. Three or four useful pieces wait in a physical rack along the lower edge.
- The first scene is low, unobstructed ground. No steep trap, second neighborhood, rail mode or decorative branch. The apparent problem should be understandable from the silhouettes: put road between the bus and school.
- At 1440×900, aim for an active board occupying roughly 75–85% of the useful width, bus length around 130–190 px, people around 28–40 px high, and generous piece silhouettes. Reserve the top 70–90 px for a small objective, not a wide title panel.
- Use a fixed close three-quarter orthographic camera, around 45–55° down. See the top of each tile and its thickness, plus enough front face to read houses and bus. Do not spend space on a distant horizon, ocean strip or invisible back half of the board.
- Portrait gets a compact vertical composition and rack below it. Do not scale a wide desktop landscape down to a distant minimap. Tile hit areas remain at least 48 px and the held piece must stay visible above the finger.

The board can have a shaped coastline, slope or valley in later missions. For the opening, a modest dark teal surround and a clean cut terrain silhouette are sufficient. Every visible grove, curb and bench must support the focal composition; empty space does not need random trees.

## Palette and material hierarchy

| Role | Starting color | Material / purpose |
| --- | --- | --- |
| Background / table | `#102E33` | Quiet dark teal, matte; separates the entire puzzle from the frame. |
| Road surface | `#244C50` | Deep teal asphalt with fine roughness, crisp cream markings. Strongest continuous network shape. |
| Terrain / tile sides | `#F0E3C7` | Warm mineral cream, softly beveled; actual thickness visible. |
| Landmark roofs / selected piece edge | `#C96649` | Terracotta ceramic/paint; limited, deliberate warm accent. |
| Walls / road markings | `#FFF4DC` | Clean off-white, distinct from terrain through light, seams and bevels. |
| Vegetation | `#6F9278` | Muted sage, in two or three authored clusters; never a lime blanket. |
| Water / river | `#4A9EAC` | Clear medium blue, low-frequency surface movement only. |
| Active feedback | `#EDB34C` | Warm amber at the held piece/socket/arrival; small and temporary. |

Use matte surfaces with different roughness rather than multiple noisy textures. Bevel highlights and contact shadows should communicate solid form. Buildings need inset windows, door depth, a roof lip and a grounded base. No realistic roof tiles, masonry noise, grass speckle or random flowerbeds are required.

## Chunky road-piece geometry

- A road tile is a solid object: a softly beveled cream or terracotta-edged base, about 0.12–0.18 tile units thick, topped with a dark teal road deck. Tile seams should be narrow, clean and consistent.
- Straights and quarter turns have exactly matching road widths and connector locations. Curbs are actual low extrusions; markings follow the road curve. A quarter-turn cannot be a painted chord across a square.
- A shallow socket has a dark recessed floor and a small inner rim. The unfilled gap is legible even with all text hidden. Socket relief should not look like a glowing correct-answer overlay.
- Tiles may share a square footprint, but use a subtle keyed edge/connector groove to make orientation and alignment physically understandable. Raised pieces show their underside and thickness.
- Bridges in later missions have visible deck, supports and river clearance. Ramps show their two endpoint heights and actual grade. Terrain must not hide a valid road behind decorative hills. These pieces must correspond to the rule model, not merely decorate a flat network.
- Keep the available inventory physically finite and visible. Three pieces in a rack communicate scarcity more clearly than a budget spreadsheet. Do not turn the rack into eight interchangeable toolbar buttons.
- Rail, if retained later, needs a recognizable paired-rail deck and a distinct piece silhouette. It should not be a bus line with a different color.

## Tactile interaction and gamefeel

| Moment | Visible response | Achievable Three.js implementation |
| --- | --- | --- |
| Hover / touch focus | Piece edges brighten slightly; a small contact shadow separates it from the rack. | Material color/emissive change plus a small y lift; no full-screen glow. |
| Pick up | Tile lifts 0.25–0.4 tile units over 100–140 ms, tilts a few degrees toward the hand, and casts a soft shadow on the board. | Transform interpolation with a short damped spring. Lift the whole rigid group. |
| Drag | Piece stays substantial and follows the pointer with a tiny, consistent lag. The empty socket beneath it is visible. | Ray/plane projection with a finger offset on touch; target pose separate from current pose. |
| Rotate | One crisp 90° turn, brief ease-through, orientation marks moving with the geometry. | Quaternion rotation in 120–170 ms. Pointer affordance and keyboard equivalent can share the action. |
| Valid alignment | The piece settles directly over the socket; connector edges line up. One amber rim or tiny snap spark appears at the join. | Candidate transform and local outline/edge mesh. No universal solution path. |
| Snap | The tile drops into the board, compresses by a few percent for a single frame beat, then settles with a quiet wooden/ceramic click. | A 160–220 ms y spring with restrained overshoot, scale correction and a short sound. |
| Invalid placement | Piece remains raised and gives one short lateral nudge; the conflicting edge is marked locally. It returns to the rack or last valid pose. | 80–120 ms shake and local edge color. Keep the rest of the scene calm. |
| Route completed | Connection seams flash once, bus headlights wake, door closes and the same bus drives onto the completed road. | Event-driven material pulses and rigid bus motion along the model path. No separate Send button in the beginner loop. |
| Bottleneck | Bus visibly brakes before a gap/occupied crossing; waiting passengers remain physically present. | Model-driven stop/queue positions, a short braking ease and one local feedback cue. No destructive collision gag. |
| Arrival | Figures step into the school court; the arrival count increments with a small local celebration. | Rigid simple figures, short boarding/unloading transitions, a small flag/marker response and soft audio. |

The hand action must change a visible object before a number changes. Avoid long cinematic camera moves, constant bouncing, floating text confetti or an opaque result window. The completed network should remain visible for the player to enjoy.

## Landmarks, bus and people

- Retain the original Tripo cream/navy/ochre bus if it reads well against the darker road. Keep a consistent recognizable vehicle throughout the run. Scale the board around its useful screen size rather than shrinking the bus to fit decorative terrain.
- Home cluster: two or three authored silhouettes, recessed dark teal windows, small front paths and one shared pickup. Keep the frontage away from valid roads. No bus may pass through a house or disappear under a decorative tree.
- School: one confident silhouette, a meaningful entrance, simple courtyard markings and a sign integrated into the facade. A school should read as a school without a floating pill.
- People: a small visible group with backpacks and varied clothing/skin tones. Clean simple shapes are preferable to detailed characters that the engine cannot support. If deforming character models are introduced, follow the existing Tripo rigging requirement; this proposal does not claim to supply rigged characters.
- Vegetation: a few carefully placed sculpted broadleaf forms with visible trunks and a controlled silhouette. Do not scatter the same three-sphere tree across the whole board.

## HUD and visual hierarchy

One short Hebrew objective at the top, a compact arrival count, small undo/pause, and the physical piece rack. The next action is expressed by a piece being available and a road gap needing it. Do not place labels over the bus, road joins or school gate.

Use integrated facade signs for persistent place identity. Temporary text can appear beside the held tile or obstruction. Advanced transport actions should arrive when a later puzzle needs them. Do not recreate V2's floating pills with a darker skin.

A small north cue belongs in regional geography missions, with coast west and authored relief relationships maintained. Maps and model values remain schematic. Shape and geometry distinguish land use, vehicles and modes; color alone must not determine the answer.

## Buildable rendering constraints

- Use reusable bevelled box / extruded rounded-rectangle geometry for tile bodies and buildings. A small number of shared straight/turn/bridge meshes can cover the piece system. Clean joins matter more than high polygon counts.
- Reuse materials; batch static terrain/landmarks and instance repeated markers. Keep dynamic pieces independent so pickup/rotation/snap is cheap.
- One warm directional light, a cool hemisphere fill, a 2048 shadow map and restrained ambient/contact shading are sufficient. No photographic HDR environment or heavy post-processing is needed. Tone mapping must preserve the teal/cream/terracotta separation.
- Use a fixed orthographic view and authored object placement. Avoid rescuing arbitrary procedural hills with repeated terrain patches. The surface should follow the puzzle's geometric constraints from the start.
- DPR cap around 1.5–1.75, clear resize behavior, and reduced-motion variants that keep the same feedback meaning. Measure draw calls/FPS rather than promising a performance number.
- Initial goal: a small authored piece library and two composed board scenes. No new asset service or spending is required to prove this direction.

## What the next mockup must show

The first screenshot should show a real first action: a chunky quarter-turn held above a clear road socket, two or three remaining pieces in a rack, the substantial bus and eight waiting children, and the school. The second should show a later spatial problem such as a bridge/height mismatch, with a visible piece rotation or replacement and a stopped queue. Both should use the same attainable bevelled geometry and palette.

Do not generate a cinematic town and then reduce it to a sparse flat lawn during implementation. Generate a plausible in-engine puzzle composition whose geometry, object count, materials and input affordances can actually be built. After selecting the target, test the lift/rotate/snap/drive loop in a short real capture before expanding the campaign. A screenshot can establish direction; it cannot establish satisfying manipulation or intuitive play.

## Inspection of the first new action-puzzle target

Inspected the lead's built-in imagegen output `exec-23be6b42-0f44-486b-8d26-18df177df3fc.png` before any action-puzzle scene code. This is a much stronger direction than the open green landscape: the dark teal surround, terracotta frame, cream bevelled tiles, substantial bus, clear home/school landmarks, hand-held piece and physical inventory rack create an immediately readable object-manipulation game.

Retain the composition and material hierarchy. The terrain tiles, frame and road pieces should be buildable as repeated extruded/bevelled geometry with shared materials. Use two or three simple authored trees and roof silhouettes; reject the generated image's photoreal leaves, individual roof tiles, granular turf, masonry and scattered small props as a fidelity requirement.

Do **not** reproduce the generated topology: its highlighted gap lies between two straight east–west road ends, while the held piece is a quarter turn. That piece cannot close the depicted route in the shown position. The actual level must derive tile orientation, ports, candidate socket and bus path from one authoritative model. A screenshot that looks attractive but teaches an impossible snap is a failure. The active socket outline should mean “where this piece is being held,” not claim that an incorrect orientation works.

The generated image shows a six-passenger goal rather than V2's eight. Use the actual authored mission count in both visible figures and the HUD. It is reasonable for the first rescue to finish in one readable trip; the exact count belongs to the new model design. Do not preserve an old number merely for continuity.

The scene implementation should wait for the shared action-puzzle types/API and the lead's later bridge target. No runtime file was changed during this audit.

## Frozen V3 scene implementation and actual inspection

Implemented `src/action/scene.ts` against the new authoritative tile and vehicle model, then froze source for independent campaign QA. The scene uses real bevelled road pieces, quarter-turn curbs and markings, ramp endpoint heights, water supports only at legal bridge alignments, a physical rack, pointer lift/rotate/snap easing, and persistent original bus meshes. Sage insets sit above their cream rims; the required broken connection reads as a recessed dark socket. A local broken-link symbol belongs to the stopped bus rather than a place-name pill. The school and homes occupy reserved free adjacent lots so their architecture and court have useful physical presence while the pickup road stays clear. Arrivals stand in the actual school court. Active or reserved road pieces do not rise when selected.

Inspected final actual captures in `docs/action-puzzle/art-captures/`: desktop at 1440×900 and portrait at 390×844, including ready, held and won states. Desktop used a real canvas mouse drag; portrait used a real CDP touch sequence. Both reached 6/6 after one placed piece, with no page errors. The final record observed about 107 FPS desktop and 119 FPS portrait using Metal; these are local observations, not a device guarantee. No state/progress injection, authored solution import, hint or elapsed-time hook was used for these captures. The stock develop-web-game client also captured and was inspected at `skill-final/shot-0.png` (canvas-only capture). TypeScript passed.

The actual scene preserves the targets' close solid tabletop, cream bevelled pieces, dark road, terracotta frame and substantial bus. Portrait rotates the board and rack to keep useful physical hit targets; it is not the desktop view shrunk down. The first board intentionally has simple low ground and one straight gap, rather than the impossible generated corner-to-straight join. Children visible outside the bus follow the model's actual boarding/arrival state; a ready capture after boarding does not keep a fake waiting crowd outside.

Fidelity limits remain visible: the authored school/houses are clean low-poly architecture, vegetation is faceted and sparse, and the bus is the permitted existing rigid GLB. There are no photographic roof tiles, textured lawns, deforming characters or new Tripo assets. Broad sage tiles still make the opening deliberately restrained; richer environment dressing must not compromise placeable sockets or moving-road visibility. The generated targets establish a material and composition direction, not evidence of an implemented rule or student enjoyment. Independent all-24, later ramp/rail and real-touch QA remains the lead/QA's separate verification; these opening captures alone do not establish it.

### Campaign QA obstruction correction

Independent actual-input campaign QA subsequently found that the scene's initial adjacent-lot heuristic could occupy mission 8's missing `0,1` road cell. This invalidated the earlier scene freeze for campaign coverage. The fix changes the physical layout: the campaign now authors `landmark.lot` while reserving every potential road, parking cell and service plot, and marks each building lot as `built`. The scene uses only these explicit lots and falls back to a compact roadside facade when none is provided. It never searches for an adjacent lot itself. Building picking follows the built lot rather than redirecting a required road target to a locked pickup road.

Replayed mission 8 with actual keyboard rotations and mouse drags on the corrected scene: `left` snapped to `0,1`, `right` snapped to `4,1`, and the same bus completed 6/6. Ready, held and won captures in `art-captures/explicit-lots/` show both required road cells physically unobstructed; `08-record.json` records no page errors or HMR. The browser was closed and the scene frozen again. This targeted replay corrects the demonstrated obstruction; the independent full campaign rerun is still the source of all-24 coverage.

### Rail platform and later-scene inspection

Inspected independent QA's final mission 11, 14 and 24 moving captures and the mission 24 portrait moving/won captures. Mission 11's river deck and mission 24's bridge, bends, rise and local clinic remain physically readable; the valid route and buses are unobstructed in both desktop and portrait. Mission 14 exposed a separate rail staging defect: the waiting train followed the feeder bus corner and sat diagonally across it.

The lead corrected the rail terminal pose to its straight rail axis. The scene now gives shared bus/rail terminals a short separate rail shoulder, smoothly tapering to the neighboring rail tile's center. Track ballast, sleepers, rail geometry and train position/tangent use the same displacement, avoiding a floating train beside unchanged track. The procedural train's two cars are centered around its persistent pose and fit within a 2.6-unit platform, at approximately 2.47 units total; the original bus scale is unchanged.

Actual mission 14 rotation and drag replay then reached 12/12, with no errors or HMR. Waiting, transfer and arrival screenshots plus the input/state record are in `art-captures/rail-platform/`. The waiting train is now straight on its own rail shoulder; the foreground bus can partially occlude a car during the brief transfer in this fixed projection, but the train no longer lies diagonally across the feeder corner. Browser closed and source frozen again for the independent targeted rail review. This is a bounded pose/platform correction, not a new campaign or mechanics change.

The lead subsequently reran the installed develop-web-game action client against the final mission14 scene, using physical pause/resume keys and an elapsed frame burst. `actual/skill-final-14/shot-0.png` and `state-0.json` were opened and inspected: the substantial bus waits at the real missing feeder corner and the straight train rests on its aligned platform track. This capture is a canvas regression, not a campaign win or usability study. Independent targeted14 and the full24 records remain in `tests/action/evidence/`.
