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

export type DrawdownBar = { age: number; balance: number };

export type RetirementDrawdownResult = {
  /** Months until balance is exhausted (or maxMonths if capped). */
  monthsLasted: number;
  capped: boolean;
  /** Age (years, fractional to month) when money runs out, or maxAge if capped. */
  endAge: number;
  endAgeWhole: number;
  totalWithdrawn: number;
  totalGrowth: number;
  /** Yearly (and final) balance snapshots for the depletion chart. */
  bars: DrawdownBar[];
};

/**
 * Spend-down simulation: start with `savings`, withdraw `monthlyWithdrawal` each month
 * after applying return. Optional annual raise on the withdrawal (inflation).
 * Returns how long the money lasts, totals, and age-labeled bars for a chart.
 */
export function retirementDrawdown(opts: {
  startAge: number;
  savings: number;
  monthlyWithdrawal: number;
  annualReturnPct: number;
  withdrawalInflationPct?: number;
  maxAge?: number;
}): RetirementDrawdownResult | null {
  const {
    startAge,
    savings,
    monthlyWithdrawal,
    annualReturnPct,
    withdrawalInflationPct = 0,
    maxAge = 120,
  } = opts;
  if (![startAge, savings, monthlyWithdrawal, annualReturnPct, withdrawalInflationPct, maxAge].every(Number.isFinite)) {
    return null;
  }
  if (startAge < 0 || startAge >= maxAge || savings < 0 || monthlyWithdrawal < 0 || annualReturnPct < 0 || withdrawalInflationPct < 0) {
    return null;
  }
  if (monthlyWithdrawal === 0 && savings === 0) {
    return {
      monthsLasted: 0,
      capped: false,
      endAge: startAge,
      endAgeWhole: Math.floor(startAge),
      totalWithdrawn: 0,
      totalGrowth: 0,
      bars: [{ age: Math.floor(startAge), balance: 0 }],
    };
  }

  const i = monthlyRateFromNominal(annualReturnPct, 12);
  if (!Number.isFinite(i)) return null;
  const maxMonths = Math.max(1, Math.round((maxAge - startAge) * 12));
  let bal = savings;
  let wd = monthlyWithdrawal;
  let totalWithdrawn = 0;
  let totalGrowth = 0;
  const bars: DrawdownBar[] = [{ age: Math.floor(startAge), balance: bal }];
  let monthsLasted = 0;
  let capped = true;

  for (let m = 1; m <= maxMonths; m++) {
    const interest = bal * i;
    bal += interest;
    totalGrowth += interest;
    const take = Math.min(wd, Math.max(0, bal));
    bal -= take;
    totalWithdrawn += take;
    monthsLasted = m;

    if (m % 12 === 0) {
      wd = wd * (1 + withdrawalInflationPct / 100);
      const age = Math.floor(startAge + m / 12);
      bars.push({ age, balance: Math.max(0, bal) });
    }

    if (bal <= 0.5) {
      bal = 0;
      capped = false;
      // Ensure a final bar at depletion age if we didn't just push a year bar.
      const ageAtEnd = startAge + m / 12;
      const ageLabel = Math.floor(ageAtEnd);
      if (!bars.length || bars[bars.length - 1].age !== ageLabel) {
        bars.push({ age: ageLabel, balance: 0 });
      } else {
        bars[bars.length - 1].balance = 0;
      }
      break;
    }
  }

  if (capped) {
    const ageLabel = Math.floor(startAge + monthsLasted / 12);
    if (!bars.length || bars[bars.length - 1].age !== ageLabel) {
      bars.push({ age: ageLabel, balance: Math.max(0, bal) });
    }
  }

  const endAge = startAge + monthsLasted / 12;
  return {
    monthsLasted,
    capped,
    endAge,
    endAgeWhole: Math.floor(endAge),
    totalWithdrawn,
    totalGrowth,
    bars,
  };
}

/**
 * Largest constant monthly withdrawal (before inflation raises) that lasts until `targetAge`.
 * Binary search; returns null if inputs invalid or even $0 fails (shouldn't).
 */
export function withdrawalToLastUntil(opts: {
  startAge: number;
  savings: number;
  annualReturnPct: number;
  withdrawalInflationPct?: number;
  targetAge: number;
}): number | null {
  const { startAge, savings, annualReturnPct, withdrawalInflationPct = 0, targetAge } = opts;
  if (![startAge, savings, annualReturnPct, withdrawalInflationPct, targetAge].every(Number.isFinite)) return null;
  if (targetAge <= startAge || savings < 0) return null;
  const needMonths = Math.round((targetAge - startAge) * 12);
  let lo = 0;
  let hi = Math.max(savings, 1);
  // Expand upper bound until money runs out before target (or cap).
  for (let n = 0; n < 24; n++) {
    const trial = retirementDrawdown({
      startAge,
      savings,
      monthlyWithdrawal: hi,
      annualReturnPct,
      withdrawalInflationPct,
      maxAge: targetAge + 1,
    });
    if (!trial || trial.monthsLasted < needMonths) break;
    hi *= 2;
    if (hi > savings * 10 && hi > 1e9) break;
  }
  for (let n = 0; n < 40; n++) {
    const mid = (lo + hi) / 2;
    const trial = retirementDrawdown({
      startAge,
      savings,
      monthlyWithdrawal: mid,
      annualReturnPct,
      withdrawalInflationPct,
      maxAge: targetAge + 1,
    });
    if (trial && trial.monthsLasted >= needMonths) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** Human duration from whole months: "20 years, 10 months" / "1 year" / "6 months". */
export function formatDurationMonths(totalMonths: number): string {
  if (!Number.isFinite(totalMonths) || totalMonths < 0) return "—";
  const m = Math.round(totalMonths);
  const y = Math.floor(m / 12);
  const mo = m % 12;
  const yPart = y === 0 ? "" : y === 1 ? "1 year" : `${y} years`;
  const mPart = mo === 0 ? "" : mo === 1 ? "1 month" : `${mo} months`;
  if (yPart && mPart) return `${yPart}, ${mPart}`;
  return yPart || mPart || "0 months";
}
