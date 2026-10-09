"use client";

import { useMemo } from "react";
import { formatPercent, interpolate } from "../calc/format";
import type { YearRow } from "../calc/loans";
import { CTA } from "../components/CTA";
import { DataTable } from "../components/DataTable";
import { getCalculatorConfig, getCalculatorContent, type CalculatorId } from "../content/load";
import { moneyFn } from "./utils";

/** Shared content/config/formatter wiring for calculator components. */
export function useCalculatorSetup(id: CalculatorId) {
  const content = getCalculatorContent(id);
  const config = useMemo(() => getCalculatorConfig(id), [id]);
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

export const pct = (n: number, d = 1) => formatPercent(n, d);
export { interpolate };

export function CalculatorCta({ id }: { id: CalculatorId }) {
  const content = getCalculatorContent(id);
  const config = getCalculatorConfig(id);
  return (
    <CTA
      label={content.cta.label}
      href={content.cta.href}
      note={content.cta.note}
      enabled={config.cta?.enabled !== false}
      preventDefault={config.cta?.preventDefault !== false}
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
    <div className="lc-card lc-amort-card">
      <h2>{heading}</h2>
      <DataTable
        caption={heading}
        columns={columns}
        rows={rows.map((r) => [String(r.year), money(r.payment), money(r.principal), money(r.interest), money(r.balance)])}
      />
    </div>
  );
}

/** Options list for a SelectField from content option labels + config keys. */
export function optionsFrom(labels: Record<string, string> | undefined, values?: string[]) {
  const keys = values ?? Object.keys(labels || {});
  return keys.map((v) => ({ value: v, label: labels?.[v] ?? v }));
}
