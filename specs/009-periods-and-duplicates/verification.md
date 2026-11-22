# Verification: Periods and Duplicates (Feedback Round 6)

**Spec**: [spec.md](spec.md) · **Tasks**: [tasks.md](tasks.md)

Backend tests are in `life-manager-backend` (`test/integration/periods.test.ts`,
`test/integration/migrations-009.test.ts`, `test/unit/gates.test.ts`,
`test/unit/goals.test.ts`, and the updated alignment, chain, and fix-chain
tests); web tests are in this repository (`src/lib/day/goals.test.ts`,
`e2e/periods.spec.ts`, `e2e/objectives.spec.ts`).

| Decision | Tests |
|---|---|
| G1 Carry only goals made by hand; others renew | integration "offers to carry only goals made by hand; rhythm, template, and chain goals renew", "treats a goal carried from a template's goal as the template's" |
| G2 No copy into a period that has the goal | integration "does not copy a carried goal into a period that already has it", "still copies a carried goal the next period does not have"; unit "drops case, a trailing amount, and a period label…", "compares activities when both goals track some, titles otherwise" |
| G3 One goal per thing in a week | integration "lets a year goal's rhythm win over a template…", "makes a template's goal the rhythm's when the template came first, with the larger target", "lets the chain reuse the week's goal of an activity…", "lets the chain use a month goal of the same name…" |
| G4 Periods close in order | unit "lists a week's days with tasks that are not closed", "lists a month's weeks…by the month of their fourth day", "lets a period close when what is inside is closed or empty", "asks a year for its months, and a long horizon for its years"; integration "refuses a week's close…", "refuses a month's close…", "refuses a year's close…"; e2e "a month's close lists its open week and stays disabled" |
| G5 A tab keeps the period viewed | e2e "going Year → Month keeps the month viewed" |
| G6 Copy dialog knows copies of copies | integration "lists the tasks a day holds copies of, any number of copies back"; e2e "the copy dialog knows a task is already here from an older day" |
| G7 Tab icon, touch icon, manifest | e2e "serves the tab icon, the touch icon, and the manifest" |
| G8 One-time merge (migration 0017) | integration "merges goals of one week or month that are the same thing, once" |
| G9 Possible-duplicate question | web unit "possible duplicate"; e2e "creating a goal like one of the period's asks before making a second" |

## Runs (2026-11-16)

- Backend branch CI (check, e2e) green; staging run: check and e2e green; the
  deploy job first failed at checkout ("Repository not found", a GitHub
  error before any migration ran) and passed on rerun, with migration 0017.
- Staging: web `d45f16a`, API `a99a4e7`, health ok.
- Data: the owner's read-only listing after the deploy found 0 groups of goals that look alike (8 before).

## 009b (2026-11-22)

| Requirement | Tests |
|---|---|
| FR-011 The close starts from the saved check-in and notes; closing again keeps them | unit "keeps every saved check-in value", "starts empty when the day has no check-in"; e2e "a reopened day's close starts from its saved check-in and notes, and closing again keeps them" (two reopen-and-close passes, desktop and mobile) |

Runs: typecheck, lint, vitest 62/62. Local e2e: 108 passed, 2 failed in
`agenda.spec.ts` under parallel load (the same flaky spec as before), both
green when `agenda.spec.ts` and `day-close.spec.ts` ran alone (19/19).
Staging: web `f228aa0` (Vercel success); no backend change.
