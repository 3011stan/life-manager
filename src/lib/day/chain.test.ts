import { describe, expect, it } from "vitest";
import { goalOptions, matchGoals, nextHorizon, skipsLevel } from "./chain";

const goals = [
  { id: "w1", title: "Gym 4×", horizon: "week" as const, parentIds: ["m"] },
  { id: "w2", title: "Inglês", horizon: "week" as const, parentIds: [] },
  { id: "m", title: "Gym · Nov", horizon: "month" as const, parentIds: ["y"] },
  { id: "y", title: "Gym", horizon: "year" as const, parentIds: ["l"] },
  { id: "l", title: "Fit body", horizon: "y5" as const, parentIds: [] },
];

// 007 E1, E3.
describe("goal chain in the interface", () => {
  it("names the horizon right above, and marks links that skip a level", () => {
    expect(nextHorizon("day")).toBe("week");
    expect(nextHorizon("week")).toBe("month");
    expect(nextHorizon("y10")).toBe("y15");
    expect(nextHorizon("y15")).toBe("y20");
    expect(skipsLevel({ horizon: "week" }, { horizon: "month" })).toBe(false);
    expect(skipsLevel({ horizon: "week" }, { horizon: "year" })).toBe(true);
    expect(skipsLevel({ horizon: "year" }, { horizon: "y15" })).toBe(true);
  });

  it("offers only goals of one horizon, each with its path", () => {
    expect(goalOptions(goals, "week")).toEqual([
      { id: "w1", title: "Gym 4×", horizon: "week", path: "Gym · Nov › Gym › Fit body" },
      { id: "w2", title: "Inglês", horizon: "week", path: "" },
    ]);
  });

  it("finds goals by title or path, at most 8, without accents or case", () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ id: String(i), title: `Goal ${String(i)}`, horizon: "week" as const, path: "" }));
    expect(matchGoals(many, "", [])).toHaveLength(8);
    expect(matchGoals(goalOptions(goals, "week"), "ingles", []).map((o) => o.id)).toEqual(["w2"]);
    expect(matchGoals(goalOptions(goals, "week"), "fit", []).map((o) => o.id)).toEqual(["w1"]);
    expect(matchGoals(goalOptions(goals, "week"), "", ["w1"]).map((o) => o.id)).toEqual(["w2"]);
  });
});
