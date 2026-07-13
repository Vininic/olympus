import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo, { OlympusMark } from "@/components/OlympusLogo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Column3D } from "@/components/three/Column";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";

export default function Login() {
  const { session, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const l = t.olympus.login;

  const [mode, setMode] = useState<"local" | "cloud">("local");
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect an already-signed-in user off the login page — in an effect, not
  // during render (calling navigate() mid-render warns and can loop).
  useEffect(() => {
    if (session) navigate("/desk", { replace: true });
  }, [session, navigate]);
  if (session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "local") {
        await signIn(name);
        navigate("/desk", { replace: true });
        return;
      }
      if (!email || !password) { setError(l.needsEmailPass); setLoading(false); return; }
      const res = isSignUp
        ? await signUp(name || undefined, email, password)
        : await signIn(name, email, password);
      if (res === "invalid_credentials" || res === "Invalid login credentials") {
        setError(l.badCredentials);
      } else if (res === "account_exists") {
        setError(l.accountExists);
      } else if (res) {
        setError(res);
      } else {
        navigate("/desk", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: brand panel with the marble column hero — mirrors Chronos/Kairos/
          Pluto's split login so Olympus doesn't read as a bare centered card. */}
      <div className="bg-summit relative hidden flex-col p-10 text-primary-foreground lg:flex">
        <Logo variant="light" />
        <div className="grid flex-1 place-items-center">
          <Column3D />
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-sidebar-foreground/80">{l.heroTagline ?? l.title}</p>
      </div>

      {/* Right: the form */}
      <div className="olympus-surface flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-5 sm:px-10">
          <div className="lg:hidden"><Logo /></div>
          <div className="ml-auto flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="olympus-card p-8">
            <div className="mb-6 text-center">
              <p className="mb-1 text-xs uppercase tracking-[0.3em] text-secondary">{l.eyebrow}</p>
              <h1 className="font-display text-2xl text-primary">{l.title}</h1>
            </div>

            <div className="mb-6 flex rounded-lg border border-border bg-surface-raised p-1">
              <button
                onClick={() => setMode("local")}
                className={cn(
                  "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  mode === "local" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-primary",
                )}
              >
                {l.modeLocal}
              </button>
              <button
                onClick={() => setMode("cloud")}
                className={cn(
                  "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  mode === "cloud" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-primary",
                )}
              >
                {l.modeCloud}
              </button>
            </div>

            {mode === "local" && (
              <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{l.localBlurb}</p>
            )}
            {mode === "cloud" && (
              <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{l.cloudBlurb}</p>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === "local" && (
                <div>
                  <Label htmlFor="name">{l.name}</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={l.namePlaceholder} autoFocus />
                </div>
              )}

              {mode === "cloud" && (
                <>
                  <div>
                    <Label htmlFor="cloud-name">
                      {l.cloudNameLabel} <span className="text-muted-foreground">{l.cloudNameHint}</span>
                    </Label>
                    <Input id="cloud-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={l.cloudNamePlaceholder} />
                  </div>
                  <div>
                    <Label htmlFor="email">{l.email}</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
                  </div>
                  <div>
                    <Label htmlFor="password">{l.password}</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                </>
              )}

              {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "…" : mode === "cloud" ? (isSignUp ? l.signUpSubmit : l.signInSubmit) : l.enter}
              </Button>

              {mode === "cloud" && (
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                  className="text-xs text-muted-foreground underline underline-offset-2 hover:text-primary"
                >
                  {isSignUp ? l.toggleToSignIn : l.toggleToSignUp}
                </button>
              )}
            </form>
          </div>
        </div>
      </div>

        <footer className="flex items-center justify-center gap-2 py-6 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <OlympusMark className="h-3.5 w-3.5 text-secondary" />
          {t.common.appName} · {t.common.suite}
        </footer>
      </div>
    </div>
  );
}
