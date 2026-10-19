# Quickstart: Daily Timeline, Activities, And Objectives

**Feature**: `003-daily-timeline` | **Date**: 2026-10-18

Validation guide. Runs locally (API + Postgres in Docker, web production
build) and on staging (signed in with test sign-in or Google).

## Local setup

```bash
# backend
docker compose up -d && npm run db:migrate && npm run dev
# web
npm run build && npm start
```

## Automated

| Check | Command | Expected |
|---|---|---|
| Domain rules | `npm test -- test/unit` (backend) | every table in `test/unit/*.test.ts` green |
| API and isolation | `npm test` (backend) | all green, including `test/isolation` for every new route |
| Capture parser, totals | `npm test` (web) | green |
| End to end | `E2E_TEST_SIGN_IN_SECRET=… npm run e2e` (web) | desktop and 390×844 green |

## Manual flows (phone first, then desktop)

1. **Day**: open the app → today, empty, capacity line. Add "Gym" from the
   catalog (defaults fill 120 min with three segments), add a free-title
   entry (shows "no activity"), add Lunch as a time block. Reorder by drag.
   Complete one with fewer minutes, skip one, cancel one. Open the desktop:
   identical within 30 s.
2. **Bundle**: collapse Gym → 120 min, 60 useful / 60 support; add and remove a
   segment; totals follow.
3. **Catalog**: rename an activity used yesterday → yesterday shows the new
   name; try to delete it → offered archive; archive → not suggested any more.
4. **Log**: "Log done" 120 min of an objective's activity → execution
   unchanged, alignment and objective progress include it.
5. **Close the day**: resolve planned entries, compare scores with a hand
   calculation, edit + confirm a carry, dismiss one, check in, close. Tomorrow
   has exactly the confirmed carry. Edit a closed day → it reopens.
6. **Rule Zero**: leave yesterday open with entries → adding a planned entry
   today asks to close yesterday; "Log done" still works.
7. **Objectives**: create 10-year → year (level) → month (duration) → week
   (count, activity English); complete English entries; record a level;
   check progress at every level.
8. **Week close and templates**: close the week, carry one objective, drop
   one; plan the next week from templates (accept one, skip one).
9. **Capture**: the five lines of the spec's US8 → start times vs durations
   right; only accepted suggestions are added.
10. **Language**: switch to English and back; no untranslated text; export
    Markdown in each locale.
11. **Export and deletion**: JSON export has formatVersion 2 and the new
    sections; delete a test account → its data is gone.
