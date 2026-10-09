"use client";

import { useMemo } from "react";
import { payoffWithExtra, yearlySchedule } from "../calc";
import { resolveProjectName, type ProjectName } from "../brand/types";
import { CalculatorShell } from "../components/CalculatorShell";
import { MoreOptions } from "../components/MoreOptions";
import { RateNote } from "../components/RateNote";
import { ResultsPanel } from "../components/ResultsPanel";
import { resolveRate, type MarketRates } from "../rates/types";
import { CalculatorCta, months, useCalculatorSetup, YearScheduleCard } from "./common";
import { NumberFields, useNumberInputs } from "./useNumberInputs";
import { PLACEHOLDER } from "./utils";

export type LoanCalculatorProps = {
  projectName?: ProjectName | string;
  /** Live rates: personalLoan24. */
  rates?: MarketRates;
};

const KEYS = ["loanAmount", "apr", "termYears", "extraMonthly"] as const;

export function LoanCalculator({ projectName = "achieve", rates }: LoanCalculatorProps) {
  const brand = resolveProjectName(projectName);
  const { content, config, money, whole, fields, results, labels } = useCalculatorSetup("loan");
  const rate = resolveRate(rates, "personalLoan24", Number(config.defaults.apr));
  const inputs = useNumberInputs(config, KEYS, { apr: rate.value });
  const table = (content.table || {}) as Record<string, any>;

  const computed = useMemo(() => {
    if (!inputs.ok) return null;
    const v = inputs.values;
    return payoffWithExtra(v.loanAmount, v.apr, Math.round(v.termYears * 12), v.extraMonthly);
  }, [inputs.ok, inputs.values]);

  return (
    <CalculatorShell projectName={brand} eyebrow={content.header.eyebrow} title={content.header.title} intro={content.header.intro} banner={content.demoBanner} footerNote={content.footer.note}>
      <div className="lc-layout">
        <section className="lc-card lc-form">
          <h2>{content.form.heading}</h2>
          <NumberFields idPrefix="ln" keys={["loanAmount", "apr"]} fields={fields} inputs={inputs} />
          <RateNote rate={rate} subject="rate (24-month personal loan average at commercial banks)" />
          <NumberFields idPrefix="ln" keys={["termYears"]} fields={fields} inputs={inputs} />
          <MoreOptions>
            <NumberFields idPrefix="ln" keys={["extraMonthly"]} fields={fields} inputs={inputs} />
          </MoreOptions>
        </section>
        <ResultsPanel
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
