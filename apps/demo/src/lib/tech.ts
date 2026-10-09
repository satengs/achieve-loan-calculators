import registry from "@/generated/tech-registry.json";
import type { MarketRates, RateKey } from "@loan-calculators/core";
import { RATE_SERIES } from "./rates";

export type TechTest = { file: string; describe: string; count: number; titles: string[] };

export type TechEntry = {
  slug: string;
  title: string;
  component: string;
  componentPath: string;
  calcModules: string[];
  rateKeys: RateKey[];
  docPath: string;
  docMarkdown: string;
  doc: {
    intro: string;
    lead: string;
    purpose: string;
    formulas: Array<{ label: string; expr: string }>;
    formulaNotes: string;
    workedExample: string[];
    outputs: string[];
    outputsNote: string;
    assumptions: string[];
    dataSources: string;
    configVsContent: string;
    tests: string;
  };
  inputs: Array<{
    key: string;
    label: string;
    type: string;
    default: unknown;
    min: number | null;
    max: number | null;
    allowZero: boolean | null;
    unit: string | null;
    options: string[] | null;
    configKey: string;
  }>;
  contentPath: string;
  content: unknown;
  configPath: string;
  config: unknown;
  tests: TechTest[];
  testCount: number;
};

export type TechRateRow = {
  key: RateKey;
  seriesId: string;
  label: string;
  sourceUrl: string;
  status: "live" | "fallback";
  value?: number;
  asOf?: string;
  error?: string;
};

const entries = (registry as unknown as { entries: Record<string, TechEntry> }).entries;

/** Server-only: return just this calculator's slice so pages don't ship all 17 docs. */
export function getTechEntry(slug: string): TechEntry {
  const e = entries[slug];
  if (!e) throw new Error(`No technical registry entry for "${slug}" — run npm run gen:tech -w @loan-calculators/demo`);
  return e;
}

export function buildRateRows(
  keys: RateKey[],
  rates: MarketRates,
  errors: Partial<Record<RateKey, string>>,
): TechRateRow[] {
  return keys.map((key) => {
    const spec = RATE_SERIES.find((s) => s.key === key);
    const live = rates[key];
    const seriesId = spec?.seriesId ?? key;
    return {
      key,
      seriesId,
      label: spec?.label ?? key,
      sourceUrl: live?.sourceUrl ?? `https://fred.stlouisfed.org/series/${seriesId}`,
      status: live ? "live" : "fallback",
      value: live?.value,
      asOf: live?.asOf,
      error: live ? undefined : errors[key] ?? "not fetched",
    };
  });
}
