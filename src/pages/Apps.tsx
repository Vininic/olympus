import { Blocks, Download, ExternalLink, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useHub } from "@/lib/i18n/I18nProvider";
import { usePrefs } from "@/lib/prefs/store";
import { setExtensionEnabled } from "@/lib/prefs/service";
import { allExtensions, isEnabled, type ExtensionManifest } from "@/lib/extensions/registry";
import { alpha, type SuiteAppId } from "@/lib/suite/registry";
import { SuiteMark } from "@/components/brand/SuiteMarks";
import { OlympusMark } from "@/components/brand/OlympusMark";
import { launchApp } from "@/lib/desktop/detach";
import { cn } from "@/lib/utils";

function ExtensionCard({ ext }: { ext: ExtensionManifest }) {
  const h = useHub();
  const { prefs, update } = usePrefs();
  const enabled = isEnabled(prefs, ext.id);

  return (
    <div className={cn("olympus-card flex flex-col gap-3 dense-card", !enabled && "opacity-60")}>
      <div className="flex items-start gap-3">
        {/* A suite app shows its own mark; a hub-provided extension shows the
            hub's. A letter in a square was standing in for an icon we already
            had. */}
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
          style={{ background: alpha(ext.color), color: ext.color }}
        >
          {ext.kind === "app" ? (
            <SuiteMark app={ext.id as SuiteAppId} className="h-5 w-5" />
          ) : (
            <OlympusMark className="h-5 w-5" strokeWidth={5} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-base text-primary">{ext.name}</h3>
            <span
              className={cn(
                "shrink-0 text-[9px] uppercase tracking-[0.16em]",
                ext.status === "live" ? "text-emerald-600" : "text-muted-foreground",
              )}
            >
              {ext.status === "live" ? h.apps.live : h.apps.atelier}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">{ext.author}</p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(v) => update((p) => setExtensionEnabled(p, ext.id, v))}
          aria-label={enabled ? h.apps.enabled : h.apps.disabled}
        />
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">{ext.description}</p>

      <div className="flex flex-wrap items-center gap-1">
        <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {h.apps.capabilities}
        </span>
        {ext.capabilities.map((capability) => (
          <span
            key={capability}
            className="rounded-full px-2 py-0.5 text-[10px]"
            style={{ background: alpha(ext.color), color: ext.color }}
          >
            {h.apps.capability[capability]}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center gap-2 pt-1">
        {ext.url ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => launchApp(ext.url!, ext.id as SuiteAppId)}
            disabled={!enabled}
          >
            {h.apps.open} <ExternalLink className="ml-1.5 h-3 w-3" />
          </Button>
        ) : (
          <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {h.apps.builtin}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Apps() {
  const h = useHub();
  const extensions = allExtensions();

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8">
      <header>
        <p className="mb-1 text-xs uppercase tracking-[0.3em] text-secondary">{h.apps.eyebrow}</p>
        <h1 className="font-display text-2xl text-primary">{h.apps.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{h.apps.lead}</p>
      </header>

      <section>
        <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-secondary">{h.apps.suiteApps}</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {extensions.filter((e) => e.kind === "app").map((ext) => (
            <ExtensionCard key={ext.id} ext={ext} />
          ))}
        </div>
      </section>

      <section>
        <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-secondary">{h.apps.extensions}</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {extensions.filter((e) => e.kind === "extension").map((ext) => (
            <ExtensionCard key={ext.id} ext={ext} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="olympus-card dense-card">
          <div className="mb-2 flex items-center gap-2">
            <Download className="h-4 w-4 text-secondary" />
            <h3 className="font-display text-base text-primary">{h.apps.installTitle}</h3>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{h.apps.installLead}</p>
        </div>
        <div className="olympus-card dense-card">
          <div className="mb-2 flex items-center gap-2">
            <Plug className="h-4 w-4 text-secondary" />
            <h3 className="font-display text-base text-primary">{h.apps.bridgeTitle}</h3>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{h.apps.bridgeLead}</p>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Blocks className="h-3 w-3 text-secondary" />
            {extensions.length} {h.apps.eyebrow.toLowerCase()}
          </div>
        </div>
      </section>
    </div>
  );
}
