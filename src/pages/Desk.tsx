import { Clock, ClockAlert, ClockArrowUp, Globe, GraduationCap, Library, Loader2, MessageSquare, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WidgetCard } from "@/components/WidgetCard";
import { EmptyPage } from "@/components/EmptyPage";
import { useAuth } from "@/lib/auth";
import { useDeskViews } from "@/lib/views/store";
import { useT } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("num text-sm font-medium", highlight ? "text-destructive" : "text-primary")}>{value}</span>
    </div>
  );
}

export default function Desk() {
  const { isCloud } = useAuth();
  const { views, loading } = useDeskViews();
  const t = useT();
  const d = t.olympus.desk;

  if (!isCloud) {
    return (
      <div>
        <div className="mb-8">
          <p className="mb-1 text-xs uppercase tracking-[0.3em] text-secondary">{d.eyebrow}</p>
          <h1 className="font-display text-2xl text-primary">{d.title}</h1>
        </div>
        <EmptyPage
          icon={<Globe className="h-12 w-12" />}
          title={d.empty}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-secondary" />
      </div>
    );
  }

  const chronos = views.chronos;
  const kairos = views.kairos;
  const pluto = views.pluto;
  const hermes = views.hermes;
  const chiron = views.chiron;

  return (
    <div>
      <div className="mb-8">
        <p className="mb-1 text-xs uppercase tracking-[0.3em] text-secondary">{d.eyebrow}</p>
        <h1 className="font-display text-2xl text-primary">{d.title}</h1>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <WidgetCard icon={<Clock className="h-4 w-4" />} label={d.chronosWidget} color="#0E2A47">
          {chronos ? (
            <div className="flex flex-col gap-2">
              <Stat label={d.chronosWidget} value={chronos.currentBlock || "—"} />
              <Stat label="Próximo" value={chronos.nextBlock || "—"} />
              <Stat label="Horas restantes" value={`${chronos.remainingFocusHours}h`} />
              <Stat label="Blocos hoje" value={`${chronos.completedBlocksToday}/${chronos.totalBlocksToday}`} />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{d.chronosEmpty}</p>
          )}
        </WidgetCard>

        <WidgetCard icon={<GraduationCap className="h-4 w-4" />} label={d.kairosWidget} color="#7D4E8C">
          {kairos ? (
            <div className="flex flex-col gap-2">
              <Stat label="Projetos" value={kairos.totalProjects} />
              <Stat label="Fazendo" value={kairos.doing} />
              <Stat label="Vence hoje" value={kairos.dueToday} highlight={kairos.dueToday > 0} />
              <Stat label="Atrasadas" value={kairos.overdue} highlight={kairos.overdue > 0} />
              <Stat label="Feitas hoje" value={kairos.doneToday} />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{d.kairosEmpty}</p>
          )}
        </WidgetCard>

        <WidgetCard icon={<Wallet className="h-4 w-4" />} label={d.plutoWidget} color="#183427">
          {pluto ? (
            <div className="flex flex-col gap-2">
              <Stat label="Carteiras" value={pluto.walletCount} />
              <Stat label="Receita mensal" value={`R$ ${(pluto.incomeMonthCents / 100).toFixed(2)}`} />
              <Stat label="Despesas mensais" value={`R$ ${(pluto.expenseMonthCents / 100).toFixed(2)}`} />
              <Stat label="Orçamentos estourados" value={pluto.budgetAlertCount} highlight={pluto.budgetAlertCount > 0} />
              <Stat label="Metas" value={pluto.goalProgressCount} />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{d.plutoEmpty}</p>
          )}
        </WidgetCard>

        <WidgetCard icon={<MessageSquare className="h-4 w-4" />} label={d.hermesWidget} color="#3EB8CC">
          {hermes ? (
            <div className="flex flex-col gap-2">
              <Stat label="Pendentes" value={hermes.pendingCount} highlight={hermes.pendingCount > 0} />
              <Stat label="Com falha" value={hermes.failedCount} highlight={hermes.failedCount > 0} />
              <Stat label="Enviadas hoje" value={hermes.sentToday} />
              <Stat label="Último envio" value={hermes.lastDeliveryAt ? new Date(hermes.lastDeliveryAt).toLocaleString() : "—"} />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{d.hermesEmpty}</p>
          )}
        </WidgetCard>

        <WidgetCard icon={<Sparkles className="h-4 w-4" />} label={d.chironWidget} color="#A63446">
          {chiron ? (
            <div className="flex flex-col gap-2">
              <Stat label="Fontes" value={chiron.totalSources} />
              <Stat label="Nós no mapa" value={chiron.totalNodes} />
              <Stat label="Revisões pendentes" value={chiron.dueCards} highlight={chiron.dueCards > 0} />
              <Stat label="Sequência" value={`${chiron.streak} dias`} />
              <Stat label="Pontos" value={chiron.totalPoints} />
              <Stat label="Sessões" value={chiron.totalSessions} />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{d.chironEmpty}</p>
          )}
        </WidgetCard>

        <WidgetCard icon={<Sparkles className="h-4 w-4" />} label={d.oracleTeaser} color="#C9B99A">
          <p className="text-xs text-muted-foreground mb-3">
            Faça perguntas sobre todos os seus dados da suíte em uma conversa.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href="/oracle">{d.oracleTeaser}</a>
          </Button>
        </WidgetCard>
      </div>
    </div>
  );
}
