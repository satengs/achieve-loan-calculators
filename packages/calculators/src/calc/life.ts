export type LifeEstimateInput = {
  annualIncome: number;
  yearsIncomeReplace: number;
  totalDebts: number;
  finalExpenses: number;
  educationFund: number;
  existingCoverage: number;
  liquidAssets: number;
};

export function lifeCoverageEstimate(input: LifeEstimateInput) {
  const incomeNeed = Math.max(0, input.annualIncome || 0) * Math.max(0, input.yearsIncomeReplace || 0);
  const debts = Math.max(0, input.totalDebts || 0);
  const finals = Math.max(0, input.finalExpenses || 0);
  const education = Math.max(0, input.educationFund || 0);
  const existing = Math.max(0, input.existingCoverage || 0);
  const assets = Math.max(0, input.liquidAssets || 0);
  const grossNeed = incomeNeed + debts + finals + education;
  const netNeed = Math.max(0, grossNeed - existing - assets);
  return { incomeNeed, debts, finals, education, existing, assets, grossNeed, netNeed };
}
