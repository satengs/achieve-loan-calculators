"use client";

import type { ChangeEvent, MouseEvent, ReactNode } from "react";
import { BrandTheme } from "../brand/BrandTheme";
import { adaptBrandChromeNote } from "../brand/chromeCopy";
import type { ProjectName } from "../brand/types";
import type { CalculatorContent } from "../content/load";
import {
  CalculatorOptionsProvider,
  resolveCalculatorOptions,
  type CalculatorShellOptions,
} from "../shell/options";
import { DemoBanner } from "./DemoBanner";

type CalculatorShellProps = {
  projectName: ProjectName | string;
  /** Calculator id (content slug), reported in `onInteract` events. */
  calculator?: string;
  /** CMS content: supplies header, demo banner and footer copy unless the explicit props below are set. */
  content?: CalculatorContent;
  eyebrow?: string;
  title?: string;
  intro?: string;
  banner?: { icon?: string; strong: string; body: string };
  footerNote?: string;
  /** Demo-only footer line (shown only with `showDemoBanner`). */
  demoFooterNote?: string;
  /** Shared v1 configuration props (toggles, copy overrides, heading level, variant, analytics). */
  options?: CalculatorShellOptions;
  children: ReactNode;
};

function fieldName(el: HTMLElement): string | undefined {
  return (
    el.dataset.lcField ||
    el.getAttribute("name") ||
    el.id ||
    el.getAttribute("aria-label") ||
    el.textContent?.trim() ||
    undefined
  );
}

/**
 * Shared calculator chrome: brand theme, header, optional demo banner, footer note.
 * Provides the resolved v1 options to shared sub-components (CTA, section headings,
 * breakdown sections) via context, and reports user interactions through `onInteract`
 * with one delegated listener. Copy is rendered as text only.
 */
export function CalculatorShell({
  projectName,
  calculator,
  content,
  eyebrow,
  title,
  intro,
  banner,
  footerNote,
  demoFooterNote,
  options,
  children,
}: CalculatorShellProps) {
  const id = calculator ?? "";
  const opts = resolveCalculatorOptions(id, options);
  const TitleTag = opts.headingLevel;
  const headerEyebrow = eyebrow ?? content?.header.eyebrow ?? "";
  const headerTitle = opts.title ?? title ?? content?.header.title ?? "";
  const headerIntro = opts.subtitle ?? intro ?? content?.header.intro ?? "";
  const demo = banner ?? content?.demoBanner;
  const legal = footerNote ?? content?.footer.note ?? "";
  const demoLine = demoFooterNote ?? content?.footer.demoNote ?? "";
  const footer = [opts.showDemoBanner ? demoLine : "", opts.showDisclaimer ? legal : ""]
    .map((s) => adaptBrandChromeNote(s, projectName).trim())
    .filter(Boolean)
    .join(" ");

  const onInteract = opts.onInteract;
  const handleChange = onInteract
    ? (e: ChangeEvent<HTMLElement>) => {
        const el = e.target as HTMLInputElement;
        if (!el || !("value" in el)) return;
        const kind = el.type === "radio" || el.type === "checkbox" ? "control" : "input";
        const value = el.type === "checkbox" ? String(el.checked) : String(el.value);
        onInteract({ type: kind, calculator: id, field: fieldName(el), value });
      }
    : undefined;
  const handleClick = onInteract
    ? (e: MouseEvent<HTMLElement>) => {
        const btn = (e.target as HTMLElement).closest?.("button");
        if (!btn || btn.closest(".lc-cta")) return;
        onInteract({ type: "control", calculator: id, field: fieldName(btn), value: btn.value || undefined });
      }
    : undefined;

  const pageClass = opts.variant === "compact" ? "lc-page lc-page--compact" : "lc-page";

  return (
    <BrandTheme projectName={projectName}>
      <CalculatorOptionsProvider value={opts}>
        <div
          className={pageClass}
          data-variant={opts.variant}
          data-calculator={id || undefined}
          onChange={handleChange}
          onClick={handleClick}
        >
          {opts.showHeader ? (
            <header className="lc-header">
              {headerEyebrow ? <span className="lc-eyebrow">{headerEyebrow}</span> : null}
              <TitleTag className="lc-title">{headerTitle}</TitleTag>
              {headerIntro ? <p>{headerIntro}</p> : null}
            </header>
          ) : null}
          {opts.showDemoBanner && demo ? <DemoBanner icon={demo.icon} strong={demo.strong} body={demo.body} /> : null}
          {children}
          {footer ? <p className="lc-footer-note">{footer}</p> : null}
        </div>
      </CalculatorOptionsProvider>
    </BrandTheme>
  );
}
