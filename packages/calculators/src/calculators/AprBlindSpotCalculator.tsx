"use client";

import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { downsampleSeries, newSpendingCost, payoffCalendarMonth } from "../calc";
import { resolveProjectName, type ProjectName } from "../brand/types";
import { BalanceCompareChart } from "../components/BalanceCompareChart";
import { CalculatorShell } from "../components/CalculatorShell";
import { SectionHeading, useOnCalculate, type CalculatorBaseProps } from "../shell/options";
import { RateNote } from "../components/RateNote";
import { ResultsPanel } from "../components/ResultsPanel";
import { resolveRate, type MarketRates } from "../rates/types";
import { CalculatorCta, interpolate, months, resultsVariant, useCalculatorSetup } from "./common";
import { NumberFields, useNumberInputs } from "./useNumberInputs";
import { PLACEHOLDER } from "./utils";

/** Prefillable inputs for `defaults`. */
export type AprBlindSpotCalculatorInputs = Record<(typeof KEYS)[number], number>;
/** Payload passed to `onCalculate`. */
export type AprBlindSpotCalculatorResult = NonNullable<ReturnType<typeof newSpendingCost>>;

export type AprBlindSpotCalculatorProps = CalculatorBaseProps<AprBlindSpotCalculatorInputs, AprBlindSpotCalculatorResult> & {
  projectName?: ProjectName | string;
  /** Live market rates injected by the host (creditCard). */
  rates?: MarketRates;
};

const KEYS = ["balance", "newSpending", "apr", "payment"] as const;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "1 year and 9 months" style span for headlines. */
function spanPhrase(n: number): string {
  const abs = Math.abs(Math.round(n));
  const y = Math.floor(abs / 12);
  const m = abs % 12;
  const parts: string[] = [];
  if (y) parts.push(y === 1 ? "1 year" : `${y} years`);
  if (m) parts.push(m === 1 ? "1 month" : `${m} months`);
  return parts.join(" and ") || "0 months";
}

/** Interpolate a CMS template into React text, wrapping chosen keys in the headline emphasis span. */
function richTemplate(tpl: string, vars: Record<string, string>, em: string[]): ReactNode {
  const parts = tpl.split(/(\{\{\w+\}\})/g);
  return parts.map((p, i) => {
    const m = p.match(/^\{\{(\w+)\}\}$/);
    if (!m) return <Fragment key={i}>{p}</Fragment>;
    const v = vars[m[1]] ?? "";
    return em.includes(m[1]) ? (
      <span key={i} className="lc-headline-em">
        {v}
      </span>
    ) : (
      <Fragment key={i}>{v}</Fragment>
    );
  });
}

export function AprBlindSpotCalculator({ projectName = "achieve", rates, ...options }: AprBlindSpotCalculatorProps) {
  const brand = resolveProjectName(projectName);
  const { content, config, whole, fields, results, labels, features } = useCalculatorSetup("apr-blind-spot", options.defaults);
  const rate = resolveRate(rates, "creditCard", Number(config.defaults.apr));
  const inputs = useNumberInputs(config, KEYS, { apr: rate.value });
  const maxMonths = Math.max(1, Number(features.maxMonths) || 1200);
  const chartPoints = Math.max(2, Number(features.chartPoints) || 48);
  const preferQuestion = brand === "achieve";

  // Calendar month is client-only (avoids a server/client mismatch); rows reserve space with a placeholder.
  const [from, setFrom] = useState<{ year: number; month: number } | null>(null);
  useEffect(() => {
    const n = new Date();
    setFrom({ year: n.getFullYear(), month: n.getMonth() + 1 });
  }, []);

  const computed = useMemo(() => {
    if (!inputs.ok) return null;
    const v = inputs.values;
    return newSpendingCost(
      { balance: v.balance, newSpending: v.newSpending, aprPct: v.apr, payment: v.payment },
      maxMonths,
    );
  }, [inputs.ok, inputs.values, maxMonths]);
  useOnCalculate<AprBlindSpotCalculatorResult>(options.onCalculate, computed);

  const v = inputs.values;
  const never = !!computed && (computed.without.neverPaysOff || computed.withSpending.neverPaysOff);
  const capped =
    !!computed &&
    ((computed.without.neverPaysOff && computed.without.months >= maxMonths) ||
      (computed.withSpending.neverPaysOff && computed.withSpending.months >= maxMonths));
  const cappedLabel = interpolate(String(results.cappedTime || "Not paid off in {{years}} yrs"), {
    years: Math.floor(maxMonths / 12),
  });
  const timeOf = (s: { months: number; neverPaysOff: boolean }) => (s.neverPaysOff ? cappedLabel : months(s.months));
  const perMonth = (n: number) =>
    Number.isFinite(n) ? interpolate(String(results.perMonth || "{{amount}}/mo"), { amount: whole(Math.ceil(n)) }) : PLACEHOLDER;
  const dateOf = (s: { months: number; neverPaysOff: boolean }) => {
    if (!from || s.neverPaysOff) return PLACEHOLDER;
    const cal = payoffCalendarMonth(s.months, from);
    return cal ? `${MONTH_NAMES[cal.month - 1]} ${cal.year}` : PLACEHOLDER;
  };
  const perDollar = (n: number) =>
    Number.isFinite(n) ? `$${n.toFixed(2)}` : PLACEHOLDER;

  const ok = !!computed && !never;
  const primaryValue = ok ? whole(computed!.trueCost) : PLACEHOLDER;

  const headline: ReactNode = (() => {
    if (!computed) return String(results.invalidMessage);
    if (never) {
      return interpolate(String(results.neverHeadline), {
        payment: whole(v.payment),
        interest: whole(Math.ceil(computed.firstMonthInterest)),
      });
    }
    if (v.newSpending <= 0) {
      return richTemplate(
        String(results.zeroSpendHeadline),
        { duration: spanPhrase(computed.without.months), interest: whole(computed.without.totalInterest) },
        ["duration", "interest"],
      );
    }
    const vars = {
      payment: whole(v.payment),
      spending: whole(v.newSpending),
      months: spanPhrase(computed.extraMonths),
      interest: whole(computed.extraInterest),
      trueCost: whole(computed.trueCost),
    };
    const tpl = computed.extraMonths > 0 ? results.headline : results.headlineSameTime;
    return richTemplate(String(tpl), vars, ["trueCost", "months", "interest"]);
  })();

  const stats = [
    { label: String(labels.withoutTime), value: computed ? timeOf(computed.without) : PLACEHOLDER },
    { label: String(labels.withTime), value: computed ? timeOf(computed.withSpending) : PLACEHOLDER },
    { label: String(labels.extraInterest), value: ok ? whole(computed!.extraInterest) : PLACEHOLDER, accent: "negative" as const },
    { label: String(labels.trueCost), value: primaryValue },
  ];

  const items = [
    { label: String(labels.withoutTime), value: computed ? timeOf(computed.without) : PLACEHOLDER },
    { label: String(labels.withTime), value: computed ? timeOf(computed.withSpending) : PLACEHOLDER },
    { label: String(labels.extraTime), value: ok ? months(computed!.extraMonths) : PLACEHOLDER, tone: "negative" as const },
    { label: String(labels.extraInterest), value: ok ? whole(computed!.extraInterest) : PLACEHOLDER, tone: "negative" as const },
    { label: String(labels.perDollar), value: ok ? perDollar(computed!.costPerDollar) : PLACEHOLDER },
    { label: String(labels.keepDate), value: computed ? perMonth(computed.paymentToKeepDate) : PLACEHOLDER },
  ];

  const summary = [
    ...(brand === "achieve"
      ? [{ label: String(labels.perDollar), value: ok ? perDollar(computed!.costPerDollar) : PLACEHOLDER }]
      : []),
    { label: String(labels.withoutInterest), value: computed && !computed.without.neverPaysOff ? whole(computed.without.totalInterest) : PLACEHOLDER },
    { label: String(labels.withInterest), value: ok ? whole(computed!.withSpending.totalInterest) : PLACEHOLDER },
    { label: String(labels.keepDate), value: computed ? perMonth(computed.paymentToKeepDate) : PLACEHOLDER },
    { label: String(labels.withoutDate), value: computed ? dateOf(computed.without) : PLACEHOLDER },
    { label: String(labels.withDate), value: computed ? dateOf(computed.withSpending) : PLACEHOLDER },
  ];

  const tip = ok
    ? v.newSpending > 0 && Number.isFinite(computed!.paymentToKeepDate)
      ? interpolate(String(results.tip), { keep: whole(Math.ceil(computed!.paymentToKeepDate)) })
      : String(results.tipNoKeep)
    : undefined;

  const message = !computed
    ? String(results.invalidMessage)
    : [
        never ? String(results.neverMessage) : "",
        String(results.summaryMessage),
        capped ? interpolate(String(results.cappedMessage || ""), { years: Math.floor(maxMonths / 12) }) : "",
      ]
        .filter(Boolean)
        .join(" ");

  const chart = ok ? (
    <BalanceCompareChart
      snowball={downsampleSeries(computed!.without.series, chartPoints)}
      avalanche={downsampleSeries(computed!.withSpending.series, chartPoints)}
      snowballLabel={String(results.chartWithout)}
      avalancheLabel={String(results.chartWith)}
      ariaLabel={String(results.chartAria)}
      formatMoney={whole}
    />
  ) : null;

  return (
    <CalculatorShell
      projectName={brand}
      eyebrow={content.header.eyebrow}
      title={content.header.title}
      intro={content.header.intro}
      calculator="apr-blind-spot"
      content={content}
      options={options}
    >
      <div className="lc-layout">
        <section className="lc-card lc-form">
          <SectionHeading>{content.form.heading}</SectionHeading>
          <NumberFields idPrefix="abs" keys={["balance", "newSpending", "apr"]} fields={fields} inputs={inputs} preferQuestion={preferQuestion} />
          <RateNote rate={rate} subject="card APR" />
          <NumberFields idPrefix="abs" keys={["payment"]} fields={fields} inputs={inputs} preferQuestion={preferQuestion} />
        </section>
        <ResultsPanel
          variant={resultsVariant(brand)}
          heading={String(results.heading)}
          primaryLabel={String(results.primaryLabel)}
          primaryValue={primaryValue}
          headline={headline}
          stats={stats}
          items={items}
          summary={
            options.showBreakdown === false
              ? []
              : brand === "achieve"
                ? summary
                : summary.filter((r) => r.label !== String(labels.keepDate))
          }
          tip={tip}
          chart={chart}
          message={message}
          cta={<CalculatorCta id="apr-blind-spot" />}
        />
      </div>
    </CalculatorShell>
  );
}
