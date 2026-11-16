# Feature Specification: One Goal per Thing, Periods Closed in Order (Feedback Round 6)

**Feature Branch**: `009-periods-and-duplicates`

**Created**: 2026-11-15

**Status**: Draft — awaiting the owner's approval

**Input**: The owner's sixth round (2026-11-15), seven points: duplicated goals
after a month's and a week's close, a month closed while one of its weeks was
open, the Month tab opening January, repeated goals in the day's "This week"
line, the copy dialog's "already on this day" filter, and a missing tab icon.

## Findings (discovery)

| # | Finding |
|---|---|
| 1 | **Month carry makes a second goal.** Closing a month copies each carried goal into the next month without looking at what is there. The next month often has that goal already: the goal chain (007) makes a month goal under a year goal as soon as a task of the new month counts for it ("Gym · Nov"), and the person may have created next month's goals by hand. A carried chain goal also keeps the old month in its title ("Gym · Oct" in November). |
| 2 | **Goals that renew by themselves are offered for carry.** 008 stopped carrying goals a rhythm makes. Goals made by a weekly template (proposed again every week) and by the chain (made again in the next period) are still offered, and carrying them always duplicates. |
| 3 | **Week duplicates have more than one source.** A week can get a goal for the same activity from a rhythm, from an accepted template, from a carry, and from the chain. Only the chain looks for an existing goal; a rhythm, a template, and a carry each make their own. Example: a year goal's weekly rhythm "Lumbar exercises 7×" and a template "Lumbar exercises 6×" both land in the same week. |
| 4 | **The 008 data fix missed the early weeks.** It merged a carried copy only when its carries led back to a goal a rhythm made. The first weeks' goals were made by the seed import, not by a rhythm, so their carried copies (for example "Reading 6×" in the week of Nov 1) were left. To confirm on the data: a read-only listing of look-alike goals per week and month (run by the owner). |
| 5 | **"This week" repeats goals** because it lists the week's essential goals, and the week holds the duplicates of findings 1–4. It is not a bug of the line itself. Duplicates still appear after 008 (week of Nov 15) because of findings 2 and 3. Some look-alikes are different goals (two activities with similar names); these are not duplicates. |
| 6 | **Closing does not check the periods inside.** A week, month, or year closes whether or not the periods inside it are closed. A week belongs to the month that holds its fourth day (existing rule), so a week from Nov 29 to Dec 5 belongs to December. |
| 7 | **The Month tab opens January** when coming from the Year tab: a tab opens the period that holds the start of the period on screen, and a year starts in January. |
| 8 | **"Already on this day" only knows direct copies.** The dialog compares the picked day's tasks with the sources of this day's tasks. A task copied yesterday from the day before has yesterday's task as its source, so picking the day before shows it selected again. |
| 9 | **No tab icon**: the app has no favicon, touch icon, or web manifest. |

## Decisions

★ marks the recommendation.

| ID | Question | Options |
|---|---|---|
| G1 | Which goals a close offers to carry | ★ **A** Only goals the person made (by hand). Goals a rhythm, a template, or the chain made renew in the next period on their own: the close lists them as "renews next period" and sets the unmet ones not met. **B** Offer all and rely on G2 to avoid duplicates. |
| G2 | A carry when the next period already has that goal | ★ **A** The carry joins the goal already there (same activities, or with no activity the same title without its period label): no new goal; links above are added to it. **B** Always make a new goal (today). |
| G3 | A rhythm and a template for the same activity in a week | ★ **A** One goal per activity and week: the rhythm's goal is made first when the week opens; a template whose activity already has a goal that week is shown as "already in this week" and not proposed; a rhythm reuses a goal of its activity already in the week. **B** Allow both. |
| G4 | When a period can close | ★ **A** Only when every period inside it that has something (a day with tasks; a week, month, or year with goals or with an open period inside) is closed. The close screen lists what is still open, each a link. Weeks belong to the month of their fourth day; long horizons (5, 10, 15 years) need their years closed. **B** Also require empty periods to be closed. **C** Warn but allow. |
| G5 | What a tab opens | ★ **A** Each tab reopens the period last viewed in that tab during the session; the first time, the current period. **B** The period of that tab that holds today. |
| G6 | "Already on this day" | ★ **A** A task counts as already on the day when this day has a copy of it (any number of copies back) or a task with the same title (ignoring case) and the same activity; those start unselected. Copies stay locked as today; same-title tasks can still be selected. **B** Copies only. |
| G7 | Tab icon | ★ **A** A simple mark in the app's accent color for light and dark tabs, a touch icon, and a web manifest (name, icons, colors). **B** A favicon only. |
| G8 | Existing duplicates | ★ **A** A new step in the owner-run data script (dry run first, idempotent): in each week and month, goals tracking the same activities merge into one (kept: the rhythm's, then the template's, then the oldest); with no activity, a carried chain goal merges into the chain goal of the same goal above. Its tasks, links, and measurements move. Other look-alikes are listed, not merged. **B** The owner merges by hand. |

## User Stories

### US1 — A close never makes a duplicate (P1)

**Acceptance**:
1. Closing a period does not offer to carry goals made by a rhythm, a template,
   or the chain; it lists them as renewing, and unmet ones end not met (G1).
2. Carrying a goal into a period that already has it adds no goal; the goal
   there keeps its tasks and gains the carried goal's links above (G2).
3. A carried goal with no match makes a new goal as today.

### US2 — One goal per activity in a week (P1)

**Acceptance**:
1. A week with a rhythm's goal for an activity does not propose a template for
   that activity; the Templates screen shows why (G3).
2. A rhythm applied to a week that already has a goal of its activity reuses
   it instead of making one.
3. The day's "This week" line shows each goal once.

### US3 — Periods close in order (P1)

**Acceptance**:
1. A week with a day that has tasks and is not closed cannot be closed; the
   close screen lists that day as a link (G4).
2. A month cannot close while one of its weeks needs closing; a week that
   crosses into the next month counts for the month of its fourth day.
3. The same holds for a year (its months) and long horizons (their years).
4. The API refuses such a close.

### US4 — Small things that slow the owner down (P2)

**Acceptance**:
1. Going Year → Month shows the month last viewed in the Month tab, or the
   current month the first time (G5).
2. In the copy dialog, a task already on the day starts unselected for any
   picked day, not only the day before (G6).
3. The browser tab shows the app's icon in light and dark (G7).

### US5 — The existing duplicates are gone (P1)

**Acceptance**:
1. The dry run lists every merge and every look-alike left for the owner (G8).
2. After the run, each week and month has one goal per activity, with its
   tasks and links.
3. A second run changes nothing.

## Requirements

- **FR-001** Goals made by a rhythm, a template, or the chain are not carried (G1).
- **FR-002** A carry joins a matching goal of the next period instead of making one (G2).
- **FR-003** One goal per activity per week across rhythms, templates, carries, and the chain (G3).
- **FR-004** A period closes only when the periods inside it that need closing are closed; the API enforces it (G4).
- **FR-005** Each horizon tab remembers its last period for the session (G5).
- **FR-006** The copy dialog's "already on this day" covers older copies and same title and activity (G6).
- **FR-007** Tab icon, touch icon, and web manifest (G7).
- **FR-008** The data script merges existing duplicates, with a dry run (G8).
- **FR-009** Every screen keeps passing axe in light and dark.

## Success Criteria

- **SC-001** After closing a week or a month with every goal carried, the next
  period has no two goals for the same activity.
- **SC-002** No period can be closed with a period inside it still open.
- **SC-003** Every acceptance scenario has an automated test, run locally
  before each deploy.

## Out of Scope

Reopening a closed month when one of its weeks is closed later (the owner can
close the open week now; the month stays closed); renaming goals made before
this round, other than through a merge; changing the rule that a week belongs
to the month of its fourth day.
