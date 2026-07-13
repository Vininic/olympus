import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { DESK_PULLED_EVENT } from "@/lib/sync/deskSync";
import type { ChronosView } from "./chronos";
import { parseChronos } from "./chronos";
import type { KairosView } from "./kairos";
import { parseKairos } from "./kairos";
import type { PlutoView } from "./pluto";
import { parsePluto } from "./pluto";
import type { HermesView } from "./hermes";
import { parseHermes } from "./hermes";
import type { ChironView } from "./chiron";
import { parseChiron } from "./chiron";

export interface DeskViews {
  chronos: ChronosView | null;
  kairos: KairosView | null;
  pluto: PlutoView | null;
  hermes: HermesView | null;
  chiron: ChironView | null;
}

interface DeskState {
  views: DeskViews;
  loading: boolean;
}

type DeskAction = { type: "REFRESH" };

function readStorageViews(): DeskViews {
  function read<T>(key: string, parser: (raw: any) => T | null): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const { value } = JSON.parse(raw);
      return parser(value);
    } catch {
      return null;
    }
  }

  return {
    chronos: read("olympus.view.chronos", parseChronos),
    kairos: read("olympus.view.kairos", parseKairos),
    pluto: read("olympus.view.pluto", parsePluto),
    hermes: read("olympus.view.hermes", parseHermes),
    chiron: read("olympus.view.chiron", parseChiron),
  };
}

function deskReducer(state: DeskState, action: DeskAction): DeskState {
  switch (action.type) {
    case "REFRESH":
      return { ...state, views: readStorageViews(), loading: false };
    default:
      return state;
  }
}

const DeskContext = createContext<DeskState | null>(null);

export function DeskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(deskReducer, {
    views: readStorageViews(),
    loading: true,
  });

  const refresh = useCallback(() => dispatch({ type: "REFRESH" }), []);

  useEffect(() => {
    refresh();
    window.addEventListener(DESK_PULLED_EVENT, refresh);
    return () => window.removeEventListener(DESK_PULLED_EVENT, refresh);
  }, [refresh]);

  const value = useMemo(() => state, [state]);
  return <DeskContext.Provider value={value}>{children}</DeskContext.Provider>;
}

export function useDeskViews(): DeskState {
  const ctx = useContext(DeskContext);
  if (!ctx) throw new Error("useDeskViews must be used inside DeskProvider");
  return ctx;
}
