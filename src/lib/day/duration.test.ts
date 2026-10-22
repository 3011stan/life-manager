import { describe, expect, it } from "vitest";
import { parseDuration } from "./duration";

// 004 FR-011.
describe("parseDuration", () => {
  it.each([
    ["45", 45],
    ["45m", 45],
    ["45 min", 45],
    ["45 minutos", 45],
    ["1h", 60],
    ["2h", 120],
    ["1h30", 90],
    ["1h 30m", 90],
    ["1h30min", 90],
    ["1.5h", 90],
    ["1,5h", 90],
    ["2 horas", 120],
    ["2 hours", 120],
    ["0", 0],
    [" 30m ", 30],
  ])("reads %s as %i minutes", (input, minutes) => {
    expect(parseDuration(input)).toBe(minutes);
  });

  it.each(["", "abc", "1h99", "25h", "-5", "h"])("rejects %j", (input) => {
    expect(parseDuration(input)).toBeNull();
  });
});
