import { cn } from "@/lib/utils";

/** The Olympus mark — an **Alpha built as a summit**.
 *
 *  The old mark drew a literal Doric capital in four strokes: at 16px the
 *  flare and the shaft collapsed into a smudge, and at any size it read as
 *  "a piece of a building" rather than a brand.
 *
 *  This one is three elements that survive a favicon: two slopes rising to a
 *  point (the peak, and the Greek letter Λ), the entablature crossing them
 *  (which turns Λ into **Α**), and a keystone at the apex. Alpha is the first
 *  letter and the first rank — the summit of the pantheon — so the letterform
 *  and the mountain are the same drawing rather than two ideas sharing a
 *  frame, the same discipline Chiron's armillary/arrow mark follows.
 *
 *  `pathLength={1}` normalizes every stroke to a 0→1 dash scale so the draw-on
 *  animation does not need per-path length math. */
export function OlympusMark({
  className,
  animated = false,
  strokeWidth = 5,
}: {
  className?: string;
  /** Draws itself on mount. Suppressed under prefers-reduced-motion via CSS. */
  animated?: boolean;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={cn("h-6 w-6", animated && "mark-animated", className)}
      aria-hidden
    >
      {/* the slopes — one continuous path so the apex is a real join, not two
          round caps meeting and reading as a blob */}
      <path
        d="M9 55 L32 11 L55 55"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        className="mark-slopes"
      />
      {/* the entablature — the stroke that makes it an Alpha */}
      <path
        d="M19.5 39.5 L44.5 39.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        pathLength={1}
        className="mark-bar"
      />
      {/* the keystone at the apex */}
      <circle cx="32" cy="9.5" r="4" fill="currentColor" className="mark-keystone" />
    </svg>
  );
}

interface LogoProps {
  /** "light" for dark surfaces (sidebar, login panel); "dark" for parchment. */
  variant?: "light" | "dark";
  className?: string;
  animated?: boolean;
  showWordmark?: boolean;
}

export default function Logo({
  variant = "dark",
  className,
  animated = false,
  showWordmark = true,
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <OlympusMark
        animated={animated}
        className={variant === "light" ? "text-secondary-soft" : "text-secondary"}
      />
      {showWordmark && (
        <span
          className={cn(
            "font-display text-xl leading-none tracking-tight",
            variant === "light" ? "text-sidebar-foreground" : "text-primary",
          )}
        >
          Olympus
        </span>
      )}
    </div>
  );
}
