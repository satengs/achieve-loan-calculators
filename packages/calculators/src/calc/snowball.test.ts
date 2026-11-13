import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { simulateFixedPayment } from "./debt";
import {
  cents,
  compareStrategies,
  downsampleSeries,
  payoffCalendarMonth,
  simulateStrategy,
  sortDebts,
  type DebtInput,
} from "./snowball";

const A: DebtInput = { id: "a", name: "Store card", balance: 500, apr: 10, minPayment: 25 };
const B: DebtInput = { id: "b", name: "Card B", balance: 3000, apr: 24, minPayment: 75 };

describe("sortDebts", () => {
  it("snowball is smallest starting balance first; avalanche is highest APR first", () => {
    assert.deepEqual(
      sortDebts([A, B], "snowball").map((d) => d.id),
      ["a", "b"],
    );
    assert.deepEqual(
      sortDebts([A, B], "avalanche").map((d) => d.id),
      ["b", "a"],
    );
  });
  it("drops zero-balance debts and uses name as a stable tie-break", () => {
    const x = { id: "x", name: "Alpha", balance: 100, apr: 20, minPayment: 10 };
    const y = { id: "y", name: "Beta", balance: 100, apr: 20, minPayment: 10 };
    const z = { id: "z", name: "Zero", balance: 0, apr: 30, minPayment: 5 };
    assert.deepEqual(
      sortDebts([y, z, x], "snowball").map((d) => d.id),
      ["x", "y"],
    );
  });
});

describe("simulateStrategy", () => {
  it("pays a single $100 balance at 12% with $10 min + $40 extra in 3 months", () => {
    const d: DebtInput = { id: "one", name: "One", balance: 100, apr: 12, minPayment: 10 };
    const r = simulateStrategy([d], 40, "snowball");
    assert.ok(r);
    assert.equal(r.months, 3);
    assert.equal(r.neverPaysOff, false);
    assert.equal(r.capped, false);
    assert.equal(r.totalInterest, 1.53);
    assert.equal(r.totalPaid, 101.53);
    assert.deepEqual(
      r.order.map((o) => o.month),
      [3],
    );
    // Avalanche is identical for a single debt.
    const av = simulateStrategy([d], 40, "avalanche");
    assert.ok(av);
    assert.equal(av.months, r.months);
    assert.equal(av.totalInterest, r.totalInterest);
  });

  it("matches the existing fixed-payment simulator on a single amortizing debt (within a dollar)", () => {
    const d: DebtInput = { id: "one", name: "One", balance: 5000, apr: 18, minPayment: 100 };
    const extra = 50;
    const payment = d.minPayment + extra;
    const fixed = simulateFixedPayment(d.balance, d.apr, payment);
    const r = simulateStrategy([d], extra, "avalanche");
    assert.ok(fixed && r);
    assert.equal(r.months, fixed.months);
    assert.ok(Math.abs(r.totalInterest - fixed.totalInterest) < 1);
  });

  it("snowball pays the smallest balance first; avalanche pays the highest APR first", () => {
    const r = compareStrategies([A, B], 150);
    assert.ok(r);
    assert.equal(r.snowball.order[0].id, "a");
    assert.equal(r.avalanche.order[0].id, "b");
    assert.equal(r.snowball.order[r.snowball.order.length - 1].id, "b");
    assert.equal(r.avalanche.order[r.avalanche.order.length - 1].id, "a");
    assert.ok(r.snowball.neverPaysOff === false && r.avalanche.neverPaysOff === false);
    // Same debts, same cash: avalanche should cost less (or equal) interest.
    assert.ok(r.interestDelta >= -0.01, `interestDelta ${r.interestDelta}`);
    assert.ok(r.avalanche.totalInterest <= r.snowball.totalInterest + 0.01);
  });

  it("avalanche saves interest vs snowball on a high-APR large balance vs a small low-APR card", () => {
    const r = compareStrategies([A, B], 150);
    assert.ok(r);
    assert.ok(r.interestDelta > 0, `expected avalanche to save interest, delta=${r.interestDelta}`);
    assert.ok(r.snowball.months >= r.avalanche.months);
  });

  it("flags never-pays-off when min + extra never cover interest (capped)", () => {
    // $10,000 at 24% ≈ $200/mo interest; $50 min + $50 extra cannot amortize.
    const d: DebtInput = { id: "grow", name: "Growing", balance: 10000, apr: 24, minPayment: 50 };
    const r = simulateStrategy([d], 50, "snowball", 60);
    assert.ok(r);
    assert.equal(r.neverPaysOff, true);
    assert.equal(r.capped, true);
    assert.equal(r.months, 60);
    assert.ok(r.series[r.series.length - 1].total > 10000);
    assert.deepEqual(r.growingAtStart, ["grow"]);
    assert.equal(r.order.length, 0);
  });

  it("still pays off a debt whose minimum is below interest if extra covers the gap", () => {
    // $1,000 at 24% ≈ $20/mo interest; min $10 but extra $50 → $60 payment.
    const d: DebtInput = { id: "gap", name: "Gap", balance: 1000, apr: 24, minPayment: 10 };
    const r = simulateStrategy([d], 50, "avalanche");
    assert.ok(r);
    assert.equal(r.neverPaysOff, false);
    assert.ok(r.months > 0 && r.months < 120);
    assert.deepEqual(r.growingAtStart, ["gap"]);
    assert.equal(r.order[0].id, "gap");
  });

  it("rolls a freed minimum onto the next debt in the same month", () => {
    // Tiny first debt pays off in month 1; leftover min + extra should hit the second debt that month.
    const small: DebtInput = { id: "s", name: "Small", balance: 20, apr: 0, minPayment: 20 };
    const big: DebtInput = { id: "g", name: "Big", balance: 200, apr: 0, minPayment: 10 };
    const r = simulateStrategy([small, big], 0, "snowball");
    assert.ok(r);
    // Month 1: pay 20 on small (done) and 10 on big, leftover 0 (extra 0). No leftover from small because min == balance.
    // With 0% and extra 0, month 1 small is paid, big is 190. Then 20+10=30/mo on big: 190/30 → 7 more months, 8 total.
    assert.equal(r.order[0].id, "s");
    assert.equal(r.order[0].month, 1);
    assert.equal(r.order[1].id, "g");
    assert.equal(r.neverPaysOff, false);
  });

  it("returns null for invalid inputs; zero balances finish immediately", () => {
    assert.equal(simulateStrategy([A], -1, "snowball"), null);
    assert.equal(simulateStrategy([{ ...A, balance: -5 }], 10, "snowball"), null);
    assert.equal(simulateStrategy([], 10, "snowball"), null);
    const z = simulateStrategy([{ ...A, balance: 0 }, { ...B, balance: 0 }], 10, "avalanche");
    assert.ok(z);
    assert.equal(z.months, 0);
    assert.equal(z.totalInterest, 0);
  });

  it("honors the month cap", () => {
    const r = simulateStrategy([A, B], 150, "snowball", 3);
    assert.ok(r);
    assert.equal(r.months, 3);
    assert.equal(r.capped, true);
    assert.equal(r.neverPaysOff, true);
    assert.equal(r.series.length, 4); // month 0 plus 3
  });
});

describe("compareStrategies / downsample / payoff date", () => {
  it("interestDelta and monthsDelta are snowball minus avalanche", () => {
    const r = compareStrategies([A, B], 150);
    assert.ok(r);
    assert.equal(r.interestDelta, cents(r.snowball.totalInterest - r.avalanche.totalInterest));
    assert.equal(r.monthsDelta, r.snowball.months - r.avalanche.months);
  });

  it("downsample keeps first, last, and at most the cap", () => {
    const series = Array.from({ length: 200 }, (_, i) => ({ month: i, total: 200 - i }));
    const out = downsampleSeries(series, 20);
    assert.ok(out.length <= 20);
    assert.equal(out[0].month, 0);
    assert.equal(out[out.length - 1].month, 199);
  });

  it("payoffCalendarMonth adds months across a year boundary", () => {
    assert.deepEqual(payoffCalendarMonth(3, { year: 2026, month: 11 }), { year: 2027, month: 2 });
    assert.deepEqual(payoffCalendarMonth(0, { year: 2026, month: 11 }), { year: 2026, month: 11 });
    assert.deepEqual(payoffCalendarMonth(1, { year: 2026, month: 12 }), { year: 2027, month: 1 });
    assert.equal(payoffCalendarMonth(-1, { year: 2026, month: 11 }), null);
  });
});
