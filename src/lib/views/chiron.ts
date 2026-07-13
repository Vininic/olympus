/** Read-only view model for Chiron study index.
 *  Parses the "chiron-index" user_data row and extracts study overview. */

export interface ChironView {
  totalSources: number;
  totalNodes: number;
  dueCards: number;
  streak: number;
  totalPoints: number;
  lastStudyDate: string | null;
  totalSessions: number;
}

export function parseChiron(raw: Record<string, unknown>): ChironView | null {
  try {
    const today = new Date().toISOString().split("T")[0];
    const score = raw.score as Record<string, unknown> | undefined;
    const cards = raw.cards as Record<string, unknown>[] | undefined;
    const sessions = raw.sessions as Record<string, unknown>[] | undefined;
    const sources = raw.sources as Record<string, unknown>[] | undefined;
    const nodes = raw.nodes as Record<string, unknown>[] | undefined;

    const dueCards = (cards || []).filter((c: any) => {
      if (!c.dueDate) return false;
      return c.dueDate <= today;
    }).length;

    return {
      totalSources: (sources || []).length,
      totalNodes: (nodes || []).length,
      dueCards,
      streak: (score?.streak as number) || 0,
      totalPoints: (score?.total as number) || 0,
      lastStudyDate: (score?.lastStudyDate as string) || null,
      totalSessions: (sessions || []).length,
    };
  } catch {
    return null;
  }
}
