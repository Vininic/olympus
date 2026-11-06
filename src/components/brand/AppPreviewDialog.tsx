import { Check, ExternalLink, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SuiteMark } from "./SuiteMarks";
import { useHub } from "@/lib/i18n/I18nProvider";
import { SUITE_APPS, alpha, type SuiteAppId } from "@/lib/suite/registry";

/** What a wheel spoke opens.
 *
 *  Clicking used to navigate straight out to the sibling's deploy, which meant
 *  the landing page's only interaction was "leave". A preview answers the
 *  question the click was actually asking — what is this app, what does it put
 *  into the hub — and keeps the outbound link as an explicit second step. */
export function AppPreviewDialog({
  app, onOpenChange,
}: { app: SuiteAppId | null; onOpenChange: (open: boolean) => void }) {
  const h = useHub();
  const l = h.landing;
  const meta = app ? SUITE_APPS.find((a) => a.id === app) ?? null : null;

  return (
    <Dialog open={!!meta} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(460px,94vw)] gap-0 overflow-hidden p-0 sm:rounded-xl">
        {meta && (
          <>
            <div
              className="flex items-center gap-3 border-b border-border px-5 py-4"
              style={{ background: alpha(meta.color) }}
            >
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border bg-card"
                style={{ borderColor: alpha(meta.color, "border"), color: meta.color }}
              >
                <SuiteMark app={meta.id} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: meta.color }}>
                  {l.roles[meta.id]}
                </p>
                <DialogTitle className="font-display text-xl leading-tight text-primary">
                  {meta.name}
                </DialogTitle>
              </div>
              <span
                className={
                  meta.status === "live"
                    ? "shrink-0 text-[10px] uppercase tracking-[0.16em] text-emerald-600"
                    : "shrink-0 text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
                }
              >
                {meta.status === "live" ? l.live : l.atelier}
              </span>
            </div>

            <div className="px-5 py-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {l.descriptions[meta.id]}
              </p>

              <ul className="mt-4 flex flex-col gap-2">
                {l.previews[meta.id].map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: meta.color }} />
                    <span className="text-xs leading-relaxed text-primary">{point}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex flex-col gap-2 rounded-lg border border-border bg-surface-raised p-3">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-secondary" />
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {l.previewPanel}
                  </span>
                  <span className="ml-auto text-xs text-primary">{h.panels[meta.panelId]}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {l.previewProvides}
                  </span>
                  {meta.capabilities.map((capability) => (
                    <span
                      key={capability}
                      className="rounded-full px-2 py-0.5 text-[10px]"
                      style={{ background: alpha(meta.color), color: meta.color }}
                    >
                      {h.apps.capability[capability]}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                {h.common.close}
              </Button>
              <Button size="sm" asChild>
                <a href={meta.url} target="_blank" rel="noopener noreferrer">
                  {l.previewOpen} <ExternalLink className="ml-1.5 h-3 w-3" />
                </a>
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
