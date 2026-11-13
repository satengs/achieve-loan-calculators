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
import { CalculatorCta, interpolate, months, useCalculatorSetup, resultsVariant } from "./common";
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
  const costsMore = !!computed && computed.lifetimeCostChange > 0.5;

  return (
    <CalculatorShell projectName={brand} eyebrow={content.header.eyebrow} title={content.header.title} intro={content.header.intro} banner={content.demoBanner} footerNote={content.footer.note}>
      <div className="lc-layout">
        <section className="lc-card lc-form">
          <h2>{content.form.heading}</h2>
          <NumberFields idPrefix="rf" keys={["balance", "currentRate", "remainingYears", "newRate"]} fields={fields} inputs={inputs}  preferQuestion={brand === "achieve"} />
          <RateNote rate={rate} subject="new rate (30-year fixed average)" />
          <MoreOptions>
            <NumberFields idPrefix="rf" keys={["newTermYears", "closingCosts"]} fields={fields} inputs={inputs}  preferQuestion={brand === "achieve"} />
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
          variant={resultsVariant(brand)}
          heading={String(results.heading)}
          primaryLabel={computed && computed.monthlySavings < 0 ? String(labels.monthlyIncrease || results.primaryLabel) : String(results.primaryLabel)}
          primaryValue={computed ? money(Math.abs(computed.monthlySavings)) : PLACEHOLDER}
          items={[
            { label: labels.currentPayment, value: computed ? money(computed.currentPayment) : PLACEHOLDER },
            { label: labels.newPayment, value: computed ? money(computed.newPayment) : PLACEHOLDER },
            {
              label: labels.breakEven,
              value: computed ? (Number.isFinite(computed.breakEvenMonths) ? months(computed.breakEvenMonths) : String(results.breakEvenNever)) : PLACEHOLDER,
            },
            // M7: lifetime is a separate question from monthly savings; a higher total cost is
            // labelled and styled as a cost, never shown as negative "savings".
            costsMore
              ? { label: labels.lifetimeCost, value: whole(computed!.lifetimeCostChange), tone: "negative" as const }
              : { label: labels.lifetime, value: computed ? whole(Math.max(0, computed.lifetimeSavings)) : PLACEHOLDER },
          ]}
          summary={[
            { label: labels.simple, value: computed ? whole(computed.simpleSavings) : PLACEHOLDER },
            { label: labels.currentInterest, value: computed ? whole(computed.currentInterest) : PLACEHOLDER },
            { label: labels.newInterest, value: computed ? whole(computed.newInterest) : PLACEHOLDER },
          ]}
          message={
            computed
              ? [costsMore ? interpolate(String(results.costsOutweigh || ""), { amount: whole(computed.lifetimeCostChange) }) : "", String(results.summaryMessage)]
                  .filter(Boolean)
                  .join(" ")
              : String(results.invalidMessage)
          }
          cta={<CalculatorCta id="refinance" />}
        />
      </div>
    </CalculatorShell>
  );
}
