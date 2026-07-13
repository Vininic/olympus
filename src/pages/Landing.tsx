import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo, { OlympusMark } from "@/components/OlympusLogo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Column3D } from "@/components/three/Column";
import { useAuth } from "@/lib/auth";
import { useI18n, useT } from "@/lib/i18n/I18nProvider";

function SuitAppsSection() {
  const t = useT();
  const l = t.olympus.landing;
  const [anim, setAnim] = useState(false);
  useEffect(() => { setAnim(true); }, []);

  return (
    <section className="bg-background px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 text-center text-xs uppercase tracking-[0.3em] text-secondary">{l.suiteEyebrow}</p>
        <h2 className="mb-12 text-center font-display text-3xl text-primary sm:text-4xl">{l.suiteTitle}</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {l.suiteApps.map((app, i) => (
            <div
              key={app.role}
              className="olympus-card overflow-hidden transition-all duration-500 hover:shadow-elevated"
              style={{ animation: anim ? `fade-up 0.6s ease-out ${i * 0.1}s both` : "none" }}
            >
              <div className="flex items-start justify-between p-5 pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ background: app.color }} />
                  <span className="font-display text-lg text-primary">{app.app}</span>
                </div>
                <span className={`text-[10px] uppercase tracking-[0.18em] ${app.status === "live" ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {app.status === "live" ? l.live : l.inAtelier}
                </span>
              </div>
              <div className="px-5 pb-5">
                <p className="text-xs text-muted-foreground">{app.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  const t = useT();
  const l = t.olympus.landing;

  return (
    <footer className="border-t border-border bg-background px-6 py-12 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <OlympusMark className="h-4 w-4 text-secondary" />
          <span>{l.footerRights}</span>
        </div>
        <span className="text-xs text-muted-foreground">{l.footerAuthor}</span>
      </div>
    </footer>
  );
}

export default function Landing() {
  const { session } = useAuth();
  const t = useT();
  const l = t.olympus.landing;
  const navigate = useNavigate();

  return (
    <div className="olympus-surface flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10 lg:px-16">
        <Logo />
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <ThemeToggle />
          {session ? (
            <Button asChild>
              <Link to="/desk">{l.ctaOpenDesk}</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link to="/login">{t.common.signIn}</Link>
            </Button>
          )}
        </div>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center sm:px-10 lg:px-16">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-secondary">{l.navSystem}</p>
        <h1 className="font-display text-4xl leading-tight text-primary sm:text-5xl lg:text-6xl">
          {l.heroTitle1}<br />
          <span className="text-secondary">{l.heroTitle2}</span>
        </h1>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {l.heroLead}
        </p>
        <div className="mt-8 flex items-center gap-4">
          <Button asChild size="lg">
            <Link to={session ? "/desk" : "/login"}>
              {l.ctaOpenDesk} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-16">
          <Column3D />
        </div>
      </section>

      <SuitAppsSection />
      <FooterSection />
    </div>
  );
}
