# Redesign art, camera and interaction audit

31 October 2026. Prepared after the human rejected the current game as ugly, weird, confusing, boring and too hard. This is a fresh design critique. Prior implementation verification established that controls and rules can run; it did not establish appeal, comprehension or fun. No new mockups, source edits, Tripo actions or credit spending were performed for this audit.

## Evidence reviewed

Read-only review of `src/scene.ts`, `src/main.ts`, `src/style.css`, the current level-24 moving capture, level-10 final terrace capture, mobile level-1 planning capture, and production level-1 win capture. The generated target images were also compared to the implementation. These are observations from screenshots and code, not student usability findings.

## What currently makes the game difficult to read

| Observation | Effect on the player | Concrete redesign consequence |
| --- | --- | --- |
| Most of the world is beige empty ground and repeated green cones. The playable places are tiny clusters under DOM badges. | The scene reads as a technical terrain test. A school, a home and a junction are understood through labels rather than the world. | Compose each map around inhabited places and a visible geographic obstacle. Give homes, school, jobs and interchange distinct silhouettes and surrounding land use. Reduce background trees aggressively. |
| The rigid rectangular sea strip, thick vertical cut edge, faceted terraces and large repeated mountains dominate. | The atlas looks arbitrary and artificial without gaining the charm of a deliberate miniature. | Author coast/valley silhouettes and broad coherent landforms per scenario. Use fewer, larger, smoother forms. Route cuts must feel engineered into those forms rather than scars added to a generic hill. |
| The camera frames the entire decorative board; important vehicles and people remain small. | The action has low visual energy. Watching a bus complete a trip feels remote. | Frame the active network first. Keep a visible bus around 28–40 px long on a desktop first level, with a recognizable front and legible boarding moment. Enlarge the active neighborhood, not its labels. |
| Mobile level 1 puts the whole board in roughly the middle quarter of the screen height, with extensive empty beige above and below. Map names disappear into small icon pins. | The game becomes a distant minimap. Touch target size alone cannot make the situation understandable. | Design a portrait camera and first-level composition separately. Use vertical home→crossing→school staging and let the world occupy the middle 60–70% of the portrait screen. Keep place identity visible. |
| Eight tools, camera controls, utilities, a level picker, data panel and inspector can coexist. Tool labels describe infrastructure, not the immediate task. | The player must learn an editor before experiencing the reward. Road, bus, stop and interchange relations are initially unclear. | Reveal one primary verb at a time. First minute: connect a route and watch people arrive. Contextual route upgrades replace a permanent advanced toolbar. |
| Building a bus path requires selecting the mode, making each segment, then placing stops on each intermediate node. | The same intention is expressed many times. A finished-looking line can silently provide no service. | A new bus route creates usable stops automatically. Show endpoint coverage before release. Expose stop relocation as a later meaningful decision rather than an initial bookkeeping requirement. |
| Invalid-action reasons and changing status sit in a narrow bottom strip, far from the attempted link. Route previews depend on selection and hover states. | It is easy to miss why an action failed or whether it worked. The interface asks the player to scan between places. | Put the consequence at the pointer/world anchor: cost, steep slope, full bus, missing crossing. A successful gesture gets an unmistakable route snap, departure and short sound. |
| Most pressure appears as origin queue pegs and small numeric badges. Vehicles are spaced out; the jam itself is not a strong scene event. | The player sees a number increasing rather than an interesting problem forming. | Make a bottleneck physically obvious: a short queue of vehicles, bus boarding queue, blocked crossing or crowded platform. Animate improvement locally when the player fixes it. |
| The first objective introduces percentages, deadlines, budget and aggregate scoring. The win screen immediately covers and blurs the world with a report. | The reward feels like completing an assessment. It interrupts the pleasing part of seeing the network work. | First goal should be concrete: “הביאו 6 ילדים לבית הספר”. Show six visible arrival marks. Celebrate inside the world before a small next-level prompt. Keep technical breakdown optional. |
| A largely monochrome HUD uses many 8–12 px labels. | Sparse chrome still feels dense because every item has similar emphasis and requires reading. | One large objective, one resource, one action. Increase useful text size and consolidate the rest. Use shape, motion and spatial context before extra copy. |

## Direction A — A living morning neighborhood

**Recommended starting direction.** A compact, lively miniature transport puzzle, seen close enough to care about its morning. The geographic decision stays physical and visible; the first interaction is one satisfying route gesture.

### Art and camera

- A carefully composed small district rather than an empty national slab: two home clusters, one unmistakable school with a playground, one valley or hill, and the necessary streets. Warm off-white walls, terracotta roofs, richer vegetation in grouped patches, deep blue shadow and clear sea blue. Retain the original cream/navy/ochre Tripo bus.
- Use a fixed three-quarter orthographic camera with softer terrain and a useful horizon-free crop. Places and vehicles dominate; the board edge is occasional context rather than the central visual identity. Coast west and inland rise east remain explicit.
- Model the settlement silhouette: a school courtyard with flag/playground markings, homes around a small street, jobs as a compact work block, station as a recognizable platform. A player should distinguish these with labels hidden.
- Avoid filling every gap with trees. Use small groves, orchards, an open park and visible urban ground textures to explain land use. Let the road stand out in a calmer corridor.
- Default scene should have one focal trip. Camera movement is restrained: a brief settle at entry, a small emphasis at the first arrival, optional pan/zoom later. No rotation toolbar in the first minute.

### First 30 seconds

1. Open directly on six waiting children at homes and the school across a shallow valley. The objective is “הביאו 6 ילדים לבית הספר”. A bus waits visibly at the neighborhood.
2. A short contextual cue on the origin says “גררו לבית הספר”. Dragging lays a thick preview ribbon, which snaps to a valid contour/crossing. Usable stops are included.
3. Release: the road settles into the ground, the route gains its stop signs and the bus immediately boards. Start the wave automatically for this introductory action, with an obvious pause button available.
4. Children visibly board, the bus moves and the school arrival strip fills 1–6. The last arrival triggers a courtyard flourish and a brief “כולם הגיעו!” over the world. Next morning appears after the reward is seen.
5. A later arrival stream exposes a queue at the crossing. Clicking the congested route reveals one contextual action: “עוד אוטובוס”. Queue shrink and more departures make the improvement legible before frequency terms are introduced.

### Control hierarchy

Primary verb: drag a service route. Tap works as origin→destination with the same preview. One undo button; one pause/run button. Early route construction includes its required road and stops. Later chapters introduce mode choice, relocation, interchange and local service as explicit new decisions, one at a time. Selecting a route reveals upgrades on that route rather than opening a remote inspector full of numbers.

### Why this could feel better

The first reward happens before the player learns a tool palette. A little inhabited place supplies charm and clear purpose. New constraints alter a familiar satisfying action instead of adding repeated setup clicks. The remaining risk is that overly automatic routing could remove strategy; preserve contour/crossing choices and let later players choose bends, stopping points and modes.

## Direction B — Bold playable relief map

A more graphic network strategy: an elegant, tactile relief map with the clarity and immediacy of drawing on a map. This can retain a larger region and the campaign's multimodal emphasis while becoming much more readable than the current terrain editor.

### Art and camera

- Near-top-down orthographic view, fixed north, with low embossed contour layers and a strong graphic shoreline. Use large sand/green geographic belts, thin contour bands and deliberate, limited vegetation clusters. Depth comes from bevels, shadow and elevation edges, not tall random hills hiding routes.
- Towns are legible clusters with distinctive landmark silhouettes. Use compact outlined station symbols attached to the world, not large floating label chips on every bend. Ordinary intermediate bend anchors are visually quiet until drawing.
- Route ribbons are the visual hero: navy road surfaces, cream markings, a clear bus service line, sleepers/paired rails for rail. Modes differ by geometry, motion and icons as well as color. Vehicles remain large enough to identify and have readable boarding pulses.
- The map fills about 80–85% of the usable desktop viewport. For portrait, choose a regional crop and vertical trip composition rather than shrinking the full horizontal board.

### First 30 seconds

1. The map shows two inhabited places and one simple need. A single active route tool is already selected. A small animated origin handle and destination landmark explain the gesture.
2. Drag a route ribbon through two or three generous anchors. The cursor shows the actual route cost and slope at the affected segment. A disallowed steep segment visibly lifts off the slope and returns to the last valid point; the nearby contour alternative remains available.
3. A completed route launches vehicles without a separate stop-placement pass. The wave is short and generous, with the next arrival and current queues visible on the map.
4. When the queue fills, the affected segment gains an on-map “6 ממתינים” bubble and a route-capacity action. Completing an upgrade creates an immediate extra departure and a visible flow pulse.
5. A compact morning-complete banner leaves the moving network visible. A route replay briefly contrasts queue before/after; advanced metrics can be opened voluntarily.

### Control hierarchy

Primary verb: draw/reroute a line. Select a line to drag a stop or add a service. Long press/tap selects the same object. Rail becomes a contextual mode card only when the chapter introduces it. Advanced timing is handled with a visual departure marker/timeline at the selected interchange rather than the unexplained “phase +2” control.

### Why this could feel better

It reduces visual clutter and keeps larger network comparisons clear. The map itself teaches where links may go and why they cost more. It is also cheaper to render attractively and can scale to complex final maps. The remaining risk is a sterile diagram; recognizable moving buses, inhabited landmarks, local boarding animation and warm light must carry life.

## Shared acceptance gates before rebuilding 24 levels

These are proposed design checks, not proof of usability:

- A new mockup must depict an actual first action and an active bottleneck, not just an attractive finished network. Generate desktop and portrait compositions for the selected direction.
- With labels hidden, homes, school, a stop and a geographic obstacle should remain distinguishable. If they do not, improve scene silhouettes before adding text.
- In the first scene, the next action must be apparent without reading the help dialog. Ask a fresh viewer what they would do; the first meaningful action should be possible within 10 seconds.
- One route gesture must produce visible boarding and travel. A finished-looking bus line must not be inert because of an unintroduced hidden prerequisite.
- The first success should be reachable in roughly 30–45 seconds with generous time and a visible, concrete passenger goal. Early failure should show a local cause and offer immediate undo/retry.
- Capture a short real input sequence at desktop and portrait sizes and compare it to the new mockups for object scale, route clarity, action feedback and reward timing. A still screenshot cannot establish gamefeel.
- Expand one enjoyable action/mistake/retry/win loop before reauthoring the whole campaign around the improved control language. Preserve the 24-level scope and geography relationships; avoid copying the previous interaction burden into prettier art.

## Recommendation to the lead

Prototype Direction A's close living-neighborhood first minute, while using Direction B's clear line drawing and embossed relief language for later regional maps. Decide and write the exact interaction sequence first. Then generate fresh gameplay mockups before implementation. The current model/Tripo bus may be reusable, but the scene composition, camera framing, stop setup and progression of controls need a redesign rather than another polish pass.
