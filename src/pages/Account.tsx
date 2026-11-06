import { useMemo, useState } from "react";
import { Cloud, MonitorSmartphone, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatTile } from "@/components/data/StatTile";
import { MiniBars } from "@/components/data/Sparkline";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { AvatarPicker } from "@/components/account/AvatarPicker";
import { useAuth } from "@/lib/auth";
import { useHub } from "@/lib/i18n/I18nProvider";
import { usePrefs } from "@/lib/prefs/store";
import { setDisplayName } from "@/lib/prefs/service";
import { loadUsage, summarize } from "@/lib/usage/store";
import { appById, alpha, SUITE_APPS } from "@/lib/suite/registry";

function compact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

export default function Account() {
  const h = useHub();
  const { session, updateName, signOut } = useAuth();
  const { update } = usePrefs();
  const [name, setName] = useState(session?.name ?? "");
  const [saved, setSaved] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const usage = useMemo(() => summarize(loadUsage(), 30), []);
  const isCloud = !!session?.email;

  const rows = useMemo(
    () => SUITE_APPS.map((app) => ({ app, present: !!localStorage.getItem(app.storageKey) })),
    [],
  );

  async function save() {
    await updateName(name);
    update((p) => setDisplayName(p, name));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-8">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-xs uppercase tracking-[0.3em] text-secondary">{h.account.eyebrow}</p>
          <h1 className="font-display text-2xl text-primary">{h.account.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{h.account.lead}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
          <Settings2 className="mr-1.5 h-3.5 w-3.5" /> {h.nav.settings}
        </Button>
      </header>

      <section className="olympus-card dense-card">
        <p className="mb-4 text-[10px] uppercase tracking-[0.22em] text-secondary">{h.account.identity}</p>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <AvatarPicker className="sm:w-[280px]" />
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <Label htmlFor="account-name">{h.account.name}</Label>
                <Input
                  id="account-name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setSaved(false); }}
                  placeholder={h.account.namePlaceholder}
                />
              </div>
              <Button onClick={save}>{saved ? h.account.saved : h.account.save}</Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{h.account.email}</div>
                <div className="truncate text-sm text-primary">{session?.email ?? "—"}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{h.account.sessionType}</div>
                <div className="flex items-center gap-1.5 text-sm text-primary">
                  {isCloud ? <Cloud className="h-3.5 w-3.5 text-secondary" /> : <MonitorSmartphone className="h-3.5 w-3.5 text-secondary" />}
                  {isCloud ? h.account.cloud : h.account.local}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <p className="mb-1 text-[10px] uppercase tracking-[0.22em] text-secondary">{h.account.usageTitle}</p>
        <p className="mb-3 text-xs text-muted-foreground">{h.account.usageLead}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile label={h.account.messages30} value={usage.messages30}>
            <MiniBars
              values={usage.series.map((d) => d.messages)}
              labels={usage.series.map((d) => d.date.slice(5))}
              color="hsl(var(--secondary))"
              height={30}
            />
          </StatTile>
          <StatTile label={h.account.tokens30} value={compact(usage.tokens30)} />
          <StatTile label={h.account.activeDays} value={usage.activeDays} hint={`${usage.streak} ${h.home.usageDays}`} />
        </div>

        <div className="olympus-card dense-card mt-4">
          <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{h.account.favoriteApps}</p>
          {usage.appLaunches.length === 0 ? (
            <p className="text-xs text-muted-foreground">{h.account.noLaunches}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {usage.appLaunches.map(({ app, count }) => {
                const meta = appById(app);
                return (
                  <span
                    key={app}
                    className="num rounded-full px-2.5 py-1 text-[11px]"
                    style={{ background: alpha(meta.color), color: meta.color }}
                  >
                    {meta.name} · {count}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section>
        <p className="mb-1 text-[10px] uppercase tracking-[0.22em] text-secondary">{h.account.dataTitle}</p>
        <p className="mb-3 text-xs text-muted-foreground">{h.account.dataLead}</p>
        <div className="olympus-card overflow-hidden">
          <ul>
            {rows.map(({ app, present }) => (
              <li key={app.id} className="flex items-center justify-between border-b border-border/50 px-4 py-2.5 text-xs last:border-0">
                <span className="flex items-center gap-2 text-primary">
                  <span className="h-2 w-2 rounded-full" style={{ background: app.color }} />
                  {app.name}
                  <span className="text-muted-foreground">· {app.dataKey}</span>
                </span>
                <span className={present ? "text-emerald-600" : "text-muted-foreground"}>
                  {present ? h.account.present : h.account.absent}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="olympus-card dense-card flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base text-primary">{h.account.signOut}</h3>
          <p className="text-xs text-muted-foreground">{h.account.signOutDesc}</p>
        </div>
        <Button variant="destructive" size="sm" onClick={signOut}>{h.account.signOut}</Button>
      </section>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
