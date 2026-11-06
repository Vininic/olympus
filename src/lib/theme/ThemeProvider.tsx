import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Density, ThemeMode, ThemeSkin } from "@/lib/prefs/types";

/** Resolved light/dark, after "system" is answered. */
export type Theme = "light" | "dark";

const MODE_KEY = "suite.theme";        // shared with the siblings — light/dark only
const SKIN_KEY = "olympus.skin";
const DENSITY_KEY = "olympus.density";

interface ThemeContextValue {
  /** The resolved theme actually on screen. */
  theme: Theme;
  mode: ThemeMode;
  skin: ThemeSkin;
  density: Density;
  setMode: (m: ThemeMode) => void;
  setSkin: (s: ThemeSkin) => void;
  setDensity: (d: Density) => void;
  /** Back-compat: sets an explicit light/dark mode. */
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function prefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

function readMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(MODE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

function readSkin(): ThemeSkin {
  if (typeof window === "undefined") return "marble";
  const stored = window.localStorage.getItem(SKIN_KEY);
  const skins: ThemeSkin[] = ["marble", "nocturne", "parchment", "sepia", "ink"];
  return skins.includes(stored as ThemeSkin) ? (stored as ThemeSkin) : "marble";
}

function readDensity(): Density {
  if (typeof window === "undefined") return "comfortable";
  return window.localStorage.getItem(DENSITY_KEY) === "compact" ? "compact" : "comfortable";
}

function resolve(mode: ThemeMode): Theme {
  if (mode === "system") return prefersDark() ? "dark" : "light";
  return mode;
}

function applyToDom(theme: Theme, skin: ThemeSkin, density: Density) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  root.dataset.skin = skin;
  root.dataset.density = density;
  root.style.colorScheme = theme;
}

function persist(key: string, value: string) {
  try { window.localStorage.setItem(key, value); } catch { /* noop */ }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readMode());
  const [skin, setSkinState] = useState<ThemeSkin>(() => readSkin());
  const [density, setDensityState] = useState<Density>(() => readDensity());
  const [systemDark, setSystemDark] = useState<boolean>(() => prefersDark());

  // "system" is only honest if it keeps listening after first paint.
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const theme: Theme = mode === "system" ? (systemDark ? "dark" : "light") : mode;

  useEffect(() => { applyToDom(theme, skin, density); }, [theme, skin, density]);

  // A detached panel window is a separate document sharing this origin's
  // storage: mirroring changes across windows is what keeps a popped-out
  // panel from drifting to a different theme than the hub that spawned it.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === MODE_KEY) setModeState(readMode());
      if (e.key === SKIN_KEY) setSkinState(readSkin());
      if (e.key === DENSITY_KEY) setDensityState(readDensity());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setMode = useCallback((m: ThemeMode) => { setModeState(m); persist(MODE_KEY, m); }, []);
  const setSkin = useCallback((s: ThemeSkin) => { setSkinState(s); persist(SKIN_KEY, s); }, []);
  const setDensity = useCallback((d: Density) => { setDensityState(d); persist(DENSITY_KEY, d); }, []);
  const setTheme = useCallback((t: Theme) => setMode(t), [setMode]);
  const toggleTheme = useCallback(() => setMode(resolve(readMode()) === "dark" ? "light" : "dark"), [setMode]);

  const value = useMemo(
    () => ({ theme, mode, skin, density, setMode, setSkin, setDensity, setTheme, toggleTheme }),
    [theme, mode, skin, density, setMode, setSkin, setDensity, setTheme, toggleTheme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
