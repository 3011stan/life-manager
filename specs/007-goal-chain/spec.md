# Feature Specification: Goal Chain (Feedback Round 4)

**Feature Branch**: `007-goal-chain`

**Created**: 2026-10-27

**Status**: Draft — awaiting the owner's approval

**Input**: The owner's fourth round (2026-10-27):
1. A day's task may only be linked to a week goal. A week goal may only be
   linked to a month goal, and so on up. A task relates to a month goal only
   indirectly: task → week → month → year → 5 years → 10 years → 15 years.
2. "Link to an objective" in the entry sheet is a large field with every kind
   of goal mixed together.

## Findings (discovery)

| # | Finding |
|---|---|
| 1 | A goal may count for any goal of a longer horizon whose period contains it (`validateParents`, 005 D6). The owner's goals skip levels: year goals under 15-year goals, 5-year goals under 15-year goals. |
| 2 | A task may be linked by hand to any goal of its day's periods, of every horizon. "Link to an objective" lists them all in one checklist. |
| 3 | A task also counts by itself for every goal whose activities include the task's activity, at any horizon (`directlyContributes`). So a class counts straight for a year goal with no week goal between them. |
| 4 | Rhythms create week goals linked straight to the year goal (no month goal). Events and repeating items (006) link their week goal straight to the event's goals, often a year goal. |
| 5 | A week belongs to the month holding its fourth day (`weekMonthStart`), so every week has exactly one month above it. |
| 6 | A higher goal's progress already includes everything that counts for the goals below it, so a strict chain loses no credit as long as each task reaches a week goal. |

## Decisions

★ marks the recommendation. E1–E3 were proposed on 2026-10-27; E4 needs the
owner's goal names.

| ID | Question | Options |
|---|---|---|
| E1 | Where the rule applies | ★ **A** Every level: task → week → month → year → 5y → 10y → 15y. A goal counts only for goals of the horizon right above; a goal with none above stays a top goal. **B** Only week, month, and year; long horizons may skip. |
| E2 | A task whose activity a longer goal tracks, with no week goal for it | ★ **A** Completing the task creates (or reuses) that week's goal for the activity, already linked through the month to the goal that tracks it, so the task counts with no action. **B** The task does not count until a week goal exists. |
| E3 | Choosing what a task or goal counts for | ★ **A** A search picker showing only the level right above (this week's goals for a task; the month's for a week goal; and so on), up to 8 at a time, each with its path in small text, and "+ New … goal" when none fits. The task's "Counts for" stays read only and shows the full path. **B** Keep the checklist, filtered to the level above. |
| E4 | Existing links that skip a level | ★ **A** A script with a dry run (like the seed) re-links what it can by itself: week goals made by rhythms, events, and repeating items get their month goal between; hand links from tasks to longer goals move to the week goal on that path. Links between long horizons that skip a level need goals the owner names (the private seed file carries them); until then those goals show "skips a level" in the tree. The owner runs it, after reading the dry run. **B** Clear every skipping link and re-link by hand. |
| E5 | Targets of goals the app creates between levels (a month goal between a week and a year goal) | ★ **A** From the rhythm when there is one (4× a week → 4 × the weeks of that month); otherwise a count of 1 ("done at least once"), editable. Its title is the goal above plus the period ("Gym · Nov"). **B** Always a count of 1. |

## User Stories

### US1 — Every task climbs the chain (P1)

**Acceptance**:
1. Completing a task whose activity a year goal tracks credits that year goal
   through a week goal and a month goal, both linked; the week goal is created
   if the week had none for that activity (E2).
2. A second task of the same activity that week reuses the same week goal.
3. A task no goal tracks counts for nothing until linked by hand.
4. A task's "Counts for" shows its whole path, from the week goal to the top.

### US2 — Links only to the level right above (P1)

**Acceptance**:
1. A task can be linked by hand only to goals of its week.
2. A week goal can count only for goals of its month; a month goal only for its
   year; a year goal only for 5-year goals; and so on. The API refuses any
   other link.
3. Rhythms of a year goal create the month goal ("Gym · Nov", target from the
   rhythm), and its week goals count for that month goal.
4. An event's or repeating item's week goal counts for the month goal on the
   way to the event's goal, created if missing.

### US3 — A small picker (P1)

**Acceptance**:
1. The entry sheet's link field shows only this week's goals, searchable, at
   most 8 at a time, each with its path.
2. "+ New week goal" creates one from the task (title and activity filled in),
   with the month goal above to choose in the same picker.
3. The goal sheet's "Counts for" shows only the horizon right above, with the
   same picker.

### US4 — Fix existing links (P2)

**Acceptance**:
1. The dry run lists every link it would change and every goal it would create.
2. After the run no week goal counts straight for a year goal, and no task is
   linked by hand to a goal longer than a week.
3. A goal still skipping a level shows "skips a level" in the tree.
4. Running it twice changes nothing the second time.

## Requirements

- **FR-001** A goal's links point only to goals of the next horizon (week →
  month → year → y5 → y10 → y15) whose period contains it (E1).
- **FR-002** A task's hand links point only to goals of its week.
- **FR-003** A task counts directly only for week goals (by activity or by hand
  link); longer goals count it only through their goals below.
- **FR-004** Completing a task whose activity a goal above tracks, when no week
  goal of that week covers the activity, creates the missing week goal and
  any missing month goal in the same request (E2, E5).
- **FR-005** Rhythms, events, and repeating items build the same chain (E5).
- **FR-006** Goals the app creates between levels are reused per goal above and
  period; they are ordinary goals the owner can edit or delete. A deleted one
  is not recreated for that period.
- **FR-007** The pickers of E3 in the entry sheet, the goal sheet, and the event
  sheet ("Counts for" there lists month and year goals; the chain between is
  built at apply).
- **FR-008** Existing links that break FR-001 or FR-002 stay readable; editing
  such a goal requires a link that follows FR-001. The tree marks them.
- **FR-009** The fix script of E4 has a dry run, is idempotent, and touches the
  database only when the owner runs it.
- **FR-010** Every screen keeps passing axe in light and dark.

## Success Criteria

- **SC-001** Every completed task with a tracked activity reaches the top of its
  chain with no action.
- **SC-002** Linking by hand never shows more than one horizon.
- **SC-003** Every acceptance scenario has an automated test, run locally before
  each deploy.

## Out of Scope

Day goals (a day's tasks are its plan), links across workspaces, reordering the
horizons.
