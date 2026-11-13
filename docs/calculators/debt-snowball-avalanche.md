# Debt snowball vs avalanche calculator

- **Route:** `/debt-snowball-avalanche` · **Component:** `DebtSnowballAvalancheCalculator` (export from `@loan-calculators/core`, prop `projectName: "achieve" | "fdr" | "bills"`, `initialFocus?: "compare" | "snowball" | "avalanche"`)
- **SEO aliases:** `/debt-snowball` and `/debt-avalanche` are real pages (not redirects) that render the same calculator with that method preselected, and with distinct document titles (“Debt snowball calculator”, “Debt avalanche calculator”) and breadcrumb labels.

## Purpose
Compare two popular extra-payment strategies on the same set of debts: **snowball** (smallest starting balance first) and **avalanche** (highest APR first). Show time to debt-free, total interest, payoff order, and the difference between the methods. This is a lightweight, multi-debt companion to the single-balance debt-payoff calculator — not a full debt-resolution product. A CMS-configurable CTA may link to Achieve’s Debt Optimizer (`https://www.achieve.com/achieve-debt-optimizer`) as a separate tool; the copy must not promise savings or results from that product.

## Inputs
| Key | Label | Type | Default | Min–max | Validation |
|---|---|---|---|---|---|
| `debts[]` (name) | Name | text | “Car loan leftover”, “Store card”, “Card A” | — | optional (falls back to “Debt N”) |
| `debts[]` (balance) | Balance | number | 1500, 4500, 6000 | 0–10,000,000 | required, ≥0 |
| `debts[]` (apr) | APR | number | 6.99, 24.99, 18.99 | 0–99 | required, ≥0 |
| `debts[]` (minPayment) | Minimum payment | number | 80, 120, 150 | 0–1,000,000 | required, ≥0 |
| `extraMonthly` | Extra monthly payment | number | 200 | 0–1,000,000 | required, ≥0 |

Default debts live in `features.defaultDebts` (not `defaults`, which only accepts scalars). The form starts with three rows; users can add up to `features.maxDebts` (8) or remove down to one. Content labels/hints live in `src/content/debt-snowball-avalanche.content.json → form.fields`.

The results panel has a Compare / Snowball / Avalanche toggle. Alias routes set `initialFocus` so the matching method is selected on load.

## Outputs
- Sentence headline: which method could cost less or finish sooner (or that they match, or that the debts would not pay off). Language uses “could”, never a guarantee.
- Payoff time and total interest for each method; interest and time difference (snowball minus avalanche; a positive interest difference means avalanche costs less).
- Approximate debt-free calendar month (N months from the current month, computed on the client).
- Payoff order with the month each debt is paid off.
- Balance-over-time chart (both series), with the unfocused series dimmed when a single method is selected.
- Warnings when a starting minimum is below that debt’s first-month interest, and when the simulation hits the month cap (`neverPaysOff`).

Achieve uses the presentation results card (headline, micro-stats, chart, tip). FDR and bills use the default labelled results layout, with the same chart and figures. A tip callout explains the trade-off without recommending a method. Figures are illustrative estimates only.

## Formulas
Monthly rate for a debt is `r = APR/100/12`. Amounts are rounded to cents (`Math.round(n × 100) / 100`) after interest and after each payment.

**Payoff order (fixed at the start, not re-sorted):** snowball sorts by starting balance ascending (then APR, then name); avalanche sorts by APR descending (then starting balance ascending, then name). Zero-balance debts are dropped.

**Each month, for every still-open debt:** accrue `interest = cents(balance × r)` and add it to the balance. The month’s cash budget is `extraMonthly + sum of remaining minimums`. First, each open debt is paid `min(minimum, balance)`. Leftover budget (the extra payment plus any unused portion of a minimum, including a minimum freed because a debt was paid off this month) is then applied along the fixed order, rolling to the next debt in the same month if the focus debt reaches zero.

**Cap:** if any balance remains after `maxMonths` (default 1,200), the result is `capped` / `neverPaysOff`. The simulation does **not** stop early just because a total balance grew — a debt whose minimum is below interest can still be paid off later, once it is the focus of the leftover budget. `growingAtStart` lists debts whose starting minimum is below the first month’s interest, as a warning only.

**Comparison:** `interestDelta = snowball.totalInterest − avalanche.totalInterest` (positive means avalanche costs less interest). `monthsDelta = snowball.months − avalanche.months` (positive means avalanche is faster).

```
interest = cents(balance × APR/100/12)
budget = extraMonthly + Σ remaining minimums
```

### Worked example (defaults)
Three debts and a $200 extra payment. Car loan leftover $1,500 at 6.99% (min $80). Store card $4,500 at 24.99% (min $120). Card A $6,000 at 18.99% (min $150). Snowball (smallest balance first) pays the car leftover in month 6, the store card in month 22, and Card A in month 37, with $3,737.28 total interest. Avalanche (highest APR first) pays the store card in month 17, the car leftover in month 20 (its own minimum finishes it), and Card A in month 33, with $3,133.75 total interest. Avalanche could save $603.53 in interest and finish 4 months sooner. These figures are illustrative, not a promise.

## Data sources / APIs
None. All balances, APRs, and payments are entered by the user. There is no live rate key.

## Config vs content
- `src/config/debt-snowball-avalanche.config.json`: `defaults.extraMonthly`, `validation` (min/max/label/allowZero per numeric field, enforced by `validateRange`), `features` (`defaultDebts`, `maxMonths` 1200, `maxDebts` 8), `cta` (`enabled`, `preventDefault: false` so the Optimizer link navigates). Numbers and limits only. Default debts cannot live in `defaults` because that map is scalar-only.
- `src/content/debt-snowball-avalanche.content.json`: text only (CMS-ready): `meta`, `header`, `aliases` (SEO titles/intros for `/debt-snowball` and `/debt-avalanche`), `demoBanner` (disclaimer), `form` (labels, questions, hints, add/remove copy), `results` (headlines, labels, tips, warnings), `cta` (label, `https://www.achieve.com/achieve-debt-optimizer`, a note that it is a separate tool and that figures are not a guarantee), `footer`. Rendered as React text — never HTML.
- **Rethemeing per brand:** no per-calculator brand config. `projectName` selects tokens in `src/brand/tokens.ts` via `BrandTheme`. Achieve uses the presentation results layout; FDR and bills keep the default labelled layout. To vary copy per brand, swap the content JSON from a CMS entry per brand.

## Assumptions & limitations
- APR is constant; fees, missed payments, penalty rates, due-date differences, and tax effects are not modeled.
- Interest is applied at the start of each month, then payments; rounding is to the nearest cent.
- Snowball uses each debt’s **original** balance for priority (standard snowball; the list is not re-sorted as balances change).
- Freed minimums roll onto the next debt in the same month, along with the extra payment.
- A minimum below interest does not by itself mean the debt never pays off — extra payment can close the gap once that debt is the focus.
- The 1,200-month cap (100 years) is a safety bound; a capped run is reported as “would not pay off”, not as a 100-year payoff.
- Payoff dates are calendar months from “now” in the visitor’s timezone (set after mount to avoid hydration mismatch) and are approximate.
- Illustrative estimates only; not a payoff plan, loan offer, advice, or a guarantee of savings or timing. The Debt Optimizer CTA is a link to a separate Achieve product and does not claim results from it. The demo disclaimer banner is always shown.

## Tests
`snowball.test.ts`: `sortDebts` (snowball = smallest starting balance, avalanche = highest APR, zero-balance dropped, name as a tie-break); `simulateStrategy` (hand-computed 3-month single-debt case at 12%, agreement with `simulateFixedPayment` on one debt, divergent payoff order and lower avalanche interest on a two-debt case, never-pays-off when min + extra cannot cover interest, still pays off when extra covers a min-below-interest gap, freed minimum rolls to the next debt, null on invalid input, zero balances finish immediately, month cap honored); `compareStrategies` deltas; `downsampleSeries` keeps first and last; `payoffCalendarMonth` crosses a year boundary (Nov 2026 + 3 months = Feb 2027).
