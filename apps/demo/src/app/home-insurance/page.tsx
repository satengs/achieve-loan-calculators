import { CalculatorTabs } from "@/components/CalculatorTabs";
import { getTechEntry } from "@/lib/tech";
import { BrandedHomeInsurance } from "@/components/BrandedCalculators";

export const metadata = {
  title: "Home Insurance Cost Estimator",
  description: "Rough, illustrative homeowners insurance estimate — not a quote.",
};

export default function Page() {
  const tech = getTechEntry("home-insurance");
  return (
    <CalculatorTabs tech={tech} rateRows={[]}>
      <BrandedHomeInsurance />
    </CalculatorTabs>
  );
}
