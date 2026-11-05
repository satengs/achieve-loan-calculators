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

**If you wait (M5):** the balance first grows for `w` months with no payments and no new charges, at the card APR compounded monthly: `B_w = B·(1 + APR/12)^w` (`balanceAfterWaiting`; `w = features.waitMonths`, default 3). Then the same minimum-payment simulation runs on `B_w`. The time to pay off includes the `w`-month wait. At 22.77% APR that is ≈ +5.8% over 3 months (it used to be a fixed, editable 10%). Late fees and penalty APRs are not modeled; a note under the table says so.

**Not paid off (M8):** a simulation that reaches the 1,200-month cap (`capped: true`, e.g. principal % = 0.1 with a $0 floor) is no longer shown as “100 yr”. Its time shows “Not paid off in 100 yrs” (`table.cappedTime`), and the results message adds `results.cappedMessage`: interest and total paid then cover only the first 100 years, and a balance remains.

**Your plan (fixed payment P):** same loop with constant P; invalid if `P ≤ B·r` (never amortizes).

**Program (illustrative):** `total = debt × costPct`, `monthly = total / months`.

### Worked example (defaults)
Defaults (fallback APR 22.77%, live default uses FRED TERMCBCCALLNS e.g. 21.19%): $20,000, plan $700. At 22.77%: first minimum = 20,000×(0.018975+0.01) = **$579.50**; minimums take **336 months**, total paid **$56,430.83** (interest $36,430.83). Wait 3 months at APR (balance → **$21,160.24**, ≈ +5.8%): **345 months** incl. wait, total paid **$59,792.70**. Plan $700: **42 months**, interest $9,093.08. Program 90% × $20,000 = **$18,000** over 48 mo = **$375/mo**.

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
- Wait growth is derived from the card APR compounded monthly over `features.waitMonths` (default 3); late fees and penalty APRs are not modeled.
- No new charges, fees, or rate changes during payoff.
- Illustrative estimates only; not an offer, quote, pre-qualification, or advice. Demo disclaimer banner always shown.

## Tests
`debt.test.ts`: $20k @ 22.77% first minimum = $579.50, terminates, totalPaid = principal + interest; zero APR; zero balance → 0 months; invalid (negative, NaN, 0% principal) → null; fixed payment zero-rate months, payment ≤ interest → null; plan beats minimums; program flat cost; `balanceAfterWaiting` is derived from the APR and validated (M5); a non-amortizing minimum rule reports `capped` (M8).
