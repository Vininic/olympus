import { Component, useEffect, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, useTheme } from "@/lib/theme/ThemeProvider";
import { I18nProvider, useI18n, type Locale } from "@/lib/i18n/I18nProvider";
import { AuthProvider, useAuth } from "@/lib/auth";
import { DeskProvider } from "@/lib/views/store";
import { useDeskSync } from "@/lib/sync/deskSync";
import { PrefsProvider, usePrefs } from "@/lib/prefs/store";
import AppLayout from "@/components/AppLayout";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Desk from "@/pages/Desk";
import Oracle from "@/pages/Oracle";
import Apps from "@/pages/Apps";
import Settings from "@/pages/Settings";
import About from "@/pages/About";
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

function SyncPrefs() {
  const { isCloud } = useAuth();
  const { state } = usePrefs();
  const { setTheme } = useTheme();
  const { setLocale } = useI18n();

  useEffect(() => {
    if (!isCloud) return;
    if (state.prefs.theme) setTheme(state.prefs.theme);
    if (state.prefs.locale && (state.prefs.locale === "pt" || state.prefs.locale === "en")) setLocale(state.prefs.locale as Locale);
  }, [isCloud, state.prefs.theme, state.prefs.locale, setTheme, setLocale]);

  return null;
}

function DeskSyncMount() {
  useDeskSync();
  return null;
}

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <I18nProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <AuthProvider>
              <PrefsProvider>
                <SyncPrefs />
                <DeskProvider>
                <DeskSyncMount />
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
                    <Route path="/desk" element={<Desk />} />
                    <Route path="/oracle" element={<Oracle />} />
                    <Route path="/apps" element={<Apps />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/about" element={<About />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </DeskProvider>
              </PrefsProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </I18nProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
