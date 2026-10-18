import { CalculatorTabs } from "@/components/CalculatorTabs";
import { buildRateRows, getTechEntry } from "@/lib/tech";
import { BrandedMortgage } from "@/components/BrandedCalculators";
import { getMarketRates } from "@/lib/rates";

export const metadata = {
  title: "Mortgage Calculator",
  description: "Estimate P&I and PITI. Sample rates are illustrative only — not offers.",
};

/** Daily ISR: live market rates are fetched server-side and cached for 24h. */
export const revalidate = 86400;

export default async function Page() {
  const { rates, errors } = await getMarketRates(["mortgage30", "mortgage15"]);
  const tech = getTechEntry("mortgage");
  return (
    <CalculatorTabs tech={tech} rateRows={buildRateRows(tech.rateKeys, rates, errors)}>
      <BrandedMortgage rates={rates} />
    </CalculatorTabs>
  );
}
