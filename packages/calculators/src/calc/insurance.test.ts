import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { factorEstimate, lookupFactor, perThousandBase } from "./insurance";
import { lifePremiumEstimate } from "./life";

describe("insurance factor estimator", () => {
  it("multiplies factors and adds add-ons", () => {
    const r = factorEstimate(1000, [1.2, 0.9], [50, 25])!;
    assert.ok(Math.abs(r.annual - 1155) < 1e-9);
    assert.ok(Math.abs(r.monthly - 96.25) < 1e-9);
  });
  it("zero base yields only add-ons", () => {
    assert.equal(factorEstimate(0, [2], [10])!.annual, 10);
  });
  it("invalid → null", () => {
    assert.equal(factorEstimate(-1, [1]), null);
    assert.equal(factorEstimate(100, [NaN]), null);
    assert.equal(factorEstimate(100, [1], [-5]), null);
  });
  it("per-thousand base and lookup", () => {
    assert.equal(perThousandBase(300000, 4), 1200);
    assert.ok(Number.isNaN(perThousandBase(-1, 4)));
    assert.equal(lookupFactor([{ value: "a", factor: 1.3 }], "a"), 1.3);
    assert.equal(lookupFactor([{ value: "a", factor: 1.3 }], "zzz"), 1);
  });
  it("life premium per $1,000", () => {
    assert.deepEqual(lifePremiumEstimate(500000, 1.2), { annual: 600, monthly: 50 });
    assert.equal(lifePremiumEstimate(-1, 1), null);
    assert.equal(lifePremiumEstimate(1000, 0)!.annual, 0);
  });
});

import { lifePremiumRatePer1000, termMultiplierFor } from "./life";

describe("life premium term multiplier (M4)", () => {
  const table = { "10": 0.85, "20": 1.0, "30": 1.45 };
  it("uses table points exactly", () => {
    assert.equal(termMultiplierFor(10, table), 0.85);
    assert.equal(termMultiplierFor(20, table), 1);
    assert.equal(termMultiplierFor(30, table), 1.45);
  });
  it("interpolates in-between terms instead of silently using ×1", () => {
    assert.ok(Math.abs(termMultiplierFor(15, table) - 0.925) < 1e-9);
    assert.ok(Math.abs(termMultiplierFor(25, table) - 1.225) < 1e-9);
  });
  it("clamps outside the table; empty table → 1", () => {
    assert.equal(termMultiplierFor(5, table), 0.85);
    assert.equal(termMultiplierFor(40, table), 1.45);
    assert.equal(termMultiplierFor(20, {}), 1);
  });
  it("rate per $1k = age × term × tobacco; unknown age → null", () => {
    const t = { premiumRatePer1000ByAge: { "30-39": 0.75 }, termMultiplier: table, tobaccoMultiplier: 2.5 };
    assert.equal(lifePremiumRatePer1000({ ageBand: "30-39", termYears: 20, tobacco: false }, t), 0.75);
    assert.ok(Math.abs(lifePremiumRatePer1000({ ageBand: "30-39", termYears: 30, tobacco: true }, t)! - 0.75 * 1.45 * 2.5) < 1e-9);
    assert.equal(lifePremiumRatePer1000({ ageBand: "90-99", termYears: 20, tobacco: false }, t), null);
  });
});
