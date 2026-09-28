"use client";

import { useMemo, useState } from "react";
import { amortize, downPaymentAndLoan, validateRange } from "../calc";
import { resolveProjectName, type ProjectName } from "../brand/types";
import { CalculatorShell } from "../components/CalculatorShell";
import { CTA } from "../components/CTA";
import { Field, Fieldset, Segmented } from "../components/Field";
import { ResultsPanel } from "../components/ResultsPanel";
import { getCalculatorConfig, getCalculatorContent } from "../content/load";
import { moneyFn, PLACEHOLDER } from "./utils";

export type MortgageCalculatorProps = {
  projectName?: ProjectName | string;
};

export function MortgageCalculator({ projectName = "achieve" }: MortgageCalculatorProps) {
  const brand = resolveProjectName(projectName);
  const content = getCalculatorContent("mortgage");
  const config = getCalculatorConfig("mortgage");
  const money = useMemo(() => moneyFn(config), [config]);
  const fields = content.form.fields as Record<string, any>;
  const results = content.results as Record<string, any>;
  const labels = (results.labels || {}) as Record<string, string>;
  const msgs = content.validationMessages || {};

  const [homePrice, setHomePrice] = useState(String(config.defaults.homePrice ?? 400000));
  const [dpMode, setDpMode] = useState(String(config.defaults.downPaymentMode ?? "percent"));
  const [downPayment, setDownPayment] = useState(String(config.defaults.downPayment ?? 20));
  const [loanAmount, setLoanAmount] = useState(String(config.defaults.loanAmount ?? 320000));
  const [loanManual, setLoanManual] = useState(false);
  const [apr, setApr] = useState(String(config.defaults.apr ?? 6.5));
  const [termYears, setTermYears] = useState(String(config.defaults.termYears ?? 30));
  const [tax, setTax] = useState(String(config.defaults.taxMonthly ?? 350));
  const [ins, setIns] = useState(String(config.defaults.insMonthly ?? 150));
  const [hoa, setHoa] = useState(String(config.defaults.hoaMonthly ?? 0));

  const syncLoan = (priceStr: string, downStr: string, mode: string) => {
    const price = Number(String(priceStr).replace(/[$,%\s,]/g, ""));
    const down = Number(String(downStr).replace(/[$,%\s,]/g, ""));
    const derived = downPaymentAndLoan(price, down, mode === "dollars" ? "dollars" : "percent");
    if (Number.isFinite(derived.loanAmount) && derived.loanAmount >= 0) {
      setLoanAmount(String(Math.round(derived.loanAmount * 100) / 100));
    }
  };

  const computed = useMemo(() => {
    const priceV = validateRange(homePrice, config.validation.homePrice);
    const aprV = validateRange(apr, config.validation.apr);
    const yearsV = validateRange(termYears, config.validation.termYears);
    const taxV = validateRange(tax, config.validation.taxMonthly);
    const insV = validateRange(ins, config.validation.insMonthly);
    const hoaV = validateRange(hoa, config.validation.hoaMonthly);
    const loanV = validateRange(loanAmount, config.validation.loanAmount);

    let dpMsg = "";
    const dpRaw = Number(String(downPayment).replace(/[$,%\s,]/g, ""));
    if (!Number.isFinite(dpRaw) || dpRaw < 0) dpMsg = msgs.downNegative || "Invalid down payment.";
    else if (dpMode === "percent" && dpRaw > 100) dpMsg = msgs.downPercentMax || "Down payment percent cannot exceed 100%.";
    else if (priceV.ok && dpMode === "dollars" && dpRaw > priceV.value) dpMsg = msgs.downExceedsPrice || "Down payment cannot exceed home price.";

    if (!priceV.ok || !aprV.ok || !yearsV.ok || !taxV.ok || !insV.ok || !hoaV.ok || dpMsg || !loanV.ok) {
      return {
        err: {
          homePrice: priceV.ok ? "" : priceV.message,
          down: dpMsg,
          loan: loanV.ok ? "" : loanV.message,
          apr: aprV.ok ? "" : aprV.message,
          term: yearsV.ok ? "" : yearsV.message,
          tax: taxV.ok ? "" : taxV.message,
          ins: insV.ok ? "" : insV.message,
          hoa: hoaV.ok ? "" : hoaV.message,
        },
        message: String(results.invalidMessage || ""),
        out: null as null | Record<string, string>,
      };
    }

    if (loanV.value <= 0) {
      return {
        err: { homePrice: "", down: "", loan: msgs.loanZero || "Loan amount must be greater than zero.", apr: "", term: "", tax: "", ins: "", hoa: "" },
        message: String(results.zeroLoanMessage || ""),
        out: null,
      };
    }

    const months = Math.round(yearsV.value * 12);
    const result = amortize(loanV.value, aprV.value, months);
    if (!result) {
      return { err: {}, message: String(results.unableMessage || ""), out: null };
    }
    const downDollars = Math.max(0, priceV.value - loanV.value);
    const piti = result.payment + taxV.value + insV.value + hoaV.value;

    return {
      err: { homePrice: "", down: "", loan: "", apr: "", term: "", tax: "", ins: "", hoa: "" },
      message: String(results.summaryTemplate || "")
        .replace("{{years}}", String(yearsV.value))
        .replace("{{months}}", String(months)),
      out: {
        pi: money(result.payment),
        piti: money(piti),
        loan: money(loanV.value),
        interest: money(result.totalInterest),
        down: money(downDollars),
        bdPi: money(result.payment),
        bdTax: money(taxV.value),
        bdIns: money(insV.value),
        bdHoa: money(hoaV.value),
      },
    };
  }, [homePrice, downPayment, dpMode, loanAmount, apr, termYears, tax, ins, hoa, config, money, results, msgs]);

  const out = computed.out;
  const err = computed.err;
  const termPresets = (config.termPresets || [15, 20, 30]).map(String);

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
          <Field
            id="home-price"
            label={fields.homePrice?.label || "Home price"}
            prefix={fields.homePrice?.prefix}
            value={homePrice}
            onChange={(v) => {
              setHomePrice(v);
              if (!loanManual) syncLoan(v, downPayment, dpMode);
            }}
            error={err.homePrice}
          />
          <Fieldset legend={fields.downPayment?.legend || "Down payment"}>
            <Segmented
              name="dp-mode"
              ariaLabel="Down payment mode"
              value={dpMode}
              onChange={(mode) => {
                const price = Number(String(homePrice).replace(/[$,%\s,]/g, ""));
                const raw = Number(String(downPayment).replace(/[$,%\s,]/g, ""));
                if (Number.isFinite(price) && price > 0 && Number.isFinite(raw)) {
                  if (mode === "dollars") setDownPayment(String(Math.round(price * (raw / 100) * 100) / 100));
                  else setDownPayment(String(Math.round((raw / price) * 10000) / 100));
                }
                setDpMode(mode);
                setLoanManual(false);
                syncLoan(homePrice, downPayment, mode);
              }}
              options={[
                { value: "percent", label: fields.downPayment?.modes?.percent || "Percent" },
                { value: "dollars", label: fields.downPayment?.modes?.dollars || "Dollars" },
              ]}
            />
            <div style={{ marginTop: "0.75rem" }}>
              <Field
                id="down-payment"
                label="Down payment value"
                prefix={dpMode === "dollars" ? "$" : undefined}
                suffix={dpMode === "percent" ? "%" : undefined}
                value={downPayment}
                onChange={(v) => {
                  setDownPayment(v);
                  setLoanManual(false);
                  syncLoan(homePrice, v, dpMode);
                }}
                error={err.down}
                hint={fields.downPayment?.hint}
              />
            </div>
          </Fieldset>
          <Field
            id="loan-amount"
            label={fields.loanAmount?.label || "Loan amount"}
            hint={fields.loanAmount?.hint}
            prefix={fields.loanAmount?.prefix}
            value={loanAmount}
            onChange={(v) => {
              setLoanManual(true);
              setLoanAmount(v);
            }}
            error={err.loan}
          />
          <Field id="apr" label={fields.apr?.label || "APR"} hint={fields.apr?.hint} suffix="%" value={apr} onChange={setApr} error={err.apr} />
          <Fieldset legend={fields.term?.legend || "Loan term"}>
            <Segmented
              name="term-preset"
              ariaLabel="Term presets"
              value={termPresets.includes(termYears) ? termYears : "custom"}
              onChange={(v) => {
                if (v !== "custom") setTermYears(v);
              }}
              options={[
                ...termPresets.map((y) => ({ value: y, label: fields.term?.presetLabels?.[y] || `${y} yr` })),
                { value: "custom", label: fields.term?.presetLabels?.custom || "Custom" },
              ]}
            />
            <div style={{ marginTop: "0.75rem", maxWidth: "10rem" }}>
              <Field id="term-years" label="Years" suffix="yr" value={termYears} onChange={setTermYears} inputMode="numeric" error={err.term} />
            </div>
          </Fieldset>
          <Fieldset legend={fields.piti?.legend || "Optional monthly costs"}>
            {fields.piti?.intro ? <p className="lc-hint">{fields.piti.intro}</p> : null}
            <div className="lc-piti-grid">
              <Field id="tax" label={fields.piti?.taxMonthly?.label || "Tax / mo"} prefix="$" value={tax} onChange={setTax} error={err.tax} />
              <Field id="ins" label={fields.piti?.insMonthly?.label || "Insurance / mo"} prefix="$" value={ins} onChange={setIns} error={err.ins} />
              <Field id="hoa" label={fields.piti?.hoaMonthly?.label || "HOA / mo"} prefix="$" value={hoa} onChange={setHoa} error={err.hoa} />
            </div>
          </Fieldset>
        </section>

        <ResultsPanel
          heading={String(results.heading || "Your estimate")}
          primaryLabel={String(results.primaryLabel || "Monthly P&I")}
          primaryValue={out?.pi || PLACEHOLDER}
          items={[
            { label: labels.piti || "Est. PITI / mo", value: out?.piti || PLACEHOLDER },
            { label: labels.loanAmount || "Loan amount", value: out?.loan || PLACEHOLDER },
            { label: labels.totalInterest || "Total interest", value: out?.interest || PLACEHOLDER },
            { label: labels.downPayment || "Down payment", value: out?.down || PLACEHOLDER },
          ]}
          summary={
            out
              ? [
                  { label: labels.breakdownPi || "P&I", value: out.bdPi },
                  { label: labels.breakdownTax || "Property tax", value: out.bdTax },
                  { label: labels.breakdownIns || "Insurance", value: out.bdIns },
                  { label: labels.breakdownHoa || "HOA", value: out.bdHoa },
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
