import { cn } from "@/lib/utils";

/** The Olympus mark — a column capital / summit contour.
 *  The capital of a Doric column, simplified to its essential silhouette:
 *  a flared top rising from a straight shaft. The summit of Olympus
 *  rendered in a single continuous stroke. */
export function OlympusMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={cn("h-6 w-6", className)} aria-hidden>
      <path d="M12 52 L12 28 L24 28 L24 52" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M40 28 L40 52" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M8 24 L24 28 L40 28 L56 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 20 L12 24 L52 24 L54 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface LogoProps {
  variant?: "light" | "dark";
  className?: string;
}

export default function Logo({ variant = "dark", className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <OlympusMark className={variant === "light" ? "text-secondary-soft" : "text-secondary"} />
      <span
        className={cn(
          "font-display text-xl leading-none",
          variant === "light" ? "text-sidebar-foreground" : "text-primary",
        )}
      >
        Olympus
      </span>
    </div>
  );
}
