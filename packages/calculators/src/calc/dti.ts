export type DtiBandId = "good" | "fair" | "high";

/** Debt-to-income ratio in percent. Income must be > 0. */
export function dtiRatio(monthlyGrossIncome: number, monthlyDebtPayments: number): number {
  if (!Number.isFinite(monthlyGrossIncome) || !Number.isFinite(monthlyDebtPayments)) return NaN;
  if (monthlyGrossIncome <= 0 || monthlyDebtPayments < 0) return NaN;
  return (monthlyDebtPayments / monthlyGrossIncome) * 100;
}

/** Classify DTI against [goodMax, fairMax] thresholds (e.g. [35, 43]). */
export function dtiBand(pct: number, goodMax: number, fairMax: number): DtiBandId | null {
  if (!Number.isFinite(pct)) return null;
  if (pct <= goodMax) return "good";
  if (pct <= fairMax) return "fair";
  return "high";
}

/** Estimated revolving minimum payment from a balance at a flat percent. */
export function estimatedCardMinimum(balance: number, minPct: number): number {
  if (!Number.isFinite(balance) || !Number.isFinite(minPct) || balance < 0 || minPct < 0) return NaN;
  return balance * (minPct / 100);
}
