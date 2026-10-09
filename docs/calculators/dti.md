# Debt-to-income (DTI) calculator

- **Route:** `/dti` · **Component:** `DtiCalculator` (export from `@loan-calculators/core`, prop `projectName: "achieve" | "fdr" | "bills"`)
- **Reference:** https://www.achieve.com/tools/debt-income-ratio-calculator

## Purpose
Inputs mirror Achieve: monthly gross income, monthly debt payments, estimated credit card balance. Output DTI % and a neutral band (≤35% good, 36–43% needs work, ≥44% high — the bands displayed on the reference).

## Inputs
| Key | Label | Type | Default | Min–max | Validation |
|---|---|---|---|---|---|
| `monthlyIncome` | Monthly gross income | number | 6000 | 1–10000000 | required, >0 |
| `monthlyDebts` | Monthly debt payments | number | 1980 | 0–10000000 | required |
| `cardBalance` | Credit card balances not included above (est.) | number | 0 | 0–10000000 | required |
| `cardMinPct` | Estimated card minimum (% of balance) | number | 3 | 0–100 | required |

Content labels/hints live in `src/content/dti.content.json → form.fields`. Inputs with many options are under **More options** (collapsed on mobile, always open on desktop).

## Outputs
- DTI % (primary)
- Band label + neutral explanation
- Monthly debts used, payment level at 35% of income, difference vs 35%

All values render in the light estimate card (`ResultsPanel`) with the brand-primary CTA (placeholder, no live link) and the mobile estimate-first sticky bar. Tables scroll horizontally on mobile.

## Formulas
`cardMin = cardBalance × cardMin%` (default 3%); `debts = monthlyDebts + cardMin`; `DTI = debts / income × 100`; band: ≤ goodMax → good, ≤ fairMax → fair, else high.

### Worked example (defaults)
$6,000 income, $1,980 debts, $0 card balance → 1,980/6,000 = **33.0%** → “35% or less”. 35% of income = $2,100 → $120 headroom.

## Data sources / APIs
None. All defaults are illustrative config values (see assumptions).

## Config vs content
- `src/config/dti.config.json`: `defaults` (initial values), `validation` (min/max/label/allowZero per input, enforced by `validateRange`), `features` (`bands`), `cta` (enabled / preventDefault). Numbers/assumptions only.
- `src/content/dti.content.json`: text only (CMS-ready): `meta`, `header`, `demoBanner` (disclaimer), `form.fields` (labels, hints, option labels), `results` (headings, labels, messages), `cta`, `footer`. Rendered as React text — never HTML.
- **Rethemeing per brand:** no per-calculator brand config. `projectName` selects tokens in `src/brand/tokens.ts` via `BrandTheme`; footer copy containing “Achieve-styled” is auto-adapted by `adaptBrandChromeNote`. To vary copy per brand, swap the content JSON from a CMS entry per brand.

## Assumptions & limitations
- Gross income; front-end (housing) ratio not computed.
- Band wording is neutral and not a lending criterion or guarantee.
- Card minimum % is an estimate; users who already included card minimums should leave balance at 0.
- Illustrative estimates only; not an offer, quote, pre-qualification, or advice. Demo disclaimer banner always shown.

## Tests
`dti.test.ts`: Achieve example 33%, band boundaries 35/36/43/44, zero debts, zero/negative income → NaN, card minimum validation.
