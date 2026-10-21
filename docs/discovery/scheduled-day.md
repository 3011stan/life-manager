# Discovery: Computed Day Schedule (idea, not specified)

**Status**: Parked idea from the owner's feedback of 2026-10-20 (point 3).

The owner would rather not type start times. Instead:

- The day has a start time.
- Entries carry only planned minutes. Their order produces each start and end
  time; reordering recomputes them.
- Some entries have a fixed time that cannot move (stand-ups, meetings). The
  flexible entries flow around them.

Open questions for a future Specify step:

1. What happens when flexible entries do not fit before a fixed one: does the
   entry split, move after it, or show an overlap warning?
2. Is the day start a setting, a per-day value, or both?
3. Do actual minutes shift the following entries during the day?
4. How does this interact with time blocks and with segments?
5. Is the end of the day (capacity) shown as a time?
