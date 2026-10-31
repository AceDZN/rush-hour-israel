import type { Action, Mission, Tile } from "./types";
import {
  board,
  group,
  c,
  t,
  gap,
  kind,
  river,
  finish,
  put,
  rotate,
  CITY,
  RELIEF,
  CORE,
  NOISE,
} from "./authoring";

type Pose = { cell: string; rotation: number };
function solved(m: Mission) {
  const tiles = structuredClone(m.tiles);
  for (const a of m.solution) {
    const tile = tiles.find((t) => t.id === a.tile)!;
    if (a.type === "place") tile.cell = a.cell;
    else tile.rotation = (tile.rotation + (a.turns ?? 1) + 4) % 4;
  }
  return tiles;
}
/** An authored pose list is converted to ordinary public actions, never injected at runtime. */
export function routeActions(
  m: Mission,
  poses: Record<string, Pose>,
): Action[] {
  const actions: Action[] = [];
  for (const [id, pose] of Object.entries(poses)) {
    const tile = m.tiles.find((t) => t.id === id);
    if (!tile) throw Error("Unknown authored piece " + id);
    let turns = (pose.rotation - tile.rotation + 4) % 4;
    if (
      ["straight", "wide", "bridge", "rail"].includes(tile.kind) &&
      turns === 3
    )
      turns = 1;
    if (turns) actions.push(rotate(id, turns === 3 ? -1 : turns));
    if (tile.cell !== pose.cell) actions.push(put(id, pose.cell));
  }
  return actions;
}
function reserve(m: Mission, cells: string[]) {
  m.roadCells = [...new Set([...(m.roadCells ?? []), ...cells])];
}
function retune(m: Mission, cells: string[], decoys = 0) {
  const answer = solved(m),
    wanted = new Set(
      m.solution
        .map((a) => a.tile)
        .filter((id) => {
          const tile = answer.find((t) => t.id === id)!;
          return (
            tile.cell &&
            ((m.roadCells ?? []).includes(tile.cell) || tile.kind === "clinic")
          );
        }),
    );
  for (const cell of cells) {
    const tile = answer.find((t) => t.cell === cell);
    if (!tile) throw Error("No authored road at " + m.id + ":" + cell);
    wanted.add(tile.id);
  }
  // Free previous scenery lots before authoring the revised inventory footprint.
  for (const cell of m.cells) {
    if (cell.terrain === "built") cell.terrain = "land";
    if (cell.landmark) {
      delete cell.landmark.lot;
      delete cell.landmark.lots;
    }
  }
  const free = m.tiles.filter((t) => wanted.has(t.id) || !t.locked);
  for (let i = 0; i < decoys; i++) {
    const tile: Tile = {
      id: "spare-" + m.id + "-" + i,
      kind: i % 2 === 0 ? "corner" : "straight",
      rotation: (m.id + i) % 4,
      cell: null,
    };
    m.tiles.push(tile);
    free.push(tile);
  }
  const protectedCells = new Set([
    ...(m.roadCells ?? []),
    ...answer.flatMap((t) => (t.cell ? [t.cell] : [])),
    ...m.cells.filter((c) => c.landmark || c.servicePlot).map((c) => c.id),
  ]);
  const stationary = m.tiles.filter((t) => !free.includes(t));
  for (const tile of stationary) if (tile.cell) protectedCells.add(tile.cell);
  const parking = m.cells
    .filter((c) => c.terrain === "land" && !protectedCells.has(c.id))
    .sort(
      (a, b) =>
        ((a.x * 7 + a.z * 11 + m.id) % 31) - ((b.x * 7 + b.z * 11 + m.id) % 31),
    );
  const prior = new Map(free.map((t) => [t.id, t.cell]));
  // At most four tray pieces; all remaining useful material is tangible on the board.
  free.sort(
    (a, b) =>
      (a.kind === "clinic" ? -100 : prior.get(a.id) === null ? -20 : 0) -
      (b.kind === "clinic" ? -100 : prior.get(b.id) === null ? -20 : 0),
  );
  let orientationIndex = 0;
  for (const tile of free) {
    tile.locked = false;
    tile.cell = null;
  }
  let tray = 0;
  for (const tile of free) {
    const goal = answer.find((t) => t.id === tile.id);
    if (tile.kind === "clinic") {
      tile.cell = null;
      tray++;
      continue;
    }
    if (tray < Math.min(4, free.length <= 4 ? 3 : 4)) {
      tile.cell = null;
      tray++;
    } else if (parking.length) tile.cell = parking.shift()!.id;
    else tile.cell = goal?.cell ?? prior.get(tile.id) ?? null;
    if (goal && wanted.has(tile.id)) {
      let skew = [1, 2, 3][orientationIndex++ % 3];
      if (
        ["straight", "wide", "bridge", "rail"].includes(tile.kind) &&
        skew === 2
      )
        skew = 1;
      tile.rotation = (goal.rotation + skew) % 4;
    }
  }
  const poses = Object.fromEntries(
    [...wanted].map((id) => {
      const tile = answer.find((t) => t.id === id)!;
      return [id, { cell: tile.cell!, rotation: tile.rotation }];
    }),
  );
  // Off-route parked scraps are alternatives, not compulsory busywork in the witness.
  finish(m, routeActions(m, poses), m.lesson);
  return m;
}

export function polishCampaign(original: Mission[]): Mission[] {
  const ms = structuredClone(original);
  const replace = (m: Mission) => {
    ms[m.id - 1] = m;
    return m;
  };
  const four = replace(
    board(
      4,
      "שתי דרכים, אותם חלקים",
      "בחרו איפה לפנות. החלקים צריכים להספיק לכל הדרך.",
      5,
      4,
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
      ],
      [group("kids", [0, 3], [4, 1])],
      CITY,
    ),
  );
  reserve(four, ["3,3", "3,2"]);
  finish(four, [], "יש יותר מדרך אחת. שתי פניות צריכות להספיק לכל המסלול.");
  const five = replace(
    board(
      5,
      "בית ספר או מרפאה?",
      "הרכיבו דרך לשירות שהילדים צריכים.",
      5,
      4,
      [
        [
          [0, 3],
          [1, 3],
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
      [group("kids", [0, 3], [4, 2])],
      CITY,
    ),
  );
  kind(five, "2,2", "straight", 0);
  c(five, "2,0").landmark = { kind: "clinic", label: "מרפאה" };
  five.tiles.push({
    id: "wrong-turn",
    kind: "corner",
    rotation: 3,
    cell: null,
  });
  finish(
    five,
    [],
    "דרך למרפאה אינה דרך לבית הספר. קראו את היעד, לא רק את החיבור.",
  );
  const seven = replace(
    board(
      7,
      "הדרך לתחנה",
      "החלקים צריכים להגיע עד התחנה שליד בית הספר.",
      5,
      4,
      [
        [
          [0, 3],
          [1, 3],
          [2, 3],
          [2, 2],
          [2, 1],
          [3, 1],
        ],
      ],
      [group("kids", [0, 3], [4, 1], 8, "הבתים", { walkFrom: "3,1" })],
    ),
  );
  finish(seven, [], "הגישה לשירות כוללת גם את ההליכה האחרונה מהתחנה.");
  const eight = replace(
    board(
      8,
      "מצפון או מדרום לגינה?",
      "שתי פניות בלבד. בחרו מעקף שלם סביב הגינה.",
      7,
      5,
      [
        [
          [1, 2],
          [1, 1],
          [2, 1],
          [3, 1],
          [4, 1],
          [5, 1],
          [5, 2],
        ],
      ],
      [group("kids", [1, 2], [5, 2])],
      NOISE,
    ),
  );
  kind(eight, "1,2", "tee", 1);
  kind(eight, "5,2", "tee", 3);
  for (const id of ["2,2", "3,2", "4,2"]) c(eight, id).terrain = "quiet";
  reserve(eight, ["1,3", "2,3", "3,3", "4,3", "5,3"]);
  finish(
    eight,
    [],
    "אותם חלקים יכולים ליצור שני מעקפים. פיצול בין שניהם משאיר פער.",
  );
  const eleven = replace(
    board(
      11,
      "באיזו גדה חוצים?",
      "גשר אחד ושתי גדות מוכנות. תכננו גם את הגישה.",
      5,
      5,
      [
        [
          [0, 2],
          [1, 2],
          [1, 1],
          [2, 1],
          [3, 1],
          [3, 2],
          [4, 2],
        ],
      ],
      [group("river", [0, 2], [4, 2], 12)],
      RELIEF,
    ),
  );
  river(eleven, 2, ["2,1", "2,3"]);
  kind(eleven, "2,1", "bridge", 0);
  t(eleven, "2,1").id = "bridge";
  eleven.tiles.push({
    id: "ordinary-road",
    kind: "straight",
    rotation: 0,
    cell: null,
  });
  reserve(eleven, ["1,3", "2,3", "3,3"]);
  finish(
    eleven,
    [],
    "מקום החצייה משנה גם את הגישות. הכביש והגשר צריכים לעבוד יחד.",
  );
  const twelve = replace(
    board(
      12,
      "שני צדדים, עלייה אחת",
      "הרכיבו גישה משני צדי ההר. קראו את הצד הגבוה.",
      5,
      4,
      [
        [
          [0, 3],
          [0, 2],
          [1, 2],
          [2, 2],
        ],
        [
          [4, 3],
          [4, 2],
          [3, 2],
          [2, 2],
        ],
      ],
      [
        group("west", [0, 3], [2, 2], 6, "החוף"),
        group("east", [4, 3], [2, 2], 6, "הבקע"),
      ],
      RELIEF,
    ),
  );
  for (const cell of twelve.cells) if (cell.x === 2) cell.height = 1;
  kind(twelve, "1,2", "ramp", 1);
  kind(twelve, "3,2", "ramp", 3);
  finish(
    twelve,
    [],
    "שני הצדדים צריכים גישה אל השירות. גובה החיבור חשוב גם כשהכבישים נראים קרובים.",
  );
  const thirteen = replace(
    board(
      13,
      "המסע עוד לא נגמר",
      "שישה הגיעו. הרכיבו דרך חזרה לשמונה שמחכים.",
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
          [3, 0],
          [2, 0],
          [1, 0],
          [0, 0],
          [0, 1],
          [0, 2],
        ],
      ],
      [group("queue", [0, 2], [3, 2], 14)],
    ),
  );
  kind(thirteen, "1,2", "oneway", 0);
  kind(thirteen, "2,0", "oneway", 2);
  t(thirteen, "3,0").id = "return-corner";
  finish(
    thirteen,
    [],
    "הכביש צריך לאפשר גם חזרה. החץ הלא נכון יכול להשאיר שמונה אנשים בלי נסיעה.",
  );
  const nineteen = replace(
    board(
      19,
      "מגיעים למרפאה",
      "חברו את המרכז, ופתחו שירות ליד היישוב.",
      5,
      5,
      [
        [
          [0, 4],
          [1, 4],
          [2, 4],
          [2, 3],
          [2, 2],
          [1, 2],
          [0, 2],
        ],
      ],
      [
        group("centre", [0, 4], [0, 2], 6, "המרכז"),
        group("local", [4, 4], [4, 3], 4, "היישוב הקטן", { local: true }),
      ],
      CORE,
    ),
  );
  c(nineteen, "0,2").landmark = { kind: "clinic", label: "מרפאה מרכזית" };
  c(nineteen, "4,3").servicePlot = true;
  c(nineteen, "4,3").landmark = undefined;
  c(nineteen, "1,1").servicePlot = true;
  nineteen.tiles.push({
    id: "clinic",
    kind: "clinic",
    rotation: 0,
    cell: null,
  });
  finish(
    nineteen,
    [put("clinic", "4,3")],
    "יש מי שצריך נסיעה למרכז, ויש מי שיכול להגיע לשירות קרוב לבית.",
  );
  // One inventory can build either corridor; neither prebuilt strip gives away the answer.
  const twentyThree = ms[22];
  twentyThree.tiles = twentyThree.tiles.filter(
    (t) => !["1,3", "2,3", "3,3"].includes(t.cell ?? ""),
  );
  const twentyOne = ms[20];
  twentyOne.groups[0].count = 12;
  twentyOne.instruction =
    "גם בכביש רגיל צריך לחזור. החלק הרחב יביא עוד 12 נוסעים.";
  const final = ms[23];
  c(final, "2,1").bridgeAxis = 1;
  reserve(final, ["1,1", "1,2", "3,1", "3,2"]);
  final.instruction = "גשר ורמפה יחידים צריכים לשרת את שתי הקהילות.";
  const targets: Record<number, string[]> = {
    3: ["1,2", "3,1"],
    4: ["2,3", "2,2", "2,1", "3,1"],
    5: ["1,3", "1,2", "2,2", "3,2"],
    6: ["1,3", "2,3", "2,1", "3,1", "3,3"],
    7: ["1,3", "2,3", "2,2", "2,1"],
    8: ["1,1", "2,1", "3,1", "4,1", "5,1"],
    9: ["1,3", "1,2", "2,2", "3,2", "3,1"],
    10: ["1,4", "2,4", "2,3", "2,2", "3,2"],
    11: ["1,2", "1,1", "2,1", "3,1", "3,2"],
    12: ["0,2", "1,2", "3,2", "4,2"],
    13: ["3,1", "3,0", "2,0", "1,0", "0,0", "0,1"],
    14: ["2,2", "3,2", "4,2"],
    15: ["3,3", "4,3", "4,2"],
    16: ["1,1", "1,2", "3,2", "3,1", "3,3"],
    17: ["1,3", "2,3", "2,2", "2,1", "3,1", "3,3"],
    18: ["3,2", "2,2", "1,2", "1,0", "2,0"],
    19: ["1,4", "2,4", "2,3", "2,2", "1,2"],
    20: ["1,4", "2,3", "2,1", "3,1", "3,4"],
    21: ["0,1", "1,1", "2,1", "3,1"],
    22: ["0,2", "1,1", "3,1", "4,2"],
    23: ["1,1", "2,1", "3,1"],
    24: ["1,3", "3,3", "3,4", "4,2"],
  };
  for (const m of ms)
    if (m.id >= 3) retune(m, targets[m.id], m.id === 24 ? 2 : 0);
  return ms;
}
