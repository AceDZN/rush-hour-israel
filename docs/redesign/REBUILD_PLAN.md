# Rush Hour Israel — play-first rebuild plan

Status: design investigation. No game code changed. Fresh generated gameplay mockups must precede implementation.

## Human feedback is the new acceptance criterion

The human rejected the first version as weird, ugly, unclear, boring and too hard because of game flow, controls and graphics. Earlier automated success and rule conservation were not evidence that someone could understand or enjoy the game. The old simulation and captures are historical reference, not an approved design.

## What the other Workbook games teach us

Read-only review of Goblin Kitchen's current identity/README and actual restored level1 capture: a recognizable kitchen, visible physical stations, one concise recipe and immediate state-changing actions support the learning. Its progressive campaign introduces tools instead of exposing everything immediately.

Read-only review of Critter Safari's current identity/README/visual review: the human previously rejected walking+aiming+timing. The rebuild reduced this to placing a trap and bait, showed the consequence, and allowed immediate release/retry. Its old first-person iab-deliverable capture is explicitly historical; only refinements/current campaign captures describe current play.

Read-only review of Rooftop Radio and Wordcraft Islands: one consistent physical loop, context actions, forgiving recovery, gradual progression and optional help carry the curriculum. Do not copy their assets, content or controls indiscriminately.

## Main failure hypotheses to verify

1. The map looks like a technical diagram, with tiny anonymous buildings and passengers rather than a place with a visible problem.
2. Eight tools, separate stops/services, plan/run phases, time compression, budgets and group percentages ask for too much operational knowledge.
3. The useful result is delayed; a player can draw an apparently complete link and still see nothing happen.
4. The next action and reason for failure are distant text rather than a clear response beside the affected place.
5. Strict clocks and individual deadlines punish learning the interface. UI complexity is mistaken for strategic difficulty.
6. A technically solvable 24-level set was expanded before the core loop received human feedback.

## Working direction (user preference pending)

A compact, lively transport puzzle. Draw one route; a bus starts immediately; visible people board and arrive. Repair one clearly shown bottleneck. First levels are untimed and forgiving. Houses, school, clinic, river and hills are large, recognizable scene objects. Stops and ordinary service setup are automatic consequences of drawing a route.

One active gesture at a time. Tap-to-connect is an equivalent alternative to dragging. Undo always available. Holding a route pauses pressure. New verbs appear only when their world problem is introduced. Camera fixed initially, adjusted per scene. Detailed diagnostics remain behind an optional inspector.

The first action should take under five seconds, first moving vehicle under ten seconds, first arrival shortly afterward, first win under a minute. These are product targets to test with normal inputs, not learning claims.

Geography must still change the action: river crossings, buildable slopes, limited flat land, service reach and the last community remain real constraints. Remove administrative busywork while retaining spatial choices.

## Before implementation

- Independent art and first-minute playability audits.
- Two fresh built-in imagegen gameplay mockups showing the first meaningful gesture and a later repair, with achievable 3D framing and sparse Hebrew UI.
- Inspect the images against a concrete action/feedback/retry loop, save exact prompts and limitations.
- Resolve the user's gameplay preference before committing to a fundamentally different genre.
- Reuse the existing permitted Tripo bus unless a new asset is justified. No new generation or credits needed for planning.

## Selected working interaction and implementation split

Fresh mockups 01/02 were generated and reviewed; 03 refines the first minute to remove the hill trap from the opening. The compact route puzzle is the working direction while the optional user genre preference remains unanswered. This retains the requested transport game; a later explicit preference can steer the prototype.

First mission: eight visible students, a recognizable school, one continuous unobstructed route. Dragging or successive taps selects a full path; release at the destination starts the first bus and automatically supplies usable stops. The same vehicle continues through bends, unloads at the school and returns for the remaining people. No tool selection, manual launch, clock failure, monetary budget or percentage target precedes this reward. Undo and pause remain visible. Later missions introduce one spatial problem at a time; detailed rules remain under the surface until useful.

The new runtime is separate under src/rebuild/ so the previous implementation remains recoverable in Git. Lead owns campaign/model/UI; art owns the close inhabited 3D scene; independent QA owns new rules and playability checks. Old rule tests are historical guards, not evidence that the new loop works. Continuous gestures and persistent vehicle identities are explicit new invariants.
