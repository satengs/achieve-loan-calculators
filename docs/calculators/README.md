# Calculator design docs

One doc per calculator: purpose, reference, inputs/outputs, formulas with worked example, data sources, config vs content, assumptions, tests.

| Calculator | Route | Component | Live rate keys | Reference |
|---|---|---|---|---|
| [Debt payoff calculator](debt-payoff.md) | `/debt-payoff` | `DebtPayoffCalculator` | creditCard | https://www.achieve.com/tools/debt-payoff-calculator |
| [Consolidation options estimator](consolidation-options.md) | `/consolidation-options` | `ConsolidationOptionsCalculator` | personalLoan24, prime, creditCard | https://www.achieve.com/ (homepage “CONSOLIDATION OPTIONS — What’s your debt amount?” slider) |
| [Debt-to-income (DTI) calculator](dti.md) | `/dti` | `DtiCalculator` | — | https://www.achieve.com/tools/debt-income-ratio-calculator |
| [HELOC calculator (extended for Achieve parity)](heloc.md) | `/heloc` | `HelocCalculator (extended)` | prime | https://www.achieve.com/tools/heloc-payment-calculator |
| [Car insurance cost estimator](car-insurance.md) | `/car-insurance` | `CarInsuranceCalculator` | — | https://elfsight.com/calculator-form-widget/templates/car-insurance-calculator/ |
| [Monthly budget calculator](budget.md) | `/budget` | `BudgetCalculator` | — | https://elfsight.com/calculator-form-widget/templates/financial-budget-calculator/ |
| [Savings calculator](savings.md) | `/savings` | `SavingsCalculator` | savings, inflationYoY | https://elfsight.com/calculator-form-widget/templates/savings-calculator/ |
| [Retirement savings calculator](retirement.md) | `/retirement` | `RetirementCalculator` | inflationYoY | https://elfsight.com/calculator-form-widget/templates/retirement-savings-calculator/ |
| [Life insurance coverage estimator (extended)](life-insurance.md) | `/life-insurance` | `LifeInsuranceCalculator (extended)` | — | https://elfsight.com/calculator-form-widget/templates/life-insurance-calculator/ |
| [Home insurance cost estimator](home-insurance.md) | `/home-insurance` | `HomeInsuranceCalculator` | — | https://elfsight.com/calculator-form-widget/templates/home-insurance-calculator/ |
| [Mortgage calculator (extended)](mortgage.md) | `/mortgage` | `MortgageCalculator (extended)` | mortgage30, mortgage15 | https://elfsight.com/calculator-form-widget/templates/mortgage-calculator/ |
| [Personal loan calculator (rate wiring)](personal-loan.md) | `/personal-loan` | `PersonalLoanCalculator (extended)` | personalLoan24 | (existing Achieve-style tool) |
| [Loan calculator](loan.md) | `/loan` | `LoanCalculator` | personalLoan24 | https://elfsight.com/calculator-form-widget/templates/loan-calculator/ |
| [Auto lease calculator](auto-lease.md) | `/auto-lease` | `AutoLeaseCalculator` | auto48 | https://elfsight.com/calculator-form-widget/templates/auto-lease-calculator/ |
| [Student loan calculator](student-loan.md) | `/student-loan` | `StudentLoanCalculator` | — | https://elfsight.com/calculator-form-widget/templates/student-loan-calculator/ |
| [Car loan calculator](car-loan.md) | `/car-loan` | `CarLoanCalculator` | auto48 | https://elfsight.com/calculator-form-widget/templates/car-loan-calculator/ |
| [Refinance calculator](refinance.md) | `/refinance` | `RefinanceCalculator` | mortgage30 | https://elfsight.com/calculator-form-widget/templates/refinance-calculator/ |

See also [`../DATA-SOURCES.md`](../DATA-SOURCES.md) and [`../ARCHITECTURE.md`](../ARCHITECTURE.md).
