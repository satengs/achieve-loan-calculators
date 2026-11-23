import type { ComponentType } from "react";
import * as C from "../calculators";

type AnyProps = Record<string, unknown>;

export type CalcCase = {
  name: string;
  id: string;
  Component: ComponentType<AnyProps>;
  /** A numeric input key and the input id it renders under (for `defaults` prefill checks). */
  prefill: { key: string; inputId: string };
  /** Markup that only appears in this calculator's breakdown section (null = nothing to hide). */
  breakdown: RegExp | null;
};

const c = (Component: unknown) => Component as ComponentType<AnyProps>;
const AMORT = /lc-amort-card/;
const SUMMARY = /lc-summary/;

export const CALCS: CalcCase[] = [
  { name: "PersonalLoanCalculator", id: "personal-loan", Component: c(C.PersonalLoanCalculator), prefill: { key: "loanAmount", inputId: "loan-amount" }, breakdown: AMORT },
  { name: "MortgageCalculator", id: "mortgage", Component: c(C.MortgageCalculator), prefill: { key: "homePrice", inputId: "home-price" }, breakdown: SUMMARY },
  { name: "HelocCalculator", id: "heloc", Component: c(C.HelocCalculator), prefill: { key: "homeValue", inputId: "home-value" }, breakdown: SUMMARY },
  { name: "LifeInsuranceCalculator", id: "life-insurance", Component: c(C.LifeInsuranceCalculator), prefill: { key: "annualIncome", inputId: "annual-income" }, breakdown: /<li><span>[^<]*(final|education)/i },
  { name: "DebtPayoffCalculator", id: "debt-payoff", Component: c(C.DebtPayoffCalculator), prefill: { key: "apr", inputId: "dp-apr" }, breakdown: AMORT },
  { name: "ConsolidationOptionsCalculator", id: "consolidation-options", Component: c(C.ConsolidationOptionsCalculator), prefill: { key: "plTermMonths", inputId: "co-plTermMonths" }, breakdown: AMORT },
  { name: "DtiCalculator", id: "dti", Component: c(C.DtiCalculator), prefill: { key: "monthlyIncome", inputId: "dti-monthlyIncome" }, breakdown: null },
  { name: "CarInsuranceCalculator", id: "car-insurance", Component: c(C.CarInsuranceCalculator), prefill: { key: "basePremium", inputId: "ci-basePremium" }, breakdown: null },
  { name: "BudgetCalculator", id: "budget", Component: c(C.BudgetCalculator), prefill: { key: "netIncome", inputId: "bd-netIncome" }, breakdown: AMORT },
  { name: "SavingsCalculator", id: "savings", Component: c(C.SavingsCalculator), prefill: { key: "initial", inputId: "sv-initial" }, breakdown: AMORT },
  { name: "RetirementCalculator", id: "retirement", Component: c(C.RetirementCalculator), prefill: { key: "savings", inputId: "rt-savings" }, breakdown: null },
  { name: "HomeInsuranceCalculator", id: "home-insurance", Component: c(C.HomeInsuranceCalculator), prefill: { key: "dwelling", inputId: "hi-dwelling" }, breakdown: null },
  { name: "LoanCalculator", id: "loan", Component: c(C.LoanCalculator), prefill: { key: "loanAmount", inputId: "ln-loanAmount" }, breakdown: AMORT },
  { name: "AutoLeaseCalculator", id: "auto-lease", Component: c(C.AutoLeaseCalculator), prefill: { key: "msrp", inputId: "al-msrp" }, breakdown: SUMMARY },
  { name: "StudentLoanCalculator", id: "student-loan", Component: c(C.StudentLoanCalculator), prefill: { key: "balance", inputId: "sl-balance" }, breakdown: AMORT },
  { name: "CarLoanCalculator", id: "car-loan", Component: c(C.CarLoanCalculator), prefill: { key: "price", inputId: "cl-price" }, breakdown: AMORT },
  { name: "RefinanceCalculator", id: "refinance", Component: c(C.RefinanceCalculator), prefill: { key: "balance", inputId: "rf-balance" }, breakdown: SUMMARY },
  { name: "DebtSnowballAvalancheCalculator", id: "debt-snowball-avalanche", Component: c(C.DebtSnowballAvalancheCalculator), prefill: { key: "extraMonthly", inputId: "dsa-extraMonthly" }, breakdown: /lc-payoff-orders/ },
  { name: "AprBlindSpotCalculator", id: "apr-blind-spot", Component: c(C.AprBlindSpotCalculator), prefill: { key: "balance", inputId: "abs-balance" }, breakdown: SUMMARY },
];
