"use client";

import { useEffect, useMemo, useState } from "react";
import {
  amortize,
  derivedCreditLimit,
  equityRatios,
  formatPercent,
  helocDrawRepay,
  interestOnlyMonthly,
  validateRange,
} from "../calc";
import { resolveProjectName, type ProjectName } from "../brand/types";
import { CalculatorShell } from "../components/CalculatorShell";
import { CTA } from "../components/CTA";
import { Field, Fieldset, Segmented } from "../components/Field";
import { ResultsPanel } from "../components/ResultsPanel";
import { RateNote } from "../components/RateNote";
import { SelectField } from "../components/SelectField";
import { resolveRate, type MarketRates } from "../rates/types";
import { getCalculatorConfig, getCalculatorContent } from "../content/load";
import { moneyFn, PLACEHOLDER } from "./utils";

export type HelocCalculatorProps = {
  projectName?: ProjectName | string;
  /** Live market rates injected by the host. Uses `prime` (APR default = prime + band margin). */
  rates?: MarketRates;
};

export function HelocCalculator({ projectName = "achieve", rates }: HelocCalculatorProps) {
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
  const feats = (config.features || {}) as Record<string, any>;
  const margins = (feats.primeMarginByBand || {}) as Record<string, number>;
  const [creditBand, setCreditBand] = useState(String(config.defaults.creditBand ?? "good"));
  const primeLive = resolveRate(rates, "prime", Number(feats.fallbackPrime ?? 7));
  const rate = resolveRate(rates, "prime", Number(config.defaults.apr ?? 8.5), (p) => p + (margins[creditBand] ?? 0));
  const [apr, setApr] = useState(String(rate.value));
  const [drawYears, setDrawYears] = useState(String(config.defaults.drawYears ?? 5));
  const [repayYears, setRepayYears] = useState(String(config.defaults.repayYears ?? 15));
  const onBand = (b: string) => {
    setCreditBand(b);
    setApr(String(Math.round((primeLive.value + (margins[b] ?? 0)) * 100) / 100));
  };
  const [payMode, setPayMode] = useState(String(config.defaults.payMode ?? "interest-only"));
  const [termYears, setTermYears] = useState(String(config.defaults.termYears ?? 10));
  const [advancedOpen, setAdvancedOpen] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 641px)");
    const sync = () => setAdvancedOpen(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

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
    const drawYV = validateRange(drawYears, config.validation.drawYears);
    const repayV = validateRange(repayYears, config.validation.repayYears);
    const isDR = payMode === "draw-repay";

    let drawMsg = drawV.ok ? "" : drawV.message;
    if (drawV.ok && limitV.ok && drawV.value > limitV.value) {
      drawMsg = msgs.drawExceedsLimit || "Draw amount cannot exceed the credit limit.";
    }
    let mortMsg = mortV.ok ? "" : mortV.message;
    if (homeV.ok && mortV.ok && mortV.value > homeV.value) {
      mortMsg = msgs.mortgageExceedsHome || "Mortgage balance cannot exceed home value.";
    }

    const termOk = isDR ? drawYV.ok && repayV.ok : yearsV.ok;
    if (!homeV.ok || mortMsg || !maxCltvV.ok || !limitV.ok || drawMsg || !aprV.ok || !termOk) {
      return {
        err: {
          home: homeV.ok ? "" : homeV.message,
          mort: mortMsg,
          maxCltv: maxCltvV.ok ? "" : maxCltvV.message,
          limit: limitV.ok ? "" : limitV.message,
          draw: drawMsg,
          apr: aprV.ok ? "" : aprV.message,
          term: yearsV.ok ? "" : yearsV.message,
          drawYears: drawYV.ok ? "" : drawYV.message,
          repayYears: repayV.ok ? "" : repayV.message,
        } as Record<string, string>,
        message: String(results.invalidMessage || ""),
        paymentLabel: String(results.paymentLabelInterestOnly || "Estimated monthly interest"),
        out: null as null | Record<string, string>,
      };
    }

    const months = Math.round(yearsV.value * 12);
    let monthly: number;
    let modeLabel: string;
    let paymentLabel: string;
    let repayPayment = NaN;
    let totalInterest = NaN;

    if (isDR) {
      const dr = helocDrawRepay(drawV.value, aprV.value, drawYV.value, repayV.value);
      if (!dr) return { err: {} as Record<string, string>, message: String(results.unableMessage || ""), paymentLabel: "", out: null };
      monthly = dr.drawPayment;
      repayPayment = dr.repayPayment;
      totalInterest = dr.totalInterest;
      modeLabel = String(results.modeLabels?.drawRepay || "Draw then repay")
        .replace("{{draw}}", String(drawYV.value))
        .replace("{{repay}}", String(repayV.value));
      paymentLabel = String(results.paymentLabelDrawRepay || "Est. payment during draw");
    } else if (payMode === "interest-only") {
      monthly = interestOnlyMonthly(drawV.value, aprV.value);
      modeLabel = String(results.modeLabels?.interestOnly || "Interest-only on draw");
      paymentLabel = String(results.paymentLabelInterestOnly || "Estimated monthly interest");
    } else {
      const result = amortize(drawV.value, aprV.value, months);
      if (!result) return { err: {} as Record<string, string>, message: String(results.unableMessage || ""), paymentLabel: "", out: null };
      monthly = result.payment;
      totalInterest = result.totalInterest;
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

    const template = isDR
      ? String(results.summaryDrawRepay || "")
      : payMode === "interest-only"
        ? String(results.summaryInterestOnly || "")
        : String(results.summaryAmortizing || "");

    const message = template
      .replace("{{modeLabel}}", modeLabel)
      .replace("{{years}}", String(yearsV.value))
      .replace("{{months}}", String(months))
      .replace("{{limitNote}}", limitNote);

    return {
      err: { home: "", mort: "", maxCltv: "", limit: "", draw: "", apr: "", term: "", drawYears: "", repayYears: "" } as Record<string, string>,
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
        repay: Number.isFinite(repayPayment) ? money(repayPayment) : "",
        totalInterest: Number.isFinite(totalInterest) ? money(totalInterest) : "",
        power: money(Math.min(Number(feats.maxLine ?? Infinity), derived)),
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
    drawYears,
    repayYears,
    limitManual,
    feats,
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
          <Field id="draw" label={fields.drawAmount?.label || "Draw amount"} hint={fields.drawAmount?.hint} prefix="$" value={draw} onChange={setDraw} error={err.draw} />
          <SelectField
            id="credit-band"
            label={fields.creditBand?.label || "Credit score range"}
            hint={fields.creditBand?.hint}
            value={creditBand}
            onChange={onBand}
            options={Object.entries((fields.creditBand?.options || {}) as Record<string, string>).map(([value, label]) => ({ value, label }))}
          />
          <Field id="apr" label={fields.apr?.label || "APR"} hint={fields.apr?.hint} suffix="%" value={apr} onChange={setApr} error={err.apr} />
          <RateNote rate={rate} subject="HELOC APR" adjustment={`(prime + ${(margins[creditBand] ?? 0).toFixed(2)}% illustrative margin)`} />
          <details
            className="lc-advanced"
            open={advancedOpen}
            onToggle={(e) => {
              if (window.matchMedia("(min-width: 641px)").matches) {
                e.currentTarget.open = true;
                setAdvancedOpen(true);
                return;
              }
              setAdvancedOpen(e.currentTarget.open);
            }}
          >
            <summary>More options</summary>
            <div className="lc-advanced-body">
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
              <Fieldset legend={fields.payMode?.legend || "Payment style"}>
                <Segmented
                  name="pay-mode"
                  ariaLabel={fields.payMode?.ariaLabel || "Payment mode"}
                  value={payMode}
                  onChange={setPayMode}
                  options={[
                    { value: "interest-only", label: fields.payMode?.modes?.["interest-only"] || "Interest-only" },
                    { value: "amortizing", label: fields.payMode?.modes?.amortizing || "Amortizing" },
                    { value: "draw-repay", label: fields.payMode?.modes?.["draw-repay"] || "Draw, then repay" },
                  ]}
                />
                {fields.payMode?.hint ? <p className="lc-hint">{fields.payMode.hint}</p> : null}
              </Fieldset>
              {payMode === "draw-repay" ? (
                <>
                  <Field id="draw-years" label={fields.drawYears?.label || "Draw period"} hint={fields.drawYears?.hint} suffix="yr" value={drawYears} onChange={setDrawYears} inputMode="numeric" error={err.drawYears} />
                  <Field id="repay-years" label={fields.repayYears?.label || "Repayment period"} hint={fields.repayYears?.hint} suffix="yr" value={repayYears} onChange={setRepayYears} inputMode="numeric" error={err.repayYears} />
                </>
              ) : (
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
              )}
            </div>
          </details>
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
                  ...(out.repay ? [{ label: labels.repayPayment || "Payment after draw", value: out.repay }] : []),
                  ...(out.totalInterest ? [{ label: labels.totalInterest || "Total interest", value: out.totalInterest }] : []),
                  { label: labels.borrowingPower || "Max borrowing power", value: out.power },
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
