# Hands-on road rescue

The human explicitly selected **“Grab and rotate roads; rescue the bus”** on 31 October 2026, after rejecting the prior appearance and behavior. This supersedes the draw-a-line interaction in `src/rebuild/`. A successful automated route run did not answer the human's criticism.

## The promise

A compact crafted road puzzle comes alive under your hand. Pick up a substantial road piece, turn it, snap it into the town, and the waiting bus immediately uses the connection. Rescue people by repairing a tangible system. The visual thesis is warm ivory bevels and terracotta landmarks on a dark teal tabletop, with a large cream bus and a small finite tray of useful pieces.

## First minute

Six visible children, a home pickup, a school, one missing straight and one loose road tile. The bus boards automatically and brakes at the gap. Drag the tile into the town; it settles with a click and the same bus drives to school. No route drawing, start phase, stop creation, budget or opening failure timer. The second puzzle introduces a quarter turn. Tapping a loose piece selects it, tapping a cell places it, and tapping a placed road rotates it. Dragging repositions pieces. A contextual turn control and physical Q/E provide rotation during selection. Undo rewinds the action and modeled moment.

## Mechanical contract

- One authoritative grid model owns terrain, height, tile ports, bridge supports, service identities and vehicle routes. The renderer uses those ports; a visually plausible but impossible connection never counts.
- A piece has a stable identity, kind, quarter-turn orientation and either a board cell or a tray position. Inventory is finite. Locked landmarks/roads cannot be moved. Pieces under an active bus cannot be lifted or rotated.
- Vehicles move along connected pieces and stop safely before missing, incompatible, closed or occupied constrained crossings. Repair resumes the same bus and same people; no despawn/reboard at every tile.
- Six-seat buses return for remaining people. Later rail transfer has real separate vehicles/boarding, and a clinic tile opens actual local access. Every authored group must be served; a majority never hides an isolated group.
- Low ground, height-matched ramps, water/bridge supports, quiet land and changed demand make legal/useful moves differ. Geography changes the puzzle rather than decorating identical connector matching.
- Twenty-four authored boards gradually add turns, piece relocation, branches, relief, bridges, return queues, rail, peripheral access, local service, conditional demand and closure. Completion is untimed. Stars are an optional placement challenge: three at the shown verified target, two within two extra placements, one for any other full win. Rotations, rejected/cancelled/same-origin drops, tray returns, hints and time are free; Undo restores placements. A swap counts once. Targets are not claimed optimal. V5 placement scores preserve access/settings while leaving older score records intact.

## Feel and screen

The hand action changes geometry before any score. Lift, quarter-turn, hover footprint, snap compression, quiet ceramic click, bus departure, boarding and arrival supply immediate response. The useful board occupies most of the view. Small Hebrew objective, exact people count, undo/pause and physical tray replace floating place pills and editor cards. Desktop and portrait must keep large direct manipulation targets. Reduced motion keeps all functional feedback without springs.

## Design evidence before code

Both built-in imagegen outputs in `mockups/` were generated and visually inspected before creating the action runtime. Exact prompts are adjacent text files. `01-grab-rotate-exploration.png` establishes framing/materials but contains an impossible corner-in-straight-gap connection and excessive photographic detail; reject those aspects. `02-bridge-rescue-target.png` is the stronger buildable geometry/material target. Use original procedural bevels and simple rigid figures rather than promising photographic foliage or masonry. Generated screenshots are design targets, not captures of working software.

The existing permitted original Tripo bus is reused. No new generation or credits are required. Native deployment remains outside scope. Preserve prior versions and evidence as history, and verify the new interaction independently through actual drag, rotation, mistake/recovery, arrival and phone play.
