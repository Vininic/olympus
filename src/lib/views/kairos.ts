/** Read-only view model for Kairos board.
 *  Parses the "kairos-board" user_data row and extracts task overview. */

export interface KairosView {
  totalProjects: number;
  totalTasks: number;
  dueToday: number;
  overdue: number;
  doing: number;
  doneToday: number;
}

export function parseKairos(raw: Record<string, unknown>): KairosView | null {
  try {
    const today = new Date().toISOString().split("T")[0];
    const tasks = raw.tasks as Record<string, unknown>[] | undefined;

    if (!tasks) return null;

    const dueToday = tasks.filter((t: any) => t.dueDate === today && t.status !== "done" && !t.archivedAt).length;
    const overdue = tasks.filter((t: any) => t.dueDate && t.dueDate < today && t.status !== "done" && !t.archivedAt).length;
    const doing = tasks.filter((t: any) => t.status === "doing" && !t.archivedAt).length;
    const doneToday = tasks.filter((t: any) => t.completedAt && t.completedAt.startsWith(today)).length;

    return {
      totalProjects: (raw.projects as any[])?.length || 0,
      totalTasks: tasks.length,
      dueToday,
      overdue,
      doing,
      doneToday,
    };
  } catch {
    return null;
  }
}
