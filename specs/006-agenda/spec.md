# Feature Specification: Agenda (Feedback Round 3)

**Feature Branch**: `006-agenda`

**Created**: 2026-10-26

**Status**: Approved (2026-10-26) — D1–D3, D4 A, D5 A, D6 A, D7 automatic, D8 A

**Input**: The owner's third round (2026-10-25). The first pages of the paper
notebook hold the months ahead, with events known long before (a ceremony, a
feast day, a friend's wedding). Bring this into the app. An event written there
is a direct reference to a task: when the week holding it starts, that task is
already a goal of the week.

## Findings (discovery)

| # | Finding |
|---|---|
| 1 | An entry can already be created on any future day (`POST /v1/days/{date}/entries`), but nothing lists future entries, so the notebook's "months ahead" view has no place in the app. |
| 2 | A week's goals come from templates (accepted at the week's start) and rhythms (applied when the Goals tree or a week opens, 005 D7). Nothing turns a dated task into a goal. |
| 3 | A milestone goal can already point at an entry (`milestone_entry_id`) and is done when that entry is completed. A weekly goal for an event fits this without a new goal type. |
| 4 | Some events repeat every year on the same date (a feast day, a birthday). The notebook copies them by hand each year. |
| 5 | Some events are only to remember (a friend's wedding) and are not something to plan for in the week. |
| 6 | The owner also wants tasks that repeat on days of the week (2026-10-26): "a task 6 times a week, Sunday to Friday". Today a weekly template makes a "6×" goal for the week, but places no task on any day. |
| 7 | A count goal already counts every completed entry linked to it (`entry_objective`), so one weekly goal can count a repeating task's days. |
| 8 | In the notebook the owner wrote the next day by hand, looking at the week and the day before to know which tasks it must hold. "Copy from another day" helps, but tasks that are certain every day at a fixed time (a daily meeting Mon–Fri at the same hour) still have to be brought in by hand. A weekly item with a start time covers this if its tasks are already on the day when the owner opens it. |
| 9 | A week can also get a goal for the same activity from a rhythm (005 D7), not only from a template. |

## Decisions

★ marks the recommendation. D1–D3 were proposed on 2026-10-25 and taken as
approved with the seed adjustments; confirm or change them with D4–D5.

| ID | Question | Options |
|---|---|---|
| D1 | Where the agenda lives | ★ **A** An "Agenda" section on the Goals screen, below the tree: the next months, each event on one line. **B** Its own screen in the menu. |
| D2 | Events that repeat | ★ **A** A "Repeats every year" switch; the next occurrence appears after the current one passes. **B** No repeats. |
| D3 | Which events become a week goal | ★ **A** Every event, with a per-event "Week goal" switch to turn it off (a wedding to remember only). **B** None by default; switch on per event. |
| D4 | How far ahead the agenda shows | ★ **A** The next 12 months, grouped by month, with the current and next month open and the rest collapsed. **B** Only the next 2 months, like the notebook. |
| D5 | An event known only by month ("sometime in March") | ★ **A** Not in this round: an event has a date. **B** Allow a month-only event that becomes a goal of that month. |
| D6 | Repeating on days of the week (finding 6) | ★ **A** Repeat is one of: never, every year, or every week on chosen days (Sun–Fri, or every day). A weekly item places its task on each chosen day of a week when that week starts, and makes one count goal for the week ("Task 6×", target = the days chosen), with each day's task linked to it. In the agenda it shows once, as "Every Sun–Fri". **B** As A, but one goal per day instead of one count goal. |
| D7 | A weekly repeating item and a template or rhythm for the same activity | **Approved**: nothing is removed by hand. Saving a weekly item whose activity a template covers archives that template in the same save, and the confirmation says so, with Undo. When the week already has a goal for that activity from a rhythm, the item makes no second goal: its tasks count for that goal. |
| D8 | Bringing certain tasks into the day (finding 8) | ★ **A** (1) The Day screen also applies its week, so a weekly item's tasks are on the day when it opens, at their time. (2) The entry sheet gets "Repeat…" under "More": it turns a task into a weekly item (days and time prefilled from the task), so a daily meeting is set up once from the day itself. **B** Only (1); items are created only in the agenda. |

## User Stories

### US1 — Write an event for a future date (P1)

From the agenda, the owner adds an event with a title and a date, and optionally
a start time, an activity, and the goals it counts for. The event's task shows
on that day's timeline like any entry, marked as an event.

**Acceptance**:
1. Adding "Friend's wedding" on a date in two months shows it under that month
   in the agenda and as an entry on that day.
2. An event with a start time sits at that time in the day; without one it sits
   first in the day.
3. Editing the event's title, date, or time changes its planned task. A task
   already completed is not moved.
4. Deleting the event deletes its planned task and keeps a completed one.

### US2 — The week starts with the event as a goal (P1)

When the week holding an event starts, the week has a goal for it, linked to the
event's task, and counting for the goals the event counts for.

**Acceptance**:
1. Opening the week (or the Goals tree) that holds an event creates one weekly
   goal named after the event, done when its task is completed.
2. The goal counts for the event's goals above that contain that week; a link
   to a goal of another period is left out.
3. Running it again in the same week creates nothing new; a goal the owner
   removed stays removed for that week.
4. An event added during its own week gets its goal at once.
5. An event with "Week goal" off makes no goal.

### US4 — Tasks that repeat on days of the week (P1)

**Acceptance**:
1. An item "every week on Sun–Fri" puts its task on each of those 6 days when
   the week starts, at its start time if it has one.
2. The week gets one goal "<title> 6×" that counts those tasks; each check on
   a task updates it at once, so completing 4 of them shows 4 / 6 and checking
   the sixth marks the goal done, with no other action.
3. Applying again creates no new task or goal; a task or goal the owner deleted
   stays deleted for that week.
4. Changing the days or the time changes the tasks of weeks not yet started and
   the planned tasks of the current week from today on; completed tasks are
   never touched.
5. A weekly item can end on a date; no tasks are placed after it.
6. Saving a weekly item whose activity a template covers archives the template
   in the same save, says so, and Undo restores it (D7).
7. When the week already has a rhythm goal for the item's activity, no second
   goal is made and the tasks count for the rhythm goal (D7).
8. Opening a day shows the weekly items' tasks of that day (D8).
9. "Repeat…" on a task creates a weekly item with that task's title, activity,
   time, and weekday prefilled; the task itself becomes that day's occurrence (D8).

### US3 — Events that repeat every year (P2)

**Acceptance**:
1. A repeating event shows its next occurrence in the agenda. Its task for that
   date exists once the date is within the agenda's range.
2. After an occurrence passes, the next year's occurrence appears, with its own
   task and, in its week, its own goal.
3. Turning repeat off keeps past occurrences and removes planned future tasks
   after the next one.

## Requirements

- **FR-001** An agenda item has a title (required), a date (the first or only
  occurrence), an optional start time, optional activity, optional goals it
  counts for, a repeat (never, every year, or every week on chosen days, with an
  optional end date), "week goal" (on by default), and notes.
- **FR-002** Each occurrence has exactly one task (an entry on that date). A
  one-off or yearly occurrence's task is created when it enters the agenda's
  range; a weekly item's tasks are created when their week is applied.
- **FR-003** The agenda lists occurrences from today through 12 months ahead,
  grouped by month, with date, title, and a repeat mark (D4).
- **FR-004** At the start of a week (applied when the week or the Goals tree
  opens, like rhythms) each one-off or yearly occurrence in that week with
  "week goal" on gets one milestone goal pointing at its task, and each weekly
  item gets one count goal for the week with its tasks linked (D6).
- **FR-005** The applied goal's links are the event's goals whose period
  contains the week.
- **FR-006** Applying is idempotent per occurrence, and a removed goal is not
  recreated for that occurrence.
- **FR-007** Editing or deleting an event never changes or deletes a completed
  task.
- **FR-008** The day timeline marks an event's task with a calendar icon and
  the label "Event", for screen readers too.
- **FR-009** Events are included in the export (format version 5) and are
  isolated per workspace like every other record.
- **FR-010** Offline: the agenda reads from the cache; adding or editing an
  event needs a connection, like goals.
- **FR-011** Every screen keeps passing axe in light and dark.

## Success Criteria

- **SC-001** An event written months ahead becomes a goal of its week with no
  action from the owner beyond opening the app that week.
- **SC-002** A yearly event is written once.
- **SC-003** Every acceptance scenario above has an automated test (integration
  or e2e), run locally before each deploy.

## Out of Scope

Reminders and notifications, events with no date (D5 B), shared or imported
calendars, repeats by month or every N weeks.
