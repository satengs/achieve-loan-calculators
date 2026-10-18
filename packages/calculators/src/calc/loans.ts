import { amortize, interestOnlyMonthly, monthlyPayment } from "./amortize";
import type { AmortRow } from "./types";

export type YearRow = { year: number; payment: number; principal: number; interest: number; balance: number };

/** Roll a monthly schedule up into yearly rows (for compact, mobile-scrollable tables). */
export function yearlySchedule(rows: AmortRow[]): YearRow[] {
  const out: YearRow[] = [];
  for (const r of rows) {
    const y = Math.ceil(r.month / 12);
    let row = out[y - 1];
    if (!row) {
      row = { year: y, payment: 0, principal: 0, interest: 0, balance: 0 };
      out[y - 1] = row;
    }
    row.payment += r.payment;
    row.principal += r.principal;
    row.interest += r.interest;
    row.balance = r.balance;
  }
  return out;
}

/** Amortizing loan with an optional extra monthly principal payment. */
export function payoffWithExtra(principal: number, aprPct: number, termMonths: number, extra = 0) {
  const base = amortize(principal, aprPct, termMonths);
  if (!base) return null;
  if (!Number.isFinite(extra) || extra < 0) return null;
  if (extra === 0) return { base, months: base.schedule.length, totalInterest: base.totalInterest, interestSaved: 0, monthsSaved: 0 };
  const r = aprPct / 100 / 12;
  let bal = principal;
  let months = 0;
  let interestTotal = 0;
  while (bal > 0.005 && months < termMonths) {
    const interest = bal * r;
    const pay = Math.min(base.payment + extra, bal + interest);
    bal = bal + interest - pay;
    interestTotal += interest;
    months++;
  }
  return {
    base,
    months,
    totalInterest: interestTotal,
    interestSaved: base.totalInterest - interestTotal,
    monthsSaved: base.schedule.length - months,
  };
}

/** Interest that accrues (simple) during school/grace and is capitalized at repayment. */
export function capitalizedInterest(principal: number, aprPct: number, deferMonths: number): number {
  if (![principal, aprPct, deferMonths].every(Number.isFinite) || principal < 0 || aprPct < 0 || deferMonths < 0) return NaN;
  return principal * (aprPct / 100 / 12) * deferMonths;
}

/** Auto loan amount: price + tax + fees − down − trade equity. Tax applies to price − trade-in value. */
export function carLoanAmount(o: {
  price: number;
  down: number;
  tradeIn: number;
  tradeOwed: number;
  salesTaxPct: number;
  fees: number;
  taxTradeCredit?: boolean;
}) {
  const vals = [o.price, o.down, o.tradeIn, o.tradeOwed, o.salesTaxPct, o.fees];
  if (!vals.every((n) => Number.isFinite(n) && n >= 0)) return null;
  const taxable = Math.max(0, o.price - (o.taxTradeCredit === false ? 0 : o.tradeIn));
  const tax = taxable * (o.salesTaxPct / 100);
  const tradeEquity = o.tradeIn - o.tradeOwed;
  const amount = o.price + tax + o.fees - o.down - tradeEquity;
  return { tax, tradeEquity, amount };
}

/**
 * Standard lease payment.
 * cap = price + fees − down − trade; residual = MSRP × residual%;
 * depreciation = (cap − residual) / term; finance = (cap + residual) × MF; MF = APR / 2400;
 * monthly = (depreciation + finance) × (1 + tax%).
 */
export function leasePayment(o: {
  msrp: number;
  price: number;
  down: number;
  tradeIn: number;
  fees: number;
  residualPct: number;
  aprPct: number;
  termMonths: number;
  salesTaxPct: number;
}) {
  const vals = [o.msrp, o.price, o.down, o.tradeIn, o.fees, o.residualPct, o.aprPct, o.termMonths, o.salesTaxPct];
  if (!vals.every((n) => Number.isFinite(n) && n >= 0)) return null;
  if (o.termMonths < 1 || o.residualPct > 100) return null;
  const capCost = o.price + o.fees - o.down - o.tradeIn;
  const residual = o.msrp * (o.residualPct / 100);
  if (capCost <= 0 || capCost < residual) return null;
  const moneyFactor = o.aprPct / 2400;
  const depreciation = (capCost - residual) / o.termMonths;
  const finance = (capCost + residual) * moneyFactor;
  const base = depreciation + finance;
  const tax = base * (o.salesTaxPct / 100);
  const monthly = base + tax;
  const totalPayments = monthly * o.termMonths;
  return {
    capCost,
    residual,
    moneyFactor,
    depreciation,
    finance,
    tax,
    monthly,
    totalPayments,
    totalLeaseCost: totalPayments + o.down + o.tradeIn,
    totalFinanceCharge: finance * o.termMonths,
  };
}

/**
 * Refinance comparison with closing costs paid in cash or rolled into the new loan.
 *
 * Two different questions are answered separately (M7):
 * - monthly: `monthlySavings` = current P&I − new P&I (can be negative).
 * - lifetime: `lifetimeCostChange` = (new total P&I + cash costs) − current remaining total.
 *   Positive means the refinance costs MORE over its life (e.g. a longer term), even when
 *   the monthly payment drops. `lifetimeSavings` = −lifetimeCostChange (kept for callers).
 *
 * Break-even is balance-adjusted and works the same way for cash and rolled-in costs: the
 * first month n where
 *   Σ(payment savings so far) − cash costs + (current balance_n − new balance_n) ≥ 0.
 * With rolled-in costs nothing is paid up front, but the new balance starts higher by the
 * costs (and accrues interest on them), so the old `costs ÷ monthly savings` shortcut was
 * wrong for that case. NaN when you never come out ahead within the longer of the two terms.
 * `simpleBreakEvenMonths` (cash costs ÷ monthly savings) is kept for reference.
 */
export function refinanceCompare(o: {
  balance: number;
  currentRatePct: number;
  remainingMonths: number;
  newRatePct: number;
  newTermMonths: number;
  closingCosts: number;
  rollCosts: boolean;
}) {
  if (![o.balance, o.currentRatePct, o.remainingMonths, o.newRatePct, o.newTermMonths, o.closingCosts].every(Number.isFinite)) return null;
  if (o.closingCosts < 0) return null;
  const current = amortize(o.balance, o.currentRatePct, o.remainingMonths);
  const newPrincipal = o.balance + (o.rollCosts ? o.closingCosts : 0);
  const next = amortize(newPrincipal, o.newRatePct, o.newTermMonths);
  if (!current || !next) return null;
  const monthlySavings = current.payment - next.payment;
  const upfront = o.rollCosts ? 0 : o.closingCosts;
  const newTotal = next.totalPaid + upfront;
  const lifetimeCostChange = newTotal - current.totalPaid;
  return {
    currentPayment: current.payment,
    newPayment: next.payment,
    monthlySavings,
    /** Simple template formula: (current − new) × remaining payments. */
    simpleSavings: monthlySavings * o.remainingMonths,
    currentRemainingTotal: current.totalPaid,
    newTotal,
    lifetimeCostChange,
    lifetimeSavings: -lifetimeCostChange,
    /** True when monthly payments fall but the refinance costs more in total. */
    lowerPaymentHigherCost: monthlySavings > 0 && lifetimeCostChange > 0,
    currentInterest: current.totalInterest,
    newInterest: next.totalInterest,
    breakEvenMonths: refinanceBreakEven(current.schedule, next.schedule, upfront),
    simpleBreakEvenMonths: monthlySavings > 0 ? Math.ceil(o.closingCosts / monthlySavings) : NaN,
    upfrontCosts: upfront,
    newPrincipal,
  };
}

type ScheduleRow = { payment: number; balance: number };

/** Balance-adjusted break-even month (see refinanceCompare). NaN when never ahead. */
export function refinanceBreakEven(current: ScheduleRow[], next: ScheduleRow[], upfrontCosts: number): number {
  const horizon = Math.max(current.length, next.length);
  let cumulative = -upfrontCosts;
  for (let n = 0; n < horizon; n++) {
    const cur = current[n];
    const nw = next[n];
    cumulative += (cur ? cur.payment : 0) - (nw ? nw.payment : 0);
    const curBal = cur ? cur.balance : 0;
    const newBal = nw ? nw.balance : 0;
    if (cumulative + (curBal - newBal) >= -0.005) return n + 1;
  }
  return NaN;
}

/** HELOC with interest-only draw period followed by amortizing repayment period. */
export function helocDrawRepay(balance: number, aprPct: number, drawYears: number, repayYears: number) {
  if (![balance, aprPct, drawYears, repayYears].every(Number.isFinite)) return null;
  if (balance <= 0 || aprPct < 0 || drawYears < 0 || repayYears <= 0) return null;
  const drawPayment = interestOnlyMonthly(balance, aprPct);
  const repay = amortize(balance, aprPct, Math.round(repayYears * 12));
  if (!repay) return null;
  const drawInterest = drawPayment * Math.round(drawYears * 12);
  return {
    drawPayment,
    repayPayment: repay.payment,
    drawInterest,
    repayInterest: repay.totalInterest,
    totalInterest: drawInterest + repay.totalInterest,
    totalPaid: drawInterest + repay.totalPaid,
  };
}

export type ConsolidationOptionConfig = {
  id: string;
  kind: "loan" | "program";
  /** Loan: APR range [low, high] in percent. */
  aprRange?: [number, number];
  termMonths: number;
  /** Program: total cost as percent of enrolled debt (illustrative). */
  totalCostPct?: number;
  minDebt?: number;
  maxDebt?: number;
  /** Optional origination fee percent financed into the loan. */
  feePct?: number;
};

export type ConsolidationOptionResult = {
  id: string;
  available: boolean;
  months: number;
  monthlyLow: number;
  monthlyHigh: number;
  totalLow: number;
  totalHigh: number;
};

/** Indicative range per option. Loans: payment at low/high APR. Program: flat cost %. */
export function consolidationOptions(debt: number, options: ConsolidationOptionConfig[]): ConsolidationOptionResult[] | null {
  if (!Number.isFinite(debt) || debt <= 0) return null;
  return options.map((o) => {
    const available = (o.minDebt == null || debt >= o.minDebt) && (o.maxDebt == null || debt <= o.maxDebt);
    if (o.kind === "program") {
      const total = debt * ((o.totalCostPct ?? 0) / 100);
      const m = total / o.termMonths;
      return { id: o.id, available, months: o.termMonths, monthlyLow: m, monthlyHigh: m, totalLow: total, totalHigh: total };
    }
    const [lo, hi] = o.aprRange ?? [NaN, NaN];
    const principal = debt * (1 + (o.feePct ?? 0) / 100);
    const pLo = monthlyPayment(principal, lo, o.termMonths);
    const pHi = monthlyPayment(principal, hi, o.termMonths);
    return {
      id: o.id,
      available,
      months: o.termMonths,
      monthlyLow: pLo,
      monthlyHigh: pHi,
      totalLow: pLo * o.termMonths,
      totalHigh: pHi * o.termMonths,
    };
  });
}
