import { CalculatorTabs } from "@/components/CalculatorTabs";
import { getTechEntry } from "@/lib/tech";
import { BrandedStudentLoan } from "@/components/BrandedCalculators";

export const metadata = {
  title: "Student Loan Calculator",
  description: "Student loan repayment estimate.",
};

export default function Page() {
  const tech = getTechEntry("student-loan");
  return (
    <CalculatorTabs tech={tech} rateRows={[]}>
      <BrandedStudentLoan />
    </CalculatorTabs>
  );
}
