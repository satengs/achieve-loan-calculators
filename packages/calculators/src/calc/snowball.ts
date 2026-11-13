/** Multi-debt snowball vs avalanche payoff simulations. Pure math, no DOM. */

export type DebtInput = {
  id: string;
  name: string;
  balance: number;
  /** Annual percentage rate (e.g. 22.99). */
  apr: number;
  minPayment: number;
};

export type Strategy = "snowball" | "avalanche";

export type DebtPayoffEvent = {
  id: string;
  name: string;
  month: number;
  interestPaid: number;
};

export type BalancePoint = {
  month: number;
  total: number;
};

export type StrategyResult = {
  strategy: Strategy;
  months: number;
  totalInterest: number;
  totalPaid: number;
  capped: boolean;
  neverPaysOff: boolean;
  order: DebtPayoffEvent[];
  series: BalancePoint[];
  /** Debts whose starting minimum does not cover the first month's interest. */
  growingAtStart: string[];
};

export type StrategyCompare = {
  snowball: StrategyResult;
  avalanche: StrategyResult;
  /** snowball.totalInterest − avalanche.totalInterest; positive means avalanche costs less. */
  interestDelta: number;
  /** snowball.months − avalanche.months; positive means avalanche is faster. */
  monthsDelta: number;
};

export function cents(n: number): number {
  return Math.round(n * 100) / 100;
}

function isValidDebt(d: DebtInput): boolean {
  return (
    Number.isFinite(d.balance) &&
    d.balance >= 0 &&
    Number.isFinite(d.apr) &&
    d.apr >= 0 &&
    Number.isFinite(d.minPayment) &&
    d.minPayment >= 0
  );
}

/** Fixed payoff order: snowball by starting balance (low to high); avalanche by APR (high to low). */
export function sortDebts(debts: DebtInput[], strategy: Strategy): DebtInput[] {
  const list = debts.filter((d) => d.balance > 0.005);
  if (strategy === "snowball") {
    return [...list].sort(
      (a, b) => a.balance - b.balance || a.apr - b.apr || a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
    );
  }
  return [...list].sort(
    (a, b) => b.apr - a.apr || a.balance - b.balance || a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
  );
}

/**
 * Month-by-month simulation. Each month: accrue APR/12 interest, pay every open
 * debt its minimum, then apply leftover (extra + unused minimums) to the focus
 * debt in strategy order, rolling over when a debt is paid off in the same month.
 * Hits `maxMonths` → capped / neverPaysOff (e.g. minimum + extra never covers interest).
 */
export function simulateStrategy(
  debtsIn: DebtInput[],
  extraMonthly: number,
  strategy: Strategy,
  maxMonths = 1200,
): StrategyResult | null {
  if (!Number.isFinite(extraMonthly) || extraMonthly < 0) return null;
  if (!Number.isFinite(maxMonths) || maxMonths <= 0) return null;
  if (!debtsIn.length) return null;
  if (!debtsIn.every(isValidDebt)) return null;

  const debts = debtsIn.map((d) => ({
    id: d.id,
    name: d.name,
    balance: cents(d.balance),
    apr: d.apr,
    minPayment: d.minPayment,
    interestPaid: 0,
    paidOffMonth: null as number | null,
  }));

  const orderIds = sortDebts(
    debts.map((d) => ({ id: d.id, name: d.name, balance: d.balance, apr: d.apr, minPayment: d.minPayment })),
    strategy,
  ).map((d) => d.id);

  const growingAtStart = debts
    .filter((d) => d.balance > 0.005 && d.minPayment + 0.005 < cents(d.balance * (d.apr / 100 / 12)))
    .map((d) => d.id);

  const totalOf = () => cents(debts.reduce((s, d) => s + Math.max(0, d.balance), 0));

  if (debts.every((d) => d.balance <= 0.005)) {
    return {
      strategy,
      months: 0,
      totalInterest: 0,
      totalPaid: 0,
      capped: false,
      neverPaysOff: false,
      order: [],
      series: [{ month: 0, total: 0 }],
      growingAtStart: [],
    };
  }

  let months = 0;
  let totalInterest = 0;
  let totalPaid = 0;
  const series: BalancePoint[] = [{ month: 0, total: totalOf() }];

  while (months < maxMonths && debts.some((d) => d.balance > 0.005)) {
    months++;
    for (const d of debts) {
      if (d.balance <= 0.005) continue;
      const interest = cents(d.balance * (d.apr / 100 / 12));
      d.balance = cents(d.balance + interest);
      d.interestPaid = cents(d.interestPaid + interest);
      totalInterest = cents(totalInterest + interest);
    }

    const open = debts.filter((d) => d.balance > 0.005);
    let budget = cents(extraMonthly + open.reduce((s, d) => s + d.minPayment, 0));

    for (const d of open) {
      const pay = Math.min(d.minPayment, d.balance);
      d.balance = cents(d.balance - pay);
      budget = cents(budget - pay);
      totalPaid = cents(totalPaid + pay);
      if (d.balance <= 0.005 && d.paidOffMonth == null) {
        d.balance = 0;
        d.paidOffMonth = months;
      }
    }

    for (const id of orderIds) {
      if (budget <= 0) break;
      const d = debts.find((x) => x.id === id);
      if (!d || d.balance <= 0.005) continue;
      const pay = Math.min(budget, d.balance);
      d.balance = cents(d.balance - pay);
      budget = cents(budget - pay);
      totalPaid = cents(totalPaid + pay);
      if (d.balance <= 0.005 && d.paidOffMonth == null) {
        d.balance = 0;
        d.paidOffMonth = months;
      }
    }

    series.push({ month: months, total: totalOf() });
  }

  const leftover = debts.some((d) => d.balance > 0.005);
  const order: DebtPayoffEvent[] = debts
    .filter((d) => d.paidOffMonth != null)
    .sort((a, b) => (a.paidOffMonth ?? 0) - (b.paidOffMonth ?? 0) || a.name.localeCompare(b.name))
    .map((d) => ({
      id: d.id,
      name: d.name,
      month: d.paidOffMonth as number,
      interestPaid: d.interestPaid,
    }));

  return {
    strategy,
    months,
    totalInterest,
    totalPaid,
    capped: leftover,
    neverPaysOff: leftover,
    order,
    series,
    growingAtStart,
  };
}

export function compareStrategies(
  debts: DebtInput[],
  extraMonthly: number,
  maxMonths = 1200,
): StrategyCompare | null {
  const snowball = simulateStrategy(debts, extraMonthly, "snowball", maxMonths);
  const avalanche = simulateStrategy(debts, extraMonthly, "avalanche", maxMonths);
  if (!snowball || !avalanche) return null;
  return {
    snowball,
    avalanche,
    interestDelta: cents(snowball.totalInterest - avalanche.totalInterest),
    monthsDelta: snowball.months - avalanche.months,
  };
}

/** Downsample a monthly series to at most `maxPoints`, always keeping first and last. */
export function downsampleSeries(series: BalancePoint[], maxPoints = 48): BalancePoint[] {
  if (series.length <= maxPoints) return series;
  const last = series.length - 1;
  const out: BalancePoint[] = [];
  let prev = -1;
  for (let i = 0; i < maxPoints; i++) {
    const idx = i === maxPoints - 1 ? last : Math.round((i * last) / (maxPoints - 1));
    if (idx === prev) continue;
    out.push(series[idx]);
    prev = idx;
  }
  if (out[out.length - 1] !== series[last]) out.push(series[last]);
  return out;
}

/**
 * Calendar month after `months` payments, from a {year, month} start (month is 1–12).
 * 0 months returns the start; 3 months from Nov 2026 is Feb 2027.
 */
export function payoffCalendarMonth(
  monthsFromNow: number,
  from: { year: number; month: number },
): { year: number; month: number } | null {
  if (!Number.isFinite(monthsFromNow) || monthsFromNow < 0) return null;
  if (!Number.isFinite(from.year) || !Number.isFinite(from.month) || from.month < 1 || from.month > 12) {
    return null;
  }
  const idx = from.year * 12 + (from.month - 1) + Math.round(monthsFromNow);
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}
