import { ExternalLink, EyeOff, PictureInPicture2 } from "lucide-react";
import { PanelBodyView } from "./PanelBodies";
import { appByPanel, alpha, type PanelId } from "@/lib/suite/registry";
import { detachPanel, isDetachSupported, launchApp } from "@/lib/desktop/detach";
import type { Panel } from "@/lib/panels";
import { cn } from "@/lib/utils";

interface PanelCardProps {
  id: PanelId;
  panel: Panel | null;
  /** Titles come from the dictionary; the card itself stays locale-agnostic. */
  title: string;
  emptyLabel: string;
  detachLabel: string;
  openLabel: string;
  hideLabel?: string;
  onHide?: () => void;
  className?: string;
  /** A detached window renders the same body without the card chrome. */
  bare?: boolean;
}

export function PanelCard({
  id, panel, title, emptyLabel, detachLabel, openLabel, hideLabel, onHide, className, bare,
}: PanelCardProps) {
  const app = appByPanel(id);
  if (!app) return null;

  const body = (
    <div className="min-h-0 flex-1 overflow-y-auto scrollbar-slim">
      {panel ? (
        <PanelBodyView body={panel.body} color={app.color} />
      ) : (
        <p className="px-4 py-8 text-center text-xs text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  );

  if (bare) return body;

  return (
    <section
      className={cn("panel-shell", className)}
      style={{ ["--panel-tint" as string]: alpha(app.color) }}
    >
      <header className="panel-header">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: app.color }} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-primary">{title}</h3>
          <p className="truncate text-[10px] text-muted-foreground">
            {app.name}{panel ? ` · ${panel.headline}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {onHide && (
            <button
              type="button"
              onClick={onHide}
              title={hideLabel}
              aria-label={hideLabel}
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground/70 transition-colors hover:bg-muted hover:text-primary"
            >
              <EyeOff className="h-3.5 w-3.5" />
            </button>
          )}
          {isDetachSupported() && (
            <button
              type="button"
              onClick={() => detachPanel(id)}
              title={detachLabel}
              aria-label={detachLabel}
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground/70 transition-colors hover:bg-muted hover:text-primary"
            >
              <PictureInPicture2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => launchApp(app.url, app.id)}
            title={`${openLabel} ${app.name}`}
            aria-label={`${openLabel} ${app.name}`}
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground/70 transition-colors hover:bg-muted hover:text-primary"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>
      {body}
    </section>
  );
}
