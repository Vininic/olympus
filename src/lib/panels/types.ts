/** Panel view models — the item-level layer.
 *
 *  `lib/views/*` collapses each sibling to counters ("3/8 blocks"), which is
 *  all a scoreboard needs. A panel is not a scoreboard: it shows the actual
 *  blocks, the actual tasks, the actual queue. Same rows, different depth —
 *  these parsers are pure and tested for the same reason the view models are:
 *  they run against another app's document, whose shape we do not control. */

import type { PanelId, SuiteAppId } from "@/lib/suite/registry";

export interface TimelineBlock {
  id: string;
  title: string;
  /** "HH:MM" — 24h, as the siblings store it. */
  start: string;
  end: string;
  done: boolean;
  color?: string;
  state: "past" | "current" | "upcoming";
}

export interface DayplannerPanel {
  kind: "dayplanner";
  blocks: TimelineBlock[];
  currentId: string | null;
  nextId: string | null;
  remainingFocusHours: number;
  workdayStart: string;
  workdayEnd: string;
  doneCount: number;
}

export interface TaskItem {
  id: string;
  title: string;
  project: string | null;
  projectColor?: string;
  dueDate: string | null;
  status: string;
  overdue: boolean;
  dueToday: boolean;
  priority: string;
}

export interface NowPanel {
  kind: "now";
  tasks: TaskItem[];
  overdue: number;
  dueToday: number;
  doing: number;
  doneToday: number;
}

export interface BudgetLine {
  id: string;
  name: string;
  spentCents: number;
  limitCents: number;
  /** 0–1, uncapped so an overrun is visible as > 1. */
  ratio: number;
  color?: string;
}

export interface TxItem {
  id: string;
  title: string;
  amountCents: number;
  type: "income" | "expense" | "transfer";
  date: string;
  category?: string;
  color?: string;
}

export interface BalancePanel {
  kind: "balance";
  incomeCents: number;
  expenseCents: number;
  netCents: number;
  budgets: BudgetLine[];
  recent: TxItem[];
  currency: string;
}

export interface QueueItem {
  id: string;
  subject: string;
  channel: string;
  source: string;
  status: "pending" | "sent" | "failed";
  at: string | null;
  error?: string;
}

export interface OutboxPanel {
  kind: "outbox";
  messages: QueueItem[];
  pending: number;
  failed: number;
  sentToday: number;
}

export interface ReviewGroup {
  id: string;
  title: string;
  due: number;
  total: number;
  color?: string;
}

export interface ReviewPanel {
  kind: "review";
  groups: ReviewGroup[];
  dueTotal: number;
  streak: number;
  points: number;
  studiedToday: boolean;
}

export type PanelBody =
  | DayplannerPanel
  | NowPanel
  | BalancePanel
  | OutboxPanel
  | ReviewPanel;

export interface Panel {
  id: PanelId;
  app: SuiteAppId;
  /** One-line summary shown in the header — the headline number, in words. */
  headline: string;
  body: PanelBody;
}

/* ── shared helpers ───────────────────────────────────────────────────────── */

export function today(): string {
  return new Date().toISOString().split("T")[0];
}

export function minutesNow(d = new Date()): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm?.trim() ?? "");
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function asArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

export function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
