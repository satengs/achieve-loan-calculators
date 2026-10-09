import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveRate } from "./types";

describe("resolveRate", () => {
  const info = { value: 7, asOf: "2026-10-01", source: "FRED DPRIME", sourceUrl: "https://fred.stlouisfed.org/series/DPRIME" };
  it("uses live value with transform", () => {
    const r = resolveRate({ prime: info }, "prime", 8.5, (v) => v + 1.25);
    assert.equal(r.value, 8.25);
    assert.equal(r.isFallback, false);
    assert.equal(r.info?.asOf, "2026-10-01");
  });
  it("falls back when missing or non-finite", () => {
    assert.deepEqual(resolveRate(undefined, "prime", 8.5), { value: 8.5, info: null, isFallback: true });
    assert.equal(resolveRate({ prime: { ...info, value: NaN } }, "prime", 8.5).isFallback, true);
  });
});
