import { BrandedRetirement } from "@/components/BrandedCalculators";
import { getMarketRates } from "@/lib/rates";

export const metadata = {
  title: "Retirement Savings Calculator",
  description: "Retirement savings projection — illustrative, not advice.",
};

/** Daily ISR: live market rates are fetched server-side and cached for 24h. */
export const revalidate = 86400;

export default async function Page() {
  const { rates } = await getMarketRates(["inflationYoY"]);
  return <BrandedRetirement rates={rates} />;
}
