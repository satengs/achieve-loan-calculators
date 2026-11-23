"use client";

import { useMemo } from "react";
import { capitalizedInterest, payoffWithExtra, yearlySchedule } from "../calc";
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
export type StudentLoanCalculatorInputs = Record<(typeof KEYS)[number], number>;
/** Payload passed to `onCalculate`. */
export type StudentLoanCalculatorResult = NonNullable<ReturnType<typeof payoffWithExtra>> & { cap: number };

export type StudentLoanCalculatorProps = CalculatorBaseProps<StudentLoanCalculatorInputs, StudentLoanCalculatorResult> & {
  projectName?: ProjectName | string;
  /** Accepted for API symmetry; no keyless public series is wired for student loan rates. */
  rates?: MarketRates;
};

const KEYS = ["balance", "apr", "termYears", "deferMonths", "extraMonthly"] as const;

export function StudentLoanCalculator({ projectName = "achieve", rates: _rates, ...options }: StudentLoanCalculatorProps) {
  const brand = resolveProjectName(projectName);
  const { content, config, money, whole, fields, results, labels } = useCalculatorSetup("student-loan", options.defaults);
  const rate = resolveRate(undefined, "personalLoan24", Number(config.defaults.apr));
  const inputs = useNumberInputs(config, KEYS);
  const table = (content.table || {}) as Record<string, any>;

  const computed = useMemo(() => {
    if (!inputs.ok) return null;
    const v = inputs.values;
    const cap = capitalizedInterest(v.balance, v.apr, v.deferMonths);
    const r = payoffWithExtra(v.balance + cap, v.apr, Math.round(v.termYears * 12), v.extraMonthly);
    return r ? { ...r, cap } : null;
  }, [inputs.ok, inputs.values]);
  useOnCalculate<StudentLoanCalculatorResult>(options.onCalculate, computed);

  return (
    <CalculatorShell projectName={brand} calculator="student-loan" content={content} options={options}>
      <div className="lc-layout">
        <section className="lc-card lc-form">
          <SectionHeading>{content.form.heading}</SectionHeading>
          <NumberFields idPrefix="sl" keys={["balance", "apr"]} fields={fields} inputs={inputs}  preferQuestion={brand === "achieve"} />
          <RateNote rate={rate} subject="interest rate" noLiveSource />
          <NumberFields idPrefix="sl" keys={["termYears"]} fields={fields} inputs={inputs}  preferQuestion={brand === "achieve"} />
          <MoreOptions>
            <NumberFields idPrefix="sl" keys={["deferMonths", "extraMonthly"]} fields={fields} inputs={inputs}  preferQuestion={brand === "achieve"} />
          </MoreOptions>
        </section>
        <ResultsPanel
          variant={resultsVariant(brand)}
          heading={String(results.heading)}
          primaryLabel={String(results.primaryLabel)}
          primaryValue={computed ? money(computed.base.payment) : PLACEHOLDER}
          items={[
            { label: labels.totalInterest, value: computed ? whole(computed.base.totalInterest + computed.cap) : PLACEHOLDER },
            { label: labels.totalPaid, value: computed ? whole(computed.base.totalPaid) : PLACEHOLDER },
            { label: labels.payoffWithExtra, value: computed ? months(computed.months) : PLACEHOLDER },
            { label: labels.interestSaved, value: computed ? whole(computed.interestSaved) : PLACEHOLDER },
          ]}
          summary={computed && computed.cap > 0 ? [{ label: labels.capitalized, value: whole(computed.cap) }] : []}
          message={computed ? String(results.summaryMessage) : String(results.invalidMessage)}
          cta={<CalculatorCta id="student-loan" />}
        />
      </div>
      <YearScheduleCard heading={table.heading} columns={table.columns} rows={computed ? yearlySchedule(computed.base.schedule) : []} money={whole} />
    </CalculatorShell>
  );
}
