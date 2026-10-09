"use client";

import { useMemo, useState } from "react";
import { factorEstimate, lookupFactor, perThousandBase } from "../calc";
import { resolveProjectName, type ProjectName } from "../brand/types";
import { CalculatorShell } from "../components/CalculatorShell";
import { MoreOptions } from "../components/MoreOptions";
import { ResultsPanel } from "../components/ResultsPanel";
import { SelectField } from "../components/SelectField";
import { CalculatorCta, optionsFrom, useCalculatorSetup } from "./common";
import { NumberFields, useNumberInputs } from "./useNumberInputs";
import { PLACEHOLDER } from "./utils";

export type HomeInsuranceCalculatorProps = { projectName?: ProjectName | string };

const FACTOR_KEYS = ["region", "homeAge", "construction", "deductible", "claims", "contents"] as const;
const PRIMARY = ["region", "homeAge", "deductible"];

export function HomeInsuranceCalculator({ projectName = "achieve" }: HomeInsuranceCalculatorProps) {
  const brand = resolveProjectName(projectName);
  const { content, config, whole, fields, results, labels, features } = useCalculatorSetup("home-insurance");
  const inputs = useNumberInputs(config, ["dwelling", "ratePerThousand"]);
  const [sel, setSel] = useState<Record<string, string>>(() =>
    Object.fromEntries([...FACTOR_KEYS, "liability"].map((k) => [k, String(config.defaults[k] ?? "")])),
  );
  const factors = (features.factors || {}) as Record<string, Array<{ value: string; factor: number }>>;
  const liability = (features.liabilityAddOn || {}) as Record<string, number>;
  const rangePct = Number(features.rangePct ?? 20);

  const computed = useMemo(() => {
    if (!inputs.ok) return null;
    const base = perThousandBase(inputs.values.dwelling, inputs.values.ratePerThousand);
    const f = FACTOR_KEYS.map((k) => lookupFactor(factors[k], sel[k]));
    return factorEstimate(base, f, [Number(liability[sel.liability] ?? 0)]);
  }, [inputs.ok, inputs.values, sel, factors, liability]);

  const select = (k: string) => (
    <SelectField
      key={k}
      id={`hi-${k}`}
      label={fields[k]?.label || k}
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
          <NumberFields idPrefix="hi" keys={["dwelling"]} fields={fields} inputs={inputs} />
          {PRIMARY.map(select)}
          <MoreOptions>
            {["construction", "claims", "contents", "liability"].map(select)}
            <NumberFields idPrefix="hi" keys={["ratePerThousand"]} fields={fields} inputs={inputs} />
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
            { label: labels.base, value: computed ? whole(computed.base) : PLACEHOLDER },
            { label: labels.multiplier, value: computed ? `×${computed.multiplier.toFixed(2)}` : PLACEHOLDER },
          ]}
          message={computed ? String(results.summaryMessage) : String(results.invalidMessage)}
          cta={<CalculatorCta id="home-insurance" />}
        />
      </div>
    </CalculatorShell>
  );
}
