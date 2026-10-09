export type GrowthRow = { year: number; contributions: number; interest: number; balance: number };

/** Effective monthly rate from an APY-style nominal rate compounded n times per year. */
export function monthlyRateFromNominal(annualPct: number, compoundsPerYear: number): number {
  if (!Number.isFinite(annualPct) || annualPct < 0 || !(compoundsPerYear >= 1)) return NaN;
  return Math.pow(1 + annualPct / 100 / compoundsPerYear, compoundsPerYear / 12) - 1;
}

/**
 * Future value with monthly end-of-period contributions.
 * FV = P(1+i)^m + C·((1+i)^m − 1)/i  (i = effective monthly rate, m = months).
 * Contributions may grow by `contributionGrowthPct` once per year.
 */
export function futureValue(opts: {
  initial: number;
  monthly: number;
  annualRatePct: number;
  years: number;
  compoundsPerYear?: number;
  contributionGrowthPct?: number;
}) {
  const { initial, monthly, annualRatePct, years } = opts;
  const n = opts.compoundsPerYear ?? 12;
  const growth = opts.contributionGrowthPct ?? 0;
  if (![initial, monthly, annualRatePct, years, growth].every(Number.isFinite)) return null;
  if (initial < 0 || monthly < 0 || annualRatePct < 0 || years <= 0 || growth < 0) return null;
  const i = monthlyRateFromNominal(annualRatePct, n);
  if (!Number.isFinite(i)) return null;
  const months = Math.round(years * 12);
  let bal = initial;
  let contributions = initial;
  let interestTotal = 0;
  let c = monthly;
  const rows: GrowthRow[] = [];
  let yContrib = 0;
  let yInterest = 0;
  for (let m = 1; m <= months; m++) {
    const interest = bal * i;
    bal += interest + c;
    contributions += c;
    interestTotal += interest;
    yContrib += c;
    yInterest += interest;
    if (m % 12 === 0 || m === months) {
      rows.push({ year: Math.ceil(m / 12), contributions: yContrib, interest: yInterest, balance: bal });
      yContrib = 0;
      yInterest = 0;
      c = c * (1 + growth / 100);
    }
  }
  return { balance: bal, contributions, interest: interestTotal, months, rows };
}

/** Deflate a nominal future amount to today's dollars. */
export function realValue(nominal: number, inflationPct: number, years: number): number {
  if (![nominal, inflationPct, years].every(Number.isFinite) || inflationPct <= -100 || years < 0) return NaN;
  return nominal / Math.pow(1 + inflationPct / 100, years);
}

/** Year-over-year percent change. */
export function yoyPct(latest: number, yearAgo: number): number {
  if (!Number.isFinite(latest) || !Number.isFinite(yearAgo) || yearAgo <= 0) return NaN;
  return (latest / yearAgo - 1) * 100;
}

/** Retirement projection: accumulate to retireAge, then a sustainable-withdrawal income estimate. */
export function retirementProjection(opts: {
  currentAge: number;
  retireAge: number;
  currentSavings: number;
  monthlyContribution: number;
  employerMonthly: number;
  annualReturnPct: number;
  inflationPct: number;
  withdrawalRatePct: number;
  contributionGrowthPct?: number;
}) {
  const years = opts.retireAge - opts.currentAge;
  if (!Number.isFinite(years) || years <= 0) return null;
  if (!Number.isFinite(opts.withdrawalRatePct) || opts.withdrawalRatePct < 0) return null;
  const fv = futureValue({
    initial: opts.currentSavings,
    monthly: opts.monthlyContribution + (opts.employerMonthly || 0),
    annualRatePct: opts.annualReturnPct,
    years,
    compoundsPerYear: 12,
    contributionGrowthPct: opts.contributionGrowthPct ?? 0,
  });
  if (!fv) return null;
  const real = realValue(fv.balance, opts.inflationPct, years);
  const annualIncome = fv.balance * (opts.withdrawalRatePct / 100);
  return {
    years,
    balance: fv.balance,
    realBalance: real,
    contributions: fv.contributions,
    growth: fv.interest,
    annualIncome,
    monthlyIncome: annualIncome / 12,
    monthlyIncomeToday: realValue(annualIncome / 12, opts.inflationPct, years),
    rows: fv.rows,
  };
}
