/** Hermes' central piece: the delivery queue.
 *  Failures first, then pending, then whatever went out — the only ordering
 *  that makes the panel worth a glance. */

import { asArray, str, today, type OutboxPanel, type QueueItem } from "./types";

function status(value: unknown): QueueItem["status"] {
  const s = str(value);
  return s === "sent" || s === "failed" ? s : "pending";
}

const RANK: Record<QueueItem["status"], number> = { failed: 0, pending: 1, sent: 2 };

export function parseOutbox(raw: Record<string, unknown> | null, limit = 8): OutboxPanel | null {
  if (!raw) return null;
  try {
    if (!Array.isArray(raw.messages)) return null;
    const day = today();
    const all = asArray(raw.messages);

    const messages: QueueItem[] = all
      .map((m, i) => ({
        id: str(m.id, `msg-${i}`),
        subject: str(m.subject) || str(m.template) || "Mensagem",
        channel: str(m.channel, "email"),
        source: str(m.source, "suite"),
        status: status(m.status),
        at: str(m.sentAt) || str(m.createdAt) || null,
        error: str(m.error) || undefined,
      }))
      .sort((a, b) => {
        const byRank = RANK[a.status] - RANK[b.status];
        if (byRank !== 0) return byRank;
        return (b.at ?? "").localeCompare(a.at ?? "");
      })
      .slice(0, limit);

    return {
      kind: "outbox",
      messages,
      pending: all.filter((m) => status(m.status) === "pending").length,
      failed: all.filter((m) => status(m.status) === "failed").length,
      sentToday: all.filter((m) => status(m.status) === "sent" && str(m.sentAt).startsWith(day)).length,
    };
  } catch {
    return null;
  }
}
