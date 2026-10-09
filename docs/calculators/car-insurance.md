# Car insurance cost estimator

- **Route:** `/car-insurance` · **Component:** `CarInsuranceCalculator` (export from `@loan-calculators/core`, prop `projectName: "achieve" | "fdr" | "bills"`)
- **Reference:** https://elfsight.com/calculator-form-widget/templates/car-insurance-calculator/

## Purpose
Elfsight template formula: *Car Insurance Cost = Base Premium + Additional Coverage Costs*. Widget inputs are JS-rendered and not visible, so inputs are inferred from common rating factors: driver age, record, vehicle type, coverage level, deductible, mileage, garaging area, roadside/rental add-ons.

## Inputs
| Key | Label | Type | Default | Min–max | Validation |
|---|---|---|---|---|---|
| `driverAge` | Primary driver age | select | 25-64 | — | option list |
| `record` | Driving record (last 3–5 yrs) | select | clean | — | option list |
| `vehicle` | Vehicle type | select | sedan | — | option list |
| `coverage` | Coverage level | select | standard | — | option list |
| `deductible` | Deductible | select | 500 | — | option list |
| `mileage` | Annual mileage | select | average | — | option list |
| `area` | Where the car is garaged | select | suburban | — | option list |
| `roadside` | Roadside assistance | select | no | — | option list |
| `rental` | Rental reimbursement | select | no | — | option list |
| `basePremium` | Base annual premium assumption | number | 1800 | 0–100000 | required |

Content labels/hints live in `src/content/car-insurance.content.json → form.fields`. Inputs with many options are under **More options** (collapsed on mobile, always open on desktop).

## Outputs
- Est. monthly premium (primary)
- Est. annual, rough range (±15%), combined factor, add-ons

All values render in the light estimate card (`ResultsPanel`) with the brand-primary CTA (placeholder, no live link) and the mobile estimate-first sticky bar. Tables scroll horizontally on mobile.

## Formulas
`annual = base × Π factor_i + Σ addOns`; `monthly = annual / 12`; range = annual × (1 ± rangePct).

### Worked example (defaults)
Defaults (25–64, clean, sedan, standard, $500 ded., average miles, suburban, no add-ons): factors all 1.0 → $1,800/yr = **$150/mo** (range $1,530–$2,070). A 16–20 driver, full coverage, urban, both add-ons → 1,800 × 2.2 × 1.3 × 1.25 + 90 = $6,525/yr.

## Data sources / APIs
None. All defaults are illustrative config values (see assumptions).

## Config vs content
- `src/config/car-insurance.config.json`: `defaults` (initial values), `validation` (min/max/label/allowZero per input, enforced by `validateRange`), `features` (`factors`, `addOns`, `rangePct`, `note`), `cta` (enabled / preventDefault). Numbers/assumptions only.
- `src/content/car-insurance.content.json`: text only (CMS-ready): `meta`, `header`, `demoBanner` (disclaimer), `form.fields` (labels, hints, option labels), `results` (headings, labels, messages), `cta`, `footer`. Rendered as React text — never HTML.
- **Rethemeing per brand:** no per-calculator brand config. `projectName` selects tokens in `src/brand/tokens.ts` via `BrandTheme`; footer copy containing “Achieve-styled” is auto-adapted by `adaptBrandChromeNote`. To vary copy per brand, swap the content JSON from a CMS entry per brand.

## Assumptions & limitations
- **No free public quote API exists**; factor table and base premium are transparent, illustrative config values — not actuarial rates, not averages, not quotes.
- No state rules, credit-based insurance scores, multi-car/bundling discounts, or claims history beyond the record selector.
- Illustrative estimates only; not an offer, quote, pre-qualification, or advice. Demo disclaimer banner always shown.

## Tests
`insurance.test.ts`: multiply + add-ons, zero base, invalid factors/add-ons → null, lookupFactor default 1.
