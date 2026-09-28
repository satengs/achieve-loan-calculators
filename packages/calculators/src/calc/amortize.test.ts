import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { amortize, monthlyPayment, interestOnlyMonthly, toMonths } from "./amortize";
import { applyOriginationFee } from "./fees";
import { validateRange } from "./validate";
import { downPaymentAndLoan, derivedCreditLimit, equityRatios } from "./equity";
import { lifeCoverageEstimate } from "./life";
import { interpolate } from "./format";

describe("monthlyPayment / amortize", () => {
  it("matches known-good personal loan sample", () => {
    const p = monthlyPayment(10000, 10, 36);
    assert.ok(Math.abs(p - 322.67) < 0.01);
    const result = amortize(10000, 10, 36);
    assert.ok(result);
    assert.ok(Math.abs(result!.totalInterest - 1616.19) < 0.5);
  });

  it("handles zero APR", () => {
    assert.equal(monthlyPayment(1200, 0, 12), 100);
  });

  it("returns NaN / null for invalid inputs", () => {
    assert.ok(Number.isNaN(monthlyPayment(-1, 10, 12)));
    assert.equal(amortize(0, 10, 12), null);
  });
});

describe("interestOnlyMonthly", () => {
  it("computes HELOC IO sample", () => {
    const m = interestOnlyMonthly(50000, 8.5);
    assert.ok(Math.abs(m - 354.1667) < 0.01);
  });
});

describe("fees / equity / life", () => {
  it("finances origination fee into principal", () => {
    const f = applyOriginationFee(10000, 5, "financed");
    assert.equal(f.financedPrincipal, 10500);
    assert.equal(f.cashReceived, 10000);
  });

  it("derives down payment and credit limit", () => {
    const d = downPaymentAndLoan(400000, 20, "percent");
    assert.equal(d.loanAmount, 320000);
    const limit = derivedCreditLimit(450000, 280000, 85);
    assert.equal(limit, 102500);
  });

  it("guards LTV division by zero", () => {
    const r = equityRatios(0, 100, 50);
    assert.ok(Number.isNaN(r.ltv));
  });

  it("life coverage spot-check", () => {
    const est = lifeCoverageEstimate({
      annualIncome: 75000,
      yearsIncomeReplace: 10,
      totalDebts: 250000,
      finalExpenses: 15000,
      educationFund: 50000,
      existingCoverage: 100000,
      liquidAssets: 25000,
    });
    assert.equal(est.netNeed, 940000);
  });
});

describe("validate / interpolate / toMonths", () => {
  it("validates ranges", () => {
    assert.equal(validateRange("10", { min: 1, max: 5, label: "X" }).ok, false);
    assert.equal(validateRange("3", { min: 1, max: 5 }).ok, true);
  });
  it("interpolates safely", () => {
    assert.equal(interpolate("Hi {{name}}", { name: "Ada" }), "Hi Ada");
    assert.equal(interpolate("{{a}}", {}), "");
  });
  it("converts years to months", () => {
    assert.equal(toMonths(2, "years"), 24);
  });
});
