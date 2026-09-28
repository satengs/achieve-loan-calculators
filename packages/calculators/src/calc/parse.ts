/** Parse user-entered currency/percent strings into numbers. */
export function parseNumber(value: unknown): number {
  if (value === null || value === undefined) return NaN;
  if (typeof value === "number") return value;
  const cleaned = String(value).replace(/[$,%\s,]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return NaN;
  return Number(cleaned);
}
