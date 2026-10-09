import { CalculatorTabs } from "@/components/CalculatorTabs";
import { buildRateRows, getTechEntry } from "@/lib/tech";
import { BrandedCarLoan } from "@/components/BrandedCalculators";
import { getMarketRates } from "@/lib/rates";

export const metadata = {
  title: "Car Loan Calculator",
  description: "Auto loan payment estimate.",
};

/** Daily ISR: live market rates are fetched server-side and cached for 24h. */
export const revalidate = 86400;

export default async function Page() {
  const { rates, errors } = await getMarketRates(["auto48"]);
  const tech = getTechEntry("car-loan");
  return (
    <CalculatorTabs tech={tech} rateRows={buildRateRows(tech.rateKeys, rates, errors)}>
      <BrandedCarLoan rates={rates} />
    </CalculatorTabs>
  );
}
