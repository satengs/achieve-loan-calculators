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
  /** Formatted current value shown next to the label (e.g. "$20,000"). Hidden in compact row layout when the input shows the value. */
  display?: string;
  prefix?: string;
  suffix?: string;
  /**
   * `stack` (default legacy): label+display, range, then full-width input.
   * `row`: label on top; range + compact input on one row (presentation layout).
   */
  layout?: "stack" | "row";
};

/** Range slider paired with an exact-entry text input (both editable, kept in sync). */
export function SliderField({
  id,
  label,
  hint,
  error,
  value,
  onChange,
  min,
  max,
  step,
  display,
  prefix,
  suffix,
  layout = "stack",
}: SliderFieldProps) {
  const numeric = Number(String(value).replace(/[$,%\s,]/g, ""));
  const sliderValue = Number.isFinite(numeric) ? Math.min(max, Math.max(min, numeric)) : min;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;
  const inputClass = ["lc-input", prefix ? "has-prefix" : "", suffix ? "has-suffix" : ""].filter(Boolean).join(" ");

  const input = (
    <div className={layout === "row" ? "lc-input-wrap lc-slider-input" : "lc-input-wrap"}>
      {prefix ? (
        <span className="lc-input-prefix" aria-hidden="true">
          {prefix}
        </span>
      ) : null}
      <input
        className={inputClass}
        type="text"
        inputMode="decimal"
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
  );

  return (
    <div className={layout === "row" ? "lc-field lc-slider-field lc-slider-field--row" : "lc-field lc-slider-field"}>
      <div className="lc-label-row">
        <label htmlFor={id}>{label}</label>
        {layout === "stack" && display ? (
          <span className="lc-slider-value" aria-hidden="true">
            {display}
          </span>
        ) : null}
      </div>
      {layout === "row" ? (
        <div className="lc-slider-row">
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
          {input}
        </div>
      ) : (
        <>
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
          {input}
        </>
      )}
      {hint ? (
        <p className="lc-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="lc-error-text" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
