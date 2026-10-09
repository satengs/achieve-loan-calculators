export type BudgetCategory = "needs" | "wants" | "savings";

export type BudgetLine = { key: string; amount: number; category: BudgetCategory };

/** Monthly budget summary plus 50/30/20-style comparison (targets configurable). */
export function budgetSummary(
  income: number[],
  lines: BudgetLine[],
  targets: Record<BudgetCategory, number> = { needs: 50, wants: 30, savings: 20 },
) {
  if (!income.every((n) => Number.isFinite(n) && n >= 0)) return null;
  if (!lines.every((l) => Number.isFinite(l.amount) && l.amount >= 0)) return null;
  const totalIncome = income.reduce((s, n) => s + n, 0);
  const byCat: Record<BudgetCategory, number> = { needs: 0, wants: 0, savings: 0 };
  for (const l of lines) byCat[l.category] += l.amount;
  const totalOutflow = byCat.needs + byCat.wants + byCat.savings;
  const leftover = totalIncome - totalOutflow;
  const pct = (n: number) => (totalIncome > 0 ? (n / totalIncome) * 100 : NaN);
  return {
    totalIncome,
    totalOutflow,
    totalSpending: byCat.needs + byCat.wants,
    leftover,
    byCat,
    pctOfIncome: { needs: pct(byCat.needs), wants: pct(byCat.wants), savings: pct(byCat.savings) },
    targetAmounts: {
      needs: (totalIncome * targets.needs) / 100,
      wants: (totalIncome * targets.wants) / 100,
      savings: (totalIncome * targets.savings) / 100,
    },
    savingsRate: pct(byCat.savings + Math.max(0, leftover)),
  };
}
