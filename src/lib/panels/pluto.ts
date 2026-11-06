/** Pluto's central piece: the month's balance, with the budgets that are
 *  actually under pressure and the transactions that moved last. */

import { asArray, num, str, type BalancePanel, type BudgetLine, type TxItem } from "./types";

function currentMonth(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function txType(value: unknown): TxItem["type"] {
  const t = str(value);
  return t === "income" || t === "transfer" ? t : "expense";
}

export function parseBalance(raw: Record<string, unknown> | null, recentLimit = 6): BalancePanel | null {
  if (!raw) return null;
  try {
    if (!Array.isArray(raw.transactions)) return null;
    const month = currentMonth();
    const transactions = asArray(raw.transactions);
    const categories = new Map(
      asArray(raw.categories).map((c) => [str(c.id), { name: str(c.name, "Categoria"), color: str(c.color) }]),
    );

    const monthTx = transactions.filter((t) => str(t.date).startsWith(month));

    const incomeCents = monthTx
      .filter((t) => txType(t.type) === "income")
      .reduce((sum, t) => sum + num(t.amountCents), 0);
    const expenseCents = monthTx
      .filter((t) => txType(t.type) === "expense")
      .reduce((sum, t) => sum + num(t.amountCents), 0);

    const budgets: BudgetLine[] = asArray(raw.budgets)
      .map((b, i) => {
        const categoryId = str(b.categoryId);
        const category = categories.get(categoryId);
        const limitCents = num(b.monthCents);
        const spentCents = monthTx
          .filter((t) => str(t.categoryId) === categoryId && txType(t.type) === "expense")
          .reduce((sum, t) => sum + num(t.amountCents), 0);
        return {
          id: str(b.id, `budget-${i}`),
          name: category?.name ?? str(b.name, "Orçamento"),
          spentCents,
          limitCents,
          ratio: limitCents > 0 ? spentCents / limitCents : 0,
          color: category?.color || undefined,
        };
      })
      // Pressure first: an overrun the user cannot see is a budget that failed.
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 4);

    const recent: TxItem[] = [...transactions]
      .sort((a, b) => str(b.date).localeCompare(str(a.date)))
      .slice(0, recentLimit)
      .map((t, i) => {
        const category = categories.get(str(t.categoryId));
        return {
          id: str(t.id, `tx-${i}`),
          title: str(t.description) || str(t.title) || category?.name || "Lançamento",
          amountCents: num(t.amountCents),
          type: txType(t.type),
          date: str(t.date),
          category: category?.name,
          color: category?.color || undefined,
        };
      });

    return {
      kind: "balance",
      incomeCents,
      expenseCents,
      netCents: incomeCents - expenseCents,
      budgets,
      recent,
      currency: str((raw.meta as Record<string, unknown>)?.currency) || "BRL",
    };
  } catch {
    return null;
  }
}

export function plutoDocs(raw: Record<string, unknown> | null) {
  if (!raw) return [];
  const transactions = asArray(raw.transactions);
  const contributions = asArray(raw.contributions);

  const wallets = asArray(raw.wallets).map((w) => {
    const id = str(w.id);
    const count = transactions.filter((t) => str(t.walletId) === id).length;
    return {
      id,
      title: str(w.name, "Carteira"),
      kind: "wallet" as const,
      meta: `${count} lançamentos`,
      updatedAt: str(w.updatedAt) || str(w.createdAt) || null,
    };
  });

  const goals = asArray(raw.goals)
    .filter((g) => !g.archivedAt)
    .map((g) => {
      const id = str(g.id);
      const target = num(g.targetCents);
      const saved = contributions
        .filter((c) => str(c.goalId) === id)
        .reduce((sum, c) => sum + num(c.amountCents), 0);
      return {
        id,
        title: str(g.name, "Meta"),
        kind: "goal" as const,
        meta: target > 0 ? `${Math.round((saved / target) * 100)}% da meta` : "sem alvo",
        updatedAt: str(g.updatedAt) || str(g.createdAt) || null,
      };
    });

  return [...wallets, ...goals];
}
