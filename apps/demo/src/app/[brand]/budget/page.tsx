import { CalculatorTabs } from "@/components/CalculatorTabs";
import { getTechEntry } from "@/lib/tech";
import { BrandedBudget } from "@/components/BrandedCalculators";

export const metadata = {
  title: "Monthly Budget Calculator",
  description: "Monthly budget with a 50/30/20 comparison.",
};

export default function Page() {
  const tech = getTechEntry("budget");
  return (
    <CalculatorTabs tech={tech} rateRows={[]}>
      <BrandedBudget />
    </CalculatorTabs>
  );
}
