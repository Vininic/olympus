import { useLocation } from "react-router-dom";
import { Blocks, FolderOpen, Home, MessageSquare, Search, User } from "lucide-react";
import { OlympusMark } from "@/components/brand/OlympusMark";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useHub } from "@/lib/i18n/I18nProvider";

/** Suite-standard top bar — the same contract Chronos, Kairos, Pluto, Hermes
 *  and Chiron follow: app mark on narrow screens, a route breadcrumb from `lg`
 *  up, and language + theme on the right.
 *
 *  Nothing else belongs here. Olympus briefly carried a Settings gear as well
 *  as the one in the sidebar — two controls, same action, two places to look.
 *  Settings lives in the sidebar's System group, like everywhere else. */
export default function Topbar({ onOpenPalette }: { onOpenPalette?: () => void }) {
  const location = useLocation();
  const h = useHub();

  const crumb =
    location.pathname === "/home" ? { icon: Home, label: h.nav.home } :
    location.pathname === "/chat" ? { icon: MessageSquare, label: h.nav.chat } :
    location.pathname === "/files" ? { icon: FolderOpen, label: h.nav.files } :
    location.pathname === "/apps" ? { icon: Blocks, label: h.nav.apps } :
    location.pathname === "/account" ? { icon: User, label: h.nav.account } :
    null;

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card/70 px-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] text-secondary md:hidden">
        <OlympusMark className="h-3.5 w-3.5" /> Olympus
      </div>

      {crumb && (
        <div className="hidden items-center gap-1.5 text-sm font-medium text-primary lg:flex">
          <crumb.icon className="h-3.5 w-3.5 text-secondary" /> {crumb.label}
        </div>
      )}

      <div className="ml-auto flex items-center gap-3">
        {onOpenPalette && (
          <button
            type="button"
            onClick={onOpenPalette}
            className="hidden items-center gap-2 rounded-lg border border-border bg-surface-veil/40 px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-secondary hover:text-primary sm:flex"
          >
            <Search className="h-3.5 w-3.5" />
            {h.palette.open}
            <kbd className="rounded border border-border px-1 py-px font-sans text-[9px]">⌘K</kbd>
          </button>
        )}
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
