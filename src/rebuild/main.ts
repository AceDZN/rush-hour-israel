import "@fontsource/heebo/hebrew-400.css";
import "@fontsource/heebo/hebrew-600.css";
import "@fontsource/heebo/hebrew-800.css";
import "./style.css";
import { missions } from "./campaign";
import {
  addBus,
  createGame,
  drawLine,
  findJourney,
  getNode,
  openService,
  pair,
  quoteRoute,
  replaceLine,
  retry,
  stats,
  tick,
  togglePause,
  undo,
  widen,
} from "./model";
import { TownScene } from "./scene";
import { MorningSound } from "./sound";
import type { GameState, SceneUI, TransitMode } from "./types";
const icons = { bus: "▰", rail: "▥", undo: "↶", pause: "Ⅱ", play: "▶" };
const app = document.querySelector<HTMLElement>("#app")!;
app.innerHTML = `<canvas id="town" aria-label="העיר: גררו קו בין הבתים ליעד"></canvas><div id="places"></div>
<header class="hud"><button id="journey" aria-label="מסע השלבים"><strong>שעת שיא<span>•</span></strong><small id="stage"></small></button><div class="task"><span id="chapter"></span><h1 id="objective"></h1><p id="instruction" role="status"></p></div><div class="goal"><span class="goal-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="3"/><path d="M7 10h10l1 8h-3v5h-3v-7h-1v7H8v-5H6z"/></svg></span><bdi id="arrival-count">0 / 8</bdi><small>הגיעו</small><div id="group-counts"></div></div></header>
<aside id="compass" hidden><span id="north-arrow">▲</span><b>צ</b><small>צפון</small></aside><button id="finish-route" hidden>סיימו כאן ✓</button><div id="route-context" hidden><strong id="route-name"></strong><div><button id="extra-bus">▰ עוד אוטובוס</button><button id="redraw">שינוי הקו</button><button id="widen" hidden>עוד נתיב</button></div><small id="context-note"></small><button id="close-context" aria-label="סגירה">×</button></div>
<div id="success" hidden><span>✦ ✦ ✦</span><h2>כולם הגיעו!</h2><p id="success-copy"></p><button id="next">לבוקר הבא ←</button><button id="again">לנסות דרך אחרת</button></div>
<footer><div id="available-tools" aria-label="אפשרויות תחבורה"><div id="modes" hidden><button data-mode="bus" class="active">▰ אוטובוס</button><button data-mode="rail">▥ רכבת</button></div><button id="fleet-card" draggable="false" hidden><span>▰</span><b>עוד אוטובוס</b><small id="fleet-left"></small></button><button id="clinic-card" hidden><span>+</span><b>מרפאה מקומית</b></button><small id="resource"></small></div><div class="world-note">מפה סכמטית <span>·</span> לומדים דרך הדרך</div><div class="quick-controls"><button id="undo" title="ביטול השינוי האחרון · Z" aria-label="ביטול השינוי האחרון">↶</button><button id="pause" title="השהיה · P" aria-label="השהיה">Ⅱ</button><button id="settings" title="עזרה והגדרות" aria-label="עזרה והגדרות">☰</button></div></footer>
<dialog id="pause-menu"><button class="dialog-close" data-close="pause-menu" aria-label="סגירה">×</button><span class="eyebrow">רגע של שקט</span><h2>העיר מחכה לכם.</h2><p>גררו מהבתים אל היעד דרך הרחובות. אפשר גם להקיש על מקום, על נקודות הביניים ואז על היעד. התחנות והנסיעות מתחילות יחד עם הקו.</p><div class="menu-actions"><button id="resume" class="primary">ממשיכים ▶</button><button id="restart">בוקר חדש עם אותה רשת</button><button id="fresh">להתחיל את השלב מחדש</button><button id="help-toggle">איך מתקנים קו?</button></div><p id="help-copy" hidden>גררו דרך נקודות הביניים כדי לבחור תוואי. לחצו על קו כדי להוסיף אוטובוס או לשנות אותו. ↶ מחזיר רגע אחורה. ההמתנה והנסיעה נראות בעיר; אין שעון שמכשיל אתכם בזמן הלמידה.</p><div class="settings-row"><button id="sound">♪ צליל מופעל</button><button id="motion">תנועה רגילה</button><button id="fullscreen">⛶ מסך מלא</button></div><small>המספרים והזמנים הם יחידות מודל. ההתקדמות נשמרת רק בדפדפן הזה.</small></dialog>
<dialog id="journey-menu"><button class="dialog-close" data-close="journey-menu" aria-label="סגירה">×</button><span class="eyebrow">מסע של 24 בקרים</span><h2>בכל פעם מחברים עוד קצת.</h2><div id="journey-grid"></div><small>פותחים שלב חדש בהצלחה. אפשר לחזור לבקרים שכבר חיברתם.</small></dialog>`;
const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
interface Save {
  current: number;
  completed: Record<string, { stars: number; seconds: number }>;
  muted: boolean;
  reduced: boolean;
}
let saved: Save = {
  current: 1,
  completed: {},
  muted: false,
  reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
};
try {
  saved = {
    ...saved,
    ...JSON.parse(localStorage.getItem("rush-hour-rebuild-v2") || "{}"),
  };
} catch {}
const entry = Number(new URLSearchParams(location.search).get("level"));
let state = createGame(
  missions[
    (Number.isInteger(entry) && entry >= 1 && entry <= 24
      ? entry
      : saved.current) - 1
  ] ?? missions[0],
);
let ui: SceneUI = {
  path: [],
  hover: null,
  selectedLine: null,
  invalid: null,
  mode: "bus",
  service: false,
  reducedMotion: saved.reduced,
};
let editing: number | null = null,
  manualClock = false,
  winSaved = false,
  lastArrived = 0,
  lastStarted = 0,
  toastUntil = 0,
  suppressClickUntil = 0,
  fleetDragging = false;
const audio = new MorningSound();
audio.muted = saved.muted;
let town: TownScene;
try {
  town = new TownScene($<HTMLCanvasElement>("town"), $("places"), (id) => {
    if (performance.now() > suppressClickUntil) nodeTap(id);
  });
  town.setLevel(state.mission);
} catch (error) {
  app.innerHTML =
    '<div class="no-webgl"><h1>העיר צריכה תצוגת תלת־ממד.</h1><p>הפעילו האצת חומרה בדפדפן ונסו שוב.</p></div>';
  throw error;
}
function persist() {
  try {
    localStorage.setItem("rush-hour-rebuild-v2", JSON.stringify(saved));
  } catch {}
}
function tell(text: string) {
  $("instruction").textContent = text;
}
function clearDrawing() {
  ui.path = [];
  ui.hover = null;
  ui.invalid = null;
  ui.pointer = null;
  editing = null;
}
function hideContext() {
  ui.selectedLine = null;
  $("route-context").hidden = true;
}
function chooseMode(mode: TransitMode) {
  clearDrawing();
  hideContext();
  ui.mode = mode;
  ui.service = false;
  document
    .querySelectorAll<HTMLButtonElement>("[data-mode]")
    .forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  tell(mode === "rail" ? "גררו מסילה מתחנה לתחנה" : "גררו קו מהבתים אל היעד");
}
function addNode(id: string) {
  if (!ui.path.length) {
    ui.path = [id];
    tell("עכשיו המשיכו עד היעד");
    return;
  }
  const last = ui.path.at(-1)!;
  if (last === id) return;
  if (ui.path.at(-2) === id) {
    ui.path.pop();
    return;
  }
  if (ui.path.includes(id)) return;
  const c = state.mission.corridors.find(
    (c) => pair(c.a, c.b) === pair(last, id),
  );
  if (!c) {
    ui.hover = id;
    ui.invalid = "המשיכו דרך הרחוב ונקודת הביניים";
    return;
  }
  const proposed = [...ui.path, id],
    q = quoteRoute(state, proposed, ui.mode);
  ui.hover = id;
  ui.invalid = q.ok ? null : q.reason;
  if (q.ok) ui.path.push(id);
}
function commit(end: string) {
  const path = ui.path.at(-1) === end ? [...ui.path] : [...ui.path, end];
  const ok =
    editing !== null
      ? replaceLine(state, editing, path)
      : drawLine(state, path, ui.mode);
  if (ok) {
    audio.play("draw");
    winSaved = false;
    $("success").hidden = true;
    toastUntil = performance.now() + 2200;
    clearDrawing();
    tell(state.message);
  } else {
    clearDrawing();
    tell(state.message);
    toastUntil = performance.now() + 3800;
  }
  updateHUD();
}
function nodeTap(id: string) {
  if (document.querySelector("dialog[open]") || state.mode === "won") return;
  audio.unlock();
  if (ui.service) {
    openService(state, id);
    ui.service = false;
    toastUntil = performance.now() + 3000;
    updateHUD();
    return;
  }
  if (!ui.path.length) {
    hideContext();
    addNode(id);
    return;
  }
  if (id === ui.path[0] && ui.path.length === 1) {
    clearDrawing();
    tell(state.mission.cue);
    return;
  }
  addNode(id);
  if (
    !["junction", "station"].includes(getNode(state, id).kind) &&
    id !== ui.path[0]
  )
    commit(id);
  else if (getNode(state, id).kind === "station" && ui.path.length > 1)
    tell("אפשר להמשיך לנקודה הבאה, או לסיים את הקו כאן");
}
function selectLine(id: number) {
  clearDrawing();
  ui.service = false;
  ui.selectedLine = id;
  const l = state.lines.find((l) => l.id === id);
  if (!l) return;
  $("route-context").hidden = false;
  $("route-name").textContent =
    `${getNode(state, l.path[0]).label} ← ${getNode(state, l.path.at(-1)!).label}`;
  $("extra-bus").textContent =
    l.mode === "rail" ? "▥ עוד רכבת" : "▰ עוד אוטובוס";
  $<HTMLButtonElement>("extra-bus").disabled =
    (l.mode === "rail" ? stats(state).trainsLeft : stats(state).busesLeft) <= 0;
  $("context-note").textContent =
    state.mission.id === 21
      ? "הרחבת נתיב תוסיף 24 נוסעים בהמשך התרחיש"
      : "השינוי מתעדכן כשהאוטובוס מגיע לנקודה משותפת";
  $("widen").hidden = state.mission.id !== 21;
}
function updateHUD() {
  const m = state.mission,
    st = stats(state);
  const lastStop = ui.path.at(-1);
  const canFinish =
    ui.path.length > 1 &&
    lastStop &&
    getNode(state, lastStop).kind === "station";
  $("finish-route").hidden = !canFinish || pointer !== null;
  if (canFinish) {
    const point = town.project(lastStop!);
    $("finish-route").style.left = point.x + "px";
    $("finish-route").style.top = point.y + 20 + "px";
  }
  $("compass").hidden = m.id < 9;
  $("north-arrow").style.transform =
    "rotate(" +
    ((town as TownScene & { northAngle?: number }).northAngle ?? 0) +
    "rad)";
  $("stage").innerHTML = `בוקר <bdi>${m.id} / 24</bdi>`;
  $("chapter").textContent = m.region;
  $("objective").textContent = m.id === 1 ? "הביאו 8 ילדים לבית הספר" : m.title;
  $("arrival-count").textContent = `${st.arrived} / ${st.total}`;
  $("group-counts").innerHTML =
    st.groups.length > 1
      ? st.groups
          .map(
            (g) => `<span>${g.label} <bdi>${g.arrived}/${g.total}</bdi></span>`,
          )
          .join("")
      : "";
  $("available-tools").hidden = state.mode === "won";
  $("modes").hidden = state.mission.trains === 0;
  $("fleet-card").hidden = m.id < 3;
  $("fleet-left").textContent = `${st.busesLeft} פנויים`;
  $<HTMLButtonElement>("fleet-card").disabled = st.busesLeft <= 0;
  $("clinic-card").hidden = !m.serviceSites.length;
  $("clinic-card").classList.toggle("active", ui.service);
  $("resource").textContent = Number.isFinite(state.budget)
    ? `תקציב תוואים: ${state.budget} נק׳`
    : "";
  $<HTMLButtonElement>("undo").disabled = state.history.length === 0;
  $("pause").textContent = state.mode === "paused" ? "▶" : "Ⅱ";
  $("sound").textContent = saved.muted ? "♪ צליל כבוי" : "♪ צליל מופעל";
  $("motion").textContent = saved.reduced ? "פחות תנועה" : "תנועה רגילה";
  if (st.arrived > lastArrived) {
    const arrivedNow = st.arrived - lastArrived;
    audio.play("arrival");
    lastArrived = st.arrived;
    toastUntil = performance.now() + 1100;
    tell(arrivedNow + " הגיעו ליעד!");
  }
  const started = state.vehicles.reduce((a, v) => a + v.trips, 0);
  if (started > lastStarted) {
    audio.play("depart");
    lastStarted = started;
  }
  if (state.mode === "won" && !winSaved) {
    winSaved = true;
    const previous = saved.completed[m.id];
    if (!previous || st.stars > previous.stars)
      saved.completed[m.id] = { stars: st.stars, seconds: state.completedAt! };
    saved.current = Math.min(24, m.id + 1);
    persist();
    $("success").hidden = false;
    $("success-copy").textContent =
      m.id === 24
        ? "כל הקהילות מחוברות. איזו דרך תנסו בפעם הבאה?"
        : `${st.total} אנשים הגיעו ליעד. הבוקר הבא מחכה.`;
    $("success").querySelector("span")!.textContent = "✦ ".repeat(st.stars);
    $("next").textContent = m.id === 24 ? "למסע הבקרים ←" : "לבוקר הבא ←";
    audio.play("win");
    tell("כולם הגיעו! הדרך שלכם עובדת.");
  }
  if (
    performance.now() > toastUntil &&
    !ui.path.length &&
    state.mode !== "won"
  ) {
    state.localFeedback = null;
    if (state.lines.length === 0 && state.services.length === 0) tell(m.cue);
    else if (state.mode === "paused") tell("מושהה. העיר תמשיך כשתרצו.");
    else if (st.arrived === st.total) tell(state.message);
    else if (
      state.people
        .filter((p) => p.status === "waiting")
        .some((p) => findJourney(state, p).length === 0)
    )
      tell("יש עוד יעד שמחכה לקו. חברו גם אותו.");
    else if (st.waiting > 0 && state.lines.length)
      tell(
        state.mission.id <= 2
          ? "האוטובוס חוזר לאסוף את מי שנשאר. תראו אותו בדרך."
          : "האוטובוס מלא? הקישו על הקו והוסיפו עוד אוטובוס.",
      );
    else tell("בדרך ליעד. תראו איך האנשים מגיעים.");
  }
  if (ui.selectedLine !== null && !$("route-context").hidden) {
    const l = state.lines.find((l) => l.id === ui.selectedLine);
    if (l)
      $<HTMLButtonElement>("extra-bus").disabled =
        (l.mode === "rail" ? st.trainsLeft : st.busesLeft) <= 0;
  }
}
function loadMission(id: number) {
  document
    .querySelectorAll<HTMLDialogElement>("dialog[open]")
    .forEach((d) => d.close());
  state = createGame(missions[id - 1]);
  ui = {
    path: [],
    hover: null,
    selectedLine: null,
    invalid: null,
    mode: "bus",
    service: false,
    reducedMotion: saved.reduced,
  };
  editing = null;
  winSaved = false;
  lastArrived = 0;
  lastStarted = 0;
  $("success").hidden = true;
  $("route-context").hidden = true;
  town.setLevel(state.mission);
  saved.current = id;
  persist();
  tell(state.mission.cue);
  updateHUD();
}
let dialogWasRunning = false;
function openDialog(id: string) {
  clearDrawing();
  dialogWasRunning = state.mode === "running";
  if (dialogWasRunning) togglePause(state);
  $<HTMLDialogElement>(id).showModal();
  updateHUD();
}
function closeDialog(id: string) {
  $<HTMLDialogElement>(id).close();
  if (dialogWasRunning && state.mode === "paused") togglePause(state);
  dialogWasRunning = false;
  updateHUD();
}
function journey() {
  const highest = Math.max(
    1,
    ...Object.keys(saved.completed).map((x) => Number(x) + 1),
  );
  $("journey-grid").innerHTML = missions
    .map((m) => {
      const done = saved.completed[m.id],
        open = m.id <= highest;
      return `<button data-level="${m.id}" ${open ? "" : "disabled"} class="${m.id === state.mission.id ? "current" : ""}"><b>${m.id}</b><span>${m.title}</span><small>${done ? "✦".repeat(done.stars) : open ? "הבוקר הבא" : "🔒"}</small></button>`;
    })
    .join("");
  $("journey-grid")
    .querySelectorAll<HTMLButtonElement>("[data-level]")
    .forEach((b) => (b.onclick = () => loadMission(Number(b.dataset.level))));
  openDialog("journey-menu");
}
$("journey").onclick = journey;
$("settings").onclick = () => openDialog("pause-menu");
$("resume").onclick = () => closeDialog("pause-menu");
document
  .querySelectorAll<HTMLButtonElement>("[data-close]")
  .forEach((b) => (b.onclick = () => closeDialog(b.dataset.close!)));
$("pause").onclick = () => {
  clearDrawing();
  if (state.mode === "ready" || state.mode === "won") openDialog("pause-menu");
  else togglePause(state);
  updateHUD();
};
$("undo").onclick = () => {
  clearDrawing();
  hideContext();
  if (undo(state)) {
    winSaved = false;
    $("success").hidden = true;
    lastArrived = stats(state).arrived;
    audio.play("undo");
    toastUntil = performance.now() + 2200;
  }
  updateHUD();
};
$("restart").onclick = () => {
  closeDialog("pause-menu");
  retry(state);
  clearDrawing();
  hideContext();
  winSaved = false;
  $("success").hidden = true;
  lastArrived = 0;
  updateHUD();
};
$("fresh").onclick = () => loadMission(state.mission.id);
$("again").onclick = () => loadMission(state.mission.id);
$("next").onclick = () =>
  state.mission.id < 24 ? loadMission(state.mission.id + 1) : journey();
$("help-toggle").onclick = () => {
  $("help-copy").hidden = !$("help-copy").hidden;
};
$("sound").onclick = () => {
  saved.muted = !saved.muted;
  audio.muted = saved.muted;
  audio.unlock();
  persist();
  updateHUD();
};
$("motion").onclick = () => {
  saved.reduced = !saved.reduced;
  ui.reducedMotion = saved.reduced;
  document.body.classList.toggle("reduced", saved.reduced);
  persist();
  updateHUD();
};
$("fullscreen").onclick = () => void full();
async function full() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await app.requestFullscreen();
  } catch {}
}
$("finish-route").onclick = () => {
  const end = ui.path.at(-1);
  if (end) commit(end);
};
$("close-context").onclick = hideContext;
$("extra-bus").onclick = () => {
  if (ui.selectedLine !== null && addBus(state, ui.selectedLine)) {
    audio.play("draw");
    toastUntil = performance.now() + 2600;
  }
  updateHUD();
};
$("redraw").onclick = () => {
  const l = state.lines.find((l) => l.id === ui.selectedLine);
  if (l) {
    editing = l.id;
    ui.path = [l.path[0]];
    ui.mode = l.mode;
    $("route-context").hidden = true;
    tell("ציירו מחדש מאותה שכונה עד היעד");
  }
};
$("widen").onclick = () => {
  if (ui.selectedLine !== null && widen(state, ui.selectedLine)) {
    winSaved = false;
    $("success").hidden = true;
  }
  toastUntil = performance.now() + 6000;
  updateHUD();
};
document
  .querySelectorAll<HTMLButtonElement>("[data-mode]")
  .forEach(
    (b) => (b.onclick = () => chooseMode(b.dataset.mode as TransitMode)),
  );
$("clinic-card").onclick = () => {
  clearDrawing();
  hideContext();
  ui.service = !ui.service;
  tell(
    ui.service ? "בחרו את המקום המסומן ליד היישוב" : "גררו קו מהבתים אל היעד",
  );
  updateHUD();
};
$("fleet-card").onclick = () => {
  if (fleetDragging) return;
  const line =
    ui.selectedLine ?? (state.lines.length === 1 ? state.lines[0].id : null);
  if (line !== null) {
    if (addBus(state, line)) audio.play("draw");
    updateHUD();
  } else {
    tell("הקישו על הקו שצריך עוד אוטובוס — או גררו אליו את הכרטיס");
    toastUntil = performance.now() + 4000;
  }
};
const canvas = $<HTMLCanvasElement>("town");
function pickAt(x: number, y: number) {
  const hit = town.pick(x, y, ui.path.length > 0);
  const el = document
    .elementFromPoint(x, y)
    ?.closest<HTMLElement>("[data-node]");
  return { ...hit, node: el?.dataset.node ?? hit.node };
}
let pointer: {
  x: number;
  y: number;
  start: string | null;
  moved: boolean;
  newStart: boolean;
  line: number | null;
} | null = null;
document.addEventListener("pointerdown", (event) => {
  const target = event.target as HTMLElement;
  if (target.closest("#fleet-card")) {
    if ($<HTMLButtonElement>("fleet-card").disabled) return;
    fleetDragging = true;
    canvas.setPointerCapture(event.pointerId);
    return;
  }
  if (target.closest("dialog,header,footer,#route-context,#success")) return;
  if (target !== canvas && !target.closest("[data-node]")) return;
  if (state.mode === "won") return;
  audio.unlock();
  const hit = pickAt(event.clientX, event.clientY),
    id = target.closest<HTMLElement>("[data-node]")?.dataset.node ?? hit.node;
  pointer = {
    x: event.clientX,
    y: event.clientY,
    start: id,
    moved: false,
    newStart: ui.path.length === 0,
    line: hit.line,
  };
  if (id && !ui.service && !ui.path.length) {
    hideContext();
    ui.path = [id];
    tell("עכשיו המשיכו עד היעד");
  }
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  const hit = pickAt(event.clientX, event.clientY);
  ui.hover = hit.node;
  ui.pointer = ui.path.length ? hit.world : null;
  if (fleetDragging) return;
  if (!pointer) return;
  if (Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 7)
    pointer.moved = true;
  if (pointer.moved && hit.node && ui.path.length) addNode(hit.node);
});
canvas.addEventListener("pointerup", (event) => {
  if (fleetDragging) {
    const hit = pickAt(event.clientX, event.clientY),
      line =
        hit.line ??
        state.lines.find((l) => hit.node && l.path.includes(hit.node))?.id ??
        ui.selectedLine ??
        (state.lines.length === 1 ? state.lines[0].id : null);
    if (line !== undefined && line !== null) {
      if (addBus(state, line)) audio.play("draw");
      toastUntil = performance.now() + 2200;
    }
    if (line === null || line === undefined) {
      tell(
        state.lines.length
          ? "בחרו קו שצריך עוד אוטובוס — או גררו את הכרטיס אליו"
          : "ציירו קודם קו ואז הוסיפו לו אוטובוס",
      );
      toastUntil = performance.now() + 4000;
    }
    fleetDragging = false;
    suppressClickUntil = performance.now() + 220;
    updateHUD();
    return;
  }
  if (!pointer) return;
  const p = pointer;
  pointer = null;
  suppressClickUntil = performance.now() + 220;
  const hit = pickAt(event.clientX, event.clientY),
    end = p.moved ? (hit.node ?? p.start) : (p.start ?? hit.node);
  if (ui.service && end) {
    openService(state, end);
    ui.service = false;
    toastUntil = performance.now() + 3500;
    updateHUD();
    return;
  }
  if (!p.start && p.line !== null && !p.moved) {
    selectLine(p.line);
    return;
  }
  if (!end) return;
  if (p.newStart && !p.moved) {
    tell("עכשיו המשיכו עד היעד");
    return;
  }
  if (end !== ui.path.at(-1)) addNode(end);
  if (
    ui.path.length &&
    end !== ui.path[0] &&
    getNode(state, end).kind !== "junction" &&
    (getNode(state, end).kind !== "station" || p.moved)
  )
    commit(end);
  else {
    if (ui.path.length > 1 && getNode(state, end).kind === "station")
      tell("אפשר להמשיך לנקודה הבאה, או לסיים את הקו כאן");
    updateHUD();
  }
});
canvas.addEventListener("pointercancel", () => {
  pointer = null;
  fleetDragging = false;
  clearDrawing();
});
window.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLInputElement) return;
  if (event.code === "Escape") {
    clearDrawing();
    hideContext();
    if (state.mode === "running") togglePause(state);
    updateHUD();
  }
  if (event.code === "KeyP" || event.code === "Space") {
    if (document.querySelector("dialog[open]")) return;
    event.preventDefault();
    clearDrawing();
    togglePause(state);
    updateHUD();
  }
  if (event.code === "KeyZ") {
    event.preventDefault();
    $("undo").click();
  }
  if (event.code === "KeyR") {
    retry(state);
    clearDrawing();
    winSaved = false;
    lastArrived = 0;
    $("success").hidden = true;
    updateHUD();
  }
  if (event.code === "KeyF") void full();
});
window.addEventListener("blur", () => {
  if (state.mode === "running") togglePause(state);
  clearDrawing();
  updateHUD();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.mode === "running") {
    togglePause(state);
    clearDrawing();
    updateHUD();
  }
});
let prev = performance.now(),
  lastHUD = 0;
function render() {
  town.update(state, ui);
}
function frame(now: number) {
  const dt = Math.min(0.06, (now - prev) / 1000);
  prev = now;
  if (
    !manualClock &&
    !ui.path.length &&
    !document.querySelector("dialog[open]")
  )
    tick(state, dt);
  if (now - lastHUD > 100) {
    updateHUD();
    lastHUD = now;
  }
  audio.update(state.mode === "running" && !ui.path.length && !document.hidden);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
Object.assign(window, {
  advanceTime: (ms: number) => {
    manualClock = true;
    if (!ui.path.length && !document.querySelector("dialog[open]"))
      tick(state, ms / 1000);
    updateHUD();
    render();
  },
  render_game_to_text: () =>
    JSON.stringify({
      version: 2,
      mode: state.mode,
      interaction: ui.path.length
        ? "drawing"
        : ui.service
          ? "placing-service"
          : "idle",
      level: state.mission.id,
      title: state.mission.title,
      objective: state.mission.objective,
      coordinates:
        "x east, z south, y up; screen coordinates are currentcamera pixels",
      time: state.clock,
      completedAt: state.completedAt,
      goal: stats(state),
      modelLoaded: town.busLoaded,
      fps: Math.round(town.fps),
      budget: state.budget,
      path: ui.path,
      modeTool: ui.mode,
      selectedLine: ui.selectedLine,
      invalid: ui.invalid,
      history: state.history.length,
      message: state.message,
      nodes: state.mission.nodes.map((n) => ({
        ...n,
        screen: town.project(n.id),
        waiting: state.people.filter(
          (p) => p.node === n.id && p.status === "waiting",
        ).length,
      })),
      lines: state.lines,
      vehicles: state.vehicles.map((v) => ({
        id: v.id,
        line: v.line,
        mode: v.mode,
        from: v.from,
        to: v.to,
        progress: v.progress,
        moving: v.moving,
        blocked: v.blocked,
        people: v.passengers.length,
        capacity: v.capacity,
        trips: v.trips,
      })),
      people: state.people.map((p) => ({
        id: p.id,
        status: p.status,
        node: p.node,
        vehicle: p.vehicle,
        boardings: p.boardings,
      })),
      services: state.services,
      widened: state.widened,
      induced: state.inducedTriggered,
    }),
});
tell(state.mission.cue);
document.body.classList.toggle("reduced", saved.reduced);
updateHUD();
render();
