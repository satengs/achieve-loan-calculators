/**
 * APR blind spot: what new spending on a revolving balance really costs once you
 * keep paying the same fixed monthly amount. An APR tells you the yearly rate, not
 * how many extra months or interest dollars a new purchase adds. Pure math, no DOM.
 */
import type { BalancePoint } from "./snowball";

export type FixedPaySchedule = {
  months: number;
  totalInterest: number;
  totalPaid: number;
  /** True when payment ≤ first month's interest, or the month cap was hit. */
  neverPaysOff: boolean;
  /** Month-end balance by month (month 0 = starting balance). */
  series: BalancePoint[];
};

export type NewSpendingInput = {
  /** Current balance before the new spending. */
  balance: number;
  /** New spending added to the balance today. */
  newSpending: number;
  /** Card APR in percent (e.g. 22 = 22%). */
  aprPct: number;
  /** Fixed monthly payment, unchanged after the new spending. */
  payment: number;
};

export type NewSpendingCost = {
  without: FixedPaySchedule;
  withSpending: FixedPaySchedule;
  /** Extra months the new spending adds at the same payment. */
  extraMonths: number;
  /** Extra interest the new spending adds at the same payment. */
  extraInterest: number;
  /** newSpending + extraInterest — what the purchase really costs. */
  trueCost: number;
  /** trueCost / newSpending (e.g. 1.32 = each $1 costs about $1.32). NaN when newSpending is 0. */
  costPerDollar: number;
  /** Monthly payment that would pay balance + newSpending off in the original payoff time. */
  paymentToKeepDate: number;
  /** First month's interest on balance + newSpending (the payment must exceed this). */
  firstMonthInterest: number;
};

const finite = (...n: number[]) => n.every(Number.isFinite);

/**
 * Month-by-month payoff at a fixed payment: each month
 * `interest = balance × APR/100/12`, then `balance = balance + interest − min(payment, balance + interest)`.
 * Returns null on invalid input (negative or non-finite numbers).
 */
export function fixedPaymentSchedule(
  balance: number,
  aprPct: number,
  payment: number,
  maxMonths = 1200,
): FixedPaySchedule | null {
  if (!finite(balance, aprPct, payment) || balance < 0 || aprPct < 0 || payment < 0) return null;
  const series: BalancePoint[] = [{ month: 0, total: balance }];
  if (balance <= 0.005) return { months: 0, totalInterest: 0, totalPaid: 0, neverPaysOff: false, series };
  const r = aprPct / 100 / 12;
  if (payment <= 0 || payment <= balance * r + 1e-9) {
    return { months: 0, totalInterest: 0, totalPaid: 0, neverPaysOff: true, series };
  }
  let bal = balance;
  let months = 0;
  let totalInterest = 0;
  let totalPaid = 0;
  while (bal > 0.005 && months < maxMonths) {
    const interest = bal * r;
    const pay = Math.min(payment, bal + interest);
    bal = bal + interest - pay;
    totalInterest += interest;
    totalPaid += pay;
    months++;
    series.push({ month: months, total: Math.max(0, bal) });
  }
  return { months, totalInterest, totalPaid, neverPaysOff: bal > 0.005, series };
}

/**
 * Level payment that retires `principal` in `n` months at `aprPct`:
 * `P = B × r / (1 − (1 + r)^−n)`, or `B / n` when the rate is 0.
 */
export function levelPayment(principal: number, aprPct: number, n: number): number {
  if (!finite(principal, aprPct, n) || principal < 0 || aprPct < 0 || n < 1) return NaN;
  if (principal === 0) return 0;
  const r = aprPct / 100 / 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

/**
 * Compare paying off `balance` vs `balance + newSpending` at the same APR and payment.
 * Returns null on invalid input. Either schedule may be `neverPaysOff`; deltas are then NaN.
 */
export function newSpendingCost(input: NewSpendingInput, maxMonths = 1200): NewSpendingCost | null {
  const { balance, newSpending, aprPct, payment } = input;
  if (!finite(newSpending) || newSpending < 0) return null;
  const without = fixedPaymentSchedule(balance, aprPct, payment, maxMonths);
  const withSpending = fixedPaymentSchedule(balance + newSpending, aprPct, payment, maxMonths);
  if (!without || !withSpending) return null;
  const firstMonthInterest = (balance + newSpending) * (aprPct / 100 / 12);
  const ok = !without.neverPaysOff && !withSpending.neverPaysOff;
  const extraInterest = ok ? withSpending.totalInterest - without.totalInterest : NaN;
  const trueCost = ok ? newSpending + extraInterest : NaN;
  const paymentToKeepDate =
    !without.neverPaysOff && without.months > 0 ? levelPayment(balance + newSpending, aprPct, without.months) : NaN;
  return {
    without,
    withSpending,
    extraMonths: ok ? withSpending.months - without.months : NaN,
    extraInterest,
    trueCost,
    costPerDollar: ok && newSpending > 0 ? trueCost / newSpending : NaN,
    paymentToKeepDate,
    firstMonthInterest,
  };
}
