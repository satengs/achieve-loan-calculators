"use client";

import { useMemo } from "react";
import { leasePayment } from "../calc";
import { resolveProjectName, type ProjectName } from "../brand/types";
import { CalculatorShell } from "../components/CalculatorShell";
import { SectionHeading, useOnCalculate, type CalculatorBaseProps } from "../shell/options";
import { MoreOptions } from "../components/MoreOptions";
import { RateNote } from "../components/RateNote";
import { ResultsPanel } from "../components/ResultsPanel";
import { resolveRate, type MarketRates } from "../rates/types";
import { CalculatorCta, useCalculatorSetup, resultsVariant } from "./common";
import { NumberFields, useNumberInputs } from "./useNumberInputs";
import { PLACEHOLDER } from "./utils";

/** Prefillable inputs for `defaults`. */
export type AutoLeaseCalculatorInputs = Record<(typeof KEYS)[number], number>;
/** Payload passed to `onCalculate`. */
export type AutoLeaseCalculatorResult = NonNullable<ReturnType<typeof leasePayment>>;

export type AutoLeaseCalculatorProps = CalculatorBaseProps<AutoLeaseCalculatorInputs, AutoLeaseCalculatorResult> & {
  projectName?: ProjectName | string;
  /** Live rates: auto48 used as an APR proxy for the money factor. */
  rates?: MarketRates;
};

const KEYS = ["msrp", "price", "down", "tradeIn", "fees", "residualPct", "apr", "termMonths", "salesTax"] as const;

export function AutoLeaseCalculator({ projectName = "achieve", rates, ...options }: AutoLeaseCalculatorProps) {
  const brand = resolveProjectName(projectName);
  const { content, config, money, whole, fields, results, labels } = useCalculatorSetup("auto-lease", options.defaults);
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
  useOnCalculate<AutoLeaseCalculatorResult>(options.onCalculate, computed);

  const msg = !inputs.ok ? String(results.invalidMessage) : !computed ? String(results.invalidCap) : String(results.summaryMessage);
  return (
    <CalculatorShell projectName={brand} calculator="auto-lease" content={content} options={options}>
      <div className="lc-layout">
        <section className="lc-card lc-form">
          <SectionHeading>{content.form.heading}</SectionHeading>
          <NumberFields idPrefix="al" keys={["msrp", "price", "down", "termMonths", "residualPct", "apr"]} fields={fields} inputs={inputs}  preferQuestion={brand === "achieve"} />
          <RateNote rate={rate} subject="APR proxy (48-month new car loan average; lessor money factors differ)" />
          <MoreOptions>
            <NumberFields idPrefix="al" keys={["tradeIn", "fees", "salesTax"]} fields={fields} inputs={inputs}  preferQuestion={brand === "achieve"} />
          </MoreOptions>
        </section>
        <ResultsPanel
          variant={resultsVariant(brand)}
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
            computed && options.showBreakdown !== false
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
