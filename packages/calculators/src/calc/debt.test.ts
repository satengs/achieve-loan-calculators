import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { programEstimate, simulateFixedPayment, simulateMinimumPayments, waitBalance } from "./debt";

const rule = { principalPct: 1, floor: 35 };

describe("simulateMinimumPayments", () => {
  it("pays off $20k at 22.77% with interest + 1% minimums", () => {
    const r = simulateMinimumPayments(20000, 22.77, rule)!;
    assert.ok(Math.abs(r.firstPayment - 579.5) < 0.01);
    assert.equal(r.capped, false);
    assert.ok(r.months > 300 && r.months < 360);
    assert.ok(Math.abs(r.totalPaid - (20000 + r.totalInterest)) < 0.01);
  });
  it("zero rate still terminates via principal % + floor", () => {
    const r = simulateMinimumPayments(1000, 0, rule)!;
    assert.equal(r.totalInterest, 0);
    assert.ok(Math.abs(r.totalPaid - 1000) < 0.01);
  });
  it("zero balance → zero months", () => {
    assert.equal(simulateMinimumPayments(0, 20, rule)!.months, 0);
  });
  it("invalid inputs → null", () => {
    assert.equal(simulateMinimumPayments(-1, 20, rule), null);
    assert.equal(simulateMinimumPayments(1000, NaN, rule), null);
    assert.equal(simulateMinimumPayments(1000, 20, { principalPct: 0, floor: 0 }), null);
  });
});

describe("simulateFixedPayment", () => {
  it("zero rate: balance / payment months", () => {
    const r = simulateFixedPayment(1000, 0, 100)!;
    assert.equal(r.months, 10);
    assert.equal(r.totalInterest, 0);
  });
  it("payment that never covers interest → null", () => {
    assert.equal(simulateFixedPayment(10000, 18, 150), null);
  });
  it("faster than minimums", () => {
    const min = simulateMinimumPayments(20000, 22.77, rule)!;
    const fixed = simulateFixedPayment(20000, 22.77, 700)!;
    assert.ok(fixed.months < min.months);
    assert.ok(fixed.totalInterest < min.totalInterest);
  });
});

describe("programEstimate / waitBalance", () => {
  it("flat cost spread over months", () => {
    const p = programEstimate(20000, { totalCostPct: 90, months: 48 })!;
    assert.equal(p.total, 18000);
    assert.equal(p.monthly, 375);
  });
  it("invalid → null / NaN", () => {
    assert.equal(programEstimate(-5, { totalCostPct: 90, months: 48 }), null);
    assert.equal(programEstimate(100, { totalCostPct: 90, months: 0 }), null);
    assert.ok(Number.isNaN(waitBalance(100, -1)));
    assert.equal(waitBalance(10000, 10), 11000);
  });
});
