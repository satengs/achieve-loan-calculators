import type { FeeMode, FeeResult } from "./types";

export function applyOriginationFee(
  principal: number,
  feePct: number,
  mode: FeeMode = "financed",
): FeeResult {
  if (!Number.isFinite(principal) || !Number.isFinite(feePct) || principal < 0 || feePct < 0) {
    return { financedPrincipal: NaN, feeAmount: NaN, cashReceived: NaN, mode };
  }
  const feeAmount = Math.max(0, principal * (feePct / 100));
  if (mode === "upfront") {
    return {
      financedPrincipal: principal,
      feeAmount,
      cashReceived: principal - feeAmount,
      mode: "upfront",
    };
  }
  return {
    financedPrincipal: principal + feeAmount,
    feeAmount,
    cashReceived: principal,
    mode: "financed",
  };
}
