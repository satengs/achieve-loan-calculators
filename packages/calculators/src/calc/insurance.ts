/**
 * Transparent factor-table estimator used by the car and home insurance demos.
 * annual = base × Π(factors) + Σ(addOns). Illustrative only — not a quote.
 */
export function factorEstimate(base: number, factors: number[], addOns: number[] = []) {
  if (!Number.isFinite(base) || base < 0) return null;
  let product = 1;
  for (const f of factors) {
    if (!Number.isFinite(f) || f < 0) return null;
    product *= f;
  }
  let extras = 0;
  for (const a of addOns) {
    if (!Number.isFinite(a) || a < 0) return null;
    extras += a;
  }
  const annual = base * product + extras;
  return { annual, monthly: annual / 12, multiplier: product, addOns: extras, base };
}

/** Base for home insurance: dwelling coverage × rate per $1,000. */
export function perThousandBase(coverage: number, ratePerThousand: number): number {
  if (!Number.isFinite(coverage) || !Number.isFinite(ratePerThousand) || coverage < 0 || ratePerThousand < 0) return NaN;
  return (coverage / 1000) * ratePerThousand;
}

/** Look up a factor by option value from a config table; unknown → 1. */
export function lookupFactor(table: Array<{ value: string; factor: number }> | undefined, value: string): number {
  const hit = table?.find((o) => o.value === value);
  return hit && Number.isFinite(hit.factor) ? hit.factor : 1;
}
