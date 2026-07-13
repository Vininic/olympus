/** Serialize all sibling domains for the Oracle — compact summaries. */
import { parseChronos } from "@/lib/views/chronos";
import { parseKairos } from "@/lib/views/kairos";
import { parsePluto } from "@/lib/views/pluto";
import { parseHermes } from "@/lib/views/hermes";
import { parseChiron } from "@/lib/views/chiron";
import { DESK_DOMAINS } from "@/lib/sync/deskSync";

function readSiblingData(storageKey: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw).value;
  } catch {
    return null;
  }
}

function serializeChronos(): string {
  const raw = readSiblingData("olympus.view.chronos");
  if (!raw) return "(no data — Chronos not set up yet)";
  const view = parseChronos(raw);
  if (!view) return "(unable to parse Chronos data)";
  const parts = [
    `Total blocks today: ${view.totalBlocksToday} (${view.completedBlocksToday} done)`,
    view.currentBlock ? `Currently: ${view.currentBlock}` : "No current block",
    view.nextBlock ? `Next: ${view.nextBlock}` : "No next block",
    `Remaining focus hours: ${view.remainingFocusHours}`,
  ];
  return parts.join("\n");
}

function serializeKairos(): string {
  const raw = readSiblingData("olympus.view.kairos");
  if (!raw) return "(no data — Kairos not set up yet)";
  const view = parseKairos(raw);
  if (!view) return "(unable to parse Kairos data)";
  const parts = [
    `Projects: ${view.totalProjects}`,
    `Total tasks: ${view.totalTasks}`,
    `In progress: ${view.doing}`,
    `Due today: ${view.dueToday}`,
    `Overdue: ${view.overdue}`,
    `Completed today: ${view.doneToday}`,
  ];
  return parts.join("\n");
}

function serializePluto(): string {
  const raw = readSiblingData("olympus.view.pluto");
  if (!raw) return "(no data — Pluto not set up yet)";
  const view = parsePluto(raw);
  if (!view) return "(unable to parse Pluto data)";
  const parts = [
    `Wallets: ${view.walletCount}`,
    `Income this month: R$ ${(view.incomeMonthCents / 100).toFixed(2)}`,
    `Expenses this month: R$ ${(view.expenseMonthCents / 100).toFixed(2)}`,
    view.budgetAlertCount > 0 ? `⚠ Budgets over limit: ${view.budgetAlertCount}` : "Budgets: on track",
    `Goals tracked: ${view.goalProgressCount} (${view.goalsNearDone} near completion)`,
  ];
  return parts.join("\n");
}

function serializeHermes(): string {
  const raw = readSiblingData("olympus.view.hermes");
  if (!raw) return "(no data — Hermes not set up yet)";
  const view = parseHermes(raw);
  if (!view) return "(unable to parse Hermes data)";
  const parts = [
    `Pending deliveries: ${view.pendingCount}`,
    view.failedCount > 0 ? `⚠ Failed: ${view.failedCount}` : "No failed deliveries",
    `Sent today: ${view.sentToday}`,
    view.lastDeliveryAt ? `Last delivery: ${new Date(view.lastDeliveryAt).toLocaleString()}` : "No deliveries yet",
  ];
  return parts.join("\n");
}

function serializeChiron(): string {
  const raw = readSiblingData("olympus.view.chiron");
  if (!raw) return "(no data — Chiron not set up yet)";
  const view = parseChiron(raw);
  if (!view) return "(unable to parse Chiron data)";
  const parts = [
    `Study sources: ${view.totalSources}`,
    `Map nodes: ${view.totalNodes}`,
    `Due reviews: ${view.dueCards}`,
    `Streak: ${view.streak} days`,
    `Total points: ${view.totalPoints}`,
    `Study sessions: ${view.totalSessions}`,
  ];
  return parts.join("\n");
}

export function buildSystemPrompt(today: string, localeLabel: string): string {
  return `You are the Oracle — the global Aetheris of the Olympus Suite. You see ALL of the user's data across every app.
Today is ${today}. Be concise and concrete.
The user's UI language is ${localeLabel}. Always reply in that language, even if the data is in a different one — unless the user explicitly writes to you in another language, in which case switch to that.
Use light markdown — **bold**, bullet lists, short "##" headings — to structure longer answers; keep one-line answers plain.
When asked for a cross-domain question (e.g. "do I have money and time for the PC upgrade this month?"), synthesize data from multiple domains.
You can READ all data but cannot change it. Surface facts and links — do not propose action JSON blocks.

--- CHRONOS (Schedule) ---
${serializeChronos()}

--- KAIROS (Board) ---
${serializeKairos()}

--- PLUTO (Ledger) ---
${serializePluto()}

--- HERMES (Messenger) ---
${serializeHermes()}

--- CHIRON (Study) ---
${serializeChiron()}`;
}

export function refreshContext(): string {
  const today = new Date().toISOString().split("T")[0];
  const locale = localStorage.getItem("suite.locale") || "pt";
  const localeLabel = locale === "pt" ? "Português (Brasil)" : "English";
  return buildSystemPrompt(today, localeLabel);
}
