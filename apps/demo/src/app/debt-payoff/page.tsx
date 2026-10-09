import { BrandedDebtPayoff } from "@/components/BrandedCalculators";
import { getMarketRates } from "@/lib/rates";

export const metadata = {
  title: "Debt Payoff Calculator",
  description: "Compare minimum payments, a payoff plan, and an illustrative program. Not an offer.",
};

/** Daily ISR: live market rates are fetched server-side and cached for 24h. */
export const revalidate = 86400;

export default async function Page() {
  const { rates } = await getMarketRates(["creditCard"]);
  return <BrandedDebtPayoff rates={rates} />;
}
