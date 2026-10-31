# Visual polish audit — accepted road-piece interaction

31 October 2026. The human says the game is much better, but looks too easy and the graphics remain poor. The grab/rotate/snap/rescue interaction is accepted; this audit concerns a substantial visual upgrade while preserving that physical behavior. Difficulty belongs to the lead's campaign work. No runtime source was changed for this audit.

Reviewed the actual desktop/portrait opening captures, the final mission 8 obstruction correction, mission 11 bridge, mission 14 rail platform correction and mission 24 desktop/portrait, plus `src/action/scene.ts`. Earlier generated images are direction references, not evidence that the present runtime is polished.

## Three concrete causes of the unfinished appearance

1. **The repeated base dominates the world.** Every non-road square has the same thick cream rim, flat sage center and isolated bush. These equally weighted squares occupy most of the opening and later boards. They read as blank components awaiting content, rather than coherent land, a street or a neighborhood. The terracotta tray and double cream outlines are more detailed than the place they contain. Increasing the number of bushes will not fix this hierarchy.
2. **The hero objects speak incompatible visual languages.** The large original bus reveals smeared, dirty baked texture and soft window/wheel detail. In contrast, houses and school are almost textureless boxes with black window rectangles, no convincing entrance depth, flat empty facades and little street frontage. The school is recognizable mainly through its clock/court convention; it does not yet feel like a designed miniature building. Cylindrical people and identical trees amplify the primitive impression when the camera is close.
3. **Light and viewpoint expose flat surfaces instead of craftsmanship.** Broad uniform top faces and strong dark cast shadows create a cutout look. Materials have little useful roughness/normal variation; the background is a perfectly flat void. The high portrait camera largely hides doors and windows, making buildings look like roof blocks. The screenshot has a clean graphic silhouette but lacks contact, layered surfaces, atmospheric depth and small signs of daily life.

## Proposed direction: a crafted street in an inhabited miniature town

Keep the close physical puzzle, but make the playable street the hero inside a coherent small coastal neighborhood. Cream becomes limestone pavement and curb edges rather than the repeated body of every empty cell. Dark blue-green asphalt, warm terracotta architecture, blue-gray stone, dusty planted earth and rich foliage get distinct geometry and material responses. An amber held piece is the strongest temporary accent. This should look like a carefully authored contemporary game environment, not another generic low-poly square-tile board.

The opening composition remains one bus, one missing link and one school. Its surroundings should already feel complete: two connected home frontages, an inhabited pickup, a real school gate/courtyard, a small shaded garden and a legible sidewalk. Later river/grade scenes retain the same visual language. They gain stone banks, retaining walls, ramp parapets and a real bridge silhouette rather than a cyan stripe between cream squares.

### Geometry and street surface

- Suppress the full cream frame on fixed landscape cells. Join their top surfaces into an authored terrain/pavement patch with subtle height and color variation. Keep physical seams and a substantial bevel where the player can actually lift a road piece. Preserve the true socket and every legal placement target.
- The asphalt sits between curb, drainage gutter and sidewalk. Use narrow paving joints, occasional drains, curb cuts at the school and a restrained worn center stripe. Geometry should be crisply beveled, with continuous edges at ports. Avoid painted photographic dirt or uniform miniature cobblestones everywhere.
- Make the held piece a premium object: visible underside, sidewall, small connector rebates, accurate road endpoints, local contact shadow, crisp turn and a short settling beat. Keep the current model's occupied locks, true missing road while held, and finite rack.
- Turn unused terrain into two or three deliberate scene elements: one sunken planter/garden, a shared paved courtyard, an irregular low grass/earth bed and a retaining edge. Their boundaries cross cell seams where appropriate. Never place them over authored `roadCells`, parking, service plots or explicit building lots.

### Architecture and inhabited context

- Hero school: a stepped two-volume building, recessed blue entrance under a substantial canopy, frames around glass, roof parapet, external stair/low wall and a gated court with seating/shade. Use a strong silhouette and a few deep details rather than dozens of tiny decorations. A large entrance motif can identify the school when the portrait view hides its sign.
- Homes: varied roof/parapet heights, deep window surrounds, balconies or shutters, entry stoops, low garden walls and a connected pavement edge. A small roof water tank or solar-heater silhouette can establish place without branded signage. Repeat a compact authored kit with deliberate variation.
- Street life: a shelter at the actual pickup, a bench, a few bollards at the court, a bicycle or bin, three or four sculpted broadleaf/palm groups and small planters. Put these into scene-specific clusters with breathing room. No random prop scatter and no obstruction of valid roads, people or hit areas.
- People need a clearer silhouette: head/hair separation, shirt/shorts or trousers, backpack straps and a simple walking/boarding rhythm. Rigid animation remains acceptable; no new deforming character is required merely to create rigging work.

### Materials and light

- Use a small coherent PBR palette with separate responses: finely rough asphalt, slightly smoother painted bus body/glass, satin painted metal, chalky limestone, warm ceramic roof and foliage with controlled two-tone variation.
- Add subtle, low-frequency surface normal/roughness detail at a scale visible in the close camera. Keep large color fields clean. Reject the old bus's baked grime and any photoreal noise that disagrees with the miniature architecture.
- Softer directional key and cool sky fill, grounded contact shadows, gentle ambient occlusion if its measured cost is acceptable, and restrained color grading. Avoid pitch-black shadows and blown cream. A half-resolution AO pass or authored local contact patches are buildable options; neither is assumed free on phones.
- Background/table may gain a restrained tonal falloff, but must remain quieter than the street. No decorative scenery in the useful interaction area.

### Camera and implementation limits

Desktop: keep the board close but lower the angle enough to show facade/entrance depth. Frame the puzzle's actual working area, rather than scaling every large landscape border and rack as equally important. Portrait: rotate the layout as today, but test a slightly lower camera and taller architectural silhouettes; the bus, people and socket must survive at 390×844. Do not trade usable tile size for a cinematic view.

Preserve all model coordinates, endpoints and heights. Art is not authoritative routing. Large buildings use campaign-authored `landmark.lot` only; no autonomous lot heuristic. Road meshes, bus paths and previews must still use the same ports/quarter curves/grade. Any new visual object that affects ray hits must report its real cell, never redirect a required road gap to a landmark.

Batch static paved/terrain/architecture layers and instance repeated small objects. Keep movable pieces and vehicles independent. DPR cap 1.5, warm key/shadow quality measured on the same real desktop/phone loop, and a practical 60 FPS target rather than an unmeasured promise. No shader upgrade is successful if drag latency or visible targets regress.

## Actual asset gap and Tripo scope

The existing original bus is legitimate and visible, but its baked dirty texture is an actual close-camera quality gap. A new clean stylized city bus is the first useful generation: coherent hard-surface silhouette, recessed glazing, modeled tires/wheel wells, restrained flat paint, no baked grime, no text, no ground plane, no people. It must remain one original rigid vehicle, Y-up/+Z-forward after normalization, with a readable front and rear. Rigid motion needs no character rig.

The optional second generation should be one hero school building, not an unreliable fused multi-building “kit”: original stepped school facade with deep entrance/canopy, clean painted/plaster/terracotta materials, compact isolated footprint, no ground plane, no students or illegible lettering. Procedural court/curbs stay authoritative and separate. If the new mockup can be reached more reliably with authored geometry, use only the replacement bus generation.

Do not submit either generation until the lead's fresh generated style target is inspected. At most two new generations this pass; existing crew spend is 30 credits. Recheck the account's displayed balance/cost in the user's Chrome, keep cumulative crew spend within 600, use normal UI, no purchase/API/token extraction. Record exact prompt, status/cost/balance, source, license basis, normal download, optimization and hashes in `ASSETS.md` before integration.

## Fresh mockup acceptance checklist

The new target must show the same solvable socket/road action, substantial clean bus, visible figures and an actual entrance/court. It should reduce blank checkerboard dominance through coherent streetscape and terrain, not through a carpet of tiny props. Include enough close surface/facade detail that the implementation quality bar is meaningfully higher than the current runtime. Reject impossible ports, oversized scenery hiding the route, photographic detail without a feasible asset plan, floating UI pills and an attractive image that requires changing the accepted controls.

Next: inspect fresh built-in imagegen targets, select the material/geometry standard, acquire only the justified original assets, implement the opening quality bar, compare actual desktop/phone captures, then carry the same authored kit and safety constraints across the campaign. No new art code has started.

## Human-selected refinement and read-only Tripo inspection

The human has now chosen **“Realistic architectural model — restrained materials.”** This supersedes any remaining toy interpretation above. Use warm limestone/concrete, bitumen asphalt, accurately thin curbs, recessed windows, balconies, flat-roof solar heaters, subtle grass/gravel and natural studio daylight with soft contact shadows. The surround should be light stone. Remove the chunky terracotta toy tray, dark teal void and dominant cream checkerboard. Keep physical road modules thin and honest; after the first two introductions, the absence of a correct road should read through geometry rather than automatic dark answer sockets. Off-road landscaping should connect across quiet grid seams. The new mockup is the quality bar for geometry, PBR response and facade depth, not merely palette.

Read-only Tripo inspection in the user's Chrome on 31 October 2026: the former Rush Hour tab was no longer present, so opened a new isolated **🚌 Rush Hour Israel polish** tab, ID `512281387`, at `https://studio.tripo3d.ai/workspace/generate`. My Assets and Workspace both displayed **2,200 credits**. Account menu visibly showed **Pro**. Current default HD Model / H3.1 / Geometry & Texture / Private / parts off / 8K off displayed **Generate 30**. No generation was submitted and no credits were spent; crew cumulative spend remains **30 / 600**, with at most two new generations permitted for this pass. Other crews' tabs/assets were not operated. The native UI lock was acquired for the bounded menu inspection and released afterward; the owned tab is left for the unfinished asset workflow.
