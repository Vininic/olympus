import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface Ring {
  id: string;
  label: string;
  current: number;
  target: number;
  unit: string;
  /** Currencies read before the number in pt-BR ("R$ 993"), counts read after
   *  ("12 min"). Getting this wrong produced "993/1250R$". */
  unitPrefix?: boolean;
  color: string;
}

interface ActivityRingsProps {
  rings: Ring[];
  size?: number;
  className?: string;
  /** Right-hand readout. Off when the card is too narrow for it. */
  showLegend?: boolean;
}

/** Concentric progress rings, one per tracked quantity.
 *
 *  Adapted from the Apple-Fitness-style activity card: same idea (nested rings,
 *  outermost is the headline metric, each fills from 12 o'clock), rebuilt on
 *  `stroke-dashoffset` with a CSS transition instead of an animation library,
 *  and using the suite's per-app colors rather than the fitness palette.
 *
 *  A ring past its target keeps rendering full rather than wrapping — the
 *  legend carries the real number, so overshoot is readable without the arc
 *  lying about position. */
export function ActivityRings({ rings, size = 168, showLegend = true, className }: ActivityRingsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const stroke = rings.length > 3 ? 10 : 13;
  const gap = 4;

  return (
    <div className={cn("flex items-center gap-5", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0 -rotate-90"
        role="img"
        aria-label={rings
          .map((r) => `${r.label}: ${r.current} de ${r.target}${r.unit ? ` ${r.unit}` : ""}`)
          .join(", ")}
      >
        {rings.map((ring, i) => {
          const radius = size / 2 - stroke / 2 - i * (stroke + gap);
          if (radius <= 0) return null;
          const circumference = radius * 2 * Math.PI;
          const ratio = ring.target > 0 ? Math.min(1, ring.current / ring.target) : 0;
          const offset = mounted ? circumference * (1 - ratio) : circumference;

          return (
            <g key={ring.id}>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={ring.color}
                strokeOpacity={0.16}
                strokeWidth={stroke}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={ring.color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{
                  transition: `stroke-dashoffset 1.1s var(--ease-editorial) ${i * 140}ms`,
                }}
              />
            </g>
          );
        })}
      </svg>

      {showLegend && (
        <div className="flex min-w-0 flex-col gap-2.5">
          {rings.map((ring) => (
            <div key={ring.id} className="min-w-0">
              <div className="truncate text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {ring.label}
              </div>
              <div className="num text-lg leading-tight" style={{ color: ring.color }}>
                {ring.unit && ring.unitPrefix && (
                  <span className="mr-1 text-[11px] text-muted-foreground">{ring.unit}</span>
                )}
                {ring.current.toLocaleString()}
                <span className="text-muted-foreground">/{ring.target.toLocaleString()}</span>
                {ring.unit && !ring.unitPrefix && (
                  <span className="ml-1 text-[11px] text-muted-foreground">{ring.unit}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
