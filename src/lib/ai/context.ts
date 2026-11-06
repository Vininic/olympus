/** The Oracle's context — every domain serialized for one prompt.
 *
 *  v1 fed the model the same counters the scoreboard showed ("3/8 blocks"),
 *  which is enough to answer "how many" and nothing else: it could not name
 *  the block you are in, the task that is late, or the budget that broke.
 *  It now serializes the *panel* view models, so the answer can be specific —
 *  which is the entire reason a cross-domain assistant is worth having. */

import { buildPanels } from "@/lib/panels";
import type {
  BalancePanel, DayplannerPanel, NowPanel, OutboxPanel, PanelBody, ReviewPanel,
} from "@/lib/panels";
import { SUITE_APPS } from "@/lib/suite/registry";

function money(cents: number, currency: string): string {
  const symbol = currency === "BRL" ? "R$" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "";
  return `${symbol} ${(cents / 100).toFixed(2)}`;
}

function serializeDayplanner(body: DayplannerPanel): string {
  const lines = [
    `Workday: ${body.workdayStart}–${body.workdayEnd} (${body.remainingFocusHours}h left from now)`,
    `Blocks today: ${body.blocks.length}, ${body.doneCount} marked done`,
  ];
  for (const block of body.blocks) {
    const state = block.id === body.currentId ? "NOW" : block.state.toUpperCase();
    lines.push(`- [${state}] ${block.start}–${block.end} ${block.title}${block.done ? " (done)" : ""}`);
  }
  return lines.join("\n");
}

function serializeNow(body: NowPanel): string {
  const lines = [
    `Overdue: ${body.overdue} · due today: ${body.dueToday} · in progress: ${body.doing} · completed today: ${body.doneToday}`,
  ];
  for (const task of body.tasks) {
    const flag = task.overdue ? `OVERDUE since ${task.dueDate}` : task.dueToday ? "DUE TODAY" : task.status;
    lines.push(`- [${flag}] ${task.title}${task.project ? ` (${task.project})` : ""} · priority ${task.priority}`);
  }
  return lines.join("\n");
}

function serializeBalance(body: BalancePanel): string {
  const lines = [
    `This month — income ${money(body.incomeCents, body.currency)}, expenses ${money(body.expenseCents, body.currency)}, net ${money(body.netCents, body.currency)}`,
  ];
  for (const budget of body.budgets) {
    const pct = Math.round(budget.ratio * 100);
    lines.push(
      `- Budget ${budget.name}: ${money(budget.spentCents, body.currency)} of ${money(budget.limitCents, body.currency)} (${pct}%)${budget.ratio > 1 ? " OVER" : ""}`,
    );
  }
  for (const tx of body.recent) {
    lines.push(`- ${tx.date} ${tx.type === "income" ? "+" : "-"}${money(tx.amountCents, body.currency)} ${tx.title}`);
  }
  return lines.join("\n");
}

function serializeOutbox(body: OutboxPanel): string {
  const lines = [`Pending: ${body.pending} · failed: ${body.failed} · sent today: ${body.sentToday}`];
  for (const msg of body.messages) {
    lines.push(`- [${msg.status}] ${msg.subject} via ${msg.channel} from ${msg.source}${msg.error ? ` — ${msg.error}` : ""}`);
  }
  return lines.join("\n");
}

function serializeReview(body: ReviewPanel): string {
  const lines = [
    `Due reviews: ${body.dueTotal} · streak ${body.streak} days · ${body.points} points · studied today: ${body.studiedToday ? "yes" : "no"}`,
  ];
  for (const group of body.groups) {
    lines.push(`- ${group.title}: ${group.due} due of ${group.total} cards`);
  }
  return lines.join("\n");
}

function serialize(body: PanelBody): string {
  switch (body.kind) {
    case "dayplanner": return serializeDayplanner(body);
    case "now": return serializeNow(body);
    case "balance": return serializeBalance(body);
    case "outbox": return serializeOutbox(body);
    case "review": return serializeReview(body);
  }
}

const DOMAIN_LABEL: Record<string, string> = {
  chronos: "CHRONOS (Schedule)",
  kairos: "KAIROS (Board)",
  pluto: "PLUTO (Ledger)",
  hermes: "HERMES (Messenger)",
  chiron: "CHIRON (Study)",
};

export function buildSystemPrompt(today: string, localeLabel: string): string {
  const panels = buildPanels();

  const sections = SUITE_APPS.map((app) => {
    const panel = panels.get(app.panelId);
    const body = panel ? serialize(panel.body) : `(no data — ${app.name} not set up yet)`;
    return `--- ${DOMAIN_LABEL[app.id]} ---\n${body}`;
  }).join("\n\n");

  return `You are the Oracle — the global Aetheris of the Olympus Suite. You see ALL of the user's data across every app.
Today is ${today}. Be concise and concrete.
The user's UI language is ${localeLabel}. Always reply in that language, even if the data is in a different one — unless the user explicitly writes to you in another language, in which case switch to that.
Use light markdown — **bold**, bullet lists, short "##" headings — to structure longer answers; keep one-line answers plain.
Name specific blocks, tasks, budgets and sources when they answer the question — you have the actual items below, not just totals. Never invent an item that is not listed.
When asked a cross-domain question (e.g. "do I have money and time for the PC upgrade this month?"), synthesize across domains: free hours from Chronos, commitments from Kairos, room in the budget from Pluto.
You can READ all data but cannot change it. Surface facts and link to the owning app — do not propose action JSON blocks.

${sections}`;
}

export function refreshContext(): string {
  const today = new Date().toISOString().split("T")[0];
  const locale = localStorage.getItem("suite.locale") || "pt";
  const localeLabel = locale === "pt" ? "Português (Brasil)" : "English";
  return buildSystemPrompt(today, localeLabel);
}
