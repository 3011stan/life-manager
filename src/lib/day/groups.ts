import type { Day, Entry } from "./types";

// 004 D1: the day shows top-level rows (loose entries and group headings) in
// order, and each heading's entries in order under it.

const byKey = (a: Entry, b: Entry) => (a.orderKey < b.orderKey ? -1 : a.orderKey > b.orderKey ? 1 : 0);

export function topLevel(entries: Entry[]): Entry[] {
  return entries.filter((e) => e.groupId === null).sort(byKey);
}

export function childrenOf(entries: Entry[], headingId: string): Entry[] {
  return entries.filter((e) => e.groupId === headingId).sort(byKey);
}

// The entries an entry is ordered among: its group's, or the top level.
export function siblingsOf(entries: Entry[], entry: Entry): Entry[] {
  return entry.groupId === null ? topLevel(entries) : childrenOf(entries, entry.groupId);
}

export function groupMinutes(entries: Entry[], headingId: string): number {
  return childrenOf(entries, headingId)
    .filter((e) => e.status !== "cancelled")
    .reduce((n, e) => n + e.plannedMinutes, 0);
}

type DayObjective = Day["objectives"][number];

// An objective and its parents, up to the longest horizon (004 FR-010).
export function chainOf(objectives: DayObjective[], id: string): DayObjective[] {
  const chain: DayObjective[] = [];
  let current = objectives.find((o) => o.id === id);
  while (current && !chain.includes(current)) {
    chain.push(current);
    const parentId = current.parentId;
    current = objectives.find((o) => o.id === parentId);
  }
  return chain;
}
