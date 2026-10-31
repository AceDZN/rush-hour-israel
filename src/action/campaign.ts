import type {
  Action,
  Cell,
  Dir,
  Group,
  Mission,
  Tile,
  TileKind,
  VehicleSpec,
} from "./types";
import { key, roadPorts } from "./model";
type P = [number, number];
const K = (p: P) => key(...p);
const ROAD =
  "https://geography.workbook.co.il/grade-9/chapter-5/transport-communication";
const CITY =
  "https://geography.workbook.co.il/grade-7/chapter-5/city-structure";
const RELIEF =
  "https://geography.workbook.co.il/grade-9/chapter-2/landform-belts";
const CORE =
  "https://geography.workbook.co.il/grade-9/chapter-4/core-periphery-israel";
const NOISE =
  "https://geography.workbook.co.il/grade-7/chapter-5/urban-nuisances";
const dir = (a: P, b: P): Dir =>
  b[0] > a[0] ? 1 : b[0] < a[0] ? 3 : b[1] > a[1] ? 2 : 0;
const rotate = (tile: string, turns = 1): Action => ({
  type: "rotate",
  tile,
  turns,
});
const put = (tile: string, cell: string): Action => ({
  type: "place",
  tile,
  cell,
});
function board(
  id: number,
  title: string,
  instruction: string,
  cols: number,
  rows: number,
  paths: P[][],
  groups: Group[],
  source = ROAD,
): Mission {
  const cells: Cell[] = Array.from({ length: cols * rows }, (_, i) => ({
    id: key(i % cols, Math.floor(i / cols)),
    x: i % cols,
    z: Math.floor(i / cols),
    height: 0,
    terrain: "land",
  }));
  const ports = new Map<string, Set<Dir>>();
  for (const path of paths)
    for (let i = 0; i < path.length; i++) {
      const ds = ports.get(K(path[i])) ?? new Set<Dir>();
      if (i > 0) ds.add(dir(path[i], path[i - 1]));
      if (i < path.length - 1) ds.add(dir(path[i], path[i + 1]));
      ports.set(K(path[i]), ds);
    }
  const tiles: Tile[] = [];
  for (const [cell, ds] of ports) {
    const dirs = [...ds];
    let kind: TileKind =
      dirs.length >= 3
        ? "tee"
        : dirs.length === 2 && Math.abs(dirs[0] - dirs[1]) % 2 === 1
          ? "corner"
          : "straight";
    const tile: Tile = {
      id: "road-" + cell,
      kind,
      rotation: 0,
      cell,
      locked: true,
    };
    for (let r = 0; r < 4; r++) {
      tile.rotation = r;
      if (dirs.every((d) => roadPorts(tile).includes(d))) break;
    }
    tiles.push(tile);
  }
  for (const g of groups) {
    cells.find((c) => c.id === g.origin)!.landmark = {
      kind: "home",
      label: g.label,
    };
    const end = cells.find((c) => c.id === g.destination)!;
    if (!end.landmark)
      end.landmark = {
        kind: g.local ? "clinic" : "school",
        label: g.local ? "מרפאה" : "בית ספר",
      };
    if (g.via)
      cells.find((c) => c.id === g.via)!.landmark = {
        kind: "station",
        label: "תחנת רכבת",
      };
    if (g.walkFrom)
      cells.find((c) => c.id === g.walkFrom)!.landmark = {
        kind: "station",
        label: "תחנה",
      };
  }
  const fleet: VehicleSpec[] = groups
    .filter((g) => !g.local)
    .flatMap((g) => [
      { id: "bus-" + g.id, group: g.id, leg: 0, mode: "bus", capacity: 6 },
      ...(g.via
        ? [
            {
              id: "train-" + g.id,
              group: g.id,
              leg: 1,
              mode: "rail" as const,
              capacity: 14,
            },
          ]
        : []),
    ]);
  return {
    id,
    title,
    instruction,
    lesson: "חיבור שימושי הוא חיבור שמביא את האנשים ליעד.",
    source,
    cols,
    rows,
    cells,
    tiles,
    groups,
    fleet,
    par: 0,
    solution: [],
  };
}
const group = (
  id: string,
  origin: P,
  destination: P,
  count = 6,
  label = "הבתים",
  extra: Partial<Group> = {},
): Group => ({
  id,
  origin: K(origin),
  destination: K(destination),
  count,
  label,
  ...extra,
});
const c = (m: Mission, id: string) => m.cells.find((c) => c.id === id)!;
const t = (m: Mission, id: string) => m.tiles.find((t) => t.cell === id)!;
function loose(
  m: Mission,
  cell: string,
  rotation?: number,
  id = "piece-" + cell,
) {
  const tile = t(m, cell);
  tile.locked = false;
  tile.id = id;
  if (rotation !== undefined) tile.rotation = rotation;
  return tile;
}
function gap(
  m: Mission,
  cell: string,
  rotation?: number,
  id = "piece-" + cell,
) {
  const tile = loose(m, cell, rotation, id);
  tile.cell = null;
  return tile;
}
function finish(m: Mission, actions: Action[], lesson: string) {
  m.solution = actions;
  m.par = actions.reduce(
    (n, a) => n + (a.type === "rotate" ? Math.abs(a.turns ?? 1) : 1),
    0,
  );
  m.lesson = lesson;
  return m;
}
function kind(m: Mission, cell: string, kind: TileKind, rotation?: number) {
  const tile = t(m, cell);
  tile.kind = kind;
  if (rotation !== undefined) tile.rotation = rotation;
  return tile;
}
function river(m: Mission, x: number, bridges: string[]) {
  for (const cell of m.cells)
    if (cell.x === x) {
      cell.terrain = "water";
      if (bridges.includes(cell.id)) cell.bridgeAxis = 1;
    }
}

const one = board(
  1,
  "חסר רק חלק אחד",
  "גררו את חלק הכביש אל הפער.",
  5,
  3,
  [
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
    ],
  ],
  [group("kids", [0, 1], [4, 1])],
  CITY,
);
gap(one, "2,1", 0, "first-road");
finish(
  one,
  [put("first-road", "2,1")],
  "הכביש התחבר, והילדים יכולים להגיע לבית הספר.",
);

const two = board(
  2,
  "סיבוב לשער",
  "הקישו על חלק כדי לסובב אותו.",
  4,
  4,
  [
    [
      [0, 2],
      [1, 2],
      [2, 2],
      [2, 1],
      [3, 1],
    ],
  ],
  [group("kids", [0, 2], [3, 1])],
);
gap(two, "2,2", 2, "turn");
finish(
  two,
  [put("turn", "2,2"), rotate("turn")],
  "חלק שמסתובב משנה לאן הדרך ממשיכה.",
);

const three = board(
  3,
  "לוקחים מכאן, מחברים שם",
  "אפשר לגרור גם חלק שכבר נמצא בלוח.",
  5,
  4,
  [
    [
      [0, 2],
      [1, 2],
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
    ],
  ],
  [group("kids", [0, 2], [4, 1])],
);
const borrowed = gap(three, "1,1", 0, "borrowed");
borrowed.cell = "4,3";
const spare = gap(three, "2,1", 0, "straight");
spare.cell = "2,3";
finish(
  three,
  [put("borrowed", "1,1"), rotate("borrowed"), put("straight", "2,1")],
  "חלקים הם משאב מוגבל. הזזה יכולה לתקן פער אחר.",
);

const four = board(
  4,
  "בוקר מכיוון אחר",
  "חברו את הבית לשער בית הספר.",
  5,
  4,
  [
    [
      [3, 3],
      [3, 2],
      [2, 2],
      [1, 2],
      [1, 1],
      [1, 0],
    ],
  ],
  [group("kids", [3, 3], [1, 0])],
);
loose(four, "3,2", 0, "bend");
gap(four, "2,2", 1, "link");
finish(
  four,
  [rotate("bend", 2), rotate("link"), put("link", "2,2")],
  "אותו כלל חיבור עובד גם כשהמפה פונה לכיוון אחר.",
);

const five = board(
  5,
  "לאיזה שירות נוסעים?",
  "הילדים צריכים להגיע לבית הספר.",
  5,
  4,
  [
    [
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
      [4, 2],
    ],
    [
      [2, 2],
      [2, 1],
      [2, 0],
    ],
  ],
  [group("kids", [0, 2], [4, 2])],
  CITY,
);
c(five, "2,0").landmark = { kind: "clinic", label: "מרפאה" };
kind(five, "2,2", "corner", 3);
loose(five, "2,2", 3, "wrong-turn");
five.tiles.push({
  id: "school-road",
  kind: "straight",
  rotation: 0,
  cell: null,
});
finish(
  five,
  [put("wrong-turn", "4,3"), put("school-road", "2,2")],
  "קרבה למבנה אינה מספיקה. צריך להגיע לשירות המתאים.",
);

const six = board(
  6,
  "עיר עם כמה יעדים",
  "שתי קבוצות, שני יעדים. חברו את שתיהן.",
  5,
  5,
  [
    [
      [0, 3],
      [1, 3],
      [2, 3],
      [2, 2],
      [2, 1],
      [3, 1],
      [4, 1],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
      [3, 2],
      [3, 3],
      [4, 3],
    ],
  ],
  [
    group("school", [0, 3], [4, 1], 6, "השכונה"),
    group("work", [0, 1], [4, 3], 6, "הבתים בצפון"),
  ],
  CITY,
);
c(six, "4,3").landmark = { kind: "jobs", label: "תעסוקה" };
gap(six, "2,2", 0, "school-link");
gap(six, "3,2", 0, "work-link");
finish(
  six,
  [
    rotate("school-link"),
    put("school-link", "2,2"),
    rotate("work-link"),
    put("work-link", "3,2"),
  ],
  "שימושי הקרקע יוצרים נסיעות שונות. כל קבוצה צריכה את היעד שלה.",
);

const seven = board(
  7,
  "עד השער",
  "חברו את האוטובוס לתחנה שליד בית הספר.",
  5,
  4,
  [
    [
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
    ],
  ],
  [group("kids", [0, 2], [4, 2], 8, "הבתים", { walkFrom: "3,2" })],
);
gap(seven, "2,2", 1, "last-link");
finish(
  seven,
  [rotate("last-link"), put("last-link", "2,2")],
  "הנסיעה ממשיכה בהליכה קצרה מהתחנה לשירות.",
);

const eight = board(
  8,
  "משאירים מקום לשקט",
  "עקפו את הגינה. גם התושבים צריכים שקט.",
  5,
  4,
  [
    [
      [0, 2],
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
      [4, 2],
    ],
  ],
  [group("kids", [0, 2], [4, 2])],
  NOISE,
);
for (const id of ["1,2", "2,2", "3,2"]) c(eight, id).terrain = "quiet";
gap(eight, "0,1", 0, "left");
gap(eight, "4,1", 0, "right");
finish(
  eight,
  [rotate("left"), put("left", "0,1"), rotate("right", 2), put("right", "4,1")],
  "נגישות טובה משאירה גם מרחב שקט לתושבים.",
);

const nine = board(
  9,
  "בין הים להר",
  "מצאו רצף יבש במישור החוף הצר.",
  5,
  5,
  [
    [
      [1, 4],
      [1, 3],
      [1, 2],
      [2, 2],
      [3, 2],
      [3, 1],
      [3, 0],
    ],
  ],
  [group("coast", [1, 4], [3, 0])],
  RELIEF,
);
for (const cell of nine.cells) {
  if (cell.x === 0) cell.terrain = "water";
  if (cell.x === 4) {
    cell.terrain = "rock";
    cell.height = 1;
  }
}
gap(nine, "1,2", 0, "coast-bend");
gap(nine, "3,1", 0, "coast-link");
finish(
  nine,
  [
    rotate("coast-bend"),
    put("coast-bend", "1,2"),
    rotate("coast-link"),
    put("coast-link", "3,1"),
  ],
  "הים וההר מגבילים את המקום שבו אפשר לחבר כביש.",
);

const ten = board(
  10,
  "הצד הגבוה של הרמפה",
  "סובבו את הרמפה: הצד הגבוה פונה להר.",
  5,
  5,
  [
    [
      [0, 4],
      [1, 4],
      [2, 4],
      [2, 3],
      [2, 2],
      [3, 2],
      [4, 2],
    ],
  ],
  [group("hill", [0, 4], [4, 2])],
  RELIEF,
);
for (const cell of ten.cells) if (cell.x >= 2 && cell.z <= 2) cell.height = 1;
kind(ten, "2,3", "ramp", 0);
gap(ten, "2,3", 2, "up-ramp");
c(ten, "1,2").terrain = "rock";
finish(
  ten,
  [rotate("up-ramp", 2), put("up-ramp", "2,3")],
  "כבישים צריכים להתחבר גם בגובה, לא רק במבט מלמעלה.",
);

const eleven = board(
  11,
  "גשר עם תמיכות",
  "מעל הנחל צריך גשר. התאימו אותו לגדות.",
  5,
  4,
  [
    [
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
      [4, 2],
    ],
  ],
  [group("river", [0, 2], [4, 2], 12)],
  RELIEF,
);
river(eleven, 2, ["2,2"]);
kind(eleven, "2,2", "bridge", 0);
gap(eleven, "2,2", 1, "bridge");
eleven.tiles.push({
  id: "ordinary-road",
  kind: "straight",
  rotation: 0,
  cell: null,
});
finish(
  eleven,
  [rotate("bridge"), put("bridge", "2,2")],
  "חצייה צריכה אתר ותמיכות מתאימים. כביש רגיל אינו גשר.",
);

const twelve = board(
  12,
  "משני צדי ההר",
  "שתי רמפות, שני צדדים. חברו אל המרכז הגבוה.",
  5,
  4,
  [
    [
      [0, 2],
      [1, 2],
      [2, 2],
    ],
    [
      [4, 2],
      [3, 2],
      [2, 2],
    ],
  ],
  [
    group("west", [0, 2], [2, 2], 6, "החוף"),
    group("east", [4, 2], [2, 2], 6, "הבקע"),
  ],
  RELIEF,
);
for (const cell of twelve.cells) if (cell.x === 2) cell.height = 1;
kind(twelve, "1,2", "ramp", 1);
kind(twelve, "3,2", "ramp", 3);
gap(twelve, "1,2", 0, "west-ramp");
gap(twelve, "3,2", 0, "east-ramp");
finish(
  twelve,
  [
    rotate("west-ramp"),
    put("west-ramp", "1,2"),
    rotate("east-ramp", 3),
    put("east-ramp", "3,2"),
  ],
  "חוף במערב, הר בפנים הארץ ובקע במזרח: לכל צד כיוון עלייה אחר.",
);

const thirteen = board(
  13,
  "חוזרים לעוד ילדים",
  "עוד ילדים מחכים בבית. השלימו את דרך החזרה.",
  4,
  4,
  [
    [
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
    ],
    [
      [3, 2],
      [3, 1],
      [2, 1],
      [1, 1],
      [0, 1],
      [0, 2],
    ],
  ],
  [group("queue", [0, 2], [3, 2], 14)],
);
kind(thirteen, "1,2", "oneway", 0);
kind(thirteen, "2,1", "oneway", 2);
gap(thirteen, "3,1", 0, "return-corner");
finish(
  thirteen,
  [rotate("return-corner", 2), put("return-corner", "3,1")],
  "שישה מושבים אינם מספיקים לכולם. צריך גם דרך לחזור ולאסוף שוב.",
);

const fourteen = board(
  14,
  "מאוטובוס לרכבת",
  "השלימו את הפנייה אל תחנת הרכבת.",
  5,
  5,
  [
    [
      [0, 3],
      [1, 3],
      [1, 2],
    ],
    [
      [1, 2],
      [2, 2],
      [3, 2],
      [4, 2],
      [4, 1],
    ],
  ],
  [group("transfer", [0, 3], [4, 1], 12, "הבתים", { via: "1,2" })],
);
for (const id of ["2,2", "3,2", "4,1"])
  kind(fourteen, id, "rail", id === "4,1" ? 1 : 0);
kind(fourteen, "4,2", "railCorner", 3);
gap(fourteen, "1,3", 0, "feeder-turn");
finish(
  fourteen,
  [rotate("feeder-turn", 3), put("feeder-turn", "1,3")],
  "רכבת מהירה מועילה רק כשאפשר להגיע אליה. הנוסעים מחליפים כלי רכב בתחנה.",
);

const fifteen = board(
  15,
  "החיבור המקומי",
  "הרכבת מוכנה. חברו אליה את השכונה הרחוקה.",
  5,
  5,
  [
    [
      [0, 4],
      [1, 4],
      [1, 3],
      [2, 3],
    ],
    [
      [2, 3],
      [3, 3],
      [4, 3],
      [4, 2],
      [4, 1],
    ],
  ],
  [
    group("lastmile", [0, 4], [4, 0], 10, "השכונה בקצה", {
      via: "2,3",
      walkFrom: "4,1",
    }),
  ],
  CORE,
);
for (const id of ["3,3", "4,2", "4,1"])
  kind(fifteen, id, "rail", id === "3,3" ? 0 : 1);
kind(fifteen, "4,3", "railCorner", 3);
gap(fifteen, "1,3", 0, "local-turn");
gap(fifteen, "1,4", 0, "local-entry");
finish(
  fifteen,
  [
    rotate("local-turn"),
    put("local-turn", "1,3"),
    rotate("local-entry", 3),
    put("local-entry", "1,4"),
  ],
  "זמן עד השירות כולל את החיבור המקומי, ההחלפה וההליכה האחרונה.",
);

const sixteen = board(
  16,
  "שתי שכונות, גשר אחד",
  "שני אוטובוסים צריכים אותו מעבר. פתחו חיבור משותף.",
  5,
  5,
  [
    [
      [0, 1],
      [1, 1],
      [1, 2],
      [2, 2],
      [3, 2],
      [3, 1],
      [4, 1],
    ],
    [
      [0, 3],
      [1, 3],
      [1, 2],
      [2, 2],
      [3, 2],
      [3, 3],
      [4, 3],
    ],
  ],
  [
    group("north", [0, 1], [4, 1], 8, "השכונה בצפון"),
    group("south", [0, 3], [4, 3], 8, "השכונה בדרום"),
  ],
);
c(sixteen, "4,3").landmark = { kind: "jobs", label: "תעסוקה" };
river(sixteen, 2, ["2,2"]);
kind(sixteen, "2,2", "bridge", 0);
gap(sixteen, "2,2", 0, "shared-bridge");
gap(sixteen, "1,3", 0, "south-turn");
finish(
  sixteen,
  [
    put("shared-bridge", "2,2"),
    rotate("south-turn", 3),
    put("south-turn", "1,3"),
  ],
  "חיבור משותף אינו קיבולת אינסופית. האוטובוסים מחכים לתורם בגשר.",
);

const seventeen = board(
  17,
  "ארבעה בקצה",
  "המרכז כבר מחובר. אל תשאירו את הקבוצה שבקצה.",
  5,
  5,
  [
    [
      [0, 3],
      [1, 3],
      [2, 3],
      [2, 2],
      [2, 1],
      [3, 1],
      [4, 1],
    ],
    [
      [4, 4],
      [3, 4],
      [3, 3],
      [2, 3],
    ],
  ],
  [
    group("centre", [0, 3], [4, 1], 12, "המרכז"),
    group("edge", [4, 4], [4, 1], 4, "היישוב בקצה"),
  ],
  CORE,
);
gap(seventeen, "3,4", 0, "edge-turn");
finish(
  seventeen,
  [put("edge-turn", "3,4")],
  "גם ארבעה תושבים צריכים גישה. רוב שהגיע אינו כולם.",
);

const eighteen = board(
  18,
  "קרוב במפה, רחוק בדרך",
  "לשכונה הקרובה חסר חיבור דרך ההר.",
  5,
  4,
  [
    [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [4, 0],
    ],
    [
      [4, 2],
      [3, 2],
      [2, 2],
      [1, 2],
      [1, 1],
      [1, 0],
    ],
  ],
  [
    group("far", [0, 0], [4, 0], 6, "רחוק במפה"),
    group("near", [4, 2], [4, 0], 6, "קרוב במפה"),
  ],
  CORE,
);
for (const cell of eighteen.cells) {
  if (cell.z === 0) cell.height = 1;
  if (cell.z === 1 && cell.x !== 1) {
    cell.height = 1;
    cell.terrain = "rock";
  }
}
kind(eighteen, "1,1", "ramp", 0);
gap(eighteen, "1,1", 2, "near-ramp");
finish(
  eighteen,
  [rotate("near-ramp", 2), put("near-ramp", "1,1")],
  "מרחק בקו ישר אינו זמן גישה. לשכונה הקרובה יש דרך ארוכה יותר בפועל.",
);

const nineteen = board(
  19,
  "שירות קרוב לבית",
  "הניחו מרפאה במגרש שליד היישוב.",
  5,
  4,
  [
    [
      [0, 3],
      [0, 2],
      [0, 1],
      [0, 0],
    ],
  ],
  [
    group("centre", [0, 3], [0, 0], 6, "המרכז"),
    group("local", [3, 3], [3, 2], 4, "היישוב הקטן", { local: true }),
  ],
  CORE,
);
c(nineteen, "0,0").landmark = { kind: "clinic", label: "מרפאה מרכזית" };
c(nineteen, "3,2").servicePlot = true;
c(nineteen, "1,1").servicePlot = true;
c(nineteen, "3,2").landmark = undefined;
nineteen.tiles.push({ id: "clinic", kind: "clinic", rotation: 0, cell: null });
finish(
  nineteen,
  [put("clinic", "3,2")],
  "שירות מקומי יכול לקצר את הדרך. פתיחה עדיין דורשת הגעה אמיתית.",
);

const twenty = board(
  20,
  "מקום לכולם",
  "מעט חלקים, שתי קהילות. השתמשו בחיבור משותף.",
  5,
  5,
  [
    [
      [0, 4],
      [1, 4],
      [2, 4],
      [2, 3],
      [2, 2],
      [2, 1],
      [3, 1],
      [4, 1],
    ],
    [
      [4, 4],
      [3, 4],
      [2, 4],
    ],
  ],
  [
    group("centre", [0, 4], [4, 1], 12, "המרכז"),
    group("edge", [4, 4], [4, 1], 4, "השכונה בקצה"),
  ],
  CORE,
);
gap(twenty, "2,4", 1, "shared-junction");
gap(twenty, "2,2", 0, "shared-link");
finish(
  twenty,
  [
    rotate("shared-junction", 3),
    put("shared-junction", "2,4"),
    rotate("shared-link"),
    put("shared-link", "2,2"),
  ],
  "רשת משותפת יכולה לשרת שתי קהילות עם אותם חלקים מוגבלים.",
);

const twentyone = board(
  21,
  "עוד נתיב, עוד נסיעות",
  "החלק הרחב יביא עוד 12 נוסעים. אפשר לבחור גם כביש רגיל.",
  5,
  4,
  [
    [
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
      [4, 2],
    ],
    [
      [4, 2],
      [4, 1],
      [3, 1],
      [2, 1],
      [1, 1],
      [0, 1],
      [0, 2],
    ],
  ],
  [group("demand", [0, 2], [4, 2], 6)],
  NOISE,
);
kind(twentyone, "1,2", "oneway", 0);
kind(twentyone, "3,1", "oneway", 2);
gap(twentyone, "2,2", 0, "slim");
gap(twentyone, "4,1", 0, "return");
twentyone.tiles.push({ id: "wide", kind: "wide", rotation: 0, cell: null });
twentyone.induced = { after: 4, count: 12, group: "demand" };
finish(
  twentyone,
  [put("wide", "2,2"), rotate("return", 2), put("return", "4,1")],
  "בתרחיש הזה הרחבה מושכת נסיעות נוספות. עוד כביש אינו מבטיח פחות המתנה.",
);

const twentytwo = board(
  22,
  "המעבר ייסגר",
  "הגשר התחתון ייסגר. הכינו דרך חלופית.",
  5,
  5,
  [
    [
      [0, 3],
      [1, 3],
      [2, 3],
      [3, 3],
      [4, 3],
    ],
    [
      [0, 3],
      [0, 2],
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
      [4, 2],
      [4, 3],
    ],
  ],
  [group("closure", [0, 3], [4, 3], 12)],
);
river(twentytwo, 2, ["2,1", "2,3"]);
kind(twentytwo, "2,3", "bridge", 0);
kind(twentytwo, "2,1", "bridge", 0);
gap(twentytwo, "2,1", 0, "backup-bridge");
gap(twentytwo, "0,1", 0, "backup-left");
gap(twentytwo, "4,1", 0, "backup-right");
twentytwo.closure = { after: 4, cell: "2,3" };
finish(
  twentytwo,
  [
    put("backup-bridge", "2,1"),
    rotate("backup-left"),
    put("backup-left", "0,1"),
    rotate("backup-right", 2),
    put("backup-right", "4,1"),
  ],
  "דרך חלופית שומרת על נגישות גם כשציר נסגר.",
);

const twentythree = board(
  23,
  "יותר מפתרון אחד",
  "שני מעברים, רק שני חלקים. בחרו דרך משלכם.",
  5,
  5,
  [
    [
      [0, 2],
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
      [4, 2],
    ],
    [
      [0, 2],
      [0, 3],
      [1, 3],
      [2, 3],
      [3, 3],
      [4, 3],
      [4, 2],
    ],
  ],
  [group("choice", [0, 2], [4, 2], 12)],
);
for (const id of ["0,1", "4,1", "0,3", "4,3"])
  twentythree.tiles = twentythree.tiles.filter((t) => t.cell !== id);
c(twentythree, "2,2").terrain = "quiet";
twentythree.tiles.push(
  { id: "corner-a", kind: "corner", rotation: 0, cell: null },
  { id: "corner-b", kind: "corner", rotation: 0, cell: null },
);
finish(
  twentythree,
  [
    rotate("corner-a"),
    put("corner-a", "0,1"),
    rotate("corner-b", 2),
    put("corner-b", "4,1"),
  ],
  "יותר מרשת אחת יכולה לתת גישה טובה. אפשר לחזור ולנסות דרך אחרת.",
);

const twentyfour = board(
  24,
  "מחברים את כולם",
  "גשר, עלייה ומרפאה מקומית. הדרך בידיים שלכם.",
  6,
  5,
  [
    [
      [0, 3],
      [1, 3],
      [2, 3],
      [3, 3],
      [3, 4],
      [4, 4],
      [4, 3],
      [4, 2],
      [4, 1],
      [5, 1],
    ],
    [
      [5, 4],
      [4, 4],
      [4, 3],
      [4, 2],
      [4, 1],
      [5, 1],
    ],
  ],
  [
    group("coast", [0, 3], [5, 1], 12, "קהילת החוף"),
    group("hill", [5, 4], [5, 1], 6, "השכונה במזרח"),
    group("local", [5, 4], [5, 3], 4, "הקבוצה למרפאה", { local: true }),
  ],
  RELIEF,
);
river(twentyfour, 2, ["2,3"]);
for (const cell of twentyfour.cells)
  if (cell.x >= 4 && cell.z <= 2) cell.height = 1;
kind(twentyfour, "2,3", "bridge", 0);
kind(twentyfour, "4,3", "ramp", 0);
gap(twentyfour, "2,3", 0, "last-bridge");
gap(twentyfour, "4,3", 2, "last-ramp");
gap(twentyfour, "4,1", 3, "last-turn");
c(twentyfour, "5,3").servicePlot = true;
c(twentyfour, "5,3").landmark = undefined;
twentyfour.tiles.push({
  id: "last-clinic",
  kind: "clinic",
  rotation: 0,
  cell: null,
});
finish(
  twentyfour,
  [
    put("last-bridge", "2,3"),
    rotate("last-ramp", 2),
    put("last-ramp", "4,3"),
    rotate("last-turn", 2),
    put("last-turn", "4,1"),
    put("last-clinic", "5,3"),
  ],
  "נוף, מיקום שירותים וקבוצות שונות משנים יחד את הדרך המועילה.",
);

export const MISSIONS: Mission[] = [
  one,
  two,
  three,
  four,
  five,
  six,
  seven,
  eight,
  nine,
  ten,
  eleven,
  twelve,
  thirteen,
  fourteen,
  fifteen,
  sixteen,
  seventeen,
  eighteen,
  nineteen,
  twenty,
  twentyone,
  twentytwo,
  twentythree,
  twentyfour,
];
export const getMission = (id: number) =>
  MISSIONS[Math.max(0, Math.min(23, id - 1))];
export const ALTERNATE_23: Action[] = [
  put("corner-a", "0,3"),
  rotate("corner-b", 3),
  put("corner-b", "4,3"),
];
export const ALTERNATE_21: Action[] = [put("slim", "2,2")];
