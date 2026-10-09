"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Request-derived hints resolved on the server (see proxy.ts) so Suspense fallbacks match the final UI. */
export type RequestHints = { initialTab: "calc" | "tech" };

const RequestHintsContext = createContext<RequestHints>({ initialTab: "calc" });

export function RequestHintsProvider({ value, children }: { value: RequestHints; children: ReactNode }) {
  return <RequestHintsContext.Provider value={value}>{children}</RequestHintsContext.Provider>;
}

export function useRequestHints() {
  return useContext(RequestHintsContext);
}
