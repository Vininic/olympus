import { useEffect, useState } from "react";
import { OlympusMark } from "./OlympusMark";
import { cn } from "@/lib/utils";

const SEEN_KEY = "olympus.boot.seen";
/** Long enough for the mark to finish drawing (900ms) plus the keystone
 *  (520ms at +900ms) — cut any shorter and the animation is a flicker. */
const HOLD_MS = 1650;
const FADE_MS = 520;

/** The entry animation.
 *
 *  Shown once per browser session on the way into the app — the mark draws
 *  itself over a summit-dark field, then the whole curtain lifts to reveal the
 *  page underneath. It renders *over* real content rather than replacing it,
 *  so nothing is blocked on the animation: if it were a loading gate, a slow
 *  frame would cost the user time instead of just showing them the brand.
 *
 *  Skipped entirely under prefers-reduced-motion, and on any visit after the
 *  first in a session — an intro you cannot escape stops being an intro. */
export function BootSplash() {
  const [phase, setPhase] = useState<"hidden" | "showing" | "leaving">(() => {
    if (typeof window === "undefined") return "hidden";
    if (sessionStorage.getItem(SEEN_KEY)) return "hidden";
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return "hidden";
    return "showing";
  });

  // Mount-once on purpose. Keying this on `phase` meant the transition to
  // "leaving" re-ran the effect, whose cleanup cancelled the very timer that
  // was going to unmount the splash — so it faded out and then sat there
  // invisible on top of the page forever, swallowing nothing but still in the
  // tree. One scheduler, no dependency on the state it sets.
  useEffect(() => {
    if (phase !== "showing") return;
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* private mode */ }

    let hideTimer: ReturnType<typeof setTimeout>;
    const leave = () => {
      setPhase("leaving");
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setPhase("hidden"), FADE_MS);
    };

    const leaveTimer = setTimeout(leave, HOLD_MS);
    hideTimer = setTimeout(() => setPhase("hidden"), HOLD_MS + FADE_MS);

    // Any key or click gets you past it immediately.
    window.addEventListener("keydown", leave);
    window.addEventListener("pointerdown", leave);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(hideTimer);
      window.removeEventListener("keydown", leave);
      window.removeEventListener("pointerdown", leave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      aria-hidden
      className={cn(
        "fixed inset-0 z-[100] grid place-items-center bg-summit transition-opacity duration-500",
        phase === "leaving" ? "pointer-events-none opacity-0" : "opacity-100",
      )}
    >
      {/* a single soft gilt bloom behind the mark, so the dark field is not flat */}
      <div
        className="pointer-events-none absolute h-[420px] w-[420px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(38 30% 72% / 0.16), transparent 70%)" }}
      />
      <div className="relative flex flex-col items-center gap-5">
        <OlympusMark animated className="h-20 w-20 text-secondary-soft" strokeWidth={4} />
        <span className="boot-wordmark font-display text-2xl tracking-[0.24em] text-sidebar-foreground">
          OLYMPUS
        </span>
      </div>
    </div>
  );
}
