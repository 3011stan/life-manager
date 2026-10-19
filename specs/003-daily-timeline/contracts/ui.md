# UI Contract: Daily Timeline, Activities, And Objectives

**Feature**: `003-daily-timeline` | **Date**: 2026-10-18

Essentialist rules (FR-001–FR-005) apply to every screen. Every text comes
from the locale dictionary.

## Navigation

A bottom bar on phones, a left rail on desktop, with three items: **Day**
(home), **Cycles**, **More** (catalog, templates, settings, account). `/`
redirects to `/day/<today>`.

## Day (`/day/[date]`)

- Header: date with ‹ › and "Today"; time zone note when it differs from the
  device; capacity line `planned / capacity · left` (overrun in the state
  color); one compact line with this week's essential objectives.
- Timeline: rows show title (activity name), time (start or minutes), and a
  status control (tap cycles planned → completed; long press or menu for
  skipped / cancelled). "No activity" rows show a small mark. Bundles show a
  useful/support bar and expand on tap of the chevron (44 px).
- Primary action: one "Add" field at the bottom: typing suggests activities;
  Enter adds with defaults. A secondary "Log done" toggle on the same field
  creates unplanned entries.
- Entry sheet: every other field (start, minutes, actual, segments, time
  block, time value, deep work, notes, objective links, delete).
- Day menu: copy from another day, capture, close the day.
- Gate: when `closeRequired` is set, the Add field shows "Close <date> first"
  with a button to that close; "Log done" stays available.

## Day close (`/day/[date]/close`)

Steps on one page: 1) unresolved entries with three buttons each; 2) scores
with "why?" disclosure listing entries; 3) carry candidates with edit /
confirm / dismiss; 4) optional check-in, four 1–5 tap rows; 5) notes; "Close
the day".

## Cycles (`/cycles/[horizon]/[start]`)

- Horizon tabs: Week, Month, Year, Long (5/10/20 years); week is default.
- Objectives grouped by tier; each row: title, progress `3 / 4` or percent,
  pace marker. Tap opens the objective sheet (targets, activities, parent,
  measurements, delete).
- Add objective: title, then type (count, duration; "more types" reveals the
  other four), target, activities, parent.
- Week view shows template proposals when the week has none applied yet.
- Close: final progress, carry/drop per unfinished objective, notes; the year
  close adds long-horizon checkpoints.

## Catalog (`/catalog`)

Pillars → areas → activities as a collapsible list; rename inline; archive /
restore; delete offers archive when in use. Activity sheet: name, area, tags,
default minutes, deep work, time block, time value, default segments.

## Settings additions

Language (Português / English), long-horizon start year, objective templates
(list and edit).
