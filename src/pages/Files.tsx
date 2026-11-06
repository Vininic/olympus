import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Carousel } from "@/components/data/Carousel";
import { Dropzone } from "@/components/data/Dropzone";
import { SuiteMark } from "@/components/brand/SuiteMarks";
import { useAuth } from "@/lib/auth";
import { useHub } from "@/lib/i18n/I18nProvider";
import { buildDocIndex, filterDocs, sortByRecency, type SuiteDoc } from "@/lib/docs";
import { appById, alpha, SUITE_APPS, type SuiteAppId } from "@/lib/suite/registry";
import { launchApp } from "@/lib/desktop/detach";
import { stageAttachments } from "@/lib/ai/pendingAttachments";
import { DESK_PULLED_EVENT } from "@/lib/sync/deskSync";
import { cn } from "@/lib/utils";

function relative(iso: string | null, never: string): string {
  if (!iso) return never;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return never;
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 30) return `${days} dias`;
  return new Date(iso).toLocaleDateString();
}

function DocCard({ doc, meta }: { doc: SuiteDoc; meta: string }) {
  return (
    <button
      type="button"
      onClick={() => launchApp(doc.href, doc.app)}
      className="group flex h-[104px] w-[220px] shrink-0 snap-start flex-col justify-between rounded-xl border border-border bg-card px-3.5 py-3 text-left shadow-soft transition-colors hover:border-secondary/60"
    >
      <span className="flex items-start gap-2">
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
          style={{ background: alpha(doc.color), color: doc.color }}
        >
          <SuiteMark app={doc.app} className="h-4 w-4" />
        </span>
        <span className="line-clamp-2 min-w-0 flex-1 text-xs leading-snug text-primary">{doc.title}</span>
      </span>
      <span className="flex items-center justify-between gap-2">
        <span className="truncate text-[10px] text-muted-foreground">{doc.meta}</span>
        <span className="shrink-0 text-[10px] text-muted-foreground/70">{meta}</span>
      </span>
    </button>
  );
}

export default function Files() {
  const h = useHub();
  const navigate = useNavigate();
  const { isCloud } = useAuth();
  const [query, setQuery] = useState("");
  const [app, setApp] = useState<SuiteAppId | "all">("all");
  const [staged, setStaged] = useState(0);
  const [version, setVersion] = useState(0);

  const bump = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    window.addEventListener(DESK_PULLED_EVENT, bump);
    return () => window.removeEventListener(DESK_PULLED_EVENT, bump);
  }, [bump]);

  const docs = useMemo(() => sortByRecency(buildDocIndex()), [version]);
  const visible = useMemo(() => filterDocs(docs, query, app), [docs, query, app]);
  const recent = useMemo(() => docs.slice(0, 10), [docs]);

  // The search box is the only thing that should ever hide the recents rail —
  // when you are looking for something specific, "here is everything, newest
  // first" is noise.
  const searching = query.trim().length > 0 || app !== "all";

  const grouped = useMemo(() => {
    const map = new Map<SuiteAppId, SuiteDoc[]>();
    for (const doc of visible) {
      const list = map.get(doc.app) ?? [];
      list.push(doc);
      map.set(doc.app, list);
    }
    return [...map.entries()];
  }, [visible]);

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      <header>
        <p className="mb-1 text-xs uppercase tracking-[0.3em] text-secondary">{h.files.eyebrow}</p>
        <h1 className="font-display text-2xl text-primary">{h.files.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{h.files.lead}</p>
      </header>

      {!searching && recent.length > 0 && (
        <Carousel
          label={h.files.recentEyebrow}
          scrollLeftLabel={h.home.scrollLeft}
          scrollRightLabel={h.home.scrollRight}
          step={232}
        >
          {recent.map((doc) => (
            <DocCard key={doc.id} doc={doc} meta={relative(doc.updatedAt, h.files.never)} />
          ))}
        </Carousel>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={h.files.search}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setApp("all")}
            className={cn(
              "rounded-full border px-3 py-1 text-[11px] transition-colors",
              app === "all"
                ? "border-secondary bg-secondary/15 text-primary"
                : "border-border text-muted-foreground hover:text-primary",
            )}
          >
            {h.files.all}
          </button>
          {SUITE_APPS.map((suite) => (
            <button
              key={suite.id}
              type="button"
              onClick={() => setApp(app === suite.id ? "all" : suite.id)}
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors"
              style={
                app === suite.id
                  ? { borderColor: suite.color, background: alpha(suite.color), color: suite.color }
                  : { borderColor: "hsl(var(--border))" }
              }
            >
              <SuiteMark app={suite.id} className="h-3 w-3" />
              {suite.name}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="olympus-card dense-card text-center text-xs text-muted-foreground">
          {isCloud ? h.files.empty : h.files.emptyGuest}
          {!isCloud && (
            <Link to="/login" className="ml-1 text-secondary underline-offset-2 hover:underline">
              {h.home.guestCta}
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {grouped.map(([appId, list]) => (
            <section key={appId}>
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="grid h-5 w-5 place-items-center rounded"
                  style={{ background: alpha(appById(appId).color), color: appById(appId).color }}
                >
                  <SuiteMark app={appId} className="h-3 w-3" />
                </span>
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {appById(appId).name}
                </p>
                <span className="num text-[10px] text-muted-foreground/60">{list.length}</span>
              </div>
              <div className="olympus-card overflow-hidden">
                <ul>
                  {list.map((doc) => (
                    <li key={doc.id}>
                      <button
                        type="button"
                        onClick={() => launchApp(doc.href, doc.app)}
                        className="group flex w-full items-center gap-3 border-b border-border/50 px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-surface-veil/50"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-primary">{doc.title}</span>
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {h.files.kind[doc.kind]} · {doc.meta}
                          </span>
                        </span>
                        <span className="hidden shrink-0 text-[11px] text-muted-foreground sm:block">
                          {doc.updatedAt
                            ? `${h.files.updated} ${relative(doc.updatedAt, h.files.never)}`
                            : h.files.never}
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-secondary" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Bringing a file *into* the suite means bringing it into the
          conversation — nothing else here can read one. */}
      <section className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <Dropzone
          onFiles={(files) => {
            stageAttachments(files);
            setStaged((n) => n + files.length);
          }}
          label={h.files.dropLabel}
          hint={h.files.dropHint}
          rejectedLabel={h.files.dropRejected}
        />
        {staged > 0 && (
          <Button size="sm" onClick={() => navigate("/chat")} className="shrink-0">
            {staged} {h.files.dropStaged} <ArrowRight className="ml-1.5 h-3 w-3" />
          </Button>
        )}
      </section>
    </div>
  );
}
