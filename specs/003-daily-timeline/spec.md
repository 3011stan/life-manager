# Feature Specification: Daily Timeline, Activities, And Objectives

**Feature Branch**: `003-daily-timeline`

**Created**: 2026-10-18

**Status**: Approved (2026-10-18)

**Input**: User description: "Start the 003 spec, focused on the day's timeline."
Scope widened by the user on 2026-10-18 (clarifications below): objectives at
every horizon, a categorized activity catalog, and every story in the beta.
Context: the 002 hosted foundation is live on staging. The 001 prototype
findings F1–F9 and the domain decisions of 2026-10-03
(`docs/discovery/life-manager-domain.md`, Q1–Q21) are the input. Target: a
personal beta by 2026-10-30.

This feature replaces the "cycles and objectives" (003) and "cloud daily
timeline" (004) features planned in the discovery document.

## Clarifications

### Session 2026-10-18

- Q: How does alignment work before objectives exist? → A: Objectives are in
  this feature, at every horizon (week, month, year, 5, 10, and 20 years).
- Q: Activity catalog? → A: A user-owned catalog with two-level categories
  (pillar → area) and tags, in this feature.
- Q: Beta cut? → A: Every story is in the 2026-10-30 beta.
- Q: Target types? → A: All six (count, duration, value with unit, level,
  milestone, composite).
- Q: How does an entry contribute to an objective? → A: An objective names
  activities; every completed entry of those activities contributes
  automatically. An entry can also be linked to an objective by hand.
- Q: Alignment formula? → A: Actual minutes on work that contributes to an
  active objective ÷ actual minutes of all work of the day (planned and
  unplanned; time blocks excluded).
- Q: Priority tiers? → A: Essential, secondary, parked, at every horizon.
- Q: Cycle close beyond the day? → A: Yes, simple: progress, notes, carry or
  drop each unfinished objective; closing is required before planning the next
  cycle of the same horizon.
- Q: Weekly objective templates? → A: In the beta.
- Q: Initial categories and activities? → A: Generic defaults for every new
  workspace; the owner's own list is extracted from the Obsidian vault, approved
  by the owner, and loaded into the owner's workspace only.
- Q: Must every entry have an activity? → A: No, but an entry without an
  activity must be clearly marked as such.
- Q: Activity fields? → A: Name, primary area, tags, default duration, default
  deep work.
- Q: Rename, archive, merge? → A: Rename and archive in the beta; merge later.
- Q: Deleting something in use? → A: Not allowed; archive instead. History keeps
  the name.
- Q: Deep work? → A: Default from the activity, adjustable per entry, total shown
  in the day summary.
- Q: Rule Zero? → A: Planning today is blocked until the most recent earlier day
  with entries is closed; viewing, logging, and capture stay available.
- Q: Check-in? → A: Optional one-tap energy and satisfaction at day close.
  Critical behaviors later.
- Q: Recurrence? → A: Later. The beta has "copy entries from another day".
- Q: Interface language? → A: Portuguese and English, with a selector.
- Q: Capture language? → A: Portuguese and English.
- Q: Reminders? → A: Out of scope.
- Q: Real data before backups exist? → A: Accepted by the owner.
- Q: Design direction? → A: Essentialist; see "Essentialist interface"
  requirements. Accepted: objective creation shows count and duration first,
  other target types behind "more types"; tags are not shown when adding an
  entry.
- Q: Load the owner's 2026 annual objectives? → A: Yes, with the owner's seed.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Plan And Run Today On Any Device (Priority: P1)

The user opens Life Manager on their phone in the morning and sees today, in the
workspace time zone, as a timeline. They add the day's entries by typing a few
letters of an activity ("aca" → Academia) and accepting its default duration,
put them in order, and through the day mark each one completed, skipped, or
cancelled. At night the desktop shows exactly the same day.

**Why this priority**: the daily timeline is the main product surface; with it
alone the user can stop using Obsidian for daily execution.

**Independent Test**: on a phone-sized screen, add five entries (four from
activities, one free title), reorder them, complete one with actual minutes
below planned, skip one, cancel one; open the same day on a second device and
confirm everything is identical and the free-title entry is marked as having no
activity.

**Acceptance Scenarios**:

1. **Given** no entries today, **When** the user opens the app, **Then** today
   is shown empty with one way to add an entry; no sample data is created.
2. **Given** the user types in the title field, **When** an activity matches,
   **Then** it is suggested; choosing it fills duration and deep work from the
   activity.
3. **Given** the user keeps a title that matches no activity, **When** the entry
   is saved, **Then** it shows a visible "no activity" mark, and one tap lets
   the user link it to an activity or create one from that title.
4. **Given** entries on today, **When** the user moves one, **Then** the new
   order is kept on every device, independently of start times.
5. **Given** a planned entry, **When** the user completes it, **Then** actual
   minutes default to planned and can be changed; skipped or cancelled entries
   have zero actual minutes and keep planned minutes.
6. **Given** today's entries, **When** the user looks at the top of the day,
   **Then** they see capacity, planned minutes, and what is left.
7. **Given** any day, **When** the user moves to the previous or next day or
   back to today, **Then** that day is shown.
8. **Given** a day in the past or future, **When** the user wants entries from
   another day, **Then** they can copy chosen entries from a picked day as new
   planned entries.

---

### User Story 2 - See The Real Cost Of An Activity (Priority: P1)

"Gym" is one entry made of ordered segments: get ready (20 min, support),
train (60 min, useful), shower and return (30 min, support). Collapsed, it shows
110 minutes of the day, 60 useful. Lunch or commute are time blocks: they take
capacity but are not scored.

**Why this priority**: showing the hidden cost of activities is why the Life
Manager models time instead of tasks (constitution III).

**Independent Test**: create the three-segment gym entry, add and remove a
segment, collapse and expand it, and check totals and the useful/support split
in both states and on a second device.

**Acceptance Scenarios**:

1. **Given** an entry with segments, **When** collapsed, **Then** it shows total,
   useful, and support minutes.
2. **Given** an entry with segments, **When** segments are added, removed,
   edited, or reordered, **Then** the totals follow (001 F5).
3. **Given** a time block, **When** the day is scored, **Then** it takes capacity
   and affects neither execution nor alignment.
4. **Given** an activity with default segments, **When** an entry is created
   from it, **Then** the segments are copied into the entry.

---

### User Story 3 - Own The Activity Catalog (Priority: P1)

The user's activities (Academia, Leitura, Projeto X) live in a catalog grouped
by pillar and area, with tags. A new workspace starts with a small generic set;
the user renames, adds, and archives entries instead of retyping them.

**Why this priority**: in Obsidian, 43 of 93 activity ids used on tasks were
missing from the catalog and the taxonomy drifted. Objectives and alignment
depend on activities being stable.

**Independent Test**: rename an activity used on past entries and confirm the
past entries show the new name; archive it and confirm it is no longer
suggested but past entries and objectives still show it.

**Acceptance Scenarios**:

1. **Given** a new workspace, **When** the user opens the catalog, **Then** a
   generic set of pillars, areas, and activities exists and can be edited.
2. **Given** an activity, **When** it is renamed, **Then** every entry, objective,
   and export shows the new name.
3. **Given** an activity, area, or pillar in use, **When** the user tries to
   delete it, **Then** they are offered to archive it instead; archived items
   are not suggested for new entries but keep their history.
4. **Given** an unused activity, **When** the user deletes it after
   confirmation, **Then** it is gone.

---

### User Story 4 - Log What Already Happened (Priority: P2)

At the end of a messy day the user records "worked on project X for about 2
hours". It is stored as unplanned work.

**Why this priority**: logging after the fact was a real mode (42 records).

**Independent Test**: log a 120-minute unplanned entry of an activity that
contributes to an objective; confirm execution is unchanged and alignment and
the objective's progress include it.

**Acceptance Scenarios**:

1. **Given** a day, **When** the user logs an entry as already done, **Then** it
   is completed and unplanned with the given actual minutes.
2. **Given** an unplanned entry, **When** scores are computed, **Then** it does
   not count for execution and does count for alignment and objective progress
   (discovery Q15).

---

### User Story 5 - Close The Day (Priority: P2)

At night the user closes the day: resolves what is still planned, sees
execution and alignment with an explanation, decides carries, and optionally
taps energy and satisfaction.

**Why this priority**: closing turns a day into feedback; carry happened on 66
of 79 recorded days.

**Independent Test**: on a day with completed, short, skipped, cancelled,
unplanned, and time-block entries, close the day, check both scores against a
hand calculation, edit and confirm one carry, dismiss one, and confirm the next
day contains exactly the confirmed carry.

**Acceptance Scenarios**:

1. **Given** entries still planned, **When** the close starts, **Then** they are
   listed first and must be resolved.
2. **Given** resolved entries, **When** scores are shown, **Then** execution and
   alignment follow FR-019 and FR-020 and each can be expanded into the entries
   behind it.
3. **Given** the close, **When** carry candidates are listed, **Then** they are
   the skipped entries and the completed entries with actual below planned;
   each can be edited, confirmed, or dismissed (001 F4).
4. **Given** a confirmed carry, **When** the next day opens, **Then** it is a
   normal planned entry at the end of the order, with a link to its origin seen
   only in history (001 F6, Q16).
5. **Given** a closed day, **When** an entry on it changes, **Then** the day
   reopens and shows no scores until closed again (001 F7).
6. **Given** a closed day, **When** opened later, **Then** scores, notes, check-in,
   and carry decisions are shown (001 F9).
7. **Given** an earlier day with entries that was never closed, **When** the
   user starts planning today, **Then** the app asks them to close that day
   first; viewing, logging, and capture stay available.

---

### User Story 6 - Set Objectives From Week To Twenty Years (Priority: P2)

The user writes a 10-year objective ("become fluent in English"), a yearly one
under it ("reach C1", level), a monthly one ("20 h of English", duration), and a
weekly one ("4 English sessions", count, activity English). Each completed
English entry advances the week, and the credit flows up to the month, year,
and decade.

**Why this priority**: alignment and the cycle model (constitution I) depend
on objectives.

**Independent Test**: create the four-level chain above, complete three English
entries in the week, record a level, and confirm progress at every level.

**Acceptance Scenarios**:

1. **Given** a cycle of any horizon, **When** the user adds an objective, **Then**
   they choose a target type, a target, a tier (essential, secondary, parked),
   optional contributing activities, and an optional parent objective in a
   higher horizon.
2. **Given** a count objective, **Then** progress is the number of completed
   contributing entries in the cycle; for duration, their actual minutes.
3. **Given** a value or level objective, **When** the user records a measurement
   with a quick input, **Then** progress follows the latest measurement (or their
   sum, if the objective is cumulative).
4. **Given** a milestone objective, **Then** it is done when its milestone entry
   is completed or when the user marks it done.
5. **Given** a composite objective, **Then** its progress is the average of its
   children's progress, each capped at 100%, with equal weight.
6. **Given** an entry linked to a weekly objective, **Then** it also counts for
   that objective's ancestors of count or duration type (discovery Q6).
7. **Given** an objective, **Then** its progress is shown next to how much of
   the cycle has passed.

---

### User Story 7 - Plan And Close The Week, Month, And Year (Priority: P2)

On Sunday the user closes last week (progress, notes, carry or drop unfinished
objectives) and plans the new one; the app proposes the weekly templates
("4× gym", "3× reading") to accept or skip. Months and years work the same way;
the annual close also checks every 5-, 10-, and 20-year objective.

**Why this priority**: planning flows top-down and closing rolls up
(discovery rules); without it objectives go stale, as the last Obsidian week
did.

**Independent Test**: close a week with one finished and one unfinished
objective, carry the unfinished one, plan the next week from two templates
(accept one, skip one), and confirm the new week has exactly the carry and the
accepted template.

**Acceptance Scenarios**:

1. **Given** a cycle that ended and was not closed, **When** the user plans the
   next cycle of the same horizon, **Then** they are asked to close it first
   (Q9).
2. **Given** a cycle close, **Then** each objective shows its final progress and
   the user carries or drops each unfinished one; a carried objective becomes a
   new objective in the next cycle with a link to its origin (Q8).
3. **Given** weekly templates, **When** a week is planned, **Then** they are
   proposed and become objectives only when accepted (constitution II).
4. **Given** an annual close, **Then** every active 5-, 10-, and 20-year
   objective is listed for a checkpoint: still relevant, on track, adjust.

---

### User Story 8 - Capture A Low-Energy Day As Text (Priority: P3)

On a tired evening the user writes loose lines in Portuguese or English and
asks for suggestions; nothing is added until each suggestion is accepted,
edited, or dismissed.

**Why this priority**: keeps a bad day from becoming a gap; the timeline works
without it.

**Independent Test**: enter "fiz standup", "academia 19h", "trabalhei no projeto
X umas 2h", "nao fiz leitura", "gym at 7pm", request suggestions, and confirm
"19h"/"7pm" are start times without duration, "2h" is a duration without start,
known activities are recognized, and only accepted suggestions are added.

**Acceptance Scenarios**:

1. **Given** capture text, **When** suggestions are requested, **Then** the
   timeline does not change until the user accepts.
2. **Given** a time mark, **Then** it is read as a start time or a duration,
   never both (001 F1).
3. **Given** a line naming a known activity, **Then** the suggestion is linked
   to it.

### Edge Cases

- A day without entries is shown empty; nothing is stored until the user adds
  something (001 F8).
- Start times out of order with the manual order: the manual order wins and the
  conflict is shown, not fixed silently.
- Planned minutes above capacity: the overrun is shown; adding is still allowed.
- Actual above planned: shown in full, capped for execution.
- Completed with zero actual minutes: allowed; it becomes a carry candidate.
- A cancelled entry with segments: all its minutes leave the scores; planned
  minutes stay visible for history.
- A day with no planned work: execution shows "no planned work"; a day with no
  work at all: alignment shows "no work recorded".
- Same entry edited on two devices: each field keeps the latest change; changes
  to different fields are all kept.
- Offline: the last loaded data is read-only with the time it was loaded
  (002); edits wait for the connection.
- Device and workspace time zones differ: "today" follows the workspace, and the
  app says which time zone is used.
- A week spans two months: it belongs to the month holding most of its days.
- An objective's parent is archived or dropped: the child keeps its own
  progress; credit stops flowing to that parent.
- An activity is archived while an objective names it: existing and new
  entries of it still count; it is just not suggested.
- A carry is confirmed onto a day that is already closed: that day reopens.
- An entry contributes to two objectives: it counts fully for each (Q5).
- The interface language changes: entered data (titles, notes) is not
  translated.

## Requirements *(mandatory)*

### Functional Requirements

**Essentialist interface**

- **FR-001**: The day view MUST show, for each collapsed entry, only its title,
  time (start or minutes), and status control; every other attribute MUST live
  in the entry's detail view.
- **FR-002**: Adding an entry MUST need only a title; every other attribute MUST
  default from the chosen activity or the workspace settings.
- **FR-003**: Objectives above the week MUST NOT appear on the day view; the day
  view MAY show a single compact line with this week's essential objectives.
- **FR-004**: Each screen MUST have one primary action; scores MUST be numbers
  with an explanation on demand, never charts or dashboards in this feature.
- **FR-004a**: Creating an objective MUST offer count and duration first; the
  other target types MUST sit behind one "more types" control. Tags MUST NOT
  appear when adding an entry.
- **FR-005**: Color MUST be used only to convey state (status, overrun, no
  activity), in line with the constitution's visual rules.

**Day and entries**

- **FR-006**: The system MUST show today in the workspace time zone, say which
  zone is used when it differs from the device, and allow moving to previous,
  next, and today.
- **FR-007**: Opening a day without entries MUST NOT store anything or create
  sample entries.
- **FR-008**: An entry MUST have a title, planned minutes, status (planned,
  completed, skipped, cancelled; no partial, Q12), order, and MAY have a start
  time, notes, an activity, segments, deep work, and objective links.
- **FR-009**: Completing MUST record actual minutes defaulting to planned;
  skipped and cancelled MUST have zero actual minutes and keep planned minutes.
- **FR-010**: Users MUST be able to edit any field, set the status back to
  planned, and delete an entry after confirmation.
- **FR-011**: Reordering MUST work by drag on desktop and by a touch control on
  phones; the manual order MUST be kept independently of start times.
- **FR-012**: An entry MUST be either work or a time block; time blocks MUST
  count for neither execution nor alignment. Each entry and segment has a time
  value, useful or support (Q13).
- **FR-013**: An entry MAY have any number of ordered segments (title, minutes,
  time value); its planned minutes MUST then equal their sum; collapsed, it
  MUST show total, useful, and support minutes.
- **FR-014**: An entry without an activity MUST carry a visible "no activity"
  mark and offer linking to an existing activity or creating one from its title.
- **FR-015**: Users MUST be able to log work as already done; it is stored as
  completed and unplanned.
- **FR-016**: Users MUST be able to copy chosen entries from another day into a
  day as new planned entries.
- **FR-017**: Each day MUST have a capacity defaulting to the workspace setting,
  editable per day; the day view MUST show capacity, planned, remaining, and
  overrun before the user adds entries (Q19, constitution III).
- **FR-018**: Deep work MUST default from the activity, be adjustable per entry,
  and its actual minutes MUST be totaled in the day summary.

**Scores and day close**

- **FR-019**: Execution MUST be Σ min(actual, planned) ÷ Σ planned over planned
  (not unplanned), non-cancelled work entries; "no planned work" when the
  denominator is zero.
- **FR-020**: Alignment MUST be actual minutes of work entries that contribute
  to at least one active objective ÷ actual minutes of all work entries
  (planned and unplanned); "no work recorded" when the denominator is zero.
- **FR-021**: Both scores MUST be explainable on demand by listing the entries
  and minutes behind them (constitution V).
- **FR-022**: Closing a day MUST first require resolving every entry still
  planned, then show scores, carry candidates (skipped, and completed with
  actual below planned), notes, and an optional one-tap check-in of physical,
  mental, and emotional energy and satisfaction.
- **FR-023**: Carry candidates MUST be editable, confirmable, or dismissable; a
  confirmed carry MUST add a planned entry at the end of the next day, linked
  to its origin only for history (Q16).
- **FR-024**: Changing an entry of a closed day (including receiving a carry)
  MUST reopen it; a reopened day MUST NOT show scores until closed again.
- **FR-025**: Before planned entries are added to today, the system MUST
  require closing the most recent earlier day that has entries and is not
  closed; viewing, logging, and capture MUST stay available (Rule Zero).

**Activities and categories**

- **FR-026**: Each workspace MUST own a two-level category tree (pillar →
  area), tags, and activities with name, primary area, tags, default duration,
  default deep work, and optional default segments.
- **FR-027**: New workspaces MUST start with a generic default set of pillars,
  areas, and activities that contains no personal data.
- **FR-028**: Renames MUST show everywhere the item is used, including past
  entries and exports.
- **FR-029**: Items in use MUST NOT be deletable; the user MUST be offered to
  archive them. Archived items are not suggested but keep their history.
  Unused items MAY be deleted after confirmation.
- **FR-030**: Activity, area, and objective choices MUST be made from lists, not
  retyped (Q20).

**Objectives and cycles**

- **FR-031**: Cycles MUST exist for week (start day from settings, default
  Sunday), month, year, and 5-, 10-, and 20-year horizons. Long horizons start
  at a year the user chooses (default: the current year) and follow each other.
  A week belongs to the month holding most of its days.
- **FR-032**: An objective MUST belong to one cycle and have a title, a tier
  (essential, secondary, parked), a target type, a target, optional
  contributing activities, and at most one parent objective in a higher horizon.
- **FR-033**: Target types and progress MUST be:
  - count: completed contributing entries in the cycle ÷ target;
  - duration: actual minutes of contributing entries ÷ target minutes;
  - value with unit: latest measurement (or the sum, if marked cumulative)
    against the target, from a start value;
  - level: latest recorded level on the objective's ordered scale against the
    target level;
  - milestone: done when its milestone entry is completed or the user marks it
    done;
  - composite: average of its children's progress, each capped at 100%.
- **FR-034**: Contributing entries are completed entries of the objective's
  activities in the cycle, plus entries linked to it by hand; an entry MAY
  contribute to several objectives, each fully; every contribution has a
  weight of 1 (Q5).
- **FR-035**: An entry contributing to an objective MUST also contribute to the
  objective's count and duration ancestors (Q6). Direct links to a higher
  horizon MUST be allowed only when the cycle below has no objective with that
  parent.
- **FR-036**: Users MUST be able to record a measurement or level with a quick
  input from the objective or the day view.
- **FR-037**: Each objective MUST show its progress next to the share of its
  cycle that has passed.
- **FR-038**: Closing a week, month, or year MUST show each objective's final
  progress, accept notes, and require carrying or dropping each unfinished
  objective; a carry creates a new objective in the next cycle linked to its
  origin (Q8).
- **FR-039**: Planning the next cycle of a horizon MUST require the previous
  ended cycle of that horizon to be closed (Q9).
- **FR-040**: The annual close MUST list every active 5-, 10-, and 20-year
  objective for a checkpoint (still relevant, on track, adjust).
- **FR-041**: Users MUST be able to keep weekly objective templates; planning a
  week MUST propose them, and they become objectives only when accepted.

**Capture**

- **FR-042**: Users MUST be able to write capture text for a day and request
  suggestions in Portuguese or English; suggestions MUST NOT change the
  timeline until accepted and MUST be editable before acceptance.
- **FR-043**: A time mark MUST be read as either a start time or a duration,
  never both (001 F1); a line naming a known activity MUST be linked to it.

**Language**

- **FR-044**: The interface MUST be available in Portuguese and English, chosen
  in settings, defaulting to the browser language; user-entered data is never
  translated. The Markdown export MUST use the chosen language for its labels.

**Hosted data**

- **FR-045**: Every record of this feature MUST belong to the user's workspace;
  requests for another workspace's data MUST behave as not found
  (constitution VI).
- **FR-046**: A change MUST be visible on another device on its next load, and
  within 30 seconds on a device that has the screen open.
- **FR-047**: Concurrent edits MUST keep the latest change per field and MUST
  NOT drop changes to other fields.
- **FR-048**: Offline, the last loaded data MUST be readable with an offline
  notice; edits MUST be disabled (002 FR-016).
- **FR-049**: The export MUST include every record of this feature in the
  documented machine-readable format and in readable Markdown, and the export
  documentation MUST describe the new fields (constitution VII).
- **FR-050**: Account deletion MUST delete every record of this feature.
- **FR-051**: Every daily-critical operation (open today, add, reorder, change
  status, edit minutes, expand an entry, capture, close the day) MUST be usable
  on a 390 px wide screen with touch targets of at least 44 px.

### Key Entities *(include if feature involves data)*

- **Day**: one date of the workspace with capacity, capture text, close state,
  notes, and check-in. Exists only once something is stored for it.
- **Entry**: one item of a day: title, order, optional start, planned and actual
  minutes, status, planned or unplanned, work or time block, time value, deep
  work, notes, optional activity, optional carry origin.
- **Segment**: an ordered part of an entry or of an activity's default
  segments: title, minutes, time value.
- **Pillar, Area, Tag**: the user's category tree and labels.
- **Activity**: a stable "what" with primary area, tags, defaults; may be
  archived.
- **Cycle**: a week, month, year, or 5/10/20-year period with a close state and
  notes.
- **Objective**: belongs to a cycle; tier, target type, target, scale (level),
  start value and cumulative flag (value), activities, optional parent, carry
  origin, status (active, done, carried, dropped).
- **Contribution**: an entry counting for an objective, automatic (by activity)
  or manual, weight 1.
- **Measurement**: a recorded value or level for an objective, with time.
- **Objective Template**: a reusable weekly objective proposal.
- **Suggestion**: a proposed entry from capture text, pending until accepted or
  dismissed.
- **Carry**: a decision on a carry candidate (entry or objective) and, when
  confirmed, the link from origin to the new record.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a phone, adding an entry from an activity takes under 10
  seconds and at most 3 taps after typing.
- **SC-002**: Changing an entry's status takes at most two taps from the day
  view.
- **SC-003**: A change on one device is visible on another within 30 seconds in
  95% of trials.
- **SC-004**: A three-segment gym entry can be created in under 2 minutes, and
  its useful/support split is readable without expanding it.
- **SC-005**: Closing a day with ten entries whose statuses are known takes
  under 3 minutes; closing a week with five objectives under 5 minutes.
- **SC-006**: Execution, alignment, and every objective's progress equal an
  independent hand calculation in 100% of test cases.
- **SC-007**: 100% of automated cross-workspace read and write attempts on the
  new data are refused as not found.
- **SC-008**: In the first week of beta use, the owner plans and closes at least
  five days and one week in the app without falling back to Obsidian.
- **SC-009**: At 390 px wide: no horizontal scroll, no daily-critical control
  under 44 px, and no collapsed entry showing more than title, time, and
  status.
- **SC-010**: Every screen is fully usable in Portuguese and in English, with no
  untranslated interface text.

## Assumptions

- One user per workspace; sharing stays out of scope (constitution).
- Out of scope: recurrence rules (the beta has copy from another day),
  critical behaviors, reminders, merging categories or activities, overlap
  between entries (Q14), carry to a chosen date (carry goes to the next day),
  charts, importing Obsidian or 001 data (Q21), editing offline (ADR 0006), and
  AI-based capture.
- The owner's personal categories, activities, and templates come from the
  Obsidian vault, are approved by the owner, and are loaded only into the
  owner's workspace; they are never committed to the public repository.
- Expected-by-now pace is the share of the cycle that has passed; no other gap
  model is needed in this feature.
- Real data may be stored before backups exist; the owner accepted the risk on
  2026-10-18. The staging database must still be upgraded before the Free
  database expires (2026-11-16) or the data is lost.
- The staging environment is the beta environment and keeps deploying from the
  `002-cloud-foundation` branch; it is renamed later.
- The workspace settings of 002 (time zone, week start, default daily capacity)
  are reused; the interface language is added to them.
