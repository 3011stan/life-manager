# Discovery: Life Manager Domain

**Status**: Draft for review (2026-10-03). Input to `003-cycle-objective-model`
and to the storage decision in `002-cloud-foundation`. This is **not** a data
model: entities and relationships below are conceptual and every open question
is resolved in Specify/Clarify, not here.

## Sources

| Tag | Source |
|---|---|
| [design] | Obsidian Life Manager docs: `briefing.md`, `00-system/data-model.md`, `planning-flow.md`, `runbooks.md`, `agent-context.md`, recurring and weekly-goal defaults |
| [observed] | Survey of the Obsidian records actually written: 79 days, 999 tasks, 356 time blocks, 12 weekly, 4 monthly, 2 annual plans (2026-06-18 → 2026-09-05) |
| [POC] | `specs/001-daily-timeline-prototype` and `src/types/life-manager.ts` |
| [v2] | Direction discussed for the hosted version (ai-memory `decisions/cloud-v2-transition.md`), never validated |
| [decided] | Product decisions already taken by the user |

## Key Findings From Real Use

1. **Vocabularies drifted when nothing enforced them.** [observed]
   - The pillar taxonomy was replaced mid-use (personal/professional/social →
     work/body/mind/spirit/…), leaving 17 pillar values and 58 area values.
   - 43 of 93 activity ids used on tasks are missing from the activity catalog;
     several are near-duplicates (four spellings of one certification activity).
   - Annual goal ids on tasks often do not match the annual plan's ids.
   - Goal links appear in three formats, 25–30% of them malformed.

   The product must own its reference data (activities, taxonomy, objectives)
   and let the user rename, merge, and retire entries instead of retyping them.

2. **Goals lived in prose, not in fields.** [observed] The designed structured
   goal fields (target, current, expected, gap, process metrics) exist only in a
   legacy file. Real plans used Markdown tables with free-text targets ("4
   sessions", "3x60 min/week", "8 classes", a money amount) and links between
   headings. Progress was written by hand in reviews.

3. **Weekly goals grew tiers and absorbed recurring work.** [observed] From week
   28, weekly goals were grouped as *Essential*, *Secondary*, *Parked unless
   capacity appears*, and *Conditional*; later regrouped by theme. Recurring
   daily work (gym, reading, daily close) was linked to weekly goal sections
   such as "Operating Baseline". The designed "Big 4" stopped being used as a
   separate structure.

4. **`partial` was almost never used.** [observed] 1 of 999 tasks. Partial
   progress was expressed by `actual_minutes` below planned on a completed or
   skipped task.

5. **Carry-over had no structure but happened constantly.** [observed] No field;
   "carry" appears in all 12 weekly plans, 107 task notes, and 66 of 79 days.
   Carried work became a **new task** on a later date. Weekly plans kept a
   "+1" list of carried items and a "Carried" goal status; monthly reviews had
   "Carries" sections.

6. **Logging after the fact is a real mode.** [observed] 42 tasks used an
   off-list `retrospective` schedule type: work recorded after it happened.
   The POC's freeform capture ("fiz standup") serves the same need.

7. **Subjective tracking decayed.** [observed] Energy, satisfaction, and
   critical-behavior fields were filled on 100% of June days, ~85% of July, and
   9 of 31 August days. Computed scores stayed consistent. The briefing's goal
   that "the system must learn" depends on exactly these fields.

8. **Overlap accounting was rare.** [observed] 16 tasks (1.6%) used overlap
   groups and counted-minute splits.

9. **Calendar conventions were not ISO.** [observed] Weeks ran Sunday to
   Saturday; a task's month followed its week, not its date.

10. **The last week was never closed.** [observed] All 81 still-`planned` tasks
    and all unscored days fall in the final week, and the last two monthly
    plans were never marked reviewed. Closing rituals stall when they are
    manual.

## Glossary

Terms are proposals; the spec fixes the final vocabulary.

| Term | Meaning | Source |
|---|---|---|
| **Workspace** | The tenant that owns all of a user's data. One personal workspace per user for now. | [decided] |
| **Cycle** | A bounded period that is planned, executed, and reviewed: day, week, month, year; longer horizons are proposed. | [design], [v2] |
| **Horizon** | The kind of cycle (daily, weekly, monthly, annual, multi-year). | [v2] |
| **Objective** | Something the user wants to achieve within a cycle. Called "goal" in Obsidian. May be an *outcome* (reach a level, weight, amount) or a *process* commitment (sessions or minutes of an activity). | [design] |
| **Target** | The measurable part of an objective: a count, a duration, a value with a unit, or done/not done. | [observed] |
| **Contribution** | The link saying a lower-level objective or a task advances a higher-level objective. | [design], [v2] |
| **Activity** | A stable "what" in the user's life (gym, reading, a degree, a side project) with a pillar, area, type, and default deep-work flag. Tasks are occurrences of activities. | [design] |
| **Pillar / Area** | The user's life taxonomy (two levels). User-defined and editable; it changed during real use. | [design], [observed] |
| **Activity type** | habit, project, experience, maintenance. | [design] |
| **Task** | One planned or logged session of an activity on a specific day, with planned and actual minutes and a status. Called "timeline item" in the POC. | [design], [POC] |
| **Status** | planned, completed, partial, skipped, cancelled. Cancelled = did not happen for reasons outside the user's control; excluded from scores. | [design], [POC] |
| **Time block** | Real time that structures the day but does not count for execution or alignment by default: meals, commute, transitions, buffers, recovery. | [design], [observed] |
| **Bundle** | A task with ordered segments, each useful or non-useful, so the real calendar cost of an activity is visible (gym = prepare + train + return). | [POC] |
| **Time value** | useful vs non-useful (support) time. | [POC] |
| **Deep work** | A flag for high-focus strategic work; default comes from the activity. | [design] |
| **Recurrence rule** | A template that generates tasks (daily, weekdays, N per week, monthly, every N days), with default duration, priority, and whether it is required. | [design] |
| **Objective template** | A recurring weekly objective candidate (e.g. "4 gym sessions") offered when a week is planned. | [design] |
| **Source** | Why a task exists: recurrence, an objective, ad hoc, carry, retrospective log. | [design], [observed] |
| **Capture** | Unstructured text the user writes; the system may suggest tasks from it, which the user must confirm. | [POC] |
| **Carry** | A deliberate decision to move unfinished work from one cycle into a later one. | [POC], [observed], [decided] |
| **Close (review)** | The ritual that ends a cycle: resolve statuses and actual minutes, compute scores, decide carries, write notes, and roll results up to the parent cycle. | [design], [POC] |
| **Execution score** | "Did I do what I planned?" Capped credit `Σ min(actual, planned) / Σ planned` over non-cancelled work. | [design], [POC] |
| **Alignment score** | "Did I invest time in what matters?" Same formula over the subset of work that counts for alignment. | [design], [POC] |
| **Capacity** | The time actually available in a day after fixed commitments; plans must not exceed it. | [design] |
| **Critical behavior** | A tracked daily yes/no habit with outsized impact (e.g. no phone after waking). | [design] |
| **Check-in** | Subjective daily ratings: energy (physical, mental, emotional) and satisfaction. | [design] |

## Conceptual Relationships

```
Workspace
 ├─ Taxonomy (Pillar → Area)
 ├─ Activity ──────────────── classified by Pillar/Area
 ├─ Recurrence rule ───────── for an Activity; generates Tasks in Day cycles
 ├─ Objective template ────── proposes Objectives when a Week is planned
 ├─ Cycle (year ⊃ month ⊃ week ⊃ day; longer horizons proposed)
 │    ├─ Objective ────────── has a Target; contributes to Objective(s) of a parent cycle
 │    ├─ Review ───────────── scores, notes, check-in, critical behaviors, carries
 │    └─ (day only)
 │         ├─ Task ────────── occurrence of an Activity; may contribute to Objective(s);
 │         │                  may have Segments (bundle); may come from a Carry
 │         ├─ Time block ──── structural time, normally not scored
 │         └─ Capture ─────── text → suggested Tasks (confirmed by the user)
 └─ Carry ─────────────────── from unfinished Task/Objective → new Task/Objective in a later cycle
```

## Rules

### Settled (designed, used, and kept)

- Execution and alignment are separate and computed with capped credit;
  extra work never compensates for skipped planned work.
- Cancelled work keeps its planned slot for history, has zero actual minutes,
  and is excluded from score denominators.
- Skipped work has zero actual minutes.
- Time is the primary unit: tasks carry planned and actual minutes.
- Suggestions (from captures, recurrences, or AI) never become commitments
  without user confirmation (constitution II).
- Planning flows top-down (year → month → week → day); closing rolls effects
  up (day → week → month → year), including progress, risks, and carries.
- Before planning today, the previous day must be closed ("Rule Zero").
- Carry candidates are editable, and a confirmed carry moves into the next
  day. [decided]

### Observed but not yet decided

- A week belongs to exactly one month (which one is open, see Q2).
- Recurring baseline work is linked to weekly objectives.

## Decisions (2026-10-03)

Answers from the user; they become requirements in the 003/004 specs.

- **Horizons (Q1):** 5-, 10-, and 20-year cycles are in scope. Contributions
  chain upward through every horizon: year → 5 years → 10 years → 20 years.
- **Week start (Q2):** weeks start on Sunday. The week start must be easy to
  change later, so it is a setting, not a hard-coded rule. Still open: which
  month owns a week that spans two months.
- **Target types (Q3):** all six are in scope:
  - *count* (completed contributing tasks);
  - *duration* (actual minutes of contributing tasks);
  - *value with unit* (from recorded measurements or amounts);
  - *level* on an ordered scale (latest recorded level);
  - *milestone* (done when the milestone task is completed);
  - *composite* (aggregated from child objectives; how long horizons get
    progress).
- **Progress (Q4):** objective progress is computed automatically. Value and
  level targets compute from measurements the user records with a quick input.
- **Contribution weights (Q5):** a task may contribute to several objectives,
  all with equal credit for now. Contributions carry a weight that defaults
  to 1 so weighting can be introduced later.
- **Contribution path (Q6):** a task links to the lowest-level objective
  (normally weekly) and credit flows up the chain automatically. Linking
  directly to a higher-level objective is allowed only when no lower-level
  objective exists.
- **Priority tiers (Q7):** objectives at every horizon (week, month, year, and
  longer) have priority tiers, not only weekly ones.
- **Objective carry (Q8):** unfinished objectives can be carried into the next
  cycle.
- **Review cadence (Q9):**
  - Closing a cycle is required before planning the next cycle of the same
    horizon.
  - Scores, progress, and rollup to the parent cycle are automatic; the user
    confirms carries and writes notes.
  - Long-horizon objectives (5/10/20 years) get a checkpoint in every annual
    close: still relevant, on track, adjust.
- **Taxonomy (Q10):**
  - User-defined categories, seeded with defaults.
  - Two levels (pillar → area).
  - An activity has one primary area plus optional tags.
  - Renames apply everywhere; merges move history into the surviving entry.
- **Alignment (Q11):** alignment is derived from contributions to active
  objectives, not from a manual flag.
- **`partial` status (Q12):** removed. Statuses are planned, completed,
  skipped, cancelled. Partial work is completed with actual minutes below
  planned. Carry candidates are skipped tasks and completed tasks with actual
  below planned.
- **Time blocks and bundles (Q13):** one concept, a time entry with
  independent attributes: counts for execution, counts for alignment, and time
  value (useful/non-useful).
- **Overlap (Q14):** not supported in 004 (one entry per time slot). Later
  option: each entry gets full objective credit while day totals count clock
  time once.
- **Retrospective logging (Q15):** logged work is marked unplanned. It does
  not count for execution; it counts for alignment and objective progress.
- **Carry (Q16):** carrying adds a regular task to the next day; once there it
  is a normal part of that day. The new task keeps a hidden reference to its
  origin for history.
- **Check-in (Q17):** kept, with very low-friction input (e.g. one-tap scales).
- **Recurrence (Q18):**
  - Patterns: daily, specific weekdays, N times per week, monthly, every N
    days.
  - For "N per week" the app suggests days and the user confirms.
  - Generated tasks are confirmed with a single "accept today's routine" step.
  - Rules have a default and a minimum duration.
- **Capacity (Q19):** daily capacity is stored, editable by the user, and may
  later be calibrated from the user's history.
- **Referential integrity (Q20):** confirmed as a requirement. Users pick
  activities, categories, and objectives from lists; renames propagate;
  deleting something in use requires deciding what happens to its references.
- **Import scope (Q21):** not relevant now.

## Open Questions

Grouped by the feature expected to resolve them. Questions answered above are
kept for traceability.

### For 003 (cycles and objectives)

1. **Horizons.** Only year/month/week/day were used. Are 5-, 10-, and 20-year
   horizons in scope for 003, later, or never?
2. **Week definition.** Sunday or Monday start? User-configurable? When a week
   spans two months, which month does it belong to (by start date, by majority,
   by its Thursday as in ISO)?
3. **Objective kinds and targets.** Which target types are needed: count,
   minutes, value with unit (level, weight, money), done/not done? Are outcome
   and process objectives different kinds or the same entity with a flag?
4. **Progress.** Should process objectives compute progress automatically from
   tasks (minutes or sessions of an activity in the cycle)? How are outcome
   objectives updated (manual check-in)? Is "expected by now" and "gap" needed
   in 003?
5. **Contributions.** May one task contribute to several objectives? May an
   objective contribute to more than one parent? Do contributions carry
   weights, or is equal credit enough? (Real use: 5 of 999 tasks linked two
   goals.)
6. **Contribution path.** Must a task link to the lowest-level (weekly)
   objective and inherit the chain upward, or may it link directly to a monthly
   or annual objective?
7. **Priority tiers.** Keep the observed tiers (essential, secondary, parked,
   conditional) for weekly objectives? Keep the designed limit of exactly four
   strategic priorities ("Big 4"), or drop it as real use did?
8. **Objective carry.** Can an unfinished objective (not only a task) be
   carried into the next week or month?
9. **Review cadence.** What does closing a week, month, or year require?
   Which parts are automatic (scores, rollups) and which need the user?
10. **Taxonomy.** Is pillar → area a fixed two-level tree, user-defined, and
    how do rename and merge work without rewriting history?

### For the cloud daily timeline (004)

11. **Alignment basis.** Obsidian counted alignment only for objective-sourced
    tasks; the POC uses a per-item flag. Should alignment be "time on work that
    contributes to an active objective of the current cycle", derived instead
    of flagged?
12. **`partial` status.** Keep it, or express partial work only through actual
    minutes as real use did?
13. **Time blocks vs bundles.** One concept (a time entry with independent
    flags: counts for execution, counts for alignment, time value) or separate
    concepts as today?
14. **Overlap.** Support overlapping tasks and counted-minute splits in the
    first cloud version, or defer (1.6% of real use)?
15. **Retrospective logging.** Is "log what I already did" a first-class flow
    distinct from planning, and does it count for execution?
16. **Carry details.** Carry into the next day only, or to a chosen date? Does
    the carried task keep a link to its origin? What happens to a carry
    nobody decides on?
17. **Check-in and critical behaviors.** Keep them, make them optional and
    one-tap, or defer? (They decayed in real use, but they feed future insights.)
18. **Recurrence rules.** Which frequencies are needed (daily, weekdays, N per
    week, monthly, every N days)? Are durations reducible (e.g. 30 → 15 minutes
    on overloaded days) part of the rule?
19. **Capacity.** Is daily capacity a modeled value (day budget, fixed
    commitments) or only a displayed sum?

### For storage and import (002, 005)

20. **Reference integrity** (finding 1) is a requirement for any storage
    option, and imports must map drifted vocabularies (pillars, activity ids,
    goal ids) to canonical entries.
21. **Import scope.** Import tasks, time blocks, and daily scores only, or also
    reconstruct objectives from plan tables and heading links?

## Out of Scope For This Document

Database tables, field types, API shape, and technology choices. Those come
from the 003 plan (`data-model.md`) and the 002 research.
