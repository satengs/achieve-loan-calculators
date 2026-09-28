import { PersonalLoanCalculator } from "@loan-calculators/core";

const BRAND = process.env.NEXT_PUBLIC_BRAND || "achieve";

export const metadata = {
  title: "Personal Loan Calculator",
  description: "Estimate monthly payments. Sample rates are illustrative only — not offers.",
};

export default function Page() {
  return <PersonalLoanCalculator projectName={BRAND} />;
}
