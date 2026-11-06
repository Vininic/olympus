/** Chiron's central piece: what is due for review, grouped by source.
 *  A single "17 cards due" number tells you nothing about where to start;
 *  grouping by source is what turns it into a decision. */

import { asArray, num, str, today, type ReviewGroup, type ReviewPanel } from "./types";

export function parseReview(raw: Record<string, unknown> | null): ReviewPanel | null {
  if (!raw) return null;
  try {
    const day = today();
    const cards = asArray(raw.cards);
    const sources = asArray(raw.sources);
    const score = (raw.score as Record<string, unknown>) ?? {};

    const bySource = new Map<string, { due: number; total: number }>();
    for (const card of cards) {
      const sourceId = str(card.sourceId, "—");
      const entry = bySource.get(sourceId) ?? { due: 0, total: 0 };
      entry.total += 1;
      const due = str(card.dueDate);
      if (due && due <= day) entry.due += 1;
      bySource.set(sourceId, entry);
    }

    const sourceNames = new Map(
      sources.map((s) => [str(s.id), { title: str(s.title) || str(s.name, "Fonte"), color: str(s.color) }]),
    );

    const groups: ReviewGroup[] = [...bySource.entries()]
      .map(([id, counts]) => ({
        id,
        title: sourceNames.get(id)?.title ?? "Sem fonte",
        due: counts.due,
        total: counts.total,
        color: sourceNames.get(id)?.color || undefined,
      }))
      .filter((g) => g.total > 0)
      .sort((a, b) => b.due - a.due || b.total - a.total)
      .slice(0, 6);

    return {
      kind: "review",
      groups,
      dueTotal: groups.reduce((sum, g) => sum + g.due, 0),
      streak: num(score.streak),
      points: num(score.total),
      studiedToday: str(score.lastStudyDate) === day,
    };
  } catch {
    return null;
  }
}

export function chironDocs(raw: Record<string, unknown> | null) {
  if (!raw) return [];
  const cards = asArray(raw.cards);
  return asArray(raw.sources).map((s) => {
    const id = str(s.id);
    return {
      id,
      title: str(s.title) || str(s.name, "Fonte"),
      cards: cards.filter((c) => str(c.sourceId) === id).length,
      updatedAt: str(s.updatedAt) || str(s.createdAt) || null,
    };
  });
}
