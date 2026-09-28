import { MortgageCalculator } from "@loan-calculators/core";

const BRAND = process.env.NEXT_PUBLIC_BRAND || "achieve";

export const metadata = {
  title: "Mortgage Calculator",
  description: "Estimate P&I and PITI. Sample rates are illustrative only — not offers.",
};

export default function Page() {
  return <MortgageCalculator projectName={BRAND} />;
}
