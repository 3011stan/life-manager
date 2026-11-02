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

  it("offers only goals of one horizon, each with its path and the goal right above", () => {
    expect(goalOptions(goals, "week")).toEqual([
      { id: "w1", title: "Gym 4×", horizon: "week", path: "Gym · Nov › Gym › Fit body", parentTitle: "Gym · Nov" },
      { id: "w2", title: "Inglês", horizon: "week", path: "", parentTitle: null },
    ]);
  });

  it("finds goals by title or path, at most 8, without accents or case", () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ id: String(i), title: `Goal ${String(i)}`, horizon: "week" as const, path: "", parentTitle: null }));
    expect(matchGoals(many, "", []).groups.flatMap((g) => g.options)).toHaveLength(8);
    const ids = (q: string, chosen: string[] = []) => matchGoals(goalOptions(goals, "week"), q, chosen).groups.flatMap((g) => g.options.map((o) => o.id));
    expect(ids("ingles")).toEqual(["w2"]);
    expect(ids("fit")).toEqual(["w1"]);
    expect(ids("", ["w1"])).toEqual(["w2"]);
  });

  // 007b F5: the picker says how many more match, and groups by the goal above.
  it("groups the goals shown under the goal above, those with none last, and counts the rest", () => {
    const option = (id: string, parentTitle: string | null) => ({ id, title: `Goal ${id}`, horizon: "year" as const, path: parentTitle ?? "", parentTitle });
    const options = [option("a", "Health"), option("b", null), option("c", "Career"), option("d", "Health"), ...Array.from({ length: 8 }, (_, i) => option(`z${String(i)}`, "Money"))];
    const { groups, more } = matchGoals(options, "", []);
    expect(groups.map((g) => [g.parent, g.options.map((o) => o.id)])).toEqual([
      ["Career", ["c"]],
      ["Health", ["a", "d"]],
      ["Money", ["z0", "z1", "z2", "z3", "z4"]],
    ]);
    expect(more).toBe(4);
    const few = matchGoals(options, "goal a", []);
    expect(few).toEqual({ groups: [{ parent: "Health", options: [options[0]] }], more: 0 });
    expect(matchGoals([option("b", null)], "", []).groups).toEqual([{ parent: null, options: [option("b", null)] }]);
  });
});
