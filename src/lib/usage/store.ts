/** The usage ledger — what the Home page reports on.
 *
 *  Deliberately local and deliberately small: one bucket per day, 60 days
 *  kept, counters only. No message text, no titles, nothing that would make
 *  this file interesting to anyone who got hold of it. */

import type { SuiteAppId } from "@/lib/suite/registry";

const KEY = "olympus.usage.v1";
const KEEP_DAYS = 60;

export interface DayUsage {
  /** YYYY-MM-DD */
  date: string;
  messages: number;
  /** Estimated, from the same chars/4 heuristic the context meter uses. */
  tokens: number;
  panelsOpened: number;
  /** App id → times launched from the hub. */
  apps: Partial<Record<SuiteAppId, number>>;
  chats: number;
}

export interface UsageLedger {
  version: 1;
  days: DayUsage[];
}

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function emptyDay(date: string): DayUsage {
  return { date, messages: 0, tokens: 0, panelsOpened: 0, apps: {}, chats: 0 };
}

export function loadUsage(): UsageLedger {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { version: 1, days: [] };
    const parsed = JSON.parse(raw) as Partial<UsageLedger>;
    const days = Array.isArray(parsed.days) ? parsed.days.filter((d) => typeof d?.date === "string") : [];
    return { version: 1, days: days.slice(-KEEP_DAYS) };
  } catch {
    return { version: 1, days: [] };
  }
}

function save(ledger: UsageLedger): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, days: ledger.days.slice(-KEEP_DAYS) }));
  } catch {
    /* storage full — usage stats are not worth failing a send over */
  }
}

export const USAGE_EVENT = "olympus-usage-changed";

export function record(patch: Partial<Omit<DayUsage, "date" | "apps">> & { app?: SuiteAppId }): void {
  const ledger = loadUsage();
  const date = todayKey();
  let day = ledger.days.find((d) => d.date === date);
  if (!day) {
    day = emptyDay(date);
    ledger.days.push(day);
  }
  day.messages += patch.messages ?? 0;
  day.tokens += patch.tokens ?? 0;
  day.panelsOpened += patch.panelsOpened ?? 0;
  day.chats += patch.chats ?? 0;
  if (patch.app) day.apps[patch.app] = (day.apps[patch.app] ?? 0) + 1;
  save(ledger);
  window.dispatchEvent(new Event(USAGE_EVENT));
}

export interface UsageSummary {
  /** Oldest → newest, one entry per day, gaps filled with zeros. */
  series: DayUsage[];
  messages7: number;
  tokens7: number;
  messages30: number;
  tokens30: number;
  appLaunches: { app: SuiteAppId; count: number }[];
  /** Consecutive days ending today (or yesterday) with any activity. */
  streak: number;
  activeDays: number;
}

function dateNDaysAgo(n: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/** Fills gaps so a sparkline has one point per day instead of one point per
 *  day the user happened to show up. */
export function densify(ledger: UsageLedger, days: number): DayUsage[] {
  const byDate = new Map(ledger.days.map((d) => [d.date, d]));
  const out: DayUsage[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = dateNDaysAgo(i);
    out.push(byDate.get(date) ?? emptyDay(date));
  }
  return out;
}

function hasActivity(d: DayUsage): boolean {
  return d.messages > 0 || d.panelsOpened > 0 || d.chats > 0 || Object.keys(d.apps).length > 0;
}

export function summarize(ledger: UsageLedger, windowDays = 14): UsageSummary {
  const series = densify(ledger, windowDays);
  const last = (n: number) => densify(ledger, n);

  const sum = (rows: DayUsage[], field: "messages" | "tokens") =>
    rows.reduce((total, d) => total + d[field], 0);

  const launches = new Map<SuiteAppId, number>();
  for (const day of ledger.days) {
    for (const [app, count] of Object.entries(day.apps)) {
      launches.set(app as SuiteAppId, (launches.get(app as SuiteAppId) ?? 0) + (count ?? 0));
    }
  }

  // A streak stays alive on a day you have not used yet — breaking it at
  // midnight would be punishing the clock, not the habit.
  const recent = densify(ledger, 60);
  let streak = 0;
  for (let i = recent.length - 1; i >= 0; i--) {
    if (hasActivity(recent[i])) streak++;
    else if (i !== recent.length - 1) break;
  }

  return {
    series,
    messages7: sum(last(7), "messages"),
    tokens7: sum(last(7), "tokens"),
    messages30: sum(last(30), "messages"),
    tokens30: sum(last(30), "tokens"),
    appLaunches: [...launches.entries()]
      .map(([app, count]) => ({ app, count }))
      .sort((a, b) => b.count - a.count),
    streak,
    activeDays: ledger.days.filter(hasActivity).length,
  };
}

export function clearUsage(): void {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
  window.dispatchEvent(new Event(USAGE_EVENT));
}

/** The same chars/4 estimate used by the chat context meter. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
