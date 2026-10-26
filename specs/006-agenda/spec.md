# Feature Specification: Agenda (Feedback Round 3)

**Feature Branch**: `006-agenda`

**Created**: 2026-10-26

**Status**: Draft — awaiting the owner's approval

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

### US3 — Events that repeat every year (P2)

**Acceptance**:
1. A repeating event shows its next occurrence in the agenda. Its task for that
   date exists once the date is within the agenda's range.
2. After an occurrence passes, the next year's occurrence appears, with its own
   task and, in its week, its own goal.
3. Turning repeat off keeps past occurrences and removes planned future tasks
   after the next one.

## Requirements

- **FR-001** An event has a title (required), a date, an optional start time,
  optional activity, optional goals it counts for, "repeats every year", "week
  goal" (on by default), and notes.
- **FR-002** Each occurrence of an event has exactly one task (an entry on that
  date), created when the occurrence enters the agenda's range.
- **FR-003** The agenda lists occurrences from today through 12 months ahead,
  grouped by month, with date, title, and a repeat mark (D4).
- **FR-004** At the start of a week (applied when the week or the Goals tree
  opens, like rhythms) each event occurrence in that week with "week goal" on
  gets one milestone goal pointing at its task.
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
calendars, events that repeat on other rules (weekly, monthly).
