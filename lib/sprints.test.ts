import { describe, expect, it } from "vitest";
import { weekSprintBoundsISO, weekSprintName } from "@/lib/sprints";

describe("week sprints", () => {
  it("names the Mon–Sat week in BR day/month format", () => {
    expect(weekSprintName(new Date("2026-08-05T12:00:00"))).toBe(
      "Semana 03/08 – 08/08",
    );
  });

  it("returns ISO bounds Mon–Sat for the work week", () => {
    expect(weekSprintBoundsISO(new Date("2026-08-05T12:00:00"))).toEqual({
      start: "2026-08-03",
      end: "2026-08-08",
    });
  });

  it("keeps Saturday inside the same week as Monday", () => {
    expect(weekSprintBoundsISO(new Date("2026-08-08T12:00:00"))).toEqual({
      start: "2026-08-03",
      end: "2026-08-08",
    });
  });
});
