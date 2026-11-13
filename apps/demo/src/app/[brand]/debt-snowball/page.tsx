import { CalculatorTabs } from "@/components/CalculatorTabs";
import { getTechEntry } from "@/lib/tech";
import { BrandedDebtSnowballAvalanche } from "@/components/BrandedCalculators";

export const metadata = {
  title: "Debt Snowball Calculator",
  description: "See how long it could take to become debt-free if you pay your smallest balance first (the snowball method). Illustrative estimates only — not a plan or a guarantee.",
};

export default function Page() {
  const base = getTechEntry("debt-snowball-avalanche");
  const tech = { ...base, slug: "debt-snowball", title: "Debt snowball calculator" };
  return (
    <CalculatorTabs tech={tech} rateRows={[]}>
      <BrandedDebtSnowballAvalanche initialFocus="snowball" />
    </CalculatorTabs>
  );
}
