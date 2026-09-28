import { z } from "zod";
import personalLoanContent from "./personal-loan.content.json";
import mortgageContent from "./mortgage.content.json";
import helocContent from "./heloc.content.json";
import lifeContent from "./life-insurance.content.json";
import siteContent from "./site.json";
import personalLoanConfig from "../config/personal-loan.config.json";
import mortgageConfig from "../config/mortgage.config.json";
import helocConfig from "../config/heloc.config.json";
import lifeConfig from "../config/life-insurance.config.json";

export type CalculatorId = "personal-loan" | "mortgage" | "heloc" | "life-insurance";

const rangeSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  label: z.string().optional(),
  allowZero: z.boolean().optional(),
});

export const calculatorConfigSchema = z.object({
  id: z.string(),
  locale: z.string().default("en-US"),
  currency: z.string().default("USD"),
  defaults: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  validation: z.record(z.string(), rangeSchema),
  termPresets: z.array(z.number()).optional(),
  features: z.record(z.string(), z.unknown()).optional(),
  cta: z
    .object({
      enabled: z.boolean().optional(),
      preventDefault: z.boolean().optional(),
    })
    .optional(),
});

export type CalculatorConfig = z.infer<typeof calculatorConfigSchema>;

/** Loose content shape — copy only; never render as HTML. */
export type CalculatorContent = {
  meta: { title: string; description: string };
  header: { eyebrow: string; title: string; intro: string };
  demoBanner: { icon?: string; strong: string; body: string };
  form: { heading: string; fields: Record<string, unknown> };
  results: Record<string, unknown>;
  cta: { label: string; href: string; note: string };
  footer: { note: string };
  amortization?: Record<string, unknown>;
  validationMessages?: Record<string, string>;
};

export type SiteContent = {
  meta: { title: string; description: string };
  header: { eyebrow: string; title: string; intro: string };
  demoBanner: { icon?: string; strong: string; body: string };
  cards: Array<{
    id: string;
    href: string;
    eyebrow: string;
    title: string;
    description: string;
    linkLabel: string;
  }>;
  footer: { note: string };
};

const CONTENT_MAP: Record<CalculatorId, CalculatorContent> = {
  "personal-loan": personalLoanContent as CalculatorContent,
  mortgage: mortgageContent as CalculatorContent,
  heloc: helocContent as CalculatorContent,
  "life-insurance": lifeContent as CalculatorContent,
};

const CONFIG_MAP: Record<CalculatorId, unknown> = {
  "personal-loan": personalLoanConfig,
  mortgage: mortgageConfig,
  heloc: helocConfig,
  "life-insurance": lifeConfig,
};

export function getCalculatorContent(id: CalculatorId): CalculatorContent {
  return CONTENT_MAP[id];
}

export function getCalculatorConfig(id: CalculatorId): CalculatorConfig {
  return calculatorConfigSchema.parse(CONFIG_MAP[id]);
}

export function getSiteContent(): SiteContent {
  return siteContent as SiteContent;
}

/** Path helper for future Contentful swap — today returns local bundle keys. */
export function contentSourceHint(id: CalculatorId): string {
  return `local:packages/calculators/src/content/${id}.content.json`;
}
