import { BrandedPersonalLoan } from "@/components/BrandedCalculators";

export const metadata = {
  title: "Personal Loan Calculator",
  description: "Estimate monthly payments. Sample rates are illustrative only — not offers.",
};

export default function Page() {
  return <BrandedPersonalLoan />;
}
