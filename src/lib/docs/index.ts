/** The unified document index — the Office move.
 *
 *  You do not open "Word", you open a document. Same here: a Kairos project,
 *  a Chiron source, a Pluto wallet and a Chronos day are all things you open,
 *  and they should live in one recency-sorted list regardless of which sibling
 *  owns the row behind them. */

import { SUITE_APPS, readSiblingRow, type SuiteAppId } from "@/lib/suite/registry";
import { kairosProjects } from "@/lib/panels/kairos";
import { plutoDocs } from "@/lib/panels/pluto";
import { chironDocs } from "@/lib/panels/chiron";
import { asArray, str } from "@/lib/panels/types";

export type DocKind = "project" | "source" | "wallet" | "goal" | "schedule" | "flow";

export interface SuiteDoc {
  id: string;
  app: SuiteAppId;
  kind: DocKind;
  title: string;
  /** Short right-aligned detail: "12 tarefas", "84 cartões". */
  meta: string;
  updatedAt: string | null;
  /** Deep link into the owning app. Olympus does not open documents itself. */
  href: string;
  color: string;
}

function appUrl(id: SuiteAppId): string {
  return SUITE_APPS.find((a) => a.id === id)!.url;
}

function appColor(id: SuiteAppId): string {
  return SUITE_APPS.find((a) => a.id === id)!.color;
}

function kairosDocs(): SuiteDoc[] {
  const raw = readSiblingRow("olympus.view.kairos");
  return kairosProjects(raw)
    .filter((p) => !p.archived)
    .map((p) => ({
      id: `kairos:${p.id}`,
      app: "kairos" as const,
      kind: "project" as const,
      title: p.title,
      meta: `${p.open}/${p.count} abertas`,
      updatedAt: p.updatedAt,
      href: `${appUrl("kairos")}/board?project=${encodeURIComponent(p.id)}`,
      color: p.color ?? appColor("kairos"),
    }));
}

function chironDocList(): SuiteDoc[] {
  const raw = readSiblingRow("olympus.view.chiron");
  return chironDocs(raw).map((s) => ({
    id: `chiron:${s.id}`,
    app: "chiron" as const,
    kind: "source" as const,
    title: s.title,
    meta: `${s.cards} cartões`,
    updatedAt: s.updatedAt,
    href: `${appUrl("chiron")}/library?source=${encodeURIComponent(s.id)}`,
    color: appColor("chiron"),
  }));
}

function plutoDocList(): SuiteDoc[] {
  const raw = readSiblingRow("olympus.view.pluto");
  return plutoDocs(raw).map((d) => ({
    id: `pluto:${d.id}`,
    app: "pluto" as const,
    kind: d.kind,
    title: d.title,
    meta: d.meta,
    updatedAt: d.updatedAt,
    href: `${appUrl("pluto")}/${d.kind === "wallet" ? "wallets" : "goals"}`,
    color: appColor("pluto"),
  }));
}

/** Chronos has no "documents" in the plural sense — it has one schedule. It
 *  still belongs in the list: the schedule is the thing you open most. */
function chronosDocList(): SuiteDoc[] {
  const raw = readSiblingRow("olympus.view.chronos");
  if (!raw) return [];
  const commitments = asArray(raw.commitments);
  const lastTouch = commitments
    .map((c) => str(c.updatedAt) || str(c.date))
    .filter(Boolean)
    .sort()
    .pop() ?? null;
  return [
    {
      id: "chronos:schedule",
      app: "chronos",
      kind: "schedule",
      title: "Agenda",
      meta: `${commitments.length} compromissos`,
      updatedAt: lastTouch,
      href: `${appUrl("chronos")}/today`,
      color: appColor("chronos"),
    },
  ];
}

function hermesDocList(): SuiteDoc[] {
  const raw = readSiblingRow("olympus.view.hermes");
  if (!raw) return [];
  const messages = asArray(raw.messages);
  if (messages.length === 0) return [];
  const lastTouch = messages
    .map((m) => str(m.sentAt) || str(m.createdAt))
    .filter(Boolean)
    .sort()
    .pop() ?? null;
  return [
    {
      id: "hermes:outbox",
      app: "hermes",
      kind: "flow",
      title: "Caixa de saída",
      meta: `${messages.length} mensagens`,
      updatedAt: lastTouch,
      href: `${appUrl("hermes")}/outbox`,
      color: appColor("hermes"),
    },
  ];
}

export function buildDocIndex(): SuiteDoc[] {
  return [
    ...chronosDocList(),
    ...kairosDocs(),
    ...plutoDocList(),
    ...hermesDocList(),
    ...chironDocList(),
  ];
}

/** Newest first; undated documents sink to the bottom rather than jumping to
 *  the top the way an empty-string comparison would put them. */
export function sortByRecency(docs: SuiteDoc[]): SuiteDoc[] {
  return [...docs].sort((a, b) => {
    if (!a.updatedAt && !b.updatedAt) return a.title.localeCompare(b.title);
    if (!a.updatedAt) return 1;
    if (!b.updatedAt) return -1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function filterDocs(docs: SuiteDoc[], query: string, app: SuiteAppId | "all"): SuiteDoc[] {
  const q = query.trim().toLowerCase();
  return docs.filter((d) => {
    if (app !== "all" && d.app !== app) return false;
    if (!q) return true;
    return d.title.toLowerCase().includes(q) || d.meta.toLowerCase().includes(q);
  });
}
