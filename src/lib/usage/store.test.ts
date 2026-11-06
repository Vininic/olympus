import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { densify, summarize, type UsageLedger } from "./store";

const NOW = new Date("2026-08-20T12:00:00");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

function day(date: string, messages = 0, tokens = 0) {
  return { date, messages, tokens, panelsOpened: 0, apps: {}, chats: 0 };
}

describe("densify", () => {
  it("returns one entry per day, oldest first, filling the gaps", () => {
    const ledger: UsageLedger = { version: 1, days: [day("2026-08-18", 3)] };
    const rows = densify(ledger, 4);
    expect(rows.map((r) => r.date)).toEqual(["2026-08-17", "2026-08-18", "2026-08-19", "2026-08-20"]);
    expect(rows.map((r) => r.messages)).toEqual([0, 3, 0, 0]);
  });
});

describe("summarize", () => {
  it("windows totals over 7 and 30 days", () => {
    const ledger: UsageLedger = {
      version: 1,
      days: [day("2026-08-19", 5, 400), day("2026-08-01", 9, 900)],
    };
    const s = summarize(ledger);
    expect(s.messages7).toBe(5);
    expect(s.messages30).toBe(14);
    expect(s.tokens30).toBe(1300);
  });

  it("counts a streak that ends yesterday, without requiring activity today", () => {
    const ledger: UsageLedger = {
      version: 1,
      days: [day("2026-08-18", 1), day("2026-08-19", 1)],
    };
    expect(summarize(ledger).streak).toBe(2);
  });

  it("breaks the streak on a gap", () => {
    const ledger: UsageLedger = {
      version: 1,
      days: [day("2026-08-15", 1), day("2026-08-19", 1)],
    };
    expect(summarize(ledger).streak).toBe(1);
  });

  it("ranks app launches across the whole ledger", () => {
    const ledger: UsageLedger = {
      version: 1,
      days: [
        { ...day("2026-08-19"), apps: { kairos: 2, pluto: 1 } },
        { ...day("2026-08-20"), apps: { pluto: 5 } },
      ],
    };
    expect(summarize(ledger).appLaunches).toEqual([
      { app: "pluto", count: 6 },
      { app: "kairos", count: 2 },
    ]);
  });
});
