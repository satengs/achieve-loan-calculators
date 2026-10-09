import { z } from "zod";
import personalLoanContent from "./personal-loan.content.json";
import mortgageContent from "./mortgage.content.json";
import helocContent from "./heloc.content.json";
import lifeContent from "./life-insurance.content.json";
import siteContent from "./site.json";
import debtPayoffContent from "./debt-payoff.content.json";
import consolidationOptionsContent from "./consolidation-options.content.json";
import dtiContent from "./dti.content.json";
import carInsuranceContent from "./car-insurance.content.json";
import budgetContent from "./budget.content.json";
import savingsContent from "./savings.content.json";
import retirementContent from "./retirement.content.json";
import homeInsuranceContent from "./home-insurance.content.json";
import loanContent from "./loan.content.json";
import autoLeaseContent from "./auto-lease.content.json";
import studentLoanContent from "./student-loan.content.json";
import carLoanContent from "./car-loan.content.json";
import refinanceContent from "./refinance.content.json";
import personalLoanConfig from "../config/personal-loan.config.json";
import mortgageConfig from "../config/mortgage.config.json";
import helocConfig from "../config/heloc.config.json";
import lifeConfig from "../config/life-insurance.config.json";
import debtPayoffConfig from "../config/debt-payoff.config.json";
import consolidationOptionsConfig from "../config/consolidation-options.config.json";
import dtiConfig from "../config/dti.config.json";
import carInsuranceConfig from "../config/car-insurance.config.json";
import budgetConfig from "../config/budget.config.json";
import savingsConfig from "../config/savings.config.json";
import retirementConfig from "../config/retirement.config.json";
import homeInsuranceConfig from "../config/home-insurance.config.json";
import loanConfig from "../config/loan.config.json";
import autoLeaseConfig from "../config/auto-lease.config.json";
import studentLoanConfig from "../config/student-loan.config.json";
import carLoanConfig from "../config/car-loan.config.json";
import refinanceConfig from "../config/refinance.config.json";

export type CalculatorId =
  | "personal-loan"
  | "mortgage"
  | "heloc"
  | "life-insurance"
  | "debt-payoff"
  | "consolidation-options"
  | "dti"
  | "car-insurance"
  | "budget"
  | "savings"
  | "retirement"
  | "home-insurance"
  | "loan"
  | "auto-lease"
  | "student-loan"
  | "car-loan"
  | "refinance";

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
  table?: Record<string, unknown>;
  [key: string]: unknown;
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
    section?: string;
  }>;
  sections?: Array<{ id: string; title: string; description?: string }>;
  footer: { note: string };
};

const CONTENT_MAP: Record<CalculatorId, CalculatorContent> = {
  "personal-loan": personalLoanContent as CalculatorContent,
  mortgage: mortgageContent as CalculatorContent,
  heloc: helocContent as CalculatorContent,
  "life-insurance": lifeContent as CalculatorContent,
  "debt-payoff": debtPayoffContent as CalculatorContent,
  "consolidation-options": consolidationOptionsContent as CalculatorContent,
  "dti": dtiContent as CalculatorContent,
  "car-insurance": carInsuranceContent as CalculatorContent,
  "budget": budgetContent as CalculatorContent,
  "savings": savingsContent as CalculatorContent,
  "retirement": retirementContent as CalculatorContent,
  "home-insurance": homeInsuranceContent as CalculatorContent,
  "loan": loanContent as CalculatorContent,
  "auto-lease": autoLeaseContent as CalculatorContent,
  "student-loan": studentLoanContent as CalculatorContent,
  "car-loan": carLoanContent as CalculatorContent,
  "refinance": refinanceContent as CalculatorContent,
};

const CONFIG_MAP: Record<CalculatorId, unknown> = {
  "personal-loan": personalLoanConfig,
  mortgage: mortgageConfig,
  heloc: helocConfig,
  "life-insurance": lifeConfig,
  "debt-payoff": debtPayoffConfig,
  "consolidation-options": consolidationOptionsConfig,
  "dti": dtiConfig,
  "car-insurance": carInsuranceConfig,
  "budget": budgetConfig,
  "savings": savingsConfig,
  "retirement": retirementConfig,
  "home-insurance": homeInsuranceConfig,
  "loan": loanConfig,
  "auto-lease": autoLeaseConfig,
  "student-loan": studentLoanConfig,
  "car-loan": carLoanConfig,
  "refinance": refinanceConfig,
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
