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
  parentIds: string[];
}

export interface GoalOption {
  id: string;
  title: string;
  horizon: string;
  // The goals above, nearest first: "Gym · Nov › Gym › Fit body".
  path: string;
}

export function goalOptions(goals: Linked[], horizon: string): GoalOption[] {
  return goals
    .filter((g) => g.horizon === horizon)
    .map((g) => ({
      id: g.id,
      title: g.title,
      horizon: g.horizon,
      path: chainOf(goals, g.id)
        .slice(1)
        .map((o) => o.title)
        .join(" › "),
    }));
}

const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

// E3: the picker shows up to 8 goals not chosen yet, matching title or path.
export function matchGoals(options: GoalOption[], query: string, chosen: string[]): GoalOption[] {
  const q = fold(query);
  return options.filter((o) => !chosen.includes(o.id) && (!q || fold(o.title).includes(q) || fold(o.path).includes(q))).slice(0, 8);
}
