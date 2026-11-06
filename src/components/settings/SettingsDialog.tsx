import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bell, Blocks, Database, MonitorSmartphone, Palette, Play, Settings2, Sparkles, User, Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth";
import { useHub, useI18n, type Locale } from "@/lib/i18n/I18nProvider";
import { LOCALE_LABELS } from "@/lib/i18n/dictionaries";
import { usePrefs } from "@/lib/prefs/store";
import {
  setAppearance, setDisplayName, setExtensionEnabled, setLocale as setLocalePref,
  setNotifications, setSpeech, setStartPage,
} from "@/lib/prefs/service";
import type { ThemeMode, ThemeSkin } from "@/lib/prefs/types";
import { useTheme } from "@/lib/theme/ThemeProvider";
import {
  DEFAULT_MODELS, PROVIDER_LABELS, loadAiSettings, saveAiSettings,
  type AiProvider, type AiSettings,
} from "@/lib/ai/settings";
import { streamChat } from "@/lib/ai/providers";
import { allExtensions, isEnabled } from "@/lib/extensions/registry";
import { SUITE_APPS, alpha } from "@/lib/suite/registry";
import { listVoices, onVoicesChanged, speak, isSupported as ttsSupported } from "@/lib/speech/tts";
import {
  permission as notifyPermission, requestPermission, sendTestNotification,
} from "@/lib/notifications/service";
import { clearUsage, loadUsage } from "@/lib/usage/store";
import { AvatarPicker } from "@/components/account/AvatarPicker";
import { isDesktopShell } from "@/lib/desktop/shell";
import { readDesktopPrefs, writeDesktopPrefs } from "@/lib/desktop/prefs";
import { cn } from "@/lib/utils";

type SectionId =
  | "general" | "appearance" | "intelligence" | "apps"
  | "notifications" | "speech" | "desktop" | "data" | "account";

const SECTION_ICONS: Record<SectionId, typeof Settings2> = {
  general: Settings2,
  appearance: Palette,
  intelligence: Sparkles,
  apps: Blocks,
  notifications: Bell,
  speech: Volume2,
  desktop: MonitorSmartphone,
  data: Database,
  account: User,
};

/* ── Layout primitives (ChatGPT-settings anatomy: label left, control right) ─ */

function Row({ label, description, children, stacked }: {
  label: string; description?: string; children: ReactNode; stacked?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 border-b border-border/60 py-3.5 last:border-0",
        stacked ? "flex-col" : "items-center justify-between",
      )}
    >
      <div className="min-w-0">
        <div className="text-sm text-primary">{label}</div>
        {description && <div className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{description}</div>}
      </div>
      <div className={cn("shrink-0", stacked && "w-full")}>{children}</div>
    </div>
  );
}

function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      {title && (
        <p className="mb-1.5 text-[10px] uppercase tracking-[0.22em] text-secondary">{title}</p>
      )}
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

function Segmented<T extends string>({ value, options, onChange }: {
  value: T; options: { value: T; label: string }[]; onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg border border-border bg-surface-veil/50 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs transition-colors",
            value === option.value
              ? "bg-card text-primary shadow-sm"
              : "text-muted-foreground hover:text-primary",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* ── Sections ──────────────────────────────────────────────────────────────── */

function GeneralSection() {
  const h = useHub();
  const { locale, setLocale } = useI18n();
  const { prefs, update } = usePrefs();
  const { density, setDensity } = useTheme();
  const appearance = prefs.appearance!;

  return (
    <Group>
      <Row label={h.settings.general.language}>
        <Segmented<Locale>
          value={locale}
          onChange={(l) => { setLocale(l); update((p) => setLocalePref(p, l)); }}
          options={[
            { value: "pt", label: LOCALE_LABELS.pt.long },
            { value: "en", label: LOCALE_LABELS.en.long },
          ]}
        />
      </Row>
      <Row label={h.settings.general.density}>
        <Segmented
          value={density}
          onChange={(d) => { setDensity(d); update((p) => setAppearance(p, { density: d })); }}
          options={[
            { value: "comfortable" as const, label: h.settings.general.densityComfortable },
            { value: "compact" as const, label: h.settings.general.densityCompact },
          ]}
        />
      </Row>
      <Row label={h.settings.general.startPage}>
        <Segmented
          value={prefs.startPage ?? "home"}
          onChange={(v) => update((p) => setStartPage(p, v))}
          options={[
            { value: "home" as const, label: h.settings.general.startHome },
            { value: "chat" as const, label: h.settings.general.startChat },
          ]}
        />
      </Row>
      <Row label={h.settings.general.reduceMotion} description={h.settings.general.reduceMotionDesc}>
        <Switch
          checked={appearance.reduceMotion}
          onCheckedChange={(v) => update((p) => setAppearance(p, { reduceMotion: v }))}
        />
      </Row>
    </Group>
  );
}

const SKIN_SWATCHES: Record<ThemeSkin, [string, string]> = {
  marble: ["#F7F4EE", "#C9B99A"],
  nocturne: ["#EEF1F5", "#C9A75E"],
  parchment: ["#F3E7D0", "#C08A4E"],
  sepia: ["#EFE3D5", "#9C6B4E"],
  ink: ["#F7F7F7", "#3A3A3A"],
};

function AppearanceSection() {
  const h = useHub();
  const { mode, setMode, skin, setSkin } = useTheme();
  const { update } = usePrefs();

  return (
    <Group>
      <Row label={h.settings.appearance.mode}>
        <Segmented<ThemeMode>
          value={mode}
          onChange={(m) => { setMode(m); update((p) => setAppearance(p, { mode: m })); }}
          options={[
            { value: "light", label: h.settings.appearance.light },
            { value: "dark", label: h.settings.appearance.dark },
            { value: "system", label: h.settings.appearance.system },
          ]}
        />
      </Row>
      <Row label={h.settings.appearance.skin} description={h.settings.appearance.skinDesc} stacked>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(Object.keys(SKIN_SWATCHES) as ThemeSkin[]).map((option) => {
            const [paper, accent] = SKIN_SWATCHES[option];
            return (
              <button
                key={option}
                type="button"
                onClick={() => { setSkin(option); update((p) => setAppearance(p, { skin: option })); }}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border p-2 text-left transition-colors",
                  skin === option ? "border-secondary bg-secondary/10" : "border-border hover:border-secondary/50",
                )}
              >
                <span className="flex h-8 w-8 shrink-0 overflow-hidden rounded-md border border-border">
                  <span className="h-full w-1/2" style={{ background: paper }} />
                  <span className="h-full w-1/2" style={{ background: accent }} />
                </span>
                <span className="min-w-0 truncate text-xs text-primary">
                  {h.settings.appearance.skins[option]}
                </span>
              </button>
            );
          })}
        </div>
      </Row>
      <Row label={h.settings.appearance.preview} stacked>
        <div className="olympus-card mt-2 p-3">
          <p className="mb-1 text-[10px] uppercase tracking-[0.22em] text-secondary">Olympus</p>
          <p className="font-display text-lg text-primary">Um cume. Todos os instrumentos.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Corpo de texto no papel atual, com um <span className="text-secondary">acento</span> e um{" "}
            <span className="num">1.284</span> tabular.
          </p>
          <div className="mt-2 flex gap-1.5">
            {SUITE_APPS.map((app) => (
              <span key={app.id} className="h-2 w-8 rounded-full" style={{ background: app.color }} />
            ))}
          </div>
        </div>
      </Row>
    </Group>
  );
}

function IntelligenceSection() {
  const h = useHub();
  const [ai, setAi] = useState<AiSettings>(loadAiSettings);
  const [test, setTest] = useState<"idle" | "running" | "ok" | "fail">("idle");

  function patch(next: Partial<AiSettings>) {
    setAi((prev) => {
      const merged = { ...prev, ...next };
      saveAiSettings(merged);
      return merged;
    });
    setTest("idle");
  }

  async function runTest() {
    setTest("running");
    try {
      await streamChat(ai, [{ role: "user", content: "ping" }], () => {});
      setTest("ok");
    } catch {
      setTest("fail");
    }
  }

  const hosted = ai.provider === "gemini-hosted" || ai.provider === "openrouter-hosted";

  return (
    <Group>
      <Row label={h.settings.intelligence.provider}>
        <Select value={ai.provider} onValueChange={(v) => patch({ provider: v as AiProvider, model: "" })}>
          <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(PROVIDER_LABELS) as AiProvider[]).map((provider) => (
              <SelectItem key={provider} value={provider}>{PROVIDER_LABELS[provider]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Row>

      <Row label={h.settings.intelligence.model}>
        <Input
          value={ai.model}
          onChange={(e) => patch({ model: e.target.value })}
          placeholder={DEFAULT_MODELS[ai.provider]}
          disabled={hosted}
          className="w-[220px]"
        />
      </Row>

      {hosted ? (
        <Row label={h.settings.intelligence.hostedNote} stacked>
          <span className="sr-only">{h.settings.intelligence.hostedNote}</span>
        </Row>
      ) : ai.provider === "ollama" ? (
        <Row label={h.settings.intelligence.ollamaUrl}>
          <Input
            value={ai.baseUrl}
            onChange={(e) => patch({ baseUrl: e.target.value })}
            placeholder="http://localhost:11434"
            className="w-[220px]"
          />
        </Row>
      ) : (
        <Row label={h.settings.intelligence.apiKey} description={h.settings.intelligence.keysNote}>
          <Input
            type="password"
            value={ai.apiKey}
            onChange={(e) => patch({ apiKey: e.target.value })}
            placeholder={h.settings.intelligence.apiKeyPlaceholder}
            className="w-[220px]"
          />
        </Row>
      )}

      <Row label={h.settings.intelligence.autonomy} description={h.settings.intelligence.autonomyNote}>
        <Segmented
          value={ai.autonomy}
          onChange={(v) => patch({ autonomy: v })}
          options={[
            { value: "suggest" as const, label: h.settings.intelligence.autonomySuggest },
            { value: "auto" as const, label: h.settings.intelligence.autonomyAuto },
          ]}
        />
      </Row>

      <Row
        label={h.settings.intelligence.test}
        description={
          test === "ok" ? h.settings.intelligence.testOk
            : test === "fail" ? h.settings.intelligence.testFail
            : undefined
        }
      >
        <Button size="sm" variant="outline" onClick={runTest} disabled={test === "running"}>
          {test === "running" ? h.settings.intelligence.testing : h.settings.intelligence.test}
        </Button>
      </Row>
    </Group>
  );
}

function AppsSection() {
  const h = useHub();
  const { prefs, update } = usePrefs();
  const extensions = allExtensions();

  return (
    <>
      <Group title={h.apps.suiteApps}>
        {extensions.filter((e) => e.kind === "app").map((ext) => (
          <Row
            key={ext.id}
            label={ext.name}
            description={`${ext.description} · ${h.apps.capabilities}: ${ext.capabilities.map((c) => h.apps.capability[c]).join(", ")}`}
          >
            <Switch
              checked={isEnabled(prefs, ext.id)}
              onCheckedChange={(v) => update((p) => setExtensionEnabled(p, ext.id, v))}
            />
          </Row>
        ))}
      </Group>
      <Group title={h.apps.extensions}>
        {extensions.filter((e) => e.kind === "extension").map((ext) => (
          <Row key={ext.id} label={ext.name} description={ext.description}>
            <Switch
              checked={isEnabled(prefs, ext.id)}
              onCheckedChange={(v) => update((p) => setExtensionEnabled(p, ext.id, v))}
            />
          </Row>
        ))}
        <p className="pt-3 text-[11px] leading-relaxed text-muted-foreground">{h.apps.bridgeLead}</p>
      </Group>
    </>
  );
}

function NotificationsSection() {
  const h = useHub();
  const { prefs, update } = usePrefs();
  const [perm, setPerm] = useState(() => notifyPermission());
  const notifications = prefs.notifications!;

  const permissionLabel =
    perm === "granted" ? h.settings.notifications.granted
      : perm === "denied" ? h.settings.notifications.denied
      : perm === "unsupported" ? h.settings.notifications.unsupported
      : h.settings.notifications.default;

  return (
    <Group>
      <Row
        label={h.settings.notifications.permission}
        description={perm === "denied" ? h.settings.notifications.deniedHelp : permissionLabel}
      >
        {perm === "default" ? (
          <Button size="sm" variant="outline" onClick={() => void requestPermission().then(setPerm)}>
            {h.settings.notifications.request}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">{permissionLabel}</span>
        )}
      </Row>

      <Row label={h.settings.notifications.enable} description={h.settings.notifications.enableDesc}>
        <Switch
          checked={notifications.enabled}
          disabled={perm !== "granted"}
          onCheckedChange={(v) => update((p) => setNotifications(p, { enabled: v }))}
        />
      </Row>

      <Row label={h.settings.notifications.perApp} stacked>
        <div className="mt-2 flex flex-col gap-2">
          {SUITE_APPS.map((app) => (
            <label key={app.id} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-xs text-primary">
                <span className="h-2 w-2 rounded-full" style={{ background: app.color }} />
                {app.name}
              </span>
              <Switch
                checked={notifications.apps[app.id] !== false}
                onCheckedChange={(v) => update((p) => setNotifications(p, { apps: { [app.id]: v } }))}
              />
            </label>
          ))}
        </div>
      </Row>

      <Row label={h.settings.notifications.quiet}>
        <div className="flex items-center gap-2">
          <Input
            type="time"
            value={notifications.quietHours.from}
            onChange={(e) => update((p) => setNotifications(p, { quietHours: { ...notifications.quietHours, from: e.target.value } }))}
            className="w-[110px]"
            aria-label={h.settings.notifications.quietFrom}
          />
          <span className="text-xs text-muted-foreground">→</span>
          <Input
            type="time"
            value={notifications.quietHours.to}
            onChange={(e) => update((p) => setNotifications(p, { quietHours: { ...notifications.quietHours, to: e.target.value } }))}
            className="w-[110px]"
            aria-label={h.settings.notifications.quietTo}
          />
          <Switch
            checked={notifications.quietHours.enabled}
            onCheckedChange={(v) => update((p) => setNotifications(p, { quietHours: { ...notifications.quietHours, enabled: v } }))}
          />
        </div>
      </Row>

      <Row label={h.settings.notifications.test}>
        <Button size="sm" variant="outline" disabled={perm !== "granted"} onClick={() => sendTestNotification()}>
          {h.settings.notifications.test}
        </Button>
      </Row>
    </Group>
  );
}

function SpeechSection() {
  const h = useHub();
  const { locale } = useI18n();
  const { prefs, update } = usePrefs();
  const speech = prefs.speech!;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => listVoices());

  useEffect(() => onVoicesChanged(() => setVoices(listVoices())), []);

  if (!ttsSupported()) {
    return <Group><p className="py-3 text-xs text-muted-foreground">{h.settings.speech.unsupported}</p></Group>;
  }

  return (
    <Group>
      <Row label={h.settings.speech.voice}>
        <Select
          value={speech.voiceURI || "__default"}
          onValueChange={(v) => update((p) => setSpeech(p, { voiceURI: v === "__default" ? "" : v }))}
        >
          <SelectTrigger className="w-[240px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__default">{h.settings.speech.systemDefault}</SelectItem>
            {voices.map((voice) => (
              <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Row>

      <Row label={`${h.settings.speech.rate} · ${speech.rate.toFixed(1)}×`}>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.1}
          value={speech.rate}
          onChange={(e) => update((p) => setSpeech(p, { rate: Number(e.target.value) }))}
          className="w-[180px] accent-[hsl(var(--secondary))]"
          aria-label={h.settings.speech.rate}
        />
      </Row>

      <Row label={`${h.settings.speech.pitch} · ${speech.pitch.toFixed(1)}`}>
        <input
          type="range"
          min={0}
          max={2}
          step={0.1}
          value={speech.pitch}
          onChange={(e) => update((p) => setSpeech(p, { pitch: Number(e.target.value) }))}
          className="w-[180px] accent-[hsl(var(--secondary))]"
          aria-label={h.settings.speech.pitch}
        />
      </Row>

      <Row label={h.settings.speech.autoSpeak}>
        <Switch
          checked={speech.autoSpeak}
          onCheckedChange={(v) => update((p) => setSpeech(p, { autoSpeak: v }))}
        />
      </Row>

      <Row label={h.settings.speech.preview}>
        <Button
          size="sm"
          variant="outline"
          onClick={() => speak(h.settings.speech.previewText, { ...speech, lang: LOCALE_LABELS[locale].bcp47 })}
        >
          <Play className="mr-1.5 h-3 w-3" /> {h.settings.speech.preview}
        </Button>
      </Row>
    </Group>
  );
}

/** The one section that only exists in the desktop shell. Rendered in the
 *  browser too, but as an explanation of what the shell adds rather than a row
 *  of dead switches. */
function DesktopSection() {
  const h = useHub();
  const s = h.settings.desktop;
  const inShell = isDesktopShell();
  const [prefs, setPrefs] = useState(readDesktopPrefs);

  if (!inShell) {
    return (
      <Group>
        <p className="py-3 text-xs leading-relaxed text-muted-foreground">{s.onlyInShell}</p>
        <p className="text-[11px] leading-relaxed text-muted-foreground">{s.widgetNote}</p>
      </Group>
    );
  }

  return (
    <Group>
      <Row label={s.alwaysOnTop} description={s.alwaysOnTopDesc}>
        <Switch
          checked={prefs.alwaysOnTop}
          onCheckedChange={(v) => {
            const next = { ...prefs, alwaysOnTop: v };
            writeDesktopPrefs(next);
            setPrefs(next);
          }}
        />
      </Row>
      <p className="pt-3 text-[11px] text-muted-foreground">{s.widgetNote}</p>
    </Group>
  );
}

const LOCAL_KEYS = [
  "olympus.prefs.v2",
  "olympus.usage.v1",
  "olympus.chat-sessions.v1",
  "olympus.notify.seen.v1",
  ...SUITE_APPS.map((a) => a.storageKey),
];

function DataSection() {
  const h = useHub();
  const [cleared, setCleared] = useState(false);

  const rows = useMemo(
    () => SUITE_APPS.map((app) => ({
      app,
      present: !!localStorage.getItem(app.storageKey),
    })),
    [cleared],
  );

  function exportAll() {
    const payload: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      // AI settings are deliberately absent: the key never leaves the device,
      // and an export file is exactly how it would.
      usage: loadUsage(),
    };
    for (const key of LOCAL_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try { payload[key] = JSON.parse(raw); } catch { payload[key] = raw; }
      }
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `olympus-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearLocal() {
    if (!window.confirm(h.settings.data.clearConfirm)) return;
    for (const key of LOCAL_KEYS) localStorage.removeItem(key);
    clearUsage();
    setCleared(true);
  }

  return (
    <Group>
      <Row label={h.settings.data.rows} stacked>
        <ul className="mt-2 flex flex-col gap-1.5">
          {rows.map(({ app, present }) => (
            <li key={app.id} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-primary">
                <span className="h-2 w-2 rounded-full" style={{ background: app.color }} />
                {app.name} <span className="text-muted-foreground">· {app.dataKey}</span>
              </span>
              <span className={present ? "text-emerald-600" : "text-muted-foreground"}>
                {present ? h.account.present : h.account.absent}
              </span>
            </li>
          ))}
        </ul>
      </Row>

      <Row label={h.settings.data.export} description={h.settings.data.exportDesc}>
        <Button size="sm" variant="outline" onClick={exportAll}>{h.settings.data.export}</Button>
      </Row>

      <Row
        label={h.settings.data.clear}
        description={cleared ? h.settings.data.cleared : h.settings.data.clearDesc}
      >
        <Button size="sm" variant="destructive" onClick={clearLocal}>{h.settings.data.clear}</Button>
      </Row>

      <p className="pt-3 text-[11px] text-muted-foreground">{h.settings.data.keysNote}</p>
    </Group>
  );
}

function AccountSection({ onClose }: { onClose: () => void }) {
  const h = useHub();
  const { session, updateName, signOut } = useAuth();
  const { update } = usePrefs();
  const [name, setName] = useState(session?.name ?? "");
  const [saved, setSaved] = useState(false);

  async function save() {
    await updateName(name);
    update((p) => setDisplayName(p, name));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <Group>
      <Row label={h.account.avatarTitle} stacked>
        <AvatarPicker className="mt-3" />
      </Row>
      <Row label={h.account.name} >
        <div className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(e) => { setName(e.target.value); setSaved(false); }}
            placeholder={h.account.namePlaceholder}
            className="w-[200px]"
          />
          <Button size="sm" onClick={save}>{saved ? h.account.saved : h.account.save}</Button>
        </div>
      </Row>
      <Row label={h.account.email}>
        <span className="text-xs text-muted-foreground">{session?.email ?? "—"}</span>
      </Row>
      <Row label={h.account.sessionType}>
        <span className="text-xs text-muted-foreground">
          {session?.email ? h.account.cloud : h.account.local}
        </span>
      </Row>
      <Row label={h.account.signOut} description={h.account.signOutDesc}>
        <Button size="sm" variant="destructive" onClick={() => { onClose(); signOut(); }}>
          {h.account.signOut}
        </Button>
      </Row>
    </Group>
  );
}

/* ── Shell ─────────────────────────────────────────────────────────────────── */

export function SettingsDialog({
  open, onOpenChange, initialSection = "general",
}: { open: boolean; onOpenChange: (open: boolean) => void; initialSection?: SectionId }) {
  const h = useHub();
  const [section, setSection] = useState<SectionId>(initialSection);

  useEffect(() => { if (open) setSection(initialSection); }, [open, initialSection]);

  const sections = Object.keys(h.settings.sections) as SectionId[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86vh] w-[min(920px,94vw)] max-w-none gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogTitle className="border-b border-border px-5 py-3.5 font-display text-base text-primary">
          {h.settings.title}
        </DialogTitle>

        <div className="flex min-h-0 flex-col sm:h-[560px] sm:flex-row">
          <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-border p-2 sm:w-52 sm:flex-col sm:overflow-x-visible sm:overflow-y-auto sm:border-b-0 sm:border-r">
            {sections.map((id) => {
              const Icon = SECTION_ICONS[id];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSection(id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors",
                    section === id
                      ? "bg-surface-veil text-primary"
                      : "text-muted-foreground hover:bg-surface-veil/60 hover:text-primary",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{h.settings.sections[id]}</span>
                </button>
              );
            })}
          </nav>

          <ScrollArea className="min-h-0 flex-1">
            <div className="px-5 py-4">
              {section === "general" && <GeneralSection />}
              {section === "appearance" && <AppearanceSection />}
              {section === "intelligence" && <IntelligenceSection />}
              {section === "apps" && <AppsSection />}
              {section === "notifications" && <NotificationsSection />}
              {section === "speech" && <SpeechSection />}
              {section === "desktop" && <DesktopSection />}
              {section === "data" && <DataSection />}
              {section === "account" && <AccountSection onClose={() => onOpenChange(false)} />}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
