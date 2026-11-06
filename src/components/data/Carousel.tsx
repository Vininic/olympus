import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarouselProps {
  children: ReactNode;
  className?: string;
  /** Pixels moved per arrow press; also the assumed item pitch. */
  step?: number;
  label: string;
  action?: ReactNode;
  scrollLeftLabel: string;
  scrollRightLabel: string;
}

/** A horizontal snap rail with arrow controls.
 *
 *  This is how the hub gets scrolling content without the *page* scrolling:
 *  the dashboard has to fit the viewport, so anything that overflows has to
 *  overflow sideways inside its own container.
 *
 *  The arrows disable themselves at each end instead of staying live and doing
 *  nothing, and hide entirely when everything already fits — an arrow that
 *  cannot move anything is worse than no arrow. */
export function Carousel({
  children, className, step = 280, label, action, scrollLeftLabel, scrollRightLabel,
}: CarouselProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ atStart: true, atEnd: true, overflows: false });

  const measure = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const overflows = rail.scrollWidth > rail.clientWidth + 4;
    setState({
      overflows,
      atStart: rail.scrollLeft <= 2,
      atEnd: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2,
    });
  }, []);

  useEffect(() => {
    measure();
    const rail = railRef.current;
    if (!rail) return;
    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    rail.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      rail.removeEventListener("scroll", measure);
    };
  }, [measure, children]);

  const scrollBy = (delta: number) =>
    railRef.current?.scrollBy({ left: delta, behavior: "smooth" });

  return (
    <section className={cn("flex min-h-0 flex-col", className)}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.22em] text-secondary">{label}</p>
        <div className="flex items-center gap-1.5">
          {action}
          {state.overflows && (
            <>
              <button
                type="button"
                onClick={() => scrollBy(-step)}
                disabled={state.atStart}
                aria-label={scrollLeftLabel}
                className="grid h-6 w-6 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-secondary hover:text-primary disabled:pointer-events-none disabled:opacity-35"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollBy(step)}
                disabled={state.atEnd}
                aria-label={scrollRightLabel}
                className="grid h-6 w-6 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-secondary hover:text-primary disabled:pointer-events-none disabled:opacity-35"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div
        ref={railRef}
        className="scrollbar-slim -mx-1 flex min-h-0 snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden px-1 pb-1"
      >
        {children}
      </div>
    </section>
  );
}
