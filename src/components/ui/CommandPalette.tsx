import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Blocks, CornerDownLeft, FolderOpen, Home, LayoutGrid, MessageSquare,
  PictureInPicture2, Search, Settings2, Sparkles,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SuiteMark } from "@/components/brand/SuiteMarks";
import { useHub } from "@/lib/i18n/I18nProvider";
import { buildDocIndex, filterDocs, sortByRecency } from "@/lib/docs";
import { SUITE_APPS, alpha, appByPanel } from "@/lib/suite/registry";
import { detachPanel, launchApp } from "@/lib/desktop/detach";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  group: "actions" | "docs" | "apps" | "panels";
  label: string;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
  run: () => void;
}

/** ⌘K over everything the hub already knows about.
 *
 *  The search box borrows the reference set's AI-search shell — one rounded
 *  field, a hairline ring that tightens on focus — but what it searches is
 *  real: the document index, the app registry and the panel list, plus a
 *  handful of navigation actions. The last entry always hands the raw query to
 *  the assistant, so a query that matches nothing is still useful. */
export function CommandPalette({ open, onOpenChange, onOpenSettings }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenSettings: () => void;
}) {
  const h = useHub();
  const p = h.palette;
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) { setQuery(""); setCursor(0); }
  }, [open]);

  const close = () => onOpenChange(false);

  const items = useMemo<Item[]>(() => {
    const term = query.trim();
    const docs = sortByRecency(buildDocIndex());

    const actions: Item[] = [
      { id: "go-home", group: "actions", label: p.goHome, icon: <Home className="h-3.5 w-3.5" />, run: () => navigate("/home") },
      { id: "go-chat", group: "actions", label: p.goChat, icon: <MessageSquare className="h-3.5 w-3.5" />, run: () => navigate("/chat") },
      { id: "go-files", group: "actions", label: p.goFiles, icon: <FolderOpen className="h-3.5 w-3.5" />, run: () => navigate("/files") },
      { id: "go-apps", group: "actions", label: p.goApps, icon: <Blocks className="h-3.5 w-3.5" />, run: () => navigate("/apps") },
      { id: "settings", group: "actions", label: p.openSettings, icon: <Settings2 className="h-3.5 w-3.5" />, run: onOpenSettings },
    ];

    const docItems: Item[] = filterDocs(docs, term, "all").slice(0, 6).map((doc) => ({
      id: doc.id,
      group: "docs",
      label: doc.title,
      sub: `${h.files.kind[doc.kind]} · ${doc.meta}`,
      color: doc.color,
      icon: <SuiteMark app={doc.app} className="h-3.5 w-3.5" />,
      run: () => launchApp(doc.href, doc.app),
    }));

    const lower = term.toLowerCase();
    const appItems: Item[] = SUITE_APPS
      .filter((a) => !term || a.name.toLowerCase().includes(lower))
      .map((a) => ({
        id: `app-${a.id}`,
        group: "apps",
        label: a.name,
        sub: h.landing.descriptions[a.id],
        color: a.color,
        icon: <SuiteMark app={a.id} className="h-3.5 w-3.5" />,
        run: () => launchApp(a.url, a.id),
      }));

    const panelItems: Item[] = SUITE_APPS
      .filter((a) => !term || h.panels[a.panelId].toLowerCase().includes(lower))
      .map((a) => ({
        id: `panel-${a.panelId}`,
        group: "panels",
        label: h.panels[a.panelId],
        sub: `${p.detach} · ${appByPanel(a.panelId)?.name ?? ""}`,
        color: a.color,
        icon: <PictureInPicture2 className="h-3.5 w-3.5" />,
        run: () => detachPanel(a.panelId),
      }));

    const filteredActions = term
      ? actions.filter((a) => a.label.toLowerCase().includes(lower))
      : actions;

    const ask: Item[] = term
      ? [{
          id: "ask",
          group: "actions",
          label: `${p.askOracle} ${term}`,
          icon: <Sparkles className="h-3.5 w-3.5" />,
          run: () => navigate(`/chat?q=${encodeURIComponent(term)}`),
        }]
      : [];

    return [...ask, ...filteredActions, ...docItems, ...appItems, ...panelItems];
  }, [query, h, p, navigate, onOpenSettings]);

  useEffect(() => { setCursor(0); }, [query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${cursor}"]`)?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const run = (item: Item) => { close(); item.run(); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(items.length - 1, c + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)); }
    if (e.key === "Enter") { e.preventDefault(); const item = items[cursor]; if (item) run(item); }
  };

  // Group headers are rendered inline so the flat keyboard index stays simple:
  // one array, one cursor, headers drawn when the group changes.
  let lastGroup: Item["group"] | null = null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[12%] w-[min(600px,94vw)] max-w-none translate-y-0 gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogTitle className="sr-only">{p.open}</DialogTitle>

        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={p.placeholder}
            className="h-12 w-full bg-transparent text-sm text-primary outline-none placeholder:text-muted-foreground/70"
          />
        </div>

        <div ref={listRef} className="scrollbar-slim max-h-[52vh] overflow-y-auto p-1.5">
          {items.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">{p.empty}</p>
          )}
          {items.map((item, index) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <div key={item.id}>
                {header && (
                  <p className="px-2.5 pb-1 pt-2.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
                    {p.groups[header]}
                  </p>
                )}
                <button
                  type="button"
                  data-index={index}
                  onMouseEnter={() => setCursor(index)}
                  onClick={() => run(item)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors",
                    cursor === index ? "bg-surface-veil text-primary" : "text-muted-foreground hover:text-primary",
                  )}
                >
                  <span
                    className="grid h-6 w-6 shrink-0 place-items-center rounded"
                    style={item.color ? { background: alpha(item.color), color: item.color } : undefined}
                  >
                    {item.icon ?? <LayoutGrid className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-primary">{item.label}</span>
                    {item.sub && <span className="block truncate text-[11px] text-muted-foreground">{item.sub}</span>}
                  </span>
                  {cursor === index && <CornerDownLeft className="h-3 w-3 shrink-0 text-muted-foreground" />}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
          <span>↑↓ {p.hint}</span>
          <span>↵ {p.enter}</span>
          <span>esc {p.escape}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Binds ⌘K / Ctrl+K. Kept out of the component so the layout owns the state
 *  and can also open the palette from a button. */
export function useCommandPaletteShortcut(onOpen: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpen]);
}
