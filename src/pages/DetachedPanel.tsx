import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ExternalLink, RefreshCw } from "lucide-react";
import { PanelBodyView } from "@/components/panels/PanelBodies";
import { useHub } from "@/lib/i18n/I18nProvider";
import { buildPanel } from "@/lib/panels";
import { appByPanel, alpha, type PanelId } from "@/lib/suite/registry";
import { DESK_PULLED_EVENT, pullDesk } from "@/lib/sync/deskSync";

/** A panel living in its own window: no sidebar, no topbar, no page chrome.
 *
 *  It shares the hub's origin, so the mirrored rows, the theme and the locale
 *  are already in localStorage — the window opens with real content instead of
 *  a loading state. It also re-pulls on its own, because the hub window that
 *  spawned it may well be closed. */
export default function DetachedPanel() {
  const { panelId } = useParams<{ panelId: string }>();
  const h = useHub();
  const [version, setVersion] = useState(0);
  const [pulling, setPulling] = useState(false);

  const id = panelId as PanelId | undefined;
  const app = id ? appByPanel(id) : null;

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    window.addEventListener(DESK_PULLED_EVENT, bump);
    // localStorage writes from the hub window land here as storage events.
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith("olympus.view.")) bump();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(DESK_PULLED_EVENT, bump);
      window.removeEventListener("storage", onStorage);
    };
  }, [bump]);

  useEffect(() => {
    const timer = setInterval(() => { void refresh(); }, 60_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = async () => {
    setPulling(true);
    await pullDesk();
    setPulling(false);
    bump();
  };

  const panel = useMemo(() => (id ? buildPanel(id) : null), [id, version]);

  useEffect(() => {
    if (app && id) document.title = `${h.panels[id]} · ${app.name}`;
  }, [app, id, h.panels]);

  if (!id || !app) {
    return <div className="grid h-screen place-items-center text-sm text-muted-foreground">404</div>;
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header
        className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2.5"
        style={{ background: alpha(app.color) }}
      >
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: app.color }} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-medium text-primary">{h.panels[id]}</h1>
          <p className="truncate text-[10px] text-muted-foreground">
            {app.name}{panel ? ` · ${panel.headline}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
          aria-label="Atualizar"
          title="Atualizar"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${pulling ? "animate-spin" : ""}`} />
        </button>
        <a
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
          aria-label={`${h.panels.open} ${app.name}`}
          title={`${h.panels.open} ${app.name}`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto scrollbar-slim">
        {panel ? (
          <PanelBodyView body={panel.body} color={app.color} />
        ) : (
          <p className="px-4 py-10 text-center text-xs text-muted-foreground">{h.panels.empty}</p>
        )}
      </main>

      <footer className="shrink-0 border-t border-border px-3 py-1.5 text-center text-[10px] text-muted-foreground">
        {h.panels.detachedHint}
      </footer>
    </div>
  );
}
