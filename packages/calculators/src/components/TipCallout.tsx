import type { ReactNode } from "react";

/** Soft tip/callout box under presentation results (text only). */
export function TipCallout({ children }: { children: ReactNode }) {
  if (children == null || children === "") return null;
  return <aside className="lc-tip-callout">{children}</aside>;
}
