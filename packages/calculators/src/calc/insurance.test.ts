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
