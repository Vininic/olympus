/** Read-only view model for Pluto ledger.
 *  Parses the "pluto-ledger" user_data row and extracts financial overview. */

export interface PlutoView {
  walletCount: number;
  totalBalanceCents: number;
  incomeMonthCents: number;
  expenseMonthCents: number;
  budgetAlertCount: number;
  goalProgressCount: number;
  goalsNearDone: number;
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function parsePluto(raw: Record<string, unknown>): PlutoView | null {
  try {
    const month = currentMonth();
    const transactions = raw.transactions as Record<string, unknown>[] | undefined;
    const wallets = raw.wallets as Record<string, unknown>[] | undefined;
    const budgets = raw.budgets as Record<string, unknown>[] | undefined;
    const goals = raw.goals as Record<string, unknown>[] | undefined;

    if (!transactions) return null;

    const monthTx = transactions.filter((t: any) => t.date && t.date.startsWith(month));

    const incomeMonthCents = monthTx
      .filter((t: any) => t.type === "income")
      .reduce((sum: number, t: any) => sum + (t.amountCents || 0), 0);

    const expenseMonthCents = monthTx
      .filter((t: any) => t.type === "expense")
      .reduce((sum: number, t: any) => sum + (t.amountCents || 0), 0);

    const budgetAlertCount = (budgets || []).filter((b: any) => {
      const catExpenses = monthTx
        .filter((t: any) => t.categoryId === b.categoryId && t.type === "expense")
        .reduce((sum: number, t: any) => sum + (t.amountCents || 0), 0);
      return catExpenses > (b.monthCents || 0);
    }).length;

    let goalsNearDone = 0;
    const goalProgressCount = (goals || []).filter((g: any) => {
      if (g.archivedAt) return false;
      const contributed = (raw.contributions as any[] || [])
        .filter((c: any) => c.goalId === g.id)
        .reduce((sum: number, c: any) => sum + (c.amountCents || 0), 0);
      const pct = g.targetCents ? contributed / g.targetCents : 0;
      if (pct >= 0.9 && pct < 1) goalsNearDone++;
      return true;
    }).length;

    return {
      walletCount: (wallets || []).length,
      totalBalanceCents: 0,
      incomeMonthCents,
      expenseMonthCents,
      budgetAlertCount,
      goalProgressCount,
      goalsNearDone,
    };
  } catch {
    return null;
  }
}
