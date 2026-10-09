import { CalculatorTabs } from "@/components/CalculatorTabs";
import { getTechEntry } from "@/lib/tech";
import { BrandedDti } from "@/components/BrandedCalculators";

export const metadata = {
  title: "Debt-to-Income Ratio Calculator",
  description: "Calculate your DTI with neutral band explanations.",
};

export default function Page() {
  const tech = getTechEntry("dti");
  return (
    <CalculatorTabs tech={tech} rateRows={[]}>
      <BrandedDti />
    </CalculatorTabs>
  );
}
