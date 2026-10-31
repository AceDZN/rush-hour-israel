# Rush Hour Israel — שעת שיא

Commissioned 31 October 2026. Own this repository and builder chat. Read docs/COMMON.md. Public repo https://github.com/AceDZN/rush-hour-israel . Dev 5303, preview 4303. Real-3D browser strategy, Hebrew grades 7 and 9, **24 authored levels**. imagegen targets first, Chrome Tripo assets second, then build and real gameplay comparison.

## The game

Fast, readable route-building strategy, inspired by Mini Motorways' escalating network pressure, Mini Metro's mode/network tradeoffs and Cities: Skylines' relationship between land use and journeys. Drag links across a compact 3D relief model, allocate a bus or rail line, then watch a short rush-hour wave expose bottlenecks. Reroute, create an interchange or stagger demand before the queue spills over. The pleasure is a tangled system snapping into a smooth moving network, with bustling buses and tiny train motion, audible rhythm and a satisfying flow combo.

First minute: link a residential neighborhood to a school across a narrow valley. The straight steep shortcut is too slow/expensive for a road; a winding route works but becomes congested as the work commute joins it. Add a bus service with the right stop coverage and a passing interchange. The queue visibly shrinks; a distant neighborhood remains underserved, so extend the feeder rather than adding more central lanes. Finish the demand wave with everyone reaching services within target time, then replay for lower land use and better access. No driving courier avatar and no policy sliders replacing route play.

Controls: pointer/touch draw route between valid nodes with intermediate bends; select bus/road/rail tools, drag stop/interchange location, Space plan/run, R retry wave, Escape pause. Time pressure pauses during instruction. Strategic orthographic/perspective camera can tilt/rotate to read relief; fixed north arrow and map reset. Terrain height affects engineering cost and travel time; actual 3D grade and bridges matter. Camera is high and cartographic, distinct from Basin's low water view and Windshift's chase view.

Art: a warm living relief atlas in sand-colored plaster and ink, Mediterranean blue coast on the west, forest-green hills, deep orange small roofs and navy route lines. Bus/rail vehicles are modeled recognizable Tripo objects. Clean cut topography, long shadows, landscape belts and active queues; restrained Hebrew labels, edge HUD, no giant dashboard cards. Avoid the standard toy-industrial island with a robot. Map routes are schematic original scenarios, not real present-day bus routes or GIS.

## Geography makes a real choice

Sources: g7-city.md, g7-nuisances.md, g7-core.md, g9-transport.md, g9-belts.md and g9-core.md. Demand originates from land use and distribution, not arbitrary matching colors. Access means time and service availability; periphery is relational, not just kilometres. Relief, valley crossings and limited flat coastal land constrain infrastructure. Mode capacity and frequency interact with waiting/transfer/walking time. Road widening can induce a scripted delayed demand response in later scenarios, not an assertion every road fails. External costs and access constraints make the optimal network different from maximum vehicle flow.

Pure rule model: graph with length/grade cost, link capacity, vehicle capacity/headway, nodes with typed land use and demand, queues, boarding and transfers. Person throughput and time-to-service matter. Agent routing considers the supported travel/wait/transfer components; avoid teleporting passengers through graph lines. Use finite authored waves, not an infinite city sim. Add legible patterns/icons/labels for destinations, but don't use matching colors as the whole game. New demand and ground geometry must change the answer.

Source QA: g9-transport has conflicting explanations of fixed/mobile infrastructure. Do not quiz that distinction until corrected; if relevant use facilities versus vehicles and record the discrepancy. No exact claims about current population, bus fares, laws or operating railway routes. Relief preserves coast west / highlands inland / rift east; geographic names describe regional contexts. Briefly label the atlas "מפה סכמטית".

## 24 authored levels

| # | Hebrew mission / new network decision | Geographic relationship and test |
|---|---|---|
| 1 | דרך לבית הספר — connect a neighborhood and school | A complete route, observed travel and a real arrival goal. |
| 2 | הצומת העמוס — two demand streams share a crossing | Capacity, queue and delayed travel; link alone isn't accessibility. |
| 3 | תחנה במקום הנכון — place bus stops with limited coverage | Walking access and vehicle capacity; a stop beside the depot doesn't help homes. |
| 4 | בוקר בשכונה חדשה — changed origin/destination layout | Transfer route logic without a drawn solution. |
| 5 | עיר של שימושים — homes, jobs and services create trips | Land-use pattern generates demand rather than color-matching. |
| 6 | שני מרכזים — distribute services or add a connection | Monocentric versus local access; resource/land tradeoff. |
| 7 | לא רק מכוניות — limit private car availability | Transit availability determines access for the same demand group. |
| 8 | רחוב שקט — avoid nuisance near homes while serving them | Noise/land burden vs walking time; no free road everywhere. |
| 9 | מישור החוף — limited flat corridor between coast and hill | Coastal relief confines routes; contour/path choice. |
| 10 | עולים להר — direct steep road versus longer contour | Grade-adjusted time and construction budget. |
| 11 | גשר אחד — shared valley crossing is scarce | Network bottleneck and relief combine; bridge can't be placed anywhere. |
| 12 | מהחוף לבקע — new west–east relief section | Unaided relief/route transfer; map is schematic and compass correct. |
| 13 | האוטובוס מתמלא — frequency versus carrying capacity | Departures, waiting and crowding; count people, not just cars. |
| 14 | מחלף רכבת — timed feeder to a high-capacity trunk | Transfer wait can erase a fast train's advantage. |
| 15 | הקילומטר האחרון — far stop plus accessible local feeder | Door-to-service time, not station speed alone. |
| 16 | היום כולם נוסעים — new peak stresses an old answer | Mode choice under changed demand; congestion forecast is visible. |
| 17 | יישוב בקצה — connect a peripheral settlement to services | Low total population still requires minimum service access. |
| 18 | קרוב אבל רחוק — near congested versus distant fast route | Travel time versus straight-line distance. |
| 19 | הזדמנות מקומית — add local service instead of another trip | Service distribution changes core/periphery relationship. |
| 20 | פערים ברשת — protect worst-served group under a budget | Aggregate throughput cannot hide a stranded community. |
| 21 | עוד נתיב? — widening brings a delayed demand wave | Explicit simplified induced-demand event, alternative transit strategy. |
| 22 | הציר נסגר — announced failure of one link | Resilience, meaningful alternate access, no random unavoidable failure. |
| 23 | עיר מקושרת — two valid multimodal plans | Score people served, waiting and land footprint; replay to improve. |
| 24 | מחברים את הארץ — unfamiliar coast/hills/periphery network | Unaided integrated relief + land use + access transfer, full wave and meaningful win. |

Levels 1–4 are the first milestone, all 24 required. Author different topology/height/demand/mode constraints, not just renamed maps. Each has baseline solution and instructive near-miss network. Final four reduce solution aids but keep compass/contours/demand tables. Progress/replays local. Reward arrival reliability and equitable access separately from speed and construction elegance; scenarios define transparent thresholds.

## Tripo asset plan

Original first prop: **Rush Hour Israel modern compact city bus**, sand/cream body, navy windows, ochre accent, clean stylized recognizable silhouette, separate rigid wheels if practical, no branding or tiny text. Second optional: short commuter train/railcar consistent with atlas aesthetic. Use rigid-body movement along actual paths; no character rig required. Procedural terrain, buildings, queues, route curves, colliders and tracks ensure correctness. Asset provenance/cost/runtime integration follows common rules.

## Acceptance

Tests: graph disconnectedness, capacity/boarding conservation, transfer wait/arrival times, invalid steep routes and bridge rules, service-demand accounting, no stranded group hidden by mean score, all 24 known-solvable scenarios, deterministic retries and pause. QA uses actual controls to solve 1, overload/recover 2, fail a badly sited stop 3, grade trap 10, transfer timing 14, near/far trap 18, access equity 20 and final 24. Don't call a noninteractive vehicle animation a network simulation. Compare shown arrivals/queues to text hook/model.

Visual review compares real relief occupancy, cartographic camera, moving Tripo bus/train, readable road/rail separation, compass, Hebrew HUD and queue feedback against imagegen references. Deliver complete campaign, common docs and running URL; commit/push main at meaningful checkpoints.
