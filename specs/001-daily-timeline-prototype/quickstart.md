# Quickstart: Daily Timeline Prototype

## Prerequisites

- Node.js 20.9 or newer.
- Dependencies installed with `npm install`.

## Run Locally

```bash
cd /Users/stan/Projects/cloud-stanos
npm run dev
```

Open the local URL printed by Next.js, usually:

```text
http://localhost:3000
```

## Validate Primary Flow

1. Open the app.
2. Confirm today's local date is shown.
3. Add at least five timeline items.
4. Reorder items in the timeline.
5. Mark one item completed.
6. Mark one item partial and set actual minutes lower than planned.
7. Mark one item skipped.
8. Refresh the page.
9. Confirm the date, order, statuses, notes, and durations persisted.

Expected result:

- The daily timeline remains usable after refresh in the same browser.
- Local-only persistence is clearly communicated.

## Validate Task Bundle Flow

1. Add a bundle named `Gym`.
2. Add segments:
   - `Prepare and go`, 20 minutes, non-useful.
   - `Gym`, 60 minutes, useful.
   - `Return and shower`, 30 minutes, non-useful.
3. Collapse the bundle.
4. Confirm the collapsed row shows 110 total minutes.
5. Confirm the collapsed row visually shows 60 useful and 50 non-useful minutes.
6. Expand the bundle.
7. Confirm all three segments are visible in order.

Expected result:

- The user can understand both the meaningful activity and its real calendar cost.

## Validate Freeform Flow

1. Open freeform capture.
2. Enter:

```text
fiz standup
trabalhei no projeto X umas 2h
academia 19h
nao fiz leitura
preciso marcar futevolei amanha
```

3. Request structure.
4. Edit one suggestion.
5. Accept selected suggestions.
6. Dismiss at least one suggestion.

Expected result:

- Accepted suggestions appear in the timeline.
- Dismissed suggestions do not appear.
- Nothing is committed before confirmation.

## Validate Daily Close Flow

1. Start daily close.
2. Review incomplete statuses and actual minutes.
3. Close the day.
4. Confirm execution score and alignment score are visible.
5. Confirm skipped and partial items appear as carry-forward candidates.
6. Confirm or dismiss carry candidates.
7. Refresh the page.

Expected result:

- Scores and close summary remain visible.
- Cancelled items do not reduce execution or alignment.
- Carries require explicit confirmation.

## Validate Mobile View

Use browser responsive mode at 390px width.

Repeat:

- add item;
- reorder item;
- expand/collapse bundle;
- edit status;
- edit duration;
- use freeform capture;
- close day.

Expected result:

- No horizontal scrolling.
- Text does not overlap controls.
- Primary controls remain usable with touch-sized targets.
