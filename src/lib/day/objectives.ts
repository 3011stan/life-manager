import { formatMinutes } from "./dates";
import type { Objective } from "./types";

// How an objective's progress reads in the interface (FR-037).
export function progressText(o: Objective): string {
  const current = o.current;
  switch (o.targetType) {
    case "count":
      return `${String(current ?? 0)} / ${String(o.targetCount ?? 0)}`;
    case "duration":
      return `${formatMinutes(Number(current ?? 0))} / ${formatMinutes(o.targetMinutes ?? 0)}`;
    case "value":
      return `${String(current ?? o.startValue ?? 0)} / ${String(o.targetValue ?? 0)} ${o.unit ?? ""}`.trim();
    case "level":
      return `${current === null ? "—" : String(current)} → ${o.targetLevel ?? ""}`;
    case "milestone":
      return o.progress >= 1 ? "✓" : "—";
    default:
      return `${String(Math.round(Math.min(o.progress, 1) * 100))}%`;
  }
}

export const percent = (value: number): string => `${String(Math.round(value * 100))}%`;
