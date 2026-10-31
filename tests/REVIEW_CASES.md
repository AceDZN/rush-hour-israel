# Independent acceptance cases

These expected relationships were written from the brief before reading the implementation, to avoid testing only what the implementation happens to do. The test runner will use the public pure-model functions, not renderer internals.

| Case | Independent expected relationship |
|---|---|
| No connection | Starting a wave without a complete usable path creates waiting people and cannot produce an arrival or win. |
| Conservation | For each authored/conditional demand, every person is in exactly one state. Passenger identities do not change at transfers. |
| Vehicle seats | A 6-seat bus can carry at most 6 and a 14-seat railcar at most 14. A queue beyond seats remains visibly waiting until a later departure. |
| Finite capacity | Two demand streams sharing one crossing must wait; adding a useful alternate connection or transit plan can reduce delay. |
| Household mode | A no-car group cannot use a road merely because a connected car route exists. |
| Stop access | Transit without reachable boarding/alighting stops cannot serve the corresponding journey. Moving the same service to useful coverage changes access. |
| Grade | A steep forbidden candidate is rejected; a feasible longer contour route remains possible and has actual travel cost. |
| Bridge | No crossing may be invented outside authored candidates; a legal crossing has finite resources and capacity. |
| Transfer | A passenger who arrives after a rail departure waits for the next actual departure. A phase change can alter arrival without changing rail speed. |
| Service | A local same-kind service can satisfy the original demand without deleting or spawning the person. An unrelated kind cannot satisfy it. |
| Equity | Serving a large central group while stranding a small required group cannot win, even if mean/aggregate service is high. |
| Induced scenario | Additional people appear only under the announced widening trigger and remain in expected/created/pending accounting. |
| Closure | The preannounced link closure prevents use when closed; an alternate valid plan is viable. No random unavoidable event is accepted as resilience. |
| Pause | Repeated time stepping while paused produces identical time, queues, vehicle occupancy and arrivals. |
| Retry | The same plan and controls replay the same authored demand and outcome with unique fresh passenger state. |
| Full campaign | Exactly 24 missions have materially distinct topology, demand, relief or operational decisions; each authored baseline reaches its declared thresholds. |
| Near misses | A plausible but instructionally wrong plan fails the corresponding threshold, rather than being cosmetically different. |

Browser verification must use actual route/stop/service controls and observe intermediate queue and vehicle state. Pure-model execution is evidence for rules and solvability, not evidence for usable UI or fun.
