import { useEffect, useId, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { OlympusMark } from "./OlympusMark";
import { SuiteMark } from "./SuiteMarks";
import { AppPreviewDialog } from "./AppPreviewDialog";
import { SUITE_APPS, alpha, type SuiteAppId } from "@/lib/suite/registry";
import { useHub } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";

/** Geometry, in viewBox units on a 100×100 square. Keeping these named and in
 *  one place is what makes the spokes line up: the SVG and the HTML nodes read
 *  the same numbers instead of each carrying its own rounded copy. */
const RING = 38;      // radius the app nodes sit on
const HUB = 21;       // radius of the centre panel's reserved space
const NODE = 7.6;     // radius of a node button, in the same units

/** The suite as a wheel: the hub at the centre, the five apps on a ring.
 *
 *  Two things were wrong in the first pass and are fixed here. The node buttons
 *  contained an icon *and* a label in normal flow, so centring the button put
 *  the label's height into the calculation and pushed every icon off the ring —
 *  the labels are now absolutely positioned under a fixed-size disc, so the
 *  disc is what sits on the ring. And the spokes ran centre-to-centre, passing
 *  under the hub text and under each disc; they now start at the hub's edge and
 *  stop at the disc's edge, so no line is ever drawn behind something opaque.
 */
export function SuiteWheel({ className }: { className?: string }) {
  const h = useHub();
  const l = h.landing;
  const [active, setActive] = useState<SuiteAppId | null>(null);
  const [preview, setPreview] = useState<SuiteAppId | null>(null);
  const [mounted, setMounted] = useState(false);
  const gradientId = useId();

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const app = active ? SUITE_APPS.find((a) => a.id === active)! : null;

  const nodes = SUITE_APPS.map((suiteApp, i) => {
    const angle = (i / SUITE_APPS.length) * Math.PI * 2 - Math.PI / 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      app: suiteApp,
      cos,
      sin,
      x: 50 + cos * RING,
      y: 50 + sin * RING,
      // spoke endpoints, trimmed at both ends
      x1: 50 + cos * HUB,
      y1: 50 + sin * HUB,
      x2: 50 + cos * (RING - NODE),
      y2: 50 + sin * (RING - NODE),
    };
  });

  return (
    <div className={cn("w-full", className)}>
      {/* ── Wheel (sm and up) ─────────────────────────────────────────────── */}
      <div className="relative mx-auto hidden aspect-square w-full max-w-[520px] sm:block">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0.65" />
              <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          <circle cx="50" cy="50" r={RING} fill="none" stroke="hsl(var(--border))" strokeWidth="0.35" />
          <circle
            cx="50" cy="50" r={RING}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeDasharray="38 201"
            className="wheel-sweep"
          />
          <circle cx="50" cy="50" r={HUB} fill="none" stroke="hsl(var(--border))" strokeWidth="0.3" strokeDasharray="1 2" />

          {nodes.map(({ app: suiteApp, x1, y1, x2, y2 }) => (
            <line
              key={suiteApp.id}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={active === suiteApp.id ? suiteApp.color : "hsl(var(--border))"}
              strokeWidth={active === suiteApp.id ? 0.7 : 0.3}
              className="transition-all duration-300"
            />
          ))}
        </svg>

        {/* hub — an opaque disc, so no spoke can read through the copy */}
        <div
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background text-center"
          style={{ width: `${HUB * 2}%`, height: `${HUB * 2}%` }}
        >
          <div className="px-3">
            {app ? (
              <div key={app.id} className="wheel-panel flex flex-col items-center gap-1.5">
                <span style={{ color: app.color }}>
                  <SuiteMark app={app.id} className="h-7 w-7" />
                </span>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.22em]" style={{ color: app.color }}>
                    {l.roles[app.id]}
                  </p>
                  <h3 className="font-display text-lg leading-tight text-primary">{app.name}</h3>
                </div>
                <p className="text-balance text-[11px] leading-snug text-muted-foreground">
                  {l.descriptions[app.id]}
                </p>
              </div>
            ) : (
              <div className="wheel-panel flex flex-col items-center gap-1.5">
                <OlympusMark className="h-8 w-8 text-secondary" strokeWidth={4} />
                <div>
                  <p className="text-[9px] uppercase tracking-[0.22em] text-secondary">{l.centerEyebrow}</p>
                  <h3 className="font-display text-lg leading-tight text-primary">{l.centerTitle}</h3>
                </div>
                <p className="text-balance text-[11px] leading-snug text-muted-foreground">
                  {l.centerLead}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* app nodes — the disc is what sits on the ring; the label hangs below */}
        {nodes.map(({ app: suiteApp, x, y }, i) => {
          const isActive = active === suiteApp.id;
          return (
            <button
              key={suiteApp.id}
              type="button"
              onMouseEnter={() => setActive(suiteApp.id)}
              onFocus={() => setActive(suiteApp.id)}
              onMouseLeave={() => setActive((cur) => (cur === suiteApp.id ? null : cur))}
              onBlur={() => setActive((cur) => (cur === suiteApp.id ? null : cur))}
              onClick={() => setPreview(suiteApp.id)}
              className={cn(
                "group absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full outline-none transition-all duration-500",
                "focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                mounted ? "scale-100 opacity-100" : "scale-75 opacity-0",
              )}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: `${NODE * 2}%`,
                height: `${NODE * 2}%`,
                transitionDelay: mounted ? `${i * 70}ms` : "0ms",
              }}
              aria-label={`${suiteApp.name} — ${l.roles[suiteApp.id]}`}
            >
              <span
                className={cn(
                  "grid h-full w-full place-items-center rounded-full border bg-card transition-all duration-300",
                  isActive ? "shadow-elevated" : "shadow-soft group-hover:border-secondary/60",
                )}
                style={{
                  borderColor: isActive ? suiteApp.color : alpha(suiteApp.color, "border"),
                  background: isActive ? alpha(suiteApp.color) : undefined,
                  color: suiteApp.color,
                }}
              >
                <SuiteMark app={suiteApp.id} className="h-1/2 w-1/2" />
              </span>
              <span
                className={cn(
                  "pointer-events-none absolute top-full mt-1.5 whitespace-nowrap text-[11px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {suiteApp.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── List (below sm) ───────────────────────────────────────────────── */}
      <ul className="flex flex-col gap-2 sm:hidden">
        {SUITE_APPS.map((suiteApp) => (
          <li key={suiteApp.id}>
            <button
              type="button"
              onClick={() => setPreview(suiteApp.id)}
              className="olympus-card flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
                style={{ background: alpha(suiteApp.color), color: suiteApp.color }}
              >
                <SuiteMark app={suiteApp.id} className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-base text-primary">{suiteApp.name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {l.descriptions[suiteApp.id]}
                </span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            </button>
          </li>
        ))}
      </ul>

      <AppPreviewDialog app={preview} onOpenChange={(open) => { if (!open) setPreview(null); }} />
    </div>
  );
}
