import { parseNumber } from "./parse";
import type { ValidateOptions, ValidateResult } from "./types";

export function validateRange(raw: unknown, options: ValidateOptions = {}): ValidateResult {
  const { min, max, label, allowZero } = options;
  const value = parseNumber(raw);
  if (!Number.isFinite(value)) {
    return { ok: false, value: NaN, message: `${label || "Value"} is required.` };
  }
  if (!allowZero && value === 0) {
    return { ok: false, value, message: `${label || "Value"} must be greater than zero.` };
  }
  if (value < 0) {
    return { ok: false, value, message: `${label || "Value"} cannot be negative.` };
  }
  if (min != null && value < min) {
    return { ok: false, value, message: `${label || "Value"} must be at least ${min}.` };
  }
  if (max != null && value > max) {
    return { ok: false, value, message: `${label || "Value"} must be at most ${max}.` };
  }
  return { ok: true, value, message: "" };
}
