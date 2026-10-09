# Debt payoff calculator

- **Route:** `/debt-payoff` · **Component:** `DebtPayoffCalculator` (export from `@loan-calculators/core`, prop `projectName: "achieve" | "fdr" | "bills"`, `rates?: MarketRates`)
- **Reference:** https://www.achieve.com/tools/debt-payoff-calculator

## Purpose
Show the cost of only paying credit card minimums versus waiting 3 months, a user-chosen fixed payoff plan, and an illustrative debt-resolution style program. Mirrors the Achieve tool's Current / If-you-wait / program comparison (debt amount selector, monthly payment, total cost, months, savings).

## Inputs
| Key | Label | Type | Default | Min–max | Validation |
|---|---|---|---|---|---|
| `debtAmount` | Credit card debt | number | 20000 | 1000–1000000 | required, >0 |
| `apr` | Average card APR | number | 22.77 | 0–99 | required |
| `planPayment` | Your payoff plan — fixed monthly payment | number | 700 | 1–1000000 | required, >0 |
| `minPrincipalPct` | Minimum payment: principal % of balance | number | 1 | 0.1–100 | required, >0 |
| `minFloor` | Minimum payment floor | number | 35 | 0–10000 | required |
| `programCostPct` | Program total cost (% of enrolled debt) | number | 90 | 0–200 | required |
| `programMonths` | Program length | number | 48 | 1–120 | required, >0 |
| `waitGrowthPct` | Debt growth if you wait 3 months | number | 10 | 0–100 | required |

Content labels/hints live in `src/content/debt-payoff.content.json → form.fields`. Inputs with many options are under **More options** (collapsed on mobile, always open on desktop).

## Outputs
- Total paid at minimums (primary / sticky)
- Time at minimums, time on your plan, interest saved on plan, illustrative program total
- First minimum payment, “if you wait” total
- Scenario comparison table: monthly payment, months, interest/cost, total paid for 4 scenarios

All values render in the light estimate card (`ResultsPanel`) with the brand-primary CTA (placeholder, no live link) and the mobile estimate-first sticky bar. Tables scroll horizontally on mobile.

## Formulas
Monthly rate r = APR/100/12.

**Minimum payments (declining):** each month `interest = B·r`, `payment = max(interest + B·p, floor)` capped at `B + interest`; `B ← B + interest − payment`. Repeat until B ≈ 0 (cap 1,200 months). p = principal % (default 1%), floor = $35 — mirrors the issuer-style rule the Achieve page describes (interest + principal paydown %, $35 minimum).

**If you wait:** same simulation on `B·(1 + g)`, g = illustrative 3-month growth (default 10%).

**Your plan (fixed payment P):** same loop with constant P; invalid if `P ≤ B·r` (never amortizes).

**Program (illustrative):** `total = debt × costPct`, `monthly = total / months`.

### Worked example (defaults)
Defaults (fallback APR 22.77%, live default uses FRED TERMCBCCALLNS e.g. 21.19%): $20,000, plan $700. At 22.77%: first minimum = 20,000×(0.018975+0.01) = **$579.50**; minimums take **336 months**, total paid **$56,430.83** (interest $36,430.83). Wait (+10% → $22,000): 346 months, $62,225.88. Plan $700: **42 months**, interest $9,093.08. Program 90% × $20,000 = **$18,000** over 48 mo = **$375/mo**.

## Data sources / APIs
| Rate key | Meaning | FRED series | Source page |
|---|---|---|---|
| `creditCard` | Fed G.19 credit card plan rate, all accounts (monthly) | `TERMCBCCALLNS` | https://fred.stlouisfed.org/series/TERMCBCCALLNS |

- Fetched server-side in `apps/demo/src/lib/rates.ts` (`getMarketRates`) — FRED JSON API when `FRED_API_KEY` is set, else keyless CSV `https://fred.stlouisfed.org/graph/fredgraph.csv?id=<SERIES>`.
- Cached with `fetch(..., { next: { revalidate: 86400 } })`; page uses `export const revalidate = 86400` (daily ISR). Also exposed at `GET /api/rates`.
- UI: `RateNote` renders “Default … based on <source>, as of <date> (value). Illustrative only — not an offer or rate quote.” with a Source link.
- Fallback: if the series fails, the component uses the config default and shows “illustrative fallback from config (live data unavailable)”.

## Config vs content
- `src/config/debt-payoff.config.json`: `defaults` (initial values), `validation` (min/max/label/allowZero per input, enforced by `validateRange`), `features` (`slider`, `rateKey`, `maxMonths`), `cta` (enabled / preventDefault). Numbers/assumptions only.
- `src/content/debt-payoff.content.json`: text only (CMS-ready): `meta`, `header`, `demoBanner` (disclaimer), `form.fields` (labels, hints, option labels), `results` (headings, labels, messages), `cta`, `footer`, `table`. Rendered as React text — never HTML.
- **Rethemeing per brand:** no per-calculator brand config. `projectName` selects tokens in `src/brand/tokens.ts` via `BrandTheme`; footer copy containing “Achieve-styled” is auto-adapted by `adaptBrandChromeNote`. To vary copy per brand, swap the content JSON from a CMS entry per brand.

## Assumptions & limitations
- Credit card debt only; a single blended APR.
- Program cost % and length are editable illustrative assumptions, NOT Achieve/FDR median offers (those come from a private API). Program impacts (credit, taxes, fees timing, settlement risk) are not modeled.
- Wait growth % is illustrative (Achieve uses observed median increases; not public).
- No new charges, fees, or rate changes during payoff.
- Illustrative estimates only; not an offer, quote, pre-qualification, or advice. Demo disclaimer banner always shown.

## Tests
`debt.test.ts`: $20k @ 22.77% first minimum = $579.50, terminates, totalPaid = principal + interest; zero APR; zero balance → 0 months; invalid (negative, NaN, 0% principal) → null; fixed payment zero-rate months, payment ≤ interest → null; plan beats minimums; program flat cost; waitBalance validation.
