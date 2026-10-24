# Feature Specification: Plan and Polish (Feedback Round 2)

**Feature Branch**: `005-plan-and-polish`

**Created**: 2026-10-24

**Status**: Approved (2026-10-24) — D4 C Ritmo with B parts; D6 as a single tree; D1, D1b, D2, D3, D5, D7, D8 as recommended

**Input**: The owner's second round (2026-10-24), four points:
1. Activity and area don't match the Life Manager model kept in Obsidian.
2. The entry form is complex: segments, time block, time value, deep work.
3. The design is rudimentary; checks are coarse; segments look bad. Present options.
4. Linking goals is still weak. Plan top-down (5-year → year → …), with a goal
   linked to one or more goals above it, and more automation than in Obsidian.

Also on 2026-10-24: running-app tests may run locally only for now.

## Findings (discovery)

| # | Point | Finding |
|---|---|---|
| 1a | Names | The app and the Obsidian model use the same four concepts. Pillar = pillar, area = area, activity = an activity of the catalog (`activity_id`), entry = a task or time block of a day. The mismatch is in the values. |
| 1b | Values | The Obsidian data model defines 3 pillars × 9 areas (Personal: health, mental, spiritual; Professional: material, purpose, contribution; Social: family, friends, relationships), plus an activity type (habit, project, experience, maintenance). Real use drifted to 17 pillar values (body, mind, work…) and areas that are subjects (a language, a degree). The app's generic catalog (Body, Mind, Spirit, Work, Home, Social, Life management) and the owner's private seed both followed the drift, not the model. The staging workspace still holds the generic catalog, because the seed was not run. |
| 1c | Type | The app has no activity type. |
| 2 | Entry sheet | It has 15 controls: title, activity, an inline create (area and button), group, status, start, planned, actual, a segment editor, objective chain and manual links, time block, time value, deep work, notes, move up and move down. Four of them (segments, time block, time value, deep work) already default from the activity. "Time block" and an entry's "time value: support" overlap: both say "this time is not the work itself". In Obsidian a time block is its own record that doesn't count for execution or alignment; "support" exists only for parts of a session (the trip to the gym). |
| 3 | Look | There are no design tokens beyond a few colors, and the icons are text glyphs (⋮⋮ ◎ ▸ ✓). The check is a bordered square holding a character; segments show as a two-color bar plus an expandable list. Three directions are drawn on the design canvas (see D4). |
| 4a | Links | A goal has one parent (`parent_objective_id`). It can't count for two goals above it ("104 language classes" feeds both "Fluent in a language" and "Travel to 3 countries"). |
| 4b | Flow | Each horizon is a separate screen. Linking means opening a goal and picking a parent from a list. Nothing starts from a goal above and asks for the ones below it, and nothing shows the goals above that have nothing below them. |
| 4c | Automation | Weekly templates propose standalone weekly goals with no tie to the year. A rhythm ("2 classes a week") must be retyped as a weekly goal each week and linked by hand. |
| 4d | Horizons | The app has 5, 10, and 20 years. The owner mentions 5, 10, or 15. |

## Decisions To Approve

Each has a recommendation (★). Approve all, or change any.

| ID | Question | Options |
|---|---|---|
| D1 | Taxonomy (1b) | ★ **A** The documented model: 3 pillars × 9 areas become the default catalog for new workspaces (generic, no personal data). The owner's private seed is rebuilt from the Obsidian activity catalog. Generic items already in use move to the mapped area (Body → Personal/Health, Mind → Personal/Mental, Spirit → Personal/Spiritual, Work → Professional/Purpose, Home → Personal/Health, Social → Social/Friends, Life management → Professional/Material). **B** The drifted vocabulary (body, mind, spirit, work, home, social, life-management). **C** Keep the generic catalog. |
| D1b | Activity type (1c) | ★ **A** Add type (habit, project, experience, maintenance) as an optional field on the activity, edited only in Activities. **B** Leave it out. |
| D2 | Entry sheet (2) | ★ **A** The sheet shows title, activity, start, duration, and "counts for" (read only). "More" holds group, notes, skip/cancel, and linking another goal. Parts, routine, and deep work belong to the activity and are edited only there. Changing an entry's duration changes its main part. The status is set by the check on the row, and a completed entry's duration field edits the actual time. Move up and down go away (drag and keyboard drag stay). **B** As A, but parts and deep work can still be overridden per entry under "More". |
| D3 | Time kinds (2) | ★ **A** One switch on the activity: "Routine" (lunch, commute: it takes time in the day but doesn't count). An activity's parts are each "counts" or "support". The entry-level "time value" disappears from the interface. **B** Keep both, as today. |
| D4 (owner: C + B parts) | Visual direction (3) | Chosen on 2026-10-24: **C Ritmo** (entries as white cards on sand, pillar color dot, progress ring, round checks, floating add bar), with **B Grafite's composition**: an entry with parts lists them indented under a left rule, one line per part with its time, the counting part emphasized. Artboard "C + partes do B" on the design canvas. Ships with dark mode, inline SVG icons (no glyphs), type and spacing scale, accessible contrast. |
| D5 | Goal links (4a) | ★ **A** A goal may count for several goals in any higher horizon whose period contains it. Progress credit flows to all of them. **B** Keep one parent. |
| D6 | Top-down plan (4b) | ★ **A** (redrawn 2026-10-24 after the owner's review) The Goals screen is one tree, no horizon tabs: each longest-horizon goal is a card with its progress; expanded, it shows its goals below as nested lines with a thin progress bar and value, down to this week. A goal that also counts for another goal shows only a link icon (no text). "+ Meta" under a goal creates the next horizon's goal already linked. No suggestions. "Cycles" becomes "Goals" in the navigation; cycle close stays reachable from the period. **B** Only a multi-select of parents in the goal sheet. |
| D7 | Rhythm (4c) | ★ **A** A count or time goal on a year or month can carry a rhythm (N per week, or per month). The app suggests the rhythm from the target (104 a year → 2 a week). Each new week or month gets the child goal created and linked, with the parent's activities. One tap removes it for that period. Standalone templates stay for routines tied to no goal. **B** Each week the rhythm is proposed for accept/skip, as templates are today. **C** No rhythm. |
| D8 | Long horizons (4d) | ★ **A** 5, 10, and 15 years. The 20-year horizon becomes 15 when it has no goals; otherwise it is kept and hidden. **B** Keep 5, 10, 20. **C** 5, 10, 15, and 20. |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The Catalog Speaks the Model (Priority: P1)

The owner opens Activities and sees their pillars, areas, and activities as in
their Life Manager model. Every activity has one pillar and area, and optionally
a type.

**Why this priority**: alignment and pillar totals mean nothing on the wrong taxonomy.

**Independent Test**: a new workspace gets 3 pillars × 9 areas. A workspace
holding the old generic catalog, with entries on its activities, is migrated
by the seed: entries keep their activities, and the activities move to the
mapped areas.

**Acceptance Scenarios**:

1. **Given** a new workspace, **When** it is created, **Then** its catalog is Personal (Health, Mental, Spiritual), Professional (Material, Purpose, Contribution), and Social (Family, Friends, Relationships), in its language.
2. **Given** generic activities in use, **When** the seed runs with `--replace-generic`, **Then** used activities move to the mapped area and unused generic ones are removed.
3. **Given** an activity, **When** its type is set to project, **Then** the list shows it and the export carries it.

---

### User Story 2 - A Short Entry Sheet (Priority: P1)

Opening an entry shows five things: title, activity, start, duration, and what
it counts for. Everything else either comes from the activity or sits under
"More".

**Why this priority**: the sheet is opened many times a day.

**Independent Test**: create an entry from an activity that has parts. Without
opening "More", set the start and the duration, and save. The parts and deep
work come from the activity, and the duration change lands on the main part.

**Acceptance Scenarios**:

1. **Given** an entry, **When** its sheet opens, **Then** only title, activity, start, duration, and "counts for" are visible, plus "More", Delete, and Save.
2. **Given** an activity with parts 30 support / 60 counts / 30 support, **When** an entry's duration changes from 2h to 1h30, **Then** the parts become 30 / 30 / 30.
3. **Given** an entry with no activity, **When** the owner types a new activity name in the picker, **Then** "Create" asks only for the area and links it.
4. **Given** a completed entry, **When** its duration is edited, **Then** the actual minutes change and the planned minutes stay.
5. **Given** a routine activity (lunch), **When** an entry uses it, **Then** it takes capacity and is left out of execution and alignment.

---

### User Story 3 - Plan From the Top (Priority: P1)

The owner writes their 5-year goals on the Goals screen and, under each one,
adds the year's goals, then the months' and weeks'. A goal may sit under
several goals above it. The whole chain reads as one tree.

**Why this priority**: it is the path that ties every day to what matters (former 004 D5).

**Independent Test**: with "Fluent in a language" and "Travel to 3 countries" as 5-year
goals, create "104 language classes" under the first, link it to the second, and
complete one class entry. Both 5-year goals show the credit.

**Acceptance Scenarios**:

1. **Given** a 5-year goal, **When** "+ Meta" is used under it, **Then** the new year goal is linked to it and starts with its activities.
2. **Given** a year goal, **When** it is linked to two 5-year goals, **Then** an entry counting for it credits both.
3. **Given** a year goal with no goal above, **When** the Goals screen opens, **Then** it shows as its own card at the top level and can be linked from its sheet.
4. **Given** a goal linked to a goal above, **When** the one above is deleted, **Then** the link goes and the goal below stays.
5. **Given** a goal, **When** a link would create a cycle or point to a horizon that isn't higher, **Then** it is refused with a message.

---

### User Story 4 - Rhythms Do the Weekly Work (Priority: P2)

A year goal "104 classes" carries the rhythm "2 a week". Each new week starts
with "Language class 2×" already there, linked to it and with its activities.

**Why this priority**: it removes the weekly retyping the owner did in Obsidian.

**Independent Test**: set a rhythm and open the next week. The weekly goal
exists, is linked, and counts the class entries. Removing it for that week
keeps it removed after reload, and the following week gets it again.

**Acceptance Scenarios**:

1. **Given** a count goal of 104 for a year, **When** a rhythm is added, **Then** "2 per week" is suggested.
2. **Given** a rhythm, **When** a week opens for the first time, **Then** the weekly goal is created once, even with two devices open.
3. **Given** a generated weekly goal, **When** it is removed, **Then** that week doesn't get it again.
4. **Given** a closed week, **When** the year goal's rhythm changes, **Then** past weeks are untouched.

---

### User Story 5 - A Product That Feels Considered (Priority: P2)

Every screen uses the chosen direction (D4): type scale, spacing, color tokens
with dark mode, SVG icons, round or square checks with a short fill animation,
and parts drawn as in the direction.

**Independent Test**: screenshot every screen at 390 px and 1280 px, light and
dark. Every text and control passes contrast checks (automated axe run), and no
text glyph is used as an icon.

**Acceptance Scenarios**:

1. **Given** any screen, **When** the system theme is dark, **Then** it renders with the dark tokens.
2. **Given** a row, **When** it is checked, **Then** the check fills within 150 ms and the row doesn't move.
3. **Given** reduced motion, **When** a row is checked, **Then** there is no animation.

### Edge Cases

- A rhythm that doesn't divide evenly (100 a year): the suggestion rounds up (2 a week), and the year progress stays the truth.
- A week that straddles two months still belongs to the month holding most of its days (003 research R2), and month rhythms count it there.
- Parts of an activity change after entries exist: past entries keep their parts, and only new entries take the new ones.
- An entry's activity changes: its parts, routine flag, and deep work are taken from the new activity.
- The 20-year horizon has goals (D8 A): it is kept and hidden from the tabs, and its goals stay reachable from the goals below them.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: New workspaces MUST get the 3 × 9 catalog in their language (D1).
- **FR-002**: The seed MUST move used generic activities to the mapped area and remove unused generic items, matching by name, with no data loss.
- **FR-003**: Activities MUST carry an optional type (D1b), and the export MUST include it.
- **FR-004**: The entry sheet MUST show only title, activity, start, duration, and "counts for" outside "More" (D2).
- **FR-005**: An entry's parts, routine flag, and deep work MUST follow its activity, and MUST be re-derived when its activity changes.
- **FR-006**: Changing an entry's duration MUST change its main part (the longest "counts" part) and keep the others.
- **FR-007**: The activity's "Routine" switch MUST replace the entry-level time block and time value in the interface. Routine entries take capacity and are excluded from execution and alignment (D3).
- **FR-008**: A goal MUST be linkable to several goals in higher horizons whose periods contain it, and progress credit MUST reach every goal above, counted once each (D5).
- **FR-009**: Links MUST reject cycles, links to the same or a lower horizon, and links to a period that doesn't contain the goal.
- **FR-010**: The Goals screen MUST show one tree from the longest horizon down to the current week, collapsible per goal, with progress per goal, a link icon on goals that count for more than one goal above, and "+ Meta" creating the next horizon's goal linked (D6). Goals with no goal above are top-level cards.
- **FR-011**: (removed: no parent suggestions, owner 2026-10-24)
- **FR-012**: A year or month count or time goal MAY carry a rhythm (count or minutes per week or per month). The child goal MUST be created once per period, linked and with the parent's activities. A removed child MUST NOT come back for that period (D7).
- **FR-013**: Long horizons MUST be 5, 10, and 15 years (D8).
- **FR-014**: Every screen MUST use the chosen direction's tokens, light and dark, with SVG icons. Text MUST pass WCAG AA contrast, and touch targets MUST stay at least 44 px (D4).
- **FR-015**: Every story MUST have an end-to-end test against the running app that passes locally before each deploy. CI e2e in the web repository and the staging smoke may keep skipping (owner, 2026-10-24).

### Key Entities

- **Objective link** (new): a goal below and a goal above, same workspace, unique pair. It replaces `parent_objective_id`, and existing parents migrate to one link each.
- **Objective** (changed): optional rhythm (`rhythmPeriod` week or month, `rhythmCount` or `rhythmMinutes`).
- **Rhythm application** (new): goal above, period cycle, the created goal, or "removed". Unique per goal above and period.
- **Activity** (changed): optional `type`. "Routine" is the existing `defaultIsTimeBlock`.
- **Cycle horizon** (changed): `y15` replaces `y20` (D8).

## Success Criteria *(mandatory)*

- **SC-001**: An entry is created and timed from the sheet in at most 4 interactions, without opening "More".
- **SC-002**: A goal at each level from 5 years down to week, linked top-down, takes under 3 minutes for one 5-year goal.
- **SC-003**: No weekly goal derived from a rhythm needs to be typed by hand.
- **SC-004**: The owner recognizes the chosen direction (C + B parts) on every screen. axe reports 0 contrast violations.

## Assumptions

- Capture stays rule-based (004 D3).
- The computed schedule from start times (004 point 3) stays out.
- Existing entries keep their stored parts and flags. Only the interface for editing them changes.
- No dedicated UI/UX skill is installed. Design options were drawn on the design canvas, and implementation follows the chosen artboard.
