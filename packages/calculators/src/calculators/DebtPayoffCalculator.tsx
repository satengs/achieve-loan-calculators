"use client";

import { useMemo } from "react";
import { balanceAfterWaiting, programEstimate, simulateFixedPayment, simulateMinimumPayments } from "../calc";
import { resolveProjectName, type ProjectName } from "../brand/types";
import { CalculatorShell } from "../components/CalculatorShell";
import { DataTable } from "../components/DataTable";
import { MoreOptions } from "../components/MoreOptions";
import { RateNote } from "../components/RateNote";
import { ResultsPanel } from "../components/ResultsPanel";
import { SliderField } from "../components/SliderField";
import { resolveRate, type MarketRates } from "../rates/types";
import { CalculatorCta, copyLabel, interpolate, months, payoffTime, resultsVariant, useCalculatorSetup } from "./common";
import { NumberFields, useNumberInputs } from "./useNumberInputs";
import { PLACEHOLDER } from "./utils";

export type DebtPayoffCalculatorProps = {
  projectName?: ProjectName | string;
  /** Live market rates injected by the host (creditCard). */
  rates?: MarketRates;
};

const KEYS = ["debtAmount", "apr", "planPayment", "minPrincipalPct", "minFloor", "programCostPct", "programMonths"] as const;

export function DebtPayoffCalculator({ projectName = "achieve", rates }: DebtPayoffCalculatorProps) {
  const brand = resolveProjectName(projectName);
  const { content, config, whole, fields, results, labels, features } = useCalculatorSetup("debt-payoff");
  const rate = resolveRate(rates, "creditCard", Number(config.defaults.apr));
  const inputs = useNumberInputs(config, KEYS, { apr: rate.value });
  const table = (content.table || {}) as Record<string, any>;
  const slider = features.slider || { min: 5000, max: 150000, step: 1000 };
  const waitMonths = Math.max(0, Math.round(Number(features.waitMonths ?? 3)));
  const tpl = (s: unknown) => interpolate(String(s ?? ""), { months: waitMonths });

  const computed = useMemo(() => {
    if (!inputs.ok) return null;
    const v = inputs.values;
    const rule = { principalPct: v.minPrincipalPct, floor: v.minFloor };
    const max = Number(features.maxMonths) || 1200;
    const min = simulateMinimumPayments(v.debtAmount, v.apr, rule, max);
    // M5: balance growth while waiting is derived from the APR (no payments, no new charges).
    const waitBalance = balanceAfterWaiting(v.debtAmount, v.apr, waitMonths);
    const waitSim = simulateMinimumPayments(waitBalance, v.apr, rule, max);
    const wait = waitSim ? { ...waitSim, months: waitSim.months + waitMonths, balance: waitBalance } : null;
    const plan = simulateFixedPayment(v.debtAmount, v.apr, v.planPayment, max);
    const program = programEstimate(v.debtAmount, { totalCostPct: v.programCostPct, months: v.programMonths });
    if (!min || !wait || !program) return null;
    return { min, wait, plan, program };
  }, [inputs.ok, inputs.values, features.maxMonths, waitMonths]);

  const planErr = inputs.ok && computed && !computed.plan ? String(results.planInvalid || "") : "";
  const errors: Record<string, string> = { ...inputs.errors, planPayment: inputs.errors.planPayment || planErr };
  const rows = (table.rows || {}) as Record<string, string>;
  const capped = (r: { capped: boolean }) => r.capped;
  const anyCapped = !!computed && (capped(computed.min) || capped(computed.wait) || (!!computed.plan && capped(computed.plan)));
  const time = (r: { months: number; capped: boolean }) => payoffTime(r, table.cappedTime);
  const tableRows: string[][] = computed
    ? [
        [rows.minimum, `${whole(computed.min.firstPayment)} (${table.firstPaymentNote})`, time(computed.min), whole(computed.min.totalInterest), whole(computed.min.totalPaid)],
        [tpl(rows.wait), `${whole(computed.wait.firstPayment)} (${table.firstPaymentNote})`, time(computed.wait), whole(computed.wait.totalInterest), whole(computed.wait.totalPaid)],
        computed.plan
          ? [rows.plan, whole(inputs.values.planPayment), time(computed.plan), whole(computed.plan.totalInterest), whole(computed.plan.totalPaid)]
          : [rows.plan, PLACEHOLDER, PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
        [rows.program, whole(computed.program.monthly), months(computed.program.months), `${table.programCostLabel}: ${whole(computed.program.total)}`, whole(computed.program.total)],
      ]
    : [];

  return (
    <CalculatorShell
      projectName={brand}
      eyebrow={content.header.eyebrow}
      title={content.header.title}
      intro={tpl(content.header.intro)}
      banner={content.demoBanner}
      footerNote={content.footer.note}
    >
      <div className="lc-layout">
        <section className="lc-card lc-form">
          <h2>{content.form.heading}</h2>
          <SliderField
            layout={brand === "achieve" ? "row" : "stack"}
            id="dp-debtAmount"
            label={copyLabel(fields.debtAmount, "Debt amount", brand)}
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
          <NumberFields idPrefix="dp" keys={["apr"]} fields={fields} inputs={inputs} errors={errors}  preferQuestion={brand === "achieve"} />
          <RateNote rate={rate} subject="card APR" />
          <NumberFields idPrefix="dp" keys={["planPayment"]} fields={fields} inputs={inputs} errors={errors}  preferQuestion={brand === "achieve"} />
          <MoreOptions>
            <NumberFields
              idPrefix="dp"
              keys={["minPrincipalPct", "minFloor", "programCostPct", "programMonths"]}
              fields={fields}
              inputs={inputs}
              errors={errors}
             preferQuestion={brand === "achieve"} />
          </MoreOptions>
        </section>
        <ResultsPanel
          variant={resultsVariant(brand)}
          heading={String(results.heading)}
          primaryLabel={String(results.primaryLabel)}
          primaryValue={computed ? whole(computed.min.totalPaid) : PLACEHOLDER}
          headline={
            computed?.plan ? (
              <>
                A payoff plan could finish in{" "}
                <span className="lc-headline-em">{time(computed.plan)}</span>
                {computed.min.totalInterest - computed.plan.totalInterest > 0 ? (
                  <>
                    {" "}and save{" "}
                    <span className="lc-headline-em">{whole(computed.min.totalInterest - computed.plan.totalInterest)}</span>
                    {" "}in interest
                  </>
                ) : null}
              </>
            ) : computed ? (
              <>
                Paying minimums, this debt would cost{" "}
                <span className="lc-headline-em">{whole(computed.min.totalPaid)}</span>
                {" "}over {time(computed.min)}
              </>
            ) : (
              "Enter your debt and a plan payment to see a payoff estimate"
            )
          }
          tip={computed?.plan ? "Compare the plan against paying only the minimum. Figures are illustrative, not a savings guarantee." : undefined}
          items={[
            { label: labels.minMonths, value: computed ? time(computed.min) : PLACEHOLDER },
            { label: labels.planMonths, value: computed?.plan ? time(computed.plan) : PLACEHOLDER },
            { label: labels.planSaved, value: computed?.plan ? whole(computed.min.totalInterest - computed.plan.totalInterest) : PLACEHOLDER },
            { label: labels.programTotal, value: computed ? whole(computed.program.total) : PLACEHOLDER },
          ]}
          summary={
            computed
              ? [
                  { label: labels.firstMin, value: whole(computed.min.firstPayment) },
                  { label: tpl(labels.waitTotal), value: whole(computed.wait.totalPaid) },
                ]
              : []
          }
          message={
            computed
              ? [String(results.summaryMessage), anyCapped ? interpolate(String(results.cappedMessage || ""), { years: Math.floor((Number(features.maxMonths) || 1200) / 12) }) : ""]
                  .filter(Boolean)
                  .join(" ")
              : String(results.invalidMessage)
          }
          cta={<CalculatorCta id="debt-payoff" />}
        />
      </div>
      <div className="lc-card lc-amort-card">
        <h2>{table.heading}</h2>
        <DataTable caption={table.heading} columns={table.columns || []} rows={tableRows} emptyText={String(results.invalidMessage)} />
        {computed && table.waitNote ? <p className="lc-note">{tpl(table.waitNote)}</p> : null}
      </div>
    </CalculatorShell>
  );
}
