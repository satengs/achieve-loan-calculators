"use client";

import { useMemo } from "react";
import { dtiBand, dtiRatio, estimatedCardMinimum } from "../calc";
import { resolveProjectName, type ProjectName } from "../brand/types";
import { CalculatorShell } from "../components/CalculatorShell";
import { MoreOptions } from "../components/MoreOptions";
import { DtiGauge } from "../components/DtiGauge";
import { ResultsPanel } from "../components/ResultsPanel";
import { CalculatorCta, pct, useCalculatorSetup, resultsVariant } from "./common";
import { NumberFields, useNumberInputs } from "./useNumberInputs";
import { PLACEHOLDER } from "./utils";

export type DtiCalculatorProps = { projectName?: ProjectName | string };

const KEYS = ["monthlyIncome", "monthlyDebts", "cardBalance", "cardMinPct"] as const;

export function DtiCalculator({ projectName = "achieve" }: DtiCalculatorProps) {
  const brand = resolveProjectName(projectName);
  const { content, config, whole, fields, results, labels, features } = useCalculatorSetup("dti");
  const inputs = useNumberInputs(config, KEYS);
  const bands = (results.bands || {}) as Record<string, { label: string; body: string }>;
  const goodMax = Number(features.bands?.goodMax ?? 35);
  const fairMax = Number(features.bands?.fairMax ?? 43);

  const computed = useMemo(() => {
    if (!inputs.ok) return null;
    const v = inputs.values;
    const card = estimatedCardMinimum(v.cardBalance, v.cardMinPct);
    const debts = v.monthlyDebts + (Number.isFinite(card) ? card : 0);
    const ratio = dtiRatio(v.monthlyIncome, debts);
    const band = dtiBand(ratio, goodMax, fairMax);
    if (!band) return null;
    const at35 = v.monthlyIncome * (goodMax / 100);
    return { ratio, band, debts, at35, headroom: at35 - debts };
  }, [inputs.ok, inputs.values, goodMax, fairMax]);

  const band = computed ? bands[computed.band] : null;
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
          <NumberFields idPrefix="dti" keys={["monthlyIncome", "monthlyDebts", "cardBalance"]} fields={fields} inputs={inputs}  preferQuestion={brand === "achieve"} />
          <MoreOptions>
            <NumberFields idPrefix="dti" keys={["cardMinPct"]} fields={fields} inputs={inputs}  preferQuestion={brand === "achieve"} />
          </MoreOptions>
        </section>
        <ResultsPanel
          variant={resultsVariant(brand)}
          heading={String(results.heading)}
          primaryLabel={String(results.primaryLabel)}
          primaryValue={computed ? pct(computed.ratio, 1) : PLACEHOLDER}
          headline={
            computed ? (
              <>
                Your estimated DTI ratio is{" "}
                <span className="lc-headline-em">{pct(computed.ratio, 1)}</span>
              </>
            ) : (
              "Enter your income and debts to see your estimated DTI ratio"
            )
          }
          chart={
            brand === "achieve" ? (
              <DtiGauge
                ratio={computed ? computed.ratio : null}
                band={computed?.band ?? null}
                goodMax={goodMax}
                fairMax={fairMax}
                eyebrow="Your estimated DTI ratio"
                good={{ title: `≤${goodMax}%`, label: (bands.good?.label.split(" — ")[1] || "generally considered manageable") }}
                fair={{ title: `${goodMax + 1}% to ${fairMax}%`, label: (bands.fair?.label.split(" — ")[1] || "may need work") }}
                high={{ title: `${fairMax + 1}%`, label: (bands.high?.label.split(" — ")[1] || "high") }}
              />
            ) : undefined
          }
          tip={band?.body}
          stats={
            computed
              ? [
                  { label: labels.totalDebts, value: whole(computed.debts) },
                  { label: labels.to35, value: whole(computed.at35) },
                  { label: labels.headroom, value: whole(computed.headroom) },
                ]
              : []
          }
          items={[
            { label: labels.band, value: band?.label || PLACEHOLDER },
            { label: labels.totalDebts, value: computed ? whole(computed.debts) : PLACEHOLDER },
            { label: labels.to35, value: computed ? whole(computed.at35) : PLACEHOLDER },
            { label: labels.headroom, value: computed ? whole(computed.headroom) : PLACEHOLDER },
          ]}
          summary={
            brand === "achieve"
              ? []
              : band
                ? [
                    { label: `≤${goodMax}%`, value: bands.good?.label.split(" — ")[1] || "" },
                    { label: `${goodMax + 1}–${fairMax}%`, value: bands.fair?.label.split(" — ")[1] || "" },
                    { label: `≥${fairMax + 1}%`, value: bands.high?.label.split(" — ")[1] || "" },
                  ]
                : []
          }
          message={band ? `${brand === "achieve" ? "" : band.body + " "}${results.summaryMessage}`.trim() : String(results.invalidMessage)}
          cta={<CalculatorCta id="dti" />}
        />
      </div>
    </CalculatorShell>
  );
}
