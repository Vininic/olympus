import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, FolderOpen, MessageSquare, PictureInPicture2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo, { OlympusMark } from "@/components/brand/OlympusMark";
import { SuiteWheel } from "@/components/brand/SuiteWheel";
import { Monolith3D } from "@/components/three/Monolith";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/auth";
import { useHub, useT } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";

const CAPABILITY_ICONS = [PictureInPicture2, FolderOpen, MessageSquare];

export default function Landing() {
  const { session } = useAuth();
  const t = useT();
  const h = useHub();
  const l = h.landing;
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const rise = (delay: number) =>
    ({
      opacity: entered ? 1 : 0,
      transform: entered ? "translateY(0)" : "translateY(14px)",
      transition: `opacity 700ms var(--ease-editorial) ${delay}ms, transform 700ms var(--ease-editorial) ${delay}ms`,
    }) as const;

  return (
    <div className="olympus-surface min-h-screen">
      <header className="container flex items-center justify-between py-6">
        <Logo animated />
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <ThemeToggle />
          <Button asChild>
            <Link to={session ? "/app" : "/login"}>
              {session ? l.ctaEnter : t.common.signIn}
            </Link>
          </Button>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────
          Identical skeleton to the five siblings' landings: `container grid
          items-center gap-8 pb-20 pt-12 lg:grid-cols-12`, copy in seven
          columns, the app's 3D anchor in five inside a rounded, clipped panel.
          Olympus had invented its own hero twice — first the headline layered
          over the model, then a bespoke two-column grid — and both times it was
          the only landing in the suite that did not match the others. */}
      <section className="container grid items-center gap-8 pb-20 pt-12 lg:grid-cols-12">
        <div className="lg:col-span-7" style={rise(80)}>
          <div className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            {l.eyebrow}
          </div>
          <h1 className="font-display mt-6 text-balance text-[52px] leading-[1.0] text-primary md:text-[72px]">
            {l.title1} <span className="italic text-secondary">{l.title2}</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            {l.lead}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-12 px-7">
              <Link to={session ? "/app" : "/login"}>
                {l.ctaEnter} <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6">
              <a href="#suite">{l.ctaSuite}</a>
            </Button>
          </div>
        </div>

        <div className="relative h-[420px] md:h-[520px] lg:col-span-5" style={rise(220)}>
          <div className="bg-summit absolute inset-0 overflow-hidden rounded-[28px] shadow-elevated">
            <Monolith3D className="absolute inset-0" />
          </div>
        </div>
      </section>

      {/* ── The wheel ───────────────────────────────────────────────────── */}
      <section id="suite" className="container scroll-mt-8 border-t py-20">
        <div>
          <div className="mb-14 text-center">
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-secondary">{l.wheelEyebrow}</p>
            <h2 className="font-display text-3xl text-primary sm:text-4xl">{l.wheelTitle}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{l.wheelLead}</p>
          </div>

          <SuiteWheel />

          <p className="mt-8 hidden text-center text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70 sm:block">
            {l.wheelHint}
          </p>
        </div>
      </section>

      {/* ── What the hub actually does ──────────────────────────────────── */}
      <section className="container border-t py-20">
        <div>
          <p className="mb-10 text-center text-xs uppercase tracking-[0.3em] text-secondary">
            {l.capabilityEyebrow}
          </p>
          <div className="grid gap-10 sm:grid-cols-3">
            {l.capabilities.map((capability, i) => {
              const Icon = CAPABILITY_ICONS[i] ?? PictureInPicture2;
              return (
                <div key={capability.title} className="flex flex-col gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="font-display text-lg leading-snug text-primary">{capability.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{capability.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className={cn("container flex flex-col items-center justify-between gap-4 py-8 text-center sm:flex-row sm:text-left")}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <OlympusMark className="h-4 w-4 text-secondary" />
            <span>{l.footerRights}</span>
          </div>
          <span className="text-xs text-muted-foreground">{l.footerAuthor}</span>
        </div>
      </footer>
    </div>
  );
}
