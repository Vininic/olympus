/** The extension bridge.
 *
 *  There are no third-party extensions today. The bridge exists anyway, and
 *  deliberately: the hub asks "who provides a panel / documents / chat
 *  context?" instead of hard-coding five app names, so the day something new
 *  shows up — a sibling, a standalone tool, a user script — it registers here
 *  and every surface picks it up without a rewrite.
 *
 *  Suite apps are entries in this registry too. That is the point: an app is
 *  just an extension that ships with the hub. */

import { SUITE_APPS, type Capability } from "@/lib/suite/registry";
import type { SuitePrefs } from "@/lib/prefs/types";

export type ExtensionKind = "app" | "extension";

export interface ExtensionManifest {
  id: string;
  name: string;
  kind: ExtensionKind;
  description: string;
  color: string;
  url: string | null;
  capabilities: Capability[];
  status: "live" | "atelier" | "available";
  /** Built-in entries cannot be uninstalled, only disabled. */
  builtin: boolean;
  author: string;
}

const APP_DESCRIPTIONS: Record<string, string> = {
  chronos: "Rotina, foco e arquitetura de calendário.",
  kairos: "Projetos, quadros e tarefas com prazo.",
  pluto: "Carteiras, orçamentos e metas.",
  hermes: "Fila de entregas: e-mail, WhatsApp, Telegram.",
  chiron: "Estudo, mapas de conhecimento e revisão espaçada.",
};

function appManifests(): ExtensionManifest[] {
  return SUITE_APPS.map((app) => ({
    id: app.id,
    name: app.name,
    kind: "app" as const,
    description: APP_DESCRIPTIONS[app.id] ?? "",
    color: app.color,
    url: app.url,
    capabilities: app.capabilities,
    status: app.status,
    builtin: true,
    author: "Olympus Suite",
  }));
}

/** Capabilities the hub itself provides, listed so the Apps page is honest
 *  about what is built in rather than pretending the hub is empty. */
const HUB_EXTENSIONS: ExtensionManifest[] = [
  {
    id: "oracle",
    name: "Oráculo",
    kind: "extension",
    description: "O assistente que lê todos os domínios de uma vez.",
    color: "#C9B99A",
    url: null,
    capabilities: ["chat-context"],
    status: "live",
    builtin: true,
    author: "Olympus",
  },
  {
    id: "desktop-panels",
    name: "Painéis de desktop",
    kind: "extension",
    description: "Destaca a peça central de cada app em janela própria.",
    color: "#C9B99A",
    url: null,
    capabilities: ["panel"],
    status: "live",
    builtin: true,
    author: "Olympus",
  },
  {
    id: "push-notifications",
    name: "Notificações",
    kind: "extension",
    description: "Avisos de desktop para prazos, orçamentos e falhas de entrega.",
    color: "#C9B99A",
    url: null,
    capabilities: ["notifications"],
    status: "live",
    builtin: true,
    author: "Olympus",
  },
];

export function allExtensions(): ExtensionManifest[] {
  return [...appManifests(), ...HUB_EXTENSIONS];
}

export function isEnabled(prefs: SuitePrefs, id: string): boolean {
  const explicit = prefs.extensions?.enabled?.[id];
  return explicit === undefined ? true : explicit;
}

export function enabledExtensions(prefs: SuitePrefs): ExtensionManifest[] {
  return allExtensions().filter((e) => isEnabled(prefs, e.id));
}

/** Which providers a given capability currently has — the question every hub
 *  surface should ask instead of iterating SUITE_APPS directly. */
export function providersOf(prefs: SuitePrefs, capability: Capability): ExtensionManifest[] {
  return enabledExtensions(prefs).filter((e) => e.capabilities.includes(capability));
}
