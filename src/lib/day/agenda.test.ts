import { describe, expect, it } from "vitest";
import { agendaMonths, isPlanningKey, weekdayNames, weekdaysLabel } from "./agenda";

const names = weekdayNames("en");

describe("agenda (006)", () => {
  it("names weekdays from Sunday in the language", () => {
    expect(names).toEqual(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
    expect(weekdayNames("pt-BR")[1]?.toLowerCase()).toMatch(/^seg/);
  });

  it("writes a run of days as a range and others as a list", () => {
    expect(weekdaysLabel([0, 1, 2, 3, 4, 5], names, "Every day")).toBe("Sun–Fri");
    expect(weekdaysLabel([1, 3, 5], names, "Every day")).toBe("Mon, Wed, Fri");
    expect(weekdaysLabel([5, 6, 0], names, "Every day")).toBe("Fri–Sun");
    expect(weekdaysLabel([0, 1, 2, 3, 4, 5, 6], names, "Every day")).toBe("Every day");
    expect(weekdaysLabel([2], names, "Every day")).toBe("Tue");
    expect(weekdaysLabel([1, 2], names, "Every day")).toBe("Mon, Tue");
  });

  it("lists the next 12 months from today's, the first two open", () => {
    const months = agendaMonths("2026-10-26", [
      { date: "2026-11-07" },
      { date: "2027-03-01" },
      { date: "2026-11-20" },
    ]);
    expect(months.map((m) => m.month)).toEqual(["2026-10", "2026-11", "2027-03"]);
    expect(months.map((m) => m.open)).toEqual([true, true, false]);
    expect(months[1]?.items.map((i) => i.date)).toEqual(["2026-11-07", "2026-11-20"]);
  });

  it("knows which queries a planning change touches", () => {
    expect(isPlanningKey(["/v1/days/2026-10-26"])).toBe(true);
    expect(isPlanningKey(["/v1/goals/tree", { date: "current" }])).toBe(true);
    expect(isPlanningKey(["/v1/catalog"])).toBe(false);
  });
});
