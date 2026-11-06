import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  accent?: string;
  children?: ReactNode;
  className?: string;
}

/** Eyebrow label, tabular number, optional footer slot for a sparkline —
 *  the one stat primitive the hub uses everywhere, so a number on Home and
 *  the same number on Account never render two different ways. */
export function StatTile({ label, value, hint, icon, accent, children, className }: StatTileProps) {
  return (
    <div className={cn("olympus-card dense-card flex flex-col justify-between gap-3", className)}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</span>
        {icon && <span className="shrink-0 text-secondary" style={accent ? { color: accent } : undefined}>{icon}</span>}
      </div>
      <div>
        <div className="num font-display text-2xl leading-none text-primary">{value}</div>
        {hint && <div className="mt-1.5 text-[11px] text-muted-foreground">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

interface MeterBarProps {
  label: string;
  /** 0–1; values above 1 render as an overrun rather than clamping silently. */
  ratio: number;
  right?: string;
  color?: string;
  className?: string;
}

export function MeterBar({ label, ratio, right, color, className }: MeterBarProps) {
  const over = ratio > 1;
  const width = Math.min(100, Math.max(0, ratio * 100));
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate text-xs text-primary">{label}</span>
        {right && (
          <span className={cn("num shrink-0 text-[11px]", over ? "text-destructive" : "text-muted-foreground")}>
            {right}
          </span>
        )}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${width}%`,
            background: over ? "hsl(var(--destructive))" : color ?? "hsl(var(--secondary))",
          }}
        />
      </div>
    </div>
  );
}
