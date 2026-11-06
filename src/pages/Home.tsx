import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Flame, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityRings, type Ring } from "@/components/data/ActivityRings";
import { RadarChart, type RadarAxis } from "@/components/data/RadarChart";
import { Carousel } from "@/components/data/Carousel";
import { MiniBars } from "@/components/data/Sparkline";
import { PanelCard } from "@/components/panels/PanelCard";
import { useAuth } from "@/lib/auth";
import { useHub } from "@/lib/i18n/I18nProvider";
import { usePrefs } from "@/lib/prefs/store";
import { togglePanel } from "@/lib/prefs/service";
import { buildPanels, orderedPanels } from "@/lib/panels";
import { buildDocIndex, sortByRecency } from "@/lib/docs";
import { densify, loadUsage, summarize, USAGE_EVENT } from "@/lib/usage/store";
import { appById, SUITE_APPS, alpha, type PanelId } from "@/lib/suite/registry";
import { launchApp } from "@/lib/desktop/detach";
import { DESK_PULLED_EVENT } from "@/lib/sync/deskSync";
import { SuiteMark } from "@/components/brand/SuiteMarks";
import { OlympusMark } from "@/components/brand/OlympusMark";
import { cn } from "@/lib/utils";

function greeting(h: ReturnType<typeof useHub>["home"], hour = new Date().getHours()): string {
  if (hour < 12) return h.greetingMorning;
  if (hour < 19) return h.greetingAfternoon;
  return h.greetingEvening;
}

function compact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

/** A bento tile. The dashboard never scrolls as a page, so every tile owns its
 *  own overflow and none of them may grow past their grid row. */
function Tile({
  label, action, children, className, bodyClassName,
}: {
  label?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("olympus-card flex min-h-0 flex-col overflow-hidden", className)}>
      {label && (
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.22em] text-secondary">{label}</p>
          {action}
        </header>
      )}
      <div className={cn("min-h-0 flex-1 overflow-auto scrollbar-slim", bodyClassName)}>{children}</div>
    </section>
  );
}

export default function Home() {
  const { session, isCloud } = useAuth();
  const h = useHub();
  const { prefs, update } = usePrefs();
  const [radarActive, setRadarActive] = useState<string | null>(null);

  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    window.addEventListener(DESK_PULLED_EVENT, bump);
    window.addEventListener(USAGE_EVENT, bump);
    return () => {
      window.removeEventListener(DESK_PULLED_EVENT, bump);
      window.removeEventListener(USAGE_EVENT, bump);
    };
  }, [bump]);

  const panels = useMemo(() => buildPanels(), [version]);
  const docs = useMemo(() => sortByRecency(buildDocIndex()).slice(0, 12), [version]);
  const ledger = useMemo(() => loadUsage(), [version]);
  const usage = useMemo(() => summarize(ledger), [ledger]);

  const hidden = prefs.panels?.hidden ?? [];
  const visible = orderedPanels(prefs.panels?.order ?? [], hidden);
  const hide = (id: PanelId) => update((p) => togglePanel(p, id));

  const name = session?.name?.trim().split(" ")[0] ?? "";

  /* ── Today's rings: three real ratios, one per domain that has one ──────── */
  const rings = useMemo<Ring[]>(() => {
    const out: Ring[] = [];

    const day = panels.get("chronos-dayplanner");
    if (day?.body.kind === "dayplanner" && day.body.blocks.length > 0) {
      out.push({
        id: "chronos",
        label: h.home.ringsChronos,
        current: day.body.doneCount,
        target: day.body.blocks.length,
        unit: "",
        color: appById("chronos").color,
      });
    }

    const now = panels.get("kairos-now");
    if (now?.body.kind === "now") {
      const target = now.body.doneToday + now.body.dueToday + now.body.overdue;
      if (target > 0) {
        out.push({
          id: "kairos",
          label: h.home.ringsKairos,
          current: now.body.doneToday,
          target,
          unit: "",
          color: appById("kairos").color,
        });
      }
    }

    const balance = panels.get("pluto-balance");
    if (balance?.body.kind === "balance" && balance.body.budgets.length > 0) {
      const spent = balance.body.budgets.reduce((sum, b) => sum + b.spentCents, 0);
      const limit = balance.body.budgets.reduce((sum, b) => sum + b.limitCents, 0);
      if (limit > 0) {
        out.push({
          id: "pluto",
          label: h.home.ringsPluto,
          current: Math.round(spent / 100),
          target: Math.round(limit / 100),
          unit: "R$",
          unitPrefix: true,
          color: appById("pluto").color,
        });
      }
    }

    return out;
  }, [panels, h.home]);

  /* ── Radar: one axis per app, plus the hub itself ───────────────────────── */
  const radar = useMemo<RadarAxis[]>(() => {
    const days = densify(ledger, 30);
    const launches = new Map<string, number>();
    let messages = 0;
    for (const d of days) {
      messages += d.messages;
      for (const [app, count] of Object.entries(d.apps)) {
        launches.set(app, (launches.get(app) ?? 0) + (count ?? 0));
      }
    }
    const raw: { id: string; label: string; color: string; count: number; unit: string }[] = [
      ...SUITE_APPS.map((app) => ({
        id: app.id,
        label: app.name,
        color: app.color,
        count: launches.get(app.id) ?? 0,
        unit: h.home.radarUnit,
      })),
      {
        id: "olympus",
        label: "Olympus",
        color: "hsl(38 30% 62%)",
        count: messages,
        unit: h.home.radarSelf,
      },
    ];
    const max = Math.max(1, ...raw.map((r) => r.count));
    return raw.map((r) => ({
      id: r.id,
      label: r.label,
      color: r.color,
      value: r.count / max,
      detail: `${r.count} ${r.unit}`,
    }));
  }, [ledger, h.home]);

  const radarEmpty = radar.every((a) => a.value === 0);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-secondary">{h.home.eyebrow}</p>
          <h1 className="font-display text-xl leading-tight text-primary">
            {greeting(h.home)}{name ? `, ${name}` : ""}.
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {h.home.usageMessages}
            </div>
            <div className="num text-sm text-primary">{usage.messages7}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {h.home.usageTokens}
            </div>
            <div className="num text-sm text-primary">{compact(usage.tokens7)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {h.home.usageStreak}
            </div>
            <div className="num flex items-center justify-end gap-1 text-sm text-primary">
              <Flame className="h-3 w-3 text-secondary" />
              {usage.streak}
            </div>
          </div>
          <div className="hidden w-24 xl:block">
            <MiniBars
              values={usage.series.map((d) => d.messages)}
              labels={usage.series.map((d) => d.date.slice(5))}
              color="hsl(var(--secondary))"
              height={26}
            />
          </div>
        </div>
      </header>

      {!isCloud && (
        <div className="olympus-card flex shrink-0 flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 text-xs leading-relaxed text-muted-foreground">
            <span className="text-primary">{h.home.guestTitle}.</span> {h.home.guestLead}
          </p>
          <Button asChild size="sm" className="shrink-0">
            <Link to="/login">{h.home.guestCta}</Link>
          </Button>
        </div>
      )}

      {/* ── Bento ──────────────────────────────────────────────────────────
          Below `lg` this is a normal stacked column that scrolls; from `lg` up
          it is a fixed-height grid and only the tiles scroll. */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-12 lg:grid-rows-6">
        {/* Panels — the meat, and the only tile that scrolls sideways */}
        <Tile
          className="lg:col-span-8 lg:row-span-4"
          bodyClassName="overflow-hidden p-3"
          label={h.home.panelsEyebrow}
          action={
            hidden.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1">
                {hidden.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => hide(id)}
                    className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-secondary hover:text-primary"
                  >
                    {h.panels[id]} · {h.home.restore}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-[10px] text-muted-foreground">{h.home.panelsLead}</span>
            )
          }
        >
          <div className="scrollbar-slim flex h-full snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden pb-1">
            {visible.map((id) => (
              <div key={id} className="h-full w-[330px] shrink-0 snap-start">
                <PanelCard
                  id={id}
                  panel={panels.get(id) ?? null}
                  title={h.panels[id]}
                  emptyLabel={h.panels.empty}
                  detachLabel={h.panels.detach}
                  openLabel={h.panels.open}
                  hideLabel={h.panels.hide}
                  onHide={() => hide(id)}
                  className="h-full"
                />
              </div>
            ))}
          </div>
        </Tile>

        {/* Today's rings */}
        <Tile className="lg:col-span-4 lg:row-span-3" label={h.home.ringsEyebrow} bodyClassName="grid place-items-center p-4">
          {rings.length > 0 ? (
            <ActivityRings rings={rings} size={148} />
          ) : (
            <p className="text-xs text-muted-foreground">{h.home.ringsEmpty}</p>
          )}
        </Tile>

        {/* Radar over the six apps */}
        <Tile
          className="lg:col-span-4 lg:row-span-3"
          label={h.home.radarEyebrow}
          action={<span className="text-[10px] text-muted-foreground">{h.home.radarWindow}</span>}
          bodyClassName="grid place-items-center p-2"
        >
          {radarEmpty ? (
            <p className="text-xs text-muted-foreground">{h.home.radarEmpty}</p>
          ) : (
            <RadarChart axes={radar} size={216} activeId={radarActive} onHover={setRadarActive} />
          )}
        </Tile>

        {/* Recents */}
        <Tile
          className="lg:col-span-8 lg:row-span-2"
          bodyClassName="overflow-hidden px-3 pb-3 pt-2"
          label={h.home.recentEyebrow}
          action={
            <Link to="/files" className="flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-primary">
              {h.home.seeAll} <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          {docs.length === 0 ? (
            <p className="px-1 text-xs text-muted-foreground">{h.home.recentEmpty}</p>
          ) : (
            <div className="scrollbar-slim flex h-full snap-x gap-2 overflow-x-auto overflow-y-hidden pb-1">
              {docs.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => launchApp(doc.href, doc.app)}
                  className="group flex h-full w-[212px] shrink-0 snap-start flex-col justify-between rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-left transition-colors hover:border-secondary/60"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-md"
                      style={{ background: alpha(doc.color), color: doc.color }}
                    >
                      <SuiteMark app={doc.app} className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs text-primary">{doc.title}</span>
                  </span>
                  <span className="truncate text-[10px] text-muted-foreground">
                    {h.files.kind[doc.kind]} · {doc.meta}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Tile>
      </div>
    </div>
  );
}
