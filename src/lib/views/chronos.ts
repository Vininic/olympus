/** Read-only view model for Chronos schedule.
 *  Parses the "schedule" user_data row and extracts today's overview. */

export interface ChronosView {
  currentBlock: string | null;
  nextBlock: string | null;
  remainingFocusHours: number;
  totalBlocksToday: number;
  completedBlocksToday: number;
}

export function parseChronos(raw: Record<string, unknown>): ChronosView | null {
  try {
    const today = new Date().toISOString().split("T")[0];
    const dayOfWeek = new Date().getDay();

    const commitments = raw.commitments as Record<string, unknown>[] | undefined;
    const routine = raw.routine as Record<string, unknown>[] | undefined;

    const todayCommitments = (commitments || []).filter((c: any) => {
      if (c.date === today) return true;
      if (c.day !== undefined && c.day === dayOfWeek && !c.date) return true;
      if (c.start && c.start <= today && (!c.endDate || c.endDate >= today)) return true;
      return false;
    });

    const todayRoutine = (routine || []).filter((r: any) => r.day === dayOfWeek);

    const allBlocks = [...todayCommitments, ...todayRoutine].sort((a: any, b: any) => {
      return (a.start || "").localeCompare(b.start || "");
    });

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let currentBlock: string | null = null;
    let nextBlock: string | null = null;

    for (const block of allBlocks) {
      const start = block.start as string;
      const end = block.end as string;
      if (!start || !end) continue;
      const [sh, sm] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;

      if (currentMinutes >= startMin && currentMinutes < endMin) {
        currentBlock = (block.title || block.titleCustom || "") as string;
      }
      if (!currentBlock && startMin > currentMinutes) {
        nextBlock = (block.title || block.titleCustom || "") as string;
        break;
      }
    }

    const workdayStart = (raw.meta as any)?.workdayStart || "09:00";
    const workdayEnd = (raw.meta as any)?.workdayEnd || "18:00";
    const [wsH, wsM] = workdayStart.split(":").map(Number);
    const [weH, weM] = workdayEnd.split(":").map(Number);
    let remaining = (weH * 60 + weM) - Math.max(currentMinutes, wsH * 60 + wsM);
    remaining = Math.max(0, remaining) / 60;

    return {
      currentBlock,
      nextBlock,
      remainingFocusHours: Math.round(remaining * 10) / 10,
      totalBlocksToday: allBlocks.length,
      completedBlocksToday: todayCommitments.filter((c: any) => c.done).length,
    };
  } catch {
    return null;
  }
}
