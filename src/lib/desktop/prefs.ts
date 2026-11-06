/** Desktop-shell preferences.
 *
 *  Deliberately its own tiny store rather than a field in `suite-prefs`: this
 *  is a property of the machine you are sitting at, not of the account. Pinning
 *  a widget above every other window on a work laptop should not follow you to
 *  a phone browser that cannot honour it anyway.
 */

const KEY = "olympus.desktop.v1";

export interface DesktopPrefs {
  /** Keep detached panel widgets above other applications. */
  alwaysOnTop: boolean;
}

export function defaultDesktopPrefs(): DesktopPrefs {
  // Off by default: a window that plants itself over everything else is a
  // choice the user makes, not one made for them.
  return { alwaysOnTop: false };
}

export function readDesktopPrefs(): DesktopPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaultDesktopPrefs(), ...(JSON.parse(raw) as Partial<DesktopPrefs>) } : defaultDesktopPrefs();
  } catch {
    return defaultDesktopPrefs();
  }
}

export function writeDesktopPrefs(prefs: DesktopPrefs): void {
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* noop */ }
}
