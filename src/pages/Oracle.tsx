import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen, Check, Clock, Copy, GraduationCap, History, LayoutDashboard, Loader2,
  MessageSquareQuote, Send, Settings2, Sparkles, Square, Volume2, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Markdown from "@/components/Markdown";
import { useI18n, useT } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { streamChat, type ChatMessage } from "@/lib/ai/providers";
import {
  DEFAULT_MODELS, PROVIDER_LABELS, loadAiSettings, saveAiSettings,
  type AiProvider, type AiSettings,
} from "@/lib/ai/settings";
import { refreshContext } from "@/lib/ai/context";
import { parseChronos } from "@/lib/views/chronos";
import { parseKairos } from "@/lib/views/kairos";
import { parsePluto } from "@/lib/views/pluto";
import { parseHermes } from "@/lib/views/hermes";
import { parseChiron } from "@/lib/views/chiron";

interface UiMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

// Same shared-floor rationale as Chiron/Hermes' Aetheris meters.
const CONTEXT_BUDGET_TOKENS = 32_000;
const estimateTokens = (text: string) => Math.ceil(text.length / 4);

function makeId(): string {
  return crypto.randomUUID();
}

function readRaw(key: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw).value;
  } catch {
    return null;
  }
}

function OracleOverview() {
  const t = useT();
  const o = t.olympus.oracle;

  const chronos = parseChronos(readRaw("olympus.view.chronos") || {});
  const kairos = parseKairos(readRaw("olympus.view.kairos") || {});
  const pluto = parsePluto(readRaw("olympus.view.pluto") || {});
  const hermes = parseHermes(readRaw("olympus.view.hermes") || {});
  const chiron = parseChiron(readRaw("olympus.view.chiron") || {});

  const rows = [
    { icon: Clock, label: "Chronos", color: "#0E2A47", value: chronos ? `${chronos.completedBlocksToday}/${chronos.totalBlocksToday} blocos` : "—" },
    { icon: GraduationCap, label: "Kairos", color: "#7D4E8C", value: kairos ? `${kairos.doing} fazendo · ${kairos.dueToday} vencem` : "—" },
    { icon: Wallet, label: "Pluto", color: "#183427", value: pluto ? `R$ ${(pluto.expenseMonthCents / 100).toFixed(0)} este mês` : "—" },
    { icon: MessageSquareQuote, label: "Hermes", color: "#3EB8CC", value: hermes ? `${hermes.pendingCount} pendentes` : "—" },
    { icon: BookOpen, label: "Chiron", color: "#A63446", value: chiron ? `${chiron.dueCards} revisões` : "—" },
  ];

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">{o.overviewEmpty}</p>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 rounded-lg border border-border bg-surface-raised p-2.5">
          <r.icon className="h-3.5 w-3.5 shrink-0" style={{ color: r.color }} />
          <span className="min-w-0 flex-1 truncate text-xs text-primary">{r.label}</span>
          <span className="num shrink-0 text-[11px] text-muted-foreground">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

function DigestCard({ icon: Icon, color, title, children }: { icon: any; color: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface-raised p-3">
      <div className="mb-1 flex items-center gap-2">
        <Icon className="h-3 w-3" style={{ color }} />
        <span className="text-xs font-medium text-primary">{title}</span>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

function OracleDigest() {
  const t = useT();
  const o = t.olympus.oracle;

  const chronos = parseChronos(readRaw("olympus.view.chronos") || {});
  const kairos = parseKairos(readRaw("olympus.view.kairos") || {});
  const pluto = parsePluto(readRaw("olympus.view.pluto") || {});
  const hermes = parseHermes(readRaw("olympus.view.hermes") || {});
  const chiron = parseChiron(readRaw("olympus.view.chiron") || {});

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">{o.digestEmpty}</p>
      <DigestCard icon={Clock} color="#0E2A47" title="Chronos">
        {chronos ? `${chronos.currentBlock || "Nenhum bloco ativo"} · ${chronos.remainingFocusHours}h restantes` : "Sem dados"}
      </DigestCard>
      <DigestCard icon={GraduationCap} color="#7D4E8C" title="Kairos">
        {kairos ? `${kairos.doing} em andamento · ${kairos.overdue} atrasadas · ${kairos.doneToday} concluídas hoje` : "Sem dados"}
      </DigestCard>
      <DigestCard icon={Wallet} color="#183427" title="Pluto">
        {pluto ? `R$ ${(pluto.incomeMonthCents / 100).toFixed(2)} receita · R$ ${(pluto.expenseMonthCents / 100).toFixed(2)} despesas${pluto.budgetAlertCount > 0 ? ` · ⚠ ${pluto.budgetAlertCount} estouros` : ""}` : "Sem dados"}
      </DigestCard>
      <DigestCard icon={MessageSquareQuote} color="#3EB8CC" title="Hermes">
        {hermes ? `${hermes.pendingCount} pendentes · ${hermes.failedCount} falhas · ${hermes.sentToday} enviadas hoje` : "Sem dados"}
      </DigestCard>
      <DigestCard icon={BookOpen} color="#A63446" title="Chiron">
        {chiron ? `${chiron.dueCards} revisões · ${chiron.streak} dias de sequência · ${chiron.totalPoints} pontos` : "Sem dados"}
      </DigestCard>
    </div>
  );
}

function OracleHistory() {
  const t = useT();
  const o = t.olympus.oracle;
  return <p className="text-xs text-muted-foreground">{o.historyEmpty}</p>;
}

export default function Oracle() {
  const t = useT();
  const { locale } = useI18n();
  const o = t.olympus.oracle;
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"overview" | "digest" | "history">("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AiSettings>(loadAiSettings);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const updateSettings = (patch: Partial<AiSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveAiSettings(next);
  };

  const systemPrompt = useMemo(() => refreshContext(), [messages.length]);
  const usedTokens = useMemo(() => {
    const convoText = messages.map((m) => m.text).join("\n") + (streamingText ?? "") + draft;
    return estimateTokens(systemPrompt) + estimateTokens(convoText);
  }, [systemPrompt, messages, streamingText, draft]);
  const contextPct = Math.min(100, Math.round((usedTokens / CONTEXT_BUDGET_TOKENS) * 100));

  const handleSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || loading) return;
    setDraft("");
    const userMsg: UiMessage = { id: makeId(), role: "user", text };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);
    setStreamingText("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const chatMessages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...history.map((m) => ({ role: m.role, content: m.text }) as ChatMessage),
      ];

      let full = "";
      await streamChat(settings, chatMessages, (delta) => {
        full += delta;
        setStreamingText(full);
      }, controller.signal);

      setMessages((prev) => [...prev, { id: makeId(), role: "assistant", text: full }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao consultar o Oráculo";
      setMessages((prev) => [...prev, { id: makeId(), role: "assistant", text: `Erro: ${message}` }]);
    } finally {
      setStreamingText(null);
      setLoading(false);
      abortRef.current = null;
    }
  }, [draft, loading, messages, settings, systemPrompt]);

  const stopGenerating = () => abortRef.current?.abort();

  const toggleSpeak = (id: string, text: string) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (speakingId === id) {
      synth.cancel();
      setSpeakingId(null);
      return;
    }
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = locale === "en" ? "en-US" : "pt-BR";
    utter.onend = () => setSpeakingId(null);
    utter.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    synth.speak(utter);
  };

  const copyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500);
    } catch { /* clipboard unavailable — no-op */ }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full min-h-0 gap-0">
      <div className="flex flex-1 flex-col min-w-0">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.3em] text-secondary">{o.eyebrow}</p>
            <h1 className="font-display text-2xl text-primary">{o.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{o.lead}</p>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen((v) => !v)}
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:text-foreground",
              settingsOpen && "border-secondary text-secondary",
            )}
            aria-label="AI settings"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>

        {settingsOpen && (
          <div className="mb-4 flex shrink-0 flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
            <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              Provider
              <select
                value={settings.provider}
                onChange={(e) => updateSettings({ provider: e.target.value as AiProvider, model: "" })}
                className="rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm text-foreground"
              >
                {Object.entries(PROVIDER_LABELS).map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </label>
            {settings.provider !== "gemini-hosted" && settings.provider !== "openrouter-hosted" && settings.provider !== "ollama" && (
              <label className="flex flex-1 flex-col gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                API key
                <input
                  type="password"
                  value={settings.apiKey}
                  onChange={(e) => updateSettings({ apiKey: e.target.value })}
                  placeholder="sk-…"
                  className="rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm text-foreground"
                />
              </label>
            )}
            <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              Model
              <input
                value={settings.model}
                onChange={(e) => updateSettings({ model: e.target.value })}
                placeholder={DEFAULT_MODELS[settings.provider]}
                className="w-48 rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm text-foreground"
              />
            </label>
          </div>
        )}

        <ScrollArea className="flex-1 pr-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Sparkles className="mb-4 h-10 w-10 text-secondary/40" />
              <p className="mb-6 text-sm text-muted-foreground">{o.emptyChat}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {o.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDraft(s)}
                    className="rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground transition-colors hover:border-secondary hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={cn("group mb-4 flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-gilt text-primary-deep"
                    : "bg-card border border-border text-primary",
                )}
              >
                {msg.role === "assistant" ? <Markdown text={msg.text} /> : <div>{msg.text}</div>}
                <div className="mt-1 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button type="button" onClick={() => copyMessage(msg.id, msg.text)} className="grid h-5 w-5 place-items-center rounded text-current/70 hover:text-current" aria-label="Copiar" title="Copiar">
                    {copiedId === msg.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </button>
                  {msg.role === "assistant" && (
                    <button type="button" onClick={() => toggleSpeak(msg.id, msg.text)} className="grid h-5 w-5 place-items-center rounded text-current/70 hover:text-current" aria-label="Ouvir" title="Ouvir">
                      {speakingId === msg.id ? <Square className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {streamingText !== null && (
            <div className="mb-4 flex justify-start">
              <div className="max-w-[80%] rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-primary">
                {streamingText ? <Markdown text={streamingText} /> : (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> {o.eyebrow}…
                  </span>
                )}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>

        <div className="border-t border-border pt-3">
          <div className="mb-2 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{PROVIDER_LABELS[settings.provider]} · {settings.model.trim() || DEFAULT_MODELS[settings.provider]}</span>
            <span className="num" title={`${usedTokens} tokens (estimado)`}>
              {contextPct}% contexto · {usedTokens.toLocaleString()} tokens (estimado)
            </span>
          </div>
          <div className="flex items-end gap-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={o.placeholder}
              rows={2}
              className="flex-1 resize-none rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-primary outline-none ring-0 transition-colors focus:border-secondary/50 focus:ring-1 focus:ring-secondary/25"
            />
            {loading ? (
              <Button size="icon" variant="outline" onClick={stopGenerating} aria-label="Parar">
                <Square className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button size="icon" onClick={handleSend} disabled={!draft.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="ml-3 mt-1 hidden h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent/10 lg:grid"
        title={sidebarOpen ? "Fechar painel" : "Abrir painel"}
      >
        <LayoutDashboard className={cn("h-4 w-4 transition-transform", sidebarOpen && "rotate-180")} />
      </button>

      {sidebarOpen && (
        <aside className="ml-4 hidden w-72 shrink-0 flex-col gap-4 lg:flex">
          <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
            {(["overview", "digest", "history"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSidebarTab(tab)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors",
                  sidebarTab === tab
                    ? "bg-surface-raised text-primary shadow-sm"
                    : "text-muted-foreground hover:text-primary",
                )}
              >
                {tab === "overview" && <LayoutDashboard className="h-3 w-3" />}
                {tab === "digest" && <Sparkles className="h-3 w-3" />}
                {tab === "history" && <History className="h-3 w-3" />}
                {tab === "overview" && "Visão geral"}
                {tab === "digest" && "Resumo"}
                {tab === "history" && "Histórico"}
              </button>
            ))}
          </div>

          <ScrollArea className="flex-1">
            {sidebarTab === "overview" && <OracleOverview />}
            {sidebarTab === "digest" && <OracleDigest />}
            {sidebarTab === "history" && <OracleHistory />}
          </ScrollArea>
        </aside>
      )}
    </div>
  );
}
