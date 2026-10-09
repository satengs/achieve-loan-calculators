# Monthly budget calculator

- **Route:** `/budget` · **Component:** `BudgetCalculator` (export from `@loan-calculators/core`, prop `projectName: "achieve" | "fdr" | "bills"`)
- **Reference:** https://elfsight.com/calculator-form-widget/templates/financial-budget-calculator/

## Purpose
Elfsight template formula: *Total Budget = Salary and Benefit Costs Total + Other Costs Total* (an organisational budget). For a consumer (bills.com-style) audience we implement a personal monthly budget: income vs categorized spending with a 50/30/20 comparison. Note the shift in NOTES.

## Inputs
| Key | Label | Type | Default | Min–max | Validation |
|---|---|---|---|---|---|
| `netIncome` | Take-home pay (monthly) | number | 5000 | 0–10000000 | required |
| `otherIncome` | Other income (monthly) | number | 0 | 0–10000000 | required |
| `housing` | Housing (rent / mortgage) | number | 1600 | 0–10000000 | required |
| `utilities` | Utilities & phone | number | 250 | 0–10000000 | required |
| `groceries` | Groceries | number | 500 | 0–10000000 | required |
| `transportation` | Transportation | number | 400 | 0–10000000 | required |
| `insurance` | Insurance premiums | number | 250 | 0–10000000 | required |
| `debtPayments` | Minimum debt payments | number | 300 | 0–10000000 | required |
| `dining` | Dining out | number | 250 | 0–10000000 | required |
| `entertainment` | Entertainment | number | 150 | 0–10000000 | required |
| `shopping` | Shopping | number | 200 | 0–10000000 | required |
| `subscriptions` | Subscriptions | number | 50 | 0–10000000 | required |
| `savings` | Savings / emergency fund | number | 400 | 0–10000000 | required |
| `retirement` | Retirement contributions (from take-home) | number | 300 | 0–10000000 | required |

Content labels/hints live in `src/content/budget.content.json → form.fields`. Inputs with many options are under **More options** (collapsed on mobile, always open on desktop).

## Outputs
- Left over each month (primary)
- Total income; needs / wants / savings with % of income
- Total outflow, savings rate
- Table: yours vs 50/30/20 guideline amounts

All values render in the light estimate card (`ResultsPanel`) with the brand-primary CTA (placeholder, no live link) and the mobile estimate-first sticky bar. Tables scroll horizontally on mobile.

## Formulas
`income = Σ income lines`; `cat = Σ lines in category`; `leftover = income − (needs + wants + savings)`; `% = cat / income`; `target = income × guideline%`; savings rate = (savings + max(0, leftover)) / income.

### Worked example (defaults)
Income $5,000; needs $3,300 (66%), wants $650 (13%), savings $700 (14%) → leftover **$350**; savings rate 21%; guideline needs $2,500 / wants $1,500 / savings $1,000.

## Data sources / APIs
None. All defaults are illustrative config values (see assumptions).

## Config vs content
- `src/config/budget.config.json`: `defaults` (initial values), `validation` (min/max/label/allowZero per input, enforced by `validateRange`), `features` (`categories`, `targets`), `cta` (enabled / preventDefault). Numbers/assumptions only.
- `src/content/budget.content.json`: text only (CMS-ready): `meta`, `header`, `demoBanner` (disclaimer), `form.fields` (labels, hints, option labels), `results` (headings, labels, messages), `cta`, `footer`, `table`. Rendered as React text — never HTML.
- **Rethemeing per brand:** no per-calculator brand config. `projectName` selects tokens in `src/brand/tokens.ts` via `BrandTheme`; footer copy containing “Achieve-styled” is auto-adapted by `adaptBrandChromeNote`. To vary copy per brand, swap the content JSON from a CMS entry per brand.

## Assumptions & limitations
- Monthly cadence only; take-home pay (taxes not modeled).
- 50/30/20 is a rule of thumb; configurable in `features.targets`.
- Illustrative estimates only; not an offer, quote, pre-qualification, or advice. Demo disclaimer banner always shown.

## Tests
`savings.test.ts › budgetSummary`: totals, leftover, %, targets, savings rate; zero income → NaN %, negative → null.
