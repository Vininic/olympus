import { useCallback, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Blocks, CircleHelp, Cloud, FolderOpen, Home, Menu, MessageSquare, MonitorSmartphone,
  PanelLeftClose, Settings2,
} from "lucide-react";
import Logo, { OlympusMark } from "@/components/brand/OlympusMark";
import Topbar from "@/components/Topbar";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { AboutDialog } from "@/components/about/AboutDialog";
import { CommandPalette, useCommandPaletteShortcut } from "@/components/ui/CommandPalette";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { usePrefs } from "@/lib/prefs/store";
import { Avatar } from "@/components/account/Avatar";
import { useHub, useT } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";

/** Home and Chat are the two primary tabs — the Teams "tab priority" rule from
 *  the reference set: the most relevant surface comes first, and secondary
 *  destinations must not compete with them visually. Settings is a dialog, not
 *  a tab, for the same reason. */
function useNavGroups() {
  const h = useHub();
  return {
    primary: [
      { to: "/home", label: h.nav.home, icon: Home },
      { to: "/chat", label: h.nav.chat, icon: MessageSquare },
    ],
    workspace: [
      { to: "/files", label: h.nav.files, icon: FolderOpen },
      { to: "/apps", label: h.nav.apps, icon: Blocks },
    ],
  };
}

function SectionLabel({ collapsed, children }: { collapsed: boolean; children: string }) {
  return (
    <div
      className={cn(
        "mb-2 mt-7 px-3 text-[10px] uppercase tracking-[0.22em] text-sidebar-foreground/50",
        collapsed && "hidden",
      )}
    >
      {children}
    </div>
  );
}

function UserBlock({ collapsed }: { collapsed: boolean }) {
  const { session } = useAuth();
  const { prefs } = usePrefs();
  const t = useT();
  if (!session) return null;
  const cloud = !!session.email;

  return (
    <NavLink
      to="/account"
      className={({ isActive }) =>
        cn(
          "flex w-full items-center gap-2.5 rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-2.5 text-left transition-colors hover:bg-sidebar-accent",
          isActive && "border-sidebar-ring/40 bg-sidebar-accent",
          collapsed && "justify-center border-0 bg-transparent p-0 hover:bg-transparent",
        )
      }
    >
      <Avatar avatar={prefs.avatar} name={session.name} size={32} />
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm text-sidebar-foreground">{session.name}</div>
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/55">
            {cloud ? <Cloud className="h-2.5 w-2.5" /> : <MonitorSmartphone className="h-2.5 w-2.5" />}
            {cloud ? t.common.suiteAccount : t.common.thisBrowser}
          </div>
        </div>
      )}
    </NavLink>
  );
}

/** The mobile header's avatar. Split out so `AppLayout` does not need the
 *  prefs hook purely to draw 32 pixels. */
function MobileAvatar() {
  const { session } = useAuth();
  const { prefs } = usePrefs();
  return <Avatar avatar={prefs.avatar} name={session?.name} size={32} />;
}

export default function AppLayout() {
  const { session } = useAuth();
  const t = useT();
  const h = useHub();
  const location = useLocation();
  const groups = useNavGroups();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  useCommandPaletteShortcut(useCallback(() => setPaletteOpen(true), []));

  // Chat and Home fill the viewport and own their scrolling — the dashboard is
  // a fixed grid whose tiles scroll internally, so a page scrollbar on top of
  // that would be two scrolls competing. Everything else scrolls normally.
  const fullHeight = location.pathname === "/chat" || location.pathname === "/home";

  const primaryClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
      isActive
        ? "bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-sidebar-ring/30"
        : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      collapsed && "justify-center px-0",
    );

  const secondaryClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
      isActive
        ? "bg-sidebar-accent/70 text-sidebar-accent-foreground"
        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
      collapsed && "justify-center px-0",
    );

  const renderNav = (itemClass: typeof primaryClass, items: { to: string; label: string; icon: typeof Home }[], onClick?: () => void) =>
    items.map(({ to, label, icon: Icon }) => (
      <NavLink key={to} to={to} className={itemClass} title={collapsed ? label : undefined} onClick={onClick}>
        <Icon className="h-4 w-4 shrink-0 text-secondary-soft" />
        {!collapsed && <span className="flex-1">{label}</span>}
      </NavLink>
    ));

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out md:flex",
          collapsed ? "w-[72px]" : "w-60",
        )}
      >
        <div className={cn("flex items-center pb-4 pt-5", collapsed ? "justify-center px-0" : "justify-between px-5")}>
          {!collapsed && <Logo variant="light" />}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? h.nav.expand : h.nav.collapse}
            className="grid h-7 w-7 place-items-center rounded-md text-sidebar-foreground/40 transition-all duration-300 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground/70"
          >
            <PanelLeftClose className={cn("h-4 w-4 transition-transform duration-300", collapsed && "rotate-180")} />
          </button>
        </div>
        {!collapsed && <div className="gilt-rule mx-4" />}

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="flex flex-col gap-1">{renderNav(primaryClass, groups.primary)}</div>

          <SectionLabel collapsed={collapsed}>{h.nav.workspace}</SectionLabel>
          <div className="flex flex-col gap-0.5">{renderNav(secondaryClass, groups.workspace)}</div>

          {/* System section — the same slot every sibling puts Settings and
              About in. Olympus keeps the dialog (it is the better surface) but
              stops inventing its own location for the entry point. */}
          <SectionLabel collapsed={collapsed}>{h.nav.system}</SectionLabel>
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              title={collapsed ? h.nav.settings : undefined}
              className={cn(secondaryClass({ isActive: false }), "w-full text-left")}
            >
              <Settings2 className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="flex-1">{h.nav.settings}</span>}
            </button>
            <button
              type="button"
              onClick={() => setAboutOpen(true)}
              title={collapsed ? h.nav.about : undefined}
              className={cn(secondaryClass({ isActive: false }), "w-full text-left")}
            >
              <CircleHelp className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="flex-1">{h.nav.about}</span>}
            </button>
          </div>
        </nav>

        <div className="px-3 pb-4 pt-2">
          <UserBlock collapsed={collapsed} />
        </div>
      </aside>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 md:hidden">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label={h.nav.openMenu}
              onClick={() => setMobileNavOpen(true)}
              className="grid h-8 w-8 place-items-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent"
            >
              <Menu className="h-5 w-5" />
            </button>
            <NavLink to="/home"><Logo variant="light" /></NavLink>
          </div>
          <div className="flex items-center gap-2">
            <NavLink
              to="/chat"
              aria-label={h.nav.chat}
              className="grid h-8 w-8 place-items-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent"
            >
              <MessageSquare className="h-4 w-4" />
            </NavLink>
            <NavLink to="/account" aria-label={h.nav.account} className="shrink-0">
              <MobileAvatar />
            </NavLink>
          </div>
        </header>

        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="flex w-72 flex-col gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
            <SheetTitle className="sr-only">{h.nav.home}</SheetTitle>
            <div className="px-5 pb-4 pt-5"><Logo variant="light" /></div>
            <div className="gilt-rule mx-4" />
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <div className="flex flex-col gap-1">
                {renderNav(primaryClass, groups.primary, () => setMobileNavOpen(false))}
              </div>
              <SectionLabel collapsed={false}>{h.nav.workspace}</SectionLabel>
              <div className="flex flex-col gap-0.5">
                {renderNav(secondaryClass, groups.workspace, () => setMobileNavOpen(false))}
              </div>

              <SectionLabel collapsed={false}>{h.nav.system}</SectionLabel>
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => { setMobileNavOpen(false); setSettingsOpen(true); }}
                  className={cn(secondaryClass({ isActive: false }), "w-full text-left")}
                >
                  <Settings2 className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{h.nav.settings}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setMobileNavOpen(false); setAboutOpen(true); }}
                  className={cn(secondaryClass({ isActive: false }), "w-full text-left")}
                >
                  <CircleHelp className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{h.nav.about}</span>
                </button>
              </div>
            </nav>
            <div className="px-3 pb-4">
              <UserBlock collapsed={false} />
            </div>
          </SheetContent>
        </Sheet>

        <Topbar onOpenPalette={() => setPaletteOpen(true)} />

        <main className={cn("olympus-surface flex-1 overflow-y-auto", fullHeight && "flex flex-col overflow-hidden")}>
          {fullHeight ? (
            <div className="dense-page h-full min-h-0">
              <Outlet />
            </div>
          ) : (
            <div className="flex min-h-full flex-col">
              <div className="dense-page flex-1">
                <Outlet />
              </div>
              <footer className="flex items-center justify-center gap-2 py-6 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                <OlympusMark className="h-3.5 w-3.5 text-secondary" />
                {t.common.appName} · {t.common.suite}
              </footer>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
