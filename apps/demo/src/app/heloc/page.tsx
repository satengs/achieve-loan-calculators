import { HelocCalculator } from "@loan-calculators/core";

const BRAND = process.env.NEXT_PUBLIC_BRAND || "achieve";

export const metadata = {
  title: "HELOC Calculator",
  description: "Estimate HELOC payments and equity. Sample rates are illustrative only — not offers.",
};

export default function Page() {
  return <HelocCalculator projectName={BRAND} />;
}
