"use client";

import { useMemo, useState } from "react";
import {
  formatDurationMonths,
  retirementDrawdown,
  withdrawalToLastUntil,
} from "../calc";
import { interpolate } from "../calc/format";
import { resolveProjectName, type ProjectName } from "../brand/types";
import { CalculatorShell } from "../components/CalculatorShell";
import { DepletionChart } from "../components/DepletionChart";
import { PresentationResults } from "../components/PresentationResults";
import { RateNote } from "../components/RateNote";
import { SliderField } from "../components/SliderField";
import { resolveRate, type MarketRates } from "../rates/types";
import { CalculatorCta, useCalculatorSetup } from "./common";
import { useNumberInputs } from "./useNumberInputs";
import { PLACEHOLDER } from "./utils";

export type RetirementCalculatorProps = {
  projectName?: ProjectName | string;
  /** Live rates: inflationYoY (CPI) drives the optional withdrawal raise. */
  rates?: MarketRates;
};

const KEYS = ["startAge", "savings", "monthlyWithdrawal", "annualReturn"] as const;

export function RetirementCalculator({ projectName = "achieve", rates }: RetirementCalculatorProps) {
  const brand = resolveProjectName(projectName);
  const { content, config, whole, fields, results, labels, features } = useCalculatorSetup("retirement");
  const infl = resolveRate(rates, "inflationYoY", Number(features.fallbackInflationPct ?? config.defaults.inflation ?? 3));
  const inputs = useNumberInputs(config, KEYS);
  const [raiseWithInflation, setRaiseWithInflation] = useState(Number(config.defaults.raiseWithInflation ?? 1) === 1);

  const formCopy = content.form as Record<string, any>;
  const sliders = (features.sliders || {}) as Record<string, { min: number; max: number; step: number }>;
  const tipWarnAge = Number(features.tipWarnAge ?? 90);
  const tipTargetAge = Number(features.tipTargetAge ?? 95);
  const maxAge = Number(features.maxAge ?? 120);
  const inflationPct = raiseWithInflation ? infl.value : 0;

  const computed = useMemo(() => {
    if (!inputs.ok) return null;
    const v = inputs.values;
    const drawdown = retirementDrawdown({
      startAge: v.startAge,
      savings: v.savings,
      monthlyWithdrawal: v.monthlyWithdrawal,
      annualReturnPct: v.annualReturn,
      withdrawalInflationPct: inflationPct,
      maxAge,
    });
    if (!drawdown) return null;
    const suggested =
      !drawdown.capped && drawdown.endAgeWhole < tipWarnAge
        ? withdrawalToLastUntil({
            startAge: v.startAge,
            savings: v.savings,
            annualReturnPct: v.annualReturn,
            withdrawalInflationPct: inflationPct,
            targetAge: tipTargetAge,
          })
        : null;
    return { drawdown, suggested };
  }, [inputs.ok, inputs.values, inflationPct, maxAge, tipWarnAge, tipTargetAge]);

  const duration = computed ? formatDurationMonths(computed.drawdown.monthsLasted) : PLACEHOLDER;
  const stickyValue = computed
    ? computed.drawdown.capped
      ? `Beyond ${maxAge}`
      : duration
    : PLACEHOLDER;

  const headline = (() => {
    if (!computed) return String(results.invalidMessage);
    const savings = whole(inputs.values.savings);
    if (computed.drawdown.capped) {
      return interpolate(String(results.headlineCappedTemplate), { savings, maxAge });
    }
    const endAge = String(computed.drawdown.endAgeWhole);
    const template = String(results.headlineTemplate);
    const parts = template.split("{{duration}}");
    if (parts.length === 2) {
      return (
        <>
          {interpolate(parts[0], { savings, endAge })}
          <span className="lc-headline-em">{duration}</span>
          {interpolate(parts[1], { savings, endAge })}
        </>
      );
    }
    return interpolate(template, { savings, duration, endAge });
  })();

  const tip = (() => {
    if (!computed) return null;
    const d = computed.drawdown;
    if (!d.capped && d.endAgeWhole < tipWarnAge && computed.suggested != null) {
      return interpolate(String(results.tipRunsOutTemplate), {
        warnAge: tipWarnAge,
        suggested: whole(computed.suggested),
        targetAge: tipTargetAge,
      });
    }
    return interpolate(String(results.tipLastsTemplate), {
      endAge: d.capped ? maxAge : d.endAgeWhole,
    });
  })();

  const raiseLabel = interpolate(String(formCopy.inflationRaise?.labelTemplate || "Raise my withdrawal {{pct}}% a year"), {
    pct: Number.isFinite(infl.value) ? infl.value.toFixed(infl.value >= 10 ? 0 : 2).replace(/\.00$/, "") : "3",
  });

  return (
    <CalculatorShell
      projectName={brand}
      eyebrow={content.header.eyebrow}
      title={content.header.title}
      intro={content.header.intro}
      banner={content.demoBanner}
      footerNote={content.footer.note}
    >
      <div className="lc-layout">
        <section className="lc-card lc-form">
          <h2>{formCopy.heading}</h2>
          <SliderField
            layout="row"
            id="rt-startAge"
            label={fields.startAge?.label || "Age when you start withdrawals"}
            min={sliders.startAge?.min ?? 40}
            max={sliders.startAge?.max ?? 90}
            step={sliders.startAge?.step ?? 1}
            value={inputs.state.startAge}
            onChange={(v) => inputs.set("startAge", v)}
            error={inputs.errors.startAge}
          />
          <SliderField
            layout="row"
            id="rt-savings"
            label={fields.savings?.label || "Retirement savings"}
            prefix={fields.savings?.prefix || "$"}
            min={sliders.savings?.min ?? 0}
            max={sliders.savings?.max ?? 2000000}
            step={sliders.savings?.step ?? 5000}
            value={inputs.state.savings}
            onChange={(v) => inputs.set("savings", v)}
            error={inputs.errors.savings}
          />
          <SliderField
            layout="row"
            id="rt-monthlyWithdrawal"
            label={fields.monthlyWithdrawal?.label || "Monthly withdrawal"}
            prefix={fields.monthlyWithdrawal?.prefix || "$"}
            min={sliders.monthlyWithdrawal?.min ?? 0}
            max={sliders.monthlyWithdrawal?.max ?? 20000}
            step={sliders.monthlyWithdrawal?.step ?? 50}
            value={inputs.state.monthlyWithdrawal}
            onChange={(v) => inputs.set("monthlyWithdrawal", v)}
            error={inputs.errors.monthlyWithdrawal}
          />
          <SliderField
            layout="row"
            id="rt-annualReturn"
            label={fields.annualReturn?.label || "Return rate"}
            suffix={fields.annualReturn?.suffix || "%"}
            hint={fields.annualReturn?.hint}
            min={sliders.annualReturn?.min ?? 0}
            max={sliders.annualReturn?.max ?? 12}
            step={sliders.annualReturn?.step ?? 0.25}
            value={inputs.state.annualReturn}
            onChange={(v) => inputs.set("annualReturn", v)}
            error={inputs.errors.annualReturn}
          />
          <label className="lc-check-row">
            <input
              type="checkbox"
              checked={raiseWithInflation}
              onChange={(e) => setRaiseWithInflation(e.target.checked)}
            />
            <span>{raiseLabel}</span>
          </label>
          {raiseWithInflation ? <RateNote rate={infl} subject="inflation raise (CPI-U, year over year)" /> : null}
          <button type="button" className="lc-reset-link" onClick={() => {
            inputs.reset();
            setRaiseWithInflation(Number(config.defaults.raiseWithInflation ?? 1) === 1);
          }}>
            {String(formCopy.resetLabel || "Reset to typical numbers")}
          </button>
        </section>
        <PresentationResults
          stickyLabel={String(results.stickyLabel || "Could last")}
          stickyValue={stickyValue}
          headline={headline}
          stats={
            computed
              ? [
                  { label: String(labels.takeOut || "You take out"), value: whole(computed.drawdown.totalWithdrawn) },
                  {
                    label: String(labels.growth || "Growth along the way"),
                    value: whole(computed.drawdown.totalGrowth),
                    accent: "growth",
                  },
                ]
              : [
                  { label: String(labels.takeOut || "You take out"), value: PLACEHOLDER },
                  { label: String(labels.growth || "Growth along the way"), value: PLACEHOLDER, accent: "growth" },
                ]
          }
          chart={
            computed ? (
              <DepletionChart bars={computed.drawdown.bars} ariaLabel={String(results.chartAria || "")} />
            ) : null
          }
          tip={tip}
          message={computed ? String(results.summaryMessage) : undefined}
          cta={<CalculatorCta id="retirement" />}
        />
      </div>
    </CalculatorShell>
  );
}
