import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** The gap between "sent" and "first token".
 *
 *  The reference component cycles invented status lines ("Scanning web
 *  pages…", "Visiting 5 websites…") that describe work nobody is doing. These
 *  are the real stages of one request to a chat provider, so the line on screen
 *  is either true or absent — and the last one stays put rather than looping,
 *  because a status that keeps cycling implies progress that has stalled. */
export function ThinkingState({ stages, className }: { stages: string[]; className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= stages.length - 1) return;
    const timer = setTimeout(() => setIndex((i) => i + 1), 1400);
    return () => clearTimeout(timer);
  }, [index, stages.length]);

  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="flex gap-1" aria-hidden>
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="h-1 w-1 rounded-full bg-secondary"
            style={{ animation: `thinking-dot 1.2s ease-in-out ${dot * 160}ms infinite` }}
          />
        ))}
      </span>
      <span key={index} className="shimmer-text text-sm">{stages[index]}</span>
    </span>
  );
}
