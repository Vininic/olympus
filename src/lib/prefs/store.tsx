import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { emptyPrefs, migrate, type SuitePrefs } from "./types";
import { pullPrefs, pushPrefs } from "./sync";
import * as service from "./service";

/** Local mirror. v1 kept prefs cloud-only, which meant a guest could not even
 *  pick a theme — every appearance/panel/speech setting silently reset on
 *  reload. Prefs are now local-first; the cloud copy is a mirror for accounts. */
const LOCAL_KEY = "olympus.prefs.v2";

function readLocal(): SuitePrefs {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? migrate(JSON.parse(raw)) : emptyPrefs();
  } catch {
    return emptyPrefs();
  }
}

function writeLocal(prefs: SuitePrefs): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(prefs));
  } catch {
    /* storage full — keep running in memory */
  }
}

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
      writeLocal(action.prefs);
      return { prefs: action.prefs, loading: false, dirty: false };
    case "UPDATE": {
      const next = action.updater(state.prefs);
      writeLocal(next);
      return { ...state, prefs: next, dirty: true };
    }
    default:
      return state;
  }
}

type Updater = (p: SuitePrefs) => SuitePrefs;

interface PrefsContextValue {
  state: PrefsState;
  prefs: SuitePrefs;
  update: (updater: Updater) => void;
  updateName: (name: string) => void;
  updateTheme: (theme: "light" | "dark") => void;
  updateLocale: (locale: string) => void;
  flush: () => Promise<void>;
}

const PrefsContext = createContext<PrefsContextValue | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const { isCloud } = useAuth();
  const [state, dispatch] = useReducer(prefsReducer, undefined, () => ({
    prefs: readLocal(),
    loading: true,
    dirty: false,
  }));

  useEffect(() => {
    if (!isCloud) {
      dispatch({ type: "SET_PREFS", prefs: readLocal() });
      return;
    }
    void pullPrefs().then((remote) => {
      // A remote document wins on login (it is the cross-device truth), but a
      // missing one must not wipe what this browser already had.
      dispatch({ type: "SET_PREFS", prefs: remote ? migrate(remote) : readLocal() });
    });
  }, [isCloud]);

  const update = useCallback((updater: Updater) => {
    dispatch({ type: "UPDATE", updater });
  }, []);

  const updateName = useCallback((name: string) => {
    dispatch({ type: "UPDATE", updater: (p) => service.setDisplayName(p, name) });
  }, []);

  const updateTheme = useCallback((theme: "light" | "dark") => {
    dispatch({ type: "UPDATE", updater: (p) => service.setTheme(p, theme) });
  }, []);

  const updateLocale = useCallback((locale: string) => {
    dispatch({ type: "UPDATE", updater: (p) => service.setLocale(p, locale) });
  }, []);

  const flush = useCallback(async () => {
    if (state.dirty && isCloud) await pushPrefs(state.prefs);
  }, [state.dirty, state.prefs, isCloud]);

  useEffect(() => {
    if (!isCloud) return;
    const h = () => { if (state.dirty) void pushPrefs(state.prefs); };
    document.addEventListener("visibilitychange", h);
    window.addEventListener("beforeunload", h);
    return () => {
      document.removeEventListener("visibilitychange", h);
      window.removeEventListener("beforeunload", h);
    };
  }, [state.dirty, state.prefs, isCloud]);

  // Debounced push, so a burst of slider drags in Settings is one write.
  useEffect(() => {
    if (!isCloud || !state.dirty) return;
    const timer = setTimeout(() => { void pushPrefs(state.prefs); }, 1000);
    return () => clearTimeout(timer);
  }, [state.dirty, state.prefs, isCloud]);

  const value = useMemo<PrefsContextValue>(
    () => ({ state, prefs: state.prefs, update, updateName, updateTheme, updateLocale, flush }),
    [state, update, updateName, updateTheme, updateLocale, flush],
  );
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): PrefsContextValue {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used inside PrefsProvider");
  return ctx;
}
