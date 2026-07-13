import { describe, it, expect } from "vitest";
import { parseKairos } from "./kairos";

const today = new Date().toISOString().split("T")[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

const mockBoard = {
  meta: { version: 3 },
  projects: [{ id: "p1", name: "Test", color: "#B96A82", labels: [], createdAt: "2026-01-01" }],
  tasks: [
    { id: "t1", projectId: "p1", title: "Overdue task", status: "todo", dueDate: yesterday, labels: [], order: 0, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
    { id: "t2", projectId: "p1", title: "Due today", status: "doing", dueDate: today, labels: [], order: 1, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
    { id: "t3", projectId: "p1", title: "Done today", status: "done", completedAt: today + "T10:00:00", labels: [], order: 2, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  ],
};

describe("parseKairos", () => {
  it("returns null for empty input", () => {
    expect(parseKairos({})).toBeNull();
  });

  it("counts overdue and due today tasks", () => {
    const view = parseKairos(mockBoard as any);
    expect(view).not.toBeNull();
    expect(view!.overdue).toBe(1);
    expect(view!.dueToday).toBe(1);
    expect(view!.doneToday).toBe(1);
    expect(view!.doing).toBe(1);
    expect(view!.totalProjects).toBe(1);
  });
});
