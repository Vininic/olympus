/** The suite registry — one source of truth for who the siblings are.
 *
 *  Before this file, the same five apps were described three different ways
 *  (Apps.tsx's APPS array, Desk.tsx's inline widget colors, Oracle.tsx's rows),
 *  and they had already drifted apart once. Everything that needs to know an
 *  app's color, URL, user_data key or capabilities reads it from here. */

export type SuiteAppId = "chronos" | "kairos" | "pluto" | "hermes" | "chiron";

/** What a registry entry can contribute to the hub. Extensions declare the
 *  same vocabulary, which is what makes the extension bridge real rather than
 *  a placeholder: the hub asks "who provides panels?", not "which apps exist?". */
export type Capability = "panel" | "docs" | "chat-context" | "notifications";

export interface SuiteApp {
  id: SuiteAppId;
  name: string;
  /** The hue that represents this app across the hub — chips, marks, wheel
   *  spokes, chart axes.
   *
   *  This follows SUITE-ARCHITECTURE §5's *color rules* ("green belongs to
   *  Pluto, violet to Kairos, blue to Chronos"), not each app's metal accent.
   *  Using the accents put Chronos on bronze and Pluto on gold — two warm
   *  golds a shade apart, unreadable side by side and contradicting the rule
   *  that owns those hues. Where an app's ink is near-black (Chronos'
   *  midnight, Pluto's vault green) this is that ink lifted to a legible
   *  mid-tone rather than a different hue. */
  color: string;
  /** Deep identity ink — SUITE-ARCHITECTURE §5. */
  ink: string;
  /** The app's metal/bright accent, kept for reference and for surfaces that
   *  render an app in its own full identity rather than as one of six. */
  accent: string;
  url: string;
  /** The user_data row Olympus reads for this app. */
  dataKey: string;
  /** localStorage mirror of that row, written by deskSync. */
  storageKey: string;
  /** The one piece of this app worth living outside it. */
  panelId: PanelId;
  capabilities: Capability[];
  status: "live" | "atelier";
}

export type PanelId =
  | "chronos-dayplanner"
  | "kairos-now"
  | "pluto-balance"
  | "hermes-outbox"
  | "chiron-review";

export const SUITE_APPS: SuiteApp[] = [
  {
    id: "chronos",
    name: "Chronos",
    color: "#3B6FA0",
    ink: "#0E2A47",
    accent: "#B7863B",
    url: "https://chronos-plannerai.vercel.app",
    dataKey: "schedule",
    storageKey: "olympus.view.chronos",
    panelId: "chronos-dayplanner",
    capabilities: ["panel", "docs", "chat-context", "notifications"],
    status: "live",
  },
  {
    id: "kairos",
    name: "Kairos",
    color: "#C98FA6",
    ink: "#3D1F47",
    accent: "#C98FA6",
    url: "https://kairos-suite.vercel.app",
    dataKey: "kairos-board",
    storageKey: "olympus.view.kairos",
    panelId: "kairos-now",
    capabilities: ["panel", "docs", "chat-context", "notifications"],
    status: "live",
  },
  {
    id: "pluto",
    name: "Pluto",
    color: "#2E7D57",
    ink: "#183427",
    accent: "#C49A3A",
    url: "https://pluto-suite.vercel.app",
    dataKey: "pluto-ledger",
    storageKey: "olympus.view.pluto",
    panelId: "pluto-balance",
    capabilities: ["panel", "docs", "chat-context", "notifications"],
    status: "live",
  },
  {
    id: "hermes",
    name: "Hermes",
    color: "#3EB8CC",
    ink: "#1F262E",
    accent: "#3EB8CC",
    url: "https://hermes-suite.vercel.app",
    dataKey: "hermes-outbox",
    storageKey: "olympus.view.hermes",
    panelId: "hermes-outbox",
    capabilities: ["panel", "chat-context", "notifications"],
    status: "live",
  },
  {
    id: "chiron",
    name: "Chiron",
    color: "#A63446",
    ink: "#3B2A20",
    accent: "#A63446",
    url: "https://chiron-nine.vercel.app",
    dataKey: "chiron-index",
    storageKey: "olympus.view.chiron",
    panelId: "chiron-review",
    capabilities: ["panel", "docs", "chat-context", "notifications"],
    status: "live",
  },
];

const BY_ID = new Map(SUITE_APPS.map((a) => [a.id, a]));
const BY_PANEL = new Map(SUITE_APPS.map((a) => [a.panelId, a]));

export function appById(id: SuiteAppId): SuiteApp {
  const app = BY_ID.get(id);
  if (!app) throw new Error(`Unknown suite app: ${id}`);
  return app;
}

export function appByPanel(panelId: PanelId): SuiteApp | null {
  return BY_PANEL.get(panelId) ?? null;
}

export function appsWith(capability: Capability): SuiteApp[] {
  return SUITE_APPS.filter((a) => a.capabilities.includes(capability));
}

/** The color-wash chip formula the whole suite shares (SUITE-ARCHITECTURE §3a):
 *  `${hex}16` background + `${hex}33` border. Centralized here so no one
 *  hand-writes the hex suffix trick again. */
export function alpha(hex: string, level: "wash" | "border" | "solid" = "wash"): string {
  if (level === "solid") return hex;
  return `${hex}${level === "wash" ? "16" : "33"}`;
}

/** Read a sibling's mirrored row out of localStorage. Returns the inner
 *  `value`, not the `{ value, version }` envelope deskSync writes. */
export function readSiblingRow(storageKey: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { value?: unknown };
    return (parsed.value as Record<string, unknown>) ?? null;
  } catch {
    return null;
  }
}
