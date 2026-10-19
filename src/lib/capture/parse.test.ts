import { describe, expect, it } from "vitest";
import { parseCapture } from "./parse";

const activities = [
  { id: "gym", name: "Academia" },
  { id: "gym-en", name: "Gym" },
  { id: "read", name: "Leitura" },
  { id: "px", name: "Projeto X" },
];

const one = (line: string) => parseCapture(line, activities)[0];

describe("capture parser (FR-042, FR-043, research R8)", () => {
  it("reads the 001 quickstart lines without mixing start times and durations (001 F1)", () => {
    expect(one("fiz standup")).toMatchObject({ title: "Standup", status: "completed", startTime: null, minutes: null });
    expect(one("academia 19h")).toMatchObject({ title: "Academia", startTime: "19:00", minutes: null, activityId: "gym", status: "planned" });
    expect(one("trabalhei no projeto X umas 2h")).toMatchObject({ title: "Projeto X", minutes: 120, startTime: null, status: "completed", activityId: "px" });
    expect(one("nao fiz leitura")).toMatchObject({ title: "Leitura", status: "skipped", activityId: "read" });
    expect(one("preciso marcar futevolei amanha")).toMatchObject({ status: "planned", startTime: null, minutes: null });
  });

  it("reads English lines", () => {
    expect(one("gym at 7pm")).toMatchObject({ title: "Gym", startTime: "19:00", minutes: null, activityId: "gym-en" });
    expect(one("worked on the report for 90 min")).toMatchObject({ title: "The report", minutes: 90, status: "completed" });
    expect(one("didn't read")).toMatchObject({ status: "skipped" });
    expect(one("call mom at 18:30")).toMatchObject({ title: "Call mom", startTime: "18:30" });
  });

  it("tells short durations from start hours", () => {
    expect(one("estudei 1h30")).toMatchObject({ minutes: 90, startTime: null });
    expect(one("reunião às 9")).toMatchObject({ startTime: "09:00", minutes: null });
    expect(one("reunião 9h30")).toMatchObject({ startTime: "09:30", minutes: null });
    expect(one("caminhada 45 minutos")).toMatchObject({ minutes: 45, startTime: null });
    expect(one("estudei 2 horas")).toMatchObject({ minutes: 120 });
  });

  it("skips empty lines and keeps the source text", () => {
    const result = parseCapture("fiz standup\n\n  \nacademia 19h", activities);
    expect(result).toHaveLength(2);
    expect(result[1]?.source).toBe("academia 19h");
  });

  it("links the longest matching activity name", () => {
    expect(parseCapture("academia leitura", [...activities, { id: "acad-read", name: "Academia leitura" }])[0]?.activityId).toBe("acad-read");
  });
});
