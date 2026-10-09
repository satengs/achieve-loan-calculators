import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dtiBand, dtiRatio, estimatedCardMinimum } from "./dti";

describe("dti", () => {
  it("matches Achieve example ($1,980 / $6,000 = 33%)", () => {
    assert.equal(dtiRatio(6000, 1980), 33);
    assert.equal(dtiBand(33, 35, 43), "good");
  });
  it("bands at boundaries", () => {
    assert.equal(dtiBand(35, 35, 43), "good");
    assert.equal(dtiBand(36, 35, 43), "fair");
    assert.equal(dtiBand(43, 35, 43), "fair");
    assert.equal(dtiBand(44, 35, 43), "high");
  });
  it("zero debts → 0%; zero/invalid income → NaN", () => {
    assert.equal(dtiRatio(5000, 0), 0);
    assert.ok(Number.isNaN(dtiRatio(0, 100)));
    assert.ok(Number.isNaN(dtiRatio(5000, -1)));
    assert.equal(dtiBand(NaN, 35, 43), null);
  });
  it("card minimum estimate", () => {
    assert.equal(estimatedCardMinimum(5000, 3), 150);
    assert.ok(Number.isNaN(estimatedCardMinimum(-1, 3)));
  });
});
