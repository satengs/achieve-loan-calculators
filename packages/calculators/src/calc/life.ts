export type LifeEstimateInput = {
  annualIncome: number;
  yearsIncomeReplace: number;
  totalDebts: number;
  finalExpenses: number;
  educationFund: number;
  existingCoverage: number;
  liquidAssets: number;
};

export function lifeCoverageEstimate(input: LifeEstimateInput) {
  const incomeNeed = Math.max(0, input.annualIncome || 0) * Math.max(0, input.yearsIncomeReplace || 0);
  const debts = Math.max(0, input.totalDebts || 0);
  const finals = Math.max(0, input.finalExpenses || 0);
  const education = Math.max(0, input.educationFund || 0);
  const existing = Math.max(0, input.existingCoverage || 0);
  const assets = Math.max(0, input.liquidAssets || 0);
  const grossNeed = incomeNeed + debts + finals + education;
  const netNeed = Math.max(0, grossNeed - existing - assets);
  return { incomeNeed, debts, finals, education, existing, assets, grossNeed, netNeed };
}

/**
 * Illustrative annual premium = coverage × rate per $1,000 / 1,000 (the common template
 * premium = coverage × premium rate / 100, expressed here per $1,000 to keep rates readable).
 */
export function lifePremiumEstimate(coverage: number, ratePerThousand: number) {
  if (!Number.isFinite(coverage) || !Number.isFinite(ratePerThousand) || coverage < 0 || ratePerThousand < 0) return null;
  const annual = (coverage / 1000) * ratePerThousand;
  return { annual, monthly: annual / 12 };
}

/**
 * Term-length multiplier from a sparse table (e.g. {10: 0.85, 20: 1, 30: 1.45}).
 * Terms between table points are linearly interpolated (15 yr → midway between 10 and 20);
 * terms outside the table clamp to the nearest end. Empty/invalid table → 1.
 * (Previously any term not in the table silently used ×1, e.g. 25 yr priced like 20 yr.)
 */
export function termMultiplierFor(termYears: number, table: Record<string, number> | undefined): number {
  const points = Object.entries(table || {})
    .map(([k, v]) => [Number(k), Number(v)] as const)
    .filter(([k, v]) => Number.isFinite(k) && Number.isFinite(v) && v > 0)
    .sort((a, b) => a[0] - b[0]);
  if (points.length === 0 || !Number.isFinite(termYears)) return 1;
  if (termYears <= points[0][0]) return points[0][1];
  const last = points[points.length - 1];
  if (termYears >= last[0]) return last[1];
  for (let i = 1; i < points.length; i++) {
    const [k1, v1] = points[i];
    if (termYears <= k1) {
      const [k0, v0] = points[i - 1];
      return v0 + ((termYears - k0) / (k1 - k0)) * (v1 - v0);
    }
  }
  return last[1];
}

export type LifePremiumRateTable = {
  premiumRatePer1000ByAge?: Record<string, number>;
  termMultiplier?: Record<string, number>;
  tobaccoMultiplier?: number;
};

/**
 * Illustrative rate per $1,000 of coverage: age-band rate × term multiplier × tobacco multiplier.
 * Returns null when the age band is not in the table (no silent ×1 default).
 */
export function lifePremiumRatePer1000(
  input: { ageBand: string; termYears: number; tobacco: boolean },
  table: LifePremiumRateTable,
): number | null {
  const base = Number(table.premiumRatePer1000ByAge?.[input.ageBand]);
  if (!Number.isFinite(base) || base < 0) return null;
  const tobacco = input.tobacco ? Number(table.tobaccoMultiplier ?? 1) : 1;
  if (!Number.isFinite(tobacco) || tobacco <= 0) return null;
  return base * termMultiplierFor(input.termYears, table.termMultiplier) * tobacco;
}
