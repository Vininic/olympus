/** Assembles the panel set from the mirrored sibling rows. */

import { SUITE_APPS, readSiblingRow, type PanelId } from "@/lib/suite/registry";
import type { Panel, PanelBody } from "./types";
import { parseDayplanner } from "./chronos";
import { parseNow } from "./kairos";
import { parseBalance } from "./pluto";
import { parseOutbox } from "./hermes";
import { parseReview } from "./chiron";

export * from "./types";
export { parseDayplanner } from "./chronos";
export { parseNow, kairosProjects } from "./kairos";
export { parseBalance, plutoDocs } from "./pluto";
export { parseOutbox } from "./hermes";
export { parseReview, chironDocs } from "./chiron";

const PARSERS: Record<PanelId, (raw: Record<string, unknown> | null) => PanelBody | null> = {
  "chronos-dayplanner": parseDayplanner,
  "kairos-now": parseNow,
  "pluto-balance": parseBalance,
  "hermes-outbox": parseOutbox,
  "chiron-review": parseReview,
};

const CURRENCY_SYMBOL: Record<string, string> = { BRL: "R$", USD: "$", EUR: "€" };

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

function headline(body: PanelBody): string {
  switch (body.kind) {
    case "dayplanner":
      return `${plural(body.blocks.length, "bloco", "blocos")} · ${body.remainingFocusHours}h restantes`;
    case "now":
      return body.overdue > 0
        ? plural(body.overdue, "atrasada", "atrasadas")
        : `${body.dueToday} para hoje`;
    case "balance": {
      const symbol = CURRENCY_SYMBOL[body.currency] ?? "";
      const amount = Math.abs(body.netCents / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return `${body.netCents < 0 ? "−" : ""}${symbol} ${amount} no mês`;
    }
    case "outbox":
      return body.failed > 0
        ? plural(body.failed, "falhou", "falharam")
        : `${body.pending} na fila`;
    case "review":
      return `${plural(body.dueTotal, "revisão", "revisões")} · ${plural(body.streak, "dia", "dias")}`;
  }
}

/** Null body means "this sibling has no data yet" — the caller renders the
 *  panel's empty state rather than dropping the panel, so the hub layout
 *  stays stable between an empty account and a full one. */
export function buildPanel(id: PanelId): Panel | null {
  const app = SUITE_APPS.find((a) => a.panelId === id);
  if (!app) return null;
  const body = PARSERS[id](readSiblingRow(app.storageKey));
  if (!body) return null;
  return { id, app: app.id, headline: headline(body), body };
}

export function buildPanels(): Map<PanelId, Panel | null> {
  const out = new Map<PanelId, Panel | null>();
  for (const app of SUITE_APPS) out.set(app.panelId, buildPanel(app.panelId));
  return out;
}

/** Registry order, minus hidden, with the user's explicit order first. */
export function orderedPanels(order: PanelId[], hidden: PanelId[]): PanelId[] {
  const all = SUITE_APPS.map((a) => a.panelId);
  const known = order.filter((id) => all.includes(id));
  const rest = all.filter((id) => !known.includes(id));
  return [...known, ...rest].filter((id) => !hidden.includes(id));
}
