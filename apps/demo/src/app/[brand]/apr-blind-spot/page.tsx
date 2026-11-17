import { CalculatorTabs } from "@/components/CalculatorTabs";
import { buildRateRows, getTechEntry } from "@/lib/tech";
import { BrandedAprBlindSpot } from "@/components/BrandedCalculators";
import { getMarketRates } from "@/lib/rates";
import { getCalculatorContent } from "@loan-calculators/core";

const content = getCalculatorContent("apr-blind-spot");

export const metadata = {
  title: content.header.title,
  description: content.meta.description,
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
