import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, Circle, Clock, Flame, Mail, MessageCircle, Send } from "lucide-react";
import { MeterBar } from "@/components/data/StatTile";
import { alpha } from "@/lib/suite/registry";
import type {
  BalancePanel, DayplannerPanel, NowPanel, OutboxPanel, PanelBody, ReviewPanel,
} from "@/lib/panels";
import { cn } from "@/lib/utils";

function Empty({ children }: { children: string }) {
  return <p className="px-4 py-6 text-center text-xs text-muted-foreground">{children}</p>;
}

function money(cents: number, currency = "BRL"): string {
  const symbol = currency === "BRL" ? "R$" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "";
  return `${symbol} ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ── Chronos — the day planner ─────────────────────────────────────────────── */

function Dayplanner({ body, color }: { body: DayplannerPanel; color: string }) {
  if (body.blocks.length === 0) return <Empty>Nenhum bloco para hoje.</Empty>;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2 text-[11px] text-muted-foreground">
        <span>{body.workdayStart}–{body.workdayEnd}</span>
        <span className="num">{body.remainingFocusHours}h restantes</span>
      </div>
      <ul className="flex flex-col">
        {body.blocks.map((block) => {
          const isCurrent = block.state === "current";
          return (
            <li
              key={block.id}
              className={cn(
                "flex items-center gap-3 border-b border-border/40 px-4 py-2.5 last:border-0 transition-colors",
                block.state === "past" && "opacity-45",
                isCurrent && "bg-secondary/[0.07]",
              )}
            >
              <span className="num w-[42px] shrink-0 text-[11px] text-muted-foreground">{block.start}</span>
              <span
                className="h-8 w-[3px] shrink-0 rounded-full"
                style={{ background: isCurrent ? (block.color ?? color) : `${block.color ?? color}55` }}
              />
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate text-sm", isCurrent ? "font-medium text-primary" : "text-primary/85")}>
                  {block.title}
                </span>
                <span className="text-[10px] text-muted-foreground">{block.start} – {block.end}</span>
              </span>
              {block.done ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-secondary" />
              ) : isCurrent ? (
                <Clock className="h-3.5 w-3.5 shrink-0 animate-pulse" style={{ color }} />
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── Kairos — what is on the plate ─────────────────────────────────────────── */

const PRIORITY_DOT: Record<string, string> = {
  urgent: "hsl(var(--destructive))",
  high: "#C4703A",
  medium: "#B7863B",
  low: "#7C8B99",
  none: "hsl(var(--muted-foreground))",
};

function Now({ body, color }: { body: NowPanel; color: string }) {
  if (body.tasks.length === 0) return <Empty>Nada vencendo nem em andamento.</Empty>;

  return (
    <ul className="flex flex-col">
      {body.tasks.map((task) => (
        <li key={task.id} className="flex items-center gap-3 border-b border-border/40 px-4 py-2.5 last:border-0">
          <Circle className="h-3 w-3 shrink-0" style={{ color: PRIORITY_DOT[task.priority] ?? PRIORITY_DOT.none }} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-primary">{task.title}</span>
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              {task.project && (
                <span
                  className="rounded px-1 py-px"
                  style={{ background: alpha(task.projectColor ?? color), color: task.projectColor ?? color }}
                >
                  {task.project}
                </span>
              )}
              {task.status === "doing" && <span>em andamento</span>}
            </span>
          </span>
          {task.overdue ? (
            <span className="num shrink-0 text-[10px] font-medium text-destructive">{task.dueDate}</span>
          ) : task.dueToday ? (
            <span className="shrink-0 text-[10px] text-secondary">hoje</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/* ── Pluto — the month ─────────────────────────────────────────────────────── */

function Balance({ body }: { body: BalancePanel; color: string }) {
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-3 gap-px border-b border-border/60 bg-border/40">
        <div className="bg-card px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Receita</div>
          <div className="num mt-0.5 flex items-center gap-1 text-xs text-primary">
            <ArrowUpRight className="h-3 w-3 text-emerald-600" />{money(body.incomeCents, body.currency)}
          </div>
        </div>
        <div className="bg-card px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Despesa</div>
          <div className="num mt-0.5 flex items-center gap-1 text-xs text-primary">
            <ArrowDownRight className="h-3 w-3 text-destructive" />{money(body.expenseCents, body.currency)}
          </div>
        </div>
        <div className="bg-card px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Saldo</div>
          <div className={cn("num mt-0.5 text-xs font-medium", body.netCents >= 0 ? "text-emerald-600" : "text-destructive")}>
            {money(body.netCents, body.currency)}
          </div>
        </div>
      </div>

      {body.budgets.length > 0 && (
        <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-3">
          {body.budgets.map((budget) => (
            <MeterBar
              key={budget.id}
              label={budget.name}
              ratio={budget.ratio}
              right={`${money(budget.spentCents, body.currency)} / ${money(budget.limitCents, body.currency)}`}
              color={budget.color}
            />
          ))}
        </div>
      )}

      <ul className="flex flex-col">
        {body.recent.slice(0, 4).map((tx) => (
          <li key={tx.id} className="flex items-center gap-3 border-b border-border/40 px-4 py-2 last:border-0">
            <span className="num w-[42px] shrink-0 text-[10px] text-muted-foreground">{tx.date.slice(5)}</span>
            <span className="min-w-0 flex-1 truncate text-xs text-primary">{tx.title}</span>
            <span className={cn("num shrink-0 text-xs", tx.type === "income" ? "text-emerald-600" : "text-primary")}>
              {tx.type === "income" ? "+" : "−"}{money(tx.amountCents, body.currency)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Hermes — the queue ────────────────────────────────────────────────────── */

const CHANNEL_ICON: Record<string, typeof Mail> = {
  email: Mail,
  whatsapp: MessageCircle,
  telegram: Send,
};

function Outbox({ body, color }: { body: OutboxPanel; color: string }) {
  if (body.messages.length === 0) return <Empty>A fila está vazia.</Empty>;

  return (
    <ul className="flex flex-col">
      {body.messages.map((msg) => {
        const Icon = CHANNEL_ICON[msg.channel] ?? Mail;
        return (
          <li key={msg.id} className="flex items-center gap-3 border-b border-border/40 px-4 py-2.5 last:border-0">
            <Icon
              className="h-3.5 w-3.5 shrink-0"
              style={{ color: msg.status === "failed" ? "hsl(var(--destructive))" : color }}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-primary">{msg.subject}</span>
              <span className="text-[10px] text-muted-foreground">
                {msg.source} · {msg.channel}{msg.error ? ` · ${msg.error}` : ""}
              </span>
            </span>
            <span
              className={cn(
                "shrink-0 rounded-full px-1.5 py-px text-[9px] uppercase tracking-[0.14em]",
                msg.status === "failed" && "bg-destructive/10 text-destructive",
                msg.status === "pending" && "bg-secondary/15 text-secondary-foreground/70",
                msg.status === "sent" && "text-muted-foreground",
              )}
            >
              {msg.status === "failed" ? "falha" : msg.status === "pending" ? "fila" : "enviada"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/* ── Chiron — what is due ──────────────────────────────────────────────────── */

function Review({ body, color }: { body: ReviewPanel; color: string }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2 text-[11px]">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Flame className="h-3 w-3" style={{ color }} />
          <span className="num">{body.streak}</span> dias
        </span>
        <span className="num text-muted-foreground">{body.points} pontos</span>
      </div>
      {body.groups.length === 0 ? (
        <Empty>Nenhuma fonte de estudo ainda.</Empty>
      ) : (
        <ul className="flex flex-col">
          {body.groups.map((group) => (
            <li key={group.id} className="flex items-center gap-3 border-b border-border/40 px-4 py-2.5 last:border-0">
              <span className="min-w-0 flex-1 truncate text-sm text-primary">{group.title}</span>
              <span className="num shrink-0 text-[11px] text-muted-foreground">{group.total}</span>
              {group.due > 0 && (
                <span
                  className="num shrink-0 rounded-full px-1.5 py-px text-[10px] font-medium"
                  style={{ background: alpha(color), color }}
                >
                  {group.due} devidos
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {body.dueTotal > 0 && !body.studiedToday && (
        <div className="flex items-center gap-2 border-t border-border/60 px-4 py-2 text-[11px] text-muted-foreground">
          <AlertTriangle className="h-3 w-3 text-secondary" /> Você ainda não estudou hoje.
        </div>
      )}
    </div>
  );
}

export function PanelBodyView({ body, color }: { body: PanelBody; color: string }) {
  switch (body.kind) {
    case "dayplanner": return <Dayplanner body={body} color={color} />;
    case "now": return <Now body={body} color={color} />;
    case "balance": return <Balance body={body} color={color} />;
    case "outbox": return <Outbox body={body} color={color} />;
    case "review": return <Review body={body} color={color} />;
  }
}
