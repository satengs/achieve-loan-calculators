# Home insurance cost estimator

- **Route:** `/home-insurance` · **Component:** `HomeInsuranceCalculator` (export from `@loan-calculators/core`, prop `projectName: "achieve" | "fdr" | "bills"`)
- **Reference:** https://elfsight.com/calculator-form-widget/templates/home-insurance-calculator/

## Purpose
Elfsight formula: *Home Insurance Cost = Base Premium + Additional Coverage Costs + Deductible*. Adding the deductible to the premium isn't how premiums work, so we model the deductible as a premium factor (higher deductible → lower premium). Inferred inputs: dwelling coverage, rate per $1,000, area risk, home age, construction, deductible, claims, contents %, liability limit.

## Inputs
| Key | Label | Type | Default | Min–max | Validation |
|---|---|---|---|---|---|
| `dwelling` | Dwelling coverage (rebuild cost) | number | 350000 | 10000–100000000 | required, >0 |
| `ratePerThousand` | Base rate per $1,000 of coverage | number | 4 | 0–100 | required |
| `region` | Area risk profile | select | moderate | — | option list |
| `homeAge` | Age of home | select | mid | — | option list |
| `construction` | Construction | select | frame | — | option list |
| `deductible` | Deductible | select | 1000 | — | option list |
| `claims` | Claims in last 5 years | select | 0 | — | option list |
| `contents` | Personal property coverage | select | 50 | — | option list |
| `liability` | Liability limit | select | 300000 | — | option list |

Content labels/hints live in `src/content/home-insurance.content.json → form.fields`. Inputs with many options are under **More options** (collapsed on mobile, always open on desktop).

## Outputs
- Est. monthly premium (primary)
- Annual, rough range (±20%), base, combined factor

All values render in the light estimate card (`ResultsPanel`) with the brand-primary CTA (placeholder, no live link) and the mobile estimate-first sticky bar. Tables scroll horizontally on mobile.

## Formulas
`base = coverage / 1000 × ratePer1000`; `annual = base × Π factors + liabilityAddOn`; `monthly = annual/12`.

### Worked example (defaults)
$350,000 × $4/1k = $1,400; default factors 1.0; $300k liability +$25 → **$1,425/yr ≈ $118.75/mo** (range $1,140–$1,710).

## Data sources / APIs
None. All defaults are illustrative config values (see assumptions).

## Config vs content
- `src/config/home-insurance.config.json`: `defaults` (initial values), `validation` (min/max/label/allowZero per input, enforced by `validateRange`), `features` (`factors`, `liabilityAddOn`, `rangePct`), `cta` (enabled / preventDefault). Numbers/assumptions only.
- `src/content/home-insurance.content.json`: text only (CMS-ready): `meta`, `header`, `demoBanner` (disclaimer), `form.fields` (labels, hints, option labels), `results` (headings, labels, messages), `cta`, `footer`. Rendered as React text — never HTML.
- **Rethemeing per brand:** no per-calculator brand config. `projectName` selects tokens in `src/brand/tokens.ts` via `BrandTheme`; footer copy containing “Achieve-styled” is auto-adapted by `adaptBrandChromeNote`. To vary copy per brand, swap the content JSON from a CMS entry per brand.

## Assumptions & limitations
- **No free public quote API**; all factors are transparent illustrative config values, not quotes or published averages.
- Flood/earthquake excluded.
- Illustrative estimates only; not an offer, quote, pre-qualification, or advice. Demo disclaimer banner always shown.

## Tests
`insurance.test.ts`: perThousandBase, factorEstimate, lookup defaults, invalid.
