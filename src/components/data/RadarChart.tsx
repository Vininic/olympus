import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils";

export interface RadarAxis {
  id: string;
  label: string;
  /** 0–1. Callers normalize; the chart does not guess a scale. */
  value: number;
  color: string;
  /** Shown in the axis label, e.g. "12 aberturas". */
  detail?: string;
}

interface RadarChartProps {
  axes: RadarAxis[];
  size?: number;
  className?: string;
  /** Which axis to highlight, if any. */
  activeId?: string | null;
  onHover?: (id: string | null) => void;
}

/** A radar over one axis per app — six points, six apps.
 *
 *  Rings and spokes are drawn from the same polygon function as the data, so
 *  the grid and the shape always share vertices; drawing the grid as circles
 *  (the usual shortcut) makes a hexagon's corners sit outside its own gridline
 *  and reads as a rendering bug.
 *
 *  The value polygon is a single path animated by `transform: scale()` from the
 *  centre, which avoids re-tweening every point on mount. */
export function RadarChart({ axes, size = 240, activeId, onHover, className }: RadarChartProps) {
  const [mounted, setMounted] = useState(false);
  const gradientId = useId();

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const cx = size / 2;
  const cy = size / 2;
  // Room for the labels sitting outside the outer ring.
  const radius = size / 2 - 34;
  const count = axes.length;

  const point = (index: number, ratio: number) => {
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(angle) * radius * ratio, cy + Math.sin(angle) * radius * ratio] as const;
  };

  const polygon = (ratio: number) =>
    axes.map((_, i) => point(i, ratio).join(",")).join(" ");

  const valuePolygon = axes
    .map((axis, i) => point(i, Math.max(0.04, Math.min(1, axis.value))).join(","))
    .join(" ");

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={axes.map((a) => `${a.label}: ${Math.round(a.value * 100)}%`).join(", ")}
      >
        <defs>
          <radialGradient id={gradientId}>
            <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0.30" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.10" />
          </radialGradient>
        </defs>

        {/* grid rings — polygons, not circles */}
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <polygon
            key={ratio}
            points={polygon(ratio)}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={ratio === 1 ? 1 : 0.6}
          />
        ))}

        {/* spokes */}
        {axes.map((axis, i) => {
          const [x, y] = point(i, 1);
          return (
            <line
              key={axis.id}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke={activeId === axis.id ? axis.color : "hsl(var(--border))"}
              strokeWidth={activeId === axis.id ? 1.4 : 0.6}
              className="transition-all duration-300"
            />
          );
        })}

        {/* value shape */}
        <polygon
          points={valuePolygon}
          fill={`url(#${gradientId})`}
          stroke="hsl(var(--secondary))"
          strokeWidth="1.6"
          strokeLinejoin="round"
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            transform: mounted ? "scale(1)" : "scale(0.05)",
            opacity: mounted ? 1 : 0,
            transition: "transform 900ms var(--ease-editorial), opacity 500ms var(--ease-editorial)",
          }}
        />

        {/* vertices, in each app's own color */}
        {axes.map((axis, i) => {
          const [x, y] = point(i, Math.max(0.04, Math.min(1, axis.value)));
          const isActive = activeId === axis.id;
          return (
            <circle
              key={axis.id}
              cx={x}
              cy={y}
              r={isActive ? 4.5 : 3}
              fill={axis.color}
              stroke="hsl(var(--card))"
              strokeWidth="1.5"
              className="transition-all duration-300"
              style={{ opacity: mounted ? 1 : 0, transitionDelay: `${i * 60}ms` }}
            />
          );
        })}
      </svg>

      {/* labels — HTML rather than <text>, so they inherit the type scale */}
      {axes.map((axis, i) => {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
        const lx = cx + Math.cos(angle) * (radius + 22);
        const ly = cy + Math.sin(angle) * (radius + 20);
        const isActive = activeId === axis.id;
        return (
          <button
            key={axis.id}
            type="button"
            onMouseEnter={() => onHover?.(axis.id)}
            onMouseLeave={() => onHover?.(null)}
            onFocus={() => onHover?.(axis.id)}
            onBlur={() => onHover?.(null)}
            className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded px-1 text-[10px] font-medium uppercase tracking-[0.12em] outline-none transition-colors"
            style={{
              left: lx,
              top: ly,
              color: isActive ? axis.color : "hsl(var(--muted-foreground))",
            }}
            title={axis.detail}
          >
            {axis.label}
          </button>
        );
      })}
    </div>
  );
}
