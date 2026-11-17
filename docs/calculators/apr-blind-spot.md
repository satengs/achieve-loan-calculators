# APR blind spot calculator

- **Route:** `/apr-blind-spot` · **Component:** `AprBlindSpotCalculator` (export from `@loan-calculators/core`, props `projectName: "achieve" | "fdr" | "bills"`, `rates?: MarketRates`)

## Purpose
Show what new spending on a credit card really costs when the monthly payment stays the same. An APR states a yearly rate, but it does not show how many extra months, or how many extra interest dollars, a new purchase adds to payoff. The calculator compares paying off the current balance alone with paying off the balance plus the new spending, at the same APR and the same fixed payment, and reports the difference in time and interest, the real cost of the purchase, and the payment that would keep the original payoff month. Figures are illustrative estimates only.

## Inputs
| Key | Label | Type | Default | Min–max | Validation |
|---|---|---|---|---|---|
| `balance` | Current balance | number | 5,000 | 0–1,000,000 | required, ≥0 |
| `newSpending` | New spending to add | number | 1,000 | 0–1,000,000 | required, ≥0 |
| `apr` | Card APR | number | live `creditCard` rate, else 22 | 0–99 | required, ≥0 |
| `payment` | Monthly payment | number | 150 | 1–1,000,000 | required, >0 |

Achieve shows the CMS `question` sentences as labels; FDR and bills show the short `label`. Each field is on its own row.

## Outputs
- Sentence headline: how much time and interest the new spending could add at the same payment (or, when the payment does not cover a month's interest, that the balance would not go down and roughly how much the payment must exceed).
- Real cost of the new spending (`newSpending + extraInterest`) as the primary value and mobile sticky value.
- Payoff time with and without the new spending; extra time; extra interest.
- Cost per dollar spent (real cost ÷ new spending).
- Payment needed to keep the original payoff month.
- Interest with and without the new spending; approximate payoff calendar month for each (computed on the client from the current month).
- Balance-over-time chart with both lines.

Achieve uses the presentation results card (headline, micro-stats, chart, tip). FDR and bills use the default labelled results layout with the same figures and chart. Language uses “could”; nothing is a guarantee.

## Formulas
Monthly rate `r = APR/100/12`. Both schedules use the same APR and payment `P`; only the starting balance differs (`B` vs `B + S`, where `S` is the new spending).

**Monthly step:** `interest = balance × r`, then `balance = balance + interest − min(P, balance + interest)`, repeated until the balance is ≤ $0.005 or the month cap (`maxMonths`, default 1,200) is reached. Amounts are not rounded mid-schedule.

**Never pays off:** if `P ≤ balance × r` in the first month the balance cannot fall, so the schedule is flagged `neverPaysOff` and no payoff time is shown.

**Differences:** `extraMonths = months(B + S) − months(B)` and `extraInterest = interest(B + S) − interest(B)`.

**Real cost:** `trueCost = S + extraInterest`, and `costPerDollar = trueCost / S`.

**Payment to keep the payoff month:** the level payment that retires `B + S` in the original `n = months(B)`: `P* = (B + S) × r / (1 − (1 + r)^−n)`, or `(B + S) / n` at 0% APR.

```
r = APR / 100 / 12
trueCost = S + (interest(B + S) − interest(B))
P* = (B + S) × r / (1 − (1 + r)^−n)
```

### Worked example (defaults)
$5,000 balance, $1,000 of new spending, 22% APR, $150 a month. Monthly rate is 1.8333%. Without the new spending the balance is paid off in 52 months with $2,798.05 in interest. With it, payoff takes 73 months with $4,913.45 in interest. The new spending adds 21 months (1 year and 9 months) and $2,115.40 in interest, so the $1,000 really costs about $3,115.40, or about $3.12 per dollar spent. Paying about $179.97 a month (shown rounded up to $180) would keep the original 52-month payoff. These figures are illustrative, not a promise.

## Data sources / APIs
`creditCard` from the shared rates layer (Federal Reserve G.19 credit card plan rate, all accounts; FRED series `TERMCBCCALLNS`, https://fred.stlouisfed.org/series/TERMCBCCALLNS) prefills the APR. If the live rate is unavailable the config default (22%) is used and the rate note says so. The user can always overwrite the APR.

## Config vs content
- `src/config/apr-blind-spot.config.json`: `defaults` (balance, newSpending, apr fallback, payment), `validation` (min/max/label/allowZero per field, enforced by `validateRange`), `features` (`rateKey: creditCard`, `maxMonths` 1200, `chartPoints` 48), `cta` (`enabled`, `preventDefault`). Numbers and limits only.
- `src/content/apr-blind-spot.content.json`: text only (CMS-ready): `meta`, `header`, `demoBanner`, `form` (labels, Achieve questions, prefix/suffix), `results` (headline templates with `{{payment}}`, `{{spending}}`, `{{months}}`, `{{interest}}`, labels, tip, warnings, chart legend), `cta`, `footer`. Rendered as React text — never HTML.
- **Rethemeing per brand:** no per-calculator brand config. `projectName` selects tokens via `BrandTheme`. Achieve uses the presentation results layout; FDR and bills keep the default labelled layout.

## Assumptions & limitations
- APR is constant and interest compounds monthly on the full balance; there is no grace period, promotional rate, penalty APR, or balance-transfer fee.
- The new spending is added today, all at once; no other charges are added later.
- The monthly payment is fixed (not a card's declining minimum payment) and paid on time every month.
- Annual fees, late fees, and statement-cycle timing are not modeled.
- Illustrative estimate only — not advice, an offer, or a guarantee of savings or payoff timing.

## Tests
`aprBlindSpot.test.ts`: `fixedPaymentSchedule` (hand-computed 3-month case at 12%, agreement with `simulateFixedPayment`, never-pays-off when the payment equals monthly interest, zero balance and 0% APR, null on invalid input); `levelPayment` (standard amortization value, 0% and zero-balance cases, a level payment retires the balance in exactly n months); `newSpendingCost` (worked example above, zero new spending adds nothing, a higher APR makes the same purchase cost more, NaN deltas when only the larger balance never pays off, null on invalid input). `resolveRate` covers the live-rate prefill.
