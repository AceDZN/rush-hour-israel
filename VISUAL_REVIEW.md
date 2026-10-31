# Visual target and implementation review

31 October 2026. Art owner generated and inspected targets before engine implementation.

## Reference selection

`docs/visual-targets/target-18-atlas.png` is the preferred camera/material target. It presents a continuous warm relief atlas, Mediterranean west, inland hills east, a valley bridge, contour-aware winding links, visible small buses and queues, and a restrained edge HUD. `target-10-primary.png` is too photographic for the requested plaster treatment; its preview line and school queue are useful interaction references. Exact built-in prompts and initial inspection are preserved in `docs/visual-targets/PROMPTS.md`.

The runtime should use true DOM Hebrew instead of generated image lettering. Keep the atlas compact enough that network decisions fit on screen; generated buildings/forests can be simplified to preserve route clarity.

## Tripo prop review

Original city bus generated and inspected in the user's Chrome on Tripo Studio. Cream body, dark navy windows, ochre band, four black wheels, recognizable city-bus silhouette and no apparent logo/text. No deforming characters are used; rigid route movement does not require a character rig. Source GLB 17,557 triangles; optimized GLB 8,775 triangles, 516,128 bytes. Acquisition screenshot `docs/visual-targets/tripo-bus-created.png`; provenance and exact cost/license/pipeline in `ASSETS.md`.

## Actual game comparison

Art owner used an isolated Playwright Chrome Headless Shell context (Metal ANGLE), separate from the user's Chrome/Tripo tabs. Networks were constructed through actual campaign/tool/node buttons, then run with the public deterministic `advanceTime` hook. No state/network/win injection.

Evidence:

- `docs/visual-targets/actual-level10-before-review.png`: first real 10 capture; road disappearing under the slope and trees intersecting the route were visible.
- `docs/visual-targets/actual-level10-reviewed.png`: fresh real capture after lead fixes; A→V→M→P→S bus/road plus stops, wave t=15; continuous visible road, cream/navy/ochre Tripo buses and passenger queues.
- `docs/visual-targets/actual-level18-before-review.png` and `actual-level18-reviewed.png`: A/B bus feeders to T, T→S rail, upgraded frequencies and interchange; later capture at t=15 has 19/42 arrivals and 12 waiting at T. Matching observable state JSON is saved alongside.
- QA's `docs/playtest/level24-moving.png`: inspected independently, real integrated final-map network and moving buses; matched to QA's browser record.
- QA's `docs/playtest/level14-transfer-moving.png`: inspected independently, shows the same railway visibility issue described below.
- Fresh art 10/18 console capture: `docs/visual-targets/browser-console-review.json` is empty; previous mixed indexed/unindexed batching error disappeared after the lead normalized merged geometries.
- Final repaired 18: `docs/visual-targets/actual-level18-final.png`, with exact real click trail in `actual-level18-input-trail.json` and observable state in `actual-level18-final-state.json`. At t=12.5 there are two moving Tripo buses (6 passengers each) and a moving rail vehicle T→S (12/14 passengers, 27.6% along link). Final console log is empty: `browser-console-final.json`.

| Check | Assessment against preferred target 18 |
| --- | --- |
| Camera and occupancy | High orthographic cartographic view reads the entire compact network with visible relief depth. Atlas fills roughly three quarters of the 1600×900 frame width and most usable height; intentionally less cropped than target so edge nodes remain actionable. |
| Relief and geography | Coast stays west/left; inland forested ridge right/east; contours and cut edge communicate height. Level 10's contour ascent is legible. Final 24's hill and lower eastern settlement are visible. Decorative ridge amplitude now follows each authored map's height range; flat transport maps 14/18 intentionally have lower relief than the target illustration. This prevents the scene from inventing a high obstacle absent from their route model. |
| Materials and light | Warm sand/cream, green hills, navy ink roads, terracotta roofs and ochre accents closely match. Runtime uses simpler geometry and less photographic texture, appropriate to browser readability. |
| Models | Actual original Tripo bus clearly visible at playable screen scale, moving along route segments. Railcar is procedural; optional second Tripo generation was not needed. |
| HUD and verbs | Sparse Hebrew edge HUD, road/bus/rail/stop tools, compass, schematic-map label, arrival counts and community bars are visible. Actual DOM Hebrew corrects the imperfect generated lettering. Numeric LTR spans now read elapsed/duration and level/24 correctly. |
| Queues and feedback | Queue pegs, numeric waiting badges and running arrival totals agree with observable model state. In 18, the interchange queue of 12 is visible. |
| Remaining visual gap | Towns are intentionally sparser than the reference's dense coastal city. This prioritizes route/queue legibility, though 6–9 varied buildings per home cluster would better distinguish land use. |

### Substantive changes prompted by real capture review

1. Lead widened and fully flattened the procedural terrain cut around valid corridor centerlines, fixing the disappearing road on level 10.
2. Lead changed tree exclusion from endpoint-only checks to segment distance, keeping vegetation off active corridors.
3. Lead added explicit numeric LTR formatting in the RTL HUD.
4. Lead normalized geometry before static batching, eliminating a console error observed during early capture.
5. Lead scaled decorative ridge amplitude to authored map heights after art/QA found invisible rail corridors. Fresh 18 now clearly shows the full rail corridor, distinct sleepers, moving train, and valley bridge.

### Railway visibility repair — verified

Earlier reviewed 18 and QA's 14 placed a height 0.4–0.6 rail path behind a decorative ridge near 3.2, hiding rails and trains from the strategic camera. Lead changed the decorative amplitude to `3.2 × clamp(max authored node height / 3.2, 0.12, 1)`. Art owner rebuilt the entire 18 plan through actual controls in a fresh browser context and captured t=12.5. Full tracks and the moving train are visible in `actual-level18-final.png`; state confirms the rail vehicle is carrying 12 people, alongside two moving Tripo buses. No remaining blocking visual mismatch was observed. Sparser towns and lower relief in flat transport scenarios are deliberate departures from the illustration; level 10 and 24 retain the richer inland relief.
