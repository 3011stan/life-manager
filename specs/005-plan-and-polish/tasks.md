# Tasks: Plan and Polish (Feedback Round 2)

**Input**: [spec.md](spec.md), [plan.md](plan.md). Tests first (constitution VIII).
Each phase ends with the local e2e run green, backend CI green, and a deploy to staging.

`backend/` = `~/Projects/life-manager-backend`, `web/` = `~/Projects/cloud-stanos`.

## Phase 1: Visual foundation (US5)

- [x] T001 [US5] Tokens (light and dark, type, spacing, radii, motion) in `web/src/app/tokens.css`, fonts through `next/font`, from the artboard "C + partes do B"
- [x] T002 [P] [US5] Inline SVG icon set in `web/src/components/icons.tsx`; replace every glyph icon (⋮⋮ ◎ ▸ ▾ ✓ × ‹ ›)
- [x] T003 [US5] Restyle `Check`, timeline rows, group heading, `PartsBar`, `Sheet`, fields, buttons, nav; check animation with reduced-motion fallback
- [x] T004 [US5] Apply to every screen (day, day close, goals, cycle close, activities, templates, settings, account, sign-in)
- [x] T005 [US5] e2e: axe on every screen (light and dark, desktop and mobile) with `@axe-core/playwright`; existing specs pass with the new markup

## Phase 2: Catalog model (US1)

- [ ] T006 [US1] Tests: new workspace gets 3 × 9 in pt-BR and en; seed map re-parents used generic activities and removes unused ones (`backend/test/integration/catalog.test.ts`, `seed.test.ts`)
- [ ] T007 [US1] `backend/src/modules/catalog/defaults.ts` on the model; `--replace-generic` map and `--dry-run` in `backend/src/modules/seed/seed.ts`
- [ ] T008 [US1] `activity.type` migration, API, export v4, `docs/export-format.md`; type field and filter in the Activities screen
- [ ] T009 [US1] Rebuild the owner's private seed `~/.config/life-manager/seed.json` from the Obsidian catalog (never committed); owner runs dry-run, export, then the seed

## Phase 3: Short entry sheet (US2)

- [ ] T010 [US2] Unit tests then `backend/src/domain/parts.ts` (resize main part, derivation from activity)
- [ ] T011 [US2] Integration tests then derivation on activity change and duration change in `backend/src/modules/days/service.ts`
- [ ] T012 [US2] Activity sheet: parts editor ("counts"/"support"), Routine switch, deep work, type; the time value select goes away
- [ ] T013 [US2] Entry sheet with five visible fields, "More", activity `Picker` with "Create “X”" and an area step; remove move up and down
- [ ] T014 [US2] e2e: create, time, and save without "More"; duration resizes the main part; completed entry edits actual; routine excluded from scores

## Phase 4: Many links and Plan (US3)

- [ ] T015 [US3] Unit tests then progress over a diamond (`backend/src/domain/progress.ts`)
- [ ] T016 [US3] Integration tests then `objective_link` migration (copy parents, drop column), RLS, service rules (cycle, horizon, containment), API, registry, cross-tenant test
- [ ] T017 [US3] `GET /v1/goals/tree` with every goal of the periods containing a date, progress, and links; tests
- [ ] T018 [US3] Goal sheet: multi-select of goals above; "Cycles" renamed "Goals"
- [ ] T019 [US3] Goals screen as one tree (cards per top goal, nested goals below with progress, link icon, "+ Meta"), as the canvas artboard "Metas"
- [ ] T020 [US3] e2e: the US3 independent test (two 5-year goals, one year goal under both, credit on both)

## Phase 5: Rhythms and horizons (US4, D8)

- [ ] T021 [US4] Integration tests then rhythm fields, `rhythm_application`, `apply-rhythms` (idempotent under two concurrent calls), removal; registry and cross-tenant test
- [ ] T022 [US4] Rhythm in the goal sheet with the suggested value; the web applies rhythms when opening a week or month
- [ ] T023 [D8] Migration `y20` → `y15` for cycles with no objectives; domain and web horizons; tests
- [ ] T024 [US4] e2e: rhythm creates the weekly goal once, removal sticks, next week gets it

## Phase 6: Verification

- [ ] T025 Verification report mapping every finding and story to its tests, with the local e2e result per deploy; the owner's run on phone and desktop
