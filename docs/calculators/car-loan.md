# Car loan calculator

- **Route:** `/car-loan` · **Component:** `CarLoanCalculator` (export from `@loan-calculators/core`, prop `projectName: "achieve" | "fdr" | "bills"`, `rates?: MarketRates`)
- **Reference:** https://elfsight.com/calculator-form-widget/templates/car-loan-calculator/

## Purpose
Elfsight formula: standard amortizing payment. Inputs extended to typical auto purchase: price, down, trade-in value/owed, sales tax, fees, term presets 36–84 mo.

## Inputs
| Key | Label | Type | Default | Min–max | Validation |
|---|---|---|---|---|---|
| `price` | Vehicle price | number | 35000 | 1000–10000000 | required, >0 |
| `down` | Down payment | number | 4000 | 0–10000000 | required |
| `apr` | APR | number | 7.5 | 0–40 | required |
| `termMonths` | Loan term | enum | 60 | — | option list |
| `tradeIn` | Trade-in value | number | 5000 | 0–10000000 | required |
| `tradeOwed` | Owed on trade-in | number | 2000 | 0–10000000 | required |
| `salesTax` | Sales tax | number | 6 | 0–25 | required |
| `fees` | Title, registration & doc fees | number | 800 | 0–100000 | required |

Content labels/hints live in `src/content/car-loan.content.json → form.fields`. Inputs with many options are under **More options** (collapsed on mobile, always open on desktop).

## Outputs
- Monthly payment (primary)
- Loan amount, total interest, total cost, sales tax, trade equity
- Year-by-year schedule

All values render in the light estimate card (`ResultsPanel`) with the brand-primary CTA (placeholder, no live link) and the mobile estimate-first sticky bar. Tables scroll horizontally on mobile.

## Formulas
`tax = (price − tradeIn) × tax%`; `equity = tradeIn − owed`; `amount = price + tax + fees − down − equity`; standard payment.

### Worked example (defaults)
$35,000, $4,000 down, $5,000 trade ($2,000 owed), 6% tax, $800 fees → amount **$30,600**; 7.5% (fallback), 60 mo → **$613.16/mo**, interest $6,189.67 (live 48-mo avg e.g. 7.47% → $612.73).

## Data sources / APIs
| Rate key | Meaning | FRED series | Source page |
|---|---|---|---|
| `auto48` | Fed G.19 48-mo new car loan rate, commercial banks (monthly) | `TERMCBAUTO48NS` | https://fred.stlouisfed.org/series/TERMCBAUTO48NS |

- Fetched server-side in `apps/demo/src/lib/rates.ts` (`getMarketRates`) — FRED JSON API when `FRED_API_KEY` is set, else keyless CSV `https://fred.stlouisfed.org/graph/fredgraph.csv?id=<SERIES>`.
- Cached with `fetch(..., { next: { revalidate: 86400 } })`; page uses `export const revalidate = 86400` (daily ISR). Also exposed at `GET /api/rates`.
- UI: `RateNote` renders “Default … based on <source>, as of <date> (value). Illustrative only — not an offer or rate quote.” with a Source link.
- Fallback: if the series fails, the component uses the config default and shows “illustrative fallback from config (live data unavailable)”.

## Config vs content
- `src/config/car-loan.config.json`: `defaults` (initial values), `validation` (min/max/label/allowZero per input, enforced by `validateRange`), `features` (`rateKey`), `cta` (enabled / preventDefault). Numbers/assumptions only.
- `src/content/car-loan.content.json`: text only (CMS-ready): `meta`, `header`, `demoBanner` (disclaimer), `form.fields` (labels, hints, option labels), `results` (headings, labels, messages), `cta`, `footer`, `table`. Rendered as React text — never HTML.
- **Rethemeing per brand:** no per-calculator brand config. `projectName` selects tokens in `src/brand/tokens.ts` via `BrandTheme`; footer copy containing “Achieve-styled” is auto-adapted by `adaptBrandChromeNote`. To vary copy per brand, swap the content JSON from a CMS entry per brand.

## Assumptions & limitations
- Trade-in tax credit applied (varies by state).
- Rebates/dealer add-ons not modeled.
- Illustrative estimates only; not an offer, quote, pre-qualification, or advice. Demo disclaimer banner always shown.

## Tests
`loans.test.ts › carLoanAmount`, `yearlySchedule`.
