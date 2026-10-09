import { CalculatorTabs } from "@/components/CalculatorTabs";
import { buildRateRows, getTechEntry } from "@/lib/tech";
import { BrandedPersonalLoan } from "@/components/BrandedCalculators";
import { getMarketRates } from "@/lib/rates";

export const metadata = {
  title: "Personal Loan Calculator",
  description: "Estimate monthly payments. Sample rates are illustrative only — not offers.",
};

/** Daily ISR: live market rates are fetched server-side and cached for 24h. */
export const revalidate = 86400;

export default async function Page() {
  const { rates, errors } = await getMarketRates(["personalLoan24"]);
  const tech = getTechEntry("personal-loan");
  return (
    <CalculatorTabs tech={tech} rateRows={buildRateRows(tech.rateKeys, rates, errors)}>
      <BrandedPersonalLoan rates={rates} />
    </CalculatorTabs>
  );
}
