# Independent rebuilt-model expectations

Written from the rebuild contract before the implementation API is complete. Historical V1 tests do not count as evidence for these cases.

- A complete valid route automatically supplies working endpoint stops and starts service. No extra stop/run setup is required.
- A path with intermediate points remains the exact ordered route selected by the player; it is not replaced by its endpoint chord.
- An invalid path rejects atomically: no budget, fleet, road, line, vehicle or passenger side effects.
- A bus has a persistent identity through ordinary junctions and a round trip. Riders stay on it through intermediate nodes unless their stop or actual transfer is reached. The same bus returns, boards remaining people and completes another run.
- Every individual is in exactly one state: pending, waiting, riding, walking or arrived. A rider belongs to exactly one vehicle, and every onboard ID is a real riding person. Transfers and service changes do not create or erase people.
- Bus seats never exceed 6; rail seats never exceed 14. A full vehicle leaves real people waiting for its return or another actual vehicle.
- A bridge has finite shared occupancy across modes and directions; extra vehicles visibly wait. Higher frequency cannot bypass the bottleneck.
- Untimed intro missions never fail because elapsed time exceeds an optional medal benchmark. A win requires every required individual/group, and any explicit geographic constraint, rather than a hidden percentage/deadline.
- A same-kind local service can satisfy original demand without rewriting its identity. A clinic cannot satisfy a school trip. A service does not become instantly reached while a person is elsewhere.
- Grade, mode and authored crossing limits affect route legality. Closed corridors prevent new entries after the announced time while riders already crossing finish coherently.
- Replacement respects the current bus and passenger state or explicitly rewinds via an advertised snapshot. It cannot silently teleport a moving bus to another route location.
- Undo restores an explicit prior simulation snapshot, including clock, bus identity/location/direction, riders, budget and route. Retry deterministically resets an attempt according to its documented semantics.
- All 24 rewritten missions have distinct spatial/operational decisions and a buildable known solution. Oracle tests establish solvability only; actual first-minute play must not read those solutions.
