import { describe, expect, it } from "vitest";
import { chainOf, childrenOf, countedPaths, groupMinutes, siblingsOf, topLevel } from "./groups";
import type { Entry } from "./types";

const e = (id: string, orderKey: string, extra: Partial<Entry> = {}) =>
  ({ id, orderKey, groupId: null, kind: "item", status: "planned", plannedMinutes: 30, ...extra }) as Entry;

const day = [
  e("lunch", "a2"),
  e("jib", "a1", { kind: "heading", plannedMinutes: 0 }),
  e("review", "a1", { groupId: "jib" }),
  e("standup", "a0", { groupId: "jib", plannedMinutes: 15 }),
  e("gym", "a0"),
  e("dropped", "a2", { groupId: "jib", status: "cancelled" }),
];

describe("groups", () => {
  it("orders the top level and each group by key", () => {
    expect(topLevel(day).map((x) => x.id)).toEqual(["gym", "jib", "lunch"]);
    expect(childrenOf(day, "jib").map((x) => x.id)).toEqual(["standup", "review", "dropped"]);
  });

  it("finds the entries an entry moves among", () => {
    expect(siblingsOf(day, day[2] as Entry).map((x) => x.id)).toEqual(["standup", "review", "dropped"]);
    expect(siblingsOf(day, day[0] as Entry).map((x) => x.id)).toEqual(["gym", "jib", "lunch"]);
  });

  it("totals a group without cancelled entries", () => {
    expect(groupMinutes(day, "jib")).toBe(45);
  });

  it("walks an objective's parents, each once, and stops on loops", () => {
    const objectives = [
      { id: "w", title: "English 4×", horizon: "week", parentIds: ["m"] },
      { id: "m", title: "20 h", horizon: "month", parentIds: ["y", "y2"] },
      { id: "y", title: "B2", horizon: "year", parentIds: ["l"] },
      { id: "y2", title: "Classes", horizon: "year", parentIds: ["l"] },
      { id: "l", title: "Fluent", horizon: "y5", parentIds: [] },
      { id: "loop", title: "Loop", horizon: "week", parentIds: ["loop"] },
    ];
    expect(chainOf(objectives, "w").map((o) => o.id)).toEqual(["w", "m", "y", "y2", "l"]);
    expect(chainOf(objectives, "loop").map((o) => o.id)).toEqual(["loop"]);
    expect(chainOf(objectives, "missing")).toEqual([]);
  });

  // 007 finding 7: a task counting for six goals whose paths join above drew
  // the top goal six times.
  it("draws what a task counts for from its direct goals, each goal once", () => {
    const objectives = [
      { id: "week", title: "Class 2×", horizon: "week", parentIds: ["month"] },
      { id: "month", title: "Class · Nov", horizon: "month", parentIds: ["classes"] },
      { id: "classes", title: "Classes", horizon: "year", parentIds: ["fluent"] },
      { id: "b2", title: "Reach B2", horizon: "year", parentIds: ["fluent", "job"] },
      { id: "fluent", title: "Fluent", horizon: "y5", parentIds: ["career"] },
      { id: "job", title: "Job", horizon: "y5", parentIds: ["career"] },
      { id: "career", title: "Career", horizon: "y15", parentIds: [] },
    ];
    const paths = countedPaths(objectives, ["career", "job", "fluent", "b2", "week", "month", "classes"]);
    expect(paths.map((p) => p.map((o) => o.id))).toEqual([["b2", "fluent", "job", "career"], ["week", "month", "classes"]]);
    expect(paths.flat()).toHaveLength(7);
    expect(countedPaths(objectives, [])).toEqual([]);
  });
});
