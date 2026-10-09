"use client";

import { useMemo } from "react";
import { capitalizedInterest, payoffWithExtra, yearlySchedule } from "../calc";
import { resolveProjectName, type ProjectName } from "../brand/types";
import { CalculatorShell } from "../components/CalculatorShell";
import { MoreOptions } from "../components/MoreOptions";
import { RateNote } from "../components/RateNote";
import { ResultsPanel } from "../components/ResultsPanel";
import { resolveRate, type MarketRates } from "../rates/types";
import { CalculatorCta, months, useCalculatorSetup, YearScheduleCard } from "./common";
import { NumberFields, useNumberInputs } from "./useNumberInputs";
import { PLACEHOLDER } from "./utils";

export type StudentLoanCalculatorProps = {
  projectName?: ProjectName | string;
  /** Accepted for API symmetry; no keyless public series is wired for student loan rates. */
  rates?: MarketRates;
};

const KEYS = ["balance", "apr", "termYears", "deferMonths", "extraMonthly"] as const;

export function StudentLoanCalculator({ projectName = "achieve" }: StudentLoanCalculatorProps) {
  const brand = resolveProjectName(projectName);
  const { content, config, money, whole, fields, results, labels } = useCalculatorSetup("student-loan");
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

  return (
    <CalculatorShell projectName={brand} eyebrow={content.header.eyebrow} title={content.header.title} intro={content.header.intro} banner={content.demoBanner} footerNote={content.footer.note}>
      <div className="lc-layout">
        <section className="lc-card lc-form">
          <h2>{content.form.heading}</h2>
          <NumberFields idPrefix="sl" keys={["balance", "apr"]} fields={fields} inputs={inputs} />
          <RateNote rate={rate} subject="interest rate" noLiveSource />
          <NumberFields idPrefix="sl" keys={["termYears"]} fields={fields} inputs={inputs} />
          <MoreOptions>
            <NumberFields idPrefix="sl" keys={["deferMonths", "extraMonthly"]} fields={fields} inputs={inputs} />
          </MoreOptions>
        </section>
        <ResultsPanel
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
