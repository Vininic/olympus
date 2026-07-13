export const PREFS_VERSION = 1;
export const USER_DATA_KEY = "suite-prefs";

export interface SuitePrefs {
  meta: { version: number };
  displayName?: string;
  theme?: "light" | "dark";
  locale?: string;
}

export function emptyPrefs(): SuitePrefs {
  return { meta: { version: PREFS_VERSION } };
}
