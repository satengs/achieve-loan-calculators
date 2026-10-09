# Multi-brand themes

## Brands

| `projectName` | Palette note |
|---|---|
| `achieve` | Achieve-inspired blue (`#3300FF`) + DM Sans |
| `fdr` | Matched to freedomdebtrelief.com: navy `#154199` primary, red `#CB000E` CTA, `#2F2F2F` text, `#F9F9F9` page bg, 8px radius; Ultramarine → DM Sans fallback (see below) |
| `bills` | Warm orange (`#C2410C` CTA) + system UI |

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

## Optional tokens (v2)

`BrandTokens` gained optional `cta`, `ctaHover`, `ctaText`, `link`, `heading`. They become
`--lc-cta`, `--lc-cta-hover`, `--lc-cta-text`, `--lc-link`, `--lc-heading` and default to
`primary` / `primaryHover` / `#fff` / `primary` / `primaryDark`, so brands that don't set them
(Achieve, bills) render exactly as before.

## FDR token sources (extracted Oct 9, 2026)

Extracted from https://www.freedomdebtrelief.com/ (homepage hero debt slider + "You could free up…" savings tool)
and https://apply.freedomdebtrelief.com/freedomrelief/estimated-debt (apply-flow tool card), using headless
Chromium `getComputedStyle` plus the site's Tailwind CSS bundle (`/_next/static/chunks/*.css`).
Evidence: `/workspace/fdr-theme-match/` (NOTES.md, `ref/*.png`, `ref/*-computed.json`).

| Token | Value | FDR source (selector / class) |
|---|---|---|
| `primary` | `#154199` | `.bg-content-accent` — "Get a free evaluation" (savings tool), apply-flow "Continue", slider thumb, `outline-blue-accent` |
| `primaryHover` | `#002D87` | `.bg-blue-700` (FDR palette); FDR's own hover leaves the fill unchanged, darker step chosen so hover is visible |
| `primaryDark` | `#041B93` | `.text-blue-base` / `.border-blue-base` — "See if you qualify" outline button, "Client Dashboard" label |
| `bg` | `#F9F9F9` | `.bg-secondary` — hero + alternating sections |
| `bgTint` | `#F0F3FF` | `.bg-blue-540` — "Client Dashboard" pill |
| `surface` | `#FFFFFF` | tool cards `.rounded-lg.bg-white` |
| `text` | `#2F2F2F` | `.text-content-primary` — h2 "Get rid of debt", tool headings |
| `textSecondary` | `#454545` | body paragraph computed color |
| `textMuted` | `#737373` | `.text-content-secondary` — eyebrow, slider min/max labels |
| `border` | `#E7ECF3` | `.bg-gray-75` hairline |
| `borderStrong` | `#C0CBD8` | `select.border-gray-145` (debt-amount select) |
| `error` | `#D01F1D` | `.text-red-500` |
| `focusRing` | `rgba(51,0,255,0.2)` | slider thumb hover ring `box-shadow: 0 0 0 6px #30f3` |
| `radius` / `radiusLg` | `8px` / `8px` | `.rounded-lg` on buttons, selects and tool cards |
| `font` | `Ultramarine, DM Sans, …` | `--font-ultramarine` (self-hosted, licensed). Apply flow declares `font-family: Ultramarine, "DM Sans"`; we load DM Sans (Google Fonts via next/font) and do not ship Ultramarine |
| `shadow` | 3-layer soft shadow | apply-flow `StepContainer…stepCard` box-shadow |
| `cta` / `ctaHover` / `ctaText` | `#CB000E` / `#A3000B` / `#FFFFFF` | `.bg-red-850` hero "Continue" + sticky "See if you qualify"; label `text-white font-bold 18px` (5.92:1). Hover is our darker step (FDR has no hover change) |
| `link` | `#3300FF` | `.text-blue-560` — "privacy policy", "How are these numbers calculated?" |
| `heading` | `#2F2F2F` | headings use content-primary, weight 500, tracking −0.01em |

Brand-scoped CSS (`[data-project="fdr"]` in `packages/calculators/styles/tokens.css`): medium-weight headings with
−0.01em tracking; eyebrow 700 / uppercase / 0.25em tracking in `#737373`; borderless white cards with soft shadow;
CTA 48px tall, 18px bold, −0.02em tracking; result values in `#041B93`.

Contrast: white on CTA `#CB000E` 5.92:1; white on primary `#154199` 9.34:1; `#737373` muted on white 4.74:1
(4.50:1 on `#F9F9F9`); CTA fill vs white card 5.92:1 (≥3:1). Mobile sticky estimate bar uses `primaryDark` `#041B93`
with white (13.26:1).

Not copied: FDR logos, imagery, the Ultramarine font files, trust badges.
