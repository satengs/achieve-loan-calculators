type SelectFieldProps = {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
};

/** Native select styled like lc-input (accessible, keyboard-friendly). */
export function SelectField({ id, label, hint, value, onChange, options }: SelectFieldProps) {
  const hintId = `${id}-hint`;
  return (
    <div className="lc-field">
      <div className="lc-label-row">
        <label htmlFor={id}>{label}</label>
      </div>
      <div className="lc-input-wrap">
        <select
          id={id}
          name={id}
          className="lc-input lc-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={hint ? hintId : undefined}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {hint ? (
        <p className="lc-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
