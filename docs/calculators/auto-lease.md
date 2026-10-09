# Auto lease calculator

- **Route:** `/auto-lease` · **Component:** `AutoLeaseCalculator` (export from `@loan-calculators/core`, prop `projectName: "achieve" | "fdr" | "bills"`, `rates?: MarketRates`)
- **Reference:** https://elfsight.com/calculator-form-widget/templates/auto-lease-calculator/

## Purpose
Elfsight formula: *Payment = (Vehicle Price − Residual) / Term* (depreciation only). We implement the standard lease formula adding the rent charge (money factor) and tax; with APR 0 and tax 0 it reduces to the template.

## Inputs
| Key | Label | Type | Default | Min–max | Validation |
|---|---|---|---|---|---|
| `msrp` | Vehicle MSRP | number | 40000 | 1000–10000000 | required, >0 |
| `price` | Negotiated price (cap cost) | number | 38000 | 1000–10000000 | required, >0 |
| `down` | Down payment (cap reduction) | number | 3000 | 0–10000000 | required |
| `tradeIn` | Trade-in credit | number | 0 | 0–10000000 | required |
| `fees` | Fees rolled in (acquisition, doc) | number | 1000 | 0–100000 | required |
| `residualPct` | Residual value (% of MSRP) | number | 58 | 1–100 | required, >0 |
| `apr` | Equivalent APR | number | 6 | 0–40 | required |
| `termMonths` | Lease term | number | 36 | 6–84 | required, >0 |
| `salesTax` | Sales tax on payment | number | 7 | 0–25 | required |

Content labels/hints live in `src/content/auto-lease.content.json → form.fields`. Inputs with many options are under **More options** (collapsed on mobile, always open on desktop).

## Outputs
- Est. monthly payment (primary)
- Total lease cost, residual, money factor, total rent charge
- Depreciation / rent / tax per month

All values render in the light estimate card (`ResultsPanel`) with the brand-primary CTA (placeholder, no live link) and the mobile estimate-first sticky bar. Tables scroll horizontally on mobile.

## Formulas
`cap = price + fees − down − tradeIn`; `residual = MSRP × residual%`; `MF = APR/2400`; `dep = (cap − residual)/term`; `rent = (cap + residual) × MF`; `monthly = (dep + rent)(1 + tax%)`; total lease cost = monthly×term + down + trade.

### Worked example (defaults)
MSRP $40k, price $38k, $3k down, $1k fees → cap $36,000; residual 58% = $23,200; 6% → MF 0.0025; dep $355.56 + rent $148.00 = $503.56 × 1.07 = **$538.80/mo** (live 48-mo auto avg e.g. 7.47% → ~$577.60).

## Data sources / APIs
| Rate key | Meaning | FRED series | Source page |
|---|---|---|---|
| `auto48` | Fed G.19 48-mo new car loan rate, commercial banks (monthly) | `TERMCBAUTO48NS` | https://fred.stlouisfed.org/series/TERMCBAUTO48NS |

- Fetched server-side in `apps/demo/src/lib/rates.ts` (`getMarketRates`) — FRED JSON API when `FRED_API_KEY` is set, else keyless CSV `https://fred.stlouisfed.org/graph/fredgraph.csv?id=<SERIES>`.
- Cached with `fetch(..., { next: { revalidate: 86400 } })`; page uses `export const revalidate = 86400` (daily ISR). Also exposed at `GET /api/rates`.
- UI: `RateNote` renders “Default … based on <source>, as of <date> (value). Illustrative only — not an offer or rate quote.” with a Source link.
- Fallback: if the series fails, the component uses the config default and shows “illustrative fallback from config (live data unavailable)”.

## Config vs content
- `src/config/auto-lease.config.json`: `defaults` (initial values), `validation` (min/max/label/allowZero per input, enforced by `validateRange`), `features` (`rateKey`, `rateNote`), `cta` (enabled / preventDefault). Numbers/assumptions only.
- `src/content/auto-lease.content.json`: text only (CMS-ready): `meta`, `header`, `demoBanner` (disclaimer), `form.fields` (labels, hints, option labels), `results` (headings, labels, messages), `cta`, `footer`. Rendered as React text — never HTML.
- **Rethemeing per brand:** no per-calculator brand config. `projectName` selects tokens in `src/brand/tokens.ts` via `BrandTheme`; footer copy containing “Achieve-styled” is auto-adapted by `adaptBrandChromeNote`. To vary copy per brand, swap the content JSON from a CMS entry per brand.

## Assumptions & limitations
- Auto-loan average is only a proxy; real money factors are set by the lessor.
- Mileage overage, disposition, wear fees not modeled; tax-on-payment convention (varies by state).
- Illustrative estimates only; not an offer, quote, pre-qualification, or advice. Demo disclaimer banner always shown.

## Tests
`loans.test.ts › leasePayment`: standard example, zero APR = depreciation only (template), cap < residual / zero term → null.
