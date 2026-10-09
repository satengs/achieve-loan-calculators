import { BrandedConsolidationOptions } from "@/components/BrandedCalculators";
import { getMarketRates } from "@/lib/rates";

export const metadata = {
  title: "Consolidation Options Estimator",
  description: "Indicative consolidation ranges by debt amount — not offers.",
};

/** Daily ISR: live market rates are fetched server-side and cached for 24h. */
export const revalidate = 86400;

export default async function Page() {
  const { rates } = await getMarketRates(["personalLoan24", "prime", "creditCard"]);
  return <BrandedConsolidationOptions rates={rates} />;
}
