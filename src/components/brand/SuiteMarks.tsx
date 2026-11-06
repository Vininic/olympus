import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import type { SuiteAppId } from "@/lib/suite/registry";

/** The siblings' own marks, reproduced here.
 *
 *  Olympus cannot import from five other repositories, and representing each
 *  app with a colored dot — which is what the hub did until now — throws away
 *  the one piece of identity every sibling already has. These are faithful
 *  copies of each app's real mark (`<App>Logo.tsx` in its own repo), redrawn
 *  on a common 64×64 grid with `currentColor` so the hub can tint them.
 *
 *  If a sibling ever changes its mark, this file is the place that goes
 *  stale — it is a deliberate copy, not a shared package. */

export interface MarkProps {
  className?: string;
  strokeWidth?: number;
}

/** Chronos — the hourglass. The original is a filled drawing; this is its
 *  monoline sibling so it sits with the other four in the wheel. */
export function ChronosMark({ className, strokeWidth = 4 }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={cn("h-6 w-6", className)} aria-hidden>
      <path d="M14 8 H50 M14 56 H50" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M18 8 L18 16 L32 32 L46 16 L46 8" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M18 56 L18 48 L32 32 L46 48 L46 56" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
      <circle cx="32" cy="32" r="2.6" fill="currentColor" />
    </svg>
  );
}

/** Kairos — the kite diamond seized by the forelock. */
export function KairosMark({ className, strokeWidth = 4 }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={cn("h-6 w-6", className)} aria-hidden>
      <path d="M32 16 L47 33 L32 50 L17 33 Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M32 16 C35.5 10.5 41.5 9 46 11" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

/** Pluto — the vault medallion, a closed circle with its mint marks. */
export function PlutoMark({ className, strokeWidth = 4 }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={cn("h-6 w-6", className)} aria-hidden>
      <circle cx="32" cy="32" r="15" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="32" cy="32" r="8.5" stroke="currentColor" strokeWidth={strokeWidth - 1} />
      <path d="M32 17.5 V13.5 M32 50.5 V46.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

/** Hermes — the kinetic relay: a node core between swept wing feathers. */
export function HermesMark({ className, strokeWidth = 4 }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={cn("h-6 w-6", className)} aria-hidden>
      <path d="M32 21 L43 32 L32 43 L21 32 Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M19 27 L6 18 M19 37 L6 44" stroke="currentColor" strokeWidth={strokeWidth - 0.5} strokeLinecap="round" />
      <path d="M45 27 L58 18 M45 37 L58 44" stroke="currentColor" strokeWidth={strokeWidth - 0.5} strokeLinecap="round" />
      <path d="M32 16 V11 M32 53 V48" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

/** Chiron — the armillary rings pierced by the centaur's arrow. */
export function ChironMark({ className, strokeWidth = 3.5 }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={cn("h-6 w-6", className)} aria-hidden>
      <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth={strokeWidth} />
      <ellipse cx="32" cy="32" rx="22" ry="7.5" stroke="currentColor" strokeWidth={strokeWidth - 0.5} transform="rotate(-20 32 32)" />
      <path d="M21.7 60.2 L42.3 3.8" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M35.4 9.6 L42.3 3.8 L43.9 12.7" stroke="currentColor" strokeWidth={strokeWidth - 0.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const SUITE_MARKS: Record<SuiteAppId, ComponentType<MarkProps>> = {
  chronos: ChronosMark,
  kairos: KairosMark,
  pluto: PlutoMark,
  hermes: HermesMark,
  chiron: ChironMark,
};

export function SuiteMark({ app, ...props }: MarkProps & { app: SuiteAppId }) {
  const Mark = SUITE_MARKS[app];
  return <Mark {...props} />;
}
