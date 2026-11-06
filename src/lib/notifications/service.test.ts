import { describe, expect, it } from "vitest";
import { inQuietHours } from "./service";
import { defaultNotifications } from "@/lib/prefs/types";

function prefs(from: string, to: string) {
  return { ...defaultNotifications(), quietHours: { enabled: true, from, to } };
}

describe("inQuietHours", () => {
  it("is off when quiet hours are disabled", () => {
    expect(inQuietHours(defaultNotifications(), new Date("2026-08-20T03:00:00"))).toBe(false);
  });

  it("handles a window that wraps midnight", () => {
    const p = prefs("22:00", "07:00");
    expect(inQuietHours(p, new Date("2026-08-20T23:30:00"))).toBe(true);
    expect(inQuietHours(p, new Date("2026-08-20T03:00:00"))).toBe(true);
    expect(inQuietHours(p, new Date("2026-08-20T12:00:00"))).toBe(false);
  });

  it("handles a same-day window", () => {
    const p = prefs("09:00", "17:00");
    expect(inQuietHours(p, new Date("2026-08-20T10:00:00"))).toBe(true);
    expect(inQuietHours(p, new Date("2026-08-20T18:00:00"))).toBe(false);
  });

  it("treats the end of the window as exclusive", () => {
    const p = prefs("22:00", "07:00");
    expect(inQuietHours(p, new Date("2026-08-20T07:00:00"))).toBe(false);
  });
});
