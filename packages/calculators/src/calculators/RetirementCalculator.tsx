"use client";

import { useMemo } from "react";
import { retirementProjection } from "../calc";
import { resolveProjectName, type ProjectName } from "../brand/types";
import { CalculatorShell } from "../components/CalculatorShell";
import { DataTable } from "../components/DataTable";
import { MoreOptions } from "../components/MoreOptions";
import { RateNote } from "../components/RateNote";
import { ResultsPanel } from "../components/ResultsPanel";
import { resolveRate, type MarketRates } from "../rates/types";
import { CalculatorCta, useCalculatorSetup } from "./common";
import { NumberFields, useNumberInputs } from "./useNumberInputs";
import { PLACEHOLDER } from "./utils";

export type RetirementCalculatorProps = {
  projectName?: ProjectName | string;
  /** Live rates: inflationYoY (CPI). */
  rates?: MarketRates;
};

const KEYS = ["currentAge", "retireAge", "currentSavings", "monthlyContribution", "employerMonthly", "annualReturn", "inflation", "withdrawalRate", "contributionGrowth"] as const;

export function RetirementCalculator({ projectName = "achieve", rates }: RetirementCalculatorProps) {
  const brand = resolveProjectName(projectName);
  const { content, config, whole, fields, results, labels, features } = useCalculatorSetup("retirement");
  const infl = resolveRate(rates, "inflationYoY", Number(config.defaults.inflation));
  const inputs = useNumberInputs(config, KEYS, { inflation: infl.value });
  const table = (content.table || {}) as Record<string, any>;
  const every = Number(features.tableEveryYears ?? 5);

  const ageErr = inputs.ok && inputs.values.retireAge <= inputs.values.currentAge ? "Retirement age must be greater than current age." : "";
  const errors: Record<string, string> = { ...inputs.errors, retireAge: inputs.errors.retireAge || ageErr };

  const computed = useMemo(() => {
    if (!inputs.ok) return null;
    const v = inputs.values;
    return retirementProjection({
      currentAge: v.currentAge,
      retireAge: v.retireAge,
      currentSavings: v.currentSavings,
      monthlyContribution: v.monthlyContribution,
      employerMonthly: v.employerMonthly,
      annualReturnPct: v.annualReturn,
      inflationPct: v.inflation,
      withdrawalRatePct: v.withdrawalRate,
      contributionGrowthPct: v.contributionGrowth,
    });
  }, [inputs.ok, inputs.values]);

  const rows = computed
    ? computed.rows
        .filter((r, i) => r.year % every === 0 || i === computed.rows.length - 1)
        .map((r) => [String(inputs.values.currentAge + r.year), whole(r.contributions), whole(r.interest), whole(r.balance)])
    : [];

  return (
    <CalculatorShell projectName={brand} eyebrow={content.header.eyebrow} title={content.header.title} intro={content.header.intro} banner={content.demoBanner} footerNote={content.footer.note}>
      <div className="lc-layout">
        <section className="lc-card lc-form">
          <h2>{content.form.heading}</h2>
          <NumberFields idPrefix="rt" keys={["currentAge", "retireAge", "currentSavings", "monthlyContribution", "employerMonthly"]} fields={fields} inputs={inputs} errors={errors} />
          <MoreOptions>
            <NumberFields idPrefix="rt" keys={["annualReturn", "inflation"]} fields={fields} inputs={inputs} errors={errors} />
            <RateNote rate={infl} subject="inflation (CPI-U, year over year)" />
            <NumberFields idPrefix="rt" keys={["withdrawalRate", "contributionGrowth"]} fields={fields} inputs={inputs} errors={errors} />
          </MoreOptions>
        </section>
        <ResultsPanel
          heading={String(results.heading)}
          primaryLabel={String(results.primaryLabel)}
          primaryValue={computed ? whole(computed.balance) : PLACEHOLDER}
          items={[
            { label: labels.real, value: computed ? whole(computed.realBalance) : PLACEHOLDER },
            { label: labels.monthlyIncome, value: computed ? whole(computed.monthlyIncome) : PLACEHOLDER },
            { label: labels.contributions, value: computed ? whole(computed.contributions) : PLACEHOLDER },
            { label: labels.growth, value: computed ? whole(computed.growth) : PLACEHOLDER },
          ]}
          summary={
            computed
              ? [
                  { label: labels.monthlyIncomeToday, value: whole(computed.monthlyIncomeToday) },
                  { label: labels.years, value: String(computed.years) },
                ]
              : []
          }
          message={computed ? String(results.summaryMessage) : String(results.invalidMessage)}
          cta={<CalculatorCta id="retirement" />}
        />
      </div>
      <div className="lc-card lc-amort-card">
        <h2>{table.heading}</h2>
        <DataTable caption={table.heading} columns={table.columns || []} rows={rows} emptyText={String(results.invalidMessage)} />
      </div>
    </CalculatorShell>
  );
}
