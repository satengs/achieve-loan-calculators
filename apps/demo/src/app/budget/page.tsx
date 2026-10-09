import { BrandedBudget } from "@/components/BrandedCalculators";

export const metadata = {
  title: "Monthly Budget Calculator",
  description: "Monthly budget with a 50/30/20 comparison.",
};

export default function Page() {
  return <BrandedBudget />;
}
