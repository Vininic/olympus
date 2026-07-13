import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth";
import { useT, useI18n, type Locale } from "@/lib/i18n/I18nProvider";
import { usePrefs } from "@/lib/prefs/store";
import { useTheme } from "@/lib/theme/ThemeProvider";

const WIDGETS = ["chronosWidget", "kairosWidget", "plutoWidget", "hermesWidget", "chironWidget"] as const;

export default function Settings() {
  const t = useT();
  const s = t.olympus.settings;
  const { session, updateName, signOut } = useAuth();
  const { locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const { state: prefsState, updateName: prefsUpdateName, updateTheme: prefsUpdateTheme, updateLocale: prefsUpdateLocale, flush } = usePrefs();
  const [displayName, setDisplayName] = useState(session?.name || "");
  const [saving, setSaving] = useState(false);
  const isCloud = !!session?.email;

  const [widgets, setWidgets] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("olympus.widgets");
    if (saved) return JSON.parse(saved);
    return Object.fromEntries(WIDGETS.map((w) => [w, true]));
  });

  const toggleWidget = (key: string) => {
    const next = { ...widgets, [key]: !widgets[key] };
    setWidgets(next);
    localStorage.setItem("olympus.widgets", JSON.stringify(next));
  };

  const handleSaveName = async () => {
    setSaving(true);
    await updateName(displayName);
    if (isCloud) {
      prefsUpdateName(displayName);
      await flush();
    }
    setSaving(false);
  };

  const handleTheme = (t: "light" | "dark") => {
    setTheme(t);
    if (isCloud) {
      prefsUpdateTheme(t);
      void flush();
    }
  };

  const handleLocale = (l: Locale) => {
    setLocale(l);
    if (isCloud) {
      prefsUpdateLocale(l);
      void flush();
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <p className="mb-1 text-xs uppercase tracking-[0.3em] text-secondary">{s.eyebrow}</p>
        <h1 className="font-display text-2xl text-primary">{s.title}</h1>
      </div>

      <section className="mb-10">
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-secondary">{s.appearanceEyebrow}</p>
        <div className="olympus-card p-5">
          <h3 className="mb-3 font-display text-base text-primary">{s.appearanceTitle}</h3>
          <div className="flex gap-2">
            <Button variant={theme === "light" ? "default" : "outline"} size="sm" onClick={() => handleTheme("light")}>{s.parchment}</Button>
            <Button variant={theme === "dark" ? "default" : "outline"} size="sm" onClick={() => handleTheme("dark")}>{s.summit}</Button>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-secondary">{t.common.language}</p>
        <div className="olympus-card p-5">
          <div className="flex gap-2">
            <Button variant={locale === "pt" ? "default" : "outline"} size="sm" onClick={() => handleLocale("pt")}>Português</Button>
            <Button variant={locale === "en" ? "default" : "outline"} size="sm" onClick={() => handleLocale("en")}>English</Button>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-secondary">{s.profileEyebrow}</p>
        <div className="olympus-card p-5">
          <h3 className="mb-1 font-display text-base text-primary">{s.profileTitle}</h3>
          <p className="mb-4 text-xs text-muted-foreground">{s.profileDesc}</p>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label htmlFor="display-name">{s.nameLabel}</Label>
              <Input id="display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={s.namePlaceholder} />
            </div>
            <Button onClick={handleSaveName} disabled={saving}>{saving ? "..." : s.save}</Button>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-secondary">{s.widgetEyebrow}</p>
        <div className="olympus-card p-5">
          <h3 className="mb-1 font-display text-base text-primary">{s.widgetTitle}</h3>
          <p className="mb-4 text-xs text-muted-foreground">{s.widgetDesc}</p>
          <div className="flex flex-col gap-3">
            {WIDGETS.map((key) => (
              <label key={key} className="flex items-center justify-between">
                <span className="text-sm text-primary">{t.olympus.desk[key as keyof typeof t.olympus.desk] as string}</span>
                <Switch checked={widgets[key]} onCheckedChange={() => toggleWidget(key)} />
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-10">
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-secondary">{s.dataEyebrow}</p>
        <div className="olympus-card p-5">
          <h3 className="mb-1 font-display text-base text-primary">{s.dataTitle}</h3>
          <p className="mb-4 text-xs text-muted-foreground">{s.dataDesc}</p>
          {isCloud ? (
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Chronos — agenda e blocos de tempo</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Kairos — tarefas e quadros</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Pluto — finanças e orçamento</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Hermes — mensagens e entregas</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Chiron — estudos e revisões</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Suite-prefs — preferências compartilhadas</li>
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Nenhum dado na nuvem. Faça login para sincronizar.</p>
          )}
        </div>
      </section>

      <section className="mb-10">
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-destructive">{t.common.signOut}</p>
        <div className="olympus-card p-5">
          <h3 className="mb-1 font-display text-base text-primary">{t.common.signOut}</h3>
          <p className="mb-4 text-xs text-muted-foreground">{s.signOutDesc}</p>
          <Button variant="destructive" size="sm" onClick={signOut}>{t.common.signOut}</Button>
        </div>
      </section>
    </div>
  );
}
