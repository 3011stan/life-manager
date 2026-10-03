import type { BundleSegment, ItemStatus, TimeValue, TimelineItem } from "@/types/life-manager";
import { nowTimestamp } from "./dates";

export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createSimpleItem(input: {
  title: string;
  plannedMinutes: number;
  actualMinutes?: number;
  plannedStart?: string;
  status?: ItemStatus;
  notes?: string;
  isAlignmentRelevant?: boolean;
  isDeepWork?: boolean;
  timeValue?: TimeValue;
}): TimelineItem {
  const timestamp = nowTimestamp();

  return {
    id: createId("item"),
    kind: "simple",
    title: input.title.trim() || "Untitled item",
    status: input.status ?? "planned",
    plannedMinutes: normalizeMinutes(input.plannedMinutes),
    actualMinutes: normalizeOptionalMinutes(input.actualMinutes),
    plannedStart: input.plannedStart || undefined,
    notes: input.notes?.trim() || undefined,
    isAlignmentRelevant: input.isAlignmentRelevant ?? false,
    isDeepWork: input.isDeepWork ?? false,
    timeValue: input.timeValue ?? "useful",
    segments: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createBundleItem(input: {
  title: string;
  plannedStart?: string;
  status?: ItemStatus;
  notes?: string;
  isAlignmentRelevant?: boolean;
  isDeepWork?: boolean;
  segments: BundleSegment[];
}): TimelineItem {
  const timestamp = nowTimestamp();
  const segments = input.segments.length > 0 ? input.segments : createDefaultBundleSegments();

  return {
    id: createId("bundle"),
    kind: "bundle",
    title: input.title.trim() || "Untitled bundle",
    status: input.status ?? "planned",
    plannedMinutes: sumSegmentMinutes(segments),
    plannedStart: input.plannedStart || undefined,
    notes: input.notes?.trim() || undefined,
    isAlignmentRelevant: input.isAlignmentRelevant ?? false,
    isDeepWork: input.isDeepWork ?? false,
    timeValue: "useful",
    segments,
    isExpanded: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createDefaultBundleSegments(): BundleSegment[] {
  return [
    {
      id: createId("segment"),
      title: "Prepare and go",
      minutes: 20,
      timeValue: "non-useful",
    },
    {
      id: createId("segment"),
      title: "Main activity",
      minutes: 60,
      timeValue: "useful",
    },
    {
      id: createId("segment"),
      title: "Return and recover",
      minutes: 30,
      timeValue: "non-useful",
    },
  ];
}

export function updateItem(items: TimelineItem[], item: TimelineItem): TimelineItem[] {
  return items.map((current) =>
    current.id === item.id
      ? {
          ...item,
          plannedMinutes:
            item.kind === "bundle" ? sumSegmentMinutes(item.segments) : normalizeMinutes(item.plannedMinutes),
          actualMinutes: normalizeOptionalMinutes(item.actualMinutes),
          updatedAt: nowTimestamp(),
        }
      : current,
  );
}

export function reorderItems(items: TimelineItem[], fromId: string, toId: string): TimelineItem[] {
  if (fromId === toId) {
    return items;
  }

  const fromIndex = items.findIndex((item) => item.id === fromId);
  const toIndex = items.findIndex((item) => item.id === toId);

  if (fromIndex < 0 || toIndex < 0) {
    return items;
  }

  const nextItems = [...items];
  const [moved] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, moved);
  return nextItems;
}

export function moveItem(items: TimelineItem[], itemId: string, direction: -1 | 1): TimelineItem[] {
  const index = items.findIndex((item) => item.id === itemId);
  const targetIndex = index + direction;

  if (index < 0 || targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const [moved] = nextItems.splice(index, 1);
  nextItems.splice(targetIndex, 0, moved);
  return nextItems;
}

export function toggleBundle(items: TimelineItem[], itemId: string): TimelineItem[] {
  return items.map((item) =>
    item.id === itemId && item.kind === "bundle"
      ? { ...item, isExpanded: !item.isExpanded, updatedAt: nowTimestamp() }
      : item,
  );
}

export function sumSegmentMinutes(segments: BundleSegment[]): number {
  return segments.reduce((total, segment) => total + normalizeMinutes(segment.minutes), 0);
}

export function itemUsefulMinutes(item: TimelineItem): number {
  if (item.kind === "bundle") {
    return item.segments
      .filter((segment) => segment.timeValue === "useful")
      .reduce((total, segment) => total + normalizeMinutes(segment.minutes), 0);
  }

  return item.timeValue === "useful" ? normalizeMinutes(item.actualMinutes ?? item.plannedMinutes) : 0;
}

export function itemNonUsefulMinutes(item: TimelineItem): number {
  if (item.kind === "bundle") {
    return item.segments
      .filter((segment) => segment.timeValue === "non-useful")
      .reduce((total, segment) => total + normalizeMinutes(segment.minutes), 0);
  }

  return item.timeValue === "non-useful" ? normalizeMinutes(item.actualMinutes ?? item.plannedMinutes) : 0;
}

export function normalizeMinutes(value: number | undefined): number {
  if (!Number.isFinite(value) || value === undefined) {
    return 0;
  }

  return Math.max(0, Math.round(value));
}

function normalizeOptionalMinutes(value: number | undefined): number | undefined {
  if (value === undefined || Number.isNaN(value)) {
    return undefined;
  }

  return normalizeMinutes(value);
}
