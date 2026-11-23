"use client";

import { useMemo, useState } from "react";
import { lifeCoverageEstimate, lifePremiumEstimate, lifePremiumRatePer1000, validateRange } from "../calc";
import { SelectField } from "../components/SelectField";
import { resolveProjectName, type ProjectName } from "../brand/types";
import { CalculatorShell } from "../components/CalculatorShell";
import { SectionHeading, useOnCalculate, type CalculatorBaseProps } from "../shell/options";
import { Field, Fieldset, Segmented } from "../components/Field";
import { ResultsPanel } from "../components/ResultsPanel";
import { moneyFn, PLACEHOLDER } from "./utils";
import { CalculatorCta, resultsVariant, useCalculatorSetup } from "./common";

/** Prefillable inputs for `defaults`. */
export type LifeInsuranceCalculatorInputs = {
  annualIncome: number;
  yearsReplace: number;
  totalDebts: number;
  finalExpenses: number;
  educationFund: number;
  existingCoverage: number;
  liquidAssets: number;
  termYears: number;
  ageBand: string;
  tobacco: "yes" | "no";
};
/** Payload passed to `onCalculate`. */
export type LifeInsuranceCalculatorResult = {
  coverage: ReturnType<typeof lifeCoverageEstimate>;
  ratePer1000: ReturnType<typeof lifePremiumRatePer1000>;
  premium: ReturnType<typeof lifePremiumEstimate> | null;
  termYears: number;
  ageBand: string;
  tobacco: boolean;
};

export type LifeInsuranceCalculatorProps = CalculatorBaseProps<LifeInsuranceCalculatorInputs, LifeInsuranceCalculatorResult> & {
  projectName?: ProjectName | string;
};

export function LifeInsuranceCalculator({ projectName = "achieve", ...options }: LifeInsuranceCalculatorProps) {
  const brand = resolveProjectName(projectName);
  const { content, config } = useCalculatorSetup("life-insurance", options.defaults);
  const roundWhole = config.features?.currencyRoundToWhole !== false;
  const money = useMemo(
    () => moneyFn(config),
    [config],
  );
  const fmt = (n: number) =>
    money(n, roundWhole ? { maximumFractionDigits: 0, minimumFractionDigits: 0 } : undefined);
  const fields = content.form.fields as Record<string, any>;
  const results = content.results as Record<string, any>;
  const labels = (results.labels || {}) as Record<string, string>;

  const [annualIncome, setAnnualIncome] = useState(String(config.defaults.annualIncome ?? 75000));
  const [yearsReplace, setYearsReplace] = useState(String(config.defaults.yearsReplace ?? 10));
  const [totalDebts, setTotalDebts] = useState(String(config.defaults.totalDebts ?? 250000));
  const [finalExpenses, setFinalExpenses] = useState(String(config.defaults.finalExpenses ?? 15000));
  const [educationFund, setEducationFund] = useState(String(config.defaults.educationFund ?? 50000));
  const [existingCoverage, setExistingCoverage] = useState(String(config.defaults.existingCoverage ?? 100000));
  const [liquidAssets, setLiquidAssets] = useState(String(config.defaults.liquidAssets ?? 25000));
  const [termYears, setTermYears] = useState(String(config.defaults.termYears ?? 20));
  const [ageBand, setAgeBand] = useState(String(config.defaults.ageBand ?? "30-39"));
  const [tobacco, setTobacco] = useState(String(config.defaults.tobacco ?? "no"));
  const feats = (config.features || {}) as Record<string, any>;

  const fieldDefs = [
    { id: "annual-income", key: "annualIncome" as const, state: annualIncome, set: setAnnualIncome, conf: "annualIncome", field: fields.annualIncome },
    { id: "years-replace", key: "yearsReplace" as const, state: yearsReplace, set: setYearsReplace, conf: "yearsReplace", field: fields.yearsReplace, inputMode: "numeric" as const },
    { id: "total-debts", key: "totalDebts" as const, state: totalDebts, set: setTotalDebts, conf: "totalDebts", field: fields.totalDebts },
    { id: "final-expenses", key: "finalExpenses" as const, state: finalExpenses, set: setFinalExpenses, conf: "finalExpenses", field: fields.finalExpenses },
    { id: "education-fund", key: "educationFund" as const, state: educationFund, set: setEducationFund, conf: "educationFund", field: fields.educationFund },
    { id: "existing-coverage", key: "existingCoverage" as const, state: existingCoverage, set: setExistingCoverage, conf: "existingCoverage", field: fields.existingCoverage },
    { id: "liquid-assets", key: "liquidAssets" as const, state: liquidAssets, set: setLiquidAssets, conf: "liquidAssets", field: fields.liquidAssets },
  ];

  const computed = useMemo(() => {
    const values: Record<string, number> = {};
    const err: Record<string, string> = {};
    let ok = true;
    for (const f of fieldDefs) {
      const v = validateRange(f.state, config.validation[f.conf] || {});
      err[f.key] = v.ok ? "" : v.message;
      if (!v.ok) ok = false;
      values[f.key] = v.value;
    }
    if (!ok) {
      return { err, message: String(results.invalidMessage || ""), out: null as null | Record<string, string>, result: null };
    }
    const est = lifeCoverageEstimate({
      annualIncome: values.annualIncome,
      yearsIncomeReplace: values.yearsReplace,
      totalDebts: values.totalDebts,
      finalExpenses: values.finalExpenses,
      educationFund: values.educationFund,
      existingCoverage: values.existingCoverage,
      liquidAssets: values.liquidAssets,
    });
    const ratePer1000 = lifePremiumRatePer1000(
      { ageBand, termYears: Number(termYears), tobacco: tobacco === "yes" },
      feats,
    );
    const premium = ratePer1000 == null ? null : lifePremiumEstimate(est.netNeed, ratePer1000);
    const termDisplay = String(results.termDisplay || "{{years}} years").replace("{{years}}", termYears);
    return {
      err,
      message: String(results.summaryMessage || ""),
      result: { coverage: est, ratePer1000, premium, termYears: Number(termYears), ageBand, tobacco: tobacco === "yes" },
      out: {
        net: fmt(est.netNeed),
        gross: fmt(est.grossNeed),
        income: fmt(est.incomeNeed),
        debts: fmt(est.debts),
        offset: fmt(est.existing + est.assets),
        final: fmt(est.finals),
        edu: fmt(est.education),
        term: termDisplay,
        premiumMonthly: premium ? money(premium.monthly) : PLACEHOLDER,
        premiumAnnual: premium ? fmt(premium.annual) : PLACEHOLDER,
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annualIncome, yearsReplace, totalDebts, finalExpenses, educationFund, existingCoverage, liquidAssets, termYears, ageBand, tobacco, feats, config, results]);

  useOnCalculate<LifeInsuranceCalculatorResult>(options.onCalculate, computed.result);
  const out = computed.out;
  const err = computed.err;
  const presets = (config.termPresets || [10, 20, 30]).map(String);

  return (
    <CalculatorShell
      projectName={brand}
      eyebrow={content.header.eyebrow}
      title={content.header.title}
      intro={content.header.intro}
      calculator="life-insurance"
      content={content}
      options={options}
    >
      <div className="lc-layout">
        <section className="lc-card lc-form">
          <SectionHeading>{content.form.heading}</SectionHeading>
          {fieldDefs.map((f) => (
            <Field
              key={f.id}
              id={f.id}
              fieldKey={f.key}
              label={f.field?.label || f.key}
              hint={f.field?.hint}
              prefix={f.field?.prefix}
              suffix={f.field?.suffix}
              value={f.state}
              onChange={f.set}
              inputMode={f.inputMode || "decimal"}
              error={err[f.key]}
            />
          ))}
          <Fieldset legend={fields.termYears?.label || "Preferred term length"}>
            <Segmented
              name="term-years"
              ariaLabel={fields.termYears?.ariaLabel || "Term length"}
              value={termYears}
              onChange={setTermYears}
              options={presets.map((p) => ({
                value: p,
                label: fields.termYears?.presetLabels?.[p] || `${p} yr`,
              }))}
            />
            {fields.termYears?.hint ? <p className="lc-hint">{fields.termYears.hint}</p> : null}
          </Fieldset>
          <SelectField
            id="age-band"
            label={fields.ageBand?.label || "Age"}
            value={ageBand}
            onChange={setAgeBand}
            options={Object.entries((fields.ageBand?.options || {}) as Record<string, string>).map(([value, label]) => ({ value, label }))}
          />
          <SelectField
            id="tobacco"
            label={fields.tobacco?.label || "Tobacco use"}
            hint={String(results.premiumNote || "")}
            value={tobacco}
            onChange={setTobacco}
            options={Object.entries((fields.tobacco?.options || {}) as Record<string, string>).map(([value, label]) => ({ value, label }))}
          />
        </section>

        <ResultsPanel
          variant={resultsVariant(brand)}
          heading={String(results.heading || "Estimated coverage need")}
          primaryLabel={String(results.primaryLabel || "Additional coverage to consider")}
          primaryValue={out?.net || PLACEHOLDER}
          items={[
            { label: labels.grossNeed || "Gross need", value: out?.gross || PLACEHOLDER },
            { label: labels.incomeReplacement || "Income replacement", value: out?.income || PLACEHOLDER },
            { label: labels.debts || "Debts", value: out?.debts || PLACEHOLDER },
            { label: labels.offset || "Less existing + assets", value: out?.offset || PLACEHOLDER },
          ]}
          summary={
            out
              ? [
                  ...(options.showBreakdown === false
                    ? []
                    : [
                        { label: labels.finalExpenses || "Final expenses", value: out.final },
                        { label: labels.education || "Education / goals", value: out.edu },
                      ]),
                  { label: labels.selectedTerm || "Selected term", value: out.term },
                  { label: labels.premiumMonthly || "Illustrative premium (monthly)", value: out.premiumMonthly },
                  { label: labels.premiumAnnual || "Illustrative premium (annual)", value: out.premiumAnnual },
                ]
              : []
          }
          message={computed.message}
          cta={<CalculatorCta id="life-insurance" />}
        />
      </div>
    </CalculatorShell>
  );
}
