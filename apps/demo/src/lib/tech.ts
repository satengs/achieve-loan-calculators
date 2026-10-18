import registry from "@/generated/tech-registry.json";
import type { MarketRates, RateKey } from "@loan-calculators/core";
import { DEMO_CONFIG } from "@/config/demo.config";
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
  // Tab off (production): ship only what the breadcrumb needs, never docs/config/test internals.
  if (!DEMO_CONFIG.showTechnicalTab) return publicStub(e);
  return e;
}

function publicStub(e: TechEntry): TechEntry {
  return {
    slug: e.slug,
    title: e.title,
    component: "",
    componentPath: "",
    calcModules: [],
    rateKeys: [],
    docPath: "",
    docMarkdown: "",
    doc: {
      intro: "",
      lead: "",
      purpose: "",
      formulas: [],
      formulaNotes: "",
      workedExample: [],
      outputs: [],
      outputsNote: "",
      assumptions: [],
      dataSources: "",
      configVsContent: "",
      tests: "",
    },
    inputs: [],
    contentPath: "",
    content: null,
    configPath: "",
    config: null,
    tests: [],
    testCount: 0,
  };
}

export function buildRateRows(
  keys: RateKey[],
  rates: MarketRates,
  errors: Partial<Record<RateKey, string>>,
): TechRateRow[] {
  if (!DEMO_CONFIG.showTechnicalTab) return [];
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
