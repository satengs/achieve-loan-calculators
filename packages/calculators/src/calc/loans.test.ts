import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { amortize } from "./amortize";
import {
  capitalizedInterest,
  carLoanAmount,
  consolidationOptions,
  helocDrawRepay,
  leasePayment,
  payoffWithExtra,
  refinanceCompare,
  yearlySchedule,
} from "./loans";

describe("yearlySchedule", () => {
  it("rolls 36 months into 3 years summing to totals", () => {
    const a = amortize(10000, 10, 36)!;
    const y = yearlySchedule(a.schedule);
    assert.equal(y.length, 3);
    assert.ok(Math.abs(y.reduce((s, r) => s + r.interest, 0) - a.totalInterest) < 1e-6);
    assert.ok(y[2].balance < 0.01);
  });
});

describe("payoffWithExtra / student loan", () => {
  it("extra payment saves months and interest", () => {
    const r = payoffWithExtra(30000, 6.5, 120, 100)!;
    assert.ok(r.monthsSaved > 0 && r.interestSaved > 0);
    assert.equal(r.months + r.monthsSaved, 120);
  });
  it("zero rate, zero extra", () => {
    const r = payoffWithExtra(1200, 0, 12, 0)!;
    assert.equal(r.totalInterest, 0);
    assert.equal(r.months, 12);
  });
  it("invalid → null", () => {
    assert.equal(payoffWithExtra(0, 5, 12), null);
    assert.equal(payoffWithExtra(1000, 5, 12, -1), null);
  });
  it("capitalized interest", () => {
    assert.equal(capitalizedInterest(12000, 6, 6), 360);
    assert.equal(capitalizedInterest(12000, 0, 6), 0);
    assert.ok(Number.isNaN(capitalizedInterest(-1, 6, 6)));
  });
});

describe("carLoanAmount", () => {
  it("tax after trade credit, trade equity reduces amount", () => {
    assert.deepEqual(carLoanAmount({ price: 35000, down: 4000, tradeIn: 5000, tradeOwed: 2000, salesTaxPct: 6, fees: 800 }), {
      tax: 1800, tradeEquity: 3000, amount: 30600,
    });
  });
  it("negative inputs → null", () => {
    assert.equal(carLoanAmount({ price: -1, down: 0, tradeIn: 0, tradeOwed: 0, salesTaxPct: 0, fees: 0 }), null);
  });
});

describe("leasePayment", () => {
  it("standard money-factor lease", () => {
    const r = leasePayment({ msrp: 40000, price: 38000, down: 3000, tradeIn: 0, fees: 1000, residualPct: 58, aprPct: 6, termMonths: 36, salesTaxPct: 7 })!;
    assert.equal(r.moneyFactor, 0.0025);
    assert.ok(Math.abs(r.monthly - 538.80) < 0.01);
  });
  it("zero APR → depreciation only", () => {
    const r = leasePayment({ msrp: 30000, price: 30000, down: 0, tradeIn: 0, fees: 0, residualPct: 50, aprPct: 0, termMonths: 30, salesTaxPct: 0 })!;
    assert.equal(r.monthly, 500);
  });
  it("cap cost below residual / invalid → null", () => {
    assert.equal(leasePayment({ msrp: 40000, price: 10000, down: 0, tradeIn: 0, fees: 0, residualPct: 60, aprPct: 5, termMonths: 36, salesTaxPct: 0 }), null);
    assert.equal(leasePayment({ msrp: 40000, price: 40000, down: 0, tradeIn: 0, fees: 0, residualPct: 60, aprPct: 5, termMonths: 0, salesTaxPct: 0 }), null);
  });
});

describe("refinanceCompare", () => {
  const base = { balance: 300000, currentRatePct: 7.5, remainingMonths: 336, newRatePct: 6.5, newTermMonths: 360, closingCosts: 6000, rollCosts: false };
  it("savings and break-even", () => {
    const r = refinanceCompare(base)!;
    assert.ok(r.monthlySavings > 240 && r.monthlySavings < 245);
    assert.equal(r.breakEvenMonths, 25);
  });
  it("rolled costs raise principal; zero rate ok", () => {
    assert.equal(refinanceCompare({ ...base, rollCosts: true })!.newPrincipal, 306000);
    assert.ok(refinanceCompare({ ...base, newRatePct: 0 })!.newInterest === 0);
  });
  it("no savings → NaN break-even; invalid → null", () => {
    assert.ok(Number.isNaN(refinanceCompare({ ...base, newRatePct: 9 })!.breakEvenMonths));
    assert.equal(refinanceCompare({ ...base, balance: 0 }), null);
  });
});

describe("helocDrawRepay", () => {
  it("matches Achieve FAQ example ($40k, 8%, 5y draw, 15y repay ≈ $267 / $382)", () => {
    const r = helocDrawRepay(40000, 8, 5, 15)!;
    assert.equal(Math.round(r.drawPayment), 267);
    assert.equal(Math.round(r.repayPayment), 382);
  });
  it("zero rate and invalid", () => {
    assert.equal(helocDrawRepay(12000, 0, 1, 1)!.repayPayment, 1000);
    assert.equal(helocDrawRepay(0, 8, 5, 15), null);
  });
});

describe("consolidationOptions", () => {
  const opts = [
    { id: "pl", kind: "loan" as const, aprRange: [12, 24] as [number, number], termMonths: 60, maxDebt: 50000 },
    { id: "dr", kind: "program" as const, totalCostPct: 90, termMonths: 48, minDebt: 7500 },
  ];
  it("ranges and availability", () => {
    const r = consolidationOptions(20000, opts)!;
    assert.ok(r[0].monthlyLow < r[0].monthlyHigh);
    assert.equal(r[1].monthlyLow, 375);
    assert.equal(consolidationOptions(60000, opts)![0].available, false);
    assert.equal(consolidationOptions(5000, opts)![1].available, false);
  });
  it("zero / invalid debt → null", () => {
    assert.equal(consolidationOptions(0, opts), null);
  });
});
