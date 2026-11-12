import { chainOf } from "./groups";
import type { CycleHorizon } from "./types";

// 007 E1: a goal counts only for goals of the horizon right above it; a task
// (a day's entry) only for week goals.
const ORDER: ("day" | CycleHorizon)[] = ["day", "week", "month", "year", "y5", "y10", "y15", "y20"];

export function nextHorizon(horizon: string): "day" | CycleHorizon | null {
  const index = ORDER.indexOf(horizon as CycleHorizon);
  return index < 0 ? null : (ORDER[index + 1] ?? null);
}

// A link written before 007 may jump over a horizon; the tree marks it (R8).
export function skipsLevel(goal: { horizon: string }, parent: { horizon: string }): boolean {
  return parent.horizon !== nextHorizon(goal.horizon);
}

interface Linked {
  id: string;
  title: string;
  horizon: string;
  // 008 FR-001: the day lists goals of any status, so what a task counted for
  // still shows; pickers offer active goals only.
  status?: string;
  parentIds: string[];
}

export interface GoalOption {
  id: string;
  title: string;
  horizon: string;
  // The goals above, nearest first: "Gym · Nov › Gym › Fit body".
  path: string;
  // The goal right above, which the picker groups by (007b F5).
  parentTitle: string | null;
}

export interface GoalGroup {
  parent: string | null;
  options: GoalOption[];
}

export function goalOptions(goals: Linked[], horizon: string): GoalOption[] {
  return goals
    .filter((g) => g.horizon === horizon && (g.status === undefined || g.status === "active"))
    .map((g) => {
      const above = chainOf(goals, g.id).slice(1);
      return {
        id: g.id,
        title: g.title,
        horizon: g.horizon,
        path: above.map((o) => o.title).join(" › "),
        parentTitle: above[0]?.title ?? null,
      };
    });
}

const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

const SHOWN = 8;

// E3: the picker shows up to 8 goals not chosen yet, matching title or path.
// 007b F5: grouped under the goal right above (goals with none last), with the
// number of matches left out.
export function matchGoals(options: GoalOption[], query: string, chosen: string[]): { groups: GoalGroup[]; more: number } {
  const q = fold(query);
  const matches = options
    .filter((o) => !chosen.includes(o.id) && (!q || fold(o.title).includes(q) || fold(o.path).includes(q)))
    .sort((a, b) => (a.parentTitle === b.parentTitle ? 0 : a.parentTitle === null ? 1 : b.parentTitle === null ? -1 : a.parentTitle.localeCompare(b.parentTitle)));
  const groups: GoalGroup[] = [];
  for (const o of matches.slice(0, SHOWN)) {
    const last = groups.at(-1);
    if (last?.parent === o.parentTitle) last.options.push(o);
    else groups.push({ parent: o.parentTitle, options: [o] });
  }
  return { groups, more: Math.max(matches.length - SHOWN, 0) };
}
