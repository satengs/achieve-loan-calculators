# Unified configuration props (v1)

Every calculator in `@loan-calculators/core` (all 19) accepts the same CMS-friendly props,
typed as `CalculatorBaseProps<Inputs, Result>` (`packages/calculators/src/shell/options.tsx`).
Each calculator also exports `<Name>Props`, `<Name>Inputs` (for `defaults`) and `<Name>Result`
(for `onCalculate`).

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `showHeader` | `boolean` | `true` | Built-in eyebrow, title and subtitle. |
| `showDemoBanner` | `boolean` | `false` | Demo-only notices: sample-rates banner, placeholder CTA note (`cta.demoNote`), demo footer line (`footer.demoNote`), HELOC demo summary prefix. The demo app passes `true`. |
| `showBreakdown` | `boolean` | `true` | Amortization / schedule / comparison tables and detailed breakdown rows. No-op on DTI, car insurance, home insurance and retirement (nothing to hide). |
| `showCta` | `boolean` | `true` | Built-in CTA button. |
| `showDisclaimer` | `boolean` | `true` | Compliance / legal footnote (`footer.note`) and CTA disclosure (`cta.note`). |
| `title`, `subtitle` | `string` | CMS `header.title` / `header.intro` | Copy overrides. |
| `headingLevel` | `"h2" \| "h3" \| "div"` (+ `"h1"`) | `"h2"` | Title element. Section headings render one level below (`div` → `h3`). `"h1"` is for standalone pages; the demo uses it. |
| `ctaLabel`, `ctaHref` | `string` | CMS `cta.label` / `cta.href` | A host `ctaHref` navigates normally (no `preventDefault`) and drops the placeholder note. Unsafe schemes fall back to `#`. |
| `onCtaClick` | `() => void` | — | Called after `onInteract({ type: "cta_click" })`. |
| `defaults` | `Partial<Inputs>` | config defaults | Initial input values. Wins over config defaults and live-rate defaults. Mortgage derives the loan amount and HELOC the credit limit from host-set inputs unless those are set too. |
| `variant` | `"full" \| "compact"` | `"full"` | `compact` = single column, 1px borders, no sticky panels, smaller header. |
| `onInteract` | `(e: CalculatorInteractionEvent) => void` | — | `{ type: "input" \| "control" \| "cta_click", calculator, field?, value?, label?, href? }`. One delegated listener in `CalculatorShell`. |
| `onCalculate` | `(result: Result) => void` | — | Fires when the computed result changes (mount + each valid change). Skips invalid inputs, identical results and unrelated re-renders; inline callbacks are safe. |

```tsx
import { MortgageCalculator, type CalculatorInteractionEvent } from "@loan-calculators/core";
import "@loan-calculators/core/styles.css";

<MortgageCalculator
  projectName="achieve"
  headingLevel="h3"
  variant="compact"
  showBreakdown={false}
  defaults={{ homePrice: 450000, apr: 6.4 }}
  ctaLabel="See your options"
  ctaHref="/get-started"
  onInteract={(e: CalculatorInteractionEvent) => track("calculator_interact", e)}
  onCalculate={(r) => track("calculator_result", { monthly: r.monthlyPiti })}
/>;
```

## Boundaries

- The Technical details tab, brand switcher and breadcrumbs live only in `apps/demo`.
- `apps/demo` renders every calculator with `showDemoBanner` and `headingLevel="h1"`
  (`DEMO_CALCULATOR_PROPS` in `apps/demo/src/components/BrandedCalculators.tsx`).
- Shared sub-components read the resolved options from context: `SectionHeading`,
  `Breakdown`, `CalculatorCta`, `useOnCalculate`.

## Content keys

- `cta.note`: real CTA disclosure (shown with `showDisclaimer`).
- `cta.demoNote`: placeholder CTA notice (shown with `showDemoBanner`, hidden when the host sets `ctaHref`).
- `footer.note`: legal footnote (`showDisclaimer`).
- `footer.demoNote`: demo-only footer line (`showDemoBanner`).
