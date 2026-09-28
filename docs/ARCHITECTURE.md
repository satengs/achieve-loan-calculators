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

<MortgageCalculator projectName="achieve" />
<PersonalLoanCalculator projectName="fdr" />
<HelocCalculator projectName="bills" />
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
| Calculators | `packages/calculators/src/calculators/` | Client components wiring math + content |

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
