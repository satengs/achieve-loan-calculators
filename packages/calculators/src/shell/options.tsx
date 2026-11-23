"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";

/** Heading element for the calculator title. Section headings render one level below it. */
export type CalculatorHeadingLevel = "h1" | "h2" | "h3" | "div";

export type CalculatorVariant = "full" | "compact";

/**
 * Event passed to `onInteract`. `type`:
 * - `input`: a text/number/range field or select changed (`field` = input name/id, `value` = new raw value)
 * - `control`: a radio, checkbox, segmented or button control was used (`field` = name/id, `value` when known)
 * - `cta_click`: the built-in CTA was clicked (`label`, `href`)
 */
export type CalculatorInteractionEvent = {
  type: "input" | "control" | "cta_click";
  /** Calculator id, e.g. "mortgage" (matches the content/config file slug). */
  calculator: string;
  field?: string;
  value?: string;
  label?: string;
  href?: string;
};

/**
 * Shared, CMS-friendly configuration props accepted by every calculator in @loan-calculators/core.
 * `TInputs` types `defaults`; `TResult` types the `onCalculate` payload.
 */
export type CalculatorBaseProps<TInputs = Record<string, number | string>, TResult = unknown> = {
  /** Show the built-in eyebrow, title and subtitle. Default `true`. */
  showHeader?: boolean;
  /** Show demo-only notices (sample-rate banner, placeholder CTA note, demo footer line). Default `false`. */
  showDemoBanner?: boolean;
  /** Show heavy breakdown sections (amortization / schedule / breakdown tables). Default `true`. */
  showBreakdown?: boolean;
  /** Show the built-in CTA button. Default `true`. */
  showCta?: boolean;
  /** Show the compliance / legal footnote. Default `true`. */
  showDisclaimer?: boolean;
  /** Override the built-in title (CMS `header.title`). */
  title?: string;
  /** Override the built-in subtitle (CMS `header.intro`). */
  subtitle?: string;
  /** Element for the title. Section headings render one level below. Default `"h2"`. */
  headingLevel?: CalculatorHeadingLevel;
  /** Override the CTA label (CMS `cta.label`). */
  ctaLabel?: string;
  /** Override the CTA link (CMS `cta.href`). A host href makes the CTA navigate normally. */
  ctaHref?: string;
  /** Called when the CTA is clicked (after `onInteract`). */
  onCtaClick?: () => void;
  /** Prefill inputs; overrides config defaults and live-rate defaults for the initial state. */
  defaults?: Partial<TInputs>;
  /** `"compact"` = tighter single-column card for narrow editorial columns. Default `"full"`. */
  variant?: CalculatorVariant;
  /** Analytics hook for user input, control changes and CTA clicks. */
  onInteract?: (event: CalculatorInteractionEvent) => void;
  /** Called with the latest result each time the calculation result changes (not on unrelated renders). */
  onCalculate?: (result: TResult) => void;
};

/** Props the shell and shared sub-components read from context (everything except typed defaults/onCalculate). */
export type CalculatorShellOptions = Omit<CalculatorBaseProps, "defaults" | "onCalculate">;

export const CALCULATOR_PROP_DEFAULTS = {
  showHeader: true,
  showDemoBanner: false,
  showBreakdown: true,
  showCta: true,
  showDisclaimer: true,
  headingLevel: "h2",
  variant: "full",
} as const satisfies Partial<CalculatorBaseProps>;

export type ResolvedCalculatorOptions = CalculatorShellOptions & {
    calculator: string;
    headingLevel: CalculatorHeadingLevel;
    variant: CalculatorVariant;
    showHeader: boolean;
    showDemoBanner: boolean;
    showBreakdown: boolean;
    showCta: boolean;
    showDisclaimer: boolean;
  };

export function resolveCalculatorOptions(
  calculator: string,
  options: CalculatorShellOptions = {},
): ResolvedCalculatorOptions {
  const out: Record<string, unknown> = { ...CALCULATOR_PROP_DEFAULTS, calculator };
  for (const [k, v] of Object.entries(options)) if (v !== undefined) out[k] = v;
  return out as ResolvedCalculatorOptions;
}

const CalculatorOptionsContext = createContext<ResolvedCalculatorOptions>(resolveCalculatorOptions(""));

export function CalculatorOptionsProvider({ value, children }: { value: ResolvedCalculatorOptions; children: ReactNode }) {
  return <CalculatorOptionsContext.Provider value={value}>{children}</CalculatorOptionsContext.Provider>;
}

export function useCalculatorOptions(): ResolvedCalculatorOptions {
  return useContext(CalculatorOptionsContext);
}

/** Section heading level: one below the title (div title → h3, so host h2 sections stay above). */
export function sectionHeadingTag(level: CalculatorHeadingLevel): "h2" | "h3" | "h4" {
  if (level === "h1") return "h2";
  if (level === "h2") return "h3";
  if (level === "h3") return "h4";
  return "h3";
}

/** Card / section heading that follows the configured `headingLevel`. */
export function SectionHeading({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  const { headingLevel } = useCalculatorOptions();
  const Tag = sectionHeadingTag(headingLevel);
  return (
    <Tag className={className ? `lc-section-heading ${className}` : "lc-section-heading"} id={id}>
      {children}
    </Tag>
  );
}

/** Sub-heading inside a section (two levels below the title). */
export function SubHeading({ children, className }: { children: ReactNode; className?: string }) {
  const { headingLevel } = useCalculatorOptions();
  const section = sectionHeadingTag(headingLevel);
  const Tag = section === "h2" ? "h3" : section === "h3" ? "h4" : "h5";
  return <Tag className={className ? `lc-sub-heading ${className}` : "lc-sub-heading"}>{children}</Tag>;
}

/** Wrap heavy breakdown / schedule sections; hidden when `showBreakdown={false}`. */
export function Breakdown({ children }: { children: ReactNode }) {
  const { showBreakdown } = useCalculatorOptions();
  return showBreakdown ? <>{children}</> : null;
}

/**
 * Fire `onCalculate(result)` when the memoized result changes. Skips null/invalid results and
 * repeated identical results; the latest callback is read from a ref so an inline arrow
 * function from the host does not re-fire it on every render.
 */
export function useOnCalculate<T>(onCalculate: ((result: T) => void) | undefined, result: T | null | undefined) {
  const cb = useRef(onCalculate);
  cb.current = onCalculate;
  const last = useRef<unknown>(undefined);
  const lastKey = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (result == null || !cb.current) return;
    if (last.current === result) return;
    let key: string | undefined;
    try {
      key = JSON.stringify(result);
    } catch {
      key = undefined;
    }
    last.current = result;
    if (key !== undefined && key === lastKey.current) return;
    lastKey.current = key;
    cb.current(result);
  }, [result]);
}
