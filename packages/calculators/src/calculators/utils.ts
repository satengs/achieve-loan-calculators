import { formatCurrency, type MoneyOpts } from "../calc/format";
import type { CalculatorConfig } from "../content/load";

export function moneyFn(config: CalculatorConfig) {
  const base: MoneyOpts = { locale: config.locale, currency: config.currency };
  return (amount: number, extra?: MoneyOpts) => formatCurrency(amount, { ...base, ...extra });
}

export const PLACEHOLDER = "—";
