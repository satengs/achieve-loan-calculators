"use client";

import { useMemo, useState } from "react";
import { amortize, applyOriginationFee, interpolate, toMonths, validateRange } from "../calc";
import { resolveProjectName, type ProjectName } from "../brand/types";
import { CalculatorShell } from "../components/CalculatorShell";
import { CTA } from "../components/CTA";
import { Field, Fieldset, Segmented } from "../components/Field";
import { ResultsPanel } from "../components/ResultsPanel";
import { getCalculatorConfig, getCalculatorContent } from "../content/load";
import { moneyFn, PLACEHOLDER } from "./utils";

export type PersonalLoanCalculatorProps = {
  /** Brand theme key: achieve | fdr | bills */
  projectName?: ProjectName | string;
};

type FieldKey = "loanAmount" | "apr" | "originationFee";

export function PersonalLoanCalculator({ projectName = "achieve" }: PersonalLoanCalculatorProps) {
  const brand = resolveProjectName(projectName);
  const content = getCalculatorContent("personal-loan");
  const config = getCalculatorConfig("personal-loan");
  const money = useMemo(() => moneyFn(config), [config]);
  const fields = content.form.fields as Record<string, { label?: string; hint?: string; prefix?: string; suffix?: string; legend?: string; units?: Record<string, string>; presetLabels?: Record<string, string> }>;
  const results = content.results as Record<string, unknown>;
  const labels = (results.labels || {}) as Record<string, string>;
  const amort = (content.amortization || {}) as { heading?: string; intro?: string; columns?: string[]; emptyRow?: string };

  const [loanAmount, setLoanAmount] = useState(String(config.defaults.loanAmount ?? 15000));
  const [apr, setApr] = useState(String(config.defaults.apr ?? 11.99));
  const [termValue, setTermValue] = useState(String(config.defaults.termValue ?? 36));
  const [termUnit, setTermUnit] = useState(String(config.defaults.termUnit ?? "months"));
  const [fee, setFee] = useState(String(config.defaults.originationFeePercent ?? 0));
  const [errors, setErrors] = useState<Partial<Record<FieldKey | "term", string>>>({});

  const computed = useMemo(() => {
    const amountV = validateRange(loanAmount, config.validation.loanAmount);
    const aprV = validateRange(apr, config.validation.apr);
    const feeV = validateRange(fee, config.validation.originationFeePercent);
    const months = toMonths(Number(termValue), termUnit === "years" ? "years" : "months");
    const termRule = config.validation.termMonths || { min: 1, max: 480 };
    const msgs = content.validationMessages || {};
    let termMsg = "";
    if (!Number.isFinite(months) || months < (termRule.min ?? 1)) termMsg = msgs.termMin || "Term must be at least 1 month.";
    else if (months > (termRule.max ?? 480)) termMsg = msgs.termMax || "Term must be at most 480 months.";

    const nextErrors: typeof errors = {
      loanAmount: amountV.ok ? "" : amountV.message,
      apr: aprV.ok ? "" : aprV.message,
      originationFee: feeV.ok ? "" : feeV.message,
      term: termMsg,
    };

    if (!amountV.ok || !aprV.ok || !feeV.ok || termMsg) {
      return {
        errors: nextErrors,
        invalid: true,
        message: String(results.invalidMessage || ""),
        out: null as null | Record<string, string>,
        schedule: [] as Array<{ month: number; payment: number; principal: number; interest: number; balance: number }>,
      };
    }

    const feeMode = ((config.features?.originationFeeMode as string) || "financed") as "financed" | "upfront";
    const feeInfo = applyOriginationFee(amountV.value, feeV.value, feeMode);
    const result = amortize(feeInfo.financedPrincipal, aprV.value, months);
    if (!result) {
      return { errors: nextErrors, invalid: true, message: String(results.unableMessage || ""), out: null, schedule: [] };
    }

    const feeNote =
      feeInfo.feeAmount > 0
        ? interpolate(String(results.feeNoteWithFee || ""), { feeAmount: money(feeInfo.feeAmount) })
        : String(results.feeNoteNoFee || "");

    return {
      errors: nextErrors,
      invalid: false,
      message: interpolate(String(results.summaryTemplate || ""), { months, feeNote }),
      out: {
        monthly: money(result.payment),
        interest: money(result.totalInterest),
        total: money(result.totalPaid),
        financed: money(feeInfo.financedPrincipal),
        cash: money(feeInfo.cashReceived),
        first: result.firstPayment
          ? `${money(result.firstPayment.principal)} / ${money(result.firstPayment.interest)}`
          : PLACEHOLDER,
        last: result.lastPayment
          ? `${money(result.lastPayment.principal)} / ${money(result.lastPayment.interest)}`
          : PLACEHOLDER,
        feeAmt: money(feeInfo.feeAmount),
      },
      schedule: result.schedule,
    };
  }, [loanAmount, apr, termValue, termUnit, fee, config, content, money, results]);

  // sync errors for a11y without setState in render
  if (
    computed.errors.loanAmount !== errors.loanAmount ||
    computed.errors.apr !== errors.apr ||
    computed.errors.originationFee !== errors.originationFee ||
    computed.errors.term !== errors.term
  ) {
    // defer via microtask-safe pattern: use derived errors directly below
  }
  const err = computed.errors;
  const out = computed.out;
  const showAmort = config.features?.showAmortization !== false;
  const showFee = config.features?.showOriginationFee !== false;
  const presets = (config.termPresets || [24, 36, 48, 60]).map(String);

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
        <section className="lc-card lc-form" aria-labelledby="pl-inputs">
          <h2 id="pl-inputs">{content.form.heading}</h2>
          <Field
            id="loan-amount"
            label={fields.loanAmount?.label || "Loan amount"}
            hint={fields.loanAmount?.hint}
            prefix={fields.loanAmount?.prefix}
            value={loanAmount}
            onChange={setLoanAmount}
            error={err.loanAmount}
          />
          <Field
            id="apr"
            label={fields.apr?.label || "APR"}
            hint={fields.apr?.hint}
            suffix={fields.apr?.suffix}
            value={apr}
            onChange={setApr}
            error={err.apr}
          />
          <Fieldset legend={fields.term?.legend || "Term"}>
            <Segmented
              name="term-unit"
              ariaLabel="Term unit"
              value={termUnit}
              onChange={setTermUnit}
              options={[
                { value: "months", label: fields.term?.units?.months || "Months" },
                { value: "years", label: fields.term?.units?.years || "Years" },
              ]}
            />
            <div className="lc-term-row">
              <Field
                id="term-value"
                label="Term value"
                value={termValue}
                onChange={(v) => {
                  setTermValue(v);
                }}
                inputMode="numeric"
                error={err.term}
              />
              <Segmented
                name="term-preset"
                ariaLabel="Common terms"
                value={termUnit === "months" && presets.includes(termValue) ? termValue : ""}
                onChange={(v) => {
                  setTermUnit("months");
                  setTermValue(v);
                }}
                options={presets.map((p) => ({
                  value: p,
                  label: fields.term?.presetLabels?.[p] || `${p} mo`,
                }))}
              />
            </div>
            {fields.term?.hint ? <p className="lc-hint">{fields.term.hint}</p> : null}
          </Fieldset>
          {showFee ? (
            <Field
              id="origination-fee"
              label={fields.originationFee?.label || "Origination fee"}
              hint={fields.originationFee?.hint}
              suffix={fields.originationFee?.suffix}
              value={fee}
              onChange={setFee}
              error={err.originationFee}
            />
          ) : null}
        </section>

        <ResultsPanel
          heading={String(results.heading || "Your estimate")}
          primaryLabel={String(results.monthlyLabel || "Estimated monthly payment")}
          primaryValue={out?.monthly || PLACEHOLDER}
          items={[
            { label: labels.totalInterest || "Total interest", value: out?.interest || PLACEHOLDER },
            { label: labels.totalCost || "Total cost", value: out?.total || PLACEHOLDER },
            { label: labels.financedPrincipal || "Financed principal", value: out?.financed || PLACEHOLDER },
            { label: labels.cashReceived || "Cash received", value: out?.cash || PLACEHOLDER },
          ]}
          summary={
            out
              ? [
                  { label: labels.firstPayment || "First payment (P / I)", value: out.first },
                  { label: labels.lastPayment || "Last payment (P / I)", value: out.last },
                  { label: labels.originationFeeAmount || "Origination fee amount", value: out.feeAmt },
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

      {showAmort ? (
        <div className="lc-card lc-amort-card">
          <h2>{amort.heading || "Amortization snapshot"}</h2>
          {amort.intro ? <p className="lc-hint">{amort.intro}</p> : null}
          <div className="lc-table-wrap lc-amort-desktop">
            <table className="lc-table">
              <thead>
                <tr>
                  {(amort.columns || ["Month", "Payment", "Principal", "Interest", "Balance"]).map((c) => (
                    <th key={c} scope="col">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!out || computed.schedule.length === 0 ? (
                  <tr>
                    <td colSpan={5}>{amort.emptyRow || "Enter valid inputs to see schedule."}</td>
                  </tr>
                ) : (
                  <>
                    {computed.schedule.slice(0, 3).map((row) => (
                      <tr key={row.month}>
                        <td>{row.month}</td>
                        <td>{money(row.payment)}</td>
                        <td>{money(row.principal)}</td>
                        <td>{money(row.interest)}</td>
                        <td>{money(row.balance)}</td>
                      </tr>
                    ))}
                    {computed.schedule.length > 4 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", color: "var(--lc-text-muted)" }}>
                          …
                        </td>
                      </tr>
                    ) : null}
                    {computed.schedule.length > 3 ? (
                      <tr key="last">
                        <td>{computed.schedule[computed.schedule.length - 1].month}</td>
                        <td>{money(computed.schedule[computed.schedule.length - 1].payment)}</td>
                        <td>{money(computed.schedule[computed.schedule.length - 1].principal)}</td>
                        <td>{money(computed.schedule[computed.schedule.length - 1].interest)}</td>
                        <td>{money(computed.schedule[computed.schedule.length - 1].balance)}</td>
                      </tr>
                    ) : null}
                  </>
                )}
              </tbody>
            </table>
          </div>
          <ul className="lc-amort-stack" aria-label="Amortization snapshot">
            {!out || computed.schedule.length === 0 ? (
              <li className="lc-amort-stack-item">
                <strong>{amort.emptyRow || "Enter valid inputs to see schedule."}</strong>
              </li>
            ) : (
              <>
                {computed.schedule.slice(0, 3).map((row) => (
                  <li className="lc-amort-stack-item" key={row.month}>
                    <strong>Month {row.month}</strong>
                    <dl>
                      <dt>Payment</dt>
                      <dd>{money(row.payment)}</dd>
                      <dt>Principal</dt>
                      <dd>{money(row.principal)}</dd>
                      <dt>Interest</dt>
                      <dd>{money(row.interest)}</dd>
                      <dt>Balance</dt>
                      <dd>{money(row.balance)}</dd>
                    </dl>
                  </li>
                ))}
                {computed.schedule.length > 4 ? (
                  <li className="lc-amort-stack-item" aria-hidden="true" style={{ textAlign: "center", color: "var(--lc-text-muted)" }}>
                    …
                  </li>
                ) : null}
                {computed.schedule.length > 3 ? (
                  <li className="lc-amort-stack-item" key="last">
                    <strong>Month {computed.schedule[computed.schedule.length - 1].month}</strong>
                    <dl>
                      <dt>Payment</dt>
                      <dd>{money(computed.schedule[computed.schedule.length - 1].payment)}</dd>
                      <dt>Principal</dt>
                      <dd>{money(computed.schedule[computed.schedule.length - 1].principal)}</dd>
                      <dt>Interest</dt>
                      <dd>{money(computed.schedule[computed.schedule.length - 1].interest)}</dd>
                      <dt>Balance</dt>
                      <dd>{money(computed.schedule[computed.schedule.length - 1].balance)}</dd>
                    </dl>
                  </li>
                ) : null}
              </>
            )}
          </ul>
        </div>
      ) : null}
    </CalculatorShell>
  );
}
