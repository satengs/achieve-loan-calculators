import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseFredCsv, sameDayPriorYear, yoyFromObservations } from "./fred";

// Real CPIAUCSL rows (FRED), including the 2025-10-01 gap row with no value.
const CPI_CSV = `observation_date,CPIAUCSL
2025-08-01,323.291
2025-09-01,324.245
2025-10-01,
2025-11-01,325.063
2025-12-01,326.031
2026-01-01,326.588
2026-02-01,327.460
2026-03-01,330.293
2026-04-01,332.407
2026-05-01,333.979
2026-06-01,332.568
2026-07-01,332.813
2026-08-01,334.131
2026-09-01,336.298
`;

describe("parseFredCsv", () => {
  it("skips blank and '.' values (gap rows)", () => {
    const obs = parseFredCsv(CPI_CSV);
    assert.equal(obs.length, 13);
    assert.ok(!obs.some((o) => o.date === "2025-10-01"));
    assert.deepEqual(parseFredCsv("observation_date,X\n2026-01-01,.\n2026-02-01,1.5\n"), [{ date: "2026-02-01", value: 1.5 }]);
  });
  it("handles CRLF and junk rows", () => {
    assert.deepEqual(parseFredCsv("d,X\r\n2026-01-01,2\r\nbad,row\r\n"), [{ date: "2026-01-01", value: 2 }]);
  });
});

describe("yoyFromObservations", () => {
  it("matches the observation dated exactly 12 months earlier, even across a gap row", () => {
    const r = yoyFromObservations(parseFredCsv(CPI_CSV));
    // 336.298 / 324.245 − 1 = 3.717% (row-offset logic wrongly used 2025-08 → 4.02%)
    assert.equal(r?.value, 3.72);
    assert.equal(r?.asOf, "2026-09-01");
    assert.equal(r?.priorDate, "2025-09-01");
  });
  it("returns null (→ config fallback) when the prior-year observation is the gap", () => {
    const upToOct = parseFredCsv(CPI_CSV).filter((o) => o.date <= "2026-08-01");
    upToOct.push({ date: "2026-10-01", value: 337 });
    assert.equal(yoyFromObservations(upToOct), null);
  });
  it("is order-independent (FRED API desc order)", () => {
    assert.equal(yoyFromObservations(parseFredCsv(CPI_CSV).reverse())?.value, 3.72);
  });
  it("null on empty / non-positive prior", () => {
    assert.equal(yoyFromObservations([]), null);
    assert.equal(yoyFromObservations([{ date: "2025-01-01", value: 0 }, { date: "2026-01-01", value: 5 }]), null);
  });
  it("sameDayPriorYear", () => {
    assert.equal(sameDayPriorYear("2026-09-01"), "2025-09-01");
    assert.equal(sameDayPriorYear("nope"), null);
  });
});
