import { describe, it, expect } from "vitest";
import { parseChiron } from "./chiron";

const mockIndex = {
  version: 1,
  sources: [{ id: "s1", kind: "stack", name: "Python", addedAt: "2026-01-01", version: 1 }],
  nodes: [{ id: "n1", sourceId: "s1", title: "Functions", kind: "concept", requires: [], mastery: 2 }],
  cards: [
    { id: "c1", sourceId: "s1", nodeId: "n1", frontMd: "Q?", backMd: "A!", ease: 250, intervalDays: 5, dueDate: "2020-01-01", lapses: 0, reps: 1 },
    { id: "c2", sourceId: "s1", nodeId: "n1", frontMd: "Q2?", backMd: "A2!", ease: 250, intervalDays: 30, dueDate: "2099-01-01", lapses: 0, reps: 3 },
  ],
  attempts: [],
  sessions: [{ id: "ses1", date: "2026-01-01", budgetMin: 25, blocks: [] }],
  score: { total: 150, streak: 3, lastStudyDate: "2026-01-01" },
};

describe("parseChiron", () => {
  it("returns zeroed view for empty input", () => {
    const view = parseChiron({});
    expect(view).not.toBeNull();
    expect(view!.totalSources).toBe(0);
  });

  it("counts due cards", () => {
    const view = parseChiron(mockIndex as any);
    expect(view).not.toBeNull();
    expect(view!.totalSources).toBe(1);
    expect(view!.totalNodes).toBe(1);
    expect(view!.dueCards).toBe(1);
    expect(view!.streak).toBe(3);
    expect(view!.totalPoints).toBe(150);
    expect(view!.totalSessions).toBe(1);
  });
});
