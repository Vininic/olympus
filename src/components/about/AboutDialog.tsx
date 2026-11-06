import { useEffect, useState } from "react";
import { ExternalLink, Github, Info, Layers, Linkedin, Mail, Package, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OlympusMark } from "@/components/brand/OlympusMark";
import { SuiteMark } from "@/components/brand/SuiteMarks";
import { TECH_MARKS, type TechId } from "./TechMarks";
import { useHub } from "@/lib/i18n/I18nProvider";
import { SUITE_APPS, alpha } from "@/lib/suite/registry";
import { launchApp } from "@/lib/desktop/detach";
import { cn } from "@/lib/utils";

/* ── Per-app configuration ─────────────────────────────────────────────────
   The only part that differs between siblings; everything below is the shared
   About shell (olympus-plan/SUITE-SHELL.md §2.4). */
const APP = {
  name: "Olympus",
  version: "0.3.0",
  stack: ["react", "typescript", "vite", "tailwind", "supabase", "three"] as TechId[],
};

const AUTHOR = {
  name: "Vinícius Espíndola",
  github: "https://github.com/Vininic",
  linkedin: "https://linkedin.com/in/vinicius-espindola",
  email: "mailto:acespindolajr@gmail.com",
};

type SectionId = "app" | "tech" | "suite" | "author";

const SECTION_ICONS: Record<SectionId, typeof Info> = {
  app: Info,
  tech: Package,
  suite: Layers,
  author: User,
};

/** The About window.
 *
 *  A dialog rather than a route, for the reason dialogs exist: this is short
 *  knowledge-gathering about the app you are already in, and sending someone to
 *  a separate page for it is more disorienting than a panel over it. Structure
 *  follows the desktop convention (`Gtk.AboutDialog` and friends): identity
 *  block with mark, name and version, then paged credits.
 *
 *  What was cut from the page it replaces: the "how it works" prose about
 *  reading rows and mirroring localStorage — architecture notes belong in the
 *  repo, not in a product's About — and the sentence explaining what GitHub is
 *  for. Links are buttons. */
export function AboutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const h = useHub();
  const a = h.about;
  const [section, setSection] = useState<SectionId>("app");

  useEffect(() => { if (open) setSection("app"); }, [open]);

  const sections: SectionId[] = ["app", "tech", "suite", "author"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86vh] w-[min(760px,94vw)] max-w-none gap-0 overflow-hidden p-0 sm:rounded-xl">
        {/* Identity block — mark, name, version. */}
        <div className="flex items-center gap-3.5 border-b border-border px-5 py-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-border bg-card shadow-soft">
            <OlympusMark className="h-6 w-6 text-secondary" strokeWidth={4.5} />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="font-display text-xl leading-tight text-primary">{APP.name}</DialogTitle>
            <p className="truncate text-xs text-muted-foreground">{a.lead}</p>
          </div>
          <span className="num shrink-0 rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground">
            {a.version} {APP.version}
          </span>
        </div>

        <div className="flex min-h-0 flex-col sm:h-[400px] sm:flex-row">
          <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-border p-2 sm:w-44 sm:flex-col sm:overflow-x-visible sm:border-b-0 sm:border-r">
            {sections.map((id) => {
              const Icon = SECTION_ICONS[id];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSection(id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors",
                    section === id
                      ? "bg-surface-veil text-primary"
                      : "text-muted-foreground hover:bg-surface-veil/60 hover:text-primary",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{a.sections[id]}</span>
                </button>
              );
            })}
          </nav>

          <ScrollArea className="min-h-0 flex-1">
            <div className="px-5 py-4">
              {section === "app" && (
                <ul className="flex flex-col">
                  {a.features.map((feature) => (
                    <li
                      key={feature.title}
                      className="flex items-start justify-between gap-6 border-b border-border/60 py-3 last:border-0"
                    >
                      <span className="w-[30%] shrink-0 text-sm text-primary">{feature.title}</span>
                      <span className="min-w-0 flex-1 text-right text-xs leading-relaxed text-muted-foreground">
                        {feature.desc}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {section === "tech" && (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {APP.stack.map((tech) => {
                    const Mark = TECH_MARKS[tech];
                    return (
                      <div
                        key={tech}
                        className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface-raised px-3 py-4 text-center"
                      >
                        <span className="text-secondary">
                          <Mark className="h-6 w-6" />
                        </span>
                        <span className="text-xs text-primary">{TECH_NAMES[tech]}</span>
                        <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-secondary-foreground/70">
                          {a.techRoles[tech]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {section === "suite" && (
                <>
                  <p className="mb-3 text-xs text-muted-foreground">{a.suiteLead}</p>
                  <ul className="flex flex-col">
                    {SUITE_APPS.map((app) => (
                      <li key={app.id}>
                        <button
                          type="button"
                          onClick={() => launchApp(app.url, app.id)}
                          className="group flex w-full items-center gap-3 border-b border-border/60 py-2.5 text-left transition-colors last:border-0"
                        >
                          <span
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                            style={{ background: alpha(app.color), color: app.color }}
                          >
                            <SuiteMark app={app.id} className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm text-primary">{app.name}</span>
                            <span className="block truncate text-[11px] text-muted-foreground">
                              {h.landing.descriptions[app.id]}
                            </span>
                          </span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-secondary" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {section === "author" && (
                <div className="flex flex-col items-start gap-4">
                  <div>
                    <p className="font-display text-lg text-primary">{AUTHOR.name}</p>
                    <p className="text-xs text-muted-foreground">{a.authorRole}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={AUTHOR.github} target="_blank" rel="noopener noreferrer">
                        <Github className="mr-1.5 h-3.5 w-3.5" /> GitHub
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={AUTHOR.linkedin} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="mr-1.5 h-3.5 w-3.5" /> LinkedIn
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={AUTHOR.email}>
                        <Mail className="mr-1.5 h-3.5 w-3.5" /> E-mail
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Product names are not translated, so they live beside the component rather
 *  than in the dictionaries. */
const TECH_NAMES: Record<TechId, string> = {
  react: "React 18",
  typescript: "TypeScript",
  vite: "Vite",
  tailwind: "Tailwind",
  supabase: "Supabase",
  three: "three.js",
};
