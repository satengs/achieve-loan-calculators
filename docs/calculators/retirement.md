# Retirement withdrawal calculator

- **Route:** `/retirement` · **Component:** `RetirementCalculator` (export from `@loan-calculators/core`, prop `projectName: "achieve" | "fdr" | "bills"`, `rates?: MarketRates`)
- **Presentation:** shared spend-down layout (`PresentationResults`, row `SliderField`, `MicroStats`, `DepletionChart`, `TipCallout`) — reusable by other calculators later.

## Purpose
Estimate how long a retirement nest egg could last given a monthly withdrawal, an assumed return, and an optional annual raise tied to CPI. Presentation mirrors a two-column form + tinted results card (sentence headline, micro-stats, depletion bars, tip).

The earlier accumulation helper `retirementProjection` remains in `calc/savings.ts` for tests and other hosts; the demo UI is spend-down first.

## Inputs
| Key | Label | Type | Default | Min–max | Validation |
|---|---|---|---|---|---|
| `startAge` | Age when you start withdrawals | number | 67 | 40–90 | required |
| `savings` | Retirement savings | number | 500000 | 0–1e9 | required |
| `monthlyWithdrawal` | Monthly withdrawal | number | 2500 | 0–1e6 | required |
| `annualReturn` | Return rate | number | 5 | 0–20 | required |
| raise checkbox | Raise withdrawal with inflation | bool | on | — | uses live CPI YoY |

Content labels live in `src/content/retirement.content.json`. Slider ranges live in `config.features.sliders`.

## Outputs
- Sentence headline with duration emphasized
- Micro-stats: You take out / Growth along the way
- Depletion bar chart by age
- Tip callout (suggests a monthly amount to last until a target age when runway ends before the warn age)
- Mobile sticky duration bar; desktop sticky tinted results card

## Formulas
Monthly loop: apply effective monthly return, then withdraw. Optional annual raise: `withdrawal *= (1 + inflationPct/100)` each year. Totals: withdrawn sum and interest sum. Chart samples balance at year boundaries. `withdrawalToLastUntil` binary-searches a starting monthly withdrawal that lasts to `tipTargetAge`.

### Worked example (defaults)
Age 67, $500,000, $2,500/mo, 5% return, ~3.72% CPI raise → runway on the order of ~20 years (exact months depend on live CPI). Growth along the way is the cumulative interest credited before withdrawals.

## Data sources / APIs
| Rate key | Meaning | FRED series | Source page |
|---|---|---|---|
| `inflationYoY` | BLS CPI-U YoY % (latest vs observation dated exactly 12 months earlier) | `CPIAUCSL` | https://fred.stlouisfed.org/series/CPIAUCSL |

Used only when the inflation-raise checkbox is on.

## Config vs content
- `retirement.config.json`: defaults, validation, slider ranges, tip ages, maxAge, cta.
- `retirement.content.json`: CMS text only (headline/tip templates with `{{vars}}`, field labels, disclaimers). Never HTML.

## Assumptions & limitations
- Constant return; no taxes, fees, Social Security, or sequence-of-returns risk.
- Illustrative only — not advice or an offer.

## Tests
`savings.test.ts › retirementDrawdown`, `withdrawalToLastUntil + formatDurationMonths`; legacy `retirementProjection` kept.
