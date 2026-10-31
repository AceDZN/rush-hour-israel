# Rush Hour Israel asset provenance

## Original compact city bus — acquired

- Service: Tripo Studio, user's existing signed-in account in their Chrome.
- Own tab: 🚌 Rush Hour Israel, provider tab 512281219.
- Method: normal Studio text-to-model UI, HD Model H3.1, Geometry & Texture; private generation; 8K and parts off. No raw API or hidden-token use.
- Prompt: `Original Rush Hour Israel compact modern city bus, stylized low-poly game prop, cream sand body, dark navy panoramic windows, single ochre horizontal accent stripe, four black rigid wheels, recognizable friendly city bus silhouette, no branding, no lettering, no ground plane, no people. Clean tactile matte materials for warm plaster geographic atlas. One complete vehicle only, useful game asset, front and rear lamps, simple mirrors.`
- Displayed existing balance before: 3140; displayed generation cost: 30; after submission: 3110. Earlier asset-page observation was 3170; other crews were operating separate tabs, so only this 30-credit action is charged to Rush Hour.
- Crew processing spend: 30 / 600 displayed credits; new generations: 1 / 3. No purchase/upgrade.
- Ownership/license basis: original text generation commissioned in the user's existing account, verified **Pro** in the account menu during processing (31 October 2026); no gallery asset reused. [Tripo official commercial-use guide](https://www.tripo3d.ai/help/privacy-policy/how-to-use-tripo-models-commercially) grants paid users use/modification/distribution/commercial exploitation of generated models, including commercial games and asset packs. [Terms §5.2.2](https://www.tripo3d.ai/terms) is the authoritative agreement. No external reference image or branded model was supplied.
- Rig/animation: rigid vehicle; no character skeleton or deforming animation needed. Runtime transform follows simulation route.
- Task URL: https://studio.tripo3d.ai/workspace/generate/990fb543-5d32-4b92-9617-2ef5dfd6a82c
- Acquisition completed: Studio **Export → GLB → 2k Current**, normal UI download named `rush-hour-israel-bus.glb`, copied from the user's Downloads. Browser download-event wait timed out, but the actual completed GLB was present and parsed successfully; no raw media request was used.
- Studio result: 17,557 source triangles / 11,505 vertices, single textured mesh. Generated-model screenshot: `docs/visual-targets/tripo-bus-created.png`.
- Source: `docs/visual-targets/bus-source.glb`, 2,947,516 bytes, SHA-256 `379d7b8bffec8a7bcf1435ff7c58573091b471cdf2e20610d17e2bf9d54fb73b`.
- Runtime: `public/models/bus.glb`, **516,128 bytes**, 8,775 triangles; 512px base-color/normal/metallic-roughness embedded textures; no external files/decoder needed. SHA-256 `1cbfdba5625715bef15d3f9a8f410ab285592375bd2d135121f1148001432226`.
- Optimization: reputable registry CLI `@gltf-transform/cli@4.2.1 optimize source.glb bus.glb --compress false --texture-size 512 --texture-compress auto --simplify-ratio 0.5 --simplify-error 0.002`. Root rotated +90° around Y afterward, preserving buffers/materials. Optional vendor ngon metadata removed by optimizer; plain glTF triangles remain.
- Runtime orientation: **Y up, +Z forward**, y=0 base, length 1; width ≈0.486, height ≈0.420. Clone scene and scale uniformly to desired vehicle length; add road elevation outside asset.
- Final observed account balance 3080 reflects later other-crew actions. This crew made only one 30-credit generation; normal GLB export showed no extra cost. No rigging, animation processing, purchases, subscriptions or upgrade actions.
- Runtime verification: art owner confirmed `modelLoaded: true` and visibly moving cream/navy/ochre Tripo buses in real level 10 and 18 browser captures (`docs/visual-targets/actual-level10-reviewed.png`, `actual-level18-final.png`), constructed through real tool/node controls. QA's final 24 capture also visibly uses the bus. Imagegen/Studio shots remain separate from gameplay evidence.

## Generated gameplay targets

Built-in imagegen outputs under `docs/visual-targets/`; see exact prompts and inspection in `docs/visual-targets/PROMPTS.md`. Generated before implementation. They are design targets, never implemented-game evidence.

## Local runtime font and libraries

Heebo Hebrew font subsets are bundled from `@fontsource/heebo@5.2.8` (400/600/800), with the original SIL Open Font License and copyright in `public/licenses/Heebo-OFL.txt`. Three.js `0.180.0` supplies rendering and GLTFLoader; its MIT notice is in `public/licenses/Three-MIT.txt`. No remote runtime font or asset service is used.

## Living-town rebuild reuse

The redesign under `src/rebuild/` reuses the exact original Tripo bus above, unchanged (516,128 bytes, same hash). No new Tripo generation, processing or credits were used. Houses, recognizable school/courtyard/gate, clinic construction and open states, station, street intersections, grouped broadleaf trees and backpack passenger figures are original procedural Three.js geometry. Passenger figures move rigidly; no deforming character or facial rig is claimed. New original Web Audio composition/cues are implemented locally in `src/rebuild/sound.ts`, with no external music service or asset.

## Confirmed tactile action-puzzle version

The road-piece version in `src/action/` reuses the same permitted original Tripo bus GLB and its recorded ownership/hash/516,128-byte runtime file. No new Tripo generation, rigging, external model acquisition or credits were used. New bevelled road pieces, bridge/ramp/rail geometry, physical tray, authored building lots and rigid passenger figures are original procedural Three.js geometry. Rigid vehicle/figure transforms are not claimed as deforming character rigs. Built-in imagegen mockups under `docs/action-puzzle/mockups/` are design references, not runtime textures or working-game captures. The existing local MorningSound audio is reused by the new interaction.

## Restrained architectural polish — original bus and hero school

Fresh built-in gameplay targets in `docs/polish/mockups/` were generated and inspected before this pass. The human selected **realistic architectural model, restrained materials**. The art owner alone used the user's signed-in Chrome, isolated tab `512281387`, normal Studio text-generation and GLB export UI. Pro was visibly verified in the account menu. No gallery model, outside reference image, raw Tripo API, hidden token, purchase, upgrade or binding-agreement action was used. Exact full prompts, settings and observed status are in `docs/polish/assets/TRIPO_PROMPTS.md`.

Both jobs used HD Model H3.1, Geometry & Texture, Private, parts off, 8K off, T-pose off. Displayed balance2200→2170 for bus,2170→2140 for school,30 each. New pass60 credits; cumulative Rush Hour spend **90/600**, three original model generations total including historical bus. No retries, rigs or animation processing were charged. Both models are rigid assets; neither needs character rigging. Native UI lock was released between bounded sessions and while generating, and the owned completed tab was closed to free graphics resources.

Ownership/license basis: original text generations commissioned in the user's existing Pro account. Rechecked 31 October2026: [Tripo's official commercial-use guide](https://www.tripo3d.ai/help/privacy-policy/how-to-use-tripo-models-commercially) permits paid users to use, modify, distribute and commercially use their generated models; [Terms5.2.2](https://www.tripo3d.ai/terms) is the authoritative source. No third-party branded input was supplied.

| Asset | Original clean city bus | Mediterranean school |
|---|---|---|
| Task | [69f7ffcb-fc1f-432e-8cdc-792439f1a62b](https://studio.tripo3d.ai/workspace/generate/69f7ffcb-fc1f-432e-8cdc-792439f1a62b) | [4fa94e19-7f32-4f05-a36a-b53da563ff5b](https://studio.tripo3d.ai/workspace/generate/4fa94e19-7f32-4f05-a36a-b53da563ff5b) |
| Normal UI download | `rush-hour-bus-architectural.glb`, GLB/2k Current | `rush-hour-school-architectural.glb`, GLB/2k Current |
| Source path | `docs/polish/assets/bus-source.glb` | `docs/polish/assets/school-source.glb` |
| Source bytes / triangles | 3,005,056 /16,739 | 4,314,180 /16,571 |
| Source SHA256 | `b364d1af81d7df1191c40696585f9769f872a328dbe740a239f1098682df6095` | `e4f32201fa556006b6bfb3ad26fe12fb20320c40b03bc8fc4fb2b364c3e5298e` |
| Runtime path | `public/models/bus-architectural.glb` | `public/models/school-architectural.glb` |
| Runtime bytes / triangles | 651,460 /15,063 | 592,164 /15,741 |
| Runtime SHA256 | `0b315818e832acfd72730dc3bfe3507d6b369dd15654f2d3f6430595bc5e83de` | `b1cf67fc35aa2d3b26915aeb2c99c3435b213d89a471a8f7da82673bc1ee6b01` |

Optimized with reputable registry CLI `@gltf-transform/cli@4.2.1 optimize`, no Draco/Meshopt geometry compression/external decoder, embedded1024px WebP textures, simplify ratios0.9 bus/0.95 school and error0.0005. Both source bounds are normalized and Y-up. Bus is already +Z-forward, length1,width≈.292,height≈.350; school width1,height≈.399,depth≈.546 with front+Z. Runtime scales the school into an explicit authored building lot; the building's geometry and PBR maps are not used as rule/collider authority. The original first bus remains in provenance/history; current action scene loads the architectural replacement.

The models retain generative surface imperfections, particularly small roof/panel details. This pass does not claim CAD geometry or photorealistic equivalence to the mockups. Runtime architectural windows/balconies/solar heaters, continuous landscape, stone walls, paving, shelters and rigid figures are original procedural Three.js geometry. New asphalt/concrete colour maps were generated separately through built-in imagegen by the lead; exact prompts are in `docs/polish/mockups/`. Deterministic canvas roughness/bump maps are original local material data, not edits of third-party imagery.

Architectural map format optimization: the generated1254×1254 PNG source colour maps remain unchanged in `public/textures/polish/`. Runtime WebP encodings atquality92, same dimensions/content, are `asphalt.webp`854,598 bytes and `concrete.webp`618,118 bytes. No creative pixel edits or alternate-image service was used. Original deterministic canvas maps supply separate micro bump/roughness; world-scaled UVs prevent enlarged texture blobs on the table and facades.

The third generated colour map `earth.png` was inspected and encoded without resizing/content edits as `public/textures/polish/earth.webp`,780,022 bytes, SHA256 `d50ec48e4610ddaa756bd5c31dabca2dcfa5bf1ab8a26b37417a725d10592be3`. Its exact built-in imagegen prompt is `docs/polish/mockups/earth-texture-prompt.txt`. Runtime colour maps total2,252,738 bytes; the two new models total1,243,624 bytes. Original PNG/source GLBs remain as provenance rather than runtime requests.
