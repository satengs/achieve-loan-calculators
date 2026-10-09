# HELOC calculator (extended for Achieve parity)

- **Route:** `/heloc` · **Component:** `HelocCalculator (extended)` (export from `@loan-calculators/core`, prop `projectName: "achieve" | "fdr" | "bills"`, `rates?: MarketRates`)
- **Reference:** https://www.achieve.com/tools/heloc-payment-calculator

## Purpose
Existing component extended rather than duplicated. Achieve asks home value, mortgage balance, desired loan amount, credit score, state, and returns borrowing power + payment; its FAQ explains interest-only draw vs P&I repayment (e.g. $40k @ 8%, 5-yr draw/15-yr repay ≈ $267 → $382) and that Achieve's fixed-rate line is P&I from day one. Gaps closed: credit score band (sets prime + margin APR), third payment style **Draw, then repay** with draw/repay periods, and **max borrowing power** (CLTV-derived limit capped at $700k). State is not modeled (no rate impact we can source).

## Inputs
| Key | Label | Type | Default | Min–max | Validation |
|---|---|---|---|---|---|
| `homeValue` | Home value | number | 450000 | 1–100000000 | required, >0 |
| `mortgageBalance` | Mortgage balance (optional) | number | 280000 | 0–100000000 | required |
| `maxCltv` | Max combined LTV for credit limit | number | 85 | 1–100 | required, >0 |
| `creditLimit` | Available equity / credit limit | number | 102500 | 0–100000000 | required |
| `drawAmount` | Draw amount | number | 50000 | 1–100000000 | required, >0 |
| `apr` | APR (variable-rate, illustrative) | number | 8.5 | 0–100 | required |
| `payMode` | Payment style | enum | interest-only | — | option list |
| `termYears` | termYears | number | 10 | 1–40 | required, >0 |
| `creditBand` | Credit score range | select | good | — | option list |
| `drawYears` | Draw period | number | 5 | 0–20 | required |
| `repayYears` | Repayment period | number | 15 | 1–30 | required, >0 |

Content labels/hints live in `src/content/heloc.content.json → form.fields`. Inputs with many options are under **More options** (collapsed on mobile, always open on desktop).

## Outputs
- Est. monthly payment (IO / amortizing / draw-period)
- Credit limit, remaining equity, LTV, CLTV
- Home equity, draw, unused line, mode, payment after draw, total interest, max borrowing power

All values render in the light estimate card (`ResultsPanel`) with the brand-primary CTA (placeholder, no live link) and the mobile estimate-first sticky bar. Tables scroll horizontally on mobile.

## Formulas
`limit = max(0, value × maxCLTV − mortgage)`; IO = `draw × APR/12`; amortizing = standard payment over term; draw-then-repay: draw-period IO payment, then `amortize(draw, APR, repayYears×12)`; total interest = IO × draw months + repay interest. APR default = prime + margin[band].

### Worked example (defaults)
$450k home, $280k mortgage, 85% CLTV → limit $102,500. Draw $50k at 8.5% (prime 7.00 + 1.50): IO **$354.17/mo**; amortizing 10 yr $619.93; draw 5 yr/repay 15 yr → $354.17 then **$492.37**, total interest $59,876.56.

## Data sources / APIs
| Rate key | Meaning | FRED series | Source page |
|---|---|---|---|
| `prime` | Bank prime loan rate (daily) | `DPRIME` | https://fred.stlouisfed.org/series/DPRIME |

- Fetched server-side in `apps/demo/src/lib/rates.ts` (`getMarketRates`) — FRED JSON API when `FRED_API_KEY` is set, else keyless CSV `https://fred.stlouisfed.org/graph/fredgraph.csv?id=<SERIES>`.
- Cached with `fetch(..., { next: { revalidate: 86400 } })`; page uses `export const revalidate = 86400` (daily ISR). Also exposed at `GET /api/rates`.
- UI: `RateNote` renders “Default … based on <source>, as of <date> (value). Illustrative only — not an offer or rate quote.” with a Source link.
- Fallback: if the series fails, the component uses the config default and shows “illustrative fallback from config (live data unavailable)”.

## Config vs content
- `src/config/heloc.config.json`: `defaults` (initial values), `validation` (min/max/label/allowZero per input, enforced by `validateRange`), `features` (`payModes`, `deriveCreditLimit`, `allowLimitOverride`, `rateKey`, `fallbackPrime`, `primeMarginByBand`, `maxLine`), `cta` (enabled / preventDefault). Numbers/assumptions only.
- `src/content/heloc.content.json`: text only (CMS-ready): `meta`, `header`, `demoBanner` (disclaimer), `form.fields` (labels, hints, option labels), `results` (headings, labels, messages), `cta`, `footer`. Rendered as React text — never HTML.
- **Rethemeing per brand:** no per-calculator brand config. `projectName` selects tokens in `src/brand/tokens.ts` via `BrandTheme`; footer copy containing “Achieve-styled” is auto-adapted by `adaptBrandChromeNote`. To vary copy per brand, swap the content JSON from a CMS entry per brand.

## Assumptions & limitations
- Single fixed APR for the whole life (Achieve-style fixed rate); variable-rate resets not modeled.
- Band margins are illustrative config values.
- Borrowing power ignores income/DTI/credit approval.
- Illustrative estimates only; not an offer, quote, pre-qualification, or advice. Demo disclaimer banner always shown.

## Tests
`amortize.test.ts` (IO, equity, CLTV), `loans.test.ts › helocDrawRepay` matches Achieve FAQ ($267/$382), zero rate, invalid.
