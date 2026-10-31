# Geography game crews — common build contract

31 October 2026. The human user commissioned fun-first geography games for Hebrew-speaking students on Workbook's Israeli grades 7–9 curriculum, selected the best three out of ten through this planning chat, and explicitly requested **one separate builder chat and team per game**, real browser 3D, imagegen gameplay targets before development, Tripo models through their Chrome, public GitHub repos under **AceDZN**, and regular commits to **main**. Begin now. This authorization supersedes historical prototype holds for these three new repositories only. Idea Plotter's scientific gates remain pending; do not edit that project.

User requirements, preserved:

> Don't forget to build it as real 3d fun games.
> Before starting development - generate 'game screenshots' images (real gameplay images using gpt-image through the imagegen skill or through chatgpt in my browser) - then use tripo 3d to search/find or generate models, create the game, then review it in front of the 'screenshots' to really build the same gameplay ui/ux as it is in the planning and mockups.
> use my chrome browser tripo.ai to search for 3d models or create new 3d models. if the 3d model needs animation (like characters) - make sure to rig them in tripo (simple mixamo rigs for full body animation, more complicated rigs for stuff like rigging face animations - Tripo has many rigging options and pre-defined animation but also 'ai animations' for custom stuff).
> create it as a new public repo on my github (AceDZN). ... don't forget to commit your changes from time to time all to the same main branch for now (or open prs for side-tracks).

These generated images are **design targets for gameplay**, not captures of already built software. Label them accurately. Real browser screenshots provide implementation evidence later.

## Isolated ownership

| Crew | Repository path | Dev / preview ports |
|---|---|---|
| Windshift Riders | /Users/acedzn/dev/AceDZN-exp/windshift-riders | 5301 / 4301 |
| Basin Breakers | /Users/acedzn/dev/AceDZN-exp/basin-breakers | 5302 / 4302 |
| Rush Hour Israel | /Users/acedzn/dev/AceDZN-exp/rush-hour-israel | 5303 / 4303 |

Use your absolute repository workdir on every shell call. Read BUILD_HANDOFF.md, docs/COMMON.md, docs/curriculum and docs/research. Own only your repository. Idea Plotter and other crews' repos are read-only background. Never stop a server/process you did not start. strictPort; if occupied, find a free alternative and report it. No force pushes, shared game code scaffolds that homogenize gameplay, or cross-repo mutations. Public-source work is authorized; production deployment is not part of this kickoff. Preserve future Vercel compatibility with a static build.

## Actual builder team

The user explicitly requested teams: lead must spawn **two helper agents** with inherited settings and distinct file ownership. Lead owns integration, Git and full-campaign delivery. Art/assets helper owns visual targets, Tripo/model acquisition and optimization, agreed art/scene files, ASSETS.md and visual review. It is the only Tripo operator in that team. Geography/gameplay QA helper owns curriculum mapping, level review, meaningful rule/solvability tests and browser playtesting. Avoid overlapping edits; agree file boundaries before parallel implementation. Keep the work/results in this builder chat. Do not send messages to unrelated user chats; parent can inspect your progress with app tools.

## Required sequence

1. Read the exact source snapshots and your 24-level brief. Write GAME_IDENTITY.md with first-minute sequence, controls, decision, changing state, mistake/retry, win, replay, camera, art and sound. No quiz gates or generic delivery loop.
2. Announce and read [imagegen SKILL.md](/Users/acedzn/.codex/skills/.system/imagegen/SKILL.md). Use built-in image_gen; one call per image. Generate and inspect at least one wide gameplay target from docs/VISUAL_PROMPTS.md **before implementation**. Prefer two shots, including a later system state. Copy final tool-returned images into docs/visual-targets/, save the exact prompts/mode and a reference checklist. Do not silently use CLI/API, another image generator or an HTML placeholder. If built-in generation fails, report it; CLI is only a user-confirmed fallback. Research/level writing can continue while blocked.
3. In **the user's Chrome**, use current mcp__cua_repl documentation. Inspect https://studio.tripo3d.ai/assets and/or https://studio.tripo3d.ai/3d-model-gallery/ ; find usable owned/permitted assets or generate original ones at https://studio.tripo3d.ai/workspace/generate/ . Gallery visibility alone does not establish redistribution rights. Use normal UI downloads, no hidden token extraction or raw Tripo API calls. Do not substitute another modeling service. Integrate visible, identity-defining Tripo GLBs before claiming the requested game is complete.
4. Rig animated characters in Tripo using an appropriate supported full-body/Mixamo-style or other rig. Use suitable predefined/AI animation if needed. Facial rig only if face animation is part of the game. Static machinery and vehicles may be transformed as rigid bodies; do not call that a character rig. Do not add a character merely to create rigging work.
5. Implement one complete fun action/mistake/retry/win loop, then the **entire authored 24-level campaign** with real escalation. A 4-level foundation is a milestone, not permission to stop. Levels must differ in decisions/constraints, not just seed or target number. Last act tests transfer with changed environment and fewer solution overlays. Include replay/high scores or alternate solutions.
6. Capture actual gameplay from the browser and compare side by side with generated targets: camera, silhouette, scene occupancy, materials, lighting, HUD, visible verbs and feedback. Fix substantive mismatches; record deliberate changes and remaining issues. A screenshot alone does not establish fun or learning.

## Chrome/Tripo coordination

Each team's asset owner creates/claims **its own tab** with its game name; do not reuse or navigate another crew's tab. The planning check saw **3,200 credits** on My Assets on 31 October, a momentary observation rather than a reservation. Existing assets include prior games' characters/props; do not cancel unrelated jobs or rename them. Re-check the UI before submitting. Use existing credits only: an internal **ceiling of 600 displayed credits per crew**, including model/rig/animation processing, at most three new model generations. Prefer 1–2 useful assets. Record displayed cost before action and resulting balance/status. Never purchase, subscribe, upgrade or accept an unexpected binding agreement. If insufficient credits, use appropriate owned assets and report the concrete limit.

Tab-scoped extension actions are preferred. If native Chrome controls are necessary, atomically mkdir `/Users/acedzn/dev/AceDZN-exp/.geography-tripo-ui-lock`, write crew/time owner, and release only your own lock after each bounded session. Never delete another crew's lock; continue independent work instead. Release while generation runs. Unexpected human navigation means stop input and re-establish your own tab. No cross-chat messaging is needed for the lock.

ASSETS.md records model name, origin/task URL/id when visible, prompt, ownership/license basis, cost/balance shown, acquisition method, rig/clips, source and optimized byte counts/hash, and actual runtime path. Keep models in public/models. Aim <=3 MB/model and <=20 MB initial load; measure and optimize with reputable registry tools as appropriate. Terrain, precise colliders, water grids, routes and UI should be procedural. Rendered asset geometry is not authoritative geography or physics.

## Browser/game engineering

Default: Vite + TypeScript + Three.js, real 3D geometry/depth/light/camera/raycasting in one main WebGL canvas. Choose physics only as needed; preserve a deterministic pure rule model independent of rendering. No backend, auth, runtime LLM, analytics or keys. Bundle permitted fonts/models locally; offline runtime after load. Lock dependency versions and commit the lockfile. `npm run build` must produce static dist with relative base, suitable for later Vercel deployment.

Read and apply [develop-web-game SKILL.md](/Users/acedzn/.codex/skills/develop-web-game/SKILL.md) for the test loop; use its action client, inspect screenshots and fix console errors. Apply relevant frontend guidance to a game canvas with minimal HUD, not a SaaS dashboard. Keyboard/pointer, usable touch, pause/resume/restart, mute, reduced motion, resize, DPR cap and focus-loss pause; clear WebGL failure. Start useful play in 30 seconds. Explain controls briefly in Hebrew; do not bury action in reading. Leave a playable server running.

Expose window.render_game_to_text() with mode, level, coordinates/state, objective, selected tool, educational rule values and outcomes; expose deterministic window.advanceTime(ms) respecting pause. Test through actual controls; never inject a win state as playtest evidence. Meaningful tests cover state conservation, capacity/constraint edge cases, independent level solvability, intended misconceptions and failure recovery. Verify success, mistake/retry, pause/restart, hints, persistence, last transfer level, resize/touch and model loading. Measure FPS/bundle/download size before quoting them.

## Geography and Hebrew quality

Everything student-facing in natural Hebrew, lang=he dir=rtl with correct bdi/LTR for numbers, units and control glyphs. event.code for physical controls so Hebrew keyboard layout works. Bundle a readable Hebrew font. Scaffold gradually and pause pressure during long reading. Ordinary world cues/instruments are good; universal glowing answer paths are not. Late scenarios change surface/time/relief/demand so memorizing color or route cannot replace the geography.

CURRICULUM.md maps **every level** to exact Workbook module URL, skill, scenario, state/action relationship, feedback, misconception and transfer evidence. Use docs/curriculum snapshots as the requested scope authority; do not invent module IDs or claim Ministry approval. New content and tuning values are ours. Source modules contain occasional simplifications/inconsistencies: reviewer must record them and avoid making them assessed facts. Water is conserved; desalination separates, not creates molecules; sewage treatment does not automatically make drinking water; weather is not climate; albedo alone does not determine actual surface temperature; use fixed facilities versus moving vehicles if teaching infrastructure, because the source page's definitions conflict. No current legal, policy, population or infrastructure statistics need to be simulated.

Label maps as schematic and model/time/budgets as simplified. Maintain west/east, coast/highland/rift and north/south relationships when using Israel labels. Avoid false exact GIS claims. Time compression must not teach geological processes as instantaneous. Hints/retries are distinct from first unaided choices. Use minimal local progress/events only, no student personal data or remote analytics. Do not claim learning gains without student evaluation.

## Delivery requirements

24 playable authored levels, enjoyable core loop and replay, real Tripo models, checked visual targets, README with controls/setup/build and factual state, progress.md, GAME_IDENTITY.md, CURRICULUM.md, ASSETS.md, VISUAL_REVIEW.md, PLAYTEST.md, source snapshots/links, meaningful tests and real browser captures. Commit and push main at meaningful milestones, staging only owned project files; do not commit secrets, caches, browser state, node_modules, dist or temporary outputs. Final report in your own builder chat includes playable local URL, public repo, actual completion, checks and remaining limits. Do not stop after a plan, image, model viewer or small scaffold.
