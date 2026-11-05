import {
  parseFredCsv,
  yoyFromObservations,
  type FredObservation,
  type MarketRates,
  type RateInfo,
  type RateKey,
} from "@loan-calculators/core";

/**
 * Server-side market-rate layer for the demo.
 *
 * Source: FRED (Federal Reserve Bank of St. Louis). If FRED_API_KEY is set we call the
 * official JSON API; otherwise we use the keyless public CSV download endpoint.
 * Results are cached with Next.js fetch revalidation (daily). Any failure simply
 * omits that key so calculators fall back to config JSON values with a visible note.
 * Each FRED request is capped at FRED_TIMEOUT_MS so a slow upstream can't stall a render
 * or build; a timeout is treated like any other failure (config fallback).
 */
export const RATES_REVALIDATE_SECONDS = 86400;
export const FRED_TIMEOUT_MS = 4000;

type SeriesSpec = {
  key: RateKey;
  seriesId: string;
  label: string;
  /** "level" = latest value; "yoy" = % change vs the observation dated exactly 12 months earlier. */
  mode: "level" | "yoy";
};

export const RATE_SERIES: SeriesSpec[] = [
  { key: "mortgage30", seriesId: "MORTGAGE30US", label: "Freddie Mac PMMS 30-yr fixed average (FRED MORTGAGE30US)", mode: "level" },
  { key: "mortgage15", seriesId: "MORTGAGE15US", label: "Freddie Mac PMMS 15-yr fixed average (FRED MORTGAGE15US)", mode: "level" },
  { key: "personalLoan24", seriesId: "TERMCBPER24NS", label: "Federal Reserve G.19, 24-mo personal loan rate at commercial banks (FRED TERMCBPER24NS)", mode: "level" },
  { key: "auto48", seriesId: "TERMCBAUTO48NS", label: "Federal Reserve G.19, 48-mo new car loan rate at commercial banks (FRED TERMCBAUTO48NS)", mode: "level" },
  { key: "prime", seriesId: "DPRIME", label: "Bank prime loan rate (FRED DPRIME)", mode: "level" },
  { key: "creditCard", seriesId: "TERMCBCCALLNS", label: "Federal Reserve G.19, credit card plan rate, all accounts (FRED TERMCBCCALLNS)", mode: "level" },
  { key: "savings", seriesId: "SNDR", label: "FDIC national deposit rate, savings (FRED SNDR)", mode: "level" },
  { key: "inflationYoY", seriesId: "CPIAUCSL", label: "BLS CPI-U, year-over-year change vs same month prior year (FRED CPIAUCSL)", mode: "yoy" },
];

type Obs = FredObservation;

function seriesUrl(id: string) {
  return `https://fred.stlouisfed.org/series/${id}`;
}

async function fetchObservations(seriesId: string): Promise<Obs[]> {
  const key = process.env.FRED_API_KEY;
  const init = {
    next: { revalidate: RATES_REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(FRED_TIMEOUT_MS),
  } as RequestInit;
  if (key) {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${encodeURIComponent(seriesId)}&api_key=${encodeURIComponent(key)}&file_type=json&sort_order=desc&limit=40`;
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`FRED API ${seriesId} ${res.status}`);
    const json = (await res.json()) as { observations?: Array<{ date: string; value: string }> };
    return (json.observations || [])
      .map((o) => ({ date: o.date, value: Number(o.value) }))
      .filter((o) => Number.isFinite(o.value))
      .reverse();
  }
  const res = await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(seriesId)}`, init);
  if (!res.ok) throw new Error(`FRED CSV ${seriesId} ${res.status}`);
  return parseFredCsv(await res.text());
}

async function resolveSeries(spec: SeriesSpec): Promise<RateInfo | null> {
  const obs = await fetchObservations(spec.seriesId);
  if (obs.length === 0) return null;
  const last = obs[obs.length - 1];
  let value = last.value;
  if (spec.mode === "yoy") {
    // Match by date (not row offset): FRED gap rows (e.g. CPI 2025-10) are dropped on parse.
    const yoy = yoyFromObservations(obs);
    if (!yoy) return null;
    value = yoy.value;
  }
  return {
    value,
    asOf: last.date,
    source: spec.label,
    sourceUrl: seriesUrl(spec.seriesId),
    seriesId: spec.seriesId,
  };
}

export type RatesPayload = {
  rates: MarketRates;
  errors: Partial<Record<RateKey, string>>;
  mode: "fred-api" | "fred-csv";
  fetchedAt: string;
};

export async function getMarketRates(keys?: RateKey[]): Promise<RatesPayload> {
  const specs = keys ? RATE_SERIES.filter((s) => keys.includes(s.key)) : RATE_SERIES;
  const settled = await Promise.allSettled(specs.map((s) => resolveSeries(s)));
  const rates: MarketRates = {};
  const errors: Partial<Record<RateKey, string>> = {};
  settled.forEach((r, i) => {
    const key = specs[i].key;
    if (r.status === "fulfilled" && r.value) rates[key] = r.value;
    else errors[key] = r.status === "rejected" ? String((r.reason as Error)?.message || r.reason) : "no data";
  });
  return {
    rates,
    errors,
    mode: process.env.FRED_API_KEY ? "fred-api" : "fred-csv",
    fetchedAt: new Date().toISOString(),
  };
}
