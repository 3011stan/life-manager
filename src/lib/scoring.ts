import type {
  CarryForwardCandidate,
  DailyCloseSummary,
  ScoreSummary,
  TimelineItem,
} from "@/types/life-manager";
import { nowTimestamp } from "./dates";
import { createId, itemNonUsefulMinutes, itemUsefulMinutes, normalizeMinutes } from "./timeline";

export function calculateScores(items: TimelineItem[]): ScoreSummary {
  const scoredItems = items.filter((item) => item.status !== "cancelled");
  const alignmentItems = scoredItems.filter((item) => item.isAlignmentRelevant);

  const plannedMinutes = sumPlanned(scoredItems);
  const actualMinutes = scoredItems.reduce((total, item) => total + actualForItem(item), 0);
  const usefulMinutes = scoredItems.reduce((total, item) => total + itemUsefulMinutes(item), 0);
  const nonUsefulMinutes = scoredItems.reduce((total, item) => total + itemNonUsefulMinutes(item), 0);
  const deepWorkMinutes = scoredItems
    .filter((item) => item.isDeepWork)
    .reduce((total, item) => total + actualForItem(item), 0);

  return {
    executionScore: calculateScore(scoredItems),
    alignmentScore: calculateScore(alignmentItems),
    plannedMinutes,
    actualMinutes,
    usefulMinutes,
    nonUsefulMinutes,
    deepWorkMinutes,
  };
}

export function createDailyCloseSummary(items: TimelineItem[], notes?: string): DailyCloseSummary {
  return {
    ...calculateScores(items),
    closedAt: nowTimestamp(),
    carryCandidates: createCarryCandidates(items),
    notes: notes?.trim() || undefined,
  };
}

export function createCarryCandidates(items: TimelineItem[]): CarryForwardCandidate[] {
  return items
    .filter((item) => item.status === "skipped" || item.status === "partial")
    .map((item) => ({
      id: createId("carry"),
      sourceItemId: item.id,
      title: item.title,
      decision: "pending",
    }));
}

export function actualForItem(item: TimelineItem): number {
  if (item.status === "cancelled" || item.status === "skipped") {
    return 0;
  }

  if (item.actualMinutes !== undefined) {
    return normalizeMinutes(item.actualMinutes);
  }

  if (item.status === "completed") {
    return normalizeMinutes(item.plannedMinutes);
  }

  return 0;
}

function calculateScore(items: TimelineItem[]): number {
  const denominator = sumPlanned(items);

  if (denominator === 0) {
    return 0;
  }

  const credit = items.reduce((total, item) => {
    const planned = normalizeMinutes(item.plannedMinutes);
    return total + Math.min(actualForItem(item), planned);
  }, 0);

  return Math.round((credit / denominator) * 100);
}

function sumPlanned(items: TimelineItem[]): number {
  return items.reduce((total, item) => total + normalizeMinutes(item.plannedMinutes), 0);
}
