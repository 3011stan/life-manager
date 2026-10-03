export type ItemStatus =
  | "planned"
  | "completed"
  | "partial"
  | "skipped"
  | "cancelled";

export type ItemKind = "simple" | "bundle";

export type TimeValue = "useful" | "non-useful";

export type CarryDecision = "pending" | "confirmed" | "dismissed";

export type BundleSegment = {
  id: string;
  title: string;
  minutes: number;
  timeValue: TimeValue;
};

export type TimelineItem = {
  id: string;
  kind: ItemKind;
  title: string;
  status: ItemStatus;
  plannedMinutes: number;
  actualMinutes?: number;
  plannedStart?: string;
  notes?: string;
  isAlignmentRelevant: boolean;
  isDeepWork: boolean;
  timeValue: TimeValue;
  segments: BundleSegment[];
  isExpanded?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FreeformSuggestion = {
  id: string;
  sourceText: string;
  title: string;
  plannedMinutes?: number;
  actualMinutes?: number;
  plannedStart?: string;
  status: ItemStatus;
  accepted: boolean;
};

export type CarryForwardCandidate = {
  id: string;
  sourceItemId: string;
  title: string;
  targetDate?: string;
  decision: CarryDecision;
};

export type ScoreSummary = {
  executionScore: number;
  alignmentScore: number;
  plannedMinutes: number;
  actualMinutes: number;
  usefulMinutes: number;
  nonUsefulMinutes: number;
  deepWorkMinutes: number;
};

export type DailyCloseSummary = ScoreSummary & {
  closedAt: string;
  carryCandidates: CarryForwardCandidate[];
  notes?: string;
};

export type DailyCycle = {
  date: string;
  items: TimelineItem[];
  freeformText: string;
  freeformSuggestions: FreeformSuggestion[];
  closeSummary?: DailyCloseSummary;
  updatedAt: string;
};
