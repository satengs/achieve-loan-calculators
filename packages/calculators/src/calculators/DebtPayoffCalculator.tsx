"use client";

import { useMemo } from "react";
import { programEstimate, simulateFixedPayment, simulateMinimumPayments, waitBalance } from "../calc";
import { resolveProjectName, type ProjectName } from "../brand/types";
import { CalculatorShell } from "../components/CalculatorShell";
import { DataTable } from "../components/DataTable";
import { MoreOptions } from "../components/MoreOptions";
import { RateNote } from "../components/RateNote";
import { ResultsPanel } from "../components/ResultsPanel";
import { SliderField } from "../components/SliderField";
import { resolveRate, type MarketRates } from "../rates/types";
import { CalculatorCta, months, useCalculatorSetup } from "./common";
import { NumberFields, useNumberInputs } from "./useNumberInputs";
import { PLACEHOLDER } from "./utils";

export type DebtPayoffCalculatorProps = {
  projectName?: ProjectName | string;
  /** Live market rates injected by the host (creditCard). */
  rates?: MarketRates;
};

const KEYS = ["debtAmount", "apr", "planPayment", "minPrincipalPct", "minFloor", "programCostPct", "programMonths", "waitGrowthPct"] as const;

export function DebtPayoffCalculator({ projectName = "achieve", rates }: DebtPayoffCalculatorProps) {
  const brand = resolveProjectName(projectName);
  const { content, config, whole, fields, results, labels, features } = useCalculatorSetup("debt-payoff");
  const rate = resolveRate(rates, "creditCard", Number(config.defaults.apr));
  const inputs = useNumberInputs(config, KEYS, { apr: rate.value });
  const table = (content.table || {}) as Record<string, any>;
  const slider = features.slider || { min: 5000, max: 150000, step: 1000 };

  const computed = useMemo(() => {
    if (!inputs.ok) return null;
    const v = inputs.values;
    const rule = { principalPct: v.minPrincipalPct, floor: v.minFloor };
    const max = Number(features.maxMonths) || 1200;
    const min = simulateMinimumPayments(v.debtAmount, v.apr, rule, max);
    const wait = simulateMinimumPayments(waitBalance(v.debtAmount, v.waitGrowthPct), v.apr, rule, max);
    const plan = simulateFixedPayment(v.debtAmount, v.apr, v.planPayment, max);
    const program = programEstimate(v.debtAmount, { totalCostPct: v.programCostPct, months: v.programMonths });
    if (!min || !wait || !program) return null;
    return { min, wait, plan, program };
  }, [inputs.ok, inputs.values, features.maxMonths]);

  const planErr = inputs.ok && computed && !computed.plan ? String(results.planInvalid || "") : "";
  const errors: Record<string, string> = { ...inputs.errors, planPayment: inputs.errors.planPayment || planErr };
  const rows = (table.rows || {}) as Record<string, string>;
  const tableRows: string[][] = computed
    ? [
        [rows.minimum, `${whole(computed.min.firstPayment)} (${table.firstPaymentNote})`, months(computed.min.months), whole(computed.min.totalInterest), whole(computed.min.totalPaid)],
        [rows.wait, `${whole(computed.wait.firstPayment)} (${table.firstPaymentNote})`, months(computed.wait.months), whole(computed.wait.totalInterest), whole(computed.wait.totalPaid)],
        computed.plan
          ? [rows.plan, whole(inputs.values.planPayment), months(computed.plan.months), whole(computed.plan.totalInterest), whole(computed.plan.totalPaid)]
          : [rows.plan, PLACEHOLDER, PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
        [rows.program, whole(computed.program.monthly), months(computed.program.months), `${table.programCostLabel}: ${whole(computed.program.total)}`, whole(computed.program.total)],
      ]
    : [];

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
          <h2>{content.form.heading}</h2>
          <SliderField
            id="dp-debtAmount"
            label={fields.debtAmount?.label}
            hint={fields.debtAmount?.hint}
            prefix="$"
            min={slider.min}
            max={slider.max}
            step={slider.step}
            value={inputs.state.debtAmount}
            onChange={(v) => inputs.set("debtAmount", v)}
            display={Number.isFinite(inputs.values.debtAmount) ? whole(inputs.values.debtAmount) : PLACEHOLDER}
            error={errors.debtAmount}
          />
          <NumberFields idPrefix="dp" keys={["apr"]} fields={fields} inputs={inputs} errors={errors} />
          <RateNote rate={rate} subject="card APR" />
          <NumberFields idPrefix="dp" keys={["planPayment"]} fields={fields} inputs={inputs} errors={errors} />
          <MoreOptions>
            <NumberFields
              idPrefix="dp"
              keys={["minPrincipalPct", "minFloor", "waitGrowthPct", "programCostPct", "programMonths"]}
              fields={fields}
              inputs={inputs}
              errors={errors}
            />
          </MoreOptions>
        </section>
        <ResultsPanel
          heading={String(results.heading)}
          primaryLabel={String(results.primaryLabel)}
          primaryValue={computed ? whole(computed.min.totalPaid) : PLACEHOLDER}
          items={[
            { label: labels.minMonths, value: computed ? months(computed.min.months) : PLACEHOLDER },
            { label: labels.planMonths, value: computed?.plan ? months(computed.plan.months) : PLACEHOLDER },
            { label: labels.planSaved, value: computed?.plan ? whole(computed.min.totalInterest - computed.plan.totalInterest) : PLACEHOLDER },
            { label: labels.programTotal, value: computed ? whole(computed.program.total) : PLACEHOLDER },
          ]}
          summary={
            computed
              ? [
                  { label: labels.firstMin, value: whole(computed.min.firstPayment) },
                  { label: labels.waitTotal, value: whole(computed.wait.totalPaid) },
                ]
              : []
          }
          message={computed ? String(results.summaryMessage) : String(results.invalidMessage)}
          cta={<CalculatorCta id="debt-payoff" />}
        />
      </div>
      <div className="lc-card lc-amort-card">
        <h2>{table.heading}</h2>
        <DataTable caption={table.heading} columns={table.columns || []} rows={tableRows} emptyText={String(results.invalidMessage)} />
      </div>
    </CalculatorShell>
  );
}
