import { CalculatorTabs } from "@/components/CalculatorTabs";
import { buildRateRows, getTechEntry } from "@/lib/tech";
import { BrandedLoan } from "@/components/BrandedCalculators";
import { getMarketRates } from "@/lib/rates";

export const metadata = {
  title: "Loan Calculator",
  description: "Monthly installment, total interest, and repayment.",
};

/** Daily ISR: live market rates are fetched server-side and cached for 24h. */
export const revalidate = 86400;

export default async function Page() {
  const { rates, errors } = await getMarketRates(["personalLoan24"]);
  const tech = getTechEntry("loan");
  return (
    <CalculatorTabs tech={tech} rateRows={buildRateRows(tech.rateKeys, rates, errors)}>
      <BrandedLoan rates={rates} />
    </CalculatorTabs>
  );
}
