# Retirement savings calculator

- **Route:** `/retirement` · **Component:** `RetirementCalculator` (export from `@loan-calculators/core`, prop `projectName: "achieve" | "fdr" | "bills"`, `rates?: MarketRates`)
- **Reference:** https://elfsight.com/calculator-form-widget/templates/retirement-savings-calculator/

## Purpose
Elfsight formula: *Retirement Savings = Monthly Savings × Number of Years + Initial Investment* (no growth). We implement compound growth plus employer contributions, inflation and a withdrawal-rate income estimate; the zero-return case reduces to the template formula.

## Inputs
| Key | Label | Type | Default | Min–max | Validation |
|---|---|---|---|---|---|
| `currentAge` | Current age | number | 35 | 16–90 | required, >0 |
| `retireAge` | Retirement age | number | 67 | 30–100 | required, >0 |
| `currentSavings` | Current retirement savings | number | 50000 | 0–1000000000 | required |
| `monthlyContribution` | Your monthly contribution | number | 500 | 0–1000000 | required |
| `employerMonthly` | Employer contribution (monthly) | number | 150 | 0–1000000 | required |
| `annualReturn` | Expected annual return | number | 6 | 0–20 | required |
| `inflation` | Inflation assumption | number | 3 | 0–20 | required |
| `withdrawalRate` | Withdrawal rate in retirement | number | 4 | 0–20 | required |
| `contributionGrowth` | Annual contribution increase | number | 2 | 0–20 | required |

Content labels/hints live in `src/content/retirement.content.json → form.fields`. Inputs with many options are under **More options** (collapsed on mobile, always open on desktop).

## Outputs
- Projected balance (primary)
- Today's dollars, est. monthly income, total contributions, growth
- Monthly income in today's $, years to retirement
- Balance by age table (every 5 yrs)

All values render in the light estimate card (`ResultsPanel`) with the brand-primary CTA (placeholder, no live link) and the mobile estimate-first sticky bar. Tables scroll horizontally on mobile.

## Formulas
Same monthly FV loop as Savings with `C = yours + employer`, return compounding monthly, contributions grow g%/yr. `real = FV/(1+inf)^years`; `annual income = FV × withdrawal%`.

### Worked example (defaults)
Age 35→67, $50k saved, $500 + $150 employer, 6%, +2%/yr contributions → **$1,282,842**; ≈ $498,175 in today's $ at 3% inflation; 4% → $4,276/mo (≈ $1,661 today). Live default inflation uses CPI YoY (e.g. 3.71%).

## Data sources / APIs
| Rate key | Meaning | FRED series | Source page |
|---|---|---|---|
| `inflationYoY` | BLS CPI-U, computed YoY % (monthly) | `CPIAUCSL` | https://fred.stlouisfed.org/series/CPIAUCSL |

- Fetched server-side in `apps/demo/src/lib/rates.ts` (`getMarketRates`) — FRED JSON API when `FRED_API_KEY` is set, else keyless CSV `https://fred.stlouisfed.org/graph/fredgraph.csv?id=<SERIES>`.
- Cached with `fetch(..., { next: { revalidate: 86400 } })`; page uses `export const revalidate = 86400` (daily ISR). Also exposed at `GET /api/rates`.
- UI: `RateNote` renders “Default … based on <source>, as of <date> (value). Illustrative only — not an offer or rate quote.” with a Source link.
- Fallback: if the series fails, the component uses the config default and shows “illustrative fallback from config (live data unavailable)”.

## Config vs content
- `src/config/retirement.config.json`: `defaults` (initial values), `validation` (min/max/label/allowZero per input, enforced by `validateRange`), `features` (`inflationKey`, `tableEveryYears`), `cta` (enabled / preventDefault). Numbers/assumptions only.
- `src/content/retirement.content.json`: text only (CMS-ready): `meta`, `header`, `demoBanner` (disclaimer), `form.fields` (labels, hints, option labels), `results` (headings, labels, messages), `cta`, `footer`, `table`. Rendered as React text — never HTML.
- **Rethemeing per brand:** no per-calculator brand config. `projectName` selects tokens in `src/brand/tokens.ts` via `BrandTheme`; footer copy containing “Achieve-styled” is auto-adapted by `adaptBrandChromeNote`. To vary copy per brand, swap the content JSON from a CMS entry per brand.

## Assumptions & limitations
- Expected return is an editable illustrative assumption (no market forecast).
- No taxes, fees, Social Security, sequence-of-returns risk. Not investment advice.
- Illustrative estimates only; not an offer, quote, pre-qualification, or advice. Demo disclaimer banner always shown.

## Tests
`savings.test.ts › retirementProjection`: zero return/inflation = template formula (100×12×30 = $36,000), 4% income; retireAge ≤ currentAge → null.
