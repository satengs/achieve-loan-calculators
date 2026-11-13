import { CalculatorTabs } from "@/components/CalculatorTabs";
import { getTechEntry } from "@/lib/tech";
import { BrandedDebtSnowballAvalanche } from "@/components/BrandedCalculators";

export const metadata = {
  title: "Debt Snowball vs Avalanche Calculator",
  description: "Compare paying smallest balances first (snowball) with paying highest APRs first (avalanche). Illustrative estimates only — not a plan or a guarantee.",
};

export default function Page() {
  const tech = getTechEntry("debt-snowball-avalanche");
  return (
    <CalculatorTabs tech={tech} rateRows={[]}>
      <BrandedDebtSnowballAvalanche />
    </CalculatorTabs>
  );
}
