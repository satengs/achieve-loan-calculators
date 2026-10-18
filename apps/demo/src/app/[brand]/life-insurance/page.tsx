import { CalculatorTabs } from "@/components/CalculatorTabs";
import { getTechEntry } from "@/lib/tech";
import { BrandedLifeInsurance } from "@/components/BrandedCalculators";

export const metadata = {
  title: "Life Insurance Coverage Estimator",
  description: "Illustrative coverage need estimate — not a quote or offer.",
};

export default function Page() {
  const tech = getTechEntry("life-insurance");
  return (
    <CalculatorTabs tech={tech} rateRows={[]}>
      <BrandedLifeInsurance />
    </CalculatorTabs>
  );
}
