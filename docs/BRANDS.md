# Multi-brand themes

## Brands

| `projectName` | Palette note |
|---|---|
| `achieve` | Achieve-inspired blue (`#3300FF`) + DM Sans |
| `fdr` | Forest green professional + Georgia |
| `bills` | Warm orange (`#E85D04`) + system UI |

Tokens: `packages/calculators/src/brand/tokens.ts`  
Applied by: `<BrandTheme projectName="…">` / each calculator wraps itself.

## Switch brand in the demo app

```bash
# .env.local in apps/demo
NEXT_PUBLIC_BRAND=fdr
```

Or:

```bash
NEXT_PUBLIC_BRAND=bills npm run dev -w @loan-calculators/demo
```

## Switch brand when importing the package

```tsx
<MortgageCalculator projectName="achieve" />
<MortgageCalculator projectName="fdr" />
<MortgageCalculator projectName="bills" />
```

Brand apps later: each Next app can hardcode its `projectName` while sharing `@loan-calculators/core`.
