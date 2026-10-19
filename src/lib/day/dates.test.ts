import { describe, expect, it } from "vitest";
import { addDays, formatMinutes, isDate, todayIn } from "./dates";

describe("dates", () => {
  it("adds days across month ends", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("validates calendar dates", () => {
    expect(isDate("2026-02-28")).toBe(true);
    expect(isDate("2026-02-30")).toBe(false);
    expect(isDate("today")).toBe(false);
  });

  it("finds today in a time zone", () => {
    expect(todayIn("America/Sao_Paulo", new Date("2026-10-19T02:00:00Z"))).toBe("2026-10-18");
  });

  it("formats minutes compactly", () => {
    expect(formatMinutes(45)).toBe("45m");
    expect(formatMinutes(120)).toBe("2h");
    expect(formatMinutes(110)).toBe("1h50");
    expect(formatMinutes(-30)).toBe("−30m");
  });
});
