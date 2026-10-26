# Implementation Plan: Agenda (Feedback Round 3)

**Branch**: `006-agenda` (both repositories) | **Date**: 2026-10-26 | **Spec**: [spec.md](spec.md)

**Status**: Draft — awaiting approval.

## Summary

An event is its own record. Each occurrence has one task (an entry) and, in its
week, one milestone goal pointing at that task. Occurrences are created lazily:
when the agenda is read and when a week is applied, so repeating events need no
background job. The agenda is a section of the Goals screen.

## Technical Decisions

| # | Decision | Why |
|---|---|---|
| R1 | Table `event`: id, workspace, title, `on_date` (the first or only occurrence), `start_time` null, `activity_id` null, `repeats_yearly`, `makes_week_goal` (default true), notes, row conventions with soft delete. Table `event_objective` (event, goal) for the goals it counts for. RLS like every tenant table | FR-001 |
| R2 | Table `event_occurrence`: event, `on_date`, `entry_id`, `objective_id` null, `goal_removed` bool; primary key (event, on_date). It makes task creation and goal application idempotent and remembers a removed goal | FR-002, FR-006 |
| R3 | `entry.event_id` null (FK). The day DTO exposes it so the timeline shows the event mark | FR-008 |
| R4 | `ensureOccurrences(from, to)` in `src/modules/events/service.ts`: for each event, the occurrences in the range (for a yearly event, the same month and day each year; 29 Feb falls on 28 Feb), creating any missing task. Called by `GET /v1/agenda?from&to` and by apply | FR-002, US3 |
| R5 | `POST /v1/cycles/week/{date}/apply-events`: ensure occurrences of the week, then for each with "week goal" on and no goal yet (and not removed) create a milestone goal (`milestoneEntryId` = the task, `parentIds` = the event's goals whose period contains the week) with `gate: false`, as rhythms do. The web calls it next to `applyRhythms` in `GoalsTree` and `CyclesScreen`, and after saving an event whose date is in the current week | FR-004, FR-005, US2.4 |
| R6 | Deleting a goal made from an occurrence sets `goal_removed` on it | FR-006, US2.3 |
| R7 | Event edits: a new title, date, or time updates the planned task of the next occurrence (and of later ones for a yearly event); a completed task is never touched. Delete soft-deletes the event and its planned future tasks | FR-007 |
| R8 | Web: `AgendaSection` under the tree in `GoalsTree.tsx`: months as headings, rows with date, title, and repeat icon, "+ Event" opening `EventSheet` (title, date, time, activity picker, goals checklist, repeat and week-goal switches, notes, delete). A Calendar icon is added to `icons.tsx` | D1, D4 |
| R9 | Export formatVersion 5 adds `events` and `eventOccurrences`; `docs/export-format.md` | FR-009 |

## Delivery

1. Backend: schema, migration, service, routes, integration tests, OpenAPI.
2. Web: client regen, agenda section, event sheet, timeline mark, e2e.
3. Local e2e run green, backend CI green, then staging: web first, then backend
   (the backend's e2e uses the web staging branch).
