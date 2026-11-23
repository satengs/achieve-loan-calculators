/**
 * Props reference for the Technical details tab (demo-only).
 * Mirrors `CalculatorBaseProps` in packages/calculators/src/shell/options.tsx —
 * keep both in sync when the shared prop API changes.
 */
export type PropDoc = { name: string; type: string; default: string; description: string; group: string };

export const SHARED_PROPS: PropDoc[] = [
  { group: "Chrome & sections", name: "showHeader", type: "boolean", default: "true", description: "Built-in eyebrow, title and subtitle. Turn off when the host page has its own heading and intro." },
  { group: "Chrome & sections", name: "showDemoBanner", type: "boolean", default: "false", description: "Demo-only notices: the sample-rates banner, placeholder CTA note and demo footer line. The demo site passes true." },
  { group: "Chrome & sections", name: "showBreakdown", type: "boolean", default: "true", description: "Heavy breakdown sections: amortization / schedule / comparison tables and detailed breakdown rows." },
  { group: "Chrome & sections", name: "showCta", type: "boolean", default: "true", description: "Built-in CTA button. Turn off when the host page has its own CTA." },
  { group: "Chrome & sections", name: "showDisclaimer", type: "boolean", default: "true", description: "Compliance / legal footnote and CTA disclosure." },
  { group: "Copy & CTA", name: "title", type: "string", default: "CMS header.title", description: "Title override." },
  { group: "Copy & CTA", name: "subtitle", type: "string", default: "CMS header.intro", description: "Subtitle override." },
  { group: "Copy & CTA", name: "headingLevel", type: '"h2" | "h3" | "div" (+ "h1")', default: '"h2"', description: "Element for the title; section headings render one level below. \"h1\" is for standalone pages where the calculator title is the page heading (the demo uses it)." },
  { group: "Copy & CTA", name: "ctaLabel", type: "string", default: "CMS cta.label", description: "CTA label override." },
  { group: "Copy & CTA", name: "ctaHref", type: "string", default: "CMS cta.href", description: "CTA link override. A host link navigates normally and drops the placeholder note." },
  { group: "Copy & CTA", name: "onCtaClick", type: "() => void", default: "—", description: "Called when the CTA is clicked." },
  { group: "Defaults", name: "defaults", type: "Partial<Inputs>", default: "config defaults", description: "Prefill inputs for the initial state. Wins over config defaults and live-rate defaults." },
  { group: "Layout & analytics", name: "variant", type: '"full" | "compact"', default: '"full"', description: "compact = tighter single-column card for narrow editorial columns." },
  { group: "Layout & analytics", name: "onInteract", type: "(event: CalculatorInteractionEvent) => void", default: "—", description: "User input, control changes and CTA clicks: { type: \"input\" | \"control\" | \"cta_click\", calculator, field?, value?, label?, href? }." },
  { group: "Layout & analytics", name: "onCalculate", type: "(result: Result) => void", default: "—", description: "Latest result whenever the calculation changes (not on unrelated renders, not for invalid inputs)." },
];

/** Calculator-specific props beyond the shared set. */
export const EXTRA_PROPS: Record<string, PropDoc[]> = {
  "*": [
    { group: "Calculator", name: "projectName", type: '"achieve" | "fdr" | "bills"', default: '"achieve"', description: "Brand theme." },
  ],
  rates: [
    { group: "Calculator", name: "rates", type: "MarketRates", default: "—", description: "Server-fetched live rates (FRED); missing keys fall back to config." },
  ],
  DebtSnowballAvalancheCalculator: [
    { group: "Calculator", name: "initialFocus", type: '"compare" | "snowball" | "avalanche"', default: '"compare"', description: "Preselected method (alias routes)." },
    { group: "Calculator", name: "titleOverride / introOverride", type: "string", default: "—", description: "Legacy alias-route copy; prefer title / subtitle." },
  ],
};

/** Calculators that take no `rates` prop. */
export const NO_RATES = new Set([
  "BudgetCalculator",
  "CarInsuranceCalculator",
  "DtiCalculator",
  "HomeInsuranceCalculator",
  "LifeInsuranceCalculator",
  "DebtSnowballAvalancheCalculator",
]);

/** Calculators whose `defaults` accept keys that are not plain config defaults. */
export const EXTRA_DEFAULT_KEYS: Record<string, string[]> = {
  DebtSnowballAvalancheCalculator: ["debts"],
};

/** Config defaults that are not prefillable inputs (UI-only presets). */
export const HIDDEN_DEFAULT_KEYS = new Set(["termPreset"]);

/** Calculators where showBreakdown has nothing to hide (no table / breakdown section). */
export const NO_BREAKDOWN = new Set(["CarInsuranceCalculator", "HomeInsuranceCalculator", "DtiCalculator", "RetirementCalculator"]);

export function usageSnippet(component: string, brand: string, defaults: Array<[string, unknown]>): string {
  const d = defaults
    .slice(0, 2)
    .map(([k, v]) => `${k}: ${typeof v === "string" ? JSON.stringify(v) : String(v)}`)
    .join(", ");
  return [
    `import { ${component}, type CalculatorInteractionEvent } from "@loan-calculators/core";`,
    `import "@loan-calculators/core/styles.css";`,
    ``,
    `// track = your GA4 / Tealium / BigQuery helper`,
    `export default function Page() {`,
    `  return (`,
    `    <${component}`,
    `      projectName="${brand}"`,
    `      headingLevel="h3"`,
    `      variant="compact"`,
    `      showBreakdown={false}`,
    d ? `      defaults={{ ${d} }}` : null,
    `      ctaLabel="See your options"`,
    `      ctaHref="/get-started"`,
    `      onInteract={(e: CalculatorInteractionEvent) => track("calculator_interact", e)}`,
    `      onCalculate={(result) => track("calculator_result", result)}`,
    `    />`,
    `  );`,
    `}`,
  ]
    .filter((l) => l !== null)
    .join("\n");
}
