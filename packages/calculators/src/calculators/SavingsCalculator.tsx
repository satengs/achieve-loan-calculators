"use client";

import { useMemo, useState } from "react";
import { futureValue, realValue } from "../calc";
import { resolveProjectName, type ProjectName } from "../brand/types";
import { CalculatorShell } from "../components/CalculatorShell";
import { DataTable } from "../components/DataTable";
import { MoreOptions } from "../components/MoreOptions";
import { RateNote } from "../components/RateNote";
import { ResultsPanel } from "../components/ResultsPanel";
import { SelectField } from "../components/SelectField";
import { resolveRate, type MarketRates } from "../rates/types";
import { CalculatorCta, optionsFrom, pct, useCalculatorSetup } from "./common";
import { NumberFields, useNumberInputs } from "./useNumberInputs";
import { PLACEHOLDER } from "./utils";

export type SavingsCalculatorProps = {
  projectName?: ProjectName | string;
  /** Live rates: savings (national average), inflationYoY (CPI). */
  rates?: MarketRates;
};

const KEYS = ["initial", "monthly", "rate", "years", "contributionGrowth", "inflation"] as const;

export function SavingsCalculator({ projectName = "achieve", rates }: SavingsCalculatorProps) {
  const brand = resolveProjectName(projectName);
  const { content, config, whole, fields, results, labels } = useCalculatorSetup("savings");
  const rate = resolveRate(rates, "savings", Number(config.defaults.rate));
  const infl = resolveRate(rates, "inflationYoY", Number(config.defaults.inflation));
  const inputs = useNumberInputs(config, KEYS, { rate: rate.value, inflation: infl.value });
  const [compounding, setCompounding] = useState(String(config.defaults.compounding ?? "12"));
  const table = (content.table || {}) as Record<string, any>;

  const computed = useMemo(() => {
    if (!inputs.ok) return null;
    const v = inputs.values;
    const fv = futureValue({
      initial: v.initial,
      monthly: v.monthly,
      annualRatePct: v.rate,
      years: v.years,
      compoundsPerYear: Number(compounding),
      contributionGrowthPct: v.contributionGrowth,
    });
    if (!fv) return null;
    return { ...fv, real: realValue(fv.balance, v.inflation, v.years) };
  }, [inputs.ok, inputs.values, compounding]);

  return (
    <CalculatorShell projectName={brand} eyebrow={content.header.eyebrow} title={content.header.title} intro={content.header.intro} banner={content.demoBanner} footerNote={content.footer.note}>
      <div className="lc-layout">
        <section className="lc-card lc-form">
          <h2>{content.form.heading}</h2>
          <NumberFields idPrefix="sv" keys={["initial", "monthly", "rate"]} fields={fields} inputs={inputs} />
          <RateNote rate={rate} subject="rate (national average savings rate)" />
          <NumberFields idPrefix="sv" keys={["years"]} fields={fields} inputs={inputs} />
          <MoreOptions>
            <SelectField id="sv-compounding" label={fields.compounding?.label} value={compounding} onChange={setCompounding} options={optionsFrom(fields.compounding?.options, ["365", "12", "4", "1"])} />
            <NumberFields idPrefix="sv" keys={["contributionGrowth", "inflation"]} fields={fields} inputs={inputs} />
            <RateNote rate={infl} subject="inflation (CPI-U, year over year)" />
          </MoreOptions>
        </section>
        <ResultsPanel
          heading={String(results.heading)}
          primaryLabel={String(results.primaryLabel)}
          primaryValue={computed ? whole(computed.balance) : PLACEHOLDER}
          items={[
            { label: labels.contributions, value: computed ? whole(computed.contributions) : PLACEHOLDER },
            { label: labels.interest, value: computed ? whole(computed.interest) : PLACEHOLDER },
            { label: labels.real, value: computed ? whole(computed.real) : PLACEHOLDER },
            { label: labels.rate, value: inputs.ok ? pct(inputs.values.rate, 2) : PLACEHOLDER },
          ]}
          message={computed ? String(results.summaryMessage) : String(results.invalidMessage)}
          cta={<CalculatorCta id="savings" />}
        />
      </div>
      <div className="lc-card lc-amort-card">
        <h2>{table.heading}</h2>
        <DataTable
          caption={table.heading}
          columns={table.columns || []}
          rows={(computed?.rows || []).map((r) => [String(r.year), whole(r.contributions), whole(r.interest), whole(r.balance)])}
          emptyText={String(results.invalidMessage)}
        />
      </div>
    </CalculatorShell>
  );
}
