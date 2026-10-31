# Action-puzzle QA and 24-mission progression

Status: proposed specification for the human-confirmed direction, **“Grab and rotate roads; rescue the bus.”** This document follows a read-only review of the current 24-mission campaign and supplied curriculum mapping. No action-puzzle code, model test or browser result is claimed here. V1/V2 test counts do not carry forward.

The core should be a small, tactile road diorama: grab a large road piece, rotate it, snap it into place, and watch the same bus resume. The bus and its people supply the purpose. The player manipulates physical road geometry; they do not draw a route or operate a transport dashboard.

## Highest design risks

1. **A pipe puzzle with geographic scenery.** Reciprocal ports alone are insufficient. Terrain height/grade, bridge abutments, walking access, service kind and inhabited land must change valid or useful configurations. At least one of those relationships must be testable by changing the geographic condition while keeping the pieces the same.
2. **A loaded bus rotates or teleports with its tile.** Track a real vehicle footprint across tile boundaries. An occupied piece is briefly locked, or the bus is safely brought to a stop before it is lifted. Show why at the bus. Never rotate the passenger vehicle as a side effect of rotating the road.
3. **A switch becomes hidden routing AI.** Each incoming lane needs a predictable, visibly indicated exit. The selected branch must be evident from the piece's arrow/physical diverter. Do not have an invisible shortest-path algorithm silently override the player's switch.
4. **Capacity means only waiting longer.** An untimed connected road eventually serving everyone is not automatically a capacity puzzle. Later return loops, passing bays, one-lane crossings and feeders should create a physical rescue decision. Optional speed rewards can compare two viable plans; they must not disguise an unannounced failure clock.
5. **Twenty-four repetitions of one gap.** Every mission needs a different spatial/operational change and a plausible near miss. New passengers, names or colours alone do not constitute escalation.
6. **Too many small parts or new verbs.** Keep the first board tiny and pieces large. Introduce a new piece only when its world problem is visible. The manipulation stays grab → rotate → snap; no return to fleet/phase/stop toolbars.

## Common rules to decide before implementation

### Tactile interaction

- First scene: one clearly stalled bus at a visible gap, a few visible passengers, a recognisable school and one oversized misoriented road piece. One quarter-turn should create the first rescue. Teach moving a piece in the next small scene.
- Clicking/tapping an installed piece can rotate it a quarter-turn. Dragging lifts and moves it; rotation while held has one large nearby affordance and an equivalent physical key. Touch must not depend on a hover state or a precise two-finger gesture.
- Snap determines the cell/anchor, **not the correct answer orientation**. A physically placeable but disconnected orientation stays where the player put it, visibly blocking the bus. A piece cannot be silently auto-rotated to solve the puzzle.
- A drop outside a legal support area returns the piece to its previous place/tray. It does not destroy the piece, spend a resource or eject passengers. Show the relevant water/height/support reason at the attempted placement.
- A held road leaves a real gap if it has been lifted from the board. Approaching buses brake before that gap; unrelated parts of the town may remain alive. Never let a bus drive through the road's ghost preview.
- Undo restores an explicit board-and-simulation snapshot with a brief “צעד אחורה” cue. A visual rewind or reduced-motion equivalent explains restored positions/counts. Retry creates a fresh deterministic attempt; it should take less than a second to act again.
- Keep intro missions untimed and forgiving. Later closure/demand events are announced and recoverable; holding a piece or opening instructions must not consume a hidden reaction window.

### Road and geography model

A piece has identity, location, orientation and an internal lane/port mapping. Connected neighbours require matching sides, compatible lane/mode, compatible endpoint heights and legal terrain support. A visual top-down connection with a height step is a real gap, not a valid road.

Start with straight and corner pieces. Later add a visibly directed switch, a bank-supported bridge, a ramp, a stop/platform edge and a passing bay. Ordinary roads are visibly two-way; a one-way piece needs a clear physical arrow and a proper introduction. Rail may be a fixed high-capacity trunk so the player still manipulates road feeder pieces.

Water accepts only a supported bridge at authored abutments. Ramp orientation selects its high/low ends; terrain itself does not rotate with the tile. A contour route can be longer yet feasible/faster. A stop's usable walking side can matter even when rotating 180° leaves its vehicle ports unchanged. Walking follows actual permitted footpaths/obstacles rather than teleporting across a river inside a radius.

The bus follows the committed lane centreline, stops at a missing/incompatible connection and resumes after a real repair. Its ID, direction and onboard people persist through straights, corners, switches, stops, junctions and return trips. People board/alight only at an actual usable stop and appropriate service. A school trip is not satisfied at a clinic because its colour matches.

## Proposed 24 authored missions

Board dimensions and passenger counts below are starting teaching scenarios, not verified tuning. The first four should be compact and have no surplus UI. Later layouts should stay readable in portrait rather than become a miniature national spreadsheet. Most road is prebuilt; generally expose only 1–2 editable pieces initially and a few purposeful choices later.

| # / mission          | Authored spatial problem and tactile move                                                                                                                                  | Geography/transport relationship                                                                   | Near miss and required evidence                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 סובבו וממשיכים     | Small flat board; bus waits immediately before one straight piece turned sideways. Rotate it 90° in place.                                                                 | A usable continuous connection enables access to a school.                                         | Wrong rotation leaves a visible port gap; one correct turn resumes the same loaded bus. First arrival must follow promptly.                                                                   |
| 2 פינה לשער          | One corner sits in the tray; the school entrance is around a bend. Grab, rotate and snap it into the empty socket.                                                         | The route must reach the actual service entrance, not merely its vicinity.                         | A wrong but placeable orientation stays wrong; the bus waits at its open edge. Rotate without restarting to recover.                                                                          |
| 3 החלק שחוזר         | Two gaps and one useful piece on an unused spur. Move that piece, then reuse a corner to finish a short loop.                                                              | Connectivity and return service depend on the whole network, not one visually long road.           | Taking the wrong piece creates a new visible gap. Undo returns the previous board/simulation; no piece or rider is lost.                                                                      |
| 4 בוקר בלי חץ        | A new home/school orientation uses the same straight/corner verbs, with fewer instruction cues.                                                                            | Transfer the connection rule to changed spatial arrangement.                                       | A memorised left-to-right assembly fails. Solve from the visible endpoints without an answer overlay.                                                                                         |
| 5 בית ספר או מרפאה   | A physical diverter offers two destinations. Rotate its active branch towards the service the onboard children need.                                                       | Land use generates specific trips; facilities are not interchangeable.                             | At the wrong facility the school passengers stay onboard, with a local school/people cue. No colour-only matching or quiz.                                                                    |
| 6 סיבוב של שירותים   | Two passenger groups need work and school. Reconfigure a short service loop/switch so the same bus can visit both.                                                         | A town's service distribution creates several journey needs.                                       | A school-only loop cannot count work trips as complete. Each original person reaches the appropriate place.                                                                                   |
| 7 התחנה בצד הנכון    | A stop/platform tile can face the homes or a fenced inaccessible side. Rotate it 180° without changing the road's straight ports.                                          | Walking access and service availability are different from road continuity.                        | The bus passes a badly oriented stop while people remain behind the barrier. Correct platform access creates an actual walk and boarding.                                                     |
| 8 הרחוב השקט         | A short residential corridor and a longer park-edge bypass are both connectable with the supplied corners/switch.                                                          | Access must be balanced with nuisance near homes.                                                  | Direct service can deliver everyone yet violate the explicitly shown quiet-street condition. The quieter configuration must still serve the homes.                                            |
| 9 החוף הצר           | Sea west and a rising inland edge leave a narrow flat strip. Fit a short continuous route into that corridor.                                                              | Limited buildable coastal land changes feasible network placement.                                 | A normal tile cannot be placed over water or unsupported slope. Terrain restrictions are visible before drop.                                                                                 |
| 10 סיבוב על קו גובה  | A short steep climb competes with a longer gentle terrace. Orient the ramp's high end correctly and connect the contour pieces.                                            | Grade and elevation continuity alter route validity and travel.                                    | Ports that align in plan view but disagree in height do not connect. A long gentle route must actually work and differ from a flat-terrain counterfactual.                                    |
| 11 הגשר במקום        | One bridge piece and authored bank sockets; the river cannot be filled with ordinary road. Move/rotate the bridge to the legal crossing.                                   | Crossing sites and support are geographically constrained resources.                               | A flat tile over water or bridge off the usable abutments rejects locally without loss. A legal bridge carries a real vehicle.                                                                |
| 12 חוף–הר–בקע        | A new west–east section needs ascent and descent with opposite ramp orientations. The small eastern community needs the regional service too.                              | Coast, inland highland and eastern lowland require different approaches.                           | Reusing the uphill orientation on the descent fails height continuity. A fixed north cue and readable elevations support unaided transfer.                                                    |
| 13 חוזר לעוד ילדים   | More people wait than fit in one bus. The outbound trip works, but a missing corner in a visibly one-way return loop strands the bus beyond the school. Repair the return. | Seats and repeat service matter; reaching the destination once does not provide continuing access. | The first six arrive, but remaining people cannot win until the same bus returns and carries them. Do not fabricate a fresh bus at the next edge.                                             |
| 14 נפגשים בגשר       | Two buses approach a one-lane crossing with no useful waiting space. Rotate/place a large passing-bay piece to create a safe yielding arrangement.                         | Shared finite capacity and space for waiting govern flow.                                          | A reservation rule must not allow overlap, oscillation or invisible priority. The bay must resolve a genuine physical blockage rather than just decorate a queue that would clear anyway.     |
| 15 העברה במקום הנכון | A fixed rail shuttle already runs. Move/rotate the road stop so its permitted walk connects to the actual platform.                                                        | A fast trunk requires a usable feeder and transfer.                                                | A stop one cell short leaves people physically waiting; they do not jump onto the train. Correct access produces real bus→walk→rail travel.                                                   |
| 16 הגל שינה כיוון    | A clearly announced second origin becomes active on a different branch. Rotate familiar switches to collect it while keeping the first service intact.                     | Changed land use/demand can make yesterday's arrangement inadequate.                               | The old complete-looking loop serves the first group but not the new one. A visible repair changes who can board, without a new toolbar or surprise loss clock.                               |
| 17 ארבעה בקצה        | The central route works; four people at the edge remain behind one bad corner and its return connection.                                                                   | Small-community access cannot vanish inside aggregate throughput.                                  | Twelve central arrivals do not win while the edge group has zero access. Repairing the feeder serves those same four individuals.                                                             |
| 18 קרוב אבל ארוך     | Near homes have a steep/shared slow approach; farther homes have a longer clear corridor. A switch/corner choice changes actual journey time.                              | Geometric distance does not equal access time.                                                     | Both reasonable configurations may be viable. Measured travel/waiting must demonstrate the intended reversal; optional improvement rewards must not assert that every longer route is faster. |
| 19 מרפאה קרובה       | A large clinic-court piece can snap to two clearly zoned service plots. Place it locally and align its entrance with a permitted walk/road.                                | Distributing a service can reduce dependence on a distant centre.                                  | A placed clinic still needs real access. It cannot satisfy a school trip or instantly serve people on another cell. Same grab/rotate/snap interaction, no building dashboard.                 |
| 20 כולם עוברים       | Limited pieces cannot support two independent routes. Use a shared loop/diverter arrangement to serve both the large centre and small edge group.                          | Equity under scarce network resources differs from maximum central flow.                           | A fast central-only configuration is incomplete. The piece inventory and route state must allow a known plan that serves every group without reaction-time skill.                             |
| 21 עוד מסלול?        | Choose a wider-road piece or a route to a visible parked spare bus/depot. The widening option explicitly announces an additional later passenger group.                    | Vehicle road space, passenger seats and conditional demand are different quantities.               | Widening changes physical occupancy, not bus seat capacity. Additional people appear exactly once; the depot bus has a persistent identity rather than spawning from a number button.         |
| 22 הגשר מושהה        | A sign/barrier announces a bridge closure after a safe first lap or other clear event. Rotate a switch to the alternate crossing while the bus waits safely.               | Resilience requires a real alternate access path.                                                  | The bridge closes only with coherent handling of occupied vehicles. No passenger deletion, off-board reversal, random unavoidable failure or hidden deadline.                                 |
| 23 שתי דרכים טובות   | An open compact layout supports a road-loop/local-clinic plan and a distinct feeder/fixed-rail plan. Familiar pieces only.                                                 | Networks can trade land footprint, walking, waiting and service distribution.                      | Independently verify two materially different valid plans, not a mirrored copy. Both serve everyone; optional rewards expose the tradeoff plainly.                                            |
| 24 מחברים את הארץ    | An unfamiliar coastal/highland/eastern-lowland board combines a supported crossing, opposite ramps, familiar diverters and the last community's clinic access.             | Integrated relief, land use, capacity and equitable access transfer.                               | No final new verb or tiny-piece maze. All groups must actually arrive; a planned/unopened service is not counted. Ordinary geographic cues remain while answer aids are reduced.              |

The clinic-court piece in mission 19 is a proposed way to retain actual service-distribution choice within the same tactile grammar. If the lead chooses strictly road pieces only, substitute two already visible clinics with different usable access, and describe the assessed concept as **service accessibility**, not constructing/distributing a new service. Do not claim a mechanic that the chosen rules do not implement.

Likewise, mission 21 needs a real occupancy/seat/demand distinction. If widening is omitted, rewrite that mission around another explicit capacity/access comparison; do not keep an induced-demand title with no conditional model underneath.

## Independent model expectations

### Pieces, ports and transactions

- Four quarter-turns restore every piece's original ports, heights, lane mapping and rendered orientation. Moving a piece does not change identity/type.
- Straight, corner, switch, ramp and bridge mappings agree with the visible geometry. Reciprocal-looking ports with wrong height/mode are disconnected.
- Placement, rotation and movement use the same legal-support rules. Invalid drops are atomic and leave piece inventory, people, vehicles and resources intact.
- A held preview cannot become a committed lane before snap. Cancelling a grab returns the exact piece to a coherent location.
- Board plus tray plus held inventory contains every original piece exactly once. Two pieces cannot occupy the same socket.
- Editing a reserved/occupied footprint cannot rotate a bus, erase its support, duplicate a vehicle or strand it inside a mesh. The short refusal/braking response must be visible and recoverable.
- Undo restores a declared snapshot including orientation, occupancy, bus ID/position/direction, riders, waiting queues and clock. Retry replays the authored initial situation deterministically.

### Vehicles and people

- A bus's ID persists through tile boundaries, turns, waits, stops, terminal turnaround and subsequent trips. Its passenger IDs stay with it until a legitimate alight/transfer.
- A bus brakes before an unconnected port or closed connection; no part drives through a gap. Repairing ahead resumes it without resetting the trip.
- A valid piece configuration is the route the bus physically follows. No model-only path may cross grass/water while the visible road points elsewhere.
- Every authored person is exactly pending, waiting, walking, riding or arrived. Vehicle membership agrees with riding state; transfers never create a new person.
- Seat capacities are finite; full vehicles leave real people waiting. Return-loop and repeated-trip cases must test the second group, not only the first load.
- Vehicle footprints/reservations prevent both same-direction overlap and opposite-direction bridge collision. A visible give-way rule and passing bay resolve the authored blockage without starvation.
- Wrong service kind, unopened facility, inaccessible platform and missing final walk do not satisfy a journey. Walking obeys actual permitted paths and barriers.
- Completion requires every specified group/person and the shown scenario constraints. Mean totals, an optional medal or a brief arrival pulse cannot hide an unserved community.
- Conditional demand/closures are deterministic, announced and conserved through undo/retry. New unserved demand reopens any previously completed goal.

### Geographic counterfactuals

Use small independent fixtures as well as complete mission witnesses:

- Flatten a hill while retaining the pieces: the previously steep/height-mismatched option changes legality or travel as designed.
- Replace a river with buildable ground: the bridge-site requirement changes. Return the river and ordinary road cannot cross it.
- Change the platform's walking side or block its footpath: boarding changes even if the vehicle road ports remain identical.
- Move a sensitive home zone: the nuisance consequence changes, while the same route still carries the same people.
- Move/open a same-kind service locally: journey reach/time changes, but demand identity and the need for actual arrival remain.
- Add the small edge group: an otherwise successful central configuration must remain incomplete until they are served.
- Compare near/slow and farther/fast routes using actual travel/waiting, not an assumed distance ranking.

Each of the 24 definitions needs a known action-sequence witness and a plausible near miss. A witness consists of real piece IDs, quarter-turns, legal drops and any event timing, with expected bus/passenger states. A static connectivity proof alone is inadequate for a moving-switch, passing-bay or return-loop puzzle. Oracle witnesses establish solvability, not comprehensibility or fun.

## Actual-control UI expectations

Run the first experience in a fresh context without reading a solution or using a model/plan injection. Record confusion before consulting diagnostics. Later regressions may use known witnesses, but every grab/rotate/drop must go through real pointer/touch controls. A supported clock hook may advance later traffic; it must not assemble pieces or manufacture a win.

- The initial gap, bus and one editable piece dominate the view. Intro should use roughly a 3×3 or similarly compact active board, not a distant 10×10 grid. Board size is subordinate to readable objects.
- Use large pieces and forgiving hit areas. As a chosen starting target, each intro tile should remain comfortably larger than a 44-pixel control on portrait; test the actual foreshortened shape rather than its nominal world size.
- One action lifts/selects a piece immediately; a visible quarter-turn affordance responds without a modal; snap/port feedback occurs at that piece.
- The bus visibly brakes/waits at the actual broken edge. A gentle nudge/hazard cue communicates waiting, not a punitive crash/game-over state.
- The same repair works by mouse and touch. Touch needs no hover, tiny rotation handle, accidental page scroll or keyboard dependency.
- An incorrect orientation can be corrected in place. A bad drop, occupied-tile attempt, undo and retry must each leave an understandable next action.
- Inspect the actual boarding moment, physical bus motion, gap wait, snap/resume, arrival and return. A screenshot of a solved board is not enough.
- First useful manipulation should be possible within 5 seconds; the first rescue should start the bus within 10 seconds; the first arrival should be visible shortly afterward and first win within one minute. These are design targets to test, not measured player outcomes.
- A win celebrates in the world without covering the bus/road or overlapping the piece tray. Arrival cues must not promise pickup where no usable service exists.
- Test portrait final missions as well as the intro. Large pieces must survive escalation; do not solve late label/cell crowding by shrinking the whole board into a minimap.
- Regional maps retain a readable north cue; coast/west, inland highland and eastern lowland remain coherent when the camera changes.
- Mute, reduced motion, pause, focus-loss pause, resize, quick undo/retry and local earned progress require rebuilt checks. Old V1/V2 results do not substitute.

## First-minute acceptance sequence

| Target  | Observable result                                                                                                                           |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 0–3 s   | The bus is visibly waiting at a short gap; one oversized road piece and the school explain the immediate rescue without a reading modal.    |
| By 5 s  | A fresh reviewer grabs or rotates the intended piece without being told a piece ID or a solution.                                           |
| By 10 s | A correct quarter-turn/snap joins the real ports. The bus resumes within about half a second; no Send/Run or separate stop setup appears.   |
| By 20 s | Real people arrive at the school, with clear in-world acknowledgement and the same bus still present.                                       |
| By 35 s | The next small board introduces grabbing/moving a corner; a plausible wrong orientation visibly blocks the bus rather than ending the game. |
| By 50 s | Rotate the piece in place or undo one move, then see that same bus continue with its passengers intact.                                     |
| By 60 s | The reviewer reaches another visible arrival/win and can describe what they changed. No huge instruction panel or hidden timer was needed.  |

A scripted expert replay can regress these inputs/timings, but it cannot certify that an unprompted human understands or enjoys them. Retain the human's clarified tactile intent as the acceptance bar rather than substituting a high test count.

## Curriculum and accuracy boundaries

The proposal retains the supplied Workbook scope:

- [City structure and land use](https://geography.workbook.co.il/grade-7/chapter-5/city-structure): distinct home, work, school and health journeys; local service distribution.
- [Urban nuisances](https://geography.workbook.co.il/grade-7/chapter-5/urban-nuisances): serving people while respecting inhabited space and nuisance tradeoffs.
- [Core/periphery](https://geography.workbook.co.il/grade-7/chapter-2/core-periphery) and [core/periphery in Israel](https://geography.workbook.co.il/grade-9/chapter-4/core-periphery-israel): the last community, service availability and actual access rather than raw population or kilometres.
- [Transport and communication](https://geography.workbook.co.il/grade-9/chapter-5/transport-communication): capacity, boarding, walking, transfer, time and resilience.
- [Landform belts](https://geography.workbook.co.il/grade-9/chapter-2/landform-belts): west–east relief, contour/grade and crossing constraints.

Use the exact local snapshots under `docs/curriculum/` as authority. Fixed/mobile infrastructure terminology remains unassessed because the transport source conflicts internally. Maps, pieces, counts and timing are original schematic teaching scenarios, not current routes, exact GIS, engineering standards or legal noise limits. No quiz gates, match-colour-only assessment or learning-gain claim is needed.

## Handoff to implementation QA

After the lead's tile/vehicle model API exists, independent tests should target the behaviours above rather than copy the old route-drawing implementation. After a complete first rescue/mistake/undo/win loop exists, inspect it with normal inputs against the new action-puzzle mockups. Only then expand the authored campaign while checking each new geographic relationship and counterexample. No implementation, test pass or actual-play result is claimed by this plan.
