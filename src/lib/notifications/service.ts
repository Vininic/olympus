/** Desktop notifications for things that are actually worth interrupting for.
 *
 *  Rules run against the same mirrored sibling rows the panels read, so a
 *  notification never claims something the Home page would contradict. Every
 *  rule fires at most once per day per subject — the dedupe key is the whole
 *  design: a poll loop that renotifies every 15 seconds is worse than no
 *  notifications at all. */

import { buildPanels } from "@/lib/panels";
import { appById, type SuiteAppId } from "@/lib/suite/registry";
import type { NotificationPrefs } from "@/lib/prefs/types";

const SEEN_KEY = "olympus.notify.seen.v1";

export interface NotificationRule {
  id: string;
  app: SuiteAppId;
  title: string;
  body: string;
  /** Once per day per key. */
  dedupeKey: string;
}

export function permission(): NotificationPermission | "unsupported" {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

export async function requestPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

function readSeen(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function markSeen(key: string, day: string): void {
  const seen = readSeen();
  seen[key] = day;
  // Keep the map from growing forever: anything not from today is dead weight.
  const pruned = Object.fromEntries(Object.entries(seen).filter(([, d]) => d === day));
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(pruned)); } catch { /* noop */ }
}

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Quiet hours wrap midnight when `from` is later than `to` (22:00 → 07:00). */
export function inQuietHours(prefs: NotificationPrefs, now = new Date()): boolean {
  if (!prefs.quietHours.enabled) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  const from = minutesOf(prefs.quietHours.from);
  const to = minutesOf(prefs.quietHours.to);
  return from <= to ? cur >= from && cur < to : cur >= from || cur < to;
}

/** Pure: given the panels, what deserves a notification right now. */
export function collectRules(now = new Date()): NotificationRule[] {
  const rules: NotificationRule[] = [];
  const day = now.toISOString().split("T")[0];
  const panels = buildPanels();

  const dayplanner = panels.get("chronos-dayplanner");
  if (dayplanner?.body.kind === "dayplanner") {
    const next = dayplanner.body.blocks.find((b) => b.state === "upcoming");
    if (next) {
      const [h, m] = next.start.split(":").map(Number);
      const startsIn = (h * 60 + m) - (now.getHours() * 60 + now.getMinutes());
      if (startsIn > 0 && startsIn <= 10) {
        rules.push({
          id: `chronos-next-${next.id}`,
          app: "chronos",
          title: `${next.title} começa em ${startsIn} min`,
          body: `${next.start}–${next.end}`,
          dedupeKey: `chronos-next-${next.id}-${day}`,
        });
      }
    }
  }

  const now_ = panels.get("kairos-now");
  if (now_?.body.kind === "now" && now_.body.overdue > 0) {
    rules.push({
      id: "kairos-overdue",
      app: "kairos",
      title: `${now_.body.overdue} tarefa(s) atrasada(s)`,
      body: now_.body.tasks.filter((t) => t.overdue).slice(0, 3).map((t) => t.title).join(" · "),
      dedupeKey: `kairos-overdue-${day}`,
    });
  }

  const balance = panels.get("pluto-balance");
  if (balance?.body.kind === "balance") {
    const over = balance.body.budgets.filter((b) => b.ratio > 1);
    if (over.length > 0) {
      rules.push({
        id: "pluto-budget",
        app: "pluto",
        title: `${over.length} orçamento(s) estourado(s)`,
        body: over.slice(0, 3).map((b) => b.name).join(" · "),
        dedupeKey: `pluto-budget-${day}`,
      });
    }
  }

  const outbox = panels.get("hermes-outbox");
  if (outbox?.body.kind === "outbox" && outbox.body.failed > 0) {
    rules.push({
      id: "hermes-failed",
      app: "hermes",
      title: `${outbox.body.failed} entrega(s) falharam`,
      body: outbox.body.messages.filter((m) => m.status === "failed").slice(0, 3).map((m) => m.subject).join(" · "),
      dedupeKey: `hermes-failed-${day}`,
    });
  }

  const review = panels.get("chiron-review");
  if (review?.body.kind === "review" && review.body.dueTotal > 0 && !review.body.studiedToday) {
    rules.push({
      id: "chiron-due",
      app: "chiron",
      title: `${review.body.dueTotal} revisões esperando`,
      body: review.body.groups.filter((g) => g.due > 0).slice(0, 3).map((g) => g.title).join(" · "),
      dedupeKey: `chiron-due-${day}`,
    });
  }

  return rules;
}

/** Fires whatever the rules produced, honoring prefs and the daily dedupe.
 *  Returns how many notifications actually went out. */
export function runNotifications(prefs: NotificationPrefs, now = new Date()): number {
  if (!prefs.enabled) return 0;
  if (permission() !== "granted") return 0;
  if (inQuietHours(prefs, now)) return 0;

  const day = now.toISOString().split("T")[0];
  const seen = readSeen();
  let fired = 0;

  for (const rule of collectRules(now)) {
    if (prefs.apps[rule.app] === false) continue;
    if (seen[rule.dedupeKey] === day) continue;
    try {
      const n = new Notification(rule.title, {
        body: rule.body,
        tag: rule.id,
        icon: "/favicon.svg",
      });
      n.onclick = () => {
        window.focus();
        window.open(appById(rule.app).url, "_blank", "noopener,noreferrer");
      };
      markSeen(rule.dedupeKey, day);
      fired++;
    } catch {
      /* a blocked or unsupported notification is not an error worth surfacing */
    }
  }
  return fired;
}

export function sendTestNotification(): boolean {
  if (permission() !== "granted") return false;
  try {
    new Notification("Olympus", { body: "As notificações estão funcionando.", icon: "/favicon.svg" });
    return true;
  } catch {
    return false;
  }
}
