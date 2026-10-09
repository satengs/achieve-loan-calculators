"use client";

import { useMemo, useState } from "react";
import { factorEstimate, lookupFactor } from "../calc";
import { resolveProjectName, type ProjectName } from "../brand/types";
import { CalculatorShell } from "../components/CalculatorShell";
import { MoreOptions } from "../components/MoreOptions";
import { ResultsPanel } from "../components/ResultsPanel";
import { SelectField } from "../components/SelectField";
import { CalculatorCta, optionsFrom, useCalculatorSetup } from "./common";
import { NumberFields, useNumberInputs } from "./useNumberInputs";
import { PLACEHOLDER } from "./utils";

export type CarInsuranceCalculatorProps = { projectName?: ProjectName | string };

const FACTOR_KEYS = ["driverAge", "record", "vehicle", "coverage", "deductible", "mileage", "area"] as const;
const ADDON_KEYS = ["roadside", "rental"] as const;
const PRIMARY = ["driverAge", "record", "vehicle", "coverage"];

export function CarInsuranceCalculator({ projectName = "achieve" }: CarInsuranceCalculatorProps) {
  const brand = resolveProjectName(projectName);
  const { content, config, whole, fields, results, labels, features } = useCalculatorSetup("car-insurance");
  const inputs = useNumberInputs(config, ["basePremium"]);
  const [sel, setSel] = useState<Record<string, string>>(() =>
    Object.fromEntries([...FACTOR_KEYS, ...ADDON_KEYS].map((k) => [k, String(config.defaults[k] ?? "")])),
  );
  const factors = (features.factors || {}) as Record<string, Array<{ value: string; factor: number }>>;
  const addOnCosts = (features.addOns || {}) as Record<string, number>;
  const rangePct = Number(features.rangePct ?? 15);

  const computed = useMemo(() => {
    if (!inputs.ok) return null;
    const f = FACTOR_KEYS.map((k) => lookupFactor(factors[k], sel[k]));
    const adds = ADDON_KEYS.map((k) => (sel[k] === "yes" ? Number(addOnCosts[k] ?? 0) : 0));
    return factorEstimate(inputs.values.basePremium, f, adds);
  }, [inputs.ok, inputs.values, sel, factors, addOnCosts]);

  const select = (k: string) => (
    <SelectField
      key={k}
      id={`ci-${k}`}
      label={fields[k]?.label || k}
      hint={fields[k]?.hint}
      value={sel[k]}
      onChange={(v) => setSel((s) => ({ ...s, [k]: v }))}
      options={optionsFrom(fields[k]?.options)}
    />
  );

  return (
    <CalculatorShell projectName={brand} eyebrow={content.header.eyebrow} title={content.header.title} intro={content.header.intro} banner={content.demoBanner} footerNote={content.footer.note}>
      <div className="lc-layout">
        <section className="lc-card lc-form">
          <h2>{content.form.heading}</h2>
          {PRIMARY.map(select)}
          <MoreOptions>
            {FACTOR_KEYS.filter((k) => !PRIMARY.includes(k)).map(select)}
            {ADDON_KEYS.map(select)}
            <NumberFields idPrefix="ci" keys={["basePremium"]} fields={fields} inputs={inputs} />
          </MoreOptions>
        </section>
        <ResultsPanel
          heading={String(results.heading)}
          primaryLabel={String(results.primaryLabel)}
          primaryValue={computed ? whole(computed.monthly) : PLACEHOLDER}
          items={[
            { label: labels.annual, value: computed ? whole(computed.annual) : PLACEHOLDER },
            {
              label: labels.range,
              value: computed ? `${whole(computed.annual * (1 - rangePct / 100))}–${whole(computed.annual * (1 + rangePct / 100))}` : PLACEHOLDER,
            },
            { label: labels.multiplier, value: computed ? `×${computed.multiplier.toFixed(2)}` : PLACEHOLDER },
            { label: labels.addOns, value: computed ? whole(computed.addOns) : PLACEHOLDER },
          ]}
          message={computed ? String(results.summaryMessage) : String(results.invalidMessage)}
          cta={<CalculatorCta id="car-insurance" />}
        />
      </div>
    </CalculatorShell>
  );
}
