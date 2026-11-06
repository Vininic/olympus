/** Chronos' central piece: the day planner.
 *  Reads the `schedule` row and returns today's blocks in order, each already
 *  classified past/current/upcoming so the renderer stays dumb. */

import {
  asArray, minutesNow, num, str, toMinutes, today,
  type DayplannerPanel, type TimelineBlock,
} from "./types";

function blockTitle(b: Record<string, unknown>): string {
  return str(b.title) || str(b.titleCustom) || str(b.name) || "Bloco";
}

/** A Chronos entry belongs to today if it is dated today, or is a weekly
 *  routine for this weekday, or is an open-ended range covering today. */
function isToday(b: Record<string, unknown>, day: string, weekday: number): boolean {
  if (str(b.date) === day) return true;
  if (typeof b.day === "number" && b.day === weekday && !b.date) return true;
  const start = str(b.start);
  if (start && start.includes("-") && start <= day) {
    const endDate = str(b.endDate);
    return !endDate || endDate >= day;
  }
  return false;
}

export function parseDayplanner(raw: Record<string, unknown> | null): DayplannerPanel | null {
  if (!raw) return null;
  try {
    const day = today();
    const weekday = new Date().getDay();
    const nowMin = minutesNow();

    const commitments = asArray(raw.commitments).filter((c) => isToday(c, day, weekday));
    const routine = asArray(raw.routine).filter((r) => num(r.day, -1) === weekday);

    const blocks: TimelineBlock[] = [...commitments, ...routine]
      .map((b, i): TimelineBlock | null => {
        const start = str(b.start);
        const end = str(b.end);
        const startMin = toMinutes(start);
        const endMin = toMinutes(end);
        if (startMin === null || endMin === null) return null;
        const state: TimelineBlock["state"] =
          nowMin >= endMin ? "past" : nowMin >= startMin ? "current" : "upcoming";
        return {
          id: str(b.id, `block-${i}`),
          title: blockTitle(b),
          start,
          end,
          done: b.done === true,
          color: str(b.color) || undefined,
          state,
        };
      })
      .filter((b): b is TimelineBlock => b !== null)
      .sort((a, b) => a.start.localeCompare(b.start));

    const current = blocks.find((b) => b.state === "current") ?? null;
    const next = blocks.find((b) => b.state === "upcoming") ?? null;

    const meta = (raw.meta as Record<string, unknown>) ?? {};
    const workdayStart = str(meta.workdayStart) || "09:00";
    const workdayEnd = str(meta.workdayEnd) || "18:00";
    const endMin = toMinutes(workdayEnd) ?? 18 * 60;
    const startMin = toMinutes(workdayStart) ?? 9 * 60;
    const remaining = Math.max(0, endMin - Math.max(nowMin, startMin)) / 60;

    return {
      kind: "dayplanner",
      blocks,
      currentId: current?.id ?? null,
      nextId: next?.id ?? null,
      remainingFocusHours: Math.round(remaining * 10) / 10,
      workdayStart,
      workdayEnd,
      doneCount: blocks.filter((b) => b.done).length,
    };
  } catch {
    return null;
  }
}
