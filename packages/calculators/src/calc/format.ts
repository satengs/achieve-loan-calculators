export type MoneyOpts = {
  locale?: string;
  currency?: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
};

export function formatCurrency(amount: number, opts: MoneyOpts = {}): string {
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat(opts.locale || "en-US", {
    style: "currency",
    currency: opts.currency || "USD",
    maximumFractionDigits: opts.maximumFractionDigits ?? 2,
    minimumFractionDigits: opts.minimumFractionDigits ?? 2,
  }).format(amount);
}

export function formatPercent(pct: number, digits = 2): string {
  if (!Number.isFinite(pct)) return "—";
  return `${pct.toFixed(digits)}%`;
}

/** Safe {{key}} interpolation — never evaluates code. */
export function interpolate(template: string, vars: Record<string, string | number | undefined>): string {
  if (template == null) return "";
  return String(template).replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const v = vars[key];
    return v == null ? "" : String(v);
  });
}
