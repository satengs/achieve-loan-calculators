"use client";

import { useMemo } from "react";
import { leasePayment } from "../calc";
import { resolveProjectName, type ProjectName } from "../brand/types";
import { CalculatorShell } from "../components/CalculatorShell";
import { MoreOptions } from "../components/MoreOptions";
import { RateNote } from "../components/RateNote";
import { ResultsPanel } from "../components/ResultsPanel";
import { resolveRate, type MarketRates } from "../rates/types";
import { CalculatorCta, useCalculatorSetup } from "./common";
import { NumberFields, useNumberInputs } from "./useNumberInputs";
import { PLACEHOLDER } from "./utils";

export type AutoLeaseCalculatorProps = {
  projectName?: ProjectName | string;
  /** Live rates: auto48 used as an APR proxy for the money factor. */
  rates?: MarketRates;
};

const KEYS = ["msrp", "price", "down", "tradeIn", "fees", "residualPct", "apr", "termMonths", "salesTax"] as const;

export function AutoLeaseCalculator({ projectName = "achieve", rates }: AutoLeaseCalculatorProps) {
  const brand = resolveProjectName(projectName);
  const { content, config, money, whole, fields, results, labels } = useCalculatorSetup("auto-lease");
  const rate = resolveRate(rates, "auto48", Number(config.defaults.apr));
  const inputs = useNumberInputs(config, KEYS, { apr: rate.value });

  const computed = useMemo(() => {
    if (!inputs.ok) return null;
    const v = inputs.values;
    return leasePayment({
      msrp: v.msrp,
      price: v.price,
      down: v.down,
      tradeIn: v.tradeIn,
      fees: v.fees,
      residualPct: v.residualPct,
      aprPct: v.apr,
      termMonths: Math.round(v.termMonths),
      salesTaxPct: v.salesTax,
    });
  }, [inputs.ok, inputs.values]);

  const msg = !inputs.ok ? String(results.invalidMessage) : !computed ? String(results.invalidCap) : String(results.summaryMessage);
  return (
    <CalculatorShell projectName={brand} eyebrow={content.header.eyebrow} title={content.header.title} intro={content.header.intro} banner={content.demoBanner} footerNote={content.footer.note}>
      <div className="lc-layout">
        <section className="lc-card lc-form">
          <h2>{content.form.heading}</h2>
          <NumberFields idPrefix="al" keys={["msrp", "price", "down", "termMonths", "residualPct", "apr"]} fields={fields} inputs={inputs} />
          <RateNote rate={rate} subject="APR proxy (48-month new car loan average; lessor money factors differ)" />
          <MoreOptions>
            <NumberFields idPrefix="al" keys={["tradeIn", "fees", "salesTax"]} fields={fields} inputs={inputs} />
          </MoreOptions>
        </section>
        <ResultsPanel
          heading={String(results.heading)}
          primaryLabel={String(results.primaryLabel)}
          primaryValue={computed ? money(computed.monthly) : PLACEHOLDER}
          items={[
            { label: labels.totalCost, value: computed ? whole(computed.totalLeaseCost) : PLACEHOLDER },
            { label: labels.residual, value: computed ? whole(computed.residual) : PLACEHOLDER },
            { label: labels.moneyFactor, value: computed ? computed.moneyFactor.toFixed(5) : PLACEHOLDER },
            { label: labels.financeTotal, value: computed ? whole(computed.totalFinanceCharge) : PLACEHOLDER },
          ]}
          summary={
            computed
              ? [
                  { label: labels.depreciation, value: money(computed.depreciation) },
                  { label: labels.finance, value: money(computed.finance) },
                  { label: labels.tax, value: money(computed.tax) },
                ]
              : []
          }
          message={msg}
          cta={<CalculatorCta id="auto-lease" />}
        />
      </div>
    </CalculatorShell>
  );
}
