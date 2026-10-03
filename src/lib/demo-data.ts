import type { DailyCycle } from "@/types/life-manager";
import { nowTimestamp } from "./dates";
import { createBundleItem, createSimpleItem } from "./timeline";

export function createEmptyCycle(date: string): DailyCycle {
  return {
    date,
    items: [],
    freeformText: "",
    freeformSuggestions: [],
    updatedAt: nowTimestamp(),
  };
}

export function createSeedCycle(date: string): DailyCycle {
  const timestamp = nowTimestamp();

  return {
    date,
    updatedAt: timestamp,
    freeformText: "",
    freeformSuggestions: [],
    items: [
      createSimpleItem({
        title: "Prayer",
        plannedStart: "08:10",
        plannedMinutes: 10,
        status: "planned",
      }),
      createSimpleItem({
        title: "Reading",
        plannedStart: "08:25",
        plannedMinutes: 30,
        status: "planned",
      }),
      createSimpleItem({
        title: "Deep work - Cloud StanOS",
        plannedStart: "09:10",
        plannedMinutes: 90,
        status: "planned",
        isAlignmentRelevant: true,
        isDeepWork: true,
      }),
      createSimpleItem({
        title: "Team standup",
        plannedStart: "13:30",
        plannedMinutes: 30,
        status: "planned",
        isAlignmentRelevant: true,
      }),
      createBundleItem({
        title: "Gym",
        plannedStart: "18:20",
        status: "planned",
        isAlignmentRelevant: true,
        segments: [
          {
            id: "seed-gym-prepare",
            title: "Prepare and go",
            minutes: 20,
            timeValue: "non-useful",
          },
          {
            id: "seed-gym-training",
            title: "Gym",
            minutes: 60,
            timeValue: "useful",
          },
          {
            id: "seed-gym-return",
            title: "Return and shower",
            minutes: 30,
            timeValue: "non-useful",
          },
        ],
      }),
      createSimpleItem({
        title: "Daily close",
        plannedStart: "21:30",
        plannedMinutes: 15,
        status: "planned",
        isAlignmentRelevant: true,
      }),
    ],
  };
}
