"use client";

import { useMemo, useState } from "react";
import { consolidationOptions, simulateMinimumPayments, type ConsolidationOptionConfig } from "../calc";
import { resolveProjectName, type ProjectName } from "../brand/types";
import { CalculatorShell } from "../components/CalculatorShell";
import { DataTable } from "../components/DataTable";
import { MoreOptions } from "../components/MoreOptions";
import { RateNote } from "../components/RateNote";
import { ResultsPanel } from "../components/ResultsPanel";
import { SelectField } from "../components/SelectField";
import { SliderField } from "../components/SliderField";
import { resolveRate, type MarketRates } from "../rates/types";
import { CalculatorCta, interpolate, months, optionsFrom, pct, useCalculatorSetup } from "./common";
import { NumberFields, useNumberInputs } from "./useNumberInputs";
import { PLACEHOLDER } from "./utils";

export type ConsolidationOptionsCalculatorProps = {
  projectName?: ProjectName | string;
  /** Live rates: personalLoan24, prime, creditCard. */
  rates?: MarketRates;
};

const KEYS = ["debtAmount", "plTermMonths", "heTermMonths", "programCostPct", "programMonths"] as const;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function ConsolidationOptionsCalculator({ projectName = "achieve", rates }: ConsolidationOptionsCalculatorProps) {
  const brand = resolveProjectName(projectName);
  const { content, config, whole, fields, results, labels, features } = useCalculatorSetup("consolidation-options");
  const inputs = useNumberInputs(config, KEYS);
  const [band, setBand] = useState(String(config.defaults.creditBand ?? "good"));
  const table = (content.table || {}) as Record<string, any>;
  const optLabels = (results.optionLabels || {}) as Record<string, string>;
  const pl = features.personalLoan;
  const he = features.homeEquity;
  const mins = features.minimums;
  const plRate = resolveRate(rates, pl.rateKey, pl.fallbackBase);
  const primeRate = resolveRate(rates, he.rateKey, he.fallbackBase);
  const cardRate = resolveRate(rates, mins.rateKey, mins.fallbackApr);
  const slider = features.slider;

  const computed = useMemo(() => {
    if (!inputs.ok) return null;
    const v = inputs.values;
    const [plLo, plHi] = (pl.aprByBand[band] || [0, 0]) as [number, number];
    const [heLo, heHi] = (he.marginByBand[band] || [0, 0]) as [number, number];
    const plRange: [number, number] = [
      clamp(plRate.value + plLo, pl.aprFloor, pl.aprCap),
      clamp(plRate.value + plHi, pl.aprFloor, pl.aprCap),
    ];
    const heRange: [number, number] = [primeRate.value + heLo, primeRate.value + heHi];
    const opts: ConsolidationOptionConfig[] = [
      { id: "personal-loan", kind: "loan", aprRange: plRange, termMonths: v.plTermMonths, maxDebt: pl.maxDebt, feePct: pl.feePct },
      { id: "home-equity", kind: "loan", aprRange: heRange, termMonths: v.heTermMonths, minDebt: he.minDebt },
      { id: "debt-resolution", kind: "program", totalCostPct: v.programCostPct, termMonths: Math.round(v.programMonths), minDebt: features.program?.minDebt },
    ];
    const list = consolidationOptions(v.debtAmount, opts);
    const minimum = simulateMinimumPayments(v.debtAmount, cardRate.value, { principalPct: mins.principalPct, floor: mins.floor });
    if (!list || !minimum) return null;
    return { list, minimum, ranges: { "personal-loan": plRange, "home-equity": heRange } as Record<string, [number, number]> };
  }, [inputs.ok, inputs.values, band, plRate.value, primeRate.value, cardRate.value, pl, he, mins, features.program]);

  const range = (lo: number, hi: number) => (Math.round(lo) === Math.round(hi) ? whole(lo) : `${whole(lo)}–${whole(hi)}`);
  const unavailable = (o: { id: string }) => {
    const c = o.id === "personal-loan" ? { max: pl.maxDebt } : o.id === "home-equity" ? { min: he.minDebt } : { min: features.program?.minDebt };
    return c.max != null
      ? interpolate(String(results.unavailableMax), { amount: whole(c.max) })
      : interpolate(String(results.unavailableMin), { amount: whole(c.min ?? 0) });
  };
  const rows: string[][] = computed
    ? [
        ...computed.list.map((o) =>
          o.available
            ? [
                optLabels[o.id],
                `${range(o.monthlyLow, o.monthlyHigh)}/mo`,
                months(o.months),
                range(o.totalLow, o.totalHigh),
                computed.ranges[o.id] ? `${pct(computed.ranges[o.id][0], 2)}–${pct(computed.ranges[o.id][1], 2)}` : "—",
              ]
            : [optLabels[o.id], unavailable(o), "—", "—", "—"],
        ),
        [optLabels.minimums, `${whole(computed.minimum.firstPayment)}/mo (first)`, months(computed.minimum.months), whole(computed.minimum.totalPaid), pct(cardRate.value, 2)],
      ]
    : [];

  return (
    <CalculatorShell
      projectName={brand}
      eyebrow={content.header.eyebrow}
      title={content.header.title}
      intro={content.header.intro}
      banner={content.demoBanner}
      footerNote={content.footer.note}
    >
      <div className="lc-layout">
        <section className="lc-card lc-form">
          <h2>{content.form.heading}</h2>
          <SliderField
            id="co-debtAmount"
            label={fields.debtAmount?.label}
            hint={fields.debtAmount?.hint}
            prefix="$"
            min={slider.min}
            max={slider.max}
            step={slider.step}
            value={inputs.state.debtAmount}
            onChange={(v) => inputs.set("debtAmount", v)}
            display={Number.isFinite(inputs.values.debtAmount) ? whole(inputs.values.debtAmount) : PLACEHOLDER}
            error={inputs.errors.debtAmount}
          />
          <SelectField
            id="co-creditBand"
            label={fields.creditBand?.label}
            hint={fields.creditBand?.hint}
            value={band}
            onChange={setBand}
            options={optionsFrom(fields.creditBand?.options)}
          />
          <RateNote rate={plRate} subject="personal loan base rate" adjustment="± credit band offset" />
          <RateNote rate={primeRate} subject="home equity base (prime rate)" adjustment="+ illustrative margin" />
          <RateNote rate={cardRate} subject="card APR for minimums" />
          <MoreOptions>
            <NumberFields idPrefix="co" keys={["plTermMonths", "heTermMonths", "programCostPct", "programMonths"]} fields={fields} inputs={inputs} />
          </MoreOptions>
        </section>
        <ResultsPanel
          heading={String(results.heading)}
          primaryLabel={String(results.primaryLabel)}
          primaryValue={computed ? whole(computed.minimum.firstPayment) : PLACEHOLDER}
          items={(computed?.list || []).map((o) => ({
            label: optLabels[o.id],
            value: o.available ? `${range(o.monthlyLow, o.monthlyHigh)}/mo` : "—",
          }))}
          summary={
            computed
              ? [
                  { label: labels.minMonths, value: months(computed.minimum.months) },
                  { label: labels.minTotal, value: whole(computed.minimum.totalPaid) },
                ]
              : []
          }
          message={computed ? String(results.summaryMessage) : String(results.invalidMessage)}
          cta={<CalculatorCta id="consolidation-options" />}
        />
      </div>
      <div className="lc-card lc-amort-card">
        <h2>{table.heading}</h2>
        <DataTable caption={table.heading} columns={table.columns || []} rows={rows} emptyText={String(results.invalidMessage)} />
      </div>
    </CalculatorShell>
  );
}
