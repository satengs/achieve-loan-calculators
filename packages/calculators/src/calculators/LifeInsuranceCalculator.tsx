"use client";

import { useMemo, useState } from "react";
import { lifeCoverageEstimate, lifePremiumEstimate, validateRange } from "../calc";
import { SelectField } from "../components/SelectField";
import { resolveProjectName, type ProjectName } from "../brand/types";
import { CalculatorShell } from "../components/CalculatorShell";
import { CTA } from "../components/CTA";
import { Field, Fieldset, Segmented } from "../components/Field";
import { ResultsPanel } from "../components/ResultsPanel";
import { getCalculatorConfig, getCalculatorContent } from "../content/load";
import { moneyFn, PLACEHOLDER } from "./utils";

export type LifeInsuranceCalculatorProps = {
  projectName?: ProjectName | string;
};

export function LifeInsuranceCalculator({ projectName = "achieve" }: LifeInsuranceCalculatorProps) {
  const brand = resolveProjectName(projectName);
  const content = getCalculatorContent("life-insurance");
  const config = getCalculatorConfig("life-insurance");
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
      return { err, message: String(results.invalidMessage || ""), out: null as null | Record<string, string> };
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
    const ratePer1000 =
      Number(feats.premiumRatePer1000ByAge?.[ageBand] ?? 1) *
      Number(feats.termMultiplier?.[termYears] ?? 1) *
      (tobacco === "yes" ? Number(feats.tobaccoMultiplier ?? 1) : 1);
    const premium = lifePremiumEstimate(est.netNeed, ratePer1000);
    const termDisplay = String(results.termDisplay || "{{years}} years").replace("{{years}}", termYears);
    return {
      err,
      message: String(results.summaryMessage || ""),
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

  const out = computed.out;
  const err = computed.err;
  const presets = (config.termPresets || [10, 20, 30]).map(String);

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
          {fieldDefs.map((f) => (
            <Field
              key={f.id}
              id={f.id}
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
                  { label: labels.finalExpenses || "Final expenses", value: out.final },
                  { label: labels.education || "Education / goals", value: out.edu },
                  { label: labels.selectedTerm || "Selected term", value: out.term },
                  { label: labels.premiumMonthly || "Illustrative premium (monthly)", value: out.premiumMonthly },
                  { label: labels.premiumAnnual || "Illustrative premium (annual)", value: out.premiumAnnual },
                ]
              : []
          }
          message={computed.message}
          cta={
            <CTA
              label={content.cta.label}
              href={content.cta.href}
              note={content.cta.note}
              enabled={config.cta?.enabled !== false}
              preventDefault={config.cta?.preventDefault !== false}
            />
          }
        />
      </div>
    </CalculatorShell>
  );
}
