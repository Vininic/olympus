/** Kairos' central piece: what is actually on the plate right now.
 *  Overdue first, then due today, then in-progress — the ordering IS the
 *  feature; a flat task dump would just be the board again, smaller. */

import { asArray, num, str, today, type NowPanel, type TaskItem } from "./types";

const PRIORITY_RANK: Record<string, number> = {
  urgent: 0, high: 1, medium: 2, low: 3, none: 4,
};

export function parseNow(raw: Record<string, unknown> | null, limit = 8): NowPanel | null {
  if (!raw) return null;
  try {
    const tasks = asArray(raw.tasks);
    if (tasks.length === 0 && !Array.isArray(raw.tasks)) return null;

    const projects = new Map(
      asArray(raw.projects).map((p) => [str(p.id), { name: str(p.name, "Projeto"), color: str(p.color) }]),
    );
    const day = today();

    const live = tasks.filter((t) => !t.archivedAt && str(t.status) !== "done");

    const mapped: TaskItem[] = live.map((t, i) => {
      const dueDate = str(t.dueDate) || null;
      const project = projects.get(str(t.projectId));
      return {
        id: str(t.id, `task-${i}`),
        title: str(t.title) || str(t.name) || "Tarefa",
        project: project?.name ?? null,
        projectColor: project?.color || undefined,
        dueDate,
        status: str(t.status, "todo"),
        overdue: !!dueDate && dueDate < day,
        dueToday: dueDate === day,
        priority: str(t.priority, "none"),
      };
    });

    const rank = (t: TaskItem) =>
      t.overdue ? 0 : t.dueToday ? 1 : t.status === "doing" ? 2 : 3;

    const relevant = mapped
      .filter((t) => rank(t) < 3)
      .sort((a, b) => {
        const byRank = rank(a) - rank(b);
        if (byRank !== 0) return byRank;
        const byPriority = (PRIORITY_RANK[a.priority] ?? 4) - (PRIORITY_RANK[b.priority] ?? 4);
        if (byPriority !== 0) return byPriority;
        return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
      })
      .slice(0, limit);

    return {
      kind: "now",
      tasks: relevant,
      overdue: mapped.filter((t) => t.overdue).length,
      dueToday: mapped.filter((t) => t.dueToday).length,
      doing: mapped.filter((t) => t.status === "doing").length,
      doneToday: tasks.filter((t) => str(t.completedAt).startsWith(day)).length,
    };
  } catch {
    return null;
  }
}

/** Exposed for the docs index — Kairos projects are documents in the
 *  Office sense: the things you actually open. */
export function kairosProjects(raw: Record<string, unknown> | null) {
  if (!raw) return [];
  const tasks = asArray(raw.tasks);
  return asArray(raw.projects).map((p) => {
    const id = str(p.id);
    const own = tasks.filter((t) => str(t.projectId) === id && !t.archivedAt);
    const updatedAt = own
      .map((t) => str(t.updatedAt) || str(t.completedAt) || str(t.createdAt))
      .filter(Boolean)
      .sort()
      .pop() ?? str(p.updatedAt) ?? str(p.createdAt);
    return {
      id,
      title: str(p.name, "Projeto"),
      color: str(p.color) || undefined,
      count: own.length,
      open: own.filter((t) => str(t.status) !== "done").length,
      updatedAt: updatedAt || null,
      archived: !!p.archivedAt,
      order: num(p.order, 0),
    };
  });
}
