# CMS readiness (Contentful later — not integrated now)

## Current source of truth

Local JSON only, no Contentful SDK, no API keys:

| File | Role |
|---|---|
| `packages/calculators/src/content/*.content.json` | Copy: titles, labels, hints, CTA text, demo banner |
| `packages/calculators/src/content/site.json` | Landing cards + intro |
| `packages/calculators/src/config/*.config.json` | Defaults, min/max, feature flags, locale/currency |

Loaded in `src/content/load.ts` via static imports.

## Contentful field map (future)

Suggested content types:

### CalculatorContent

| Field | Type | Maps to |
|---|---|---|
| `calculatorId` | Short text | `personal-loan` / `mortgage` / `heloc` / `life-insurance` |
| `metaTitle` | Short text | `meta.title` |
| `metaDescription` | Long text | `meta.description` |
| `header` | JSON / Object | `header.*` |
| `demoBanner` | JSON | `demoBanner.*` |
| `form` | JSON | `form.*` |
| `results` | JSON | `results.*` |
| `ctaLabel` / `ctaHref` / `ctaNote` | Text | `cta.*` |
| `footerNote` | Long text | `footer.note` |

### CalculatorConfig

| Field | Type | Maps to |
|---|---|---|
| `calculatorId` | Short text | same id |
| `defaults` | JSON | `defaults` |
| `validation` | JSON | `validation` |
| `features` | JSON | `features` |
| `locale` / `currency` | Short text | top-level |

## Swap path

1. Keep JSON shape identical.
2. Replace static imports in `load.ts` with a fetch/SDK adapter that returns the same TypeScript types.
3. Optional: `content/{brand}/` for brand-specific copy later; theme already switches via `projectName`.
4. Never store HTML in CMS fields that the UI would inject — text only.
