import { describe, expect, it } from "vitest";
import { progressText } from "./objectives";
import type { Objective } from "./types";

const base = { targetCount: null, targetMinutes: null, unit: null, startValue: null, targetValue: null, targetLevel: null, progress: 0, current: null } as unknown as Objective;

describe("progressText", () => {
  it("reads each target type", () => {
    expect(progressText({ ...base, targetType: "count", targetCount: 4, current: 3 })).toBe("3 / 4");
    expect(progressText({ ...base, targetType: "duration", targetMinutes: 1200, current: 170 })).toBe("2h50 / 20h");
    expect(progressText({ ...base, targetType: "value", startValue: 95, targetValue: 87, unit: "kg", current: 91 })).toBe("91 / 87 kg");
    expect(progressText({ ...base, targetType: "level", targetLevel: "C1", current: "B2" })).toBe("B2 → C1");
    expect(progressText({ ...base, targetType: "milestone", progress: 1 })).toBe("✓");
    expect(progressText({ ...base, targetType: "composite", progress: 0.666 })).toBe("67%");
  });
});
