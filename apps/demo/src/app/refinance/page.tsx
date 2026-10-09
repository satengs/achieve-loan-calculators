import { BrandedRefinance } from "@/components/BrandedCalculators";
import { getMarketRates } from "@/lib/rates";

export const metadata = {
  title: "Refinance Calculator",
  description: "Mortgage refinance savings estimate.",
};

/** Daily ISR: live market rates are fetched server-side and cached for 24h. */
export const revalidate = 86400;

export default async function Page() {
  const { rates } = await getMarketRates(["mortgage30"]);
  return <BrandedRefinance rates={rates} />;
}
