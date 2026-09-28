export type AmortRow = {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
};

export type AmortResult = {
  payment: number;
  schedule: AmortRow[];
  totalInterest: number;
  totalPaid: number;
  firstPayment: AmortRow | null;
  lastPayment: AmortRow | null;
};

export type FeeMode = "financed" | "upfront";

export type FeeResult = {
  financedPrincipal: number;
  feeAmount: number;
  cashReceived: number;
  mode: FeeMode;
};

export type ValidateOptions = {
  min?: number;
  max?: number;
  label?: string;
  allowZero?: boolean;
};

export type ValidateResult = {
  ok: boolean;
  value: number;
  message: string;
};
