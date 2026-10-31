# Generated gameplay design targets

Created 31 October 2026 before implementation, using built-in `image_gen.imagegen` (no CLI/API fallback). These are proposed design targets, not captures of implemented gameplay.

## Primary — target-10-primary.png

Use case: ui-mockup. Asset type: 16:9 plausible in-engine gameplay target for original 3D browser transport strategy game Rush Hour Israel. High oblique cartographic camera over a continuous warm plaster relief atlas: Mediterranean blue coast along the west/left edge, a narrow coastal plain with small orange roofs, forest-green inland hills to the right, a valley crossing near center. Cream/navy buses move on ink-dark roads; a visible passenger queue at a school and a newly built feeder stop make the route-building decision clear. One translucent road preview follows a contour instead of cutting impossibly up a steep slope. Restrained sun, long shadows, tactility and mature clear indie 3D art. 85% world, minimal edge HUD. Exact small Hebrew top right "שעת שיא" and "שלב 10 / 24"; lower tools "כביש", "אוטובוס", "רכבת"; compact "נגישות" meter and small compass, exact "מפה סכמטית". Distinctive living geographic atlas, not an industrial robot diorama or SaaS dashboard. No quiz, giant panels, real company logos, copied maps, watermarks or promotional title art.

## Later atlas — target-18-atlas.png

Use case: ui-mockup. Asset type: 16:9 in-engine DESIGN TARGET screenshot of original Three.js browser 3D transport strategy Rush Hour Israel, stylized compact cartographic plaster-and-ink atlas, not photorealism. A clear playable network spans a flat coastal town at left, contour-stepped forest-green hills at right, winding hill feeder, and a small peripheral village on the east. Mediterranean sea west/left. A compact cream/navy/ochre commuter train meets two small stylized cream/navy buses at a bridge interchange. Tiny passenger queue pegs and short waiting bars show a distant community gaining access. One single valley bridge, tactile cut topography, simple cream cuboid buildings with terracotta roofs, scattered geometric pine trees, broad sand colored map base. High orthographic oblique strategic camera, entire compact game board visible, world occupies 85% of screen. Limited orange/navy/green/sea blue palette. Thin dashed road route previews follow contour; navy road and rail distinct. Small edge HUD in Hebrew, exact text: "קרוב אבל רחוק", "שלב 18 / 24", "זמן הגעה", "מפה סכמטית". Bottom small tools labeled "כביש", "אוטובוס", "רכבת". Small time bars for two neighborhoods, small compass points north up map. No wall of charts/cards, no giant panels, no photographic textures, no dense photoreal city, no watermarks, no logos. Convey spatial decision that direct distance and actual access differ. Mature beautiful indie game materials, soft morning sun, long restrained shadows.

## Inspection

Both outputs inspected immediately after generation. Primary is more photographic than requested and includes a dense network; retain its contour preview, queue, cream/navy vehicles and edge HUD as references. Later atlas is the preferred material/camera target: compact continuous relief board, coast left/west, inland hills right/east, contours, ink roads, bridge and small queue pegs. Generated Hebrew is approximate in places; runtime must use actual Hebrew DOM text. The later image's HUD and train are somewhat large; keep runtime world dominant and routes legible.

## Implementation comparison checklist

- High oblique cartographic camera with visible depth and continuous relief.
- Mediterranean sea west/left, inland highlands east/right, valley crossing.
- Warm cream/sand plaster, forest green relief, terracotta roofs, navy links.
- Recognizable moving cream/navy/ochre Tripo bus at useful screen scale.
- Road/rail distinct, contour-aware previews, queue feedback tied to model.
- Sparse Hebrew edge HUD, compass, map label, obvious road/bus/rail verbs.
- Compare actual browser captures against both targets; images alone never demonstrate play.
