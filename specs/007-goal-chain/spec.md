# Feature Specification: Goal Chain (Feedback Round 4)

**Feature Branch**: `007-goal-chain`

**Created**: 2026-10-27

**Status**: Approved (2026-10-28) — E1–E5 as recommended (★), with finding 7

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
| 7 | Bug (2026-10-28): a task's "Counts for" repeats goals. The API's `contributesTo` already lists every goal the task counts for, ancestors included, and the entry sheet draws the whole path above each of them again, so one class showed 6 blocks and 16 rows for 6 goals, the top goal 6 times. Progress is not affected: each goal counts a task once. |

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
4. A task's "Counts for" shows its whole path, from the week goal to the top,
   with each goal once (finding 7).

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
- **FR-011** A task's "Counts for" starts only from the goals the task counts
  for directly and lists each goal once, even when paths join above (finding 7).

## Success Criteria

- **SC-001** Every completed task with a tracked activity reaches the top of its
  chain with no action.
- **SC-002** Linking by hand never shows more than one horizon.
- **SC-003** Every acceptance scenario has an automated test, run locally before
  each deploy.

## Out of Scope

Day goals (a day's tasks are its plan), links across workspaces, reordering the
horizons.

## 007b — follow-up (2026-11-02)

**Status**: Approved (2026-11-02).

**Input**: the owner's first fix-chain dry run on staging, and two questions
about the goal sheet.

### Findings

| # | Finding |
|---|---|
| 8 | A task linked by hand to several goals of one line (a year goal, the 5-year goal above it, and the 10-year goal above that) had each link moved on its own: for the long ones the script picked a year goal below at random and made week and month goals named after the long goal under it. The link to the most specific goal already carries the credit up the chain. |
| 9 | Value, level, and milestone goals take their progress from measurements or from being marked done, never from tasks. When such a goal also lists activities, completing a task made a week goal and a month goal under it that change nothing and repeat the week goal of the count goal for the same activity, so "Counts for" shows two paths. This happens for new tasks since 007 went live. |
| 10 | The dry run names a week goal without its week ("Gym 4×" twice, for two weeks). |
| 11 | "Counts these activities" reads as if a task counts straight for a month or year goal; since 007 it counts through a week goal made for it. |
| 12 | The "Counts for" picker shows at most 8 goals and does not say more exist, so goals seem missing. |

### Decisions

| ID | Decision |
|---|---|
| F1 | The fix script keeps only the most specific of a task's hand links when one goal is below another; the others are dropped (credit reaches them through the chain). A remaining link to a goal longer than a year is not moved by guessing a path: the dry run lists it as needing a choice. Links to month and year goals move to a week goal as before. |
| F2 | Only count and duration goals get a chain from completed tasks. Value, level, and milestone goals keep their activities as a reference. The fix script removes the week and month goals the app made toward such a goal, when nothing else counts for them and no task is linked to them by hand; nothing else is deleted. |
| F3 | Every week and month in the dry run carries its start date. |
| F4 | The activity field reads "Counts these activities" on a week goal and "Tracks these activities" on longer goals, with one line saying tasks count through a week goal made for them; on a value, level, or milestone goal that already lists activities, one line says they do not change its progress. English and Portuguese. |
| F5 | The picker says how many more goals match ("+N more — type to search") and groups the goals it shows under the goal above them (goals with none under "No goal above"), still at most 8. |

### Acceptance

1. A task linked by hand to a year goal and to the 5-year and 10-year goals
   above it ends with one link, to a week goal under the year goal; the dry run
   lists the two dropped links.
2. A task linked by hand only to a 5-year goal keeps its link, and the dry run
   lists it as needing a choice.
3. Completing a task whose activity only a value, level, or milestone goal
   lists makes no goal; with a count goal for the same activity, only that
   chain is made.
4. The fix script lists and removes the goals made earlier toward a value,
   level, or milestone goal; a second run changes nothing.
5. Every week and month in the dry run shows its start date.
6. The activity field's label and hint follow F4 by horizon and target type.
7. With more than 8 matching goals the picker shows 8, grouped by the goal
   above, and "+N more — type to search".

### Requirements

- **FR-012** The fix script drops a task's hand links to goals above another of
  its linked goals, and lists links to goals longer than a year with no more
  specific link as needing a choice (F1).
- **FR-013** Completed tasks build a chain only toward count and duration goals
  (F2). Events, repeating items, and hand links keep the goals chosen for them.
- **FR-014** The fix script removes only goals the app made toward a value,
  level, or milestone goal that nothing counts for and no task is linked to
  (F2).
- **FR-015** Report lines name weeks and months with their start dates (F3).
- **FR-016** The activity field's label and hint by horizon and target type (F4).
- **FR-017** The picker's count of hidden matches and grouping by the goal above
  (F5), passing axe in light and dark.

## 007c — follow-up (2026-11-09)

The owner's second dry run of the fix script showed two errors.

| # | Finding | Decision |
|---|---|---|
| F6 | The script would remove a link the person made. When a chain reuses a person's month goal that already counts for a year goal, the app records the reuse; the script read that record as a link the app had given, and listed `unlink` for it when the year goal is value, level, or milestone | The script removes only a link the app itself added |
| F7 | Closing a period takes its goals out of "active", and the chain looked only at active goals. In a closed week holding a rhythm goal for an activity, the script (and completing a task there) made a second week goal for the same activity | A goal of a closed period still counts as existing: the chain reuses it and makes no second one. Goals that track an activity must still be active to start a chain |

### Acceptance

1. A person's month goal under a value, level, or milestone year goal, reused by
   a chain, keeps its link; the dry run has no `unlink` line for it.
2. A loose week goal the app linked into such a chain still loses that link.
3. Completing a task, or running the script, in a closed week whose goal for the
   activity is done, carried, or dropped makes no second week goal.
4. In a closed month, a goal already under the year goal is used; no second
   month goal is made. No period is reopened.

### Requirements

- **FR-018** The fix script deletes only links the app added (F6).
- **FR-019** The chain treats goals of closed periods as existing (F7).
