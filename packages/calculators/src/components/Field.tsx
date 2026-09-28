import type { ReactNode } from "react";

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "decimal" | "numeric" | "text";
  describedBy?: string;
};

export function Field({
  id,
  label,
  hint,
  error,
  prefix,
  suffix,
  value,
  onChange,
  inputMode = "decimal",
}: FieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, errorId].filter(Boolean).join(" ");
  const classes = ["lc-input", prefix ? "has-prefix" : "", suffix ? "has-suffix" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="lc-field">
      <div className="lc-label-row">
        <label htmlFor={id}>{label}</label>
      </div>
      <div className="lc-input-wrap">
        {prefix ? (
          <span className="lc-input-prefix" aria-hidden="true">
            {prefix}
          </span>
        ) : null}
        <input
          className={classes}
          type="text"
          inputMode={inputMode}
          id={id}
          name={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
        />
        {suffix ? (
          <span className="lc-input-suffix" aria-hidden="true">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? (
        <p className="lc-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      <p className="lc-error-text" id={errorId} role="alert">
        {error || ""}
      </p>
    </div>
  );
}

type SegmentOption = { value: string; label: string };

type SegmentedProps = {
  name: string;
  ariaLabel: string;
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
};

export function Segmented({ name, ariaLabel, options, value, onChange }: SegmentedProps) {
  return (
    <div className="lc-segmented" role="group" aria-label={ariaLabel}>
      {options.map((opt) => (
        <label key={opt.value}>
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

type FieldsetProps = {
  legend: string;
  children: ReactNode;
};

export function Fieldset({ legend, children }: FieldsetProps) {
  return (
    <fieldset className="lc-field lc-fieldset">
      <legend className="lc-fieldset-legend">{legend}</legend>
      {children}
    </fieldset>
  );
}
