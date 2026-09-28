import { BrandedMortgage } from "@/components/BrandedCalculators";

export const metadata = {
  title: "Mortgage Calculator",
  description: "Estimate P&I and PITI. Sample rates are illustrative only — not offers.",
};

export default function Page() {
  return <BrandedMortgage />;
}
