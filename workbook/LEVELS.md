# Rush Hour Israel — Workbook catalog entry

- **Slug:** `rush-hour-israel`
- **Title (he):** שעת שיא
- **Title (en):** Rush Hour Israel
- **Tagline (he):** תופסים חלקי כביש, מסובבים ומחברים כדי שהאוטובוס יביא את כולם ליעד. 24 חידות דרך בתלת־ממד שבהן גובה, נהר, חוף ושימושי קרקע קובעים איפה אפשר לסלול.
- **Grades:** 7, 9
- **Orientation:** any
- **Levels:** 24 authored boards, `?level=1..24`. Stars: one for getting everyone there, one for a compact final build, one for solving without hints.

Module paths come from `packages/catalog-geography/src` in acedzn-tools, following the source register in `docs/action-puzzle/CURRICULUM.md`.

| n | Hebrew level title | Hebrew skill | Workbook geography module paths |
| - | ------------------ | ------------ | ------------------------------- |
| 1 | חסר רק חלק אחד | דרך לבית הספר | grade-7/chapter-5/city-structure, grade-9/chapter-5/transport-communication |
| 2 | סיבוב לשער | כיוון החיבור קובע | grade-9/chapter-5/transport-communication, grade-7/chapter-5/city-structure |
| 3 | לוקחים מכאן, מחברים שם | רשת מחלקים מוגבלים | grade-9/chapter-5/transport-communication |
| 4 | שתי דרכים, אותם חלקים | מסלולים חלופיים | grade-9/chapter-5/transport-communication, grade-7/chapter-5/city-structure |
| 5 | בית ספר או מרפאה? | יעד לפי שימוש קרקע | grade-7/chapter-5/city-structure |
| 6 | עיר עם כמה יעדים | עבודה ולימודים, נסיעות שונות | grade-7/chapter-5/city-structure, grade-9/chapter-5/transport-communication |
| 7 | הדרך לתחנה | תחנה והליכה עד השירות | grade-9/chapter-5/transport-communication, grade-7/chapter-2/core-periphery |
| 8 | מצפון או מדרום לגינה? | שטח שקט ומטרדי תנועה | grade-7/chapter-5/urban-nuisances, grade-7/chapter-5/city-structure |
| 9 | בין הים להר | מישור החוף הצר | grade-9/chapter-2/landform-belts, grade-9/chapter-5/transport-communication |
| 10 | הצד הגבוה של הרמפה | הפרשי גובה בדרך | grade-9/chapter-2/landform-belts, grade-9/chapter-5/transport-communication |
| 11 | באיזו גדה חוצים? | בחירת אתר לגשר | grade-9/chapter-2/landform-belts, grade-9/chapter-5/transport-communication |
| 12 | שני צדדים, עלייה אחת | מדרונות משני צדי הרמה | grade-9/chapter-2/landform-belts |
| 13 | המסע עוד לא נגמר | מקומות באוטובוס ונסיעה חוזרת | grade-9/chapter-5/transport-communication |
| 14 | מאוטובוס לרכבת | קו מזין ומסילה רציפה | grade-9/chapter-5/transport-communication |
| 15 | החיבור המקומי | נגישות מהבית עד השירות | grade-9/chapter-4/core-periphery-israel, grade-7/chapter-2/core-periphery, grade-9/chapter-5/transport-communication |
| 16 | שתי שכונות, גשר אחד | תשתית משותפת ומוגבלת | grade-9/chapter-5/transport-communication, grade-9/chapter-2/landform-belts |
| 17 | ארבעה בקצה | נגישות ליישוב בשוליים | grade-9/chapter-4/core-periphery-israel, grade-7/chapter-2/core-periphery |
| 18 | קרוב במפה, רחוק בדרך | מרחק אווירי מול מרחק דרך | grade-9/chapter-4/core-periphery-israel, grade-9/chapter-5/transport-communication, grade-9/chapter-2/landform-belts |
| 19 | מגיעים למרפאה | שירות מקומי בפריפריה | grade-9/chapter-4/core-periphery-israel, grade-7/chapter-2/core-periphery, grade-7/chapter-5/city-structure |
| 20 | מקום לכולם | רשת משותפת לגלעין ולשוליים | grade-9/chapter-4/core-periphery-israel, grade-7/chapter-2/core-periphery, grade-9/chapter-5/transport-communication |
| 21 | עוד נתיב, עוד נסיעות | כביש רחב מושך נסיעות | grade-9/chapter-5/transport-communication, grade-7/chapter-5/urban-nuisances |
| 22 | המעבר ייסגר | דרך חלופית כשמעבר נסגר | grade-9/chapter-5/transport-communication, grade-9/chapter-4/core-periphery-israel |
| 23 | יותר מפתרון אחד | כמה רשתות נותנות שירות | grade-9/chapter-5/transport-communication, grade-7/chapter-5/city-structure, grade-7/chapter-5/urban-nuisances |
| 24 | מחברים את כולם | גובה, נהר ושירות יחד | grade-9/chapter-2/landform-belts, grade-7/chapter-5/city-structure, grade-9/chapter-5/transport-communication, grade-9/chapter-4/core-periphery-israel, grade-7/chapter-2/core-periphery |

## Host notes

- `index.html` is the shipped campaign (`src/action/`). `action.html` (dev alias of the same campaign) and `rebuild.html` (the historical route-drawing version) are dev-server pages only and are not in the build.
- `ready` posts once the bus, school and textures have loaded and rendered; `level-start` follows for the opened board and again on every new attempt (next, level menu, restart, retry with R, the "אתגר לדוגמה" jump to board 4).
- `level-complete {level, stars, durationMs}` posts once per attempt when everyone arrives. If the player then uses the optional post-rescue tidying (or undoes and re-wins) and the stars go up, it posts once more with the higher stars. `durationMs` runs from the level start and includes paused time.
- `?level=N` opens board N directly even when the local save has it locked; there is no title screen or story beat to skip.
