/** Detaching a panel — the pop-out from the Teams "personal app" anatomy,
 *  applied to the hub: push a panel from the parent window into a standalone
 *  child window.
 *
 *  What this is honestly able to do: open a chromeless same-origin window at
 *  `/panel/:id`, sized for a desktop widget, reusing this origin's storage so
 *  theme, locale and mirrored sibling data are already there. What no web app
 *  can do: pin it above other windows. Installed as a PWA, the child opens as
 *  its own app window, which is as close to a desktop widget as the platform
 *  allows. */

import { record } from "@/lib/usage/store";
import { isDesktopShell, openPanelWidget } from "./shell";
import { readDesktopPrefs } from "./prefs";
import type { PanelId } from "@/lib/suite/registry";

const PANEL_SIZE: Record<PanelId, { width: number; height: number }> = {
  "chronos-dayplanner": { width: 400, height: 640 },
  "kairos-now": { width: 420, height: 560 },
  "pluto-balance": { width: 440, height: 560 },
  "hermes-outbox": { width: 440, height: 520 },
  "chiron-review": { width: 400, height: 520 },
};

const openWindows = new Map<PanelId, Window>();

export function isDetachSupported(): boolean {
  return typeof window !== "undefined" && typeof window.open === "function";
}

/** True when this document is itself a detached panel — the layout uses it to
 *  drop the sidebar and topbar. */
export function isDetachedWindow(): boolean {
  return typeof window !== "undefined" && window.location.pathname.startsWith("/panel/");
}

export function detachPanel(id: PanelId): boolean {
  const { width, height } = PANEL_SIZE[id] ?? { width: 420, height: 560 };

  // In the desktop shell the same route opens as a real widget window —
  // chromeless, off the taskbar, and pinned if the user asked for it. In a
  // browser this branch does not exist and the popup below runs instead.
  if (isDesktopShell()) {
    record({ panelsOpened: 1 });
    void openPanelWidget(id, { alwaysOnTop: readDesktopPrefs().alwaysOnTop, width, height });
    return true;
  }

  if (!isDetachSupported()) return false;

  const existing = openWindows.get(id);
  if (existing && !existing.closed) {
    existing.focus();
    return true;
  }

  // Offset from the parent so a second panel does not land exactly on the first.
  const left = Math.max(0, (window.screenX ?? 0) + (window.outerWidth ?? width) - width - 24);
  const top = Math.max(0, (window.screenY ?? 0) + 80 + openWindows.size * 28);

  const child = window.open(
    `/panel/${id}`,
    `olympus-panel-${id}`,
    `popup=yes,width=${width},height=${height},left=${left},top=${top},noopener=no`,
  );
  if (!child) return false;

  openWindows.set(id, child);
  record({ panelsOpened: 1 });
  return true;
}

export function closeDetached(id: PanelId): void {
  const w = openWindows.get(id);
  if (w && !w.closed) w.close();
  openWindows.delete(id);
}

/** Launching a sibling in a new tab, logged so Home can show which apps the
 *  hub actually sends you to. */
export function launchApp(url: string, app: Parameters<typeof record>[0]["app"]): void {
  record({ app });
  window.open(url, "_blank", "noopener,noreferrer");
}
