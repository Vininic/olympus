import { describe, it, expect } from "vitest";
import { parsePluto } from "./pluto";

const month = new Date().toISOString().slice(0, 7);

const mockLedger = {
  meta: { version: 1, currency: "BRL" },
  wallets: [{ id: "w1", name: "Nubank", type: "checking", color: "#C49A3A", createdAt: "2026-01-01" }],
  categories: [{ id: "c1", name: "Food", color: "#5E6B77", kind: "expense", createdAt: "2026-01-01" }],
  transactions: [
    { id: "tx1", walletId: "w1", type: "expense", amountCents: 5000, date: month + "-05", description: "Lunch", categoryId: "c1", source: "manual", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
    { id: "tx2", walletId: "w1", type: "income", amountCents: 100000, date: month + "-01", description: "Salary", source: "manual", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  ],
  budgets: [{ id: "b1", categoryId: "c1", monthCents: 30000 }],
  goals: [{ id: "g1", name: "PC upgrade", horizon: "short", targetCents: 500000, color: "#C49A3A", items: [], createdAt: "2026-01-01" }],
  contributions: [],
};

describe("parsePluto", () => {
  it("returns null for empty input", () => {
    expect(parsePluto({})).toBeNull();
  });

  it("parses income and expenses", () => {
    const view = parsePluto(mockLedger as any);
    expect(view).not.toBeNull();
    expect(view!.incomeMonthCents).toBe(100000);
    expect(view!.expenseMonthCents).toBe(5000);
    expect(view!.budgetAlertCount).toBe(0);
    expect(view!.goalProgressCount).toBe(1);
  });
});
