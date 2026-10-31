# Difficulty audit: keep the gesture, require a plan

Status: design proposal after the human's feedback, **“game is much better now, though it looks a bit too easy, also graphics still shitty.”** This audit reads the current `src/action/` campaign/model. It changes no runtime code. Fresh visual mockups must precede art implementation; the confirmed grab/rotate/snap interaction stays.

The previous 55 model checks and 24 control wins established specific functionality. They did not establish challenge, attractive graphics or enjoyment. The useful change now is to make the player construct and revise a network, rather than identify the one part missing from an already drawn answer.

## Why the current boards give away the answer

A read-only campaign census found:

| Current authored witness property                     | Observation                                                     |
| ----------------------------------------------------- | --------------------------------------------------------------- |
| Touches one or two distinct pieces                    | 22 of 24 missions                                               |
| Touches only one piece                                | 10 missions, including 13, 14, 17, 18 and 19                    |
| At most three movable pieces in the entire board/tray | 23 of 24 missions                                               |
| Fixed versus movable pieces across the campaign       | 149 fixed / 43 movable, about 78% fixed                         |
| Largest witness                                       | Four distinct pieces and eight quarter-turn/place counts, in 24 |
| Unused movable inventory in the primary witness       | Only 11 and 21                                                  |

These are counts from authored witnesses, **not independently computed optimal move counts**. Some three-quarter rotations can also be performed as one reverse turn. They should not be presented as minimum required moves or a measure of student difficulty.

The board generator draws complete paths as locked pieces, then removes one or two pieces. In most missions the remaining ports already specify both location and shape. Automatic dark sockets beside connected ports reinforce the answer. The tray typically contains exactly the required shapes; the ordinary-road decoy in 11 rejects immediately on water. It teaches support, but does not create a legal planning alternative.

Several later ideas are meaningful but barely require assembly: the real return problem in 13 needs one corner; the rail feeder in 14 needs one corner; the peripheral community in 17 needs one corner; the near/far example in 18 needs one ramp; and 19 needs one clinic placement. Extra passengers mainly add waiting after that single repair. The final board combines familiar themes, but still exposes only three road repairs and one clinic.

Unlocking additional correctly placed road will not fix this. It changes a metadata count while leaving the answer visible. Necessary parts must also be missing, misplaced, misoriented or committed to a plausible but incomplete branch.

## A fair definition of increased depth

Keep the first two mornings as brief onboarding. From 3 onward, retain recognisable endpoints and some safe approach road, but expose a field in which a player must choose a connected configuration.

A **dependent decision** is a choice whose consequence changes what remaining pieces or cells can usefully do. Examples include spending one of two corners on a branch, choosing a bridge site that leaves enough pieces for the hill approach, or orienting a return arrow so the remaining eight people can be collected. Three compulsory quarter-turns of the same corner are one orientation decision. Three obvious straights in a premarked channel are assembly work, not three planning decisions.

The following are authoring/review targets, not claims of measured cognitive difficulty:

| Band  | Meaningful movable parts | Minimum decision target   | Required alternative                                                                              |
| ----- | ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------- |
| 1–2   | 1 each                   | Learn grab, then rotation | A reversible wrong orientation; immediate success                                                 |
| 3–4   | 3–5                      | Two linked choices        | At least two locally coherent prefixes; at least one needs reconsideration or a real route choice |
| 5–8   | 4–6                      | Three linked choices      | Two route/service arrangements, rather than two differently coloured gaps                         |
| 9–12  | 5–7                      | Four linked choices       | Competing terrain approaches or support sites; at least one scarce shape matters                  |
| 13–18 | 6–8                      | Five linked choices       | Outbound/return, transfer or shared-access commitments constrain the rest                         |
| 19–24 | 7–10                     | Six linked choices        | Two resource couplings plus all-group access; use familiar verbs on a changed layout              |

Part counts alone are insufficient. A seven-piece forced channel can still be easier than a four-piece branching board. At least one nonwinning alternative must be **legal and locally connected**, not a rejected drop or a random disconnected road. Some boards should accept materially different complete solutions.

Preserve untimed goals, safe visible braking, free undo/retry and optional move-economy stars. Do not create difficulty by slowing the bus, speeding a deadline, hiding terrain heights, shrinking targets, adding confirmations or forcing players to edit occupied pieces at precisely the right moment. Record thinking and voluntary revisions separately from travel/wait time. No minimum completion time should be manufactured through animation delay.

For phone readability, seven to ten movable parts need not mean ten tray slots. Put several reusable pieces on the board and keep roughly three or four in the tray. Preserve large physical targets and clear buildings/terrain. Avoid a new inventory-management interface.

## Concrete pilot boards

The following are proposed blueprints, not yet validated runtime missions. Validate their actual inventory, ports, heights, return reachability and alternate plans before claiming solvability.

### 4: two bend columns, one finite inventory

Use a 5×4 board. For an explicit candidate, put home at `(0,3)`, a short locked east–west approach at `(1,3)`, and school at `(4,1)` with an east–west entrance. Supply two corners and two straights as the required movable inventory; an optional spare must have a plausible use rather than be obvious rubbish.

Two compact route families can use that same inventory:

- Turn north at `(2,3)`, use `(2,2)`, turn east at `(2,1)`, then use `(3,1)`.
- Continue through `(2,3)`, turn north at `(3,3)`, use `(3,2)`, then turn east at `(3,1)`.

The endpoints and approach stay fixed; the four intermediate pieces do not begin in their correct places. Both complete routes should be accepted. Using the second corner too early can produce a legal connected prefix with insufficient bends left to reach school. This makes the player read the whole route instead of matching two sockets. The diagram may be rotated for transfer from the introductory orientation.

Acceptance: at least four necessary arrangements; two complete route families verified; a locally connected wrong allocation is recoverable; the scene does not show the full winning channel before play.

### 8: commit both corners to one park bypass

Use a 5×5 board with home `(0,2)` and school `(4,2)`. Their fixed endpoint junctions permit the direct corridor and either bypass. Reserve `(1,2)`–`(3,2)` as quiet garden. Supply two corners and three straights, with most of the bypass road absent or misplaced.

The five intermediate cells on row 1 form one complete bypass; row 3 forms another. Both are valid. Splitting the two corners between north and south is locally legal but fails to connect the whole journey. The limited corners force a coherent commitment; no prebuilt row tells the player which bypass to use.

Geography counterfactual: change only the quiet cells to ordinary land. Three straight pieces should then make the short direct connection useful. This proves that protected land changed the plan. It remains a land-use protection rule, not a decibel simulation.

Acceptance: two viable bypasses; a legal split-branch near miss; quiet-to-flat counterfactual; no building lot covering either candidate corridor.

### 13: first arrivals reveal a network obligation

Keep fourteen people and the six-seat persistent bus. Preserve a working eastbound one-way outbound lane so the first six can arrive. Replace the one-corner return repair with five to seven movable return parts, including a visibly directed westbound road. Scatter some parts into an incomplete return spur so reclaiming inventory matters.

One candidate 5×5 arrangement has home `(0,3)`, school `(4,3)` and the outbound lane between them. Return can use the southern row 4 with two corners and three straight-shaped pieces, including the westbound arrow. A longer northern route through row 1 uses seven pieces. The upper and lower plans can both be accepted; the shorter plan need not use every part.

A fully connected-looking return assembled with its one-way arrow eastbound is a legal but operationally wrong plan: it offers another outward path and cannot bring the bus home. The remaining eight people stay visible. The player must read direction, allocate the corners and finish a return topology; no timer or extra “start bus” verb is introduced.

Acceptance: first six arrive before repair; eight cannot be served by a single gesture from the authored initial return layout; at least two return plans or prefixes are documented; corrected arrows and loop carry all fourteen with original identities intact.

### 24: one bridge and ramp must serve both road groups

Retain a compact 6×5 schematic coast/hill layout and the three groups. Expose approximately eight movable road pieces plus the clinic, rather than merely unlocking their existing correct placements. Keep short endpoint stubs; misplace or remove the necessary approach, bends, shared junction and highland continuation.

A concrete lower-network backbone can reuse the current geometry:

`coast (0,3) → (1,3) → bridge (2,3) → (3,3) → (3,4) → shared junction (4,4) → north-high ramp (4,3) → high road (4,2) → bend (4,1) → school (5,1)`.

The eastern road group at `(5,4)` must join the shared junction. Give the river two genuinely legal east–west abutments but only one bridge. The upper crossing is physically plausible; its longer approach or ramp placement must consume scarce shapes or isolate the eastern group. The lower crossing can feed the shared ascent with the available corner/straight inventory. Reserve both candidate corridors from building decoration.

The decision is global: a crossing that reaches the school for the coastal group is insufficient if the only ramp cannot also provide access from the eastern community. Bridge location, corner allocation, shared junction, ramp orientation and both approaches must be planned together. The local clinic remains a useful service step, but the present model's exact destination plot is **not** a genuine free location choice and should not be counted as one.

Acceptance: every individual still matters; one locally coherent bridge/ramp plan leaves an explicit group unserved; the tested winning plan serves coast, east and clinic groups; at least seven road arrangements are necessary from the chosen initial layout; touch targets remain comfortable in the new mockup and actual capture.

## Proposed 24-mission progression

These targets revise arrangement and choice while preserving the existing geography themes. They are not new verified content.

| #   | Planning problem after polish                                                                                                                                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Keep the immediate single-piece rescue.                                                                                                                                                                                                  |
| 2   | Keep the single corner/rotation introduction and easy recovery.                                                                                                                                                                          |
| 3   | Three necessary pieces; reclaim one installed part and choose where the remaining bend belongs.                                                                                                                                          |
| 4   | Assemble a four-piece route with the two bend-column alternatives above.                                                                                                                                                                 |
| 5   | Four to five movable pieces around a school/clinic fork; a locally coherent service branch does not satisfy the school journey.                                                                                                          |
| 6   | Five-piece shared town network for work and school; using both corners for one group leaves the other without a useful approach.                                                                                                         |
| 7   | Four to six feeder pieces plus a final walk; choose a useful approach to the actual stop, rather than fill its one missing straight. Do not invent platform-orientation rules absent from the model.                                     |
| 8   | Choose and construct a whole park bypass with finite corners.                                                                                                                                                                            |
| 9   | Five to seven pieces in a sea/rock-constrained corridor, with two plausible starts and limited bends.                                                                                                                                    |
| 10  | Fit ramp direction and surrounding bends together; plan-view alignment can still have a height mismatch.                                                                                                                                 |
| 11  | One bridge, two supported sites and finite approach pieces. Choosing a site changes the rest of the usable network.                                                                                                                      |
| 12  | Opposite high/low ramp ends and a shared highland approach; allocating both useful bends to one side strands the other.                                                                                                                  |
| 13  | Construct a return network after the first six arrive; one-way direction and unused/spur inventory matter.                                                                                                                               |
| 14  | Build a multi-piece feeder to the rail station while preserving a coherent terminal/return path. Rail remains an actual transfer, not a rail-coloured shortcut.                                                                          |
| 15  | Combine a longer feeder and the final walk; keep the rail trunk legible and move difficulty into choosing/assembling access.                                                                                                             |
| 16  | Two neighbourhoods compete for one bridge and shared junctions; allocate common approaches instead of finishing two independent sockets.                                                                                                 |
| 17  | Seven or eight useful pieces across central and edge access; serving the edge requires a shared network commitment, not a lone corner.                                                                                                   |
| 18  | Two topologically plausible approaches around relief. The near group's short map distance still differs from its useful route; assemble the actual detour instead of flipping one ramp.                                                  |
| 19  | Plan the central clinic route and local service together. Do not fabricate location optimisation from the current exact-plot rule.                                                                                                       |
| 20  | Limited corners/junctions make two independent complete roads impossible; a shared trunk serves both groups.                                                                                                                             |
| 21  | An announced larger demand requires a real return arrangement. The current wide tile has no capacity/speed advantage, so it must not be sold as a balanced widening-versus-normal-road optimisation without a corresponding rule change. |
| 22  | Assemble a genuine alternate route from distributed pieces after an announced closure. Recovery remains possible after the event.                                                                                                        |
| 23  | Two materially different complete networks with the same physical inventory; accept both and let optional stars distinguish economy.                                                                                                     |
| 24  | Integrated bridge/ramp/shared-access planning with eight to ten meaningful parts and all three groups.                                                                                                                                   |

## Model and presentation limits to respect

The existing router chooses a shortest-edge-count valid path. A tee is a connectivity junction, not a player-controlled switch. Increasing branch count cannot honestly be described as manually dispatching a bus unless the rules change. More passengers do not make an untimed bidirectional connected road require a different plan; return directions, missing shared access or finite pieces must create that requirement.

Clinic walking is presently an authored 1.8-second abstraction to a designated destination. Additional legal service plots are not automatically alternative useful goals. Quiet land rejects placement. Wide road currently triggers conditional demand but does not add seats, speed or headway capacity. Preserve these boundaries or deliberately implement and test new rules before changing curriculum claims.

The current scenery-lot invariant must expand to the union of intended alternatives and meaningful decoy prefixes, not only the preferred witness. A fresh visual target should show a nontrivial middle/late board with its real pieces, branch choices and terrain. A beautiful single-gap introductory mockup would not establish that the more complex boards remain readable.

Do not make fixed-looking roads draggable without a clear affordance. Conversely, unlocking correct roads without rearranging the board does not add depth. Occupied-tile locks must remain brief and explained; global undo must remain available. Preserve access to already unlocked missions when content revisions change; new move-economy records should be distinguishable from stars earned on earlier, easier layouts.

## Independent acceptance after implementation

1. **Record the authored census again.** Count meaningful movable inventory and distinct manipulated pieces, but label them as proxies. Compare the initial board visually with the new witness; do not accept a metadata-only unlock change.
2. **Verify all new witnesses and real alternatives.** Re-run conservation, occupied/held transactions, heights/modes, finite bridge occupancy, return loops, all-group completion and normal controls on the revised content. Earlier pass counts remain historical until rerun.
3. **Challenge the initial layouts without importing their witnesses.** For 4/8/13/24, record the reviewer's first plan and any revision before looking at the authored answer. This is independent expert challenge review, not a naive-student study.
4. **Search for one-gesture shortcuts on the pilot boards.** Enumerate legal rotations/placements from their authored initial states, then test completion. This catches a stray correct route or a one-gap board masquerading as a harder puzzle. Stronger minimum-move/optimality claims need a real bounded solver; do not infer them from `par`.
5. **Keep a coherent legal near miss.** The model must accept the relevant placement, preserve inventory/people, and show a locally connected prefix. It must fail a global requirement until a structural repair. A water rejection alone is not the near miss for every later level.
6. **Test geographic counterfactuals.** Change only quiet land, endpoint height, bridge support or access from the small group. At least the intended boards must change useful/valid plans. This distinguishes geographic mechanics from scenery on a pipe puzzle.
7. **Inspect normal-control desktop and phone captures.** Especially check new alternatives, distributed inventory, ramp/arrow readability, held previews, safe bus waits, landmark occlusion and accessible late-board drop targets. No answer injection or hint use in the challenge review.
8. **Use human feedback to calibrate.** The new boards should invite a plan and occasional voluntary revision rather than forced busywork. Record reasoning/choice and waiting separately. No automated count proves that the game is challenging or visually appealing.

This document proposes the difficulty pass. It claims no retuned implementation, new test pass, new graphic approval or student outcome.
