import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Check, Copy, History, LayoutDashboard, MessageSquarePlus, PanelRightClose,
  Sparkles, Square, Trash2, Volume2,
} from "lucide-react";
import Markdown from "@/components/Markdown";
import { Composer } from "@/components/chat/Composer";
import { ThinkingState } from "@/components/chat/ThinkingState";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useHub, useI18n } from "@/lib/i18n/I18nProvider";
import { usePrefs } from "@/lib/prefs/store";
import { cn } from "@/lib/utils";
import { streamChat, type ChatMessage } from "@/lib/ai/providers";
import { loadAiSettings, saveAiSettings, type AiProvider, type AiSettings } from "@/lib/ai/settings";
import { readAttachment, withAttachments, type FileAttachment } from "@/lib/ai/attachments";
import { claimAttachments } from "@/lib/ai/pendingAttachments";
import {
  deriveTitle, loadSessions, newSession, saveSessions, type ChatSession,
} from "@/lib/ai/chatSessions";
import { refreshContext } from "@/lib/ai/context";
import { buildPanels } from "@/lib/panels";
import { appById, alpha, SUITE_APPS } from "@/lib/suite/registry";
import { estimateTokens, record } from "@/lib/usage/store";
import { speak, stop as stopSpeaking } from "@/lib/speech/tts";
import { LOCALE_LABELS } from "@/lib/i18n/dictionaries";

/** Same shared floor as the siblings' Aetheris meters. */
const CONTEXT_BUDGET_TOKENS = 32_000;

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ── Right sidebar ─────────────────────────────────────────────────────────── */

function DomainRows() {
  const panels = useMemo(() => buildPanels(), []);
  return (
    <div className="flex flex-col gap-2">
      {SUITE_APPS.map((app) => {
        const panel = panels.get(app.panelId);
        return (
          <div
            key={app.id}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface-raised p-2.5"
            style={{ borderColor: alpha(app.color, "border") }}
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: app.color }} />
            <span className="min-w-0 flex-1 truncate text-xs text-primary">{app.name}</span>
            <span className="num shrink-0 text-[11px] text-muted-foreground">
              {panel?.headline ?? "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DigestCards() {
  const panels = useMemo(() => buildPanels(), []);
  const cards: { app: string; color: string; text: string }[] = [];

  const day = panels.get("chronos-dayplanner");
  if (day?.body.kind === "dayplanner") {
    const dayplanner = day.body;
    const current = dayplanner.blocks.find((b) => b.id === dayplanner.currentId);
    cards.push({
      app: "Chronos",
      color: appById("chronos").color,
      text: current
        ? `Agora: ${current.title} (até ${current.end}) · ${dayplanner.remainingFocusHours}h restantes`
        : `Nenhum bloco ativo · ${dayplanner.remainingFocusHours}h restantes`,
    });
  }
  const now = panels.get("kairos-now");
  if (now?.body.kind === "now") {
    cards.push({
      app: "Kairos",
      color: appById("kairos").color,
      text: `${now.body.overdue} atrasadas · ${now.body.dueToday} para hoje · ${now.body.doing} em andamento`,
    });
  }
  const balance = panels.get("pluto-balance");
  if (balance?.body.kind === "balance") {
    const over = balance.body.budgets.filter((b) => b.ratio > 1).length;
    cards.push({
      app: "Pluto",
      color: appById("pluto").color,
      text: `Saldo R$ ${(balance.body.netCents / 100).toFixed(2)}${over > 0 ? ` · ${over} orçamento(s) estourado(s)` : ""}`,
    });
  }
  const outbox = panels.get("hermes-outbox");
  if (outbox?.body.kind === "outbox") {
    cards.push({
      app: "Hermes",
      color: appById("hermes").color,
      text: `${outbox.body.pending} na fila · ${outbox.body.failed} falhas · ${outbox.body.sentToday} hoje`,
    });
  }
  const review = panels.get("chiron-review");
  if (review?.body.kind === "review") {
    cards.push({
      app: "Chiron",
      color: appById("chiron").color,
      text: `${review.body.dueTotal} revisões · sequência de ${review.body.streak} dias`,
    });
  }

  return (
    <div className="flex flex-col gap-2.5">
      {cards.map((card) => (
        <div key={card.app} className="rounded-lg border border-border bg-surface-raised p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: card.color }} />
            <span className="text-xs font-medium text-primary">{card.app}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{card.text}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────────── */

export default function Chat() {
  const h = useHub();
  const { locale } = useI18n();
  const { prefs } = usePrefs();

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const stored = loadSessions();
    return stored.length > 0 ? stored : [newSession()];
  });
  const [activeId, setActiveId] = useState(() => sessions[0].id);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<AiSettings>(loadAiSettings);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"overview" | "digest" | "history">("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessionsOpen, setSessionsOpen] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const active = sessions.find((s) => s.id === activeId) ?? sessions[0];

  useEffect(() => { saveSessions(sessions); }, [sessions]);

  // The command palette hands a query over as ?q= — take it once, then strip
  // it, so a reload does not re-fill a draft the user already sent.
  useEffect(() => {
    const q = searchParams.get("q");
    if (!q) return;
    setDraft(q);
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  // Files dropped on another page are waiting for a composer to land in.
  useEffect(() => {
    const claimed = claimAttachments();
    if (claimed.length > 0) setAttachments((prev) => [...prev, ...claimed]);
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [active.messages, streamingText]);
  useEffect(() => () => stopSpeaking(), []);

  const systemPrompt = useMemo(() => refreshContext(), [active.messages.length, activeId]);

  const usedTokens = useMemo(() => {
    const convo = active.messages.map((m) => m.content).join("\n") + (streamingText ?? "") + draft;
    return estimateTokens(systemPrompt) + estimateTokens(convo);
  }, [systemPrompt, active.messages, streamingText, draft]);
  const contextPct = Math.min(100, Math.round((usedTokens / CONTEXT_BUDGET_TOKENS) * 100));

  const patchSession = useCallback((id: string, patch: (s: ChatSession) => ChatSession) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? patch(s) : s)));
  }, []);

  const createSession = () => {
    const session = newSession();
    setSessions((prev) => [session, ...prev]);
    setActiveId(session.id);
    setDraft("");
    setAttachments([]);
    record({ chats: 1 });
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      const list = next.length > 0 ? next : [newSession()];
      if (id === activeId) setActiveId(list[0].id);
      return list;
    });
  };

  const attachFiles = async (files: FileList) => {
    for (const file of Array.from(files)) {
      const result = await readAttachment(file);
      if ("error" in result) continue;
      setAttachments((prev) => [...prev, result]);
    }
  };

  const speakMessage = (id: string, text: string) => {
    if (speakingId === id) {
      stopSpeaking();
      setSpeakingId(null);
      return;
    }
    setSpeakingId(id);
    speak(text, {
      ...(prefs.speech ?? {}),
      lang: LOCALE_LABELS[locale].bcp47,
      onEnd: () => setSpeakingId(null),
    });
  };

  const copyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500);
    } catch { /* clipboard unavailable */ }
  };

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || loading) return;

    const sessionId = active.id;
    const outgoing = withAttachments(text, attachments);
    setDraft("");
    setAttachments([]);

    const history = [...active.messages, { role: "user" as const, content: text }];
    patchSession(sessionId, (s) => ({
      ...s,
      title: s.title || deriveTitle(text),
      messages: history,
    }));

    setLoading(true);
    setStreamingText("");
    record({ messages: 1, tokens: estimateTokens(outgoing) });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const payload: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...active.messages.map((m) => ({ role: m.role, content: m.content }) as ChatMessage),
        { role: "user", content: outgoing },
      ];

      let full = "";
      await streamChat(settings, payload, (delta) => {
        full += delta;
        setStreamingText(full);
      }, controller.signal);

      patchSession(sessionId, (s) => ({ ...s, messages: [...s.messages, { role: "assistant", content: full }] }));
      record({ tokens: estimateTokens(full) });
      if (prefs.speech?.autoSpeak) {
        speak(full, { ...(prefs.speech ?? {}), lang: LOCALE_LABELS[locale].bcp47 });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : h.chat.errorPrefix;
      patchSession(sessionId, (s) => ({
        ...s,
        messages: [...s.messages, { role: "assistant", content: `${h.chat.errorPrefix}: ${message}` }],
      }));
    } finally {
      setStreamingText(null);
      setLoading(false);
      abortRef.current = null;
    }
  }, [draft, loading, active, attachments, systemPrompt, settings, patchSession, prefs.speech, locale, h.chat.errorPrefix]);

  const changeProvider = (provider: AiProvider) => {
    const next = { ...settings, provider, model: "" };
    setSettings(next);
    saveAiSettings(next);
  };

  const named = sessions.filter((s) => s.messages.length > 0);

  return (
    <div className="flex h-full min-h-0 gap-3">
      {/* Sessions rail */}
      {sessionsOpen && (
        <aside className="hidden w-56 shrink-0 flex-col gap-2 md:flex">
          <button
            type="button"
            onClick={createSession}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-primary transition-colors hover:border-secondary"
          >
            <MessageSquarePlus className="h-3.5 w-3.5 text-secondary" />
            {h.chat.newSession}
          </button>
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-0.5 pr-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "group flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors",
                    session.id === activeId
                      ? "bg-surface-veil text-primary"
                      : "text-muted-foreground hover:bg-surface-veil/60 hover:text-primary",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setActiveId(session.id)}
                    className="min-w-0 flex-1 truncate text-left"
                  >
                    {session.title || h.chat.untitled}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSession(session.id)}
                    aria-label={h.chat.deleteSession}
                    title={h.chat.deleteSession}
                    className="shrink-0 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>
      )}

      {/* Conversation */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-1 text-xs uppercase tracking-[0.3em] text-secondary">{h.chat.eyebrow}</p>
            <h1 className="font-display text-xl text-primary">{active.title || h.chat.title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setSessionsOpen(!sessionsOpen)}
              title={h.chat.toggleSessions}
              aria-label={h.chat.toggleSessions}
              className="hidden h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-primary md:grid"
            >
              <MessageSquarePlus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={h.chat.togglePanel}
              aria-label={h.chat.togglePanel}
              className="hidden h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-primary lg:grid"
            >
              <PanelRightClose className={cn("h-4 w-4 transition-transform", !sidebarOpen && "rotate-180")} />
            </button>
          </div>
        </div>

        <ScrollArea className="flex-1 pr-3">
          <div className="mx-auto max-w-3xl">
            {active.messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-14">
                <Sparkles className="mb-4 h-9 w-9 text-secondary/40" />
                <p className="text-sm text-primary">{h.chat.empty}</p>
                <p className="mb-6 mt-1 text-xs text-muted-foreground">{h.chat.emptyHint}</p>
                <div className="grid w-full gap-2 sm:grid-cols-2">
                  {h.chat.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setDraft(suggestion)}
                      className="rounded-lg border border-border bg-card px-3 py-2.5 text-left text-xs text-muted-foreground transition-colors hover:border-secondary hover:text-primary"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {active.messages.map((msg, i) => {
              const id = `${active.id}-${i}`;
              return (
                <div key={id} className={cn("group mb-4 flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-gilt text-primary-deep"
                        : "border border-border bg-card text-primary",
                    )}
                  >
                    {msg.role === "assistant" ? <Markdown text={msg.content} /> : <div>{msg.content}</div>}
                    <div className="mt-1 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => copyMessage(id, msg.content)}
                        aria-label={h.chat.copy}
                        title={copiedId === id ? h.chat.copied : h.chat.copy}
                        className="grid h-5 w-5 place-items-center rounded text-current/70 hover:text-current"
                      >
                        {copiedId === id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </button>
                      {msg.role === "assistant" && (
                        <button
                          type="button"
                          onClick={() => speakMessage(id, msg.content)}
                          aria-label={h.chat.speak}
                          title={speakingId === id ? h.chat.stopSpeaking : h.chat.speak}
                          className="grid h-5 w-5 place-items-center rounded text-current/70 hover:text-current"
                        >
                          {speakingId === id ? <Square className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {streamingText !== null && (
              <div className="mb-4 flex justify-start">
                <div className="max-w-[85%] rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-primary">
                  {streamingText ? (
                    <Markdown text={streamingText} />
                  ) : (
                    <ThinkingState stages={h.chat.thinking} />
                  )}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </ScrollArea>

        <div className="mx-auto mt-3 w-full max-w-3xl">
          <Composer
            value={draft}
            onChange={setDraft}
            onSubmit={send}
            onStop={() => abortRef.current?.abort()}
            loading={loading}
            settings={settings}
            onProviderChange={changeProvider}
            attachments={attachments}
            onAttach={attachFiles}
            onRemoveAttachment={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
            placeholder={h.chat.placeholder}
            lang={LOCALE_LABELS[locale].bcp47}
            meter={`${contextPct}% ${h.chat.context} · ${usedTokens.toLocaleString()} ${h.chat.tokensEstimated}`}
            labels={{
              attach: h.chat.attach,
              attachHint: h.chat.attachHint,
              send: h.chat.send,
              stop: h.chat.stop,
              model: h.chat.model,
              dictate: h.chat.dictate,
              dictateStop: h.chat.dictateStop,
              listening: h.chat.listening,
            }}
          />
        </div>
      </div>

      {/* Domain sidebar */}
      {sidebarOpen && (
        <aside className="hidden w-72 shrink-0 flex-col gap-3 lg:flex">
          <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
            {([
              ["overview", LayoutDashboard, h.chat.sidebarOverview],
              ["digest", Sparkles, h.chat.sidebarDigest],
              ["history", History, h.chat.sidebarHistory],
            ] as const).map(([tab, Icon, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSidebarTab(tab)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1 rounded-md px-1.5 py-1.5 text-[11px] font-medium transition-colors",
                  sidebarTab === tab
                    ? "bg-surface-raised text-primary shadow-sm"
                    : "text-muted-foreground hover:text-primary",
                )}
              >
                <Icon className="h-3 w-3" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>

          <ScrollArea className="flex-1">
            <div className="pr-2">
              {sidebarTab === "overview" && (
                <>
                  <p className="mb-2 text-[11px] text-muted-foreground">{h.chat.overviewLead}</p>
                  <DomainRows />
                </>
              )}
              {sidebarTab === "digest" && (
                <>
                  <p className="mb-2 text-[11px] text-muted-foreground">{h.chat.digestLead}</p>
                  <DigestCards />
                </>
              )}
              {sidebarTab === "history" && (
                named.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">{h.chat.historyEmpty}</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {named.map((session) => (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => setActiveId(session.id)}
                        className="rounded-lg border border-border bg-surface-raised p-2.5 text-left transition-colors hover:border-secondary"
                      >
                        <div className="truncate text-xs text-primary">{session.title || h.chat.untitled}</div>
                        <div className="num text-[10px] text-muted-foreground">
                          {session.messages.length} · {new Date(session.createdAt).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>
          </ScrollArea>
        </aside>
      )}
    </div>
  );
}
