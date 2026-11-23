"use client";

import { useMemo, useState } from "react";
import { amortize, carLoanAmount, yearlySchedule } from "../calc";
import { resolveProjectName, type ProjectName } from "../brand/types";
import { CalculatorShell } from "../components/CalculatorShell";
import { SectionHeading, useOnCalculate, type CalculatorBaseProps } from "../shell/options";
import { Fieldset, Segmented } from "../components/Field";
import { MoreOptions } from "../components/MoreOptions";
import { RateNote } from "../components/RateNote";
import { ResultsPanel } from "../components/ResultsPanel";
import { resolveRate, type MarketRates } from "../rates/types";
import { CalculatorCta, useCalculatorSetup, YearScheduleCard, resultsVariant } from "./common";
import { NumberFields, useNumberInputs } from "./useNumberInputs";
import { PLACEHOLDER } from "./utils";

/** Prefillable inputs for `defaults`. */
export type CarLoanCalculatorInputs = Record<(typeof KEYS)[number], number> & { termMonths: number };
/** Payload passed to `onCalculate`. */
export type CarLoanCalculatorResult = NonNullable<ReturnType<typeof carLoanAmount>> & { a: NonNullable<ReturnType<typeof amortize>>; totalCost: number };

export type CarLoanCalculatorProps = CalculatorBaseProps<CarLoanCalculatorInputs, CarLoanCalculatorResult> & {
  projectName?: ProjectName | string;
  /** Live rates: auto48 (48-month new car loan average). */
  rates?: MarketRates;
};

const KEYS = ["price", "down", "apr", "tradeIn", "tradeOwed", "salesTax", "fees"] as const;

export function CarLoanCalculator({ projectName = "achieve", rates, ...options }: CarLoanCalculatorProps) {
  const brand = resolveProjectName(projectName);
  const { content, config, money, whole, fields, results, labels } = useCalculatorSetup("car-loan", options.defaults);
  const rate = resolveRate(rates, "auto48", Number(config.defaults.apr));
  const inputs = useNumberInputs(config, KEYS, { apr: rate.value });
  const [term, setTerm] = useState(String(config.defaults.termMonths ?? "60"));
  const presets = (config.termPresets || [36, 48, 60, 72, 84]).map(String);
  const table = (content.table || {}) as Record<string, any>;

  const computed = useMemo(() => {
    if (!inputs.ok) return null;
    const v = inputs.values;
    const amt = carLoanAmount({ price: v.price, down: v.down, tradeIn: v.tradeIn, tradeOwed: v.tradeOwed, salesTaxPct: v.salesTax, fees: v.fees });
    if (!amt || amt.amount <= 0) return null;
    const a = amortize(amt.amount, v.apr, Number(term));
    if (!a) return null;
    return { ...amt, a, totalCost: a.totalPaid + v.down + Math.max(0, amt.tradeEquity) };
  }, [inputs.ok, inputs.values, term]);
  useOnCalculate<CarLoanCalculatorResult>(options.onCalculate, computed);

  return (
    <CalculatorShell projectName={brand} calculator="car-loan" content={content} options={options}>
      <div className="lc-layout">
        <section className="lc-card lc-form">
          <SectionHeading>{content.form.heading}</SectionHeading>
          <NumberFields idPrefix="cl" keys={["price", "down", "apr"]} fields={fields} inputs={inputs}  preferQuestion={brand === "achieve"} />
          <RateNote rate={rate} subject="APR (48-month new car loan average at commercial banks)" />
          <Fieldset legend={fields.termMonths?.legend || "Loan term"}>
            <Segmented
              name="cl-term"
              ariaLabel={fields.termMonths?.ariaLabel || "Loan term"}
              value={term}
              onChange={setTerm}
              options={presets.map((p) => ({ value: p, label: fields.termMonths?.presetLabels?.[p] || `${p} mo` }))}
            />
          </Fieldset>
          <MoreOptions>
            <NumberFields idPrefix="cl" keys={["tradeIn", "tradeOwed", "salesTax", "fees"]} fields={fields} inputs={inputs}  preferQuestion={brand === "achieve"} />
          </MoreOptions>
        </section>
        <ResultsPanel
          variant={resultsVariant(brand)}
          heading={String(results.heading)}
          primaryLabel={String(results.primaryLabel)}
          primaryValue={computed ? money(computed.a.payment) : PLACEHOLDER}
          items={[
            { label: labels.loanAmount, value: computed ? whole(computed.amount) : PLACEHOLDER },
            { label: labels.totalInterest, value: computed ? whole(computed.a.totalInterest) : PLACEHOLDER },
            { label: labels.totalCost, value: computed ? whole(computed.totalCost) : PLACEHOLDER },
            { label: labels.salesTax, value: computed ? whole(computed.tax) : PLACEHOLDER },
          ]}
          summary={computed ? [{ label: labels.tradeEquity, value: whole(computed.tradeEquity) }] : []}
          message={computed ? String(results.summaryMessage) : String(results.invalidMessage)}
          cta={<CalculatorCta id="car-loan" />}
        />
      </div>
      <YearScheduleCard heading={table.heading} columns={table.columns} rows={computed ? yearlySchedule(computed.a.schedule) : []} money={whole} />
    </CalculatorShell>
  );
}
