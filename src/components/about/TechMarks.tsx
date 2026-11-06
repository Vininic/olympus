import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

/** Minimal marks for the stack list.
 *
 *  Lucide has no brand logos and the suite takes no new dependencies, so these
 *  are simplified single-color renditions drawn on a common 24×24 grid — enough
 *  to be recognised at 20px beside a name, deliberately not pixel-accurate
 *  reproductions of anyone's trademark. `currentColor` throughout, so each one
 *  can be tinted by the row it sits in. */

interface MarkProps {
  className?: string;
}

export function ReactMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-5 w-5", className)} aria-hidden>
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" strokeWidth="1.3" />
      <ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" strokeWidth="1.3" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" strokeWidth="1.3" transform="rotate(120 12 12)" />
    </svg>
  );
}

export function TypeScriptMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-5 w-5", className)} aria-hidden>
      <rect x="2.5" y="2.5" width="19" height="19" rx="3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 10.5h5M9.5 10.5V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M17.6 11.1a2 2 0 0 0-3.3 1.5c0 2 3.2 1.6 3.2 3.4a2 2 0 0 1-3.3 1.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ViteMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-5 w-5", className)} aria-hidden>
      <path d="M2.6 5.2 12 21.4l9.4-16.2L12 7.1 2.6 5.2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M13.4 3 9.6 12.4l2.6-.5-1 4.6 4-8-2.6.6L13.4 3Z" fill="currentColor" />
    </svg>
  );
}

export function TailwindMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-5 w-5", className)} aria-hidden>
      <path
        d="M6.5 11c.7-2.7 2.5-4 5.5-4 4.5 0 5 3.4 7.3 4 1.5.4 2.8-.2 3.7-1.7-.7 2.7-2.5 4-5.5 4-4.5 0-5-3.4-7.3-4-1.5-.4-2.8.2-3.7 1.7Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        transform="translate(-2 -1)"
      />
      <path
        d="M6.5 11c.7-2.7 2.5-4 5.5-4 4.5 0 5 3.4 7.3 4 1.5.4 2.8-.2 3.7-1.7-.7 2.7-2.5 4-5.5 4-4.5 0-5-3.4-7.3-4-1.5-.4-2.8.2-3.7 1.7Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        transform="translate(-2 6)"
      />
    </svg>
  );
}

export function SupabaseMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-5 w-5", className)} aria-hidden>
      <path
        d="M13 2 4 13.2a.8.8 0 0 0 .6 1.3H11v7.5l9-11.2a.8.8 0 0 0-.6-1.3H13V2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ThreeMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-5 w-5", className)} aria-hidden>
      <path d="M12 2.6 21.5 20H2.5L12 2.6Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M12 2.6V20M12 20 6 9.5M12 20l6-10.5" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" opacity="0.55" />
    </svg>
  );
}

export const TECH_MARKS: Record<string, ComponentType<MarkProps>> = {
  react: ReactMark,
  typescript: TypeScriptMark,
  vite: ViteMark,
  tailwind: TailwindMark,
  supabase: SupabaseMark,
  three: ThreeMark,
};

export type TechId = keyof typeof TECH_MARKS;
