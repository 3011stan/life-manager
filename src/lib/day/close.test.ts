import { describe, expect, it } from "vitest";
import { EMPTY_CHECK_IN, savedCheckIn } from "./close";

describe("a reopened day's close starts from what was saved (009b)", () => {
  it("keeps every saved check-in value", () => {
    expect(savedCheckIn({ physicalEnergy: 3, mentalEnergy: null, emotionalEnergy: 5, satisfaction: 4 })).toEqual({
      physicalEnergy: 3,
      mentalEnergy: null,
      emotionalEnergy: 5,
      satisfaction: 4,
    });
  });

  it("starts empty when the day has no check-in", () => {
    expect(savedCheckIn(null)).toEqual(EMPTY_CHECK_IN);
  });
});
