import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { emptyPrefs, type SuitePrefs } from "./types";
import { pullPrefs, pushPrefs } from "./sync";
import { setDisplayName, setTheme, setLocale } from "./service";

interface PrefsState {
  prefs: SuitePrefs;
  loading: boolean;
  dirty: boolean;
}

type PrefsAction =
  | { type: "SET_PREFS"; prefs: SuitePrefs }
  | { type: "UPDATE"; updater: (p: SuitePrefs) => SuitePrefs };

function prefsReducer(state: PrefsState, action: PrefsAction): PrefsState {
  switch (action.type) {
    case "SET_PREFS":
      return { prefs: action.prefs, loading: false, dirty: false };
    case "UPDATE": {
      const next = action.updater(state.prefs);
      return { ...state, prefs: next, dirty: true };
    }
    default:
      return state;
  }
}

const PrefsContext = createContext<{
  state: PrefsState;
  updateName: (name: string) => void;
  updateTheme: (theme: "light" | "dark") => void;
  updateLocale: (locale: string) => void;
  flush: () => Promise<void>;
} | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const { isCloud } = useAuth();
  const [state, dispatch] = useReducer(prefsReducer, { prefs: emptyPrefs(), loading: true, dirty: false });

  useEffect(() => {
    if (!isCloud) { dispatch({ type: "SET_PREFS", prefs: emptyPrefs() }); return; }
    void pullPrefs().then((p) => dispatch({ type: "SET_PREFS", prefs: p || emptyPrefs() }));
  }, [isCloud]);

  const updateName = useCallback((name: string) => {
    dispatch({ type: "UPDATE", updater: (p) => setDisplayName(p, name) });
  }, []);

  const updateTheme = useCallback((theme: "light" | "dark") => {
    dispatch({ type: "UPDATE", updater: (p) => setTheme(p, theme) });
  }, []);

  const updateLocale = useCallback((locale: string) => {
    dispatch({ type: "UPDATE", updater: (p) => setLocale(p, locale) });
  }, []);

  const flush = useCallback(async () => {
    if (state.dirty) { await pushPrefs(state.prefs); }
  }, [state.dirty, state.prefs]);

  useEffect(() => {
    const h = () => { if (state.dirty) void pushPrefs(state.prefs); };
    document.addEventListener("visibilitychange", h);
    window.addEventListener("beforeunload", h);
    return () => { document.removeEventListener("visibilitychange", h); window.removeEventListener("beforeunload", h); };
  }, [state.dirty, state.prefs]);

  const value = useMemo(() => ({ state, updateName, updateTheme, updateLocale, flush }), [state, updateName, updateTheme, updateLocale, flush]);
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used inside PrefsProvider");
  return ctx;
}
