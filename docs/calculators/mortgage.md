# Mortgage calculator (extended)

- **Route:** `/mortgage` · **Component:** `MortgageCalculator (extended)` (export from `@loan-calculators/core`, prop `projectName: "achieve" | "fdr" | "bills"`, `rates?: MarketRates`)
- **Reference:** https://elfsight.com/calculator-form-widget/templates/mortgage-calculator/

## Purpose
Existing calculator already covers the Elfsight template (P&I via standard formula + taxes) and more (PITI, HOA, down payment %/$, amortization snapshot). Extension: APR default now comes from Freddie Mac PMMS via FRED with as-of display.

## Inputs
| Key | Label | Type | Default | Min–max | Validation |
|---|---|---|---|---|---|
| `homePrice` | Home price | number | 400000 | 1–100000000 | required, >0 |
| `downPaymentMode` | downPaymentMode | enum | percent | — | option list |
| `downPayment` | Down payment | number | 20 | — | option list |
| `loanAmount` | Loan amount | number | 320000 | 1–100000000 | required, >0 |
| `apr` | APR | number | 6.5 | 0–100 | required |
| `termYears` | termYears | number | 30 | 1–50 | required, >0 |
| `termPreset` | termPreset | enum | 30 | — | option list |
| `taxMonthly` | taxMonthly | number | 350 | 0–100000 | required |
| `insMonthly` | insMonthly | number | 150 | 0–100000 | required |
| `hoaMonthly` | hoaMonthly | number | 0 | 0–100000 | required |

Content labels/hints live in `src/content/mortgage.content.json → form.fields`. Inputs with many options are under **More options** (collapsed on mobile, always open on desktop).

## Outputs
- Monthly P&I / PITI, total interest, loan amount, amortization snapshot

All values render in the light estimate card (`ResultsPanel`) with the brand-primary CTA (placeholder, no live link) and the mobile estimate-first sticky bar. Tables scroll horizontally on mobile.

## Formulas
`M = P·r(1+r)^n/((1+r)^n − 1)`, r = APR/12, n = years×12; PITI = M + tax + insurance + HOA.

### Worked example (defaults)
$400k, 20% down → $320k at 6.5% (fallback), 30 yr → **$2,022.62** P&I. With live PMMS (e.g. 7.40%) the default changes accordingly.

## Data sources / APIs
| Rate key | Meaning | FRED series | Source page |
|---|---|---|---|
| `mortgage30` | Freddie Mac PMMS 30-yr fixed avg (weekly) | `MORTGAGE30US` | https://fred.stlouisfed.org/series/MORTGAGE30US |
| `mortgage15` | Freddie Mac PMMS 15-yr fixed avg (weekly) | `MORTGAGE15US` | https://fred.stlouisfed.org/series/MORTGAGE15US |

- Fetched server-side in `apps/demo/src/lib/rates.ts` (`getMarketRates`) — FRED JSON API when `FRED_API_KEY` is set, else keyless CSV `https://fred.stlouisfed.org/graph/fredgraph.csv?id=<SERIES>`.
- Cached with `fetch(..., { next: { revalidate: 86400 } })`; page uses `export const revalidate = 86400` (daily ISR). Also exposed at `GET /api/rates`.
- UI: `RateNote` renders “Default … based on <source>, as of <date> (value). Illustrative only — not an offer or rate quote.” with a Source link.
- Fallback: if the series fails, the component uses the config default and shows “illustrative fallback from config (live data unavailable)”.

## Config vs content
- `src/config/mortgage.config.json`: `defaults` (initial values), `validation` (min/max/label/allowZero per input, enforced by `validateRange`), `features` (`showPiti`, `downPaymentModes`, `allowLoanOverride`), `cta` (enabled / preventDefault). Numbers/assumptions only.
- `src/content/mortgage.content.json`: text only (CMS-ready): `meta`, `header`, `demoBanner` (disclaimer), `form.fields` (labels, hints, option labels), `results` (headings, labels, messages), `cta`, `footer`. Rendered as React text — never HTML.
- **Rethemeing per brand:** no per-calculator brand config. `projectName` selects tokens in `src/brand/tokens.ts` via `BrandTheme`; footer copy containing “Achieve-styled” is auto-adapted by `adaptBrandChromeNote`. To vary copy per brand, swap the content JSON from a CMS entry per brand.

## Assumptions & limitations
- PMMS is an average for well-qualified borrowers; not an offer.
- PMI not modeled.
- Illustrative estimates only; not an offer, quote, pre-qualification, or advice. Demo disclaimer banner always shown.

## Tests
`amortize.test.ts`: payment, zero APR, invalid, down-payment mode conversion.
