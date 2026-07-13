import type { SuitePrefs } from "./types";

export function setDisplayName(prefs: SuitePrefs, name: string): SuitePrefs {
  return { ...prefs, displayName: name };
}

export function setTheme(prefs: SuitePrefs, theme: "light" | "dark"): SuitePrefs {
  return { ...prefs, theme };
}

export function setLocale(prefs: SuitePrefs, locale: string): SuitePrefs {
  return { ...prefs, locale };
}
