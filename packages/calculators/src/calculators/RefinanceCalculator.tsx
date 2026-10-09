"use client";

import { useMemo, useState } from "react";
import { refinanceCompare } from "../calc";
import { resolveProjectName, type ProjectName } from "../brand/types";
import { CalculatorShell } from "../components/CalculatorShell";
import { Fieldset, Segmented } from "../components/Field";
import { MoreOptions } from "../components/MoreOptions";
import { RateNote } from "../components/RateNote";
import { ResultsPanel } from "../components/ResultsPanel";
import { resolveRate, type MarketRates } from "../rates/types";
import { CalculatorCta, months, useCalculatorSetup } from "./common";
import { NumberFields, useNumberInputs } from "./useNumberInputs";
import { PLACEHOLDER } from "./utils";

export type RefinanceCalculatorProps = {
  projectName?: ProjectName | string;
  /** Live rates: mortgage30 used as the default new rate. */
  rates?: MarketRates;
};

const KEYS = ["balance", "currentRate", "remainingYears", "newRate", "newTermYears", "closingCosts"] as const;

export function RefinanceCalculator({ projectName = "achieve", rates }: RefinanceCalculatorProps) {
  const brand = resolveProjectName(projectName);
  const { content, config, money, whole, fields, results, labels } = useCalculatorSetup("refinance");
  const rate = resolveRate(rates, "mortgage30", Number(config.defaults.newRate));
  const inputs = useNumberInputs(config, KEYS, { newRate: rate.value });
  const [roll, setRoll] = useState(String(config.defaults.rollCosts ?? "cash"));

  const computed = useMemo(() => {
    if (!inputs.ok) return null;
    const v = inputs.values;
    return refinanceCompare({
      balance: v.balance,
      currentRatePct: v.currentRate,
      remainingMonths: Math.round(v.remainingYears * 12),
      newRatePct: v.newRate,
      newTermMonths: Math.round(v.newTermYears * 12),
      closingCosts: v.closingCosts,
      rollCosts: roll === "roll",
    });
  }, [inputs.ok, inputs.values, roll]);

  return (
    <CalculatorShell projectName={brand} eyebrow={content.header.eyebrow} title={content.header.title} intro={content.header.intro} banner={content.demoBanner} footerNote={content.footer.note}>
      <div className="lc-layout">
        <section className="lc-card lc-form">
          <h2>{content.form.heading}</h2>
          <NumberFields idPrefix="rf" keys={["balance", "currentRate", "remainingYears", "newRate"]} fields={fields} inputs={inputs} />
          <RateNote rate={rate} subject="new rate (30-year fixed average)" />
          <MoreOptions>
            <NumberFields idPrefix="rf" keys={["newTermYears", "closingCosts"]} fields={fields} inputs={inputs} />
            <Fieldset legend={fields.rollCosts?.legend || "Closing costs"}>
              <Segmented
                name="rf-roll"
                ariaLabel={fields.rollCosts?.ariaLabel || "Closing costs"}
                value={roll}
                onChange={setRoll}
                options={[
                  { value: "cash", label: fields.rollCosts?.options?.cash || "Pay in cash" },
                  { value: "roll", label: fields.rollCosts?.options?.roll || "Roll into loan" },
                ]}
              />
            </Fieldset>
          </MoreOptions>
        </section>
        <ResultsPanel
          heading={String(results.heading)}
          primaryLabel={String(results.primaryLabel)}
          primaryValue={computed ? money(computed.monthlySavings) : PLACEHOLDER}
          items={[
            { label: labels.currentPayment, value: computed ? money(computed.currentPayment) : PLACEHOLDER },
            { label: labels.newPayment, value: computed ? money(computed.newPayment) : PLACEHOLDER },
            {
              label: labels.breakEven,
              value: computed ? (Number.isFinite(computed.breakEvenMonths) ? months(computed.breakEvenMonths) : String(results.breakEvenNever)) : PLACEHOLDER,
            },
            { label: labels.lifetime, value: computed ? whole(computed.lifetimeSavings) : PLACEHOLDER },
          ]}
          summary={
            computed
              ? [
                  { label: labels.simple, value: whole(computed.simpleSavings) },
                  { label: labels.currentInterest, value: whole(computed.currentInterest) },
                  { label: labels.newInterest, value: whole(computed.newInterest) },
                ]
              : []
          }
          message={computed ? String(results.summaryMessage) : String(results.invalidMessage)}
          cta={<CalculatorCta id="refinance" />}
        />
      </div>
    </CalculatorShell>
  );
}
