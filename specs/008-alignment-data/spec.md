# Feature Specification: Alignment You Can Trust (Feedback Round 5)

**Feature Branch**: `008-alignment-data`

**Created**: 2026-11-10

**Status**: Approved by the owner on 2026-11-12

**Input**: The owner's fifth round (2026-11-10): closing a day showed an
alignment of 9%, and its "Why?" listed "0m of 1h toward objectives" for tasks
that were done. A read-only diagnosis of two days explained every line.

## Findings (discovery)

| # | Finding |
|---|---|
| 1 | The score is computed as specified (003 FR-020): actual minutes of done work that counts for a goal, over actual minutes of all work. The low score came from the data and from two bugs below. |
| 2 | Most done tasks that counted for nothing had **no activity**. Nearly all were copied from earlier days whose task had none, so the gap repeats every day. Their titles start with a client's name ("Client A: …", "Client B: …"). |
| 3 | A task used an old activity ("Workout") that no goal tracks, while the goals track its twin ("Gym"). |
| 4 | **Bug**: what a day's task counts for leaves out goals that are no longer active. Closing a week sets its goals to done, carried, or dropped, so a task that counted only for a goal of that week (a template goal with no goal above) stops counting in the day's alignment and "Counts for", although it was done. Progress is not affected (it ignores status). |
| 5 | **Bug**: carrying a rhythm's week goal at the week's close makes a copy in the next week, and the rhythm makes its own goal there too: two "Reading 6×" in one week. |
| 6 | "0m of 0m" lines are **skipped** tasks, which weigh nothing; the text reads as if done work counted for nothing. "0m of 1h" means 1h done, none toward goals. |
| 7 | Support time (coffee, meals, commute) weighs in alignment like any work, so a day with breaks can never reach 100% even when every useful minute counts. 003 already marks entries useful or support. |
| 8 | The owner works for two clients: client A (international) is the main job; client B is a second service contract under two names. Each needs its own activity. |

## Decisions

★ marks the recommendation. G1–G4 and G7 were agreed on 2026-11-10; G5 and
G6 on 2026-11-12.

| ID | Question | Options |
|---|---|---|
| G1 | Goals that are no longer active | ★ **A** A task counts for every goal whose period holds the task's day, whatever its status now (done, carried, dropped), in alignment and in "Counts for". Pickers still offer active goals only. |
| G2 | Rhythm goals at a week's close | ★ **A** A rhythm's week goal is never carried: the close lists it as not met and the next week already has its own. Existing duplicates are merged by the fix script (the rhythm's goal stays; links and tasks of the copy move to it). |
| G3 | Tasks with no activity | ★ **A** A script with a dry run gives activities by title rules kept in a private file (prefix → activity), to past tasks and to the tasks repeating items make; and merges a twin activity into the one goals track (its tasks, templates, and goal links move; the twin is archived). Run like the seed, by the owner. |
| G4 | Keeping it from coming back | ★ **A** (1) Creating a task with no activity suggests the activity most used by past tasks with the same title prefix (text before ":"), one tap to accept. (2) The day's close says how many done tasks have no activity, each with an activity picker in place. |
| G5 | Support time in alignment | **Agreed: A** Alignment weighs only useful time: support entries (and support segments) leave both sides. ~~B Keep weighing all work.~~ |
| G6 | Client B's hours | **Resolved without code**: the owner creates client B's activity (Catalog) and its weekly duration template (Templates) in the interface. The title rules then point client B's tasks at that activity. |
| G7 | The "Why?" lines | ★ **A** "Skipped" for skipped tasks; "1h done · 0m toward goals" for done ones; support entries say "support, not weighed" (with G5 A). |

Agreed with the owner on 2026-11-10: client A's tasks use the main-job
activity; coffee and short breaks are support time and count for no goal; the
therapy session and two side projects stay with no goal for now.

## User Stories

### US1 — Done work keeps counting after its week closes (P1)

**Acceptance**:
1. A task that counted for a template week goal still counts for it, in the
   day's alignment and "Counts for", after the week is closed (G1).
2. The same holds for done, carried, and dropped goals.
3. Pickers offer only active goals.

### US2 — One goal per rhythm and week (P1)

**Acceptance**:
1. Closing a week does not offer to carry a rhythm's goal; the next week has
   exactly one goal for that rhythm (G2).
2. The fix script's dry run lists every pair it merges; after the run each
   week has one goal per rhythm, and their tasks and links are on it.
3. A second run changes nothing.

### US3 — Every task has an activity (P1)

**Acceptance**:
1. The dry run lists each task that would get an activity and each twin
   activity merge; the real run writes them; a second run changes nothing (G3).
2. A rule never overwrites an activity a task already has.
3. A new task titled "Client A: …" suggests the activity of past "Client A: …"
   tasks; accepting it takes one tap (G4).
4. The day's close lists done tasks with no activity and lets each get one in
   place (G4).

### US4 — A score that explains itself (P2)

**Acceptance**:
1. With G5 A, support entries and segments weigh in neither side of alignment;
   a day whose useful work all counts shows 100%.
2. The "Why?" reads "Skipped", "1h done · 0m toward goals", and "support, not
   weighed" (G7).

## Requirements

- **FR-001** What a task counts for (alignment, "Counts for", the day's
  objectives) includes goals of any status whose period holds the task's day
  (G1).
- **FR-002** A rhythm's week goal is not carried at a week's close (G2).
- **FR-003** A one-off script (dry run, idempotent, run by the owner) merges
  rhythm duplicates, gives activities to tasks by private title rules, and
  merges a twin activity into another (G2, G3). Rules and names stay out of the
  repositories.
- **FR-004** Activity suggestion by title prefix on task creation, and the
  close's list of done tasks with no activity (G4).
- **FR-005** Alignment weighs useful time only, if G5 A.
- **FR-006** The "Why?" texts of G7, in English and pt-BR.
- **FR-007** Every screen keeps passing axe in light and dark.

## Success Criteria

- **SC-001** A day whose useful work all reaches a goal shows 100% alignment.
- **SC-002** Closing a week never lowers the alignment of its days.
- **SC-003** Every acceptance scenario has an automated test, run locally
  before each deploy.

## Out of Scope

Recomputing the snapshot of days already closed (editing a day reopens it, as
today); goals for the therapy session and side projects; reports across days.
