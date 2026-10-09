/**
 * @loan-calculators/core
 *
 * Usage:
 *   import { MortgageCalculator } from '@loan-calculators/core';
 *   import '@loan-calculators/core/styles.css';
 *   <MortgageCalculator projectName="achieve" />
 */

export type { ProjectName } from "./brand";
export {
  PROJECT_NAMES,
  isProjectName,
  resolveProjectName,
  BRAND_TOKENS,
  BrandTheme,
  adaptBrandChromeNote,
} from "./brand";
export type { BrandTokens, BrandThemeProps } from "./brand";

export {
  PersonalLoanCalculator,
  MortgageCalculator,
  HelocCalculator,
  LifeInsuranceCalculator,
  DebtPayoffCalculator,
  ConsolidationOptionsCalculator,
  DtiCalculator,
  CarInsuranceCalculator,
  BudgetCalculator,
  SavingsCalculator,
  RetirementCalculator,
  HomeInsuranceCalculator,
  LoanCalculator,
  AutoLeaseCalculator,
  StudentLoanCalculator,
  CarLoanCalculator,
  RefinanceCalculator,
} from "./calculators";
export type {
  PersonalLoanCalculatorProps,
  MortgageCalculatorProps,
  HelocCalculatorProps,
  LifeInsuranceCalculatorProps,
  DebtPayoffCalculatorProps,
  ConsolidationOptionsCalculatorProps,
  DtiCalculatorProps,
  CarInsuranceCalculatorProps,
  BudgetCalculatorProps,
  SavingsCalculatorProps,
  RetirementCalculatorProps,
  HomeInsuranceCalculatorProps,
  LoanCalculatorProps,
  AutoLeaseCalculatorProps,
  StudentLoanCalculatorProps,
  CarLoanCalculatorProps,
  RefinanceCalculatorProps,
} from "./calculators";

export {
  CalculatorShell,
  DemoBanner,
  Field,
  Segmented,
  Fieldset,
  ResultsPanel,
  CTA,
  SelectField,
  SliderField,
  MoreOptions,
  RateNote,
  DataTable,
} from "./components";

export { resolveRate } from "./rates";
export type { RateKey, RateInfo, MarketRates, ResolvedRate } from "./rates";

export {
  getCalculatorContent,
  getCalculatorConfig,
  getSiteContent,
  contentSourceHint,
} from "./content/load";
export type { CalculatorId, CalculatorContent, CalculatorConfig, SiteContent } from "./content/load";

export * as CalcUtils from "./calc";
