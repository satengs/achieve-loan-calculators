# Consolidation options estimator

- **Route:** `/consolidation-options` · **Component:** `ConsolidationOptionsCalculator` (export from `@loan-calculators/core`, prop `projectName: "achieve" | "fdr" | "bills"`, `rates?: MarketRates`)
- **Reference:** https://www.achieve.com/ (homepage “CONSOLIDATION OPTIONS — What’s your debt amount?” slider)

## Purpose
Slider for debt amount (Achieve: $5k–$150k, default $20k) → side-by-side indicative options: Personal loan (Achieve hides above $50k), Home equity loan (hidden below $15k), Debt-resolution program, vs. keep paying minimums. Each shows est. monthly, term, est. total. We add a credit-score band that drives APR ranges, and show ranges rather than single numbers.

## Inputs
| Key | Label | Type | Default | Min–max | Validation |
|---|---|---|---|---|---|
| `debtAmount` | Debt amount | number | 20000 | 1000–1000000 | required, >0 |
| `creditBand` | Credit score range | select | good | — | option list |
| `plTermMonths` | Personal loan term | number | 60 | 12–120 | required, >0 |
| `heTermMonths` | Home equity term | number | 180 | 60–360 | required, >0 |
| `programCostPct` | Program total cost (% of debt) | number | 90 | 0–200 | required |
| `programMonths` | Program length | number | 48 | 1–120 | required, >0 |

Content labels/hints live in `src/content/consolidation-options.content.json → form.fields`. Inputs with many options are under **More options** (collapsed on mobile, always open on desktop).

## Outputs
- Current est. minimum payment (primary)
- Per-option indicative monthly range (items)
- Minimums: months and total paid
- Options table: monthly range, term, total range, APR range used, or availability text

All values render in the light estimate card (`ResultsPanel`) with the brand-primary CTA (placeholder, no live link) and the mobile estimate-first sticky bar. Tables scroll horizontally on mobile.

## Formulas
Loans: `principal = debt × (1 + fee%)` (PL fee 5% financed); `payment = P·r(1+r)^n / ((1+r)^n − 1)` at the low and high APR of the band → range; `total = payment × n`.
PL APR band = live 24-mo personal-loan avg + band offsets, clamped to [7.99%, 35.99%]. Home equity APR band = prime + band margins.
Program: `total = debt × cost%`, `monthly = total / months`. Minimums: same simulation as debt-payoff at the card APR.

### Worked example (defaults)
$20,000, band Good (offsets +2..+8 on 24-mo avg 11.90% → 13.90–19.90%), 60 mo, 5% fee → ~$488–$556/mo. Home equity (prime 7.00% + 1.5..3.5 → 8.5–10.5%), 180 mo → ~$197–$221/mo. Program 90%/48 mo → $375/mo, $18,000. Minimums at 21.19% → first payment ≈ $553, ~27 yr 9 mo.

## Data sources / APIs
| Rate key | Meaning | FRED series | Source page |
|---|---|---|---|
| `personalLoan24` | Fed G.19 24-mo personal loan rate, commercial banks (monthly; lags ~2 mo) | `TERMCBPER24NS` | https://fred.stlouisfed.org/series/TERMCBPER24NS |
| `prime` | Bank prime loan rate (daily) | `DPRIME` | https://fred.stlouisfed.org/series/DPRIME |
| `creditCard` | Fed G.19 credit card plan rate, all accounts (monthly) | `TERMCBCCALLNS` | https://fred.stlouisfed.org/series/TERMCBCCALLNS |

- Fetched server-side in `apps/demo/src/lib/rates.ts` (`getMarketRates`) — FRED JSON API when `FRED_API_KEY` is set, else keyless CSV `https://fred.stlouisfed.org/graph/fredgraph.csv?id=<SERIES>`.
- Cached with `fetch(..., { next: { revalidate: 86400 } })`; page uses `export const revalidate = 86400` (daily ISR). Also exposed at `GET /api/rates`.
- UI: `RateNote` renders “Default … based on <source>, as of <date> (value). Illustrative only — not an offer or rate quote.” with a Source link.
- Fallback: if the series fails, the component uses the config default and shows “illustrative fallback from config (live data unavailable)”.

## Config vs content
- `src/config/consolidation-options.config.json`: `defaults` (initial values), `validation` (min/max/label/allowZero per input, enforced by `validateRange`), `features` (`slider`, `personalLoan`, `homeEquity`, `program`, `minimums`, `note`), `cta` (enabled / preventDefault). Numbers/assumptions only.
- `src/content/consolidation-options.content.json`: text only (CMS-ready): `meta`, `header`, `demoBanner` (disclaimer), `form.fields` (labels, hints, option labels), `results` (headings, labels, messages), `cta`, `footer`, `table`. Rendered as React text — never HTML.
- **Rethemeing per brand:** no per-calculator brand config. `projectName` selects tokens in `src/brand/tokens.ts` via `BrandTheme`; footer copy containing “Achieve-styled” is auto-adapted by `adaptBrandChromeNote`. To vary copy per brand, swap the content JSON from a CMS entry per brand.

## Assumptions & limitations
- Achieve's tool returns single values from internal pricing; we show transparent ranges from public averages + editable band offsets. Not pre-qualification.
- Home equity availability ignores actual equity/CLTV (see HELOC calculator).
- Thresholds ($50k PL max, $15k HE min, $7.5k program min) are config values inspired by the reference's availability text.
- Illustrative estimates only; not an offer, quote, pre-qualification, or advice. Demo disclaimer banner always shown.

## Tests
`loans.test.ts › consolidationOptions`: range ordering, program flat payment, availability by min/max debt, zero debt → null. Minimums reuse `debt.test.ts`.
