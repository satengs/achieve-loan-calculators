# Loan Calculators (monorepo)

Importable React calculator package with multi-brand themes (`achieve` | `fdr` | `bills`), plus a Next.js demo app.

**Sample rates and defaults are illustrative only — not offers, quotes, or guarantees.**

## Quick start

```bash
npm install
npm run dev          # demo at http://localhost:3000
npm test             # pure calc unit tests
npm run build        # build package consumers + demo
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
```

`projectName`: `"achieve" | "fdr" | "bills"`.

## Structure

```
packages/calculators/   # @loan-calculators/core
  src/calc/             # pure math (tested)
  src/brand/            # tokens + BrandTheme
  src/content/          # local CMS-ready copy JSON
  src/config/           # defaults / validation / features
  src/components/       # shared UI
  src/calculators/      # PersonalLoan, Mortgage, HELOC, LifeInsurance
  styles/tokens.css
apps/demo/              # Next.js App Router demo (deploy target)
docs/
  ARCHITECTURE.md
  CMS.md
  BRANDS.md
```

## Edit copy or defaults

- Copy: `packages/calculators/src/content/*.content.json`
- Behavior: `packages/calculators/src/config/*.config.json`
- No need to touch calculator math for label/CTA/default changes.

## Brand switch

See [docs/BRANDS.md](docs/BRANDS.md). Demo uses `NEXT_PUBLIC_BRAND` (default `achieve`).
This env/theme switch is for local/devtools only — it is not shown on the public landing UI.
Pass `projectName` on each calculator component when embedding.

## CMS later

Local JSON only today — no Contentful SDK. See [docs/CMS.md](docs/CMS.md).

## Deploy

Vercel project should use **Root Directory: `apps/demo`** (monorepo). Framework: Next.js. Install from repo root via workspace (`npm install` at root works with `installCommand` if configured).

Public demo: https://loan-calculators-public.vercel.app/
