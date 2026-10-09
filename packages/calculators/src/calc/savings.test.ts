import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { futureValue, monthlyRateFromNominal, realValue, retirementProjection, yoyPct } from "./savings";
import { budgetSummary } from "./budget";

describe("futureValue", () => {
  it("zero rate = sum of deposits", () => {
    const r = futureValue({ initial: 1000, monthly: 100, annualRatePct: 0, years: 2 })!;
    assert.equal(r.balance, 3400);
    assert.equal(r.interest, 0);
    assert.equal(r.rows.length, 2);
  });
  it("annual compounding matches P(1+r)^n", () => {
    const r = futureValue({ initial: 10000, monthly: 0, annualRatePct: 5, years: 10, compoundsPerYear: 1 })!;
    assert.ok(Math.abs(r.balance - 16288.95) < 0.01);
  });
  it("monthly contributions closed form", () => {
    const r = futureValue({ initial: 0, monthly: 100, annualRatePct: 6, years: 1 })!;
    const i = 0.005;
    assert.ok(Math.abs(r.balance - 100 * ((Math.pow(1 + i, 12) - 1) / i)) < 1e-6);
  });
  it("invalid → null", () => {
    assert.equal(futureValue({ initial: -1, monthly: 0, annualRatePct: 5, years: 1 }), null);
    assert.equal(futureValue({ initial: 1, monthly: 0, annualRatePct: 5, years: 0 }), null);
    assert.ok(Number.isNaN(monthlyRateFromNominal(-1, 12)));
  });
});

describe("inflation helpers", () => {
  it("realValue and yoy", () => {
    assert.ok(Math.abs(realValue(110, 10, 1) - 100) < 1e-9);
    assert.ok(Math.abs(yoyPct(334.131, 323.291) - 3.353) < 0.01);
    assert.ok(Number.isNaN(yoyPct(1, 0)));
  });
});

describe("retirementProjection", () => {
  it("projects and applies withdrawal rate", () => {
    const r = retirementProjection({
      currentAge: 35, retireAge: 65, currentSavings: 0, monthlyContribution: 100, employerMonthly: 0,
      annualReturnPct: 0, inflationPct: 0, withdrawalRatePct: 4,
    })!;
    assert.equal(r.balance, 36000);
    assert.equal(r.annualIncome, 1440);
    assert.equal(r.monthlyIncome, 120);
  });
  it("retire age ≤ current age → null", () => {
    assert.equal(retirementProjection({
      currentAge: 65, retireAge: 60, currentSavings: 0, monthlyContribution: 100, employerMonthly: 0,
      annualReturnPct: 5, inflationPct: 2, withdrawalRatePct: 4,
    }), null);
  });
});

describe("budgetSummary", () => {
  it("totals, leftover, and 50/30/20 targets", () => {
    const r = budgetSummary([4000, 1000], [
      { key: "rent", amount: 2000, category: "needs" },
      { key: "fun", amount: 1000, category: "wants" },
      { key: "save", amount: 500, category: "savings" },
    ])!;
    assert.equal(r.totalIncome, 5000);
    assert.equal(r.leftover, 1500);
    assert.equal(r.pctOfIncome.needs, 40);
    assert.equal(r.targetAmounts.savings, 1000);
    assert.equal(r.savingsRate, 40);
  });
  it("zero income → NaN percents; negatives → null", () => {
    assert.ok(Number.isNaN(budgetSummary([0], [])!.pctOfIncome.needs));
    assert.equal(budgetSummary([-1], []), null);
  });
});
