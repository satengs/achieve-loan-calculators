# Savings calculator

- **Route:** `/savings` · **Component:** `SavingsCalculator` (export from `@loan-calculators/core`, prop `projectName: "achieve" | "fdr" | "bills"`, `rates?: MarketRates`)
- **Reference:** https://elfsight.com/calculator-form-widget/templates/savings-calculator/

## Purpose
Elfsight formula: *FV = PV × (1 + r)^n*. Extended with monthly contributions, compounding frequency, annual contribution increase, and inflation-adjusted value.

## Inputs
| Key | Label | Type | Default | Min–max | Validation |
|---|---|---|---|---|---|
| `initial` | Initial deposit | number | 5000 | 0–100000000 | required |
| `monthly` | Monthly contribution | number | 200 | 0–10000000 | required |
| `rate` | Annual interest rate (APY) | number | 0.4 | 0–50 | required |
| `years` | Years to save | number | 10 | 1–80 | required, >0 |
| `compounding` | Compounding | select | 12 | — | option list |
| `contributionGrowth` | Annual contribution increase | number | 0 | 0–50 | required |
| `inflation` | Inflation assumption | number | 3 | 0–50 | required |

Content labels/hints live in `src/content/savings.content.json → form.fields`. Inputs with many options are under **More options** (collapsed on mobile, always open on desktop).

## Outputs
- Balance at end (primary)
- Total deposits, interest earned, today's dollars, rate used
- Year-by-year table

All values render in the light estimate card (`ResultsPanel`) with the brand-primary CTA (placeholder, no live link) and the mobile estimate-first sticky bar. Tables scroll horizontally on mobile.

## Formulas
Effective monthly rate `i = (1 + APY/100/n)^(n/12) − 1`; each month `B ← B(1+i) + C` (end-of-month deposits); C grows by g% each year. Today's dollars = `FV / (1 + inflation)^years`.

### Worked example (defaults)
$5,000 initial, $200/mo, 0.40% (fallback; live default = FDIC SNDR national savings rate, e.g. 0.37%), 10 yrs, monthly → **$29,686** (deposits $29,000, interest $686); at 3% inflation ≈ $22,089 in today's dollars.

## Data sources / APIs
| Rate key | Meaning | FRED series | Source page |
|---|---|---|---|
| `savings` | FDIC national deposit rate, savings (monthly) | `SNDR` | https://fred.stlouisfed.org/series/SNDR |
| `inflationYoY` | BLS CPI-U, computed YoY % (monthly) | `CPIAUCSL` | https://fred.stlouisfed.org/series/CPIAUCSL |

- Fetched server-side in `apps/demo/src/lib/rates.ts` (`getMarketRates`) — FRED JSON API when `FRED_API_KEY` is set, else keyless CSV `https://fred.stlouisfed.org/graph/fredgraph.csv?id=<SERIES>`.
- Cached with `fetch(..., { next: { revalidate: 86400 } })`; page uses `export const revalidate = 86400` (daily ISR). Also exposed at `GET /api/rates`.
- UI: `RateNote` renders “Default … based on <source>, as of <date> (value). Illustrative only — not an offer or rate quote.” with a Source link.
- Fallback: if the series fails, the component uses the config default and shows “illustrative fallback from config (live data unavailable)”.

## Config vs content
- `src/config/savings.config.json`: `defaults` (initial values), `validation` (min/max/label/allowZero per input, enforced by `validateRange`), `features` (`rateKey`, `inflationKey`, `compoundingOptions`), `cta` (enabled / preventDefault). Numbers/assumptions only.
- `src/content/savings.content.json`: text only (CMS-ready): `meta`, `header`, `demoBanner` (disclaimer), `form.fields` (labels, hints, option labels), `results` (headings, labels, messages), `cta`, `footer`, `table`. Rendered as React text — never HTML.
- **Rethemeing per brand:** no per-calculator brand config. `projectName` selects tokens in `src/brand/tokens.ts` via `BrandTheme`; footer copy containing “Achieve-styled” is auto-adapted by `adaptBrandChromeNote`. To vary copy per brand, swap the content JSON from a CMS entry per brand.

## Assumptions & limitations
- Constant rate; taxes not modeled.
- National average savings rate is low; high-yield accounts may pay more — users can edit.
- Illustrative estimates only; not an offer, quote, pre-qualification, or advice. Demo disclaimer banner always shown.

## Tests
`savings.test.ts`: zero rate = sum of deposits, annual compounding = P(1+r)^n, monthly closed form, invalid → null, realValue/yoy.
