import { CalculatorTabs } from "@/components/CalculatorTabs";
import { getTechEntry } from "@/lib/tech";
import { BrandedCarInsurance } from "@/components/BrandedCalculators";

export const metadata = {
  title: "Car Insurance Cost Estimator",
  description: "Rough, illustrative car insurance estimate — not a quote.",
};

export default function Page() {
  const tech = getTechEntry("car-insurance");
  return (
    <CalculatorTabs tech={tech} rateRows={[]}>
      <BrandedCarInsurance />
    </CalculatorTabs>
  );
}
