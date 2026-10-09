"use client";

import { useCallback, useMemo, useState } from "react";
import { validateRange } from "../calc";
import type { CalculatorConfig } from "../content/load";
import { Field } from "../components/Field";

export type FieldCopy = { label?: string; hint?: string; prefix?: string; suffix?: string };

/**
 * Shared numeric-input state: string state per key, validated against
 * config.validation[key]. `initial` overrides config defaults (e.g. live rates).
 */
export function useNumberInputs(
  config: CalculatorConfig,
  keys: readonly string[],
  initial: Record<string, number | undefined> = {},
) {
  const [state, setState] = useState<Record<string, string>>(() =>
    Object.fromEntries(keys.map((k) => [k, String(initial[k] ?? config.defaults[k] ?? "")])),
  );
  const set = useCallback((k: string, v: string) => setState((s) => ({ ...s, [k]: v })), []);
  const parsed = useMemo(() => {
    const values: Record<string, number> = {};
    const errors: Record<string, string> = {};
    let ok = true;
    for (const k of keys) {
      const v = validateRange(state[k], config.validation[k] || {});
      values[k] = v.value;
      errors[k] = v.ok ? "" : v.message;
      if (!v.ok) ok = false;
    }
    return { values, errors, ok };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, config]);
  return { state, set, ...parsed };
}

type NumberFieldsProps = {
  idPrefix: string;
  keys: readonly string[];
  fields: Record<string, FieldCopy | undefined>;
  inputs: ReturnType<typeof useNumberInputs>;
  errors?: Record<string, string>;
};

/** Render a list of numeric Fields from content copy + shared state. */
export function NumberFields({ idPrefix, keys, fields, inputs, errors }: NumberFieldsProps) {
  return (
    <>
      {keys.map((k) => {
        const f = fields[k] || {};
        return (
          <Field
            key={k}
            id={`${idPrefix}-${k}`}
            label={f.label || k}
            hint={f.hint}
            prefix={f.prefix}
            suffix={f.suffix}
            value={inputs.state[k] ?? ""}
            onChange={(v) => inputs.set(k, v)}
            inputMode={f.suffix === "yr" || f.suffix === "mo" ? "numeric" : "decimal"}
            error={(errors ?? inputs.errors)[k]}
          />
        );
      })}
    </>
  );
}
