"use client";

import {
  AutoLeaseCalculator,
  BudgetCalculator,
  CarInsuranceCalculator,
  CarLoanCalculator,
  ConsolidationOptionsCalculator,
  DebtPayoffCalculator,
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
 * Client wrappers: read the active brand from context and pass server-fetched
 * market rates through to the pure package components.
 */
export function BrandedPersonalLoan({ rates }: RatesProp) {
  const { brand } = useBrand();
  return <PersonalLoanCalculator projectName={brand} rates={rates} />;
}

export function BrandedMortgage({ rates }: RatesProp) {
  const { brand } = useBrand();
  return <MortgageCalculator projectName={brand} rates={rates} />;
}

export function BrandedHeloc({ rates }: RatesProp) {
  const { brand } = useBrand();
  return <HelocCalculator projectName={brand} rates={rates} />;
}

export function BrandedLifeInsurance() {
  const { brand } = useBrand();
  return <LifeInsuranceCalculator projectName={brand} />;
}

export function BrandedDebtPayoff({ rates }: RatesProp) {
  const { brand } = useBrand();
  return <DebtPayoffCalculator projectName={brand} rates={rates} />;
}

export function BrandedConsolidationOptions({ rates }: RatesProp) {
  const { brand } = useBrand();
  return <ConsolidationOptionsCalculator projectName={brand} rates={rates} />;
}

export function BrandedDti() {
  const { brand } = useBrand();
  return <DtiCalculator projectName={brand} />;
}

export function BrandedCarInsurance() {
  const { brand } = useBrand();
  return <CarInsuranceCalculator projectName={brand} />;
}

export function BrandedBudget() {
  const { brand } = useBrand();
  return <BudgetCalculator projectName={brand} />;
}

export function BrandedSavings({ rates }: RatesProp) {
  const { brand } = useBrand();
  return <SavingsCalculator projectName={brand} rates={rates} />;
}

export function BrandedRetirement({ rates }: RatesProp) {
  const { brand } = useBrand();
  return <RetirementCalculator projectName={brand} rates={rates} />;
}

export function BrandedHomeInsurance() {
  const { brand } = useBrand();
  return <HomeInsuranceCalculator projectName={brand} />;
}

export function BrandedLoan({ rates }: RatesProp) {
  const { brand } = useBrand();
  return <LoanCalculator projectName={brand} rates={rates} />;
}

export function BrandedAutoLease({ rates }: RatesProp) {
  const { brand } = useBrand();
  return <AutoLeaseCalculator projectName={brand} rates={rates} />;
}

export function BrandedStudentLoan() {
  const { brand } = useBrand();
  return <StudentLoanCalculator projectName={brand} />;
}

export function BrandedCarLoan({ rates }: RatesProp) {
  const { brand } = useBrand();
  return <CarLoanCalculator projectName={brand} rates={rates} />;
}

export function BrandedRefinance({ rates }: RatesProp) {
  const { brand } = useBrand();
  return <RefinanceCalculator projectName={brand} rates={rates} />;
}
