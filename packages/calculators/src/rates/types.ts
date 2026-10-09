/**
 * Market-rate injection contract. The core package never fetches data itself:
 * hosts (e.g. the demo app) resolve live values server-side and pass them in
 * via the `rates` prop. Missing keys fall back to config JSON defaults.
 */
export type RateKey =
  | "mortgage30"
  | "mortgage15"
  | "personalLoan24"
  | "auto48"
  | "prime"
  | "creditCard"
  | "savings"
  | "inflationYoY";

export type RateInfo = {
  /** Percent value, e.g. 7.4 means 7.4%. */
  value: number;
  /** ISO date (YYYY-MM-DD) of the observation. */
  asOf: string;
  /** Human-readable source label, e.g. "Freddie Mac PMMS via FRED (MORTGAGE30US)". */
  source: string;
  sourceUrl: string;
  seriesId?: string;
};

export type MarketRates = Partial<Record<RateKey, RateInfo>>;

export type ResolvedRate = {
  value: number;
  info: RateInfo | null;
  /** True when the config fallback was used because no live value was supplied. */
  isFallback: boolean;
};

/**
 * Pick a live rate if present and finite, applying an optional transform
 * (e.g. prime + margin); else return the config fallback.
 */
export function resolveRate(
  rates: MarketRates | undefined,
  key: RateKey,
  fallback: number,
  transform?: (v: number) => number,
): ResolvedRate {
  const info = rates?.[key];
  if (info && Number.isFinite(info.value)) {
    const v = transform ? transform(info.value) : info.value;
    if (Number.isFinite(v)) return { value: Math.round(v * 100) / 100, info, isFallback: false };
  }
  return { value: fallback, info: null, isFallback: true };
}
