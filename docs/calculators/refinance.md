# Refinance calculator

- **Route:** `/refinance` · **Component:** `RefinanceCalculator` (export from `@loan-calculators/core`, prop `projectName: "achieve" | "fdr" | "bills"`, `rates?: MarketRates`)
- **Reference:** https://elfsight.com/calculator-form-widget/templates/refinance-calculator/

## Purpose
Elfsight formula: *Savings = (Current Payment − New Payment) × Remaining Payments*. Shown as “simple savings”, alongside break-even on closing costs and true lifetime savings (accounts for a longer new term and costs).

## Inputs
| Key | Label | Type | Default | Min–max | Validation |
|---|---|---|---|---|---|
| `balance` | Current loan balance | number | 300000 | 1000–100000000 | required, >0 |
| `currentRate` | Current interest rate | number | 7.5 | 0–30 | required |
| `remainingYears` | Years remaining | number | 28 | 1–40 | required, >0 |
| `newRate` | New interest rate | number | 6.5 | 0–30 | required |
| `newTermYears` | New loan term | number | 30 | 1–40 | required, >0 |
| `closingCosts` | Closing costs | number | 6000 | 0–1000000 | required |
| `rollCosts` | Closing costs | select | cash | — | option list |

Content labels/hints live in `src/content/refinance.content.json → form.fields`. Inputs with many options are under **More options** (collapsed on mobile, always open on desktop).

## Outputs
- Monthly savings (primary)
- Current P&I, new P&I, break-even, lifetime savings
- Simple template savings, remaining interest current vs new

All values render in the light estimate card (`ResultsPanel`) with the brand-primary CTA (placeholder, no live link) and the mobile estimate-first sticky bar. Tables scroll horizontally on mobile.

## Formulas
`current = pmt(balance, curRate, remaining)`; `new = pmt(balance + (roll ? costs : 0), newRate, newTerm)`; `break-even = ceil(costs / savings)`; `lifetime = currentRemainingTotal − (newTotal + cashCosts)`.

### Worked example (defaults)
$300k, 7.5%, 28 yrs left → $2,138.60; new 6.5% (fallback; live PMMS e.g. 7.40%), 30 yrs → $1,896.20; **$242.40/mo**, break-even 25 mo, lifetime $29,937, simple $81,446.

## Data sources / APIs
| Rate key | Meaning | FRED series | Source page |
|---|---|---|---|
| `mortgage30` | Freddie Mac PMMS 30-yr fixed avg (weekly) | `MORTGAGE30US` | https://fred.stlouisfed.org/series/MORTGAGE30US |

- Fetched server-side in `apps/demo/src/lib/rates.ts` (`getMarketRates`) — FRED JSON API when `FRED_API_KEY` is set, else keyless CSV `https://fred.stlouisfed.org/graph/fredgraph.csv?id=<SERIES>`.
- Cached with `fetch(..., { next: { revalidate: 86400 } })`; page uses `export const revalidate = 86400` (daily ISR). Also exposed at `GET /api/rates`.
- UI: `RateNote` renders “Default … based on <source>, as of <date> (value). Illustrative only — not an offer or rate quote.” with a Source link.
- Fallback: if the series fails, the component uses the config default and shows “illustrative fallback from config (live data unavailable)”.

## Config vs content
- `src/config/refinance.config.json`: `defaults` (initial values), `validation` (min/max/label/allowZero per input, enforced by `validateRange`), `features` (`rateKey`), `cta` (enabled / preventDefault). Numbers/assumptions only.
- `src/content/refinance.content.json`: text only (CMS-ready): `meta`, `header`, `demoBanner` (disclaimer), `form.fields` (labels, hints, option labels), `results` (headings, labels, messages), `cta`, `footer`. Rendered as React text — never HTML.
- **Rethemeing per brand:** no per-calculator brand config. `projectName` selects tokens in `src/brand/tokens.ts` via `BrandTheme`; footer copy containing “Achieve-styled” is auto-adapted by `adaptBrandChromeNote`. To vary copy per brand, swap the content JSON from a CMS entry per brand.

## Assumptions & limitations
- P&I only; points, PMI, escrow not modeled.
- Illustrative estimates only; not an offer, quote, pre-qualification, or advice. Demo disclaimer banner always shown.

## Tests
`loans.test.ts › refinanceCompare`: savings, break-even, rolled costs, zero rate, no savings → NaN, invalid.
