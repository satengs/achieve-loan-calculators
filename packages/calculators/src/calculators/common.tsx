"use client";

import { useMemo } from "react";
import { formatPercent, interpolate } from "../calc/format";
import type { YearRow } from "../calc/loans";
import { CTA } from "../components/CTA";
import { DataTable } from "../components/DataTable";
import type { ProjectName } from "../brand/types";
import {
  getCalculatorConfig,
  getCalculatorContent,
  type CalculatorConfig,
  type CalculatorId,
} from "../content/load";
import { Breakdown, SectionHeading, useCalculatorOptions } from "../shell/options";
import { moneyFn } from "./utils";

/** Config with host `defaults` merged in; `hostDefaults` also wins over live-rate initial values. */
export type ConfigWithHostDefaults = CalculatorConfig & { hostDefaults?: Record<string, unknown> };

/** Merge host-page `defaults` over CMS config defaults (undefined values ignored). */
export function withHostDefaults(config: CalculatorConfig, defaults?: object): ConfigWithHostDefaults {
  if (!defaults) return config;
  const host = Object.fromEntries(Object.entries(defaults).filter(([, v]) => v !== undefined));
  if (!Object.keys(host).length) return config;
  const primitive = Object.fromEntries(
    Object.entries(host).filter(([, v]) => ["string", "number", "boolean"].includes(typeof v)),
  ) as CalculatorConfig["defaults"];
  return { ...config, defaults: { ...config.defaults, ...primitive }, hostDefaults: host };
}

/** Shared content/config/formatter wiring for calculator components. */
export function useCalculatorSetup(id: CalculatorId, defaults?: object) {
  const content = getCalculatorContent(id);
  // Host `defaults` only seed initial state, so a new object identity each render is harmless;
  // key on its JSON so the memoized config stays stable.
  const defaultsKey = defaults ? JSON.stringify(defaults) : "";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const config = useMemo(() => withHostDefaults(getCalculatorConfig(id), defaults), [id, defaultsKey]);
  const money = useMemo(() => moneyFn(config), [config]);
  const whole = (n: number) => money(n, { maximumFractionDigits: 0, minimumFractionDigits: 0 });
  const fields = content.form.fields as Record<string, any>;
  const results = content.results as Record<string, any>;
  const labels = (results.labels || {}) as Record<string, string>;
  const features = (config.features || {}) as Record<string, any>;
  return { content, config, money, whole, fields, results, labels, features };
}

export function months(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const y = Math.floor(n / 12);
  const m = n % 12;
  if (y === 0) return `${m} mo`;
  return m === 0 ? `${y} yr` : `${y} yr ${m} mo`;
}

/**
 * Payoff time for a simulation that may hit its month cap (e.g. 1,200 = 100 yrs).
 * A capped result is not a payoff time, so show the CMS template (e.g. "Not paid off in
 * {{years}} yrs") instead of a misleading "100 yr".
 */
export function payoffTime(r: { months: number; capped: boolean }, cappedTemplate?: string): string {
  if (!r.capped) return months(r.months);
  const years = Math.floor(r.months / 12);
  return interpolate(String(cappedTemplate || "Not paid off in {{years}} yrs"), { years });
}

export const pct = (n: number, d = 1) => formatPercent(n, d);
export { interpolate };

/**
 * Built-in CTA. Honors showCta / ctaLabel / ctaHref / onCtaClick / onInteract from the shell.
 * A host `ctaHref` navigates normally and drops the CMS placeholder note.
 */
export function CalculatorCta({
  id,
  label,
  href,
  note,
}: {
  id: CalculatorId;
  /** Per-calculator defaults (still overridden by the host ctaLabel / ctaHref props). */
  label?: string;
  href?: string;
  note?: string;
}) {
  const content = getCalculatorContent(id);
  const config = getCalculatorConfig(id);
  const opts = useCalculatorOptions();
  if (!opts.showCta || config.cta?.enabled === false) return null;
  const finalLabel = opts.ctaLabel ?? label ?? content.cta.label;
  const finalHref = opts.ctaHref ?? href ?? content.cta.href;
  const hostHref = opts.ctaHref !== undefined;
  const notes = [
    opts.showDemoBanner && !hostHref ? content.cta.demoNote : "",
    opts.showDisclaimer ? (note ?? content.cta.note) : "",
  ].filter(Boolean);
  return (
    <CTA
      label={finalLabel}
      href={finalHref}
      note={notes.join(" ") || undefined}
      preventDefault={hostHref ? false : config.cta?.preventDefault !== false}
      onClick={() => {
        opts.onInteract?.({ type: "cta_click", calculator: opts.calculator || id, label: finalLabel, href: finalHref });
        opts.onCtaClick?.();
      }}
    />
  );
}

/** Yearly amortization table card (scrolls horizontally on mobile). */
export function YearScheduleCard({
  heading,
  columns,
  rows,
  money,
}: {
  heading: string;
  columns: string[];
  rows: YearRow[];
  money: (n: number) => string;
}) {
  return (
    <Breakdown>
      <div className="lc-card lc-amort-card">
        <SectionHeading>{heading}</SectionHeading>
        <DataTable
          caption={heading}
          columns={columns}
          rows={rows.map((r) => [String(r.year), money(r.payment), money(r.principal), money(r.interest), money(r.balance)])}
        />
      </div>
    </Breakdown>
  );
}

/** Field label: Achieve uses the optional CMS `question` sentence; other brands keep the short `label`. */
export function copyLabel(
  field: { label?: string; question?: string } | undefined,
  fallback: string,
  brand: ProjectName,
): string {
  if (brand === "achieve" && field?.question) return field.question;
  return field?.label || fallback;
}

/** Achieve results use the presentation card; FDR and bills keep the original panel. */
export function resultsVariant(brand: ProjectName): "default" | "presentation" {
  return brand === "achieve" ? "presentation" : "default";
}

/** Options list for a SelectField from content option labels + config keys. */
export function optionsFrom(labels: Record<string, string> | undefined, values?: string[]) {
  const keys = values ?? Object.keys(labels || {});
  return keys.map((v) => ({ value: v, label: labels?.[v] ?? v }));
}
