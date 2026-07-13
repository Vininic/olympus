/** Read-only view model for Hermes outbox.
 *  Parses the "hermes-outbox" user_data row and extracts delivery overview. */

export interface HermesView {
  pendingCount: number;
  failedCount: number;
  sentToday: number;
  lastDeliveryAt: string | null;
}

export function parseHermes(raw: Record<string, unknown>): HermesView | null {
  try {
    const today = new Date().toISOString().split("T")[0];
    const messages = raw.messages as Record<string, unknown>[] | undefined;

    if (!messages) return null;

    const pendingCount = messages.filter((m: any) => m.status === "pending").length;
    const failedCount = messages.filter((m: any) => m.status === "failed").length;
    const sentToday = messages.filter((m: any) => m.status === "sent" && m.sentAt && String(m.sentAt).startsWith(today)).length;

    const sentMessages = messages.filter((m: any) => m.status === "sent" && m.sentAt);
    sentMessages.sort((a: any, b: any) => (b.sentAt || "").localeCompare(a.sentAt || ""));
    const lastDeliveryAt: string | null = sentMessages.length > 0 ? String(sentMessages[0].sentAt) : null;

    return { pendingCount, failedCount, sentToday, lastDeliveryAt };
  } catch {
    return null;
  }
}
