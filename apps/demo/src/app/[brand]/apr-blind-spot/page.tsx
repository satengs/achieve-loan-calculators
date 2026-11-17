import { CalculatorTabs } from "@/components/CalculatorTabs";
import { buildRateRows, getTechEntry } from "@/lib/tech";
import { BrandedAprBlindSpot } from "@/components/BrandedCalculators";
import { getMarketRates } from "@/lib/rates";

export const metadata = {
  title: "APR Blind Spot Calculator",
  description: "See how much time and interest new card spending could add at the same monthly payment. Illustrative estimates only — not an offer or a guarantee.",
};

/** Daily ISR: live market rates are fetched server-side and cached for 24h. */
export const revalidate = 86400;

export default async function Page() {
  const { rates, errors } = await getMarketRates(["creditCard"]);
  const tech = getTechEntry("apr-blind-spot");
  return (
    <CalculatorTabs tech={tech} rateRows={buildRateRows(tech.rateKeys, rates, errors)}>
      <BrandedAprBlindSpot rates={rates} />
    </CalculatorTabs>
  );
}
