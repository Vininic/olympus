import { useId } from "react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  values: number[];
  className?: string;
  height?: number;
  /** Any CSS color; defaults to the current text color so it inherits themes. */
  stroke?: string;
  fill?: boolean;
  ariaLabel?: string;
}

/** A no-axis, no-library sparkline — the bklit grammar (monochrome, one accent,
 *  the shape is the message) drawn as a plain SVG path so nothing new lands in
 *  the bundle. Scales to its container via viewBox + preserveAspectRatio. */
export function Sparkline({
  values,
  className,
  height = 40,
  stroke = "currentColor",
  fill = true,
  ariaLabel,
}: SparklineProps) {
  const gradientId = useId();
  const width = 100;

  if (values.length === 0) return <div className={className} style={{ height }} />;

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : width;

  const points = values.map((v, i) => {
    const x = i * step;
    // 2px of headroom top and bottom so the stroke is never clipped.
    const y = height - 2 - ((v - min) / span) * (height - 4);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const line = `M ${points.join(" L ")}`;
  const area = `${line} L ${width},${height} L 0,${height} Z`;

  return (
    <svg
      className={cn("w-full", className)}
      viewBox={`0 0 ${width} ${height}`}
      height={height}
      preserveAspectRatio="none"
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gradientId})`} />}
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

interface BarsProps {
  values: number[];
  className?: string;
  height?: number;
  color?: string;
  labels?: string[];
}

/** Thin column chart for daily counts — same grammar, discrete data. */
export function MiniBars({ values, className, height = 40, color = "currentColor", labels }: BarsProps) {
  const max = Math.max(...values, 1);
  return (
    <div className={cn("flex items-end gap-[3px]", className)} style={{ height }}>
      {values.map((v, i) => (
        <div
          key={i}
          className="min-w-[2px] flex-1 rounded-[2px] transition-all"
          style={{
            height: `${Math.max(2, (v / max) * 100)}%`,
            background: color,
            opacity: v === 0 ? 0.18 : 0.35 + (v / max) * 0.65,
          }}
          title={labels?.[i] ? `${labels[i]}: ${v}` : String(v)}
        />
      ))}
    </div>
  );
}
