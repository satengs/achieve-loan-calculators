"use client";

import {
  HelocCalculator,
  LifeInsuranceCalculator,
  MortgageCalculator,
  PersonalLoanCalculator,
} from "@loan-calculators/core";
import { useBrand } from "./BrandProvider";

export function BrandedPersonalLoan() {
  const { brand } = useBrand();
  return <PersonalLoanCalculator projectName={brand} />;
}

export function BrandedMortgage() {
  const { brand } = useBrand();
  return <MortgageCalculator projectName={brand} />;
}

export function BrandedHeloc() {
  const { brand } = useBrand();
  return <HelocCalculator projectName={brand} />;
}

export function BrandedLifeInsurance() {
  const { brand } = useBrand();
  return <LifeInsuranceCalculator projectName={brand} />;
}
