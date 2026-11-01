import "@fontsource/heebo/400.css";
import "@fontsource/heebo/600.css";
import "@fontsource/heebo/800.css";
import "./style.css";
import { getMission, MISSIONS } from "./campaign";
import {
  applyAction,
  beginHold,
  cancelHold,
  createState,
  place,
  networkReady,
  useHint,
  returnToTray,
  retry,
  roadPorts,
  rotate,
  stats,
  tick,
  undo,
} from "./model";
import { RoadScene } from "./scene";
import { initHost, parseLevelParam, postToHost } from "./host";
import { MorningSound } from "../rebuild/sound";
import type { GameState, SceneUI, TileKind } from "./types";

declare global {
  interface Window {
    render_game_to_text: () => string;
    advanceTime: (ms: number) => void;
  }
}
const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const icon = (name: string) =>
  ({
    undo: "↶",
    pause: "Ⅱ",
    play: "▶",
    menu: "☰",
    rotate: "↻",
    tray: "↓",
    help: "?",
    next: "←",
  })[name] ?? name;
const names: Record<TileKind, string> = {
  straight: "כביש ישר",
  corner: "פנייה",
  tee: "צומת",
  bridge: "גשר",
  ramp: "רמפה",
  rail: "מסילה",
  railCorner: "פניית מסילה",
  clinic: "מרפאה",
  wide: "כביש רחב",
  oneway: "כביש חד־סטרי",
};
initHost("rush-hour-israel");
const app = $("app");
app.innerHTML = [
  '<canvas id="game" aria-label="לוח דרכים תלת ממדי"></canvas>',
  '<div id="world-targets" aria-label="חלקים ומקומות בלוח"></div>',
  '<header class="hud"><div class="identity"><span class="wordmark">שעת שיא<span class="brand-dot">.</span></span><span id="chapter"></span><button id="challenge-sample">אתגר לדוגמה ↗</button></div><div class="task"><span id="mission-name"></span><h1 id="instruction"></h1><div id="bonus-goals"><span id="goal-arrivals"></span><span id="goal-compact"></span><span id="goal-unaided"></span></div></div><div class="people-count"><span class="count-icon" aria-hidden="true"><svg width="26" height="28" viewBox="0 0 26 28" fill="currentColor"><circle cx="13" cy="7" r="4"/><path d="M6 25v-7a7 7 0 0 1 14 0v7z"/><circle cx="3" cy="10" r="2.5"/><circle cx="23" cy="10" r="2.5"/><path d="M0 23v-6a4 4 0 0 1 4-4h1v10zm21 0V13h1a4 4 0 0 1 4 4v6z"/></svg></span><b id="arrived">0</b><span class="count-slash">/</span><b id="total">6</b><small>הגיעו ליעד</small></div></header>',
  '<div id="north" class="north" hidden><span id="north-arrow">↑</span><small>צפון · מפה סכמטית</small></div>',
  '<div id="feedback" role="status" aria-live="polite"></div>',
  '<div id="selected-actions" hidden><span id="selected-name"></span><button id="rotate" aria-label="סובבו את החלק רבע סיבוב לימין"><span>↻</span>סיבוב</button><button id="rotate-back" aria-label="סובבו את החלק רבע סיבוב לשמאל">↺</button><button id="to-tray" aria-label="החזירו את החלק למגש">↓ למגש</button><button id="deselect" aria-label="סיימו בחירה">×</button></div>',
  '<div id="tray-caption">גררו חלק אל הלוח</div>',
  '<nav class="controls" aria-label="פקדי משחק"><button id="undo" title="צעד אחורה — Z" aria-label="צעד אחורה">↶</button><button id="pause" title="השהיה — רווח" aria-label="השהיה">Ⅱ</button><button id="menu" title="תפריט" aria-label="תפריט">☰</button></nav>',
  '<button id="hint" class="hint-button" aria-label="רמז — מוותר על בונוס ללא רמזים" title="רמז — מוותר על בונוס ללא רמזים">?</button><span id="hint-note">רמז מוותר על ★</span>',
  '<section id="win" hidden aria-live="polite"><div><span id="stars" role="img"></span><h2>כולם הגיעו!</h2><p id="rating-text"></p><button id="tidy" hidden>לסדר את הבנייה</button><button id="replay" hidden>לנסות בלי רמזים ↶</button><p id="win-text"></p></div><button id="next">לבוקר הבא <span>←</span></button></section>',
  '<section id="tidy-bar" hidden><span>סדרו את החלקים. החיבורים צריכים להישאר שלמים.</span><button id="done-tidying">סיימתי</button><button id="tidy-next" aria-label="לבוקר הבא">הבא ←</button></section>',
  '<section id="paused" hidden><div><span class="pause-mark">Ⅱ</span><h2>עוצרים לנשום</h2><button id="resume">ממשיכים <span>▶</span></button></div></section>',
  '<dialog id="settings"><form method="dialog"><button class="close-dialog" aria-label="סגירה">×</button><h2>הדרך בידיים שלכם</h2><p>גררו חלק כדי להזיז אותו. הקישו על כביש חופשי כדי לסובב. אפשר גם לבחור חלק מהמגש ולהקיש במקום פנוי.</p><p id="star-rules"></p><p class="keyboard">Q / E סיבוב · Z ביטול · רווח השהיה · R התחלה מחדש · F מסך מלא</p><label><input id="sound" type="checkbox"> צלילים</label><label><input id="motion" type="checkbox"> תנועה מצומצמת</label><div class="menu-actions"><button id="restart" type="button">התחלה מחדש</button><button id="fullscreen" type="button">מסך מלא</button></div><h3>24 בקרים, דרכים חדשות</h3><div id="mission-list"></div></form></dialog>',
].join("");
// Preload the small local symbol faces used by later HUD states as well as
// the opening text, so a victory does not request an uncached font offline.
void Promise.all(
  [400, 600, 800].map((weight) =>
    document.fonts.load(weight + " 16px Heebo", "↶Ⅱ▶☰↻↓?←×★☆"),
  ),
).catch(() => {});
const STORAGE = "rush-hour-road-puzzle-v6";
let saved: {
  unlocked: number;
  stars: Record<number, number>;
  muted: boolean;
  reduced: boolean;
  scoring?: "compact-unaided";
} = {
  unlocked: 1,
  stars: {},
  muted: false,
  reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
};
try {
  const old = JSON.parse(localStorage.getItem(STORAGE) ?? "null");
  if (old)
    saved = {
      ...saved,
      ...old,
      unlocked: Math.max(1, Math.min(24, Number(old.unlocked) || 1)),
    };
  else {
    const previous = JSON.parse(
      localStorage.getItem("rush-hour-road-puzzle-v5") ??
        localStorage.getItem("rush-hour-road-puzzle-v4") ??
        localStorage.getItem("rush-hour-road-puzzle-v3") ?? "null",
    );
    if (previous)
      saved = {
        ...saved,
        unlocked: Math.max(1, Math.min(24, Number(previous.unlocked) || 1)),
        muted: Boolean(previous.muted),
        reduced: Boolean(previous.reduced),
        stars: {},
      };
  }
} catch {}
// Access/settings migrate; older score records remain intact under their old rules.
saved.scoring = "compact-unaided";
const save = () => {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(saved));
  } catch {}
};
save();
// ?level=N opens that authored board even when the local save has it locked.
const deepLink = parseLevelParam(location.search, MISSIONS.length);
const requested = deepLink === null ? saved.unlocked : deepLink + 1;
let state = createState(getMission(requested));
const ui: SceneUI = {
  selected: null,
  dragging: null,
  hover: null,
  pointer: null,
  reducedMotion: saved.reduced,
  hint: null,
};
const audio = new MorningSound();
audio.muted = saved.muted;
let scene: RoadScene;
try {
  scene = new RoadScene($<HTMLCanvasElement>("game"));
  scene.setMission(state.mission);
} catch (e) {
  app.innerHTML =
    '<div class="webgl-error"><h1>צריך דפדפן עם תלת־ממד</h1><p>נסו להפעיל האצת חומרה ולרענן.</p></div>';
  throw e;
}
let pressed: {
  id: string | null;
  cell: string | null;
  x: number;
  y: number;
  pointer: number;
  drag: boolean;
} | null = null;
let toastUntil = 0,
  lastEvent = 0,
  savedWin = false,
  previousMode = "playing";
let resumeAfterDialog = true;
// Workbook host: `ready` once the models have rendered, then `level-start`
// for every opened attempt; `level-complete` once per attempt, again only if
// post-rescue tidying raises the stars.
let hostReady = false,
  levelStartedAt = performance.now(),
  postedStars = 0;
function levelStarted() {
  levelStartedAt = performance.now();
  postedStars = 0;
  if (hostReady) postToHost({ type: "level-start", level: state.mission.id });
}
const settings = $<HTMLDialogElement>("settings");
function tell(message: string, seconds = 2.5) {
  $("feedback").textContent = message;
  toastUntil = performance.now() + seconds * 1000;
}
function clearGesture() {
  if (state.held) cancelHold(state);
  pressed = null;
  ui.dragging = null;
  ui.hover = null;
  ui.pointer = null;
  ui.selected = null;
  ui.hint = null;
}
function start(id: number) {
  clearGesture();
  state = createState(getMission(id));
  ui.selected = null;
  ui.hint = null;
  savedWin = false;
  lastEvent = 0;
  state.reviewing = false;
  toastUntil = 0;
  if (settings.open) settings.close();
  scene.setMission(state.mission);
  previousMode = "playing";
  levelStarted();
  update();
}
function setPause(paused: boolean) {
  if (state.mode === "won") return;
  clearGesture();
  state.mode = paused ? "paused" : "playing";
  update();
}
function turn(turns = 1) {
  if (ui.selected && rotate(state, ui.selected, turns)) {
    ui.hint = null;
    audio.play("draw");
  } else if (ui.selected) tell(state.message);
  update();
}
function moveTo(cell: string) {
  if (!ui.selected) return;
  const ok = place(state, ui.selected, cell);
  if (ok) {
    ui.selected = null;
    ui.hint = null;
    audio.play("draw");
  } else tell(state.message);
  update();
}
function clickTile(id: string) {
  const tile = state.tiles.find((t) => t.id === id);
  if (!tile) return;
  if (tile.locked) {
    if (ui.selected && tile.cell) moveTo(tile.cell);
    return;
  }
  ui.selected = id;
  if (tile.cell) turn();
  else tell("הקישו במקום בלוח, או גררו את החלק.", 1.7);
}
function targetAction(type: "tile" | "cell", id: string) {
  if (type === "tile") clickTile(id);
  else moveTo(id);
}
const targetElements = new Map<string, HTMLButtonElement>();
function updateTargets() {
  const targets = scene.getTargets(),
    active = new Set<string>();
  for (const [type, items] of [
    ["tile", targets.tiles],
    ["cell", targets.cells],
  ] as const) {
    for (const [id, p] of Object.entries(items)) {
      const tile =
        type === "tile" ? state.tiles.find((t) => t.id === id) : null;
      if (type === "tile" && tile?.locked) continue;
      if (type === "cell" && state.tiles.some((t) => t.cell === id)) continue;
      const key = type + "-" + id;
      active.add(key);
      let b = targetElements.get(key);
      if (!b) {
        b = document.createElement("button");
        b.className = "world-target";
        b.dataset[type] = id;
        b.addEventListener("click", (e) => {
          if (e.detail === 0) targetAction(type, id);
        });
        b.addEventListener("focus", () => {
          if (type === "tile") {
            ui.selected = id;
            update();
          }
        });
        $("world-targets").append(b);
        targetElements.set(key, b);
      }
      b.style.left = p.x + "px";
      b.style.top = p.y + "px";
      b.hidden = state.mode !== "playing" || ui.dragging !== null;
      const cell = state.mission.cells.find((c) => c.id === id);
      b.setAttribute(
        "aria-label",
        type === "tile"
          ? names[tile!.kind] + (tile!.cell ? " בלוח" : " במגש")
          : cell?.servicePlot
            ? "מגרש למרפאה " + id
            : "מקום בלוח " + id,
      );
    }
  }
  for (const [id, b] of targetElements)
    if (!active.has(id)) {
      b.remove();
      targetElements.delete(id);
    }
}
function update() {
  const st = stats(state),
    m = state.mission;
  $("chapter").innerHTML =
    (m.id <= 2 ? "היכרות קצרה · " : "אתגר · ") + "<bdi>" + m.id + " / 24</bdi>";
  $("challenge-sample").hidden = m.id > 2;
  $("mission-name").textContent = m.title;
  $("instruction").textContent = state.reviewing
    ? "החזירו עודפים למגש. השאירו את החיבורים שלמים."
    : m.instruction;
  $("arrived").textContent = String(st.arrived);
  $("total").textContent = String(st.total);
  $("goal-arrivals").textContent = (st.completed ? "★" : "☆") + " כולם ליעד";
  $("goal-compact").innerHTML = (st.compact ? "★" : "☆") + ' בנייה קומפקטית: <bdi dir="ltr">' + st.buildPieces + " / " + st.buildTarget + "</bdi>";
  $("goal-unaided").textContent = (st.unaided ? "★ בלי רמזים" : "☆ נעזרתם ברמז");
  $("bonus-goals").hidden = state.mode === "won";
  $("tidy-bar").hidden = !state.reviewing || state.mode === "paused" || ui.selected !== null;
  $("hint-note").hidden = state.mode !== "playing" || state.reviewing;
  $("star-rules").textContent = "שלושה כוכבים, שלוש מטרות: ★ כולם מגיעים ליעד; ★ בנייה קומפקטית עם עד " + st.buildTarget + " חלקים ניידים בלוח וחיבורים שלמים; ★ פתרון ללא רמזים. סופרים רק חלקים שאפשר להזיז, כולל חלקים שהתחילו בלוח. חלקים במגש לא נספרים. רק הסידור הסופי קובע — ניסיונות, סיבובים וזמן חופשיים. אחרי ההגעה אפשר לסדר עודפים. שימוש ברמז מוותר על הכוכב ללא רמזים עד ניסיון חדש; ביטול לא מחזיר אותו.";
  $("undo").toggleAttribute("disabled", state.undo.length === 0 && !state.held);
  $("pause").textContent =
    state.mode === "paused" ? icon("play") : icon("pause");
  $("pause").setAttribute(
    "aria-label",
    state.mode === "paused" ? "המשך" : "השהיה",
  );
  $("paused").hidden = state.mode !== "paused" || settings.open;
  const selected = state.tiles.find((t) => t.id === ui.selected);
  $("selected-actions").hidden = !selected || state.mode !== "playing";
  if (selected) {
    $("selected-name").textContent = names[selected.kind];
    $("rotate").hidden = selected.kind === "clinic";
    $("rotate-back").hidden = selected.kind === "clinic";
    $("to-tray").hidden = selected.cell === null && !state.held;
  }
  $("tray-caption").hidden = state.mode === "won" || state.reviewing || Boolean(selected);
  $("tray-caption").textContent =
    m.id === 1
      ? "גררו את החלק אל הפער"
      : m.id === 2
        ? "הקשה על חלק = רבע סיבוב"
        : "גררו להזזה · הקישו לסיבוב";
  $("win").hidden = state.mode !== "won";
  $("hint").hidden = state.mode !== "playing" || state.reviewing;
  $("north").hidden = m.id < 8;
  $("north-arrow").style.transform =
    "rotate(" + (scene.northAngle ?? 0) + "rad)";
  if (state.event && state.event.serial !== lastEvent) {
    lastEvent = state.event.serial;
    if (state.event.kind === "blocked") tell(state.message, 3);
    else if (state.event.kind === "arrival") {
      audio.play("arrival");
      tell("עוד נוסעים הגיעו ליעד!", 1.3);
    } else if (state.event.kind === "undo") {
      audio.play("undo");
      tell(state.message, 1.4);
    }
  }
  if (state.mode === "won" && !savedWin) {
    savedWin = true;
    saved.stars[m.id] = Math.max(saved.stars[m.id] ?? 0, st.stars);
    if (m.id === saved.unlocked && m.id < 24) saved.unlocked++;
    save();
    audio.play("win");
    if (st.stars > postedStars) {
      postedStars = st.stars;
      postToHost({
        type: "level-complete",
        level: m.id,
        stars: st.stars,
        durationMs: Math.round(performance.now() - levelStartedAt),
      });
    }
    ui.selected = null;
    $("stars").textContent = "★".repeat(st.stars) + "☆".repeat(3 - st.stars);
    $("stars").setAttribute("aria-label", st.stars + " מתוך 3 כוכבים");
    $("rating-text").innerHTML =
      "★ כולם הגיעו · " + (st.compact ? "★" : "☆") + ' <bdi dir="ltr">' + st.buildPieces + " / " + st.buildTarget + "</bdi> חלקים" +
      (!st.networkReady ? " — החיבור אינו שלם" : "") + " · " + (st.unaided ? "★ בלי רמזים" : "☆ נעזרתם ברמז");
    $("tidy").hidden = st.compact;
    $("replay").hidden = st.unaided;
    $("win-text").textContent =
      m.id === 24
        ? "כל 24 הבקרים פתוחים. אפשר לחזור ולנסות דרך אחרת."
        : m.lesson;
    $("next").textContent = m.id === 24 ? "לבחירת בוקר ←" : "לבוקר הבא ←";
  }
  if (previousMode !== state.mode) {
    previousMode = state.mode;
    app.dataset.mode = state.mode;
  }
  $("feedback").classList.toggle(
    "shown",
    performance.now() < toastUntil && state.mode !== "won",
  );
  updateTargets();
}
function buildMissionList() {
  $("mission-list").replaceChildren();
  for (const m of MISSIONS) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = String(m.id);
    b.title = m.title;
    b.disabled =
      m.id > saved.unlocked && !saved.stars[m.id] && m.id !== state.mission.id;
    if (saved.stars[m.id] || m.id < saved.unlocked) b.classList.add("complete");
    if (m.id === state.mission.id) b.classList.add("current");
    b.addEventListener("click", () => start(m.id));
    $("mission-list").append(b);
  }
}
function openSettings() {
  resumeAfterDialog = state.mode === "playing";
  clearGesture();
  if (resumeAfterDialog) state.mode = "paused";
  buildMissionList();
  $<HTMLInputElement>("sound").checked = !saved.muted;
  $<HTMLInputElement>("motion").checked = saved.reduced;
  settings.showModal();
  update();
}
settings.addEventListener("close", () => {
  if (resumeAfterDialog && state.mode === "paused") state.mode = "playing";
  update();
});
$("menu").onclick = openSettings;
$("challenge-sample").onclick = () => start(4);
$("undo").onclick = () => {
  if (undo(state)) savedWin = false;
  ui.selected = null;
  ui.hint = null;
  update();
};
$("pause").onclick = () => setPause(state.mode !== "paused");
$("resume").onclick = () => setPause(false);
$("rotate").onclick = () => turn();
$("rotate-back").onclick = () => turn(-1);
$("deselect").onclick = () => {
  clearGesture();
  update();
};
$("to-tray").onclick = () => {
  if (ui.selected && returnToTray(state, ui.selected)) {
    ui.selected = null;
    audio.play("draw");
  } else tell(state.message);
  update();
};
function nextMission() {
  if (state.mission.id === 24) openSettings();
  else start(state.mission.id + 1);
}
$("next").onclick = nextMission;
$("tidy").onclick = () => {
  clearGesture();
  state.reviewing = true;
  state.mode = "playing";
  state.undo = [];
  update();
};
function finishTidying() {
  clearGesture();
  state.reviewing = false;
  state.mode = "won";
  savedWin = false;
  update();
}
$("done-tidying").onclick = finishTidying;
$("tidy-next").onclick = () => { finishTidying(); nextMission(); };
$("replay").onclick = () => start(state.mission.id);
$("restart").onclick = () => {
  const id = state.mission.id;
  settings.close();
  start(id);
};
async function fullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await app.requestFullscreen();
  } catch {
    tell("אפשר לפתוח מסך מלא דרך הדפדפן.");
  }
}
$("fullscreen").onclick = () => void fullscreen();
$<HTMLInputElement>("sound").onchange = (e) => {
  saved.muted = !(e.target as HTMLInputElement).checked;
  audio.muted = saved.muted;
  audio.unlock();
  save();
};
$<HTMLInputElement>("motion").onchange = (e) => {
  saved.reduced = (e.target as HTMLInputElement).checked;
  ui.reducedMotion = saved.reduced;
  save();
};
$("hint").onclick = () => {
  if (state.mode !== "playing" || state.reviewing) return;
  const connected = networkReady(state);
  if (connected) {
    tell("החיבורים מוכנים. תנו לאוטובוס להגיע.", 2);
    return;
  }
  const expected = structuredClone(state.mission.tiles);
  for (const action of state.mission.solution) {
    const tile = expected.find((t) => t.id === action.tile)!;
    if (action.type === "place") tile.cell = action.cell;
    else tile.rotation = (tile.rotation + (action.turns ?? 1) + 4) % 4;
  }
  const candidate = expected.find(
    (t) =>
      !t.locked &&
      state.tiles.some(
        (now) =>
          now.id === t.id &&
          (now.cell !== t.cell ||
            roadPorts(now).slice().sort().join() !==
              roadPorts(t).slice().sort().join() ||
            (["ramp", "oneway"].includes(now.kind) &&
              now.rotation !== t.rotation)),
      ),
  );
  if (candidate) {
    ui.selected = candidate.id;
    ui.hint = candidate.id;
    useHint(state);
    const now = state.tiles.find((t) => t.id === candidate.id)!;
    tell(
      now.cell === candidate.cell
        ? "נסו לסובב את החלק המודגש."
        : "נסו להזיז את החלק המודגש אל החיבור החסר.",
      4,
    );
  } else tell("החיבורים מוכנים. תנו לאוטובוס להגיע.", 2);
  update();
};
app.addEventListener("pointerdown", (e) => {
  if (state.mode !== "playing" || settings.open || e.button !== 0) return;
  const el = e.target as HTMLElement;
  if (el.closest("button") && !el.classList.contains("world-target")) return;
  const pick = scene.pick(e.clientX, e.clientY);
  const tile = pick.tile ? state.tiles.find((t) => t.id === pick.tile) : null;
  pressed = {
    id: tile && !tile.locked ? tile.id : null,
    cell: pick.cell ?? null,
    x: e.clientX,
    y: e.clientY,
    pointer: e.pointerId,
    drag: false,
  };
  if (pressed.id) ui.selected = pressed.id;
  ui.pointer = { x: e.clientX, y: e.clientY };
  try {
    app.setPointerCapture(e.pointerId);
  } catch {}
  audio.unlock();
  update();
});
app.addEventListener("pointermove", (e) => {
  if (!pressed || pressed.pointer !== e.pointerId) return;
  ui.pointer = { x: e.clientX, y: e.clientY };
  if (
    pressed.id &&
    !pressed.drag &&
    Math.hypot(e.clientX - pressed.x, e.clientY - pressed.y) > 7
  ) {
    if (beginHold(state, pressed.id)) {
      pressed.drag = true;
      ui.dragging = pressed.id;
      ui.hint = null;
    } else {
      tell(state.message);
      pressed.id = null;
    }
  }
  if (pressed.drag) ui.hover = scene.pick(e.clientX, e.clientY).cell ?? null;
});
app.addEventListener("pointerup", (e) => {
  if (!pressed || pressed.pointer !== e.pointerId) return;
  const p = pressed,
    pick = scene.pick(e.clientX, e.clientY);
  if (p.drag && p.id) {
    const target = pick.cell ?? ui.hover;
    const ok = target
      ? place(state, p.id, target)
      : e.clientY > innerHeight * 0.78
        ? returnToTray(state, p.id)
        : false;
    if (!ok) {
      if (target) tell(state.message);
      cancelHold(state);
    } else {
      audio.play("draw");
      ui.selected = null;
    }
  } else if (p.id) clickTile(p.id);
  else if (p.cell) moveTo(p.cell);
  else {
    ui.selected = null;
    ui.hint = null;
  }
  pressed = null;
  ui.dragging = null;
  ui.pointer = null;
  ui.hover = null;
  try {
    app.releasePointerCapture(e.pointerId);
  } catch {}
  update();
});
app.addEventListener("pointercancel", () => {
  clearGesture();
  update();
});
app.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  if (state.mode !== "playing") return;
  const pick = scene.pick(e.clientX, e.clientY);
  if (pick.tile) ui.selected = pick.tile;
  turn();
});
window.addEventListener("keydown", (e) => {
  if (settings.open) return;
  if (e.target instanceof HTMLInputElement) return;
  if (e.code === "KeyF") {
    e.preventDefault();
    void fullscreen();
  } else if (e.code === "Space" || e.code === "KeyP") {
    e.preventDefault();
    setPause(state.mode !== "paused");
  } else if (e.code === "KeyZ") {
    e.preventDefault();
    if (undo(state)) savedWin = false;
    ui.selected = null;
    update();
  } else if (e.code === "KeyR") {
    clearGesture();
    retry(state);
    state.reviewing = false;
    ui.selected = null;
    ui.hint = null;
    savedWin = false;
    scene.setMission(state.mission);
    levelStarted();
    update();
  } else if (e.code === "KeyE" || e.code === "ArrowRight") {
    e.preventDefault();
    turn(1);
  } else if (e.code === "KeyQ" || e.code === "ArrowLeft") {
    e.preventDefault();
    turn(-1);
  } else if (e.code === "Escape") {
    if (pressed || state.held || ui.selected) {
      clearGesture();
      update();
    } else setPause(state.mode !== "paused");
  } else if (e.code === "Delete" || e.code === "Backspace") {
    if (ui.selected) {
      e.preventDefault();
      returnToTray(state, ui.selected);
      ui.selected = null;
      update();
    }
  }
});
window.addEventListener("blur", () => {
  if (!settings.open && state.mode === "playing") setPause(true);
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.mode === "playing") setPause(true);
});
function textState() {
  const st = stats(state);
  return JSON.stringify({
    version: 4,
    interaction: "grab-rotate-snap",
    mode: state.mode,
    level: state.mission.id,
    title: state.mission.title,
    coordinates:
      "grid x east/right, z south/down; world view may rotate; north arrow is authoritative",
    goal: st,
    selected: ui.selected,
    held: ui.dragging,
    hover: ui.hover,
    hints: state.hints,
    tidying: state.reviewing,
    message: state.message,
    modelLoaded:
      scene.assetStatus.busLoaded &&
      scene.assetStatus.schoolLoaded &&
      scene.assetStatus.texturesLoaded,
    assets: scene.assetStatus,
    fps: scene.fps,
    tiles: state.tiles.map((t) => ({ ...t, ports: roadPorts(t) })),
    cells: state.mission.cells,
    closed: state.closed,
    people: state.people,
    vehicles: state.vehicles,
    targets: scene.getTargets(),
  });
}
window.render_game_to_text = textState;
window.advanceTime = (ms) => {
  if (assetsReady() && !state.reviewing) tick(state, Math.max(0, ms) / 1000);
  scene.render(state, ui, 0);
  update();
};
let previous = performance.now();
function assetsReady() {
  const assets = scene.assetStatus;
  return assets.busLoaded && assets.schoolLoaded && assets.texturesLoaded;
}
function frame(now: number) {
  const dt = Math.min(0.05, (now - previous) / 1000);
  previous = now;
  if (assetsReady() && !state.reviewing) tick(state, dt);
  scene.render(state, ui, dt);
  if (!hostReady && assetsReady()) {
    hostReady = true;
    postToHost({ type: "ready" });
    levelStarted();
  }
  audio.update(state.mode === "playing" && assetsReady());
  update();
  requestAnimationFrame(frame);
}
scene.render(state, ui, 0);
update();
requestAnimationFrame(frame);
