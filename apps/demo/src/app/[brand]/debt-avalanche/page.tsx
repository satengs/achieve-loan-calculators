import { CalculatorTabs } from "@/components/CalculatorTabs";
import { getTechEntry } from "@/lib/tech";
import { BrandedDebtSnowballAvalanche } from "@/components/BrandedCalculators";

export const metadata = {
  title: "Debt Avalanche Calculator",
  description: "See how long it could take to become debt-free if you pay your highest APR first (the avalanche method). Illustrative estimates only — not a plan or a guarantee.",
};

export default function Page() {
  const base = getTechEntry("debt-snowball-avalanche");
  const tech = { ...base, slug: "debt-avalanche", title: "Debt avalanche calculator" };
  return (
    <CalculatorTabs tech={tech} rateRows={[]}>
      <BrandedDebtSnowballAvalanche initialFocus="avalanche" />
    </CalculatorTabs>
  );
}
