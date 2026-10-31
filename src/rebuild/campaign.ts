import { levels as legacy } from "../levels";
import type { Corridor, Demand, MapNode } from "../types";
import type { Mission, TransitMode } from "./types";
const n = (
  id: string,
  x: number,
  z: number,
  h: number,
  kind: MapNode["kind"],
  label: string,
): MapNode => ({ id, x, z, h, kind, label });
const e = (a: string, b: string, rest: Partial<Corridor> = {}): Corridor => ({
  a,
  b,
  ...rest,
});
const d = (
  origin: string,
  destination: string,
  count: number,
  at = 0,
): Demand => ({ origin, destination, count, at, car: false });
const bus = (...path: string[]) => ({ path, mode: "bus" as TransitMode });
const train = (...path: string[]) => ({ path, mode: "rail" as TransitMode });
const pathSets: {
  solution: Mission["solution"];
  initial?: Mission["initialLines"];
  services?: string[];
  extras?: number[];
}[] = [
  { solution: [bus("A", "S")] },
  { solution: [bus("A", "V", "S")] },
  { solution: [bus("A", "J", "K", "S"), bus("B", "N", "P", "S")] },
  { solution: [bus("A", "J", "S"), bus("B", "M", "J", "S")] },
  { solution: [bus("A", "J", "S"), bus("A", "J", "W"), bus("B", "J", "C")] },
  { solution: [bus("A", "C")], services: ["L"] },
  { solution: [bus("A", "J", "S"), bus("B", "J", "S")] },
  { solution: [bus("A", "J", "S")] },
  { solution: [bus("A", "J", "S"), bus("B", "J", "W")] },
  { solution: [bus("A", "V", "M", "P", "S")] },
  { solution: [bus("A", "J", "K", "S"), bus("B", "J", "K", "S")] },
  { solution: [bus("A", "J", "P", "S"), bus("B", "K", "P", "S")] },
  {
    initial: [bus("A", "J", "S"), bus("A", "J", "W")],
    solution: [bus("A", "J", "S"), bus("A", "J", "W")],
    extras: [1, 1],
  },
  { solution: [bus("A", "I"), train("I", "T")], extras: [1, 0] },
  {
    initial: [train("I", "T")],
    solution: [train("I", "T"), bus("A", "I"), bus("B", "T")],
  },
  {
    initial: [bus("A", "I", "S"), bus("B", "I")],
    solution: [bus("A", "I", "S"), bus("B", "I"), train("I", "S")],
    extras: [1, 1, 0],
  },
  { initial: [bus("A", "S")], solution: [bus("A", "S"), bus("B", "J", "S")] },
  {
    initial: [bus("A", "J", "S")],
    solution: [
      bus("A", "J", "S"),
      bus("A", "T"),
      bus("B", "T"),
      train("T", "S"),
    ],
  },
  { initial: [bus("A", "C")], solution: [bus("A", "C")], services: ["L"] },
  {
    initial: [bus("A", "C")],
    solution: [bus("A", "C")],
    services: ["L"],
    extras: [1],
  },
  {
    initial: [bus("A", "J", "S")],
    solution: [bus("A", "J", "S")],
    extras: [2],
  },
  {
    initial: [bus("A", "J", "S")],
    solution: [bus("A", "J", "S"), bus("A", "N", "P", "S")],
  },
  { solution: [bus("A", "I", "P", "W"), bus("B", "P", "I", "S")] },
  {
    solution: [bus("A", "I", "M", "P", "S"), bus("B", "I", "W")],
    services: ["L"],
    extras: [1, 0],
  },
];
const cues = [
  "גררו קו מהבתים לבית הספר",
  "חפשו דרך נוחה מסביב לגבעה",
  "שתי שכונות, שני גשרים. חברו את שתיהן",
  "בוקר חדש: חברו את שתי השכונות לבית הספר",
  "כל מקום צריך דרך: לימודים, עבודה ומרפאה",
  "אפשר לחבר דרך למרכז — או לפתוח מרפאה ליד הבית",
  "הוסיפו קו גם לשכונה שעדיין מחכה",
  "הביאו את הילדים בדרך ששומרת על רחוב שקט",
  "בין הים להר נשאר מעט מקום. שתפו רחובות",
  "הדרך הקצרה עולה בתלילות. נסו לעלות בהדרגה",
  "שתי שכונות חולקות גשר אחד. שימו לב לתור",
  "מהחוף דרך ההר — וגם יישוב הבקע צריך להגיע",
  "האוטובוס מלא. לחצו על הקו כדי להוסיף עוד אחד",
  "חברו אוטובוס לתחנה ורכבת מהירה למרכז השירות",
  "הרכבת מוכנה. עכשיו צריך להגיע מהבתים לתחנה",
  "יותר אנשים הבוקר. חברו רכבת לציר הראשי",
  "גם ביישוב הקטן מחכים למרפאה",
  "קרוב על המפה לא תמיד מהיר. נסו מסדרון אחר",
  "אפשר לפתוח מרפאה במרחק הליכה מהיישוב",
  "ארבעה תושבים בקצה עדיין מחכים. דאגו גם להם",
  "עוד נתיב או עוד אוטובוס? הביטו באנשים שמחכים",
  "הגשר ייסגר. חברו מעקף לפני שהנוסעים יגיעו",
  "חברו את העיר בדרך שלכם. אפשר יותר מתוכנית אחת",
  "חברו את החוף וההר, ופתחו שירות גם ליישוב הבקע",
];
export const missions: Mission[] = legacy.map((l, i) => ({
  id: l.id,
  title: l.title,
  region: l.region,
  objective: cues[i],
  lesson: l.lesson,
  cue: cues[i],
  nodes: structuredClone(l.nodes),
  corridors: structuredClone(l.corridors),
  demand: structuredClone(l.demand).map((d) => ({ ...d, car: false })),
  fleet: l.id >= 13 ? 6 : l.id >= 5 ? 4 : l.id >= 3 ? 3 : 1,
  trains: l.id >= 14 ? 2 : 0,
  budget: l.id <= 8 ? Infinity : l.budget + 25,
  softTime: l.id <= 4 ? 25 : l.id >= 13 ? 70 : 45,
  efficientLength: l.id <= 4 ? 20 : 45,
  unlock: l.serviceSites?.length
    ? "service"
    : l.id >= 14
      ? "rail"
      : l.id >= 3
        ? "fleet"
        : "route",
  serviceSites: l.serviceSites ?? [],
  initialRoads: [
    ...new Set(
      l.initial
        .filter((a) => a.type === "link")
        .map((a) => (a.type === "link" ? [a.a, a.b].sort().join("~") : "")),
    ),
  ],
  initialLines: pathSets[i].initial ?? [],
  solution: pathSets[i].solution,
  solutionServices: pathSets[i].services ?? [],
  solutionExtras: pathSets[i].extras ?? [],
  noiseLimit: l.noiseLimit,
  footprintLimit: l.footprintLimit,
  induced: l.induced,
}));
Object.assign(missions[0], {
  title: "הבוקר הראשון",
  objective: "הביאו 8 ילדים לבית הספר",
  cue: cues[0],
  nodes: [
    n("A", -4.8, 2.1, 0.12, "home", "הבתים"),
    n("S", 4.2, -1.8, 0.15, "school", "בית הספר"),
  ],
  corridors: [
    e("A", "S", {
      via: [
        { x: -1.8, z: 1.6, h: 0.12 },
        { x: 1, z: 0.4, h: 0.14 },
      ],
    }),
  ],
  demand: [d("A", "S", 8)],
  initialRoads: [],
  budget: Infinity,
  efficientLength: 13,
  softTime: 22,
});
Object.assign(missions[1], {
  title: "מסביב לגבעה",
  region: "דרך מתונה · מסביב לגבעה",
  objective: "הביאו 8 ילדים בלי לטפס במדרון התלול",
  nodes: [
    n("A", -5, 2.4, 0.12, "home", "הבתים"),
    n("V", -0.8, 2.8, 0.45, "junction", "העמק"),
    n("S", 4.2, -1.5, 1.45, "school", "בית הספר"),
  ],
  corridors: [
    e("A", "S", { via: [{ x: 0, z: -0.3, h: 4.5 }] }),
    e("A", "V"),
    e("V", "S", { via: [{ x: 2.2, z: 1, h: 1 }] }),
  ],
  demand: [d("A", "S", 8)],
  initialRoads: [],
  fleet: 1,
  softTime: 30,
  efficientLength: 15,
  budget: Infinity,
});
Object.assign(missions[2], {
  title: "שתי שכונות, שני גשרים",
  region: "נחל · מעבר משותף",
  objective: "חברו את שתי השכונות לבית הספר",
  nodes: [
    n("A", -5, 3, 0.15, "home", "שכונת החוף"),
    n("B", -5, -3, 0.15, "home", "שכונת הגן"),
    n("J", -1, 2, 0.2, "junction", "גשר דרום"),
    n("K", 1, 2, 0.2, "junction", "גדת מזרח"),
    n("N", -1, -3, 0.2, "junction", "גשר צפון"),
    n("P", 1, -3, 0.2, "junction", "המעבר הפנוי"),
    n("S", 5, 0, 0.3, "school", "בית הספר"),
  ],
  corridors: [
    e("A", "J"),
    e("B", "J"),
    e("J", "K", { bridge: true }),
    e("K", "S"),
    e("B", "N"),
    e("A", "N"),
    e("N", "P", { bridge: true }),
    e("P", "S"),
    e("A", "S", { forbidden: true }),
    e("B", "S", { forbidden: true }),
  ],
  demand: [d("A", "S", 12), d("B", "S", 6)],
  initialRoads: [],
  softTime: 35,
  efficientLength: 28,
  budget: Infinity,
});
missions[3].demand = [d("A", "S", 8), d("B", "S", 8, 2)];
