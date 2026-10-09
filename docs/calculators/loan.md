# Loan calculator

- **Route:** `/loan` · **Component:** `LoanCalculator` (export from `@loan-calculators/core`, prop `projectName: "achieve" | "fdr" | "bills"`, `rates?: MarketRates`)
- **Reference:** https://elfsight.com/calculator-form-widget/templates/loan-calculator/

## Purpose
Elfsight formula: *Installment = (L × R/1200) / (1 − (1 + R/1200)^(−12·T))*. Generic amortizing loan with optional extra monthly payment and yearly schedule. Shares math with PersonalLoan (`amortize`) — kept as a separate route because the template is generic (no fee, years input, extra payments).

## Inputs
| Key | Label | Type | Default | Min–max | Validation |
|---|---|---|---|---|---|
| `loanAmount` | Loan amount | number | 15000 | 100–100000000 | required, >0 |
| `apr` | Interest rate (APR) | number | 12 | 0–99 | required |
| `termYears` | Loan period | number | 5 | 0.5–40 | required, >0 |
| `extraMonthly` | Extra monthly payment | number | 0 | 0–1000000 | required |

Content labels/hints live in `src/content/loan.content.json → form.fields`. Inputs with many options are under **More options** (collapsed on mobile, always open on desktop).

## Outputs
- Monthly installment (primary)
- Total interest, total repayment, payoff with extra, interest saved
- Year-by-year schedule

All values render in the light estimate card (`ResultsPanel`) with the brand-primary CTA (placeholder, no live link) and the mobile estimate-first sticky bar. Tables scroll horizontally on mobile.

## Formulas
Template formula above (identical to standard amortization). Extra: each month pay `M + extra` until balance 0.

### Worked example (defaults)
$15,000 at 12% (fallback; live default = TERMCBPER24NS e.g. 11.90%), 5 yr → **$333.67/mo**, interest $5,020, total $20,020.

## Data sources / APIs
| Rate key | Meaning | FRED series | Source page |
|---|---|---|---|
| `personalLoan24` | Fed G.19 24-mo personal loan rate, commercial banks (monthly; lags ~2 mo) | `TERMCBPER24NS` | https://fred.stlouisfed.org/series/TERMCBPER24NS |

- Fetched server-side in `apps/demo/src/lib/rates.ts` (`getMarketRates`) — FRED JSON API when `FRED_API_KEY` is set, else keyless CSV `https://fred.stlouisfed.org/graph/fredgraph.csv?id=<SERIES>`.
- Cached with `fetch(..., { next: { revalidate: 86400 } })`; page uses `export const revalidate = 86400` (daily ISR). Also exposed at `GET /api/rates`.
- UI: `RateNote` renders “Default … based on <source>, as of <date> (value). Illustrative only — not an offer or rate quote.” with a Source link.
- Fallback: if the series fails, the component uses the config default and shows “illustrative fallback from config (live data unavailable)”.

## Config vs content
- `src/config/loan.config.json`: `defaults` (initial values), `validation` (min/max/label/allowZero per input, enforced by `validateRange`), `features` (`rateKey`), `cta` (enabled / preventDefault). Numbers/assumptions only.
- `src/content/loan.content.json`: text only (CMS-ready): `meta`, `header`, `demoBanner` (disclaimer), `form.fields` (labels, hints, option labels), `results` (headings, labels, messages), `cta`, `footer`, `table`. Rendered as React text — never HTML.
- **Rethemeing per brand:** no per-calculator brand config. `projectName` selects tokens in `src/brand/tokens.ts` via `BrandTheme`; footer copy containing “Achieve-styled” is auto-adapted by `adaptBrandChromeNote`. To vary copy per brand, swap the content JSON from a CMS entry per brand.

## Assumptions & limitations
- Fixed rate; no fees.
- Illustrative estimates only; not an offer, quote, pre-qualification, or advice. Demo disclaimer banner always shown.

## Tests
`loans.test.ts › payoffWithExtra / yearlySchedule`; `amortize.test.ts`.
