import { describe, it, expect } from "vitest";
import { parseHermes } from "./hermes";

const today = new Date().toISOString().split("T")[0];

const mockOutbox = {
  version: 1,
  messages: [
    { id: "m1", source: "pluto", channel: "email", template: "monthly-report", subject: "Report", status: "pending", createdAt: "2026-01-01", attempts: 0 },
    { id: "m2", source: "chronos", channel: "email", template: "digest", subject: "Digest", status: "failed", createdAt: "2026-01-01", error: "Timeout", attempts: 2 },
    { id: "m3", source: "kairos", channel: "telegram", template: "deadline-reminder", subject: "Reminder", status: "sent", createdAt: "2026-01-01", sentAt: today + "T08:00:00", attempts: 1 },
  ],
};

describe("parseHermes", () => {
  it("returns null for empty input", () => {
    expect(parseHermes({})).toBeNull();
  });

  it("counts pending and failed", () => {
    const view = parseHermes(mockOutbox as any);
    expect(view).not.toBeNull();
    expect(view!.pendingCount).toBe(1);
    expect(view!.failedCount).toBe(1);
    expect(view!.sentToday).toBe(1);
    expect(view!.lastDeliveryAt).toBe(today + "T08:00:00");
  });
});
