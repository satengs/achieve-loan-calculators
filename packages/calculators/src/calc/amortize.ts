import type { AmortResult, AmortRow } from "./types";

/** Standard amortizing monthly payment. */
export function monthlyPayment(
  principal: number,
  annualRatePct: number,
  termMonths: number,
): number {
  if (!Number.isFinite(principal) || !Number.isFinite(annualRatePct) || !Number.isFinite(termMonths)) {
    return NaN;
  }
  if (principal <= 0 || termMonths < 1 || annualRatePct < 0) return NaN;

  const n = Math.floor(termMonths);
  if (annualRatePct === 0) return principal / n;

  const r = annualRatePct / 100 / 12;
  const factor = Math.pow(1 + r, n);
  if (!Number.isFinite(factor) || factor === 1) return NaN;
  return ((r * factor) / (factor - 1)) * principal;
}

/** Build a monthly amortization schedule. */
export function amortize(
  principal: number,
  annualRatePct: number,
  termMonths: number,
): AmortResult | null {
  const payment = monthlyPayment(principal, annualRatePct, termMonths);
  if (!Number.isFinite(payment) || payment <= 0) return null;

  const n = Math.floor(termMonths);
  const r = annualRatePct === 0 ? 0 : annualRatePct / 100 / 12;
  let balance = principal;
  const schedule: AmortRow[] = [];
  let totalInterest = 0;

  for (let i = 1; i <= n; i++) {
    const interest = r * balance;
    let principalPortion = payment - interest;
    if (i === n || principalPortion > balance) {
      principalPortion = balance;
    }
    const actualPayment = principalPortion + interest;
    balance = Math.max(0, balance - principalPortion);
    totalInterest += interest;
    schedule.push({
      month: i,
      payment: actualPayment,
      principal: principalPortion,
      interest,
      balance,
    });
  }

  const totalPaid = schedule.reduce((s, row) => s + row.payment, 0);
  return {
    payment,
    schedule,
    totalInterest,
    totalPaid,
    firstPayment: schedule[0] ?? null,
    lastPayment: schedule[schedule.length - 1] ?? null,
  };
}

/** Interest-only monthly payment. */
export function interestOnlyMonthly(principal: number, annualRatePct: number): number {
  if (!Number.isFinite(principal) || !Number.isFinite(annualRatePct) || principal < 0 || annualRatePct < 0) {
    return NaN;
  }
  return principal * (annualRatePct / 100 / 12);
}

export function toMonths(value: number, unit: "months" | "years"): number {
  if (!Number.isFinite(value) || value <= 0) return NaN;
  return unit === "years" ? Math.round(value * 12) : Math.round(value);
}

export function roundCents(n: number): number {
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100) / 100;
}
