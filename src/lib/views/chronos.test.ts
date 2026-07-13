import { describe, it, expect } from "vitest";
import { parseChronos } from "./chronos";

const mockSchedule = {
  meta: { version: 5, workdayStart: "09:00", workdayEnd: "18:00" },
  categories: [],
  routine: [
    { id: "r1", day: new Date().getDay(), start: "09:00", end: "10:00", title: "Morning focus", kind: "deep" },
    { id: "r2", day: new Date().getDay(), start: "14:00", end: "15:30", title: "Deep work", kind: "deep" },
  ],
  commitments: [],
  presets: [],
  suggestions: [],
  goals: [],
  ledger: { compositionScore: 0, metrics: [], scheduledHours: [] },
  progressSnapshots: [],
};

describe("parseChronos", () => {
  it("returns zeroed view for empty input", () => {
    const view = parseChronos({});
    expect(view).not.toBeNull();
    expect(view!.totalBlocksToday).toBe(0);
  });

  it("parses routine blocks", () => {
    const view = parseChronos(mockSchedule as any);
    expect(view).not.toBeNull();
    expect(view!.totalBlocksToday).toBe(2);
  });

  it("returns remaining focus hours", () => {
    const view = parseChronos(mockSchedule as any);
    expect(view!.remainingFocusHours).toBeGreaterThanOrEqual(0);
  });
});
