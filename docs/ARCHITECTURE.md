# Architecture

## Monorepo

```
loan-calculators/
  packages/calculators/   # @loan-calculators/core — importable React package
  apps/demo/              # Next.js demo that imports the package (Vercel deploy target)
  docs/
```

## Package API

```tsx
import {
  MortgageCalculator,
  PersonalLoanCalculator,
  HelocCalculator,
  LifeInsuranceCalculator,
} from '@loan-calculators/core';
import '@loan-calculators/core/styles.css';

<MortgageCalculator projectName="achieve" rates={rates} />
<PersonalLoanCalculator projectName="fdr" />
<HelocCalculator projectName="bills" rates={rates} />
<DebtPayoffCalculator projectName="fdr" rates={rates} />
<CarInsuranceCalculator projectName="bills" />
```

`projectName`: `"achieve" | "fdr" | "bills"` — selects brand CSS variables via `BrandTheme`.

## Layers

| Layer | Location | Responsibility |
|---|---|---|
| Pure math | `packages/calculators/src/calc/` | amortize, fees, equity, life, validate, format — no DOM |
| Content | `packages/calculators/src/content/*.json` | User-facing copy only (CMS-ready keys) |
| Config | `packages/calculators/src/config/*.json` | Defaults, validation ranges, feature flags |
| Brand | `packages/calculators/src/brand/` | Tokens + `BrandTheme` |
| UI primitives | `packages/calculators/src/components/` | Shell, Field, Results, CTA, DemoBanner |
| Calculators | `packages/calculators/src/calculators/` | Client components wiring math + content (17 total — see `docs/calculators/README.md`) |
| Rates contract | `packages/calculators/src/rates/` | `MarketRates` / `RateInfo` types + pure `resolveRate()` (live value or config fallback). **No fetching in core.** |
| Rates fetch (demo) | `apps/demo/src/lib/rates.ts`, `app/api/rates/route.ts` | Server-side FRED fetch (CSV keyless or API with `FRED_API_KEY`), daily revalidate |

## Data flow

1. Calculator loads local content + config JSON (typed/validated with zod for config).
2. `BrandTheme` sets `data-project` + CSS variables from `BRAND_TOKENS[projectName]`.
3. User input → `validateRange` from config → pure calc → formatters → ResultsPanel.
4. All copy rendered with React text nodes — **no `dangerouslySetInnerHTML`**.

## Safety

- Content JSON treated as untrusted for HTML: text only.
- CTA `href` allowlisted (`#`, `/`, `http(s)`, `mailto:`).
- Division-by-zero guarded in equity ratios.
- NaN/Infinity never shown as numbers — formatters return `—`.
- Accessible labels, `aria-invalid`, `role="alert"` error regions, `aria-live` results.

## Demo app

`apps/demo` imports `@loan-calculators/core` via workspace. Default brand from `NEXT_PUBLIC_BRAND` (fallback `achieve`). Each page is a thin wrapper:

```tsx
export default function Page() {
  return <MortgageCalculator projectName={process.env.NEXT_PUBLIC_BRAND || 'achieve'} />;
}
```


## Rates layer

```
FRED (CSV or JSON API)
   │  fetch(..., { next: { revalidate: 86400 } })
   ▼
apps/demo/src/lib/rates.ts  getMarketRates(keys) → { rates: MarketRates, errors }
   │                         (also GET /api/rates)
   ▼
app/<calc>/page.tsx  (async server component, export const revalidate = 86400)
   │  <BrandedX rates={rates} />   — serializable props
   ▼
@loan-calculators/core  <XCalculator projectName rates />
   │  resolveRate(rates, key, config.defaults.x, transform?)
   ▼
initial input value + <RateNote> (“based on <source>, as of <date>” | fallback note)
```

- Core stays pure and CMS-ready: components accept `rates?: MarketRates`; without it they use config defaults (and say so).
- Live values only seed **initial** input state; users can edit any rate.
- See [`DATA-SOURCES.md`](DATA-SOURCES.md) for series, transforms, and fallbacks; per-calculator docs in [`calculators/`](calculators/README.md).

## Shared UI primitives (batch 16)

`SelectField` (native select), `SliderField` (range + exact input), `MoreOptions` (collapsed on mobile, open on desktop), `RateNote` (rate provenance), `DataTable` (scrolling table). Internal helpers: `useNumberInputs`/`NumberFields` (config-validated numeric state), `useCalculatorSetup`, `YearScheduleCard`.
