type SliderFieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  max: number;
  step: number;
  /** Formatted current value shown next to the label (e.g. "$20,000"). */
  display: string;
  prefix?: string;
};

/** Range slider paired with an exact-entry text input (both editable, kept in sync). */
export function SliderField({ id, label, hint, error, value, onChange, min, max, step, display, prefix }: SliderFieldProps) {
  const numeric = Number(String(value).replace(/[$,%\s,]/g, ""));
  const sliderValue = Number.isFinite(numeric) ? Math.min(max, Math.max(min, numeric)) : min;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  return (
    <div className="lc-field lc-slider-field">
      <div className="lc-label-row">
        <label htmlFor={id}>{label}</label>
        <span className="lc-slider-value" aria-hidden="true">
          {display}
        </span>
      </div>
      <input
        className="lc-range"
        type="range"
        id={`${id}-range`}
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={sliderValue}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="lc-input-wrap">
        {prefix ? (
          <span className="lc-input-prefix" aria-hidden="true">
            {prefix}
          </span>
        ) : null}
        <input
          className={prefix ? "lc-input has-prefix" : "lc-input"}
          type="text"
          inputMode="decimal"
          id={id}
          name={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          aria-invalid={error ? "true" : "false"}
          aria-describedby={[hint ? hintId : null, errorId].filter(Boolean).join(" ")}
        />
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
