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
