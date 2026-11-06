import { Component, useEffect, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, useTheme } from "@/lib/theme/ThemeProvider";
import { I18nProvider, useI18n, type Locale } from "@/lib/i18n/I18nProvider";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useDeskSync, DESK_PULLED_EVENT } from "@/lib/sync/deskSync";
import { PrefsProvider, usePrefs } from "@/lib/prefs/store";
import { runNotifications } from "@/lib/notifications/service";
import { BootSplash } from "@/components/brand/BootSplash";
import AppLayout from "@/components/AppLayout";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Chat from "@/pages/Chat";
import Files from "@/pages/Files";
import Apps from "@/pages/Apps";
import Account from "@/pages/Account";
import DetachedPanel from "@/pages/DetachedPanel";
import NotFound from "@/pages/NotFound";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return <div style={{ padding: 40, fontFamily: "monospace" }}><h2>Something went wrong</h2><pre style={{ whiteSpace: "pre-wrap", color: "red" }}>{this.state.error.stack ?? this.state.error.message}</pre></div>;
    }
    return this.props.children;
  }
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const { session } = useAuth();
  return session ? children : <Navigate to="/login" replace />;
}

/** Adopts the cloud copy of the prefs into the live theme/locale providers.
 *  Prefs are local-first now, so this only matters on a fresh device where
 *  the pull brings settings this browser has never seen. */
function SyncPrefs() {
  const { isCloud } = useAuth();
  const { prefs } = usePrefs();
  const { setMode, setSkin, setDensity } = useTheme();
  const { setLocale } = useI18n();

  useEffect(() => {
    if (!isCloud) return;
    const appearance = prefs.appearance;
    if (appearance) {
      setMode(appearance.mode);
      setSkin(appearance.skin);
      setDensity(appearance.density);
    }
    if (prefs.locale === "pt" || prefs.locale === "en") setLocale(prefs.locale as Locale);
  }, [isCloud, prefs.appearance, prefs.locale, setMode, setSkin, setDensity, setLocale]);

  return null;
}

function DeskSyncMount() {
  useDeskSync();
  return null;
}

/** Notification rules run when fresh sibling data lands, not on a timer of
 *  their own — the data is the trigger, and the daily dedupe inside the
 *  service keeps a burst of pulls from turning into a burst of alerts. */
function NotificationsMount() {
  const { prefs } = usePrefs();

  useEffect(() => {
    const notifications = prefs.notifications;
    if (!notifications?.enabled) return;
    const check = () => { runNotifications(notifications); };
    check();
    window.addEventListener(DESK_PULLED_EVENT, check);
    return () => window.removeEventListener(DESK_PULLED_EVENT, check);
  }, [prefs.notifications]);

  return null;
}

/** Honors the "start page" preference: /app resolves to Home or Chat. */
function StartRedirect() {
  const { prefs } = usePrefs();
  return <Navigate to={prefs.startPage === "chat" ? "/chat" : "/home"} replace />;
}

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <I18nProvider>
        <TooltipProvider>
          <Toaster />
          <BootSplash />
          <BrowserRouter>
            <AuthProvider>
              <PrefsProvider>
                <SyncPrefs />
                <DeskSyncMount />
                <NotificationsMount />
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />

                  {/* Detached panel: same origin, no app chrome. */}
                  <Route path="/panel/:panelId" element={<RequireAuth><DetachedPanel /></RequireAuth>} />

                  <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
                    <Route path="/app" element={<StartRedirect />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/files" element={<Files />} />
                    <Route path="/apps" element={<Apps />} />
                    <Route path="/account" element={<Account />} />
                    {/* About became a dialog (suite shell §2.4); the old route stays
                        so bookmarks resolve instead of hitting NotFound. */}
                    <Route path="/about" element={<Navigate to="/home" replace />} />

                    {/* v1 routes — kept so old links and bookmarks resolve. */}
                    <Route path="/desk" element={<Navigate to="/home" replace />} />
                    <Route path="/oracle" element={<Navigate to="/chat" replace />} />
                    <Route path="/settings" element={<Navigate to="/account" replace />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </PrefsProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </I18nProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
