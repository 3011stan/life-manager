import type { DailyCycle } from "@/types/life-manager";
import { nowTimestamp } from "./dates";

const STORAGE_PREFIX = "cloud-stanos:daily-cycle:";

export function loadDailyCycle(date: string): DailyCycle | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(storageKey(date));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as DailyCycle;
    if (!parsed.date || !Array.isArray(parsed.items)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveDailyCycle(cycle: DailyCycle): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    storageKey(cycle.date),
    JSON.stringify({
      ...cycle,
      updatedAt: nowTimestamp(),
    }),
  );
}

export function storageKey(date: string): string {
  return `${STORAGE_PREFIX}${date}`;
}
