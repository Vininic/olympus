import { useLocation } from "react-router-dom";
import { CircleHelp, LayoutDashboard, MessageSquareQuote, MonitorSmartphone, Settings2, Sparkles } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useT } from "@/lib/i18n/I18nProvider";

export default function Topbar() {
  const location = useLocation();
  const t = useT();
  const nav = t.olympus.nav;

  const crumb =
    location.pathname === "/desk" ? { icon: LayoutDashboard, label: nav.desk } :
    location.pathname === "/oracle" ? { icon: MessageSquareQuote, label: nav.oracle } :
    location.pathname === "/apps" ? { icon: MonitorSmartphone, label: nav.apps } :
    location.pathname === "/settings" ? { icon: Settings2, label: nav.settings } :
    location.pathname === "/about" ? { icon: CircleHelp, label: nav.about } :
    null;

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card/70 px-4 backdrop-blur lg:px-6">
      {crumb ? (
        <div className="hidden items-center gap-1.5 text-sm font-medium text-primary lg:flex">
          <crumb.icon className="h-3.5 w-3.5 text-secondary" /> {crumb.label}
        </div>
      ) : null}

      <div className="ml-auto flex items-center gap-3">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
