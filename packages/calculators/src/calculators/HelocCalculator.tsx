"use client";

import { useMemo, useState } from "react";
import {
  amortize,
  derivedCreditLimit,
  equityRatios,
  formatPercent,
  interestOnlyMonthly,
  validateRange,
} from "../calc";
import { resolveProjectName, type ProjectName } from "../brand/types";
import { CalculatorShell } from "../components/CalculatorShell";
import { CTA } from "../components/CTA";
import { Field, Fieldset, Segmented } from "../components/Field";
import { ResultsPanel } from "../components/ResultsPanel";
import { getCalculatorConfig, getCalculatorContent } from "../content/load";
import { moneyFn, PLACEHOLDER } from "./utils";

export type HelocCalculatorProps = {
  projectName?: ProjectName | string;
};

export function HelocCalculator({ projectName = "achieve" }: HelocCalculatorProps) {
  const brand = resolveProjectName(projectName);
  const content = getCalculatorContent("heloc");
  const config = getCalculatorConfig("heloc");
  const money = useMemo(() => moneyFn(config), [config]);
  const fields = content.form.fields as Record<string, any>;
  const results = content.results as Record<string, any>;
  const labels = (results.labels || {}) as Record<string, string>;
  const msgs = content.validationMessages || {};

  const [homeValue, setHomeValue] = useState(String(config.defaults.homeValue ?? 450000));
  const [mortgage, setMortgage] = useState(String(config.defaults.mortgageBalance ?? 280000));
  const [maxCltv, setMaxCltv] = useState(String(config.defaults.maxCltv ?? 85));
  const [creditLimit, setCreditLimit] = useState(String(config.defaults.creditLimit ?? 102500));
  const [limitManual, setLimitManual] = useState(false);
  const [draw, setDraw] = useState(String(config.defaults.drawAmount ?? 50000));
  const [apr, setApr] = useState(String(config.defaults.apr ?? 8.5));
  const [payMode, setPayMode] = useState(String(config.defaults.payMode ?? "interest-only"));
  const [termYears, setTermYears] = useState(String(config.defaults.termYears ?? 10));

  const syncLimit = (home: string, mort: string, cltv: string) => {
    const h = Number(String(home).replace(/[$,%\s,]/g, ""));
    const m = Number(String(mort).replace(/[$,%\s,]/g, ""));
    const c = Number(String(cltv).replace(/[$,%\s,]/g, ""));
    const limit = derivedCreditLimit(h, Number.isFinite(m) ? m : 0, c);
    if (Number.isFinite(limit) && limit >= 0) setCreditLimit(String(Math.round(limit * 100) / 100));
  };

  const termLabel =
    payMode === "interest-only"
      ? fields.term?.labelInterestOnly || "Interest-only / draw period"
      : fields.term?.labelAmortizing || "Amortization term";
  const termHint =
    payMode === "interest-only"
      ? fields.term?.hintInterestOnly
      : fields.term?.hintAmortizing;

  const computed = useMemo(() => {
    const homeV = validateRange(homeValue, config.validation.homeValue);
    const mortV = validateRange(mortgage, config.validation.mortgageBalance);
    const maxCltvV = validateRange(maxCltv, config.validation.maxCltv);
    const limitV = validateRange(creditLimit, config.validation.creditLimit);
    const drawV = validateRange(draw, config.validation.drawAmount);
    const aprV = validateRange(apr, config.validation.apr);
    const yearsV = validateRange(termYears, config.validation.termYears);

    let drawMsg = drawV.ok ? "" : drawV.message;
    if (drawV.ok && limitV.ok && drawV.value > limitV.value) {
      drawMsg = msgs.drawExceedsLimit || "Draw amount cannot exceed the credit limit.";
    }
    let mortMsg = mortV.ok ? "" : mortV.message;
    if (homeV.ok && mortV.ok && mortV.value > homeV.value) {
      mortMsg = msgs.mortgageExceedsHome || "Mortgage balance cannot exceed home value.";
    }

    if (!homeV.ok || mortMsg || !maxCltvV.ok || !limitV.ok || drawMsg || !aprV.ok || !yearsV.ok) {
      return {
        err: {
          home: homeV.ok ? "" : homeV.message,
          mort: mortMsg,
          maxCltv: maxCltvV.ok ? "" : maxCltvV.message,
          limit: limitV.ok ? "" : limitV.message,
          draw: drawMsg,
          apr: aprV.ok ? "" : aprV.message,
          term: yearsV.ok ? "" : yearsV.message,
        },
        message: String(results.invalidMessage || ""),
        paymentLabel: String(results.paymentLabelInterestOnly || "Estimated monthly interest"),
        out: null as null | Record<string, string>,
      };
    }

    const months = Math.round(yearsV.value * 12);
    let monthly: number;
    let modeLabel: string;
    let paymentLabel: string;

    if (payMode === "interest-only") {
      monthly = interestOnlyMonthly(drawV.value, aprV.value);
      modeLabel = String(results.modeLabels?.interestOnly || "Interest-only on draw");
      paymentLabel = String(results.paymentLabelInterestOnly || "Estimated monthly interest");
    } else {
      const result = amortize(drawV.value, aprV.value, months);
      if (!result) return { err: {}, message: String(results.unableMessage || ""), paymentLabel: "", out: null };
      monthly = result.payment;
      modeLabel = String(results.modeLabels?.amortizing || "Amortizing P&I ({{years}} yr)").replace(
        "{{years}}",
        String(yearsV.value),
      );
      paymentLabel = String(results.paymentLabelAmortizing || "Estimated monthly payment");
    }

    const ratios = equityRatios(homeV.value, mortV.value, drawV.value);
    const unused = Math.max(0, limitV.value - drawV.value);
    const derived = derivedCreditLimit(homeV.value, mortV.value, maxCltvV.value);
    const limitNote = limitManual
      ? String(results.limitNoteManual || "")
      : String(results.limitNoteDerived || "")
          .replace("{{maxCltv}}", formatPercent(maxCltvV.value))
          .replace("{{derivedLimit}}", money(derived));

    const template =
      payMode === "interest-only"
        ? String(results.summaryInterestOnly || "")
        : String(results.summaryAmortizing || "");

    const message = template
      .replace("{{modeLabel}}", modeLabel)
      .replace("{{years}}", String(yearsV.value))
      .replace("{{months}}", String(months))
      .replace("{{limitNote}}", limitNote);

    return {
      err: { home: "", mort: "", maxCltv: "", limit: "", draw: "", apr: "", term: "" },
      message,
      paymentLabel,
      out: {
        payment: money(monthly),
        limit: money(limitV.value),
        equity: money(ratios.remainingEquity),
        ltv: formatPercent(ratios.ltv),
        cltv: formatPercent(ratios.cltv),
        gross: money(ratios.grossEquity),
        draw: money(drawV.value),
        unused: money(unused),
        mode: modeLabel,
      },
    };
  }, [
    homeValue,
    mortgage,
    maxCltv,
    creditLimit,
    draw,
    apr,
    payMode,
    termYears,
    limitManual,
    config,
    money,
    results,
    msgs,
  ]);

  const out = computed.out;
  const err = computed.err;

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
            id="home-value"
            label={fields.homeValue?.label || "Home value"}
            prefix="$"
            value={homeValue}
            onChange={(v) => {
              setHomeValue(v);
              if (!limitManual) syncLimit(v, mortgage, maxCltv);
            }}
            error={err.home}
          />
          <Field
            id="mortgage"
            label={fields.mortgageBalance?.label || "Mortgage balance"}
            hint={fields.mortgageBalance?.hint}
            prefix="$"
            value={mortgage}
            onChange={(v) => {
              setMortgage(v);
              if (!limitManual) syncLimit(homeValue, v, maxCltv);
            }}
            error={err.mort}
          />
          <Field
            id="max-cltv"
            label={fields.maxCltv?.label || "Max CLTV"}
            hint={fields.maxCltv?.hint}
            suffix="%"
            value={maxCltv}
            onChange={(v) => {
              setMaxCltv(v);
              if (!limitManual) syncLimit(homeValue, mortgage, v);
            }}
            error={err.maxCltv}
          />
          <Field
            id="credit-limit"
            label={fields.creditLimit?.label || "Credit limit"}
            hint={fields.creditLimit?.hint}
            prefix="$"
            value={creditLimit}
            onChange={(v) => {
              setLimitManual(true);
              setCreditLimit(v);
            }}
            error={err.limit}
          />
          <Field id="draw" label={fields.drawAmount?.label || "Draw amount"} hint={fields.drawAmount?.hint} prefix="$" value={draw} onChange={setDraw} error={err.draw} />
          <Field id="apr" label={fields.apr?.label || "APR"} hint={fields.apr?.hint} suffix="%" value={apr} onChange={setApr} error={err.apr} />
          <Fieldset legend={fields.payMode?.legend || "Payment style"}>
            <Segmented
              name="pay-mode"
              ariaLabel={fields.payMode?.ariaLabel || "Payment mode"}
              value={payMode}
              onChange={setPayMode}
              options={[
                { value: "interest-only", label: fields.payMode?.modes?.["interest-only"] || "Interest-only" },
                { value: "amortizing", label: fields.payMode?.modes?.amortizing || "Amortizing" },
              ]}
            />
            {fields.payMode?.hint ? <p className="lc-hint">{fields.payMode.hint}</p> : null}
          </Fieldset>
          <Field
            id="term-years"
            label={termLabel}
            hint={termHint}
            suffix="yr"
            value={termYears}
            onChange={setTermYears}
            inputMode="numeric"
            error={err.term}
          />
        </section>

        <ResultsPanel
          heading={String(results.heading || "Your estimate")}
          primaryLabel={computed.paymentLabel}
          primaryValue={out?.payment || PLACEHOLDER}
          items={[
            { label: labels.creditLimit || "Credit limit", value: out?.limit || PLACEHOLDER },
            { label: labels.remainingEquity || "Remaining equity", value: out?.equity || PLACEHOLDER },
            { label: labels.ltv || "LTV", value: out?.ltv || PLACEHOLDER },
            { label: labels.cltv || "CLTV", value: out?.cltv || PLACEHOLDER },
          ]}
          summary={
            out
              ? [
                  { label: labels.grossEquity || "Home equity", value: out.gross },
                  { label: labels.drawAmount || "Draw amount", value: out.draw },
                  { label: labels.unusedLine || "Unused line", value: out.unused },
                  { label: labels.mode || "Mode", value: out.mode },
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
