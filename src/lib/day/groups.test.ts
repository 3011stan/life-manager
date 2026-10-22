import { describe, expect, it } from "vitest";
import { chainOf, childrenOf, groupMinutes, siblingsOf, topLevel } from "./groups";
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

  it("walks an objective's parents and stops on loops", () => {
    const objectives = [
      { id: "w", title: "English 4×", horizon: "week", parentId: "m" },
      { id: "m", title: "20 h", horizon: "month", parentId: "y" },
      { id: "y", title: "B2", horizon: "year", parentId: null },
      { id: "loop", title: "Loop", horizon: "week", parentId: "loop" },
    ];
    expect(chainOf(objectives, "w").map((o) => o.id)).toEqual(["w", "m", "y"]);
    expect(chainOf(objectives, "loop").map((o) => o.id)).toEqual(["loop"]);
    expect(chainOf(objectives, "missing")).toEqual([]);
  });
});
