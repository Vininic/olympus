import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseDayplanner } from "./chronos";
import { kairosProjects, parseNow } from "./kairos";
import { parseBalance } from "./pluto";
import { parseOutbox } from "./hermes";
import { parseReview } from "./chiron";
import { orderedPanels } from "./index";

/** All five parsers read "today" and "now" off the clock, so every test here
 *  pins them; otherwise the suite passes at 10:00 and fails at 20:00. */
const NOW = new Date("2026-08-20T14:30:00");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("parseDayplanner", () => {
  const raw = {
    meta: { workdayStart: "09:00", workdayEnd: "18:00" },
    commitments: [
      { id: "a", date: "2026-08-20", start: "09:00", end: "10:30", title: "Revisão", done: true },
      { id: "b", date: "2026-08-20", start: "14:00", end: "15:00", title: "Foco" },
      { id: "c", date: "2026-08-19", start: "11:00", end: "12:00", title: "Ontem" },
      { id: "d", date: "2026-08-20", start: "16:00", end: "17:00", title: "Depois" },
    ],
    routine: [{ id: "r", day: 4, start: "07:00", end: "07:30", title: "Corrida" }],
  };

  it("keeps only today, sorted by start", () => {
    const panel = parseDayplanner(raw)!;
    // 2026-08-20 is a Thursday (day 4), so the routine entry belongs to today.
    expect(panel.blocks.map((b) => b.id)).toEqual(["r", "a", "b", "d"]);
  });

  it("classifies past, current and upcoming against the clock", () => {
    const panel = parseDayplanner(raw)!;
    expect(panel.blocks.find((b) => b.id === "a")!.state).toBe("past");
    expect(panel.blocks.find((b) => b.id === "b")!.state).toBe("current");
    expect(panel.blocks.find((b) => b.id === "d")!.state).toBe("upcoming");
    expect(panel.currentId).toBe("b");
    expect(panel.nextId).toBe("d");
  });

  it("computes remaining workday hours from now, not from the day start", () => {
    const panel = parseDayplanner(raw)!;
    expect(panel.remainingFocusHours).toBe(3.5);
  });

  it("drops blocks with unusable times instead of throwing", () => {
    const panel = parseDayplanner({ commitments: [{ id: "x", date: "2026-08-20", start: "nope", end: "" }] })!;
    expect(panel.blocks).toEqual([]);
  });

  it("returns null for a missing row", () => {
    expect(parseDayplanner(null)).toBeNull();
  });
});

describe("parseNow", () => {
  const raw = {
    projects: [{ id: "p1", name: "Olympus", color: "#B7863B" }],
    tasks: [
      { id: "t1", title: "Atrasada", projectId: "p1", dueDate: "2026-08-18", status: "todo", priority: "low" },
      { id: "t2", title: "Hoje urgente", projectId: "p1", dueDate: "2026-08-20", status: "todo", priority: "urgent" },
      { id: "t3", title: "Hoje normal", dueDate: "2026-08-20", status: "todo", priority: "none" },
      { id: "t4", title: "Fazendo", status: "doing", priority: "high" },
      { id: "t5", title: "Futura", dueDate: "2026-09-01", status: "todo", priority: "high" },
      { id: "t6", title: "Feita", status: "done", completedAt: "2026-08-20T10:00:00" },
      { id: "t7", title: "Arquivada", status: "todo", dueDate: "2026-08-01", archivedAt: "2026-08-02" },
    ],
  };

  it("orders overdue, then due today, then in progress", () => {
    const panel = parseNow(raw)!;
    expect(panel.tasks.map((t) => t.id)).toEqual(["t1", "t2", "t3", "t4"]);
  });

  it("breaks ties inside a bucket by priority", () => {
    const panel = parseNow(raw)!;
    const todayTasks = panel.tasks.filter((t) => t.dueToday);
    expect(todayTasks.map((t) => t.id)).toEqual(["t2", "t3"]);
  });

  it("resolves the project name and color", () => {
    const panel = parseNow(raw)!;
    expect(panel.tasks[0].project).toBe("Olympus");
    expect(panel.tasks[0].projectColor).toBe("#B7863B");
  });

  it("excludes archived and done tasks from the counts", () => {
    const panel = parseNow(raw)!;
    expect(panel.overdue).toBe(1);
    expect(panel.dueToday).toBe(2);
    expect(panel.doing).toBe(1);
    expect(panel.doneToday).toBe(1);
  });

  it("returns null when the row has no tasks array at all", () => {
    expect(parseNow({ projects: [] })).toBeNull();
  });
});

describe("kairosProjects", () => {
  it("counts open tasks and takes the newest touch as the timestamp", () => {
    const docs = kairosProjects({
      projects: [{ id: "p1", name: "Olympus", createdAt: "2026-01-01" }],
      tasks: [
        { id: "t1", projectId: "p1", status: "todo", updatedAt: "2026-08-19T10:00:00" },
        { id: "t2", projectId: "p1", status: "done", updatedAt: "2026-08-20T09:00:00" },
      ],
    });
    expect(docs[0].count).toBe(2);
    expect(docs[0].open).toBe(1);
    expect(docs[0].updatedAt).toBe("2026-08-20T09:00:00");
  });
});

describe("parseBalance", () => {
  const raw = {
    categories: [{ id: "c1", name: "Mercado", color: "#183427" }],
    budgets: [
      { id: "b1", categoryId: "c1", monthCents: 50_000 },
      { id: "b2", categoryId: "c2", monthCents: 20_000 },
    ],
    transactions: [
      { id: "x1", date: "2026-08-05", type: "income", amountCents: 300_000, description: "Salário" },
      { id: "x2", date: "2026-08-10", type: "expense", amountCents: 60_000, categoryId: "c1", description: "Feira" },
      { id: "x3", date: "2026-07-30", type: "expense", amountCents: 99_000, description: "Mês passado" },
    ],
  };

  it("sums only the current month", () => {
    const panel = parseBalance(raw)!;
    expect(panel.incomeCents).toBe(300_000);
    expect(panel.expenseCents).toBe(60_000);
    expect(panel.netCents).toBe(240_000);
  });

  it("puts the most pressured budget first and exposes the overrun as ratio > 1", () => {
    const panel = parseBalance(raw)!;
    expect(panel.budgets[0].id).toBe("b1");
    expect(panel.budgets[0].ratio).toBeCloseTo(1.2);
    expect(panel.budgets[0].name).toBe("Mercado");
  });

  it("lists recent transactions newest first, across months", () => {
    const panel = parseBalance(raw)!;
    expect(panel.recent.map((t) => t.id)).toEqual(["x2", "x1", "x3"]);
  });
});

describe("parseOutbox", () => {
  const raw = {
    messages: [
      { id: "m1", status: "sent", sentAt: "2026-08-20T08:00:00", subject: "Relatório" },
      { id: "m2", status: "pending", createdAt: "2026-08-20T09:00:00", subject: "Alerta" },
      { id: "m3", status: "failed", createdAt: "2026-08-19T09:00:00", subject: "Resumo", error: "timeout" },
      { id: "m4", status: "sent", sentAt: "2026-08-19T08:00:00", subject: "Antigo" },
    ],
  };

  it("surfaces failures first, then pending, then sent", () => {
    const panel = parseOutbox(raw)!;
    expect(panel.messages.map((m) => m.id)).toEqual(["m3", "m2", "m1", "m4"]);
  });

  it("counts today separately from the totals", () => {
    const panel = parseOutbox(raw)!;
    expect(panel.pending).toBe(1);
    expect(panel.failed).toBe(1);
    expect(panel.sentToday).toBe(1);
  });
});

describe("parseReview", () => {
  const raw = {
    sources: [
      { id: "s1", title: "Cálculo" },
      { id: "s2", title: "História" },
    ],
    cards: [
      { id: "c1", sourceId: "s1", dueDate: "2026-08-19" },
      { id: "c2", sourceId: "s1", dueDate: "2026-08-20" },
      { id: "c3", sourceId: "s1", dueDate: "2026-09-01" },
      { id: "c4", sourceId: "s2", dueDate: "2026-08-20" },
    ],
    score: { streak: 5, total: 320, lastStudyDate: "2026-08-20" },
  };

  it("groups due cards by source, most due first", () => {
    const panel = parseReview(raw)!;
    expect(panel.groups.map((g) => g.title)).toEqual(["Cálculo", "História"]);
    expect(panel.groups[0].due).toBe(2);
    expect(panel.groups[0].total).toBe(3);
  });

  it("treats a card due today as due", () => {
    const panel = parseReview(raw)!;
    expect(panel.dueTotal).toBe(3);
  });

  it("reads the streak and today flag from the score block", () => {
    const panel = parseReview(raw)!;
    expect(panel.streak).toBe(5);
    expect(panel.points).toBe(320);
    expect(panel.studiedToday).toBe(true);
  });
});

describe("orderedPanels", () => {
  it("honors an explicit order and appends the rest in registry order", () => {
    const ids = orderedPanels(["pluto-balance", "chronos-dayplanner"], []);
    expect(ids.slice(0, 2)).toEqual(["pluto-balance", "chronos-dayplanner"]);
    expect(ids).toHaveLength(5);
  });

  it("drops hidden panels and ignores unknown ids in the saved order", () => {
    const ids = orderedPanels(["nope" as never, "kairos-now"], ["hermes-outbox"]);
    expect(ids[0]).toBe("kairos-now");
    expect(ids).not.toContain("hermes-outbox");
    expect(ids).toHaveLength(4);
  });
});
