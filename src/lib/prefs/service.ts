/** Pure updates over the suite-prefs document. Every mutation returns a new
 *  document; the store never edits in place. */
import type {
  AppearancePrefs, AvatarPrefs, NotificationPrefs, PanelPrefs, SpeechPrefs, StartPage, SuitePrefs,
} from "./types";
import { defaultAppearance, defaultAvatar, defaultNotifications, defaultPanels, defaultSpeech } from "./types";
import type { PanelId } from "@/lib/suite/registry";

export function setDisplayName(prefs: SuitePrefs, name: string): SuitePrefs {
  return { ...prefs, displayName: name };
}

export function setLocale(prefs: SuitePrefs, locale: string): SuitePrefs {
  return { ...prefs, locale };
}

export function setStartPage(prefs: SuitePrefs, startPage: StartPage): SuitePrefs {
  return { ...prefs, startPage };
}

export function setAppearance(prefs: SuitePrefs, patch: Partial<AppearancePrefs>): SuitePrefs {
  const appearance = { ...defaultAppearance(), ...(prefs.appearance ?? {}), ...patch };
  return {
    ...prefs,
    appearance,
    // Mirror into the legacy flat field so siblings still reading
    // `suite-prefs.theme` keep following the hub. "system" has no flat
    // equivalent, so the last explicit choice is left standing.
    theme: appearance.mode === "system" ? prefs.theme : (appearance.mode as "light" | "dark"),
  };
}

/** Back-compat shim for callers that only know light/dark. */
export function setTheme(prefs: SuitePrefs, theme: "light" | "dark"): SuitePrefs {
  return setAppearance(prefs, { mode: theme });
}

export function setPanels(prefs: SuitePrefs, patch: Partial<PanelPrefs>): SuitePrefs {
  return { ...prefs, panels: { ...defaultPanels(), ...(prefs.panels ?? {}), ...patch } };
}

export function togglePanel(prefs: SuitePrefs, id: PanelId): SuitePrefs {
  const hidden = prefs.panels?.hidden ?? [];
  const next = hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id];
  return setPanels(prefs, { hidden: next });
}

export function movePanel(prefs: SuitePrefs, order: PanelId[]): SuitePrefs {
  return setPanels(prefs, { order });
}

export function setNotifications(prefs: SuitePrefs, patch: Partial<NotificationPrefs>): SuitePrefs {
  const current = { ...defaultNotifications(), ...(prefs.notifications ?? {}) };
  return {
    ...prefs,
    notifications: {
      ...current,
      ...patch,
      apps: { ...current.apps, ...(patch.apps ?? {}) },
      quietHours: { ...current.quietHours, ...(patch.quietHours ?? {}) },
    },
  };
}

export function setSpeech(prefs: SuitePrefs, patch: Partial<SpeechPrefs>): SuitePrefs {
  return { ...prefs, speech: { ...defaultSpeech(), ...(prefs.speech ?? {}), ...patch } };
}

export function setExtensionEnabled(prefs: SuitePrefs, id: string, enabled: boolean): SuitePrefs {
  return {
    ...prefs,
    extensions: { enabled: { ...(prefs.extensions?.enabled ?? {}), [id]: enabled } },
  };
}

export function setAvatar(prefs: SuitePrefs, patch: Partial<AvatarPrefs>): SuitePrefs {
  return { ...prefs, avatar: { ...defaultAvatar(), ...(prefs.avatar ?? {}), ...patch } };
}
