# Life insurance coverage estimator (extended)

- **Route:** `/life-insurance` · **Component:** `LifeInsuranceCalculator (extended)` (export from `@loan-calculators/core`, prop `projectName: "achieve" | "fdr" | "bills"`)
- **Reference:** https://elfsight.com/calculator-form-widget/templates/life-insurance-calculator/

## Purpose
Existing DIME-style need estimator kept; Elfsight template formula is *Premium = Coverage × Premium Rate / 100*. Added age band + tobacco selects and an **illustrative premium** on the computed need (rate per $1,000 by age band × term multiplier × tobacco multiplier). Not a near-duplicate route.

## Inputs
| Key | Label | Type | Default | Min–max | Validation |
|---|---|---|---|---|---|
| `annualIncome` | Annual income | number | 75000 | 0–100000000 | required |
| `yearsReplace` | Years of income to replace | number | 10 | 0–50 | required |
| `totalDebts` | Total debts (incl. mortgage balance) | number | 250000 | 0–1000000000 | required |
| `finalExpenses` | Final expenses estimate | number | 15000 | 0–10000000 | required |
| `educationFund` | Education / other goals fund | number | 50000 | 0–100000000 | required |
| `existingCoverage` | Existing life coverage | number | 100000 | 0–1000000000 | required |
| `liquidAssets` | Liquid assets available to survivors | number | 25000 | 0–1000000000 | required |
| `termYears` | Preferred term length (informational) | number | 20 | — | option list |
| `ageBand` | Age (for illustrative premium) | select | 30-39 | — | option list |
| `tobacco` | Tobacco use | select | no | — | option list |

Content labels/hints live in `src/content/life-insurance.content.json → form.fields`. Inputs with many options are under **More options** (collapsed on mobile, always open on desktop).

## Outputs
- Additional coverage to consider (primary)
- Gross need, income replacement, debts, offsets
- Final expenses, education, term, illustrative monthly/annual premium

All values render in the light estimate card (`ResultsPanel`) with the brand-primary CTA (placeholder, no live link) and the mobile estimate-first sticky bar. Tables scroll horizontally on mobile.

## Formulas
`need = income×years + debts + final + education − existing − assets` (≥0). `premium/yr = need/1000 × rate(age) × termMult × (tobacco ? 2.5 : 1)`.

### Worked example (defaults)
Defaults → need **$940,000**; age 30–39 (0.75/$1k), 20-yr (×1.0), non-tobacco → $705/yr ≈ **$58.75/mo**.

## Data sources / APIs
None. All defaults are illustrative config values (see assumptions).

## Config vs content
- `src/config/life-insurance.config.json`: `defaults` (initial values), `validation` (min/max/label/allowZero per input, enforced by `validateRange`), `features` (`currencyRoundToWhole`, `termAffectsNeed`, `premiumRatePer1000ByAge`, `tobaccoMultiplier`, `termMultiplier`, `premiumNote`), `cta` (enabled / preventDefault). Numbers/assumptions only.
- `src/content/life-insurance.content.json`: text only (CMS-ready): `meta`, `header`, `demoBanner` (disclaimer), `form.fields` (labels, hints, option labels), `results` (headings, labels, messages), `cta`, `footer`. Rendered as React text — never HTML.
- **Rethemeing per brand:** no per-calculator brand config. `projectName` selects tokens in `src/brand/tokens.ts` via `BrandTheme`; footer copy containing “Achieve-styled” is auto-adapted by `adaptBrandChromeNote`. To vary copy per brand, swap the content JSON from a CMS entry per brand.

## Assumptions & limitations
- Rate table is illustrative config, not carrier or actuarial pricing; no public premium API.
- Health class, gender, state, riders not modeled.
- Illustrative estimates only; not an offer, quote, pre-qualification, or advice. Demo disclaimer banner always shown.

## Tests
`amortize.test.ts › lifeCoverageEstimate`, `insurance.test.ts › lifePremiumEstimate` (per-$1k, invalid, zero rate).
