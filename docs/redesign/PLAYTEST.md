# Rebuild verification record

The human rejected V1's controls, flow and graphics. V1's 69 passing tests, baseline sweeps and captures remain historical evidence and do not certify this rebuild. This record contains only evidence for the new persistent-line game.

## Required rebuilt-model checks

Independent expectations are in `tests/rebuild/EXPECTATIONS.md`. The new tests verify exact continuous paths, automatic launch/stops, persistent vehicle identity/return trips, boarding only where needed, individual/seat conservation, finite shared crossings, grade/mode/closure constraints, local same-kind service, full per-group goals, atomic invalid actions, undo/retry and 24 authored solutions.

## First-minute playability gate

Use a fresh browser through normal controls without importing or reading mission solutions, clicking hints or injecting a plan/win state. Log the first confusion before using diagnostic hooks. The inspection must distinguish an experienced-agent review from a naive-player study.

- A useful route action starts within 5 seconds; a completed line launches a visible bus within 10 seconds.
- An intermediate bend is preserved through a continuous pointer/touch gesture.
- People visibly board, stay on the same bus through ordinary junctions, alight at the destination and remain accounted for.
- First arrival happens soon and first win within one minute; introductory play has no failure clock.
- A spatial mistake has a local visible cause; edit/undo and retry restore understandable flow.
- A bus continues/returns rather than disappearing after an edge or victory; the world reward remains visible.
- Compare actual desktop and portrait captures to the fresh design target for object scale, action, boarding, feedback and reward. A generated image is a proposed target, not implemented-play proof.

## Current status

The new contract/types and generated target03 have been reviewed. Independent rebuilt tests currently report **51/51 passing**: all 24 known solutions and an alternate mission-23 feeder/rail plan, campaign distinctness, and new rule fixtures. Persistent IDs across junctions/return trips, six/fourteen seats, individual/walking conservation, atomic illegal paths, no intro deadline, all-group goals, actual transfer availability, finite bridge occupancy, service kinds, pause, undo, retry fleet retention, reroute continuity, closure, explicit nuisance and coallocated-bus headway/one-platform boarding pass.

QA caught three regressions the lead fixed: retry dropping extra buses, disjoint replacements leaving the visible route disconnected from its bus, and endpoint reversal at a closed edge crashing the model. QA also caught widening after a win adding pending people while leaving the goal marked won. The lead fixed it; the new conditional goal now reopens and requires those people to arrive. A new planned-clinic regression also passes: a route to an unopened clinic site cannot satisfy demand, and opening it still requires actual walking or vehicle arrival.

## Real-time first-minute result

The natural-control inspection used the rendered instruction and place labels, with no hint, solution import, progress/plan injection or time stepping. It immediately produced a working line, visible boarding and travel. The separate reproducible regression `tests/rebuild/first-minute.ts` imports no campaign solution and uses no `advanceTime`; it replays those already inspected actions rather than simulating a naive participant.

Final frozen-build run at 1440×900:

| Observation after beginning the home→school gesture                                                     | Real elapsed time |
| ------------------------------------------------------------------------------------------------------- | ----------------: |
| First actual arrival                                                                                    |           5.543 s |
| Eight of eight arrived; first win                                                                       |          15.144 s |
| Both first missions complete, including steep-route rejection and one continuous valley-stroke recovery |          40.112 s |

The same bus ID survives the trip and return, each rider boards once on the continuous line, and undo restores the explicit prior snapshot. At 390×844, normal two-tap input wins mission 1 and a three-point tap path through the valley wins mission 2. No console/page errors or source reload occurred. Final HUD/reward captures were allowed to settle before capture; they show 8/8 rather than an old animation frame. Evidence: `tests/rebuild/evidence/final/first-minute-record.json`, `tests/rebuild/evidence/final-run.txt` and the desktop/portrait PNGs under `tests/rebuild/evidence/final/`. Desktop first-win and portrait second-win images were visually inspected.

These timings measure an executed expert/automated interaction and its real-time follow-through. They do not measure an unprompted student's discovery time or prove enjoyment. The large bus, visible people, recognisable home/school, immediate launch, local grade feedback and unobscured first-mission reward are observable improvements over V1; user acceptance remains separate.

## Later normal-control regressions

`tests/rebuild/later-play.ts` navigates all 24 missions sequentially through normal visible route/fleet/service controls. It imports reference plans to navigate non-test missions; it does not inject progress, a network or a win. The time hook advances only elapsed simulation after real actions. This is operational/rule evidence, not blind-discovery evidence.

The final full run won all 24 with no console/page errors or hot reload and separately observed:

- Mission 8: all 22 arrive on an intrusive route but explicit nuisance blocks the win; the visible quiet-street reason explains why. Redrawing the same line through the quieter approach satisfies the constraint.
- Mission 13: real full buses/queue, then extra departures through the fleet control; UI retry retains the extra fleet. Physical P/Space and settings pause freeze the clock, motion/sound toggles work, and fullscreen enters/exits.
- Mission 14: tap a feeder to a station, explicitly finish there with `סיימו כאן ✓`, then connect rail. A real feeder→rail→walking journey yields two actual boardings per person.
- Mission 20: serving the central 32/36 does not win; local access then serves the remaining four.
- Mission 21: widening creates exactly 24 conditional people (60 total); a fresh bus alternative has the original 36. Both retain real passenger accounting.
- Mission 22: an announced closed crossing leaves people waiting/riding; an actual alternate route restores access.
- Mission 23: taps through intermediate stations remain one continuous line rather than committing early.
- Mission 24 at 390×844 with real touch: both complete routes can be entered, 36/42 remains incomplete while the clinic is only planned, and opening/reaching the local clinic serves all 42.

Evidence is in `tests/rebuild/evidence/later/later-record.json`, `tests/rebuild/evidence/later-run.txt` and matching PNGs. The mission-24 portrait gap/win and mission-8 nuisance images were inspected. The final run also verifies that earned mission-24 progress persists after a normal reload.

That inspection caught two UI issues which are now fixed and regression checked: an arrival pulse briefly promised pickup to an uncovered community, and advanced cards overlapped the portrait win banner. The pulse now states only the arrival fact; the pending clinic/group remains visibly incomplete. Advanced cards hide on completion and the portrait reward is unobscured. Art repaired a later road segment's relief occlusion and rotated a late home cluster clear of the route. A final fresh portrait review earned progress through normal UI, then used real touch routes and clinic placement in mission 24. The ready / 36-of-42 gap / 42-of-42 win captures in `tests/rebuild/evidence/portrait24/` were inspected after that placement correction: roads, ascent and vehicles are clear, the planned pad becomes a clinic, and the reward is unobstructed. `tests/rebuild/evidence/portrait24-run.txt` and that folder's `later-record.json` record the review. A visible north cue makes the rotated regional map interpretable. The art owner's final landscape capture `docs/redesign/mockups/actual-level24-terrace-final.png` was also inspected.

Station taps now remain part of a continuous route. A player may continue to another station/destination, or explicitly end a feeder at the selected station with `סיימו כאן ✓`. Releasing a drag at a station still ends the line normally. The final tests exercise both station continuation and explicit feeder finishing.

## Remaining evidence limits

An experienced-agent inspection is not a naive-player study. No student learning or fun outcomes have been measured. Native OS focus switching has not been independently validated for the rebuild. Earlier hot-reload-interrupted captures are moved to ignored `work/rebuild-audit-history/` and are not counted as final success/failure evidence. The generated design targets remain separate from actual play captures.
