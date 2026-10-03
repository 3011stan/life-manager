# UI Contract: Daily Timeline Prototype

## Default Entry

When the user opens the application, the product shows the daily timeline for the
current local date.

The UI must include:

- current date;
- previous and next date controls;
- local-only data notice;
- timeline list;
- add item action;
- freeform capture action;
- daily close action;
- visible score summary when the day has been closed.

## Timeline Item Contract

Each timeline item must expose:

- title;
- planned time or unscheduled state;
- planned minutes;
- actual minutes when available;
- status;
- notes affordance;
- useful/non-useful summary when applicable;
- reorder affordance or accessible move controls.

Status values:

- planned;
- completed;
- partial;
- skipped;
- cancelled.

## Task Bundle Contract

A bundle must be visible as one parent activity and support expand/collapse.

Collapsed state must show:

- bundle title;
- total duration;
- useful time;
- non-useful time;
- visual useful/non-useful split.

Expanded state must additionally show:

- ordered segment list;
- segment title;
- segment duration;
- segment useful/non-useful classification.

## Freeform Capture Contract

The freeform area must allow the user to write unstructured daily text.

When the user requests structure:

- suggestions are shown as editable pending items;
- no suggestion is committed automatically;
- accepted suggestions become timeline items;
- dismissed suggestions do not affect the timeline.

## Daily Close Contract

The daily close flow must:

- surface items still in planned status;
- surface missing actual minutes where relevant;
- allow the user to continue reviewing or close anyway;
- calculate execution score;
- calculate alignment score;
- identify carry-forward candidates;
- require user confirmation for carries;
- persist the close summary.

## Mobile Usability Contract

At 390px viewport width:

- primary actions remain visible or reachable without horizontal scrolling;
- timeline item text does not overlap controls;
- bundle useful/non-useful visual remains legible;
- status and duration edits are usable with touch;
- freeform capture and daily close can be completed without desktop-only controls.
