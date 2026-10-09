# Personal loan calculator (rate wiring)

- **Route:** `/personal-loan` · **Component:** `PersonalLoanCalculator (extended)` (export from `@loan-calculators/core`, prop `projectName: "achieve" | "fdr" | "bills"`, `rates?: MarketRates`)
- **Reference:** (existing Achieve-style tool)

## Purpose
Unchanged math; APR default now from Fed G.19 24-month personal loan rate (FRED TERMCBPER24NS) with as-of note.

## Inputs
| Key | Label | Type | Default | Min–max | Validation |
|---|---|---|---|---|---|
| `loanAmount` | Loan amount | number | 15000 | 1–1000000 | required, >0 |
| `apr` | APR | number | 11.99 | 0–100 | required |
| `termValue` | termValue | number | 36 | — | option list |
| `termUnit` | termUnit | enum | months | — | option list |
| `originationFeePercent` | originationFeePercent | number | 0 | 0–100 | required |
| `termPreset` | termPreset | enum | 36 | — | option list |

Content labels/hints live in `src/content/personal-loan.content.json → form.fields`. Inputs with many options are under **More options** (collapsed on mobile, always open on desktop).

## Outputs
- Monthly payment, total interest, total cost, financed principal, amortization snapshot

All values render in the light estimate card (`ResultsPanel`) with the brand-primary CTA (placeholder, no live link) and the mobile estimate-first sticky bar. Tables scroll horizontally on mobile.

## Formulas
Standard amortization; optional origination fee financed or upfront.

### Worked example (defaults)
$15,000, 11.99% (fallback), 36 mo → **$498.14/mo**.

## Data sources / APIs
| Rate key | Meaning | FRED series | Source page |
|---|---|---|---|
| `personalLoan24` | Fed G.19 24-mo personal loan rate, commercial banks (monthly; lags ~2 mo) | `TERMCBPER24NS` | https://fred.stlouisfed.org/series/TERMCBPER24NS |

- Fetched server-side in `apps/demo/src/lib/rates.ts` (`getMarketRates`) — FRED JSON API when `FRED_API_KEY` is set, else keyless CSV `https://fred.stlouisfed.org/graph/fredgraph.csv?id=<SERIES>`.
- Cached with `fetch(..., { next: { revalidate: 86400 } })`; page uses `export const revalidate = 86400` (daily ISR). Also exposed at `GET /api/rates`.
- UI: `RateNote` renders “Default … based on <source>, as of <date> (value). Illustrative only — not an offer or rate quote.” with a Source link.
- Fallback: if the series fails, the component uses the config default and shows “illustrative fallback from config (live data unavailable)”.

## Config vs content
- `src/config/personal-loan.config.json`: `defaults` (initial values), `validation` (min/max/label/allowZero per input, enforced by `validateRange`), `features` (`showAmortization`, `showOriginationFee`, `termUnits`, `originationFeeMode`), `cta` (enabled / preventDefault). Numbers/assumptions only.
- `src/content/personal-loan.content.json`: text only (CMS-ready): `meta`, `header`, `demoBanner` (disclaimer), `form.fields` (labels, hints, option labels), `results` (headings, labels, messages), `cta`, `footer`. Rendered as React text — never HTML.
- **Rethemeing per brand:** no per-calculator brand config. `projectName` selects tokens in `src/brand/tokens.ts` via `BrandTheme`; footer copy containing “Achieve-styled” is auto-adapted by `adaptBrandChromeNote`. To vary copy per brand, swap the content JSON from a CMS entry per brand.

## Assumptions & limitations
- Bank average, not a lender-specific offer.
- Illustrative estimates only; not an offer, quote, pre-qualification, or advice. Demo disclaimer banner always shown.

## Tests
`amortize.test.ts` (payment, fees).
