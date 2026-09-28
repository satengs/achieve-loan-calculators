export function downPaymentAndLoan(
  homePrice: number,
  downRaw: number,
  mode: "percent" | "dollars",
): { downDollars: number; loanAmount: number } {
  if (!Number.isFinite(homePrice) || !Number.isFinite(downRaw) || homePrice < 0 || downRaw < 0) {
    return { downDollars: NaN, loanAmount: NaN };
  }
  let downDollars: number;
  if (mode === "percent") {
    if (downRaw > 100) return { downDollars: NaN, loanAmount: NaN };
    downDollars = homePrice * (downRaw / 100);
  } else {
    downDollars = downRaw;
  }
  return { downDollars, loanAmount: homePrice - downDollars };
}

export function derivedCreditLimit(
  homeValue: number,
  mortgageBalance: number,
  maxCltvPct: number,
): number {
  if (!Number.isFinite(homeValue) || !Number.isFinite(mortgageBalance) || !Number.isFinite(maxCltvPct)) {
    return NaN;
  }
  if (homeValue < 0 || mortgageBalance < 0 || maxCltvPct < 0) return NaN;
  return Math.max(0, homeValue * (maxCltvPct / 100) - mortgageBalance);
}

export function equityRatios(
  homeValue: number,
  mortgageBalance: number,
  drawAmount: number,
): {
  ltv: number;
  cltv: number;
  grossEquity: number;
  remainingEquity: number;
} {
  if (!Number.isFinite(homeValue) || homeValue <= 0) {
    return { ltv: NaN, cltv: NaN, grossEquity: NaN, remainingEquity: NaN };
  }
  const mort = Number.isFinite(mortgageBalance) ? mortgageBalance : 0;
  const draw = Number.isFinite(drawAmount) ? drawAmount : 0;
  return {
    ltv: (mort / homeValue) * 100,
    cltv: ((mort + draw) / homeValue) * 100,
    grossEquity: homeValue - mort,
    remainingEquity: homeValue - mort - draw,
  };
}
