import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/I18nProvider";

// Only apps with a real public deploy get a "live" launch button; the rest stay
// "atelier" with no link. Never ship a localhost URL here — it 404s for everyone
// but the developer.
// Colors match the suite's canonical per-app palette (Hermes' lib/color.ts
// SOURCE_COLORS / SUITE-ARCHITECTURE.md §5) — this file previously used a
// different, unrelated set of hex values that didn't match any sibling's
// real brand color.
const APPS = [
  { name: "Chronos", url: "https://chronos-plannerai.vercel.app", color: "#B7863B", status: "live" as const },
  { name: "Kairos", url: "https://kairos-suite.vercel.app", color: "#C98FA6", status: "live" as const },
  { name: "Pluto", url: "https://pluto-suite.vercel.app", color: "#C49A3A", status: "live" as const },
  { name: "Hermes", url: "https://hermes-suite.vercel.app", color: "#3EB8CC", status: "live" as const },
  { name: "Chiron", url: "https://chiron-nine.vercel.app", color: "#A63446", status: "live" as const },
];

export default function Apps() {
  const t = useT();
  const a = t.olympus.apps;

  return (
    <div>
      <div className="mb-8">
        <p className="mb-1 text-xs uppercase tracking-[0.3em] text-secondary">{a.eyebrow}</p>
        <h1 className="font-display text-2xl text-primary">{a.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{a.lead}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {APPS.map((app) => (
          <div key={app.name} className="olympus-card overflow-hidden">
            <div className="flex items-start justify-between p-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full" style={{ background: app.color }} />
                <span className="font-display text-lg text-primary">{app.name}</span>
              </div>
              <span className={`text-[10px] uppercase tracking-[0.18em] ${app.status === "live" ? "text-emerald-600" : "text-muted-foreground"}`}>
                {app.status === "live" ? "Live" : a.comingSoon}
              </span>
            </div>
            <div className="px-5 pb-5">
              <p className="mb-4 text-xs text-muted-foreground">
                {app.name === "Chronos" ? a.chronosDesc :
                 app.name === "Kairos" ? a.kairosDesc :
                 app.name === "Pluto" ? a.plutoDesc :
                 app.name === "Hermes" ? a.hermesDesc :
                 app.name === "Chiron" ? a.chironDesc : ""}
              </p>
              {app.status === "live" ? (
                <Button variant="outline" size="sm" asChild>
                  <a href={app.url} target="_blank" rel="noopener noreferrer">
                    {a.open} <ExternalLink className="ml-1.5 h-3 w-3" />
                  </a>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  {a.comingSoon}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
