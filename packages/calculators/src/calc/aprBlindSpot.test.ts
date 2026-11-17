import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { simulateFixedPayment } from "./debt";
import { fixedPaymentSchedule, levelPayment, newSpendingCost } from "./aprBlindSpot";

const close = (a: number, b: number, eps = 0.01) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);

describe("fixedPaymentSchedule", () => {
  it("matches a hand-computed 3-month case at 12% APR", () => {
    // 200 @ 1%/mo, pay 101: 202−101=101 → 102.01−101=1.01 → 1.0201 paid off (interest 2 + 1.01 + 0.0101).
    const s = fixedPaymentSchedule(200, 12, 101)!;
    assert.equal(s.months, 3);
    close(s.totalInterest, 3.0201, 1e-6);
    close(s.totalPaid, 203.0201, 1e-6);
    assert.equal(s.neverPaysOff, false);
    assert.deepEqual(
      s.series.map((p) => p.month),
      [0, 1, 2, 3],
    );
    close(s.series[1].total, 101, 1e-9);
    assert.equal(s.series[3].total, 0);
  });

  it("agrees with simulateFixedPayment on months and interest", () => {
    const a = fixedPaymentSchedule(5000, 22, 150)!;
    const b = simulateFixedPayment(5000, 22, 150)!;
    assert.equal(a.months, b.months);
    close(a.totalInterest, b.totalInterest, 1e-6);
  });

  it("flags neverPaysOff when the payment does not exceed monthly interest", () => {
    // 6,000 × 24%/12 = 120 interest; a 120 payment never reduces the balance.
    const s = fixedPaymentSchedule(6000, 24, 120)!;
    assert.equal(s.neverPaysOff, true);
    assert.equal(s.months, 0);
  });

  it("zero balance is already paid off; 0% APR is balance ÷ payment rounded up", () => {
    assert.equal(fixedPaymentSchedule(0, 22, 150)!.months, 0);
    const z = fixedPaymentSchedule(1000, 0, 300)!;
    assert.equal(z.months, 4);
    assert.equal(z.totalInterest, 0);
  });

  it("returns null on negative or non-finite input", () => {
    assert.equal(fixedPaymentSchedule(-1, 22, 150), null);
    assert.equal(fixedPaymentSchedule(1000, -1, 150), null);
    assert.equal(fixedPaymentSchedule(1000, 22, Number.NaN), null);
  });
});

describe("levelPayment", () => {
  it("uses the standard amortization formula", () => {
    close(levelPayment(10000, 6, 60), 193.33);
    assert.equal(levelPayment(1000, 0, 10), 100);
    assert.equal(levelPayment(0, 22, 12), 0);
    assert.ok(Number.isNaN(levelPayment(1000, 22, 0)));
  });

  it("a level payment retires the balance in exactly n months", () => {
    const p = levelPayment(6000, 22, 52);
    const s = fixedPaymentSchedule(6000, 22, p + 1e-6)!;
    assert.equal(s.months, 52);
  });
});

describe("newSpendingCost", () => {
  it("worked example: $5,000 + $1,000 at 22% paying $150", () => {
    const c = newSpendingCost({ balance: 5000, newSpending: 1000, aprPct: 22, payment: 150 })!;
    assert.equal(c.without.months, 52);
    assert.equal(c.withSpending.months, 73);
    assert.equal(c.extraMonths, 21);
    close(c.without.totalInterest, 2798.05);
    close(c.withSpending.totalInterest, 4913.45);
    close(c.extraInterest, 2115.4);
    close(c.trueCost, 3115.4);
    close(c.costPerDollar, 3.1154, 1e-4);
    close(c.paymentToKeepDate, 179.97);
    close(c.firstMonthInterest, 110, 1e-9);
  });

  it("no new spending adds nothing", () => {
    const c = newSpendingCost({ balance: 5000, newSpending: 0, aprPct: 22, payment: 150 })!;
    assert.equal(c.extraMonths, 0);
    assert.equal(c.extraInterest, 0);
    assert.ok(Number.isNaN(c.costPerDollar));
    close(c.paymentToKeepDate, 150, 0.5);
  });

  it("a higher APR makes the same purchase cost more", () => {
    const lo = newSpendingCost({ balance: 5000, newSpending: 1000, aprPct: 15, payment: 150 })!;
    const hi = newSpendingCost({ balance: 5000, newSpending: 1000, aprPct: 29, payment: 150 })!;
    assert.ok(hi.trueCost > lo.trueCost);
    assert.ok(hi.extraMonths > lo.extraMonths);
  });

  it("deltas are NaN when the larger balance never pays off", () => {
    // 6,500 × 22%/12 ≈ 119.17 > 110 payment; 5,000 alone (91.67) still pays off.
    const c = newSpendingCost({ balance: 5000, newSpending: 1500, aprPct: 22, payment: 110 })!;
    assert.equal(c.without.neverPaysOff, false);
    assert.equal(c.withSpending.neverPaysOff, true);
    assert.ok(Number.isNaN(c.extraMonths));
    assert.ok(Number.isNaN(c.trueCost));
    assert.ok(Number.isFinite(c.paymentToKeepDate));
  });

  it("returns null on invalid input", () => {
    assert.equal(newSpendingCost({ balance: 5000, newSpending: -1, aprPct: 22, payment: 150 }), null);
    assert.equal(newSpendingCost({ balance: -5, newSpending: 1, aprPct: 22, payment: 150 }), null);
  });
});
