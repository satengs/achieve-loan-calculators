"use client";

import { useMemo } from "react";
import { payoffWithExtra, yearlySchedule } from "../calc";
import { resolveProjectName, type ProjectName } from "../brand/types";
import { CalculatorShell } from "../components/CalculatorShell";
import { SectionHeading, useOnCalculate, type CalculatorBaseProps } from "../shell/options";
import { MoreOptions } from "../components/MoreOptions";
import { RateNote } from "../components/RateNote";
import { ResultsPanel } from "../components/ResultsPanel";
import { resolveRate, type MarketRates } from "../rates/types";
import { CalculatorCta, months, useCalculatorSetup, YearScheduleCard, resultsVariant } from "./common";
import { NumberFields, useNumberInputs } from "./useNumberInputs";
import { PLACEHOLDER } from "./utils";

/** Prefillable inputs for `defaults`. */
export type LoanCalculatorInputs = Record<(typeof KEYS)[number], number>;
/** Payload passed to `onCalculate`. */
export type LoanCalculatorResult = NonNullable<ReturnType<typeof payoffWithExtra>>;

export type LoanCalculatorProps = CalculatorBaseProps<LoanCalculatorInputs, LoanCalculatorResult> & {
  projectName?: ProjectName | string;
  /** Live rates: personalLoan24. */
  rates?: MarketRates;
};

const KEYS = ["loanAmount", "apr", "termYears", "extraMonthly"] as const;

export function LoanCalculator({ projectName = "achieve", rates, ...options }: LoanCalculatorProps) {
  const brand = resolveProjectName(projectName);
  const { content, config, money, whole, fields, results, labels } = useCalculatorSetup("loan", options.defaults);
  const rate = resolveRate(rates, "personalLoan24", Number(config.defaults.apr));
  const inputs = useNumberInputs(config, KEYS, { apr: rate.value });
  const table = (content.table || {}) as Record<string, any>;

  const computed = useMemo(() => {
    if (!inputs.ok) return null;
    const v = inputs.values;
    return payoffWithExtra(v.loanAmount, v.apr, Math.round(v.termYears * 12), v.extraMonthly);
  }, [inputs.ok, inputs.values]);
  useOnCalculate<LoanCalculatorResult>(options.onCalculate, computed);

  return (
    <CalculatorShell projectName={brand} calculator="loan" content={content} options={options}>
      <div className="lc-layout">
        <section className="lc-card lc-form">
          <SectionHeading>{content.form.heading}</SectionHeading>
          <NumberFields idPrefix="ln" keys={["loanAmount", "apr"]} fields={fields} inputs={inputs}  preferQuestion={brand === "achieve"} />
          <RateNote rate={rate} subject="rate (24-month personal loan average at commercial banks)" />
          <NumberFields idPrefix="ln" keys={["termYears"]} fields={fields} inputs={inputs}  preferQuestion={brand === "achieve"} />
          <MoreOptions>
            <NumberFields idPrefix="ln" keys={["extraMonthly"]} fields={fields} inputs={inputs}  preferQuestion={brand === "achieve"} />
          </MoreOptions>
        </section>
        <ResultsPanel
          variant={resultsVariant(brand)}
          heading={String(results.heading)}
          primaryLabel={String(results.primaryLabel)}
          primaryValue={computed ? money(computed.base.payment) : PLACEHOLDER}
          items={[
            { label: labels.totalInterest, value: computed ? whole(computed.base.totalInterest) : PLACEHOLDER },
            { label: labels.totalPaid, value: computed ? whole(computed.base.totalPaid) : PLACEHOLDER },
            { label: labels.payoffWithExtra, value: computed ? months(computed.months) : PLACEHOLDER },
            { label: labels.interestSaved, value: computed ? whole(computed.interestSaved) : PLACEHOLDER },
          ]}
          message={computed ? String(results.summaryMessage) : String(results.invalidMessage)}
          cta={<CalculatorCta id="loan" />}
        />
      </div>
      <YearScheduleCard heading={table.heading} columns={table.columns} rows={computed ? yearlySchedule(computed.base.schedule) : []} money={whole} />
    </CalculatorShell>
  );
}
