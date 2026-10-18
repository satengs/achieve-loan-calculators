/**
 * Pure helpers for FRED observations (no I/O), shared by hosts that fetch FRED data.
 * Kept in core so they are unit-tested alongside the calculators.
 */
export type FredObservation = { date: string; value: number };

/**
 * Parse FRED CSV ("observation_date,SERIES\n2026-09-01,336.298").
 * Rows with a blank or "." value (FRED's missing-value markers, e.g. the 2025-10 CPI gap)
 * are skipped, so the result is NOT guaranteed to have one row per period.
 */
export function parseFredCsv(text: string): FredObservation[] {
  const out: FredObservation[] = [];
  for (const line of text.trim().split(/\r?\n/).slice(1)) {
    const [date, raw] = line.split(",");
    const trimmed = raw?.trim();
    if (!date || !trimmed || trimmed === ".") continue;
    const value = Number(trimmed);
    if (/^\d{4}-\d{2}-\d{2}$/.test(date.trim()) && Number.isFinite(value)) out.push({ date: date.trim(), value });
  }
  return out;
}

/** "2026-09-01" → "2025-09-01" (same month/day, one year earlier). */
export function sameDayPriorYear(isoDate: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) return null;
  return `${String(Number(m[1]) - 1).padStart(4, "0")}-${m[2]}-${m[3]}`;
}

/**
 * Year-over-year % change of the latest observation vs the observation dated exactly
 * 12 months earlier (matched by date, not by row offset, so gap rows can't stretch the span).
 * Returns null when the prior-year observation is missing or non-positive; callers then
 * fall back to their configured default. Rounded to 2 decimals.
 */
export function yoyFromObservations(
  obs: FredObservation[],
): { value: number; asOf: string; priorDate: string } | null {
  if (obs.length === 0) return null;
  const sorted = [...obs].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const last = sorted[sorted.length - 1];
  const priorDate = sameDayPriorYear(last.date);
  if (!priorDate) return null;
  const prior = sorted.find((o) => o.date === priorDate);
  if (!prior || !(prior.value > 0) || !Number.isFinite(last.value)) return null;
  return { value: Math.round((last.value / prior.value - 1) * 10000) / 100, asOf: last.date, priorDate };
}
