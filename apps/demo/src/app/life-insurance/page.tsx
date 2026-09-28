import { LifeInsuranceCalculator } from "@loan-calculators/core";

const BRAND = process.env.NEXT_PUBLIC_BRAND || "achieve";

export const metadata = {
  title: "Life Insurance Coverage Estimator",
  description: "Illustrative coverage need estimate — not a quote or offer.",
};

export default function Page() {
  return <LifeInsuranceCalculator projectName={BRAND} />;
}
