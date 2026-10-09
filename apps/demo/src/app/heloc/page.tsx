import { BrandedHeloc } from "@/components/BrandedCalculators";
import { getMarketRates } from "@/lib/rates";

export const metadata = {
  title: "HELOC Calculator",
  description: "Estimate HELOC payments and equity. Sample rates are illustrative only — not offers.",
};

/** Daily ISR: live market rates are fetched server-side and cached for 24h. */
export const revalidate = 86400;

export default async function Page() {
  const { rates } = await getMarketRates(["prime"]);
  return <BrandedHeloc rates={rates} />;
}
