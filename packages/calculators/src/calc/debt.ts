/** Revolving-debt payoff simulations (credit-card style). Pure math, no DOM. */

export type MinPaymentRule = {
  /** Percent of balance applied to principal each month (e.g. 1 = 1%). */
  principalPct: number;
  /** Minimum dollar floor for the payment (e.g. 35). */
  floor: number;
};

export type PayoffResult = {
  months: number;
  totalInterest: number;
  totalPaid: number;
  firstPayment: number;
  /** True when the simulation hit maxMonths before reaching zero. */
  capped: boolean;
};

const EMPTY: PayoffResult = { months: 0, totalInterest: 0, totalPaid: 0, firstPayment: 0, capped: false };

function invalid(balance: number, apr: number): boolean {
  return !Number.isFinite(balance) || !Number.isFinite(apr) || balance < 0 || apr < 0;
}

/**
 * Minimum-payment payoff: each month pay interest + principalPct of balance,
 * at least `floor`, never more than balance + interest. Payment declines as balance falls.
 */
export function simulateMinimumPayments(
  balance: number,
  aprPct: number,
  rule: MinPaymentRule,
  maxMonths = 1200,
): PayoffResult | null {
  if (invalid(balance, aprPct) || !Number.isFinite(rule.principalPct) || rule.principalPct <= 0) return null;
  if (balance === 0) return { ...EMPTY };
  const r = aprPct / 100 / 12;
  let bal = balance;
  let months = 0;
  let totalInterest = 0;
  let totalPaid = 0;
  let firstPayment = 0;
  while (bal > 0.005 && months < maxMonths) {
    const interest = bal * r;
    let pay = Math.max(interest + bal * (rule.principalPct / 100), rule.floor || 0);
    pay = Math.min(pay, bal + interest);
    if (months === 0) firstPayment = pay;
    bal = bal + interest - pay;
    totalInterest += interest;
    totalPaid += pay;
    months++;
  }
  return { months, totalInterest, totalPaid, firstPayment, capped: bal > 0.005 };
}

/** Fixed monthly payment payoff. Returns null if payment never covers interest. */
export function simulateFixedPayment(
  balance: number,
  aprPct: number,
  payment: number,
  maxMonths = 1200,
): PayoffResult | null {
  if (invalid(balance, aprPct) || !Number.isFinite(payment) || payment <= 0) return null;
  if (balance === 0) return { ...EMPTY };
  const r = aprPct / 100 / 12;
  if (payment <= balance * r) return null;
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
  }
  return { months, totalInterest, totalPaid, firstPayment: Math.min(payment, balance * (1 + r)), capped: bal > 0.005 };
}

export type ProgramAssumptions = {
  /** Total program cost (settlements + fees) as percent of enrolled debt. Illustrative. */
  totalCostPct: number;
  /** Program length in months. Illustrative. */
  months: number;
};

/** Illustrative debt-resolution style program: flat cost % spread over N monthly deposits. */
export function programEstimate(debt: number, a: ProgramAssumptions) {
  if (!Number.isFinite(debt) || debt < 0 || !Number.isFinite(a.totalCostPct) || a.totalCostPct < 0 || !(a.months >= 1)) {
    return null;
  }
  const total = debt * (a.totalCostPct / 100);
  const months = Math.round(a.months);
  return { total, months, monthly: total / months };
}

/** Projected balance after waiting, using an illustrative growth percent. */
export function waitBalance(debt: number, growthPct: number): number {
  if (!Number.isFinite(debt) || !Number.isFinite(growthPct) || debt < 0 || growthPct < 0) return NaN;
  return debt * (1 + growthPct / 100);
}
