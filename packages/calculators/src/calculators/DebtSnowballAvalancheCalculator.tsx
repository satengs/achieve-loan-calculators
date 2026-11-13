"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  compareStrategies,
  downsampleSeries,
  payoffCalendarMonth,
  validateRange,
  type DebtInput,
  type StrategyCompare,
  type StrategyResult,
} from "../calc";
import { resolveProjectName, type ProjectName } from "../brand/types";
import { BalanceCompareChart } from "../components/BalanceCompareChart";
import { CalculatorShell } from "../components/CalculatorShell";
import { Field, Segmented } from "../components/Field";
import { ResultsPanel } from "../components/ResultsPanel";
import { CalculatorCta, interpolate, months, resultsVariant, useCalculatorSetup } from "./common";
import { NumberFields, useNumberInputs } from "./useNumberInputs";
import { PLACEHOLDER } from "./utils";

export type FocusMode = "compare" | "snowball" | "avalanche";

export type DebtSnowballAvalancheCalculatorProps = {
  projectName?: ProjectName | string;
  /** Preselect Compare, Snowball, or Avalanche (used by SEO alias routes). */
  initialFocus?: FocusMode;
  /** Optional heading override for alias routes. */
  titleOverride?: string;
  introOverride?: string;
};

type DebtRow = {
  key: string;
  name: string;
  balance: string;
  apr: string;
  minPayment: string;
};

type DefaultDebt = { name?: string; balance?: number; apr?: number; minPayment?: number };

const EXTRA_KEYS = ["extraMonthly"] as const;
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function rowsFromDefaults(list: DefaultDebt[] | undefined): DebtRow[] {
  const src =
    Array.isArray(list) && list.length
      ? list
      : [
          { name: "Car loan leftover", balance: 1500, apr: 6.99, minPayment: 80 },
          { name: "Store card", balance: 4500, apr: 24.99, minPayment: 120 },
          { name: "Card A", balance: 6000, apr: 18.99, minPayment: 150 },
        ];
  return src.map((d, i) => ({
    key: `d${i + 1}`,
    name: String(d.name ?? `Debt ${i + 1}`),
    balance: String(d.balance ?? ""),
    apr: String(d.apr ?? ""),
    minPayment: String(d.minPayment ?? ""),
  }));
}

function spanPhrase(n: number): string {
  const abs = Math.abs(Math.round(n));
  const y = Math.floor(abs / 12);
  const m = abs % 12;
  const parts: string[] = [];
  if (y === 1) parts.push("1 year");
  else if (y > 1) parts.push(`${y} years`);
  if (m === 1) parts.push("1 month");
  else if (m > 1) parts.push(`${m} months`);
  return parts.join(" and ") || "0 months";
}

function formatCalMonth(p: { year: number; month: number } | null): string {
  if (!p || p.month < 1 || p.month > 12) return "";
  return `${MONTH_NAMES[p.month - 1]} ${p.year}`;
}

function timeOf(r: StrategyResult, cappedTemplate: string): string {
  if (r.neverPaysOff) return cappedTemplate;
  return months(r.months);
}

export function DebtSnowballAvalancheCalculator({
  projectName = "achieve",
  initialFocus = "compare",
  titleOverride,
  introOverride,
}: DebtSnowballAvalancheCalculatorProps) {
  const brand = resolveProjectName(projectName);
  const { content, config, whole, fields, results, labels, features } = useCalculatorSetup(
    "debt-snowball-avalanche",
  );
  const form = content.form as Record<string, any>;
  const maxDebts = Math.max(1, Number(features.maxDebts) || 8);
  const maxMonths = Math.max(1, Number(features.maxMonths) || 1200);
  const extra = useNumberInputs(config, EXTRA_KEYS);
  const [rows, setRows] = useState<DebtRow[]>(() => rowsFromDefaults(features.defaultDebts as DefaultDebt[]));
  const [nextId, setNextId] = useState(() => rows.length + 1);
  const [focus, setFocus] = useState<FocusMode>(initialFocus);
  const [from, setFrom] = useState<{ year: number; month: number } | null>(null);
  const segName = useId();
  const preferQuestion = brand === "achieve";

  useEffect(() => {
    const n = new Date();
    setFrom({ year: n.getFullYear(), month: n.getMonth() + 1 });
  }, []);

  const validation = (config.validation || {}) as Record<string, { min?: number; max?: number; label?: string; allowZero?: boolean }>;

  const rowResults = rows.map((row) => {
    const balance = validateRange(row.balance, validation.balance);
    const apr = validateRange(row.apr, validation.apr);
    const minPayment = validateRange(row.minPayment, validation.minPayment);
    return { balance, apr, minPayment, ok: balance.ok && apr.ok && minPayment.ok };
  });
  const rowsOk = rowResults.every((r) => r.ok);
  const ok = rowsOk && extra.ok && rows.length > 0;

  const debts: DebtInput[] = ok
    ? rows.map((row, i) => ({
        id: row.key,
        name: row.name.trim() || interpolate(String(form.debtHeading || "Debt {{n}}"), { n: i + 1 }),
        balance: rowResults[i].balance.value,
        apr: rowResults[i].apr.value,
        minPayment: rowResults[i].minPayment.value,
      }))
    : [];

  const debtKey = debts.map((d) => `${d.id}:${d.name}:${d.balance}:${d.apr}:${d.minPayment}`).join("|");
  const computed: StrategyCompare | null = useMemo(() => {
    if (!ok) return null;
    return compareStrategies(debts, extra.values.extraMonthly, maxMonths);
    // debtKey captures the numeric inputs; debts is rebuilt each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok, extra.values.extraMonthly, maxMonths, debtKey]);

  const aliases = (content as Record<string, any>).aliases || {};
  const alias = initialFocus !== "compare" ? aliases[initialFocus] : null;
  const title = titleOverride || alias?.title || content.header.title;
  const intro = introOverride || alias?.intro || content.header.intro;

  /** Short one-line labels on debt rows (never the long Achieve questions). */
  const fieldLabel = (key: string, fallback: string) => {
    const f = (fields[key] || {}) as { label?: string };
    return (f.label && String(f.label)) || fallback;
  };

  const setRow = (key: string, patch: Partial<DebtRow>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };
  const removeRow = (key: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)));
  };
  const addRow = () => {
    if (rows.length >= maxDebts) return;
    const n = nextId;
    setNextId(n + 1);
    setRows((prev) => [
      ...prev,
      { key: `d${n}`, name: `Debt ${n}`, balance: "1000", apr: "19.99", minPayment: "35" },
    ]);
  };

  const cappedLabel = interpolate(String(results.cappedTime || "Would not pay off in {{years}} yrs"), {
    years: Math.floor(maxMonths / 12),
  });
  const dateOf = (r: StrategyResult) => {
    if (!from || r.neverPaysOff || r.months <= 0) return "";
    const cal = payoffCalendarMonth(r.months, from);
    const formatted = formatCalMonth(cal);
    return formatted ? interpolate(String(results.payoffAround || "around {{date}}"), { date: formatted }) : "";
  };
  const orderWhen = (month: number, r: StrategyResult) => {
    const base = months(month);
    if (!from) return base;
    const cal = payoffCalendarMonth(month, from);
    const formatted = formatCalMonth(cal);
    return formatted ? `${base} (${formatted})` : base;
  };

  const headline = (() => {
    if (!computed) return String(results.invalidMessage || "Fix the highlighted fields to see a comparison.");
    const { snowball, avalanche, interestDelta, monthsDelta } = computed;
    if (snowball.months === 0 && avalanche.months === 0) {
      return "There is no remaining balance to pay off.";
    }
    const sNever = snowball.neverPaysOff;
    const aNever = avalanche.neverPaysOff;
    if (focus === "snowball") {
      if (sNever) return String(results.headlineNever);
      const duration = months(snowball.months);
      const around = dateOf(snowball);
      return (
        <>
          {interpolate(String(results.headlineFocusSnowball), { duration })}
          {around ? ` Debt-free ${around}.` : ""}
        </>
      );
    }
    if (focus === "avalanche") {
      if (aNever) return String(results.headlineNever);
      const duration = months(avalanche.months);
      const around = dateOf(avalanche);
      return (
        <>
          {interpolate(String(results.headlineFocusAvalanche), { duration })}
          {around ? ` Debt-free ${around}.` : ""}
        </>
      );
    }
    if (sNever && aNever) return String(results.headlineNever);
    if (sNever !== aNever) {
      const winner = sNever ? avalanche : snowball;
      const method = sNever ? "Avalanche" : "Snowball";
      return interpolate(String(results.headlineOneSided), { method, duration: months(winner.months) });
    }
    if (interestDelta === 0 && monthsDelta === 0) {
      return interpolate(String(results.headlineSame), {
        duration: months(snowball.months),
        interest: whole(snowball.totalInterest),
      });
    }
    if (interestDelta > 0 && monthsDelta === 0) {
      return interpolate(String(results.headlineAvalancheInterestOnly), {
        duration: months(snowball.months),
        interest: whole(interestDelta),
      });
    }
    if (interestDelta > 0) {
      return interpolate(String(results.headlineAvalancheSaves), {
        interest: whole(interestDelta),
        months: spanPhrase(monthsDelta),
      });
    }
    if (monthsDelta < 0) {
      return interpolate(String(results.headlineSnowballFaster), { months: spanPhrase(-monthsDelta) });
    }
    return interpolate(String(results.headlineSame), {
      duration: months(snowball.months),
      interest: whole(snowball.totalInterest),
    });
  })();

  const interestDiffLabel = (c: StrategyCompare) => {
    if (c.snowball.neverPaysOff || c.avalanche.neverPaysOff) return PLACEHOLDER;
    if (c.interestDelta > 0.005) return `${whole(c.interestDelta)} (avalanche)`;
    if (c.interestDelta < -0.005) return `${whole(-c.interestDelta)} (snowball)`;
    return "Same";
  };
  const monthsDiffLabel = (c: StrategyCompare) => {
    if (c.snowball.neverPaysOff || c.avalanche.neverPaysOff) return PLACEHOLDER;
    if (c.monthsDelta > 0) return `${spanPhrase(c.monthsDelta)} (avalanche)`;
    if (c.monthsDelta < 0) return `${spanPhrase(-c.monthsDelta)} (snowball)`;
    return "Same";
  };

  const primary = (() => {
    if (!computed) return { label: String(results.primaryLabel), value: PLACEHOLDER };
    if (focus === "snowball") {
      return { label: String(labels.snowballMonths), value: timeOf(computed.snowball, cappedLabel) };
    }
    if (focus === "avalanche") {
      return { label: String(labels.avalancheMonths), value: timeOf(computed.avalanche, cappedLabel) };
    }
    if (computed.interestDelta > 0.005 && !computed.avalanche.neverPaysOff) {
      return { label: String(labels.interestSaved), value: whole(computed.interestDelta) };
    }
    const faster = computed.monthsDelta >= 0 ? computed.avalanche : computed.snowball;
    return { label: String(results.primaryLabel), value: timeOf(faster, cappedLabel) };
  })();

  const items = computed
    ? [
        { label: String(labels.snowballMonths), value: timeOf(computed.snowball, cappedLabel) },
        { label: String(labels.avalancheMonths), value: timeOf(computed.avalanche, cappedLabel) },
        { label: String(labels.snowballInterest), value: computed.snowball.neverPaysOff ? cappedLabel : whole(computed.snowball.totalInterest) },
        { label: String(labels.avalancheInterest), value: computed.avalanche.neverPaysOff ? cappedLabel : whole(computed.avalanche.totalInterest) },
        { label: String(labels.interestSaved), value: interestDiffLabel(computed) },
        { label: String(labels.monthsSaved), value: monthsDiffLabel(computed) },
        ...(dateOf(computed.snowball)
          ? [{ label: String(labels.snowballDate), value: dateOf(computed.snowball) }]
          : []),
        ...(dateOf(computed.avalanche)
          ? [{ label: String(labels.avalancheDate), value: dateOf(computed.avalanche) }]
          : []),
      ]
    : [];

  const stats = computed
    ? [
        { label: String(labels.snowballMonths), value: timeOf(computed.snowball, cappedLabel) },
        { label: String(labels.avalancheMonths), value: timeOf(computed.avalanche, cappedLabel) },
        { label: String(labels.snowballInterest), value: computed.snowball.neverPaysOff ? cappedLabel : whole(computed.snowball.totalInterest) },
        { label: String(labels.avalancheInterest), value: computed.avalanche.neverPaysOff ? cappedLabel : whole(computed.avalanche.totalInterest) },
        { label: String(labels.interestSaved), value: interestDiffLabel(computed) },
        { label: String(labels.monthsSaved), value: monthsDiffLabel(computed) },
      ]
    : [];

  const tip = (() => {
    if (!computed) return undefined;
    if (computed.snowball.neverPaysOff && computed.avalanche.neverPaysOff) return String(results.tipNever);
    if (computed.interestDelta === 0 && computed.monthsDelta === 0 && !computed.snowball.neverPaysOff) {
      return String(results.tipSame);
    }
    return String(results.tipAvalanche);
  })();

  const growing =
    computed &&
    (computed.snowball.growingAtStart.length > 0 || computed.avalanche.growingAtStart.length > 0);
  const messageParts = [
    computed ? String(results.summaryMessage) : String(results.invalidMessage),
    computed && growing ? String(results.growingWarning) : "",
    computed && (computed.snowball.capped || computed.avalanche.capped)
      ? interpolate(String(results.cappedWarning || ""), { years: Math.floor(maxMonths / 12) })
      : "",
  ].filter(Boolean);

  const chartSeries = (r: StrategyResult | undefined) =>
    r ? downsampleSeries(r.series, 48) : [];

  const showOrders = computed && (focus === "compare" || !computed[focus].neverPaysOff);
  const emphasize = focus === "compare" ? "both" : focus;

  const showChart =
    computed && (computed.snowball.series.length > 1 || computed.avalanche.series.length > 1);

  const focusCopy = (results.focus || {}) as Record<string, string>;

  return (
    <CalculatorShell
      projectName={brand}
      eyebrow={content.header.eyebrow}
      title={title}
      intro={intro}
      banner={content.demoBanner}
      footerNote={content.footer.note}
    >
      <div className="lc-layout">
        <section className="lc-card lc-form">
          <h2>{content.form.heading}</h2>
          <div className="lc-debt-list">
            {rows.map((row, i) => {
              const vr = rowResults[i];
              const heading = interpolate(String(form.debtHeading || "Debt {{n}}"), { n: i + 1 });
              const removeAria = interpolate(String(form.removeDebtAria || "Remove {{name}}"), {
                name: row.name.trim() || heading,
              });
              return (
                <article key={row.key} className="lc-debt-row" aria-label={heading}>
                    <div className="lc-debt-row-head">
                      <span className="lc-debt-row-legend">{heading}</span>
                      <button
                        type="button"
                        className="lc-debt-remove"
                        onClick={() => removeRow(row.key)}
                        disabled={rows.length <= 1}
                        aria-label={removeAria}
                      >
                        {String(form.removeDebt || "Remove")}
                      </button>
                    </div>
                    <div className="lc-debt-row-grid">
                      <Field
                        id={`dsa-${row.key}-name`}
                        label={fieldLabel("name", "Debt name")}
                        value={row.name}
                        onChange={(v) => setRow(row.key, { name: v })}
                        inputMode="text"
                      />
                      <Field
                        id={`dsa-${row.key}-balance`}
                        label={fieldLabel("balance", "Balance")}
                        prefix={String((fields.balance as any)?.prefix || "$")}
                        value={row.balance}
                        onChange={(v) => setRow(row.key, { balance: v })}
                        error={vr.balance.message || undefined}
                      />
                      <Field
                        id={`dsa-${row.key}-apr`}
                        label={fieldLabel("apr", "APR")}
                        suffix={String((fields.apr as any)?.suffix || "%")}
                        value={row.apr}
                        onChange={(v) => setRow(row.key, { apr: v })}
                        error={vr.apr.message || undefined}
                      />
                      <Field
                        id={`dsa-${row.key}-min`}
                        label={fieldLabel("minPayment", "Min. payment")}
                        prefix={String((fields.minPayment as any)?.prefix || "$")}
                        value={row.minPayment}
                        onChange={(v) => setRow(row.key, { minPayment: v })}
                        error={vr.minPayment.message || undefined}
                      />
                    </div>
                </article>
              );
            })}
          </div>
          <button
            type="button"
            className="lc-debt-add"
            onClick={addRow}
            disabled={rows.length >= maxDebts}
          >
            {String(form.addDebt || "Add a debt")}
          </button>
          {rows.length >= maxDebts ? (
            <p className="lc-debt-max-note">
              {interpolate(String(form.maxDebtsNote || "This demo compares up to {{max}} debts."), {
                max: maxDebts,
              })}
            </p>
          ) : null}
          <NumberFields
            idPrefix="dsa"
            keys={EXTRA_KEYS}
            fields={fields}
            inputs={extra}
            preferQuestion={preferQuestion}
          />
        </section>
        <ResultsPanel
          variant={resultsVariant(brand)}
          heading={String(results.heading)}
          primaryLabel={primary.label}
          primaryValue={primary.value}
          headline={headline}
          stats={stats}
          items={items}
          tip={tip}
          message={messageParts.join(" ")}
          summary={[]}
          chart={
            computed ? (
              <div>
                <Segmented
                  name={segName}
                  ariaLabel={String(focusCopy.aria || "Which method to highlight")}
                  options={[
                    { value: "compare", label: String(focusCopy.compare || "Compare both") },
                    { value: "snowball", label: String(focusCopy.snowball || "Snowball") },
                    { value: "avalanche", label: String(focusCopy.avalanche || "Avalanche") },
                  ]}
                  value={focus}
                  onChange={(v) => setFocus(v as FocusMode)}
                />
                {showChart ? (
                  <BalanceCompareChart
                    snowball={chartSeries(computed.snowball)}
                    avalanche={chartSeries(computed.avalanche)}
                    snowballLabel={String(results.chartSnowball || "Snowball")}
                    avalancheLabel={String(results.chartAvalanche || "Avalanche")}
                    ariaLabel={String(results.chartAria || "")}
                    emphasize={emphasize}
                    formatMoney={whole}
                  />
                ) : null}
                {showOrders ? (
                  <div
                    className={`lc-payoff-orders${focus === "compare" ? "" : " lc-payoff-orders--single"}`}
                  >
                    {(focus === "compare" || focus === "snowball") && !computed.snowball.neverPaysOff ? (
                      <div>
                        <h3>{String(labels.snowballOrder)}</h3>
                        <ol>
                          {computed.snowball.order.map((o) => (
                            <li key={`s-${o.id}`}>
                              {interpolate(String(results.orderItem || "{{name}} — {{when}}"), {
                                name: o.name,
                                when: orderWhen(o.month, computed.snowball),
                              })}
                            </li>
                          ))}
                        </ol>
                      </div>
                    ) : null}
                    {(focus === "compare" || focus === "avalanche") && !computed.avalanche.neverPaysOff ? (
                      <div>
                        <h3>{String(labels.avalancheOrder)}</h3>
                        <ol>
                          {computed.avalanche.order.map((o) => (
                            <li key={`a-${o.id}`}>
                              {interpolate(String(results.orderItem || "{{name}} — {{when}}"), {
                                name: o.name,
                                when: orderWhen(o.month, computed.avalanche),
                              })}
                            </li>
                          ))}
                        </ol>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : undefined
          }
          cta={<CalculatorCta id="debt-snowball-avalanche" />}
        />
      </div>
    </CalculatorShell>
  );
}
