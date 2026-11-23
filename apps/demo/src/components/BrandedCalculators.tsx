"use client";

import {
  AutoLeaseCalculator,
  BudgetCalculator,
  CarInsuranceCalculator,
  CarLoanCalculator,
  ConsolidationOptionsCalculator,
  DebtPayoffCalculator,
  DebtSnowballAvalancheCalculator,
  AprBlindSpotCalculator,
  DtiCalculator,
  HelocCalculator,
  HomeInsuranceCalculator,
  LifeInsuranceCalculator,
  LoanCalculator,
  MortgageCalculator,
  PersonalLoanCalculator,
  RefinanceCalculator,
  RetirementCalculator,
  SavingsCalculator,
  StudentLoanCalculator,
  type MarketRates,
} from "@loan-calculators/core";
import { useBrand } from "./BrandProvider";

type RatesProp = { rates?: MarketRates };

/**
 * Demo-site props for every calculator. Package imports default to showDemoBanner={false}
 * (no "sample rates / demo only" notices on live pages); the demo opts in. The demo page has
 * no other <h1>, so the calculator title is the page heading here.
 */
export const DEMO_CALCULATOR_PROPS = { showDemoBanner: true, headingLevel: "h1" } as const;

/**
 * Client wrappers: read the active brand from context and pass server-fetched
 * market rates through to the pure package components.
 */
export function BrandedPersonalLoan({ rates }: RatesProp) {
  const { brand } = useBrand();
  return <PersonalLoanCalculator {...DEMO_CALCULATOR_PROPS} projectName={brand} rates={rates} />;
}

export function BrandedMortgage({ rates }: RatesProp) {
  const { brand } = useBrand();
  return <MortgageCalculator {...DEMO_CALCULATOR_PROPS} projectName={brand} rates={rates} />;
}

export function BrandedHeloc({ rates }: RatesProp) {
  const { brand } = useBrand();
  return <HelocCalculator {...DEMO_CALCULATOR_PROPS} projectName={brand} rates={rates} />;
}

export function BrandedLifeInsurance() {
  const { brand } = useBrand();
  return <LifeInsuranceCalculator {...DEMO_CALCULATOR_PROPS} projectName={brand} />;
}

export function BrandedDebtPayoff({ rates }: RatesProp) {
  const { brand } = useBrand();
  return <DebtPayoffCalculator {...DEMO_CALCULATOR_PROPS} projectName={brand} rates={rates} />;
}

export function BrandedDebtSnowballAvalanche({
  initialFocus,
}: {
  initialFocus?: "compare" | "snowball" | "avalanche";
} = {}) {
  const { brand } = useBrand();
  return <DebtSnowballAvalancheCalculator {...DEMO_CALCULATOR_PROPS} projectName={brand} initialFocus={initialFocus} />;
}

export function BrandedAprBlindSpot({ rates }: RatesProp) {
  const { brand } = useBrand();
  return <AprBlindSpotCalculator {...DEMO_CALCULATOR_PROPS} projectName={brand} rates={rates} />;
}

export function BrandedConsolidationOptions({ rates }: RatesProp) {
  const { brand } = useBrand();
  return <ConsolidationOptionsCalculator {...DEMO_CALCULATOR_PROPS} projectName={brand} rates={rates} />;
}

export function BrandedDti() {
  const { brand } = useBrand();
  return <DtiCalculator {...DEMO_CALCULATOR_PROPS} projectName={brand} />;
}

export function BrandedCarInsurance() {
  const { brand } = useBrand();
  return <CarInsuranceCalculator {...DEMO_CALCULATOR_PROPS} projectName={brand} />;
}

export function BrandedBudget() {
  const { brand } = useBrand();
  return <BudgetCalculator {...DEMO_CALCULATOR_PROPS} projectName={brand} />;
}

export function BrandedSavings({ rates }: RatesProp) {
  const { brand } = useBrand();
  return <SavingsCalculator {...DEMO_CALCULATOR_PROPS} projectName={brand} rates={rates} />;
}

export function BrandedRetirement({ rates }: RatesProp) {
  const { brand } = useBrand();
  return <RetirementCalculator {...DEMO_CALCULATOR_PROPS} projectName={brand} rates={rates} />;
}

export function BrandedHomeInsurance() {
  const { brand } = useBrand();
  return <HomeInsuranceCalculator {...DEMO_CALCULATOR_PROPS} projectName={brand} />;
}

export function BrandedLoan({ rates }: RatesProp) {
  const { brand } = useBrand();
  return <LoanCalculator {...DEMO_CALCULATOR_PROPS} projectName={brand} rates={rates} />;
}

export function BrandedAutoLease({ rates }: RatesProp) {
  const { brand } = useBrand();
  return <AutoLeaseCalculator {...DEMO_CALCULATOR_PROPS} projectName={brand} rates={rates} />;
}

export function BrandedStudentLoan() {
  const { brand } = useBrand();
  return <StudentLoanCalculator {...DEMO_CALCULATOR_PROPS} projectName={brand} />;
}

export function BrandedCarLoan({ rates }: RatesProp) {
  const { brand } = useBrand();
  return <CarLoanCalculator {...DEMO_CALCULATOR_PROPS} projectName={brand} rates={rates} />;
}

export function BrandedRefinance({ rates }: RatesProp) {
  const { brand } = useBrand();
  return <RefinanceCalculator {...DEMO_CALCULATOR_PROPS} projectName={brand} rates={rates} />;
}
