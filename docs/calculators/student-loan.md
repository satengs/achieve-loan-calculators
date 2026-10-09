# Student loan calculator

- **Route:** `/student-loan` · **Component:** `StudentLoanCalculator` (export from `@loan-calculators/core`, prop `projectName: "achieve" | "fdr" | "bills"`)
- **Reference:** https://elfsight.com/calculator-form-widget/templates/student-loan-calculator/

## Purpose
Elfsight formula: *Repayment = (Loan + Interest) / Number of periods*. We use the standard amortizing payment (which satisfies that identity), plus capitalized interest during in-school/grace months and extra-payment payoff.

## Inputs
| Key | Label | Type | Default | Min–max | Validation |
|---|---|---|---|---|---|
| `balance` | Loan balance | number | 30000 | 100–10000000 | required, >0 |
| `apr` | Interest rate | number | 6.5 | 0–30 | required |
| `termYears` | Repayment term | number | 10 | 1–30 | required, >0 |
| `deferMonths` | Months until repayment starts | number | 0 | 0–120 | required |
| `extraMonthly` | Extra monthly payment | number | 0 | 0–1000000 | required |

Content labels/hints live in `src/content/student-loan.content.json → form.fields`. Inputs with many options are under **More options** (collapsed on mobile, always open on desktop).

## Outputs
- Monthly payment (primary)
- Total interest (incl. capitalized), total repaid, payoff with extra, interest saved
- Capitalized interest; yearly schedule

All values render in the light estimate card (`ResultsPanel`) with the brand-primary CTA (placeholder, no live link) and the mobile estimate-first sticky bar. Tables scroll horizontally on mobile.

## Formulas
`cap = balance × APR/12 × deferMonths` (simple, unsubsidized); `P = balance + cap`; standard amortization over term; extra-payment loop.

### Worked example (defaults)
$30,000 at 6.5%, 10 yr → **$340.64/mo**, interest $10,877.27. With 6 deferment months: $975 capitalized.

## Data sources / APIs
None. All defaults are illustrative config values (see assumptions).

## Config vs content
- `src/config/student-loan.config.json`: `defaults` (initial values), `validation` (min/max/label/allowZero per input, enforced by `validateRange`), `features` (`rateKey`), `cta` (enabled / preventDefault). Numbers/assumptions only.
- `src/content/student-loan.content.json`: text only (CMS-ready): `meta`, `header`, `demoBanner` (disclaimer), `form.fields` (labels, hints, option labels), `results` (headings, labels, messages), `cta`, `footer`, `table`. Rendered as React text — never HTML.
- **Rethemeing per brand:** no per-calculator brand config. `projectName` selects tokens in `src/brand/tokens.ts` via `BrandTheme`; footer copy containing “Achieve-styled” is auto-adapted by `adaptBrandChromeNote`. To vary copy per brand, swap the content JSON from a CMS entry per brand.

## Assumptions & limitations
- **No keyless public series for student loan rates is wired** — federal rates are set annually by statute (studentaid.gov); default 6.5% is an illustrative config value and the UI says so.
- IDR plans, forgiveness, subsidies not modeled.
- Illustrative estimates only; not an offer, quote, pre-qualification, or advice. Demo disclaimer banner always shown.

## Tests
`loans.test.ts`: capitalizedInterest, payoffWithExtra (savings, zero rate, invalid).
