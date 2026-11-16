import { describe, expect, it } from "vitest";
import { baseTitle, sameThing } from "./goals";

describe("possible duplicate (009 G9)", () => {
  it("drops case, a trailing amount, and a period label", () => {
    expect(baseTitle("Lumbar exercises 6×")).toBe("lumbar exercises");
    expect(baseTitle("Main job 20 h")).toBe("main job");
    expect(baseTitle("Gym · Nov")).toBe("gym");
  });

  it("compares activities when both goals track some, titles otherwise", () => {
    expect(sameThing({ title: "Daily close 7×", activityIds: ["a"] }, { title: "Review 6×", activityIds: ["a"] })).toBe(true);
    expect(sameThing({ title: "Read 2×", activityIds: ["a"] }, { title: "Read 2×", activityIds: ["b"] })).toBe(false);
    expect(sameThing({ title: "Lumbar exercises 7×", activityIds: [] }, { title: "lumbar exercises", activityIds: ["a"] })).toBe(true);
    expect(sameThing({ title: "Painting session", activityIds: [] }, { title: "Painting", activityIds: [] })).toBe(false);
  });
});
