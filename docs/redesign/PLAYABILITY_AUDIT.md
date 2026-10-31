# Playability audit — rebuild brief

**Finding: the existing build can be solved, but its first minute does not deliver a clear, lively route-building game.** The previous 69 model tests and known-plan browser runs established rule behaviour and solvability. They did not establish discoverability, satisfying feedback, suitable difficulty or fun. The user's rejection is evidence that the delivery bar was missed; passing those tests does not rebut it.

This is an expert usability inspection of the current local build at `http://localhost:5303`, 1440×900, in a fresh isolated Chromium context. The inspector has prior project knowledge, so this is **not a naive-player study**. During this audit no level baseline, source-level solution, hint or help text was used to make the first route. The initial decisions used only the welcome screen, visible map labels, mission sentence and normal controls. The first confusion was recorded before consulting the text-state hook. After that, the read-only hook measured the moving wave; no clock acceleration or injected state was used. Scratch captures and the 30-second real-time wave trace are held in ignored `work/playability-audit/`.

## What the first exposure actually asks of a player

The welcome screen asks the player to read a broad transport-management premise, choose a tool, connect two points and run a wave. After dismissal, the map offers tiny houses/school/junction labels amid a large amount of decorative forest and relief. There are no waiting people or moving buses yet. Around the map are a campaign menu, resource and percentage readouts, camera controls, hint, construction tools, run/retry/speed, help, sound, motion and fullscreen controls.

The first mission already combines route continuity, slope rejection, a construction budget, a finite demand wave, a per-person time limit and an 85% threshold. Most of those numbers do not help answer the immediate question: **where do I put my pointer, and what will happen when I move it?**

### Recorded interaction sequence

| Visible action / observation | Actual response | Playability consequence |
|---|---|---|
| Read welcome; dismiss using the primary button. | A static atlas and small edge instructions appear. | The first meaningful event is still several actions away. The scene provides little immediate demonstration of the game verb. |
| Select the home and then the school, a plausible direct connection attempt. | Bottom status says `שיפוע 92% — תלול מדי. חפשו תוואי מתון לאורך קו הגובה.` Budget remains 38; the origin stays selected; Run remains enabled. | The rejection is technically informative but distant from the attempted segment. A novice must understand an extreme abstract percentage, contour interpretation and the retained selection state before making the next action. |
| Drag from the home, deliberately through the visible low-valley junction, onward to the school in one stroke. | The same direct-link grade rejection occurs. Budget remains 38. The intermediate bend is ignored. | The apparent route-drawing gesture does not describe the implemented endpoint-only operation. A player can draw around the hill correctly in spatial terms and still receive the original error. This is the strongest concrete control failure found. |
| Tap the low-valley junction, then the school as separate segments. | Two links are built; budget falls to 22; status says the connection is ready. | This works once the hidden segmentation rule is understood. The game needs to teach or eliminate that rule. |
| Press Run and observe without editing. | Small private cars depart. After about 5 seconds: 0 arrivals. After 10 seconds: 2. After 15: 4. After 20: 6. After 25: 8. After 30: 10, with two still travelling. | Most of the first successful wave is passive watching. The first mission does not introduce its identity-defining Tripo bus. Cars, people and arrival feedback are small relative to the terrain. |
| Wait for completion. | A modal reports 12/12, 100%, score 874 and mean time 16.2, plus an abstract sentence about proximity becoming access. | Success is dominated by a statistics panel. There is little visible school arrival, bell, crowd release or other payoff tied to the player's road. |
| Choose retry. | The same plan is retained with budget 22; the player must edit or run again. | Deterministic retry works, but the first-minute loop has offered little reason to experiment. Retrying the identical solved network mostly repeats the wait. |

These are observations, not estimates of how long a student would take to understand the controls. The six wave samples were taken five real seconds apart after Run. The route-building investigation and observation pauses were not a controlled human stopwatch study.

## Problems to fix, in order

1. **Make the road gesture truthful.** A route bent through a valid intermediate point must preserve that bend. If the design uses a discrete graph, show the snap points clearly and commit each traversed valid segment during the stroke. Alternatively choose an explicit two-tap segment puzzle and describe it that way. Do not present a freehand verb while reading only the final endpoints.
2. **Deliver a visible result almost immediately.** Put the bus, a few waiting people and the destination in the centre of the composition. Start the first departure within half a second of completing the line; show the first arrival within roughly 6–8 seconds. Those are proposed tuning targets, not transport facts.
3. **Reduce the first decision to one job.** The first scene needs an origin, a destination, a road gesture and one primary action. Remove campaign, percentage, budget, footprint, timetable, speed and camera operations from the introductory decision. Unlock complexity only when it becomes useful.
4. **Put cause and feedback together.** Show slope trouble at the steep road, queue trouble at the stop, and arrival at the school. A small bottom status line should support this, not carry the entire explanation.
5. **Make the geography readable before making it expensive.** The first hill should have an unmistakable visible slope and two readable routes. Do not require interpreting a 92% schematic grade in order to discover how to click. Separate decorative relief from the route constraint; the rendered road and rule must agree.
6. **Replace long idle waves with short tests and a new choice.** Six passengers and one trip are enough to establish the first arrival. Later waves may be longer when the player has a real opportunity to react. A timer running on a tiny vehicle is not itself an active game loop.
7. **Give retry a specific invitation.** A failed attempt should show one visible cause and a local improvement, then let the player redraw immediately. Keep the useful plan, offer one-step undo, and resume in under a second. Editing must not silently create/delete passengers or replace the bus at each junction. Avoid a full diagnostic modal before the next action.
8. **Keep the bus alive across the route.** Read-only inspection of the current model confirms that each `Vehicle` covers one link. At every link end, its passengers lose `vehicleId`, return to waiting unless already at the destination, and the vehicle is deleted. The next link creates another vehicle and another boarding. Even same-mode continuation is therefore a new queue/departure, without a visible reason. The rebuilt bus must keep its identity through intermediate points, stop only at actual stops, continue to the destination, return and board again. Passenger conservation alone does not prove this continuity.
9. **Use new mockups to test interaction clarity, not just style.** The old generated targets communicated an attractive atlas, but did not prove which object to grab, what a stroke means or how a wrong plan recovers. The new targets must include ready, mistake and successful-flow states with the same controls.

## Recommended simpler loop

This is a proposal for the lead's re-plan, pending the user's direction; it is not an implementation commitment. It incorporates the current working direction: a complete drawn line launches a persistent bus automatically; stops are supplied initially; early missions are untimed, with clocks reserved for optional medals later.

**Draw a complete line → the bus starts → see it succeed or struggle → redraw one part → see the same people arrive.**

A compact map fills the play area. A cream/navy bus waits beside a small group at the origin. The destination has a large, recognisable school/clinic/workplace form and a short Hebrew name. A single sentence says `גררו דרך מהשכונה לבית הספר`. The active origin invites the gesture directly. A continuous stroke snaps through intermediate road points and previews its actual path. Completing the line at the destination launches the waiting bus, without a second planning/run mode. Touch may use successive taps, with an equally clear finish operation. Keep undo/edit visible throughout.

The first mission gives a quick reliable win on a simple coastal map: finish the line, watch six people board the same bus, then arrive within several seconds. Stops and the first bus are supplied automatically. Construction budget, a failure clock, manually placed stops, upgrades and mode tabs are absent. A small visible `0/6` near the school is sufficient. The success happens in the world: passengers leave the bus, the school entrance responds, and a short chime or reduced-motion equivalent confirms arrival. The next action is `לבוקר הבא`.

The second small map introduces the first geographic choice: a short steep road versus a longer gentle approach. A direct attempt should produce an understandable spatial consequence—an obviously slow climb and a local `העלייה מאטה` cue—rather than an unexplained hard rejection. Early exploration is untimed: the bad plan is a useful observation, not a countdown loss. If a slope is truly forbidden, preview that at the attempted road before committing, then keep the player in the gesture. Rewind/redraw is immediate. The payoff is that a longer route can deliver sooner. This teaches the relationship through action without requiring a quiz or an engineering percentage.

Use exact small counts before percentages: e.g. `6 ילדים לבית הספר` and later `4 תושבים למרפאה`. Preserve the per-group access rule in later missions, but express the player's required arrival counts plainly. Optional stars can reward better time or less road; the introductory win should not require optimising several scores at once.

### Where the geography remains mechanical

- **Relief:** the road's actual slope changes travel or feasibility; a gentle detour can beat a short climb. The visible terrain must match this consequence.
- **Land use:** homes generate trips to school, work or health service forms with distinct labels/icons. A route to the wrong service does not satisfy the trip. Colour alone never defines the task.
- **Capacity:** a later second group fills the bus and leaves visible people waiting. The newly introduced action is one extra departure or a useful branch, not eight transport tools at once.
- **Access:** a later stop must actually cover the homes and last leg. Introduce stop placement only when one uncovered group makes that need visible.
- **Core/periphery:** a small edge community remains on screen with its own arrival count. A large central total cannot hide it. A local service or feeder changes its access.
- **Crossing/resilience:** a known bridge/closure changes which route will keep working. Warnings appear on the affected route before the event.

Terrain, timetables and counts remain original schematic teaching values. The fixed/mobile source discrepancy stays unassessed. Keep deterministic conservation, capacity, stop access and terrain constraints, but change the current per-edge vehicle abstraction. A continuous bus line needs explicit route order, persistent vehicle location/direction, stop dwell and return behaviour. Merely hiding the old toolbar would leave the broken continuity underneath.

## Progressive unlock proposal

Keep the full 24-level commission, but validate the new first two missions before multiplying the interface.

| Missions | New decision | Maximum new burden |
|---|---|---|
| 1–4 | Draw a continuous route; read a slope; transfer to a changed small map | One complete-line gesture auto-launches the bus; undo/edit always available |
| 5–8 | Two land-use destinations; a full bus; an intrusive residential route | Introduce one capacity/branch action only when a queue demonstrates why |
| 9–12 | Coastal corridor, valley crossing, hill and rift | Terrain and limited crossings change route choice; no new mode panel by default |
| 13–16 | Walking access, feeder and rail | Introduce stop placement, then one interchange; make the first transfer coordination automatic before exposing phase decisions |
| 17–20 | Small peripheral group; local service versus travel | Introduce local service as one spatial action; per-group arrival goals stay visible |
| 21–24 | Announced demand/closure and integrated transfer | Fewer solution aids, familiar controls; no surprise new toolbar on the final map |

This is a burden curve, not permission to rename the existing levels. The authored mission order and curriculum mapping must be rewritten coherently if the lead adopts it.

## Concrete first-minute acceptance script for the rebuild

Run this from a fresh browser with a reviewer who has not seen a solution. Do not hand them a baseline route, tell them node IDs, click Hint or substitute a model test. Record the actual input trail and what they say the next action is. An agent inspection alone cannot certify novice clarity.

| Time target | Acceptance behaviour |
|---|---|
| 0–3 s | An idling bus, six visible waiting people, one destination and one short instruction make the task understandable. No introductory reading modal is required to act. |
| By 5 s | The reviewer starts the intended route gesture without an explanation. The live road follows the actual stroke, including a bend through a valid intermediate point. |
| By 10 s | Completing the route launches the bus automatically. It visibly boards and departs within 0.5 s of completion. The bus keeps the same identity at intermediate route points. |
| By 22 s | Six real passengers arrive and the world visibly celebrates. The goal is understood without opening a stats panel. The same bus then turns around rather than disappearing. |
| By 30 s | The reviewer enters the second small map and can identify the slope-related route choice using the terrain. |
| By 45 s | A deliberately poor short route produces local, understandable feedback without an introductory timer loss. The reviewer can name the cause, undo/redraw, and retry without losing the whole plan. |
| By 60 s | The improved route visibly produces a better arrival outcome. One additional concept may now unlock. |

Additional gates for that script: the interactive landmarks dominate decorative objects; chosen touch targets are at least 44×44 CSS pixels where possible; no critical label is obscured; failure and success use more than colour; sound is optional; reduced motion preserves the causal feedback; the same instruction works for pointer and touch. These are chosen design acceptance targets, not claims of compliance with an external standard.

For the first rebuilt slice, test **unprompted action, one understandable mistake, one recovery and one win**. Only then use the existing model checks to guard conservation/capacity while scaling the campaign. Do not count a known-plan automation pass or a generated screenshot as evidence that this acceptance script works.

## What the new design targets must show before coding

Ask the art owner for a consistent three-state board, then inspect each state at actual intended play size:

1. **Ready:** the bus and people are recognisable; the origin and school read at a glance; one complete-line gesture and the automatic launch are visible; undo/edit are subordinate.
2. **Mistake:** the route's bend is preserved, slope or queue trouble is located in the world, and undo/redraw is obvious.
3. **Flow:** the repaired road carries the bus; waiting people diminish; the school arrival and next action are visible without a dashboard.

The targets should reserve real space for the road gesture and feedback instead of assuming that a beautiful landscape will make the interaction legible. They are proposed gameplay targets; subsequent browser captures must reproduce the same verbs and state changes.
